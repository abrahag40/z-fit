import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MembershipStatus } from '@prisma/client';

export class CreateMembershipDto {
  @ApiProperty({ example: 'Mensual' })
  @IsString()
  type: string;

  @ApiProperty({ example: '2025-10-16T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-11-16T00:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 500 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ enum: MembershipStatus, default: MembershipStatus.ACTIVE })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @ApiProperty({ example: 'user-id-123' })
  @IsString()
  userId: string;
}
