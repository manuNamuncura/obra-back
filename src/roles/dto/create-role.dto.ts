import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsArray, IsUUID } from "class-validator";

export class CreateRoleDto {
   @IsString()
   @MinLength(2)
   @MaxLength(50)
   name: string;

   @IsString()
   @IsOptional()
   @MaxLength(200)
   description?: string;

   @IsArray()
   @IsOptional()
   @IsUUID('4', { each: true })
   permissionIds?: string[];
}