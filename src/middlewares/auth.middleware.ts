import { users } from "db_service";
import { eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError } from "jsonwebtoken";
import { db } from "../db";
import {
    checkUserAccessHelper,
    decodeAccessToken,
    isUserLoggedInHelper,
} from "../helpers/auth/auth.helpers";
import { ApiError } from "../utils/ApiError";
import asyncHandler from "../utils/async_handler";

export const isUserLoggedIn = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* Get bearer token from headers */
        const token = req.header("Authorization")?.replace("Bearer ", "");

        const user = await isUserLoggedInHelper(token);

        /* Set user object on request, call next route. */
        req.user = user;

        next();
    }
);

export const checkAccessMiddleware = (
    featureId: number,
    companyId?: number | null
) => {
    return asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            /* CompanyId either passed as parameter, or from request body */
            const company = req?.body?.companyId
                ? req.body.companyId
                : companyId;

            /* Checking if user has access */
            const isAuthorized = await checkUserAccessHelper(
                company,
                featureId,
                req?.user?.userId as string
            );

            /* If user has access call next middleware, else throw unauthorized error */
            if (isAuthorized) {
                next();
            } else {
                throw new ApiError(403, "unauthorized", []);
            }
        }
    );
};
