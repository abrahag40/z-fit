import { ApiProperty } from '@nestjs/swagger';
import { MembershipStatus } from '@prisma/client';

export class MembershipResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  planId?: string; // ✅ agrega esta línea

  @ApiProperty()
  planName?: string | null;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  status: MembershipStatus;

  @ApiProperty()
  priceSnapshot: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
