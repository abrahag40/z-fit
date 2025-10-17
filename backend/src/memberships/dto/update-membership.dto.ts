import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MembershipStatus } from '@prisma/client';

export class UpdateMembershipDto {
  @ApiPropertyOptional({ example: 'Renovación anual' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: '2025-11-16T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ enum: MembershipStatus })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;
}
