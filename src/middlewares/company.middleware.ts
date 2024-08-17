import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/async_handler";
import { ApiError } from "../utils/ApiError";

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