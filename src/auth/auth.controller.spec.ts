import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('delegates register to service', async () => {
    const dto = {
      name: 'Ana',
      email: 'ana@example.com',
      password: 'secret123',
    };
    const expected = {
      access_token: 'token',
      user: {
        id: '1',
        email: dto.email,
        name: dto.name,
        roles: ['USER'],
        permissions: [],
      },
    };

    authService.register.mockResolvedValue(expected);

    await expect(controller.register(dto)).resolves.toEqual(expected);
    expect(authService.register.mock.calls[0]?.[0]).toEqual(dto);
  });

  it('delegates login to service', async () => {
    const dto = { email: 'ana@example.com', password: 'secret123' };
    const expected = {
      access_token: 'token',
      user: {
        id: '1',
        email: dto.email,
        name: 'Ana',
        roles: ['USER'],
        permissions: [],
      },
    };

    authService.login.mockResolvedValue(expected);

    await expect(controller.login(dto)).resolves.toEqual(expected);
    expect(authService.login.mock.calls[0]?.[0]).toEqual(dto);
  });
});
