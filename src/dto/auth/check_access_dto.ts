import { User } from "../../db";

export class CheckAccessRequest {
    constructor(
        public featureId: number,
        public companyId: number
    ){

    }
}

export class CheckAccessResponse {
    constructor(
        public user: User,
        public isAuthorized: boolean
    ){

    }
}