import { Company } from "../../db";


export class GetAccessibleCompaniesResponse {
    constructor(
        public companies: Company[]
    ){

    }
}