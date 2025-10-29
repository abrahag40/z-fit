import { ApiProperty } from '@nestjs/swagger';

export class MetricsResponseDto {
  @ApiProperty()
  checkins_today: number;

  @ApiProperty()
  active_memberships: number;

  @ApiProperty()
  expired_memberships: number;

  @ApiProperty()
  expiring_soon: number;

  @ApiProperty()
  timestamp: Date;
}
