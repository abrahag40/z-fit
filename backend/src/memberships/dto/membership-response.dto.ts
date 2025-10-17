import { ApiProperty } from '@nestjs/swagger';
import { MembershipStatus } from '@prisma/client';

export class MembershipResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty({ enum: MembershipStatus })
  status: MembershipStatus;

  @ApiProperty()
  price?: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
