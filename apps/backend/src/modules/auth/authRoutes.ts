import { Router } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { authController } from "./composition";
import { authMiddleware } from "@/middlewares/authMiddlewareFactory";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(authController.register));
authRouter.post("/login", asyncHandler(authController.login));
authRouter.post("/logout", asyncHandler(authController.logout));
authRouter.post("/refresh", asyncHandler(authController.refresh));
authRouter.get("/me", authMiddleware, asyncHandler(authController.me));
