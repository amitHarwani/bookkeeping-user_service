import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/async_handler";
import {
    GetAllRolesRequest,
    GetAllRolesResponse,
} from "../dto/role/get_all_roles_dto";
import { and, eq, getTableColumns, gt, not, or, sql } from "drizzle-orm";
import { roles } from "db_service";
import { db } from "../db";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { GetRoleResponse } from "../dto/role/get_role_dto";
import { AddRoleRequest, AddRoleResponse } from "../dto/role/add_role_dto";
import { UpdateRoleRequest } from "../dto/role/update_role_dto";
import { GetCompanyAdminACLResponse } from "../dto/role/get_company_admin_acl_dto";

export const getAllRoles = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const body = req.body as GetAllRolesRequest;

        /* Where clause */
        let whereClause;

        /* If cursor is passed, fetching next page */
        if (body?.cursor) {
            /* RoleId must be greater than the last role id passed */
            if (typeof body?.cursor?.roleId === "number") {
                whereClause = and(
                    gt(roles.roleId, body.cursor.roleId),
                    eq(roles.companyId, body.companyId)
                );
            }
        } else {
            whereClause = eq(roles.companyId, body.companyId);
        }

        /* All columns of roles tables */
        const allRoleColumns = getTableColumns(roles);

        /* Default columns to select */
        let columnsToSelect = { roleId: roles.roleId };

        /* If select is passed */
        if (body?.select && Array.isArray(body?.select)) {
            /* All keys of roles columns */
            const roleTableColKeys = Object.keys(allRoleColumns);

            /* For each column to select */
            body.select.forEach((col) => {
                /* Invalid column name */
                if (!roleTableColKeys.includes(col)) {
                    throw new ApiError(
                        422,
                        `invalid col to select passed ${col}`,
                        []
                    );
                }
                /* Adding to columnsToSelect */
                columnsToSelect = { ...columnsToSelect, [col]: roles[col] };
            });
        }

        /* Fetching from DB */
        const rolesFound = await db
            .select(columnsToSelect)
            .from(roles)
            .where(whereClause);

        /* Last role  */
        const lastRole = rolesFound?.[rolesFound?.length - 1];
        let nextPageCursor;

        /* If last role exists, pass the roleId as next page cursor (for the next page to be fetched) */
        if (lastRole) {
            nextPageCursor = {
                roleId: lastRole.roleId,
            };
        }

        return res.status(200).json(
            new ApiResponse<GetAllRolesResponse<typeof rolesFound>>(200, {
                roles: rolesFound,
                nextPageCursor: nextPageCursor,
            })
        );
    }
);

export const getRole = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const companyId = Number(req?.query?.companyId);
        const roleId = Number(req?.query?.roleId);

        /* Fetching from DB */
        const rolesFound = await db
            .select()
            .from(roles)
            .where(
                and(eq(roles.roleId, roleId), eq(roles.companyId, companyId))
            );

        /* No role found */
        if (!rolesFound.length) {
            throw new ApiError(404, "no role found", []);
        }

        return res.status(200).json(
            new ApiResponse<GetRoleResponse>(200, {
                role: rolesFound[0],
            })
        );
    }
);

export const addRole = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const body = req.body as AddRoleRequest;

        /* Checking if role with same name exists for the company */
        const rolesWithSameName = await db
            .select()
            .from(roles)
            .where(
                and(
                    eq(roles.companyId, body.companyId),
                    eq(
                        sql`lower(${roles.roleName})`,
                        body.roleName.toLowerCase()
                    )
                )
            );

        if (rolesWithSameName.length) {
            throw new ApiError(
                422,
                "role with same name already exists for this company",
                []
            );
        }

        /* Getting features available to the main admin of this company */
        const adminACLResults = await db
            .select({ acl: roles.acl })
            .from(roles)
            .where(
                and(
                    eq(roles.companyId, body.companyId),
                    eq(roles.roleName, `${body.companyId}_ADMIN`)
                )
            );

        if (!adminACLResults.length) {
            throw new ApiError(422, "invalid company id", []);
        }
        /* ACL of the admin of this company */
        const adminACL = adminACLResults[0].acl;

        /* For each featureId passed in body */
        body.acl.forEach((featureId) => {
            /* If the adminACL does not include the feature id, throw error */
            if (
                isNaN(Number(featureId)) ||
                !adminACL?.includes(Number(featureId))
            ) {
                throw new ApiError(422, "invalid ACL passed", []);
            }
        });

        /* Adding role to DB */
        const roleAdded = await db.insert(roles).values({
            roleName: body.roleName,
            companyId: body.companyId,
            acl: body.acl,
        });

        return res.status(201).json(
            new ApiResponse<AddRoleResponse>(201, {
                role: roleAdded[0],
                message: "role added successfully",
            })
        );
    }
);

export const updateRole = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const body = req.body as UpdateRoleRequest;

        /* Checking if the role exists */
        const rolesFromDB = await db
            .select()
            .from(roles)
            .where(
                and(
                    eq(roles.companyId, body.companyId),
                    eq(roles.roleId, body.roleId)
                )
            );
        /* Invalid role id */
        if (!rolesFromDB.length) {
            throw new ApiError(404, "invalid role id passed", []);
        }

        /* If the main admin role is being updated, throw an error */
        if (rolesFromDB[0].roleName === `${body.companyId}_ADMIN`) {
            throw new ApiError(
                400,
                "cannot update main admin role, contact support",
                []
            );
        }

        /* Checking if role with same name exists for the company but different roleId */
        const rolesWithSameName = await db
            .select()
            .from(roles)
            .where(
                and(
                    eq(roles.companyId, body.companyId),
                    not(eq(roles.roleId, body.roleId)),
                    eq(
                        sql`lower(${roles.roleName})`,
                        body.roleName.toLowerCase()
                    )
                )
            );

        if (rolesWithSameName.length) {
            throw new ApiError(
                422,
                "role with same name already exists for this company",
                []
            );
        }

        /* Getting features available to the main admin of this company */
        const adminACLResults = await db
            .select({ acl: roles.acl })
            .from(roles)
            .where(
                and(
                    eq(roles.companyId, body.companyId),
                    eq(roles.roleName, `${body.companyId}_ADMIN`)
                )
            );

        if (!adminACLResults.length) {
            throw new ApiError(422, "invalid company id", []);
        }
        /* ACL of the admin of this company */
        const adminACL = adminACLResults[0].acl;

        /* For each featureId passed in body */
        body.acl.forEach((featureId) => {
            /* If the adminACL does not include the feature id, throw error */
            if (
                typeof featureId != "number" ||
                !adminACL?.includes(featureId)
            ) {
                throw new ApiError(422, "invalid ACL passed", []);
            }
        });

        /* Updating role in DB */
        const roleUpdated = await db
            .update(roles)
            .set({
                roleName: body.roleName,
                acl: body.acl,
            })
            .where(eq(roles.roleId, body.roleId))
            .returning();

        return res.status(201).json(
            new ApiResponse<AddRoleResponse>(201, {
                role: roleUpdated[0],
                message: "role updated successfully",
            })
        );
    }
);

export const getCompanyAdminACL = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const companyId = Number(req?.query?.companyId);

        /* 
        Finding the role, where the companyId match and the roleName is companyId_ADMIN, indicating the main admin role 
        */
        const recordsFound = await db
            .select({ acl: roles.acl })
            .from(roles)
            .where(
                and(
                    eq(roles.companyId, companyId),
                    eq(roles.roleName, `${companyId}_ADMIN`)
                )
            );

        /* ACL not found */
        if (!recordsFound.length || !recordsFound?.[0]?.acl) {
            throw new ApiError(404, "acl not found", []);
        }

        return res.status(200).json(
            new ApiResponse<GetCompanyAdminACLResponse>(200, {
                acl: recordsFound[0].acl,
            })
        );
    }
);
