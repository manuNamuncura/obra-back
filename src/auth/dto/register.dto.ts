import { IsEmail, IsString, maxLength, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(50)
    password: string;
}