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
import authRouter from "./routes/auth.routes";

/* Company Router */
import companyRouter from "./routes/company.routes";

/* Role Router */
import roleRouter from "./routes/role.routes";

/* User Router */
import userRouter from "./routes/user.routes";

app.use("/auth", authRouter);
app.use("/company", companyRouter);
app.use("/role", roleRouter);
app.use("/user", userRouter);

import { PostgresError } from "postgres";

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof PostgresError) {
        return res.status(500).json({
            statusCode: 500,
            message: err.detail,
            isDBError: true,
            stack: err.stack,
        });
    } else {
        const apiError = err as ApiError;
        return res.status(apiError.statusCode || 500).json({
            statusCode: apiError.statusCode,
            message: apiError.message,
            errors: apiError.errors,
            stack: apiError.stack,
        });
    }
});
export default app;
