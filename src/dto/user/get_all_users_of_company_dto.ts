import { User } from "../../db";

export class GetAllUsersOfCompanyResponse {
    constructor(
        public users: Array<User>
    ){}
}