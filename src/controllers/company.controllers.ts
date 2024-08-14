import { NextFunction, Request, Response } from "express";
import asyncHandler from "../utils/async_handler";
import {
    AddCompanyRequest,
    AddCompanyResponse,
} from "../dto/company/add_company_dto";
import { db } from "../db";
import {
    companies,
    defaultFeatures,
    roles,
    userCompanyMapping,
    userTypes,
} from "db_service";
import { ApiResponse } from "../utils/ApiResponse";
import { eq, inArray, sql } from "drizzle-orm";
import { ApiError } from "../utils/ApiError";
import { PostgresError } from "postgres";
import { GetAccessibleCompaniesResponse } from "../dto/company/get_accessible_companies_dto";

export const addCompany = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const body = req.body as AddCompanyRequest;

        /* Check if company with the same name exists */
        const existingCompaniesWithSameName = await db
            .select()
            .from(companies)
            .where(eq(sql`lower(${companies.companyName})`, body.companyName));

        if (existingCompaniesWithSameName.length) {
            throw new ApiError(
                409,
                "company with the same name already exists",
                []
            );
        }

        await db.transaction(async (tx) => {
            try {
                /* Adding company to DB */
                const newCompany = await tx
                    .insert(companies)
                    .values({
                        companyName: body.companyName,
                        address: body.address,
                        countryId: body.countryId,
                        dayStartTime: body.dayStartTime,
                        decimalRoundTo: body.decimalRoundTo,
                        phoneNumber: body.phoneNumber,
                        isActive: true,
                        isMainBranch: body.isMainBranch,
                        mainBranchId: body?.mainBranchId
                            ? body.mainBranchId
                            : null,
                        createdBy: req.user?.userId as string,
                    })
                    .returning();

                if (!newCompany.length) {
                    throw new ApiError(500, "error creating company", []);
                }

                /* Company ID of the company created */
                const companyId = newCompany[0].companyId;

                /* Extracting the default admin features */
                const defaultAdminFeatures = await tx
                    .select()
                    .from(defaultFeatures)
                    .where(eq(defaultFeatures.userType, "DEFAULT_ADMIN_USER"));

                if (!defaultAdminFeatures.length) {
                    throw new ApiError(
                        500,
                        "error fetching admin features",
                        []
                    );
                }

                /* Creating a role named companyName_ADMIN for admin users with the defaultAdminFeatures acl  */
                const companyAdminRole = await tx
                    .insert(roles)
                    .values({
                        roleName: `${newCompany[0].companyName}_ADMIN`,
                        companyId: companyId,
                        acl: defaultAdminFeatures[0].acl,
                    })
                    .returning();

                if (!companyAdminRole.length) {
                    throw new ApiError(
                        500,
                        "error creating company admin role",
                        []
                    );
                }

                /* Mapping the current user with the company, with the admin role */
                const userAssignedToRole = await tx
                    .insert(userCompanyMapping)
                    .values({
                        userId: req.user?.userId as string,
                        companyId: companyId,
                        roleId: companyAdminRole[0].roleId,
                    })
                    .returning();

                if (!userAssignedToRole.length) {
                    console.log("Throwing error from here");
                    throw new ApiError(
                        500,
                        "error creating user company mapping",
                        []
                    );
                }

                /* Returning the newly created company */
                return res.status(201).json(
                    new ApiResponse<AddCompanyResponse>(201, {
                        company: newCompany[0],
                        message: "company created successfully",
                    })
                );
            } catch (error) {
                if (error instanceof PostgresError) {
                    throw error;
                }
                throw error as ApiError;
            }
        });
    }
);

export const getAccessibleCompanies = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {

        /* Getting company ids accessible from userCompanyMapping table */
        const companyIdsAccessible = await db
            .select({ companyId: userCompanyMapping.companyId })
            .from(userCompanyMapping)
            .where(eq(userCompanyMapping.userId, req.user?.userId as string));

        /* Converting array of objects to single array of companyId */
        let companyIdsList: number[] = [];
        companyIdsAccessible.map((item) => {
            if (item.companyId) {
                companyIdsList.push(item.companyId);
            }
        });

        /* Finding the companies with id in companyIdsList */
        const companiesList = await db
            .select()
            .from(companies)
            .where(inArray(companies.companyId, companyIdsList));

        return res.status(200).json(
            new ApiResponse<GetAccessibleCompaniesResponse>(200, {
                companies: companiesList,
            })
        );
    }
);
