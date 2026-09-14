import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error("[Error Handler]:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected error occurred.";

  res.status(statusCode).json({
    error: err.name || "ServerError",
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}
