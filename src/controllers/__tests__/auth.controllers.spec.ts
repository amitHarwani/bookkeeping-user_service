import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: `.env.dev` });

import { NextFunction, Request, Response } from "express";
import { LoginRequest } from "../../dto/auth/login_dto";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyHash,
} from "../../helpers/auth/auth.helpers";
import { ApiError } from "../../utils/ApiError";
import { getSelectMock, getUpdateMock } from "../../utils/db_mock_utils";
import { login } from "../auth.controllers";

/* Mocking Auth Helpers */
jest.mock("../../helpers/auth/auth.helpers", () => ({
    ...jest.requireActual("../../helpers/auth/auth.helpers"),
    verifyHash: jest.fn(),
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
}));

describe("Auth", () => {
    describe("Login", () => {
        /* Mock Request, Response and Next */
        let mockRequest: Partial<Request> = {};
        const mockResponse = {} as unknown as Response;
        mockResponse.json = jest.fn();
        mockResponse.status = jest.fn(() => mockResponse);
        const mockNext: Partial<NextFunction> = jest.fn();

        beforeEach(() => {
            jest.clearAllMocks();
        })

        it("Successfully Logs In when correct credentials are passed", async () => {
            /* Mock Request Body */
            const body: LoginRequest = {
                email: "email@test.com",
                password: "password",
            };
            mockRequest = { body: body };

            /* Select Query Mock Implementation */
            getSelectMock([
                {
                    email: "email@test.com",
                    password: "password",
                    isActive: true,
                },
            ]);

            /* Update Query Mock Implementation */
            getUpdateMock([
                {
                    email: "email@test.com",
                    password: "password",
                    isActive: true,
                },
            ]);

            /* Verify Hash, Generated Access and Refresh Tokens mock return values */
            (verifyHash as jest.Mock).mockReturnValue(true);
            (generateAccessToken as jest.Mock).mockReturnValue("access_token");
            (generateRefreshToken as jest.Mock).mockReturnValue(
                "refresh_token"
            );

            /* Calling Login */
            await login(
                mockRequest as Request,
                mockResponse as Response,
                mockNext as NextFunction
            );

            /* Expect status to be 200 */
            expect(mockResponse.status).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalled();
        });

        it("Returns error, when incorrect credentials are passed", async () => {
            /* Mock Request Body */
            const body: LoginRequest = {
                email: "email@test.com",
                password: "password",
            };
            mockRequest = { body: body };

            /* Select Query Mock Implementation */
            getSelectMock([
                {
                    email: "email@test.com",
                    password: "password12",
                    isActive: true,
                },
            ]);

            /* Verify Hash, mock return values */
            (verifyHash as jest.Mock).mockReturnValue(false);


            /* Calling Login */
            await login(
                mockRequest as Request,
                mockResponse as Response,
                mockNext as NextFunction
            );

            /* Expect status to be 401 */
            expect(mockNext).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalledWith(new ApiError(401, "invalid email or password", []))
        });
    });
});
