export class CheckAccessRequest {
    constructor(
        public featureId: number,
        public companyId: number
    ){

    }
}

export class CheckAccessResponse {
    constructor(
        public isAuthorized: boolean
    ){

    }
}