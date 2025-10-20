import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateCheckinDto {
  @ApiProperty({ description: 'ID del usuario que intenta acceder' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Nota opcional del registro', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
