import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Matches,
  IsOptional,
  MaxLength,
} from 'class-validator';

/**
 * Regla de contraseña:
 *  - Mínimo 10 chars
 *  - Al menos 1 minúscula, 1 mayúscula, 1 dígito y 1 símbolo
 *
 * Rationale: OWASP ASVS L1 recomienda ≥ 8 chars + complejidad
 * o ≥ 12 sin complejidad. Tomamos un punto medio pragmático
 * para un MVP B2B.
 */
const PASSWORD_POLICY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[\S]{10,72}$/;

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(254) // límite práctico RFC 5321
  email: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({
    example: 'StrongPass123!',
    description:
      'Mínimo 10 caracteres, una mayúscula, una minúscula, un dígito y un símbolo.',
  })
  @IsString()
  @Matches(PASSWORD_POLICY, {
    message:
      'La contraseña debe tener al menos 10 caracteres e incluir mayúscula, minúscula, dígito y símbolo.',
  })
  password: string;
}
