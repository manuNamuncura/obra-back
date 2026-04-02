import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreatePermissionDto {
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    @Matches(/^[a-z]+:[a-z]+$/, {
        message: 'Permission must be in format "resource:action" (e.g., "user:create")',
    })
    name: string;
}