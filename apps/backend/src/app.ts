declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
      user: { userId: number };
    }
  }
}

import dotenv from "dotenv";
import express from "express";
import vocabRouter from "./modules/vocabulary/vocabularyRoutes";
import storiesRouter from "./modules/story/storyRoutes";
import unknownWordRouter from "./modules/unknownWord/unknownWordRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import { authRouter } from "./modules/auth/authRoutes";
import { requestLogger } from "./middlewares/requestLogger";
import { logger } from "./utils/logger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";

dotenv.config();
const app = express();
const port = process.env.PORT;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  legacyHeaders: false,
});

app.use(cors());
app.use(limiter);
app.use(helmet());
app.use(requestLogger);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/vocab", vocabRouter);
app.use("/api/stories", storiesRouter);
app.use("/api/unknown-words", unknownWordRouter);
app.use("/api/auth", authRouter);

app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Listening on ${port}`);
});
