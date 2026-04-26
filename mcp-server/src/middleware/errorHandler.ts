import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = error instanceof Error ? error.message : "Internal server error";
  const statusCode =
    error instanceof Error && "statusCode" in error && typeof error.statusCode === "number"
      ? error.statusCode
      : 500;

  res.status(statusCode).json({
    error: message,
  });
}
