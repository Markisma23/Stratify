import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { appendAuditLog } from "../db/repositories/auditRepo.js";
import { createSession, revokeSession } from "../db/repositories/sessionsRepo.js";
import { createUser, enableMfa, findUserByEmail, setupMfa } from "../db/repositories/usersRepo.js";
import { validateSamlResponse } from "../identity/samlTrust.js";
import { verifyOidcIdToken } from "../identity/oidc.js";
import { authenticate } from "../middleware/auth.js";
import { verifyTotp } from "../security/totp.js";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  mfaToken: z.string().length(6).optional()
});

const SsoSchema = z.object({
  idToken: z.string().min(20)
});

const SamlSchema = z.object({
  SAMLResponse: z.string().min(50)
});


export const authRouter = Router();

const issueToken = (user: { id: string; email: string; role: string; account_type: string }, sessionId: string) =>
  jwt.sign({ sub: user.id, email: user.email, role: user.role, accountType: user.account_type, sid: sessionId }, env.JWT_SECRET, {
    expiresIn: "8h"
  });

authRouter.post("/register/personal", async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string().min(8) }).parse(req.body);
  const existing = await findUserByEmail(body.email);
  if (existing) return res.status(409).json({ message: "User already exists" });
  const user = await createUser(body.email, "analyst", "personal");
  await appendAuditLog(user.email, "auth.register.personal", user.id, {});
  res.status(201).json({ id: user.id, email: user.email, accountType: user.account_type });
});

authRouter.post("/login", async (req, res) => {
  const body = LoginSchema.parse(req.body);
  const role = body.email.includes("admin") ? "admin" : "analyst";
  const existingUser = await findUserByEmail(body.email);
  const user = existingUser ?? (await createUser(body.email, role, "organization"));

  if (user.mfa_enabled) {
    if (!body.mfaToken || !user.mfa_secret || !verifyTotp(user.mfa_secret, body.mfaToken)) {
      return res.status(401).json({ message: "MFA token required or invalid" });
    }
  }

  const sessionId = await createSession(user.id, req.get("user-agent") ?? "unknown", req.ip);
  const token = issueToken(user, sessionId);
  await appendAuditLog(user.email, "auth.login", user.id, { sessionId });
  res.json({ token, role: user.role, accountType: user.account_type, expiresIn: "8h" });
});

authRouter.post("/oidc/callback", async (req, res) => {
  const body = SsoSchema.parse(req.body);
  const claims = await verifyOidcIdToken(env.OIDC_ISSUER, env.OIDC_AUDIENCE, env.OIDC_JWKS_URI, body.idToken);
  const email = claims.email;
  if (!email) return res.status(400).json({ message: "OIDC token missing email" });

  const existing = await findUserByEmail(email);
  const user = existing ?? (await createUser(email, "analyst", "organization"));
  const sessionId = await createSession(user.id, req.get("user-agent") ?? "unknown", req.ip);
  const token = issueToken(user, sessionId);
  await appendAuditLog(user.email, "auth.oidc", user.id, { sessionId, sub: claims.sub });
  res.json({ token, provider: "oidc", role: user.role, accountType: user.account_type });
});

authRouter.post("/saml/callback", async (req, res) => {
  const payload = SamlSchema.parse(req.body);
  const assertion = await validateSamlResponse(payload.SAMLResponse);

  const existing = await findUserByEmail(assertion.email);
  const user = existing ?? (await createUser(assertion.email, "analyst", "organization"));
  const sessionId = await createSession(user.id, req.get("user-agent") ?? "unknown", req.ip);
  const token = issueToken(user, sessionId);
  await appendAuditLog(user.email, "auth.saml", user.id, { sessionId, nameId: assertion.nameId, issuer: assertion.issuer });
  res.json({ token, provider: "saml", role: user.role, accountType: user.account_type });
});

authRouter.post("/logout", authenticate, async (req, res) => {
  const sid = String(req.user?.sid ?? "");
  if (sid) await revokeSession(sid);
  await appendAuditLog(req.user?.email ?? "unknown@local", "auth.logout", String(req.user?.sub ?? "unknown"), { sid });
  res.json({ loggedOut: true });
});

authRouter.post("/mfa/setup", authenticate, async (req, res) => {
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: "Unauthorized" });
  const secret = await setupMfa(email);
  res.json({ secret, otpauthUri: `otpauth://totp/Stratify:${email}?secret=${secret}&issuer=Stratify` });
});

authRouter.post("/mfa/verify", authenticate, async (req, res) => {
  const token = z.object({ token: z.string().length(6) }).parse(req.body).token;
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: "Unauthorized" });

  const user = await findUserByEmail(email);
  if (!user?.mfa_secret || !verifyTotp(user.mfa_secret, token)) {
    return res.status(400).json({ message: "Invalid token" });
  }

  await enableMfa(email);
  await appendAuditLog(email, "auth.mfa.enabled", user.id, {});
  res.json({ enabled: true });
});
