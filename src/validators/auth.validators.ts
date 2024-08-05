import { body } from "express-validator";

export const registerUserValidator = () => {
    return [
        body("fullName")
            .isString()
            .trim()
            .notEmpty()
            .escape()
            .withMessage("full name is required"),
        body("email")
            .isString()
            .trim()
            .isEmail()
            .notEmpty()
            .escape()
            .withMessage("invalid email"),
        body("password")
            .isString()
            .notEmpty()
            .withMessage("password is required")
            .isLength({ min: 8 })
            .withMessage("password must be 8 characters long"),
        body("countryId").isNumeric().withMessage("country is required"),
        body("mobileNumber")
            .isString()
            .trim()
            .escape()
            .notEmpty()
            .withMessage("mobile number is required"),
        body("isSubUser").isBoolean(),
        body("logInOnRegisteration").isBoolean(),
    ];
};

export const loginValidator = () => {
    return [
        body("email")
            .isString()
            .trim()
            .isEmail()
            .notEmpty()
            .escape()
            .withMessage("invalid email"),
        body("password")
            .isString()
            .notEmpty()
            .withMessage("password is required"),
    ];
};

export const refreshTokenValidator = () => {
    return [
        body("refreshToken")
            .isString()
            .trim()
            .notEmpty()
            .withMessage("refresh token is required"),
    ];
};

export const resetPasswordValidator = () => {
    return [
        body("currentPassword")
            .isString()
            .trim()
            .notEmpty()
            .withMessage("current password is required"),
        body("newPassword")
            .isString()
            .trim()
            .notEmpty()
            .withMessage("new password is required")
            .isLength({ min: 8 })
            .withMessage("password must be 8 characters long"),
    ];
};
