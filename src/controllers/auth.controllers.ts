import { roleFeatureMapping, userCompanyMapping, users } from "db_service";
import { and, eq, isNull, or } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError } from "jsonwebtoken";

import { db, User } from "../db";
import { LoginRequest, LoginResponse } from "../dto/auth/login_dto";
import {
    RegisterUserRequest,
    RegisterUserResponse,
} from "../dto/auth/register_user_dto";
import {
    checkUserAccessHelper,
    decodeRefreshToken,
    generateAccessToken,
    generateRefreshToken,
    hashPassword,
    verifyHash,
} from "../helpers/auth/auth.helpers";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import asyncHandler from "../utils/async_handler";
import {
    ResetPasswordRequest,
    ResetPasswordResponse,
} from "../dto/auth/reset_password_dto";
import {
    RefreshTokenRequest,
    RefreshTokenResponse,
} from "../dto/auth/refresh_token_dto";
import {
    CheckAccessRequest,
    CheckAccessResponse,
} from "../dto/auth/check_access_dto";
import { IsLoggedInResponse } from "../dto/auth/is_logged_in_dto";

/* Register User Controller */
export const registerUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const body = req.body as RegisterUserRequest;

        /* Checking for duplicate user, with same email or mobile number */
        const isUserExists = await db
            .select()
            .from(users)
            .where(
                or(
                    eq(users.email, body.email),
                    eq(users.mobileNumber, body.mobileNumber)
                )
            );
        if (isUserExists.length) {
            throw new ApiError(
                409,
                "email or mobile number already exists",
                []
            );
        }

        /* Hash the password */
        const hashedPassword = await hashPassword(body.password);

        /* Insert user to DB */
        let newUser = await db
            .insert(users)
            .values({
                fullName: body.fullName,
                email: body.email,
                password: hashedPassword,
                countryId: body.countryId,
                mobileNumber: body.mobileNumber,
                isSubUser: body.isSubUser,
                isActive: true,
            })
            .returning();

        /* Forming the response object, Adding the new user */
        let response: RegisterUserResponse = { user: newUser[0] };

        /* If logInOnRegistration is true */
        if (body.logInOnRegistration) {
            /* Generate Access & Refresh Token */
            const accessToken = generateAccessToken(newUser[0]);
            const refreshToken = generateRefreshToken(newUser[0]);

            /* Update DB with refresh token and isLoggedInFlag */
            newUser = await db
                .update(users)
                .set({ refreshToken: refreshToken, isLoggedIn: true })
                .where(eq(users.userId, newUser[0].userId))
                .returning();

            /* Update accessToken & refreshToken in response */
            response.accessToken = accessToken;
            response.refreshToken = refreshToken;
            response.user = newUser[0];
        }

        return res
            .status(201)
            .json(new ApiResponse<RegisterUserResponse>(201, response));
    }
);

export const login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const body = req.body as LoginRequest;

        /* Find user */
        let usersFound = await db
            .select()
            .from(users)
            .where(eq(users.email, body.email));

        /* If user is not found or the user is deactivated */
        if (
            !usersFound.length ||
            (usersFound.length && !usersFound[0].isActive)
        ) {
            throw new ApiError(401, "invalid email or password", []);
        }

        /* Check if user is already logged in */
        if (usersFound[0].isLoggedIn && usersFound[0].refreshToken) {
            /* Decode refresh token */
            const decodedRefreshToken = decodeRefreshToken(
                usersFound[0].refreshToken
            );

            /* If token is not an instance of JWT Error, that means token is not expired yet */
            if (!(decodedRefreshToken instanceof JsonWebTokenError)) {
                throw new ApiError(
                    409,
                    "user session is active, please logout and try again",
                    []
                );
            }
        }

        /* Check if password is correct */
        const isPasswordCorrect = await verifyHash(
            body.password,
            usersFound[0].password
        );

        /* Invalid password error */
        if (!isPasswordCorrect) {
            throw new ApiError(401, "invalid email or password", []);
        }

        /* Generate access token and refresh token */
        const accessToken = generateAccessToken(usersFound[0]);
        const refreshToken = generateRefreshToken(usersFound[0]);

        /* Update user in db, with refreshToken, and set isLoggedIn flag to true */
        usersFound = await db
            .update(users)
            .set({ refreshToken: refreshToken, isLoggedIn: true })
            .where(eq(users.userId, usersFound[0].userId))
            .returning();

        return res.status(200).json(
            new ApiResponse<LoginResponse>(200, {
                user: usersFound[0],
                accessToken: accessToken,
                refreshToken: refreshToken,
            })
        );
    }
);

