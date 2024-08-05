import { User } from "../../db";

export class LoginRequest{
    constructor(
        public email: string,
        public password: string
    ){

    }
}

export class LoginResponse {
    constructor(
        public user: User,
        public accessToken: string,
        public refreshToken: string
    )
    {

    }
}