import { User } from "../../db";

export class AddUserRequest {
    constructor(
        public countryId: number,
        public fullName: string,
        public email: string,
        public password: string,
        public mobileNumber: string,
        public isActive: boolean,
        public companyId: number,
        public roleId: number
    ) {}
}

export class AddUserResponse {
    constructor(
        public user: User,
        public message: string
    ){}
}
