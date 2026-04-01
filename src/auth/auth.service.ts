import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from 'bcrypt'
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    async register(registerDto: RegisterDto) {
        const { email, password, name } = registerDto;

        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        const defaultRole = await this.prisma.role.findUnique({
            where: { name: 'USER' },
        });

        if (defaultRole) {
            await this.prisma.userRole.create({
                data: {
                    userId: user.id,
                    roleId: defaultRole.id,
                },
            });
        }
        return this.generateAuthResponse(user);
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.prisma.user.findUnique({
            where: { email },
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
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials')
        }

        return this.generateAuthResponse(user);
    }

    private async generateAuthResponse(user: any) {
        const roles = user.roles.map(ur => ur.role.name);
        const permissions: string[] = user.roles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.name));

        const playload = {
            sub: user.id,
            email: user.email,
            roles,
            permissions: [...new Set(permissions)],
        };

        return {
            access_token: this.jwtService.sign(playload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                roles,
                permissions: [...new Set(permissions)],
            },
        };
    }
}