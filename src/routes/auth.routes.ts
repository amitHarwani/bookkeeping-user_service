import { Router } from "express";
import {
    checkAccessValidator,
    loginValidator,
    refreshTokenValidator,
    registerUserValidator,
    resetPasswordValidator,
} from "../validators/auth.validators";
import { validateInput } from "../validators";
import {
    checkAccess,
    isLoggedInController,
    login,
    logout,
    refreshToken,
    registerUser,
    resetPassword,
} from "../controllers/auth.controllers";
import { isUserLoggedIn } from "../middlewares/auth.middleware";
const router = Router();

router.post("/register", registerUserValidator(), validateInput, registerUser);
router.post("/login", loginValidator(), validateInput, login);
router.post(
    "/refresh-token",
    refreshTokenValidator(),
    validateInput,
    refreshToken
);

router.post("/logout", isUserLoggedIn, logout);
router.post(
    "/reset-password",
    isUserLoggedIn,
    resetPasswordValidator(),
    validateInput,
    resetPassword
);

router.post("/is-logged-in", isUserLoggedIn, isLoggedInController);
router.post(
    "/check-access",
    checkAccessValidator(),
    validateInput,
    isUserLoggedIn,
    checkAccess
);
export default router;
