import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { UsersRepository } from '../users/users.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { JwtPayload } from './types/jwt-payload';

/**
 * AuthService
 * ------------------------------------------------------------------
 * Antes este servicio accedía al repositorio vía
 * `usersService['usersRepo']`, rompiendo encapsulamiento.
 * Ahora inyectamos `UsersRepository` directamente (está exportado por
 * `UsersModule`) y mantenemos `UsersService` desacoplado.
 *
 * También uniformamos el mensaje de error en login para no filtrar
 * si el email existe o no (mitigación simple de user enumeration).
 */
@Injectable()
export class AuthService {
  private static readonly BCRYPT_ROUNDS = 10;
  private static readonly INVALID_CREDENTIALS = 'Credenciales inválidas';

  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      AuthService.BCRYPT_ROUNDS,
    );

    const user = await this.usersRepo.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });

    return this.buildToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException(AuthService.INVALID_CREDENTIALS);
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException(AuthService.INVALID_CREDENTIALS);
    }

    // Fire-and-update: actualizar lastLoginAt no debe bloquear la
    // emisión del token si la DB va lenta. Lo envolvemos pero
    // esperamos para que los tests sean deterministas.
    await this.usersRepo.update(user.id, { lastLoginAt: new Date() });

    return this.buildToken(user);
  }

  private buildToken(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwt.sign(payload);

    // Construcción explícita del DTO: evita filtrar passwordHash
    // aunque User crezca en el schema.
    const userData: UserResponseDto = {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    return { accessToken, user: userData };
  }
}
