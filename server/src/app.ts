import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import fs from "node:fs";
import path from "node:path";
import router from "./routes";
import { logger } from "./utils/logger";
import { sessionMiddleware } from "./middleware/session";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/api/uploads", express.static(uploadsDir));

app.use(sessionMiddleware);
app.use("/api", router);

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  const statusCode = err.status || err.statusCode || 500;
  logger.error({ 
    err: {
      message: err.message,
      stack: err.stack,
      ...err
    },
    req: {
      method: req.method,
      url: req.url,
    }
  }, "Unhandled error");

  res.status(statusCode).json({
    error: {
      message: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
      code: err.code || "INTERNAL_ERROR",
    },
  });
});

export default app;
