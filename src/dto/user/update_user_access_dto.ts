import { User } from "../../db";

export class UpdateUserAccessRequest {
    constructor(
        public userId: string,
        public companyId: number,
        public roleId: number,
        public isActive: boolean
    ) {}
}

export class UpdateUserAccessResponse {
    constructor(
        public user: User,
        public roleId: number,
        public companyId: number,
        public message: string
    ) {}
}
