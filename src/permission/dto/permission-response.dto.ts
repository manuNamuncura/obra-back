export class PermissionResponseDto {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    roleCount?: number;

    constructor(partial: Partial<PermissionResponseDto>) {
        Object.assign(this, partial);
    }
}