import { Router } from "express";
import { validateRequest } from "../middleware/validate-request.middleware";
import {
  loginSchema,
  passwordUpdateSchema,
  registerSchema,
  updateProfileSchema,
} from "../validation/auth.validation";
import { asyncHandler } from "../middleware/async-handler.middleware";
import {
  getMe,
  login,
  logout,
  register,
  updatePassword,
  updateProfile,
} from "../controller/auth.controller";
import { requireAuth } from "../middleware/require-auth.middleware";
import { authRateLimiter } from "../middleware/rate-limiting.middleware";

const authRouter: Router = Router();

authRouter
  .route("/register")
  .post(validateRequest({ body: registerSchema }), asyncHandler(register));

authRouter
  .route("/login")
  .post(validateRequest({ body: loginSchema }), asyncHandler(login));

authRouter.route("/logout").post(requireAuth, asyncHandler(logout));

authRouter.route("/me").get(requireAuth, asyncHandler(getMe));

authRouter
  .route("/profile")
  .patch(
    requireAuth,
    validateRequest({ body: updateProfileSchema }),
    asyncHandler(updateProfile),
  );

authRouter
  .route("/password")
  .patch(
    authRateLimiter,
    requireAuth,
    validateRequest({ body: passwordUpdateSchema }),
    asyncHandler(updatePassword),
  );

export default authRouter;
