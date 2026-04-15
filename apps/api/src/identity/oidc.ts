import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export type OidcClaims = JWTPayload & { email?: string; name?: string; sub: string };

export const verifyOidcIdToken = async (issuer: string, audience: string, jwksUri: string, token: string): Promise<OidcClaims> => {
  const JWKS = createRemoteJWKSet(new URL(jwksUri));
  const { payload } = await jwtVerify(token, JWKS, { issuer, audience });
  return payload as OidcClaims;
};
