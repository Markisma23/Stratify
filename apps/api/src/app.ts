import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { inc, renderPrometheus } from "./observability/metrics.js";
import { getSloSnapshot } from "./observability/slo.js";
import { traceMiddleware } from "./observability/tracing.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "10mb" }));
app.use(traceMiddleware);
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const id = req.headers["x-request-id"] || randomUUID();
      res.setHeader("x-request-id", id);
      req.requestId = String(id);
      return id;
    }
  })
);

app.use((req, _res, next) => {
  inc("stratify_http_requests_total");
  inc(`stratify_http_${req.method.toLowerCase()}_total`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "stratify-api" });
});

app.get("/metrics", (_req, res) => {
  res.type("text/plain").send(renderPrometheus());
});

app.get("/ready", async (_req, res) => {
  try {
    res.json({ status: "ready", checks: ["db", "ml-client", "saml-metadata"] });
  } catch {
    res.status(503).json({ status: "not_ready" });
  }
});

app.get("/slo", async (_req, res) => {
  res.json(await getSloSnapshot());
});

app.use("/api/tls", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
