import { SAML } from "@node-saml/node-saml";
import { env } from "../config/env.js";

type MetadataCache = {
  certs: string[];
  refreshedAt: number;
};

let metadataCache: MetadataCache = { certs: [], refreshedAt: 0 };

const refreshMetadata = async () => {
  const response = await fetch(env.SAML_METADATA_URL);
  if (!response.ok) throw new Error(`Failed metadata fetch: ${response.status}`);
  const xml = await response.text();

  const certMatches = Array.from(xml.matchAll(/<X509Certificate>([\s\S]*?)<\/X509Certificate>/g));
  metadataCache = {
    certs: certMatches.map((m) => m[1].replace(/\s+/g, "")).filter(Boolean),
    refreshedAt: Date.now()
  };

  if (!metadataCache.certs.length) {
    throw new Error("No signing certificates found in SAML metadata");
  }
};

const getCerts = async () => {
  const stale = Date.now() - metadataCache.refreshedAt > env.SAML_METADATA_TTL_MS;
  if (stale || metadataCache.certs.length === 0) {
    await refreshMetadata();
  }
  return metadataCache.certs;
};

export const validateSamlResponse = async (base64Response: string) => {
  const certs = await getCerts();

  const saml = new SAML({
    audience: env.SAML_AUDIENCE,
    issuer: env.SAML_ISSUER,
    idpCert: certs,
    acceptedClockSkewMs: env.SAML_CLOCK_SKEW_MS,
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: true,
    validateInResponseTo: "never"
  });

  const result = await saml.validatePostResponseAsync({ SAMLResponse: base64Response });
  const profile = result.profile;

  if (!profile || !profile.email) {
    throw new Error("SAML profile missing required email claim");
  }

  return {
    nameId: profile.nameID ?? profile.nameIDFormat ?? "unknown",
    email: String(profile.email),
    issuer: env.SAML_ISSUER,
    audience: env.SAML_AUDIENCE
  };
};
