
export class ResetPasswordRequest {
    constructor(
        public currentPassword: string,
        public newPassword: string
    ){

    }
}

export class ResetPasswordResponse {
    constructor(
        message: string
    ){

    }
}