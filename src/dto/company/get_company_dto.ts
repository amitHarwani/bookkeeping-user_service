import { CompanyWithTaxDetails } from "./get_accessible_companies_dto";


export class GetCompanyResponse {
    constructor(
        public company: CompanyWithTaxDetails;
    ){

    }
}