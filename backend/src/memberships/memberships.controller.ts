import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Req,
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

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateMembershipDto) {
    return this.service.create(dto);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.service.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
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
}
