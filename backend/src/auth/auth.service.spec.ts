import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';

// bcrypt se mockea por módulo completo: sus exports son no-configurables
// y jest.spyOn(bcrypt, '...') no funciona en el runtime de Node actual.
jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => '$2b$10$hash'),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';
const bcryptMock = bcrypt as unknown as {
  hash: jest.Mock;
  compare: jest.Mock;
};

/**
 * Contract tests del refactor del Sprint 1:
 *  - AuthService ya no accede a la propiedad privada de UsersService.
 *  - AuthService depende SÓLO de UsersRepository y JwtService.
 *  - El passwordHash nunca debe aparecer en la respuesta.
 */
describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: jest.Mocked<UsersRepository>;
  let jwt: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice',
    passwordHash: '$2b$10$hash',
    role: Role.CLIENT,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    lastLoginAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed-token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersRepo = module.get(UsersRepository);
    jwt = module.get(JwtService);
  });

  describe('register', () => {
    it('rechaza email existente', async () => {
      usersRepo.findByEmail.mockResolvedValue(mockUser);
      await expect(
        service.register({
          email: 'alice@example.com',
          password: 'StrongPass1!',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(usersRepo.create).not.toHaveBeenCalled();
    });

    it('crea usuario y retorna token sin passwordHash', async () => {
      usersRepo.findByEmail.mockResolvedValue(null);
      usersRepo.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'alice@example.com',
        password: 'StrongPass1!',
      });

      expect(usersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'alice@example.com',
          passwordHash: expect.any(String),
        }),
      );
      expect(result.accessToken).toBe('signed-token');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(jwt.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });
  });

  describe('login', () => {
    it('falla con email inexistente (mensaje genérico)', async () => {
      usersRepo.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@x.com', password: 'whatever1!' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('falla con contraseña incorrecta (mensaje genérico)', async () => {
      usersRepo.findByEmail.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(false);
      await expect(
        service.login({ email: mockUser.email, password: 'bad' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('actualiza lastLoginAt y devuelve token sin passwordHash', async () => {
      usersRepo.findByEmail.mockResolvedValue(mockUser);
      usersRepo.update.mockResolvedValue(mockUser);
      bcryptMock.compare.mockResolvedValue(true);

      const result = await service.login({
        email: mockUser.email,
        password: 'StrongPass1!',
      });

      expect(usersRepo.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });
});
