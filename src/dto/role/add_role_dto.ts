import { Role } from "../../db";

export class AddRoleRequest {
    constructor(
        public companyId: number,
        public roleName: string,
        public acl: Array<number>
    ) {}
}

export class AddRoleResponse {
    constructor(
        public role: Role,
        public message: string
    ) {}
}
