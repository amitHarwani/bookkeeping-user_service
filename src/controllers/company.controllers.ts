import axios from "axios";
import {
    companies,
    companyTaxMapping,
    defaultFeatures,
    roles,
    userCompanyMapping,
} from "db_service";
import { eq, inArray, sql } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";
import { PostgresError } from "postgres";
import { db, TaxDetail } from "../db";
import {
    AddCompanyRequest,
    AddCompanyResponse,
} from "../dto/company/add_company_dto";
import { GetAccessibleCompaniesResponse } from "../dto/company/get_accessible_companies_dto";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/async_handler";

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
        
        /* Getting taxDetails of country */
        const taxDetailsOfCountryRequest = await axios.get<
            ApiResponse<{ taxDetails: TaxDetail[] }>
        >(
            `${process.env.SYSTEM_ADMIN_SERVICE}${process.env.GET_TAXDETAILS_OF_COUNTRY_PATH}/${body.countryId}`
        );

        const taxDetailsOfCountry =
            taxDetailsOfCountryRequest.data.data.taxDetails;

        /* To store taxIds which are mandatory in a map */
        let mandatoryTaxIdsMap = new Map();

        /* To store all taxIds of the country as a map */
        let taxDetailsOfCountryAsMap = new Map();

        /* Looping through tax details of the country */
        taxDetailsOfCountry.forEach((tax) => {
            /* If the tax is mandatory */
            if (!tax.isRegistrationOptional) {
                /* Set it in mandatoryTaxIdsMap */
                mandatoryTaxIdsMap.set(tax.taxId, true);
            }
            taxDetailsOfCountryAsMap.set(tax.taxId, tax);
        });

        /* Looping through the taxDetails passed */
        body.taxDetails?.forEach((taxDetail) => {
            /* If the taxId does not exist in tax details of the country: throw error */
            if (!taxDetailsOfCountryAsMap.get(taxDetail.taxId)) {
                throw new ApiError(
                    422,
                    "invalid taxid passed in taxDetails",
                    []
                );
            }
            /* If the tax id passed is mandatory, remove it from the map */
            if (mandatoryTaxIdsMap.get(taxDetail.taxId)) {
                mandatoryTaxIdsMap.delete(taxDetail.taxId);
            }
        });

        /* If the mandatoryTaxIds map still consists of elements: throw error, some mandatory tax ids aren't passed */
        if (mandatoryTaxIdsMap.size) {
            throw new ApiError(422, "missing mandatory tax details", []);
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

                /* Inserting tax details in companyTaxMapping */
                if (Array.isArray(body?.taxDetails)) {
                    for (let taxDetail of body.taxDetails) {
                        await tx.insert(companyTaxMapping).values({
                            companyId: newCompany[0].companyId,
                            taxId: taxDetail.taxId,
                            registrationNumber: taxDetail.registrationNumber,
                        });
                    }
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
        const companiesListRequest = db
            .select()
            .from(companies)
            .where(inArray(companies.companyId, companyIdsList));

        /* Finding the companies tax details */
        const companyTaxDetailsRequest = db
            .select()
            .from(companyTaxMapping)
            .where(inArray(companyTaxMapping.companyId, companyIdsList));

        /* Parallel request */
        const [companiesList, companyTaxDetails] = await Promise.all([
            companiesListRequest,
            companyTaxDetailsRequest,
        ]);

        /* Map of all the companies */
        let companiesMap = new Map();

        /* Adding company details to the map */
        companiesList.forEach((company) => {
            companiesMap.set(company.companyId, { ...company, taxDetails: [] });
        });

        /* Adding companies tax detail to the map, as an array of taxDetails for each company */
        companyTaxDetails.forEach((taxDetail) => {
            const company = companiesMap.get(taxDetail.companyId);
            company.taxDetails.push({
                taxId: taxDetail.taxId,
                registrationNumber: taxDetail.registrationNumber,
            });
            companiesMap.set(taxDetail.companyId, company);
        });

        return res.status(200).json(
            new ApiResponse<GetAccessibleCompaniesResponse>(200, {
                companies: Array.from(companiesMap.values()),
            })
        );
    }
);
