import { ArrayNotEmpty, IsArray, IsUUID } from "class-validator";

export class AssignRolesDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('4', { each:true })
    roleIds: string[];
}