import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateMembershipDto {
  @ApiProperty({ example: 'clxUser123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'clxPlan456' })
  @IsString()
  planId: string;

  @ApiPropertyOptional({ example: '2025-11-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}
