import { Company } from "../../db";
import { CompanyWithTaxDetails } from "./get_accessible_companies_dto";

export class UpdateCompanyRequest {
    constructor(
        public companyId: number,
        public companyName: string,
        public countryId: number,
        public address: string,
        public phoneNumber: string,
        public dayStartTime: string,
        public decimalRoundTo: number,
        public taxDetails?: Array<{ taxId: number; registrationNumber: string }>
    ) {}
}

export class UpdateCompanyResponse {
    constructor(
        public company: CompanyWithTaxDetails,
        public message: string
    ) {}
}
