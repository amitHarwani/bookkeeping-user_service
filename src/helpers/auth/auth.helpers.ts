import argon2, { argon2i } from "argon2";
import { platformFeatures, roles, userCompanyMapping, users } from "db_service";
import { and, eq, isNull } from "drizzle-orm";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { db, User } from "../../db";
import fs from "fs";
import { ApiError } from "../../utils/ApiError";

/* Access Token Key from enviornment variable or file */
const ACCESS_TOKEN_KEY =
    process.env.ACCESS_TOKEN_KEY ||
    fs.readFileSync(process.env.ACCESS_TOKEN_KEY_FILE as string, "utf-8");

/* Refresh Token Key from enviornment variable or file */
const REFRESH_TOKEN_KEY =
    process.env.REFRESH_TOKEN_KEY ||
    fs.readFileSync(process.env.REFRESH_TOKEN_KEY_FILE as string, "utf-8");

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
        ACCESS_TOKEN_KEY,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

/* JWT Refresh Token Generation */
export const generateRefreshToken = (user: User) => {
    return jwt.sign(
        {
            userId: user.userId,
        },
        REFRESH_TOKEN_KEY as string,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

/* Decode refresh token */
export const decodeRefreshToken = (refreshToken: string) => {
    try {
        const decoded = jwt.verify(
            refreshToken,
            REFRESH_TOKEN_KEY as string
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
            ACCESS_TOKEN_KEY as string
        );
        return decoded;
    } catch (error) {
        return error as JsonWebTokenError;
    }
};

export const isUserLoggedInHelper = async (token?: string) => {
    /* No bearer token provided */
    if (!token) {
        throw new ApiError(401, "access token not found", []);
    }

    const decodedToken = decodeAccessToken(token);

    /* Invalid token */
    if (
        decodedToken instanceof JsonWebTokenError ||
        typeof decodedToken === "string" ||
        (typeof decodedToken === "object" && !decodedToken?.userId)
    ) {
        throw new ApiError(401, "invalid access token", []);
    }

    /* Find the user by id from the token payload */
    const usersFound = await db
        .select()
        .from(users)
        .where(eq(users.userId, decodedToken.userId));

    /* User not found, or is inactive */
    if (!usersFound.length || !usersFound[0].isActive) {
        throw new ApiError(401, "invalid access token", []);
    }
    if (!usersFound[0].isLoggedIn) {
        throw new ApiError(401, "user is not logged in", []);
    }

    return usersFound[0];
};

export const checkUserAccessHelper = async (
    companyId: number | null,
    featureId: number,
    userId: string
) => {
    /* If companyId is null, then check would be "is null", else do a equality check */
    const companyIdCheck = companyId
        ? eq(userCompanyMapping.companyId, companyId)
        : isNull(userCompanyMapping.companyId);

    /* Users ACL for the company */
    const userRoleDBRequest = await db
        .select({
            roleId: userCompanyMapping.roleId,
        })
        .from(userCompanyMapping)
        .where(and(eq(userCompanyMapping.userId, userId), companyIdCheck));

    if(!userRoleDBRequest.length){
        return false;
    }

    const userACLDBRequest = db
        .select({ acl: roles.acl })
        .from(roles)
        .where(eq(roles.roleId, userRoleDBRequest[0].roleId as number));

    /* Feature Details request */
    const featureDBRequest = db
        .select({
            featureId: platformFeatures.featureId,
            isEnabled: platformFeatures.isEnabled,
        })
        .from(platformFeatures)
        .where(eq(platformFeatures.featureId, featureId));

    /* Parallel requests to get feature details and users ACL for the particular company */
    const [userACL, feature] = await Promise.all([
        userACLDBRequest,
        featureDBRequest,
    ]);

    /* If user is not assigned any role for the company or if featureId does not exist*/
    if (!userACL.length || !feature.length) {
        return false;
    }

    /* ACL Array of featureIds */
    const acl = userACL[0].acl;

    /* If ACL includes the featureId */
    if (Array.isArray(acl) && acl.includes(featureId)) {
        /* If companyId is null -> sysadmin request */
        if (companyId == null) {
            return true;
        } else {
            /* Return based upon whether feature is enabled or not */
            return feature[0].isEnabled;
        }
    } else {
        return false;
    }
};
