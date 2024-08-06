import argon2, { argon2i } from "argon2";
import { db, User } from "../../db";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { users } from "db_service";
import { eq } from "drizzle-orm";

/* Hash password with argon2 */
export const hashPassword = async (password: string): Promise<string> => {
    return await argon2.hash(password, { version: argon2i });
};

/* Verify password hash */
export const verifyHash = async (
    password: string,
    hash: string
): Promise<Boolean> => {
    return await argon2.verify(hash, password);
};

/* JWT Access Token Generation */
export const generateAccessToken = (user: User) => {
    return jwt.sign(
        {
            userId: user.userId,
            fullName: user.fullName,
            email: user.email,
        },
        process.env.ACCESS_TOKEN_KEY as string,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

/* JWT Refresh Token Generation */
export const generateRefreshToken = (user: User) => {
    return jwt.sign(
        {
            userId: user.userId,
        },
        process.env.REFRESH_TOKEN_KEY as string,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

/* Decode refresh token */
export const decodeRefreshToken = (refreshToken: string) => {
    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_KEY as string
        );
        return decoded;
    } catch (error) {
        return error as JsonWebTokenError;
    }
};

/* Decode access token */
export const decodeAccessToken = (accessToken: string) => {
    try {
        const decoded = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_KEY as string
        );
        return decoded;
    } catch (error) {
        return error as JsonWebTokenError;
    }
};

/* Get user from access token in headers */
export const getUserFromAccessToken = async (accessToken: string): Promise<User | null> => {
    try {
        const decodedToken = decodeAccessToken(accessToken);

        /* Invalid token */
        if (
            decodedToken instanceof JsonWebTokenError ||
            typeof decodedToken === "string" ||
            (typeof decodedToken === "object" && !decodedToken?.userId)
        ) {
            return null;
        }

        /* Find the user by id from the token payload */
        const usersFound = await db.select().from(users).where(eq(users.userId, decodedToken?.userId));

        /* User not found, or is inactive */
        if(!usersFound.length || !usersFound[0].isActive){
            return null;
        }

        return usersFound[0];

    } catch (error) {
        return null;
    }
};
