import { Role } from "../../db";

export class GetRoleResponse {
    constructor(
        public role: Role
    ){}
}