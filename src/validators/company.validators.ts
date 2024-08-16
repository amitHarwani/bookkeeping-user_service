import { body } from "express-validator";

export const addCompanyValidator = () => {
    return [
        body("companyName")
            .isString()
            .trim()
            .notEmpty()
            .withMessage("company name is required")
            .escape(),
        body("countryId").isInt().withMessage("invalid country id"),
        body("address")
            .isString()
            .trim()
            .notEmpty()
            .withMessage("address is required")
            .escape(),
        body("phoneNumber")
            .isString()
            .trim()
            .notEmpty()
            .withMessage("phone number is required")
            .escape(),
        body("dayStartTime")
            .isString()
            .trim()
            .notEmpty()
            .withMessage("day start time is required")
            .custom((value) => {
                if (/^((?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$)/.test(value)) {
                    return true;
                }
                throw new Error("invalid day start time");
            }),
        body("isMainBranch")
            .isBoolean()
            .withMessage("invalid isMainBranch field"),
        body("decimalRoundTo")
            .isInt()
            .withMessage("invalid decimalRoundTo field"),
        body("mainBranchId")
            .if(
                body("isMainBranch").custom((value) => {
                    /* If the company is not a main branch -> Main branch id should exist */
                    if (value === false) {
                        return true;
                    }
                    return false;
                })
            )
            .isInt()
            .withMessage("main branch id is required"),
        body("taxDetails").custom((value) => {
            /* If value does not exist: No tax details */
            if (!value) {
                return true;
            }
            /* Ensuring taxDetails are in appropriate format */
            if (Array.isArray(value)) {
                value.forEach((taxDetail) => {
                    if (
                        typeof taxDetail?.taxId != "number" ||
                        typeof taxDetail?.registrationNumber != "string"
                    ) {
                        throw new Error("invalid taxDetails field");
                    }
                });
                return true;
            }
            throw new Error("invalid taxDetails field");
        }),
    ];
};
