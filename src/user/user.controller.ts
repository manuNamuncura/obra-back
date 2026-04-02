import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { PermissionGuard } from "src/common/guards/permissions.guard";
import { UserService } from "./user.service";
import { Permissions } from "src/common/decorators/permissions.decorator";
import { UserResponseDto } from "./dto/user-response.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AssignRolesDto } from "./dto/assign-roles.dto";

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @Permissions('user:read')
    async findAll(): Promise<UserResponseDto[]> {
        return this.userService.findAll();
    }

    @Get(':id')
    @Permissions('user:read')
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
        return this.userService.findOne(id);
    }

    @Get(':id/roles')
    @Permissions('user:read')
    async getUserRoles(@Param('id', ParseUUIDPipe) id: string) {
        return this.userService.getUserRoles(id);
    }

    @Post()
    @Permissions('user:create')
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        return this.userService.create(createUserDto);
    }

    @Patch(':id')
    @Permissions('user:update')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<UserResponseDto> {
        return this.userService.update(id, updateUserDto);
    }

    @Patch('id/roles')
    @Permissions('user:update')
    async assignRoles(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() assignRolesDto: AssignRolesDto,
    ): Promise<UserResponseDto> {
        return this.userService.assignRoles(id, assignRolesDto);
    }

    @Delete(':id')
    @Permissions('user:delete')
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ message: string}> {
        await this.userService.remove(id);
        return { message: `User with ID ${id} deleted successfully` };
    }
}