import { NextFunction, Request, Response, Router } from "express";
import {
    addRoleValidator,
    getAllRolesValidator,
    getCompanyAdminACLValidator,
    getRoleValidator,
    updateRoleValidator,
} from "../validators/role.validators";
import { validateInput } from "../validators";
import {
    checkAccessMiddleware,
    isUserLoggedIn,
} from "../middlewares/auth.middleware";
import {
    addRole,
    getAllRoles,
    getCompanyAdminACL,
    getRole,
    updateRole,
} from "../controllers/role.controllers";

const router = Router();

router.post(
    "/get-all-roles",
    getAllRolesValidator(),
    validateInput,
    isUserLoggedIn,
    checkAccessMiddleware(23),
    getAllRoles
);

router.get(
    "/get-role",
    getRoleValidator(),
    validateInput,
    isUserLoggedIn,
    (req: Request, res: Response, next: NextFunction) => {
        checkAccessMiddleware(23, Number(req?.query?.companyId))(
            req,
            res,
            next
        );
    },
    getRole
);

router.post(
    "/add-role",
    addRoleValidator(),
    validateInput,
    isUserLoggedIn,
    checkAccessMiddleware(24),
    addRole
);

router.put(
    "/update-role",
    updateRoleValidator(),
    validateInput,
    isUserLoggedIn,
    checkAccessMiddleware(24),
    updateRole
);

router.get(
    "/get-company-admin-acl",
    getCompanyAdminACLValidator(),
    validateInput,
    isUserLoggedIn,
    (req: Request, res: Response, next: NextFunction) => {
        /* As this endpoint will only be required when adding or updating a role */
        checkAccessMiddleware(24, Number(req?.query?.companyId))(req, res, next);
    },
    getCompanyAdminACL
);

export default router;
