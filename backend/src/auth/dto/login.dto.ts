import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * En login NO aplicamos la policy completa (igual que la de register)
 * porque usuarios existentes podrían tener contraseñas legadas; sólo
 * validamos que sea string no trivial para evitar payload ruido.
 */
export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  @MinLength(6)
  @MaxLength(72) // bcrypt trunca a 72 bytes
  password: string;
}
