import express, { NextFunction, Request, Response } from "express";
import { ApiError } from "./utils/ApiError";

const app = express();

/* Logging */
import logger from "./utils/logger";
import morgan from "morgan";

const morganFormat = ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Auth Router */
import authRouter from "./routes/auth.routes"

app.use("/auth", authRouter);

app.use((err: ApiError, req: Request, res: Response, next: NextFunction) => {
    return res.status(err.statusCode || 500).json({
        statusCode: err.statusCode,
        message: err.message,
        errors: err.errors,
        stack: err.stack
    });
})
export default app;
