import { Router } from "express";
import {
    loginValidator,
    refreshTokenValidator,
    registerUserValidator,
    resetPasswordValidator,
} from "../validators/auth.validators";
import { validateInput } from "../validators";
import { login, logout, refreshToken, registerUser, resetPassword } from "../controllers/auth.controllers";
import { isUserLoggedIn } from "../middlewares/auth.middleware";
const router = Router();

router.post("/register", registerUserValidator(), validateInput, registerUser);
router.post("/login", loginValidator(), validateInput, login);
router.post("/refresh-token", refreshTokenValidator(), validateInput, refreshToken);

router.post("/logout", isUserLoggedIn, logout);
router.post("/reset-password", isUserLoggedIn, resetPasswordValidator(), validateInput, resetPassword)

export default router;
