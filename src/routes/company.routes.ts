import { Router } from "express";
import { isUserLoggedIn } from "../middlewares/auth.middleware";
import {
    addCompanyValidator,
    getAccessibleFeaturesOfCompanyValidator,
    getCompanyValidator,
} from "../validators/company.validators";
import { validateInput } from "../validators";
import {
    addCompany,
    getAccessibleCompanies,
    getAccessibleFeaturesOfCompany,
    getCompany,
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

export default router;
