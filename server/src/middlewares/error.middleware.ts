import type { ErrorRequestHandler } from "express";
import { AppError } from "./AppError.js";

export const errorMiddleware: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  console.error(err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });

    return;
  }

  if (
    err instanceof SyntaxError &&
    "status" in err &&
    (err as { status?: number }).status === 400
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });

    return;
  }

  if (err instanceof SyntaxError && err.message.includes("JSON")) {
    res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });

    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
