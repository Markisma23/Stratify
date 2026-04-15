import { config } from "dotenv";
import { z } from "zod";

config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  JWT_SECRET: z.string().min(16).default("replace-me-in-production"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/stratify"),
  DB_SSL: z.coerce.boolean().default(false),
  OIDC_ISSUER: z.string().url().default("https://issuer.example.com"),
  OIDC_AUDIENCE: z.string().default("stratify-api"),
  OIDC_JWKS_URI: z.string().url().default("https://issuer.example.com/.well-known/jwks.json"),
  SAML_ISSUER: z.string().default("stratify-idp"),
  SAML_AUDIENCE: z.string().default("stratify-sp"),
  SAML_METADATA_URL: z.string().url().default("https://issuer.example.com/metadata"),
  SAML_METADATA_TTL_MS: z.coerce.number().default(3600000),
  SAML_CLOCK_SKEW_MS: z.coerce.number().default(120000),
  ML_SERVICE_URL: z.string().url().default("http://localhost:9000"),
  ML_SERVICE_TOKEN: z.string().default("dev-token"),
  SESSION_MAX_CONCURRENT: z.coerce.number().default(3)
});

export const env = EnvSchema.parse(process.env);
