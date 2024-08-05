export class RefreshTokenRequest {
    constructor(public refreshToken: string) {}
}

export class RefreshTokenResponse {
    constructor(
        public accessToken: string,
        public refreshToken: string
    ) {}
}
