import { Server, ServerUnaryCall, sendUnaryData } from "@grpc/grpc-js";
import {
    AuthServiceServer,
    AuthServiceService,
    CheckAccessGRPCRequest,
    CheckAccessGRPCResponse,
    User
} from "./proto/auth_service";
import {
    checkUserAccessHelper,
    isUserLoggedInHelper,
} from "../helpers/auth/auth.helpers";
import { ApiError } from "../utils/ApiError";

/* GRPC Server */
const server = new Server();

const authServiceImplementation: AuthServiceServer = {
    checkAccess: async function (
        call: ServerUnaryCall<CheckAccessGRPCRequest, CheckAccessGRPCResponse>,
        callback: sendUnaryData<CheckAccessGRPCResponse>
    ): Promise<void> {
        const featureId = Number(call.request.featureId);
        const companyId = call.request.isSystemAdminRequest
            ? Number(call.request.companyId)
            : null;
        const token = call.request.jwtToken;

        try {
            /* Checking if user is logged in */
            const user = await isUserLoggedInHelper(token);

            /* Checking for access */
            const isAuthorized = await checkUserAccessHelper(
                companyId,
                featureId,
                user.userId
            );

            /* Unauthorized */
            if (!isAuthorized) {
                throw new ApiError(403, "unauthorized", []);
            }

            /* Formatting the user response */
            const formattedUser: User = {
                userId: user.userId,
                countryId: user.countryId as number,
                email: user.email,
                fullName: user.fullName,
                isActive: user.isActive as boolean,
                isLoggedIn: user.isLoggedIn as boolean,
                isSubUser: user.isSubUser as boolean,
                mobileNumber: user.mobileNumber,
                refreshToken: user.refreshToken || "",
                createdAt: user.createdAt?.toString() || "",
                updatedAt: user.updatedAt?.toString() || "",
            }

            callback(null, {
                isAuthorized: true,
                user: formattedUser,
            });

        } catch (error) {
            /* ApiError to grpc error type */
            const apiError = error as ApiError
            callback({
                code: apiError?.statusCode || 500,
                message: apiError?.message || ""
            }, null);
        }

    },
};

/* Adding the get tax details of country service */
server.addService(AuthServiceService, authServiceImplementation);

export default server;
