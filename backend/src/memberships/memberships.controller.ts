import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Req,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('memberships')
@ApiBearerAuth()
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly service: MembershipsService) {}

  // ✅ ADMIN crea membresías
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateMembershipDto) {
    return this.service.create(dto);
  }

  // ✅ Cualquier usuario autenticado puede listar según su rol
  @Get()
  findAll(@Req() req: any) {
    const { userId, role } = req.user;
    return this.service.findAll(role, userId);
  }

  // ✅ ADMIN consulta membresías por usuario (útil para dashboards)
  @Roles(Role.ADMIN)
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  // ✅ ADMIN o CLIENT puede ver una membresía (control en service)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const { userId, role } = req.user;
    return this.service.findById(id, userId, role);
  }

  // ✅ ADMIN actualiza membresías
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMembershipDto) {
    return this.service.update(id, dto);
  }

  // ✅ ADMIN elimina membresías
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ✅ ADMIN renueva membresía (+días)
  @Roles(Role.ADMIN)
  @Post(':id/renew')
  renewMembership(@Param('id') id: string, @Query('days') days: string) {
    const extraDays = parseInt(days, 10) || 30;
    return this.service.renewMembership(id, extraDays);
  }

  // ✅ ADMIN ejecuta expiración automática
  @Roles(Role.ADMIN)
  @Post('check-expired')
  checkExpired() {
    return this.service.checkExpiredMemberships();
  }

  // ✅ ADMIN puede inspeccionar candidatos a expirar (debug)
  @Roles(Role.ADMIN)
  @Get('debug/candidates-expire')
  debugCandidates() {
    return this.service.previewExpiredCandidates();
  }
}
