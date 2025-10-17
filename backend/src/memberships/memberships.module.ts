import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { MembershipsRepository } from './memberships.repository';

@Module({
  controllers: [MembershipsController],
  providers: [MembershipsService, MembershipsRepository],
})
export class MembershipsModule {}
