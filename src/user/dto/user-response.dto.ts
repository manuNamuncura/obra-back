import { Exclude } from "class-transformer";

export class UserResponseDto {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;

    @Exclude()
    password: string;

    roles?: {
        id: string;
        name: string;
        description: string;
    }[];

    constructor(partial: Partial<UserResponseDto>) {
        Object.assign(this, partial);
    }
}