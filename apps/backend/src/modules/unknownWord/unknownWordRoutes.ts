import { Router } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { createUnknownWordController } from "./unknownWordControllerFactory";
const router = Router();

const unknownWordController = createUnknownWordController();

router.post("/mark-as-learned/:wordId", authMiddleware, asyncHandler(unknownWordController.markAsLearned));
router.post("/mark-as-learning/:wordId", authMiddleware, asyncHandler(unknownWordController.markAsLearning));
router.get("/words", authMiddleware, asyncHandler(unknownWordController.getAllWords));

export default router;