export const refreshToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const body = req.body as RefreshTokenRequest;

        /* Verify refresh token */
        const tokenPayload = decodeRefreshToken(body.refreshToken);

        /* Invalid refresh token */
        if (
            tokenPayload instanceof JsonWebTokenError ||
            typeof tokenPayload === "string" ||
            (typeof tokenPayload === "object" && !tokenPayload?.userId)
        ) {
            throw new ApiError(401, "invalid refresh token", []);
        }

        /* Find user with id found in payload of JWT Token */
        let usersFound = await db
            .select()
            .from(users)
            .where(eq(users.userId, tokenPayload?.userId));

        /* User not foun */
        if (!usersFound.length) {
            throw new ApiError(401, "invalid refresh token", []);
        }

        /* User is deactivated */
        if (!usersFound[0].isActive) {
            throw new ApiError(401, "user deactivated", []);
        }

        /* Refresh tokens doesnt match the one in db, token is expired */
        if (usersFound[0].refreshToken != body.refreshToken) {
            throw new ApiError(401, "refresh token expired", []);
        }

        /* Generate access & refresh tokens */
        const accessToken = generateAccessToken(usersFound[0]);
        const refreshToken = generateRefreshToken(usersFound[0]);

        /* Update refresh token and isLoggedIn in db */
        await db
            .update(users)
            .set({ refreshToken: refreshToken, isLoggedIn: true })
            .where(eq(users.userId, usersFound[0].userId));

        return res.status(200).json(
            new ApiResponse<RefreshTokenResponse>(200, {
                accessToken,
                refreshToken,
            })
        );
    }
);

export const logout = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* If user is not received from middleware */
        if (!req.user?.userId) {
            throw new ApiError(400, "invalid access token", []);
        }

        /* Update refreshToken to null, and isLoggedIn flag to false in db */
        await db
            .update(users)
            .set({ refreshToken: null, isLoggedIn: false })
            .where(eq(users.userId, req.user?.userId));

        return res.status(200).json(
            new ApiResponse<{ message: string }>(200, {
                message: "user logged out successfully",
            })
        );
    }
);

export const resetPassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* User from auth middleware */
        const user = req?.user;
        if (!user) {
            throw new ApiError(403, "invalid access token", []);
        }

        const body = req.body as ResetPasswordRequest;

        /* Checking if current password is correct */
        const isCurrentPasswordValid = await verifyHash(
            body.currentPassword,
            user.password
        );

        if (!isCurrentPasswordValid) {
            throw new ApiError(400, "invalid current password", []);
        }

        /* Hash for the new password */
        const newPasswordHash = await hashPassword(body.newPassword);

        /* Update password in db, and logout the user */
        await db
            .update(users)
            .set({
                password: newPasswordHash,
                isLoggedIn: false,
                refreshToken: null,
                updatedAt: new Date(),
            })
            .where(eq(users.userId, user.userId));

        return res.status(200).json(
            new ApiResponse<ResetPasswordResponse>(200, {
                message: "password reset successfully",
            })
        );
    }
);

export const isLoggedInController = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* Request will only reach here if it passes the auth middleware, Indicating user is logged in */

        return res.status(200).json(
            new ApiResponse<IsLoggedInResponse>(200, {
                user: req.user as User,
                isLoggedIn: true,
            })
        );
    }
);

export const checkAccess = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        /* User is not logged in */
        if (!req.user) {
            throw new ApiError(403, "invalid access token", []);
        }
        const body = req.body as CheckAccessRequest;

        const isAuthorized = await checkUserAccessHelper(
            body.companyId,
            body.featureId,
            req.user.userId
        );

        /* Unauthorized */
        if (!isAuthorized) {
            throw new ApiError(403, "unauthorized", []);
        }

        return res.status(200).json(
            new ApiResponse<CheckAccessResponse>(200, {
                user: req.user,
                isAuthorized: true,
            })
        );
    }
);
