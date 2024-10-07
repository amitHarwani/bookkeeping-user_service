import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/async_handler";
import { roles, userCompanyMapping, users } from "db_service";
import { db } from "../db";
import { and, eq, inArray, not, or } from "drizzle-orm";
import { notEqual } from "assert";
import { ApiResponse } from "../utils/ApiResponse";
import { GetAllUsersOfCompanyResponse } from "../dto/user/get_all_users_of_company_dto";
import { AddUserRequest, AddUserResponse } from "../dto/user/add_user_dto";
import { ApiError } from "../utils/ApiError";
import { hashPassword } from "../helpers/auth/auth.helpers";
import {
    UpdateUserAccessRequest,
    UpdateUserAccessResponse,
} from "../dto/user/update_user_access_dto";
import {
    UpdateUserRequest,
    UpdateUserResponse,
} from "../dto/user/update_user_dto";
import { GetUserResponse } from "../dto/user/get_user_dto";

export const getAllUsersOfCompany = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const companyId = Number(req?.query?.companyId);

        /* Finding all users assigned to the company */
        const usersOfCompany = await db
            .select({
                userId: userCompanyMapping.userId,
                roleId: userCompanyMapping.roleId,
            })
            .from(userCompanyMapping)
            .where(
                and(
                    eq(userCompanyMapping.companyId, companyId),
                    not(
                        eq(
                            userCompanyMapping.userId,
                            req.user?.userId as string
                        )
                    )
                )
            );

        /* User IDs array of all users assigned to the company*/
        const userIds = usersOfCompany.map((user) => {
            return user.userId as string;
        });

        /* Finding the users in users table */
        const allUsers = await db
            .select()
            .from(users)
            .where(inArray(users.userId, userIds));

        return res.status(200).json(
            new ApiResponse<GetAllUsersOfCompanyResponse>(200, {
                users: allUsers,
            })
        );
    }
);

export const getUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const userId = req?.query?.userId as string;

        const companyId = req?.query?.companyId as string | undefined;

        /* Getting the user from users table */
        const userFound = await db
            .select()
            .from(users)
            .where(eq(users.userId, userId));

        /* Company Query for user company mapping table */
        let companyQuery;

        /* If company id is passed */
        if (companyId && !isNaN(Number(companyId))) {
            /* Check for companies in user company mapping which match the companyId passed */
            companyQuery = eq(userCompanyMapping.companyId, Number(companyId));
        }

        /* Getting the user access for the companies from userCompanyMapping table */
        const userCompanyMapDetails = await db
            .select({
                companyId: userCompanyMapping.companyId,
                roleId: userCompanyMapping.roleId,
            })
            .from(userCompanyMapping)
            .where(and(eq(userCompanyMapping.userId, userId), companyQuery));

        return res.status(200).json(
            new ApiResponse<GetUserResponse>(200, {
                user: userFound[0],
                userCompanyMappings: userCompanyMapDetails,
            })
        );
    }
);

export const addUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const body = req.body as AddUserRequest;

        /* Check if role id passed exists */
        const rolesFound = await db
            .select()
            .from(roles)
            .where(
                and(
                    eq(roles.roleId, body.roleId),
                    eq(roles.companyId, body.companyId)
                )
            );

        /* Invalid role id error */
        if (!rolesFound.length) {
            throw new ApiError(400, "invalid role id passed", []);
        }

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

        /* Duplicate user error */
        if (isUserExists.length) {
            throw new ApiError(
                409,
                "user with the same mobile number or email already exists",
                []
            );
        }

        /* Hashing the users password */
        const hashedPassword = await hashPassword(body.password);

        /* Transaction */
        await db.transaction(async (tx) => {
            /* Adding user to users table */
            const userAdded = await tx
                .insert(users)
                .values({
                    fullName: body.fullName,
                    email: body.email,
                    mobileNumber: body.mobileNumber,
                    countryId: body.countryId,
                    password: hashedPassword,
                    isActive: body.isActive,
                })
                .returning();

            /* Adding user to userCompanyMapping table */
            await tx
                .insert(userCompanyMapping)
                .values({
                    userId: userAdded[0].userId,
                    companyId: body.companyId,
                    roleId: body.roleId,
                })
                .returning();

            return res.status(201).json(
                new ApiResponse<AddUserResponse>(200, {
                    user: userAdded[0],
                    message: "user added successfully",
                })
            );
        });
    }
);

export const updateUserAccess = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const body = req.body as UpdateUserAccessRequest;

        /* Check if role id passed exists */
        const rolesFound = await db
            .select()
            .from(roles)
            .where(
                and(
                    eq(roles.roleId, body.roleId),
                    eq(roles.companyId, body.companyId)
                )
            );

        /* Invalid role id error */
        if (!rolesFound.length) {
            throw new ApiError(400, "invalid role id passed", []);
        }
        await db.transaction(async (tx) => {
            /* Updating isActive field in users */
            const updatedUser = await tx
                .update(users)
                .set({
                    isActive: body.isActive,
                    updatedAt: new Date()
                })
                .where(eq(users.userId, body.userId))
                .returning();

            /* Invalid user id  */
            if (!updatedUser.length) {
                throw new ApiError(404, "user with id not found", []);
            }

            /* Updating roleId in user company mapping */
            const updatedUserCompanyMapping = await tx
                .update(userCompanyMapping)
                .set({
                    roleId: body.roleId,
                })
                .where(
                    and(
                        eq(userCompanyMapping.userId, body.userId),
                        eq(userCompanyMapping.companyId, body.companyId)
                    )
                )
                .returning();

            /* If update hasn't returned any record, user does not exist in the company */
            if (!updatedUserCompanyMapping.length) {
                throw new ApiError(
                    404,
                    "user does not belong to the company passed",
                    []
                );
            }

            return res.status(200).json(
                new ApiResponse<UpdateUserAccessResponse>(200, {
                    user: updatedUser[0],
                    companyId: body.companyId,
                    roleId: body.roleId,
                    message: "user updated successfully",
                })
            );
        });
    }
);

export const updateUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const body = req.body as UpdateUserRequest;

        /* Checking for duplicate user, with same email or mobile number, 
        other than the user being updated */
        const isUserExists = await db
            .select()
            .from(users)
            .where(
                and(
                    or(
                        eq(users.email, body.email),
                        eq(users.mobileNumber, body.mobileNumber)
                    ),
                    not(eq(users.userId, body.userId))
                )
            );

        /* Duplicate email/mobile number error */
        if (isUserExists.length) {
            throw new ApiError(
                409,
                "another user with the same mobile number or email already exists",
                []
            );
        }

        /* Updating user */
        const userUpdated = await db
            .update(users)
            .set({
                fullName: body.fullName,
                email: body.email,
                mobileNumber: body.mobileNumber,
                countryId: body.countryId,
                updatedAt: new Date()
            })
            .where(eq(users.userId, body.userId))
            .returning();

        if (!userUpdated.length) {
            throw new ApiError(400, "invalid user id passed", []);
        }

        return res.status(200).json(
            new ApiResponse<UpdateUserResponse>(200, {
                user: userUpdated[0],
            })
        );
    }
);
