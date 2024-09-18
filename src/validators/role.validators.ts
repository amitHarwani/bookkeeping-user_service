import { body, query } from "express-validator";

export const getAllRolesValidator = () => {
    return [
        body("companyId").isInt().withMessage("invalid company id"),
        body("cursor").custom((value) => {
            if (
                !value ||
                (typeof value === "object" && typeof value?.roleId === "number")
            ) {
                return true;
            }
            throw new Error("invalid cursor field");
        }),
        body("pageSize").isInt().withMessage("invalid page size"),
    ];
};

export const getRoleValidator = () => {
    return [
        query("companyId").isInt().withMessage("invalid company id"),
        query("roleId").isInt().withMessage("invalid role id"),
    ];
};

export const addRoleValidator = () => {
    return [
        body("companyId").isInt().withMessage("invalid company id"),
        body("roleName")
            .isString()
            .withMessage("invalid role name")
            .trim()
            .notEmpty()
            .withMessage("role name cannot be empty")
            .escape(),
        body("acl").isArray().withMessage("invalid acl field passed"),
    ];
};

export const updateRoleValidator = () => {
    return [
        body("companyId").isInt().withMessage("invalid company id"),
        body("roleId").isInt().withMessage("invalid role id"),
        body("roleName")
            .isString()
            .withMessage("invalid role name")
            .trim()
            .notEmpty()
            .withMessage("role name is required")
            .escape(),
        body("acl").isArray().withMessage("invalid acl field"),
    ];
};
