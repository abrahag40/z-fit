import { ApiProperty } from '@nestjs/swagger';
import { CheckinStatus } from '@prisma/client';

export class CheckinResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty({ required: false, nullable: true }) membershipId: string | null;
  @ApiProperty({ enum: CheckinStatus }) status: CheckinStatus;
  @ApiProperty() timestamp: Date;
  @ApiProperty({ required: false, nullable: true }) notes: string | null;
}
