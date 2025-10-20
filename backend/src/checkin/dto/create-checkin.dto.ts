import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, IsOptional } from 'class-validator';

export class CreateCheckinDto {
  @ApiProperty()
  @IsString()
  @Matches(/^[a-z0-9]{25,}|[0-9a-fA-F-]{36}$/)
  userId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
