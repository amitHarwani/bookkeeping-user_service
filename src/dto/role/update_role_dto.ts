import { Role } from "../../db";

export class UpdateRoleRequest {
    constructor(
        public companyId: number,
        public roleId: number,
        public roleName: string,
        public acl: Array<number>
    ) {}
}

export class UpdateRoleResponse {
    constructor(
        public role: Role,
        public message: string
    ) {}
}
