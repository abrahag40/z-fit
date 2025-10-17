import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService['usersRepo'].findByEmail(dto.email);
    if (existing) throw new BadRequestException('El email ya está registrado');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService['usersRepo'].create({
      email: dto.email,
      name: dto.name,
      passwordHash: hash,
    });

    return this.buildToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService['usersRepo'].findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    // Actualizar última conexión
    await this.usersService['usersRepo'].update(user.id, { lastLoginAt: new Date() });

    return this.buildToken(user);
  }

  private buildToken(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload);

    const { passwordHash, ...userData } = user;
    return { accessToken, user: userData as UserResponseDto };
  }
}
