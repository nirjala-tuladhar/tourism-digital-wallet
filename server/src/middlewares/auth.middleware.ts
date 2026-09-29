import type { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError.js";
import { verifyAuthToken } from "../services/auth.service.js";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const userId = verifyAuthToken(token);
    req.user = { id: userId };

    next();
  } catch (error) {
    next(error);
  }
};
