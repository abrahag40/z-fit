import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existing = await this.usersRepo.findByEmail(dto.email);
    if (existing) throw new BadRequestException('El email ya está registrado');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersRepo.create({
      email: dto.email,
      name: dto.name,
      role: dto.role,
      passwordHash: hash,
    });

    return this.toResponse(user);
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepo.findAll();
    return users.map(u => this.toResponse(u));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    let passwordHash: string | undefined;
    if (dto.password) passwordHash = await bcrypt.hash(dto.password, 10);

    const updated = await this.usersRepo.update(id, {
      name: dto.name,
      role: dto.role,
      isActive: dto.isActive,
      ...(passwordHash && { passwordHash }),
    });

    return this.toResponse(updated);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepo.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.usersRepo.delete(id);
  }

  private toResponse(user: any): UserResponseDto {
    const { passwordHash, ...result } = user;
    return result as UserResponseDto;
  }
}
