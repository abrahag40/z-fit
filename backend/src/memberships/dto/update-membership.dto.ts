import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MembershipStatus } from '@prisma/client';

export class UpdateMembershipDto {
  @ApiPropertyOptional({ example: 'clx123planid456' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ example: '2025-11-16T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsNumber()
  priceSnapshot?: number;

  @ApiPropertyOptional({ example: 'MXN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ enum: MembershipStatus })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;
}
