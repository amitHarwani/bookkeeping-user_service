import { Company } from "../../db";

export type CompanyWithTaxDetails = Company & {taxDetails: Array<{taxId: number, registrationNumber: string}>};

export class GetAccessibleCompaniesResponse {
    constructor(
        public companies: Array<CompanyWithTaxDetails>
    ){

    }
}