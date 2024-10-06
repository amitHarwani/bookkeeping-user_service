import { body, query } from "express-validator";

export const getAllUsersOfCompanyValidator = () => {
    return [query("companyId").isInt().withMessage("invalid company id")];
};

export const addUserValidator = () => {
    return [
        body("countryId").isInt().withMessage("invalid country id"),
        body("fullName")
            .isString()
            .withMessage("invalid full name")
            .trim()
            .notEmpty()
            .withMessage("full name is required")
            .escape(),
        body("email")
            .isString()
            .trim()
            .isEmail()
            .withMessage("invalid email")
            .notEmpty()
            .escape(),
        body("password")
            .isString()
            .notEmpty()
            .withMessage("password is required")
            .isLength({ min: 8 })
            .withMessage("password must be 8 characters long"),
        body("mobileNumber")
            .isString()
            .withMessage("invalid mobile number")
            .trim()
            .escape()
            .notEmpty()
            .withMessage("mobile number is required"),
        body("isActive").isBoolean().withMessage("invalid is active field"),
        body("companyId").isInt().withMessage("invalid company id"),
        body("roleId").isInt().withMessage("invalid role id"),
    ];
};

export const updateUserAccessValidator = () => {
    return [
        body("userId")
            .isString()
            .withMessage("invalid user id")
            .trim()
            .notEmpty()
            .withMessage("user id is required")
            .escape(),
        body("companyId").isInt().withMessage("invalid company id"),
        body("roleId").isInt().withMessage("invalid role id"),
        body("isActive").isBoolean().withMessage("invalid is active field"),
    ];
};

export const updateUserValidator = () => {
    return [
        body("userId")
            .isString()
            .withMessage("invalid user id")
            .trim()
            .notEmpty()
            .withMessage("user id is required")
            .escape(),
        body("countryId").isInt().withMessage("invalid country id"),
        body("companyId").isInt().withMessage("invalid company id").optional(),
        body("fullName")
            .isString()
            .withMessage("invalid full name")
            .trim()
            .notEmpty()
            .withMessage("full name is required")
            .escape(),
        body("email")
            .isString()
            .trim()
            .isEmail()
            .withMessage("invalid email")
            .notEmpty()
            .escape(),
        body("mobileNumber")
            .isString()
            .withMessage("invalid mobile number")
            .trim()
            .escape()
            .notEmpty()
            .withMessage("mobile number is required"),
    ];
};

export const getUserValidator = () => {
    return [
        query("userId").isString().notEmpty().withMessage("invalid user id").escape(),
        query("companyId").isInt().withMessage("invalid company id").optional()
    ]
}
