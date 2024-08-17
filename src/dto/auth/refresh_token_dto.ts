import { User } from "../../db";

export class RefreshTokenRequest {
    constructor(public refreshToken: string) {}
}

export class RefreshTokenResponse {
    constructor(
        public user: User,
        public accessToken: string,
        public refreshToken: string
    ) {}
}
