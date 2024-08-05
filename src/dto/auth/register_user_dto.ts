import { User } from "../../db";

export class RegisterUserRequest {
    constructor(
        public fullName: string,
        public email: string,
        public password: string,
        public countryId: number,
        public mobileNumber: string,
        public isSubUser: boolean,
        public logInOnRegistration: boolean
    ){

    }
}

export class RegisterUserResponse {
    constructor(
        public user: User,
        public accessToken?: string,
        public refreshToken?: string
    ){

    }
}