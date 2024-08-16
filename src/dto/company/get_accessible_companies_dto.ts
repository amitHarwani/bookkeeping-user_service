import { Company } from "../../db";


export class GetAccessibleCompaniesResponse {
    constructor(
        public companies: Array<Company & {taxDetails: Array<{taxId: number, registrationNumber: string}>}>
    ){

    }
}