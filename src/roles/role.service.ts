import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { RoleResponseDto } from "./dto/role-response.dto";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { AssignPermissionsDto } from "./dto/assign-permissions.dto";

@Injectable()
export class RoleService {
    constructor(private prisma: PrismaService) {}

    async findAll(): Promise<RoleResponseDto[]> {
        const roles = await this.prisma.role.findMany({
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                users: true,
            },
        });
        return roles.map(role => this.mapToResponseDto(role));
    }

    async findOne(id: string): Promise<RoleResponseDto> {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                users: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }
        return this.mapToResponseDto(role);
    }

    async findByName(name: string): Promise<RoleResponseDto> {
        const role = await this.prisma.role.findUnique({
            where: { name },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
                users: true,
            },
        });

        if (!role) {
            throw new NotFoundException(`Role with name ${name} not found`);
        }
        return this.mapToResponseDto(role);
    }

    async create(createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
        const existingRole = await this.prisma.role.findUnique({
            where: { name: createRoleDto.name.toUpperCase() },
        });

        if (existingRole) {
            throw new ConflictException(`Role ${createRoleDto.name} already exists`);
        }

        const role = await this.prisma.role.create({
            data: {
                name: createRoleDto.name.toUpperCase(),
                description: createRoleDto.description,
            },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });

        if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
            await this.assignPermissions(role.id, { permissionIds: createRoleDto.permissionIds });

            const updateRole = await this.prisma.role.findUnique({
                where: { id: role.id},
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            });
            return this.mapToResponseDto(updateRole);
        }
        return this.mapToResponseDto(role);
    }

    async update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleResponseDto> {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });

        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }

        if (updateRoleDto.name && updateRoleDto.name.toUpperCase() !== role.name) {
            const existingRole = await this.prisma.role.findUnique({
                where: { name: updateRoleDto.name.toUpperCase() },
            });
            if (existingRole) {
                throw new ConflictException(`Role ${updateRoleDto.name} already exists`);
            }
        }

        const updateRole = await this.prisma.role.update({
            where: { id },
            data: {
                name: updateRoleDto.name?.toUpperCase(),
                description: updateRoleDto.description,
            },
            include: {
                permissions: {
                    include:{
                        permission: true,
                    },
                },
            },
        });

        if (updateRoleDto.permissionIds) {
            await this.assignPermissions(id, { permissionIds: updateRoleDto.permissionIds });

            const refreshedRole = await this.prisma.role.findUnique({
                where: { id },
                include: {
                    permissions: {
                        include: {
                            permission: true,
                        },
                    },
                },
            });
            return this.mapToResponseDto(refreshedRole);
        }
        return this.mapToResponseDto(updateRole);
    }

    async remove(id: string): Promise<void> {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                users: true,
            },
        });

        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }

        if (role.users.length > 0) {
            throw new ConflictException(`Cannot delete role with assigned users`);
        }

        await this.prisma.rolePermission.deleteMany({
            where: { roleId: id },
        })

        await this.prisma.role.delete({
            where: { id },
        });
    }

    async assignPermissions(id: string, assignPermissionsDto: AssignPermissionsDto): Promise<RoleResponseDto> {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });

        if (!role) {
            throw new NotFoundException(`Role with ${id} not found`);
        }

        const permissions = await this.prisma.permission.findMany({
            where: {
                id: { in: assignPermissionsDto.permissionIds },
            },
        });

        if (permissions.length !== assignPermissionsDto.permissionIds.length) {
            throw new NotFoundException('One or more permissions not found');
        }

        await this.prisma.rolePermission.deleteMany({
            where: { roleId: id },
        });

        await this.prisma.rolePermission.createMany({
            data: assignPermissionsDto.permissionIds.map(permissionId => ({
                roleId: id,
                permissionId,
            })),
        });

        const updateRole = await this.prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true,
                    },
                },
            },
        });
        return this.mapToResponseDto(updateRole);
    }

    async getRoleUsers(id: string) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                users: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }

        return role.users.map(userRole => ({
            id: userRole.user.id,
            name: userRole.user.name,
            email: userRole.user.email,
            assignedAt: userRole.createdAt,
        }));
    }

    private mapToResponseDto(role: any): RoleResponseDto {
        const permissions = role.permissions?.map(rp => ({
            id: rp.permission.id,
            name: rp.permission.name,
        }));

        return new RoleResponseDto({
            id: role.id,
            name: role.name,
            description: role.description,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
            permissions,
            userCount: role.user?.length || 0,
        });
    }
}