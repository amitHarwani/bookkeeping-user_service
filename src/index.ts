import dotenv from "dotenv"
dotenv.config();
dotenv.config({path: `.env.${process.env.NODE_ENV}`});

import app from "./app";
import logger from "./utils/logger";

import grpcServer from "./grpc/grpcapp";
import { ServerCredentials } from "@grpc/grpc-js";

app.listen(process.env.PORT, async () => {
    logger.info(`User Service Listening On Port: ${process.env.PORT}`);
})


/* Starting the GRPC server */
grpcServer.bindAsync(
    `0.0.0.0:${process.env.GRPC_PORT}`,
    ServerCredentials.createInsecure(),
    (err, port) => {
        if (err) {
            logger.error(`Error Starting GRPC server : ${JSON.stringify(err)}`);
            return;
        }
        logger.info(`GRPC running on port ${process.env.GRPC_PORT}`);
    }
);
