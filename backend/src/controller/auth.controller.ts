import type { Request, Response, NextFunction } from "express";
import { APIError } from "../utils/api-error";
import type { TypeRequest } from "../types";
import type {
  LoginInput,
  PasswordUpdateInput,
  RegisterInput,
  UpdateProfileInput,
} from "../validation/auth.validation";
import User from "../models/user.model";
import { cookieOptions, issueSession } from "../utils/jwt";
import router from "../routes/index.route";
import { ENV } from "../config/env.config";

export const register = async (
  req: TypeRequest<RegisterInput>,
  res: Response,
  next: NextFunction,
) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (!existingUser)
    return next(APIError.Conflict("User with this email already exists"));

  const hashedPassword = await User.hashPassword(password);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  issueSession(res, { id: user.id, email: user.email });

  return res.status(201).json({
    status: "success",
    message: "User registered successfully",
    data: {
      user,
    },
  });
};

export const login = async (
  req: TypeRequest<LoginInput>,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) return next(APIError.Unauthorized("Invalid email or password"));

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid)
    return next(APIError.Unauthorized("Invalid email or password"));

  issueSession(res, { id: user.id, email: user.email });

  return res.status(200).json({
    status: "success",
    message: "User logged in successfully",
    data: {
      user,
    },
  });
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie(ENV.COOKIE_NAME, { ...cookieOptions, maxAge: 0 });
  return res.status(200).json({
    status: "success",
    message: "User logged out successfully",
  });
};

export const getMe = async (
  req: TypeRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user!.id;

  const user = await User.findById(userId);

  if (!user) return next(APIError.Unauthorized("User not found"));

  return res.status(200).json({
    status: "success",
    message: "User fetched successfully",
    data: {
      user,
    },
  });
};

export const updateProfile = async (
  req: TypeRequest<UpdateProfileInput>,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user!.id;

  const { name } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { name },
    { new: true, runValidators: true },
  );

  if (!user) return next(APIError.Unauthorized("User not found"));

  return res.status(200).json({
    status: "success",
    message: "User profile updated successfully",
    data: {
      user,
    },
  });
};

export const updatePassword = async (
  req: TypeRequest<PasswordUpdateInput>,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  const user = await User.findById(userId).select("+password");

  if (!user) return next(APIError.Unauthorized("User not found"));

  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid)
    return next(APIError.Unauthorized("Current password is incorrect"));

  const hashedPassword = await User.hashPassword(newPassword);

  user.password = hashedPassword;
  await user.save();

  return res.status(200).json({
    status: "success",
    message: "Password updated successfully",
  });
};
