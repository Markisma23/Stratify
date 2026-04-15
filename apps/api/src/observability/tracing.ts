import { randomBytes } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const hex = (size: number) => randomBytes(size).toString("hex");

export const traceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const incoming = req.header("traceparent");
  const traceId = incoming?.split("-")[1] ?? hex(16);
  const spanId = hex(8);
  res.setHeader("traceparent", `00-${traceId}-${spanId}-01`);
  next();
};
