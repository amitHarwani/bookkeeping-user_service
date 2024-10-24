import { credentials } from "@grpc/grpc-js";
import { TaxDetail } from "../db";
import { SystemAdminServiceClient } from "./proto/sys_admin_service";

/* GRPC Client */
const client = new SystemAdminServiceClient(
    process.env.SYSTEM_ADMIN_GRPC_SERVICE as string,
    credentials.createInsecure()
);

/* get tax details of country request */
export const getTaxDetailsOfCountry = (countryId: number) => {
    /* Returns a promise of tax detail array */
    return new Promise<Array<TaxDetail>>((resolve, reject) => {
        /* GRPC request to server */
        client.getTaxDetailsOfCountry({ countryId }, (error, response) => {
            if (error) {
                /* On error reject */
                return reject(error);
            } else {
                /* On success resolve */
                if (response.isSuccess) {
                    return resolve(response.taxDetails);
                } else {
                    return reject();
                }
            }
        });
    });
};
