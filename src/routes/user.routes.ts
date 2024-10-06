import { Router, Request, Response, NextFunction } from "express";
import {
    addUserValidator,
    getAllUsersOfCompanyValidator,
    updateUserAccessValidator,
    updateUserValidator,
} from "../validators/user.validators";
import {
    checkAccessMiddleware,
    isUserLoggedIn,
} from "../middlewares/auth.middleware";
import {
    addUser,
    getAllUsersOfCompany,
    updateUser,
    updateUserAccess,
} from "../controllers/user.controllers";
import { ApiError } from "../utils/ApiError";

const router = Router();

router.get(
    "/get-all-users-of-company",
    getAllUsersOfCompanyValidator(),
    isUserLoggedIn,
    (req: Request, res: Response, next: NextFunction) => {
        checkAccessMiddleware(25, Number(req?.query?.companyId))(
            req,
            res,
            next
        );
    },
    getAllUsersOfCompany
);

router.post(
    "/add-user",
    addUserValidator(),
    isUserLoggedIn,
    checkAccessMiddleware(26),
    addUser
);

router.patch(
    "/update-user-access",
    updateUserAccessValidator(),
    isUserLoggedIn,
    checkAccessMiddleware(26),
    updateUserAccess
);

router.put(
    "/update-user",
    updateUserValidator(),
    isUserLoggedIn,
    (req: Request, res: Response, next: NextFunction) => {
        /* If the user is updating its own details */
        if (req.body.userId == req.user?.userId) {
            next();
        }
        /* If user is updating other users details, then company Id is required to know if they have access to do the same */
        if (!req?.body?.companyId) {
            throw new ApiError(
                422,
                "company id is required when updating other users",
                []
            );
        }
        checkAccessMiddleware(26, req?.body?.companyId)(req, res, next);
    },
    updateUser
);

export default router;
