import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CheckinService } from './checkin.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('checkin')
@ApiBearerAuth()
@Controller('checkin')
export class CheckinController {
  constructor(private readonly service: CheckinService) {}

  @Post()
  register(@Body() dto: CreateCheckinDto) {
    return this.service.registerCheckin(dto);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  @Roles(Role.ADMIN, Role.STAFF)
  @Get('today')
  findToday() {
    return this.service.findToday();
  }
}
