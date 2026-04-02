export class RoleResponseDto {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    permissions?: {
        id: string;
        name: string;
    }[];
    userCount?: number;

    constructor(partial: Partial<RoleResponseDto>) {
        Object.assign(this, partial);
    }
}