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
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedUser } from '../auth/types/jwt-payload';
import { Role } from '@prisma/client';

/**
 * MembershipsController
 * ------------------------------------------------------------------
 * Cambio de seguridad del Sprint 1:
 *
 * Los endpoints /debug/* quedan detrás de:
 *   1) @Roles(ADMIN) (antes admitían STAFF también).
 *   2) Feature flag ENABLE_DEBUG_ENDPOINTS; si está en false el
 *      endpoint responde 403 incluso a ADMIN. Esto evita exponer
 *      datos sensibles en producción por error de configuración.
 */
@ApiTags('memberships')
@ApiBearerAuth()
@Controller('memberships')
export class MembershipsController {
  private readonly logger = new Logger(MembershipsController.name);

  constructor(
    private readonly service: MembershipsService,
    private readonly cfg: ConfigService,
  ) {}

  // -------- CRUD --------

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateMembershipDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Req() req: { user: AuthenticatedUser }) {
    const { userId, role } = req.user;
    return this.service.findAll(role, userId);
  }

  @Roles(Role.ADMIN)
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: AuthenticatedUser }) {
    const { userId, role } = req.user;
    return this.service.findById(id, userId, role);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMembershipDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/renew')
  renewMembership(@Param('id') id: string, @Query('days') days: string) {
    const extraDays = parseInt(days, 10) || 30;
    return this.service.renewMembership(id, extraDays);
  }

  @Roles(Role.ADMIN)
  @Post('check-expired')
  checkExpired() {
    return this.service.checkExpiredMemberships();
  }

  // -------- DEBUG (protegido por feature flag) --------

  @Roles(Role.ADMIN)
  @Get('debug/candidates-expire')
  debugCandidates() {
    this.assertDebugEnabled();
    return this.service.previewExpiredCandidates();
  }

  @Roles(Role.ADMIN)
  @Get('debug/full')
  async debugFull() {
    this.assertDebugEnabled();
    const data = await this.service.findAllWithRelationsRaw();
    this.logger.debug(`🧩 /memberships/debug/full → ${data.length} registros`);
    return data;
  }

  /**
   * Guard de runtime para endpoints de diagnóstico.
   * Usamos 403 (no 404) para dejar constancia en logs/observabilidad
   * de intentos por parte de usuarios con rol ADMIN cuando el flag
   * está apagado.
   */
  private assertDebugEnabled(): void {
    const enabled = this.cfg.get<boolean>('ENABLE_DEBUG_ENDPOINTS') === true;
    if (!enabled) {
      throw new ForbiddenException('Debug endpoints deshabilitados');
    }
  }
}
