import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/common/guards/permissions.guard';
import { PermissionService } from './permission.service';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @Permissions('permission:read')
  async findAll(): Promise<PermissionResponseDto[]> {
    return this.permissionService.findAll();
  }

  @Get(':id')
  @Permissions('permission:read')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PermissionResponseDto> {
    return this.permissionService.findOne(id);
  }

  @Get(':id/roles')
  @Permissions('permission:read')
  async getPermissionRoles(@Param('id', ParseUUIDPipe) id: string) {
    return this.permissionService.getPermissionRoles(id);
  }

  @Post()
  @Permissions('permission:create')
  async create(
    @Body() createPermissionDto: CreatePermissionDto,
  ): Promise<PermissionResponseDto> {
    return this.permissionService.create(createPermissionDto);
  }

  @Patch(':id')
  @Permissions('permission:update')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    return this.permissionService.update(id, updatePermissionDto);
  }

  @Delete(':id')
  @Permissions('permission:delete')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.permissionService.remove(id);
    return { message: `Permission with ID ${id} deleted successfully` };
  }
}
