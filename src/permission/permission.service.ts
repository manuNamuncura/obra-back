import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PermissionResponseDto } from "./dto/permission-response.dto";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";

@Injectable()
export class PermissionService {
    constructor(private prisma: PrismaService) {}

    async findAll(): Promise<PermissionResponseDto[]> {
        const permissions = await this.prisma.permission.findMany({
            include: {
                rolesPermissions: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
        return permissions.map(permission => this.mapToResponseDto(permission));
    }

    async findOne(id: string): Promise<PermissionResponseDto> {
        const permission = await this.prisma.permission.findUnique({
            where: { id },
            include: {
                rolesPermissions: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!permission) {
            throw new NotFoundException(`Permission with ID ${id} not found`); 
        }
        return this.mapToResponseDto(permission);
    }

    async findByName(name: string): Promise<PermissionResponseDto> {
        const permission = await this.prisma.permission.findUnique({
            where: { name },
            include: {
                rolesPermissions: true,
            },
        });

        if (!permission) {
            throw new NotFoundException(`Permission with name ${name} not found`);
        }
        return this.mapToResponseDto(permission);
    }

    async create(createPermissionDto: CreatePermissionDto): Promise<PermissionResponseDto> {
        const existingPermission = await this.prisma.permission.findUnique({
            where: { name: createPermissionDto.name },
        })

        if (existingPermission) {
            throw new ConflictException(`Permission ${createPermissionDto.name} already exists`);
        }

        const permission = await this.prisma.permission.create({
            data: {
                name: createPermissionDto.name,
            },
            include: {
                rolesPermissions: true,
            },
        });
        return this.mapToResponseDto(permission);
    }

    async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<PermissionResponseDto> {
        const permission = await this.prisma.permission.findUnique({
            where: { id },
        });

        if (!permission) {
            throw new NotFoundException(`Permission with ID ${id} not found`);
        }

        if (updatePermissionDto.name && updatePermissionDto !== permission.name) {
            const existingPermission = await this.prisma.permission.findUnique({
                where: { name: updatePermissionDto.name },
            });

            if (existingPermission) {
                throw new ConflictException(`Permission ${updatePermissionDto.name} already exists`);
            }
        }

        const updatePermission = await this.prisma.permission.update({
            where: { id },
            data: {
                name: updatePermissionDto.name,
            },
            include: {
                rolesPermissions: true,
            },
        });
        return this.mapToResponseDto(updatePermission);
    }

    async remove(id: string): Promise<void> {
        const permission = await this.prisma.permission.findUnique({
            where: { id },
            include: {
                rolesPermissions: true,
            },
        });

        if (!permission) {
            throw new NotFoundException(`Permission with ID ${id} not found`);
        }

        if (permission.rolesPermissions.length > 0) {
            throw new ConflictException(`Cannot delete permission assigned to roles`);
        }

        await this.prisma.permission.delete({
            where: { id },
        });
    }

    async getPermissionRoles(id: string) {
        const permission = await this.prisma.permission.findUnique({
            where: { id },
            include: {
                rolesPermissions: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!permission) {
            throw new NotFoundException(`Permission with ID ${id} not found`);
        }

        return permission.rolesPermissions.map(rp => ({
            id: rp.role.id,
            name: rp.role.name,
            description: rp.role.description,
        }));
    }

    private mapToResponseDto(permission: any): PermissionResponseDto {
        return new PermissionResponseDto({
            id: permission.id,
            name: permission.name,
            createdAt: permission.createdAt,
            updatedAt: permission.updatedAt,
            roleCount: permission.rolesPermissions?.length || 0,
        })
    }
}