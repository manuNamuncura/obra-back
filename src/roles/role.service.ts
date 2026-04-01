import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class RoleService {
    constructor(private prisma: PrismaService) {}

    create(data: CreateRoleDto) {
        return this.prisma.role.create({ data })
    }

    findAll() {
        return this.prisma.role.findMany();
    }

    update(id: string, data: UpdateRoleDto) {
        return this.prisma.role.update({
            where: { id },
            data,
        });
    }

    remove(id: string) {
        return this.prisma.role.delete({
            where: { id },
        })
    }
}