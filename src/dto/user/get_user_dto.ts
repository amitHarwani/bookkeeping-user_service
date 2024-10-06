import { User } from "../../db";

export class GetUserResponse {
    constructor(
        public user: User,
        public userCompanyMappings: Array<{ companyId: number | null; roleId: number | null }>
    ) {}
}


