import { User } from "../../db";

export class UpdateUserRequest {
    constructor(
        public userId: string,
        public countryId: number,
        public companyId: number,
        public fullName: string,
        public email: string,
        public mobileNumber: string,
    ){}
}

export class UpdateUserResponse {
    constructor(
        public user: User
    ){}
}