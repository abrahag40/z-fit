import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@ApiTags('checkin')
@ApiBearerAuth()
@Controller('checkin')
export class CheckinController {
  constructor(private readonly service: CheckinService) {}

  // ---------------------------------------------------------
  // 🟢 1. Registrar un check-in (entrada al gimnasio)
  // ---------------------------------------------------------
  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Registrar check-in de usuario',
    description:
      'Valida membresía activa. Si no existe, registra el intento como DENIED y lanza 403.',
  })
  @ApiResponse({ status: 201, description: 'Check-in registrado exitosamente.' })
  @ApiResponse({ status: 403, description: 'Usuario sin membresía activa.' })
  async register(@Body() dto: CreateCheckinDto) {
    return this.service.register(dto);
  }

  // ---------------------------------------------------------
  // 🧾 2. Listar todos los check-ins (solo admin o staff)
  // ---------------------------------------------------------
  @Get()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Listar todos los check-ins' })
  @ApiResponse({ status: 200, description: 'Listado completo de check-ins.' })
  async findAll() {
    return this.service.findAll();
  }

  // ---------------------------------------------------------
  // 👤 3. Check-ins de un usuario específico
  // ---------------------------------------------------------
  @Get('user/:userId')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Listar check-ins de un usuario' })
  async findByUser(@Param('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  // ---------------------------------------------------------
  // 📅 4. Check-ins realizados hoy
  // ---------------------------------------------------------
  @Get('today')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Listar check-ins del día actual' })
  async findToday() {
    return this.service.findToday();
  }
}
