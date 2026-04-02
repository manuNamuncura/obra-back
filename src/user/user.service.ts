import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return users.map(user => this.mapToResponseDto(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.mapToResponseDto(user);
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return this.mapToResponseDto(user);
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Crear usuario
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Asignar roles si se proporcionan
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      await this.assignRoles(user.id, { roleIds: createUserDto.roleIds });
      
      // Refrescar usuario con roles asignados
      const updatedUser = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
      return this.mapToResponseDto(updatedUser);
    }

    return this.mapToResponseDto(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verificar si el nuevo email ya existe
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {
      name: updateUserDto.name,
      email: updateUserDto.email,
    };

    // Si se proporciona nueva contraseña, hashearla
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Actualizar usuario
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // Actualizar roles si se proporcionan
    if (updateUserDto.roleIds) {
      await this.assignRoles(id, { roleIds: updateUserDto.roleIds });
      
      // Refrescar usuario
      const refreshedUser = await this.prisma.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });
      return this.mapToResponseDto(refreshedUser);
    }

    return this.mapToResponseDto(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Eliminar relaciones UserRole primero
    await this.prisma.userRole.deleteMany({
      where: { userId: id },
    });

    // Eliminar usuario
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async assignRoles(id: string, assignRolesDto: AssignRolesDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verificar que todos los roles existan
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: assignRolesDto.roleIds },
      },
    });

    if (roles.length !== assignRolesDto.roleIds.length) {
      throw new NotFoundException('One or more roles not found');
    }

    // Eliminar roles actuales
    await this.prisma.userRole.deleteMany({
      where: { userId: id },
    });

    // Asignar nuevos roles
    await this.prisma.userRole.createMany({
      data: assignRolesDto.roleIds.map(roleId => ({
        userId: id,
        roleId,
      })),
    });

    // Retornar usuario actualizado
    const updatedUser = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return this.mapToResponseDto(updatedUser);
  }

  async getUserRoles(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user.roles.map(userRole => ({
      id: userRole.role.id,
      name: userRole.role.name,
      description: userRole.role.description,
      permissions: userRole.role.permissions.map(rp => rp.permission.name),
    }));
  }

  private mapToResponseDto(user: any): UserResponseDto {
    const roles = user.roles?.map(userRole => ({
      id: userRole.role.id,
      name: userRole.role.name,
      description: userRole.role.description,
    }));

    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles,
    });
  }
}