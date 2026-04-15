import type { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { role?: string; email?: string; sid?: string; accountType?: string };
      requestId?: string;
    }
  }
}

export {};
