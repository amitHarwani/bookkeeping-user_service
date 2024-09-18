import { Role } from "../../db";

export class GetAllRolesRequest {
    constructor(
        public companyId: number,
        public pageSize: number,
        public select?: [keyof Role],
        public cursor?: {
            roleId: number;
        }
    ) {}
}

export class GetAllRolesResponse<T> {
    constructor(
        public roles: T,
        public nextPageCursor?: {
            roleId: number;
        }
    ) {}
}
