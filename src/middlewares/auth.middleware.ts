import { users } from "db_service";
import { eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError } from "jsonwebtoken";
import { db } from "../db";
import { decodeAccessToken } from "../helpers/auth/auth.helpers";
import { ApiError } from "../utils/ApiError";
import asyncHandler from "../utils/async_handler";

export const isUserLoggedIn = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* Get bearer token from headers */
        const token = req.header("Authorization")?.replace("Bearer ", "");

        /* No bearer token provided */
        if (!token) {
            throw new ApiError(403, "access token not found", []);
        }

        const decodedToken = decodeAccessToken(token);

        /* Invalid token */
        if (
            decodedToken instanceof JsonWebTokenError ||
            typeof decodedToken === "string" ||
            (typeof decodedToken === "object" && !decodedToken?.userId)
        ) {
            throw new ApiError(403, "invalid access token", []);
        }

        /* Find the user by id from the token payload */
        const usersFound = await db
            .select()
            .from(users)
            .where(eq(users.userId, decodedToken.userId));

        /* User not found, or is inactive */
        if (!usersFound.length || !usersFound[0].isActive) {
            throw new ApiError(403, "invalid access token", []);
        }
        if (!usersFound[0].isLoggedIn) {
            throw new ApiError(403, "user is not logged in", []);
        }

        /* Set user object on request, call next route. */
        req.user = usersFound[0];

        next();
    }
);

export const canUserCreateCompany = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* User is not logged in */
        if (!req?.user) {
            throw new ApiError(401, "user is not logged in", []);
        }

        /* User is a subUser: Hence not allowed to create a company */
        if (req.user.isSubUser) {
            throw new ApiError(403, "unauthorized to create a company", []);
        }
        next();
    }
);
