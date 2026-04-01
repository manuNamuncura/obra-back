import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";
import { IsArray, IsOptional } from "class-validator";

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsArray()
    @IsOptional()
    roleIds?: string[];
}