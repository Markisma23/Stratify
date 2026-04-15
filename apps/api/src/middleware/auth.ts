import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import { can, type Permission } from "../authz/policyEngine.js";
import { env } from "../config/env.js";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Missing bearer token" });
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = typeof payload === "string" ? { sub: payload } : payload;
    return next();
  } catch {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid token" });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: "Forbidden" });
    }
    return next();
  };
};

export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!can(req.user?.role, permission)) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: `Missing permission: ${permission}` });
    }
    return next();
  };
};
