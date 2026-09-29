import jwt from "jsonwebtoken";
import { AppError } from "../middlewares/AppError.js";
import { User, type UserDocument } from "../models/User.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validators.js";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResult = {
  user: AuthUser;
  token: string;
};

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return secret;
};

const getJwtExpiresIn = (): string => {
  return process.env.JWT_EXPIRES_IN || "7d";
};

const toAuthUser = (user: UserDocument): AuthUser => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
});

export const signAuthToken = (userId: string): string => {
  return jwt.sign({ sub: userId }, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  } as jwt.SignOptions);
};

export const verifyAuthToken = (token: string): string => {
  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (typeof payload === "string" || typeof payload.sub !== "string") {
      throw new AppError("Invalid or expired token", 401);
    }

    return payload.sub;
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
};

export const registerUser = async (
  input: RegisterInput,
): Promise<AuthResult> => {
  const existingUser = await User.findOne({ email: input.email.toLowerCase() });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
  });

  const token = signAuthToken(String(user._id));

  return {
    user: toAuthUser(user),
    token,
  };
};

export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const user = await User.findOne({
    email: input.email.toLowerCase(),
  }).select("+password");

  if (!user) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
  }

  const isPasswordValid = await user.comparePassword(input.password);

  if (!isPasswordValid) {
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
  }

  const token = signAuthToken(String(user._id));

  return {
    user: toAuthUser(user),
    token,
  };
};

export const getUserById = async (userId: string): Promise<AuthUser> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return toAuthUser(user);
};
