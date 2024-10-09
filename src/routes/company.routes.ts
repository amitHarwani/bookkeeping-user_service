import { Router } from "express";
import {
    checkAccessMiddleware,
    isUserLoggedIn,
} from "../middlewares/auth.middleware";
import {
    addCompanyValidator,
    getAccessibleFeaturesOfCompanyValidator,
    getCompanyGroupValidator,
    getCompanyValidator,
    updateCompanyValidator,
} from "../validators/company.validators";
import { validateInput } from "../validators";
import {
    addCompany,
    getAccessibleCompanies,
    getAccessibleFeaturesOfCompany,
    getCompany,
    getCompanyGroup,
    updateCompany,
} from "../controllers/company.controllers";
import { canUserCreateCompany } from "../middlewares/company.middleware";

const router = Router();

router.post(
    "/add-company",
    addCompanyValidator(),
    validateInput,
    isUserLoggedIn,
    canUserCreateCompany,
    addCompany
);

router.put(
    "/update-company",
    updateCompanyValidator(),
    validateInput,
    isUserLoggedIn,
    checkAccessMiddleware(22),
    updateCompany
);

router.get("/get-accessible-companies", isUserLoggedIn, getAccessibleCompanies);

router.get(
    "/get-company/:companyId",
    getCompanyValidator(),
    validateInput,
    isUserLoggedIn,
    getCompany
);

router.get(
    "/get-accessible-features-of-company/:companyId",
    getAccessibleFeaturesOfCompanyValidator(),
    validateInput,
    isUserLoggedIn,
    getAccessibleFeaturesOfCompany
);

router.get(
    "/get-company-group",
    getCompanyGroupValidator(),
    validateInput,
    isUserLoggedIn,
    getCompanyGroup
);
export default router;
