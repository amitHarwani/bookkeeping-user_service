import { Company } from "../../db";

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
        public company: Company,
        public message: string
    ) {}
}
