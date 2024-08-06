import { NextFunction, Request, Response } from "express";
import asyncHandler from "../utils/async_handler";
import { getUserFromAccessToken } from "../helpers/auth/auth.helpers";
import { ApiError } from "../utils/ApiError";


export const isUserLoggedIn = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    /* Get bearer token from headers */
    const token = req.header("Authorization")?.replace("Bearer ", "");

    /* No bearer token provided */
    if(!token){
        throw new ApiError(403, "access token not found", []);
    }

    /* Get user from token provided */
    const userFound = await getUserFromAccessToken(token);

    /* If no user is found or user is inActive or access token is invalid */
    if(userFound === null){
        throw new ApiError(403, "invalid access token", []);
    }
    if(!userFound.isLoggedIn){
        throw new ApiError(403, "user is not logged in", []);
    }

    /* Set user object on request, call next route. */
    req.user = userFound;
    next();
})

