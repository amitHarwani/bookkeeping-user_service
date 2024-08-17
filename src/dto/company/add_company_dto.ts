import { Company } from "../../db";
import { CompanyWithTaxDetails } from "./get_accessible_companies_dto";

export class AddCompanyRequest {
    constructor(
        public companyName: string,
        public countryId: number,
        public address: string,
        public phoneNumber: string,
        public dayStartTime: string,
        public isMainBranch: boolean,
        public decimalRoundTo: number,
        public mainBranchId?: number,
        public taxDetails?: Array<{ taxId: number; registrationNumber: string }>
    ) {}
}

export class AddCompanyResponse {
    constructor(
        public company: CompanyWithTaxDetails,
        public message: string
    ) {}
}
