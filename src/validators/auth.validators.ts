import { body, oneOf } from "express-validator";

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
            .withMessage("invalid email")
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
        body("logInOnRegistration").isBoolean(),
    ];
};

export const loginValidator = () => {
    return [
        body("email")
            .isString()
            .trim()
            .isEmail()
            .withMessage("invalid email")
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

export const checkAccessValidator = () => {
    return [
        body("featureId")
            .isNumeric().withMessage("invalid feature id"),
        body("companyId").custom(value => {
            if(!isNaN(Number(value)) || value == null){
                return true;
            }
            throw new Error("invalid company id");
        })   
    ]
}
