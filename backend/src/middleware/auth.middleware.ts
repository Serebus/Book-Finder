import { Request, Response, NextFunction } from "express";
import { AuthService, SafeUser } from "../services/auth.service.js";
import { SessionRow } from "../types/database.types.js";

// Augment Express Request interface to include user and session
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
      session?: SessionRow;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Authorization token is missing or malformed.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const result = await AuthService.validateSession(token);

    if (!result) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or expired session token.",
      });
      return;
    }

    req.user = result.user;
    req.session = result.session;
    next();
  } catch (error: any) {
    res.status(500).json({
      error: "InternalServerError",
      message: error.message || "Failed to validate session.",
    });
  }
}
