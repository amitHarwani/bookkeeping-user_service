import { Router } from "express";
import {
    canUserCreateCompany,
    isUserLoggedIn,
} from "../middlewares/auth.middleware";
import { addCompanyValidator } from "../validators/company.validators";
import { validateInput } from "../validators";
import { addCompany, getAccessibleCompanies } from "../controllers/company.controllers";

const router = Router();

router.post(
    "/add-company",
    addCompanyValidator(),
    validateInput,
    isUserLoggedIn,
    canUserCreateCompany,
    addCompany
);

router.get("/get-accessible-companies", isUserLoggedIn, getAccessibleCompanies)

export default router;
