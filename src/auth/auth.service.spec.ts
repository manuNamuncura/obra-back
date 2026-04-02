import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
    },
  } as unknown as PrismaService;

  const jwtMock = {
    sign: jest.fn().mockReturnValue('jwt-token'),
  } as unknown as JwtService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('register throws ConflictException if email already exists', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'u1',
    });

    await expect(
      service.register({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'secret123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('register assigns default USER role and returns token response', async () => {
    (prismaMock.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'u1',
        email: 'ana@example.com',
        name: 'Ana',
        roles: [
          {
            role: {
              name: 'USER',
              permissions: [{ permission: { name: 'READ_PROFILE' } }],
            },
          },
        ],
      });

    (prismaMock.user.create as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'ana@example.com',
      name: 'Ana',
      password: 'hashed',
    });

    (prismaMock.role.findUnique as jest.Mock).mockResolvedValue({
      id: 'r1',
      name: 'USER',
    });
    (prismaMock.userRole.create as jest.Mock).mockResolvedValue({});

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    const result = await service.register({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'secret123',
    });

    expect((prismaMock.userRole.create as jest.Mock).mock.calls[0]?.[0]).toEqual({
      data: { userId: 'u1', roleId: 'r1' },
    });
    expect((jwtMock.sign as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    expect(result.user.roles).toEqual(['USER']);
    expect(result.user.permissions).toEqual(['READ_PROFILE']);
  });

  it('login throws UnauthorizedException for invalid credentials', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.login({ email: 'ana@example.com', password: 'bad-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login returns auth response for valid credentials', async () => {
    (prismaMock.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'ana@example.com',
      name: 'Ana',
      password: 'hashed',
      roles: [
        {
          role: {
            name: 'ADMIN',
            permissions: [
              { permission: { name: 'CREATE_USER' } },
              { permission: { name: 'CREATE_USER' } },
            ],
          },
        },
      ],
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: 'ana@example.com',
      password: 'secret123',
    });

    expect(result.access_token).toBe('jwt-token');
    expect(result.user.permissions).toEqual(['CREATE_USER']);
  });
});
