import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiTooManyRequestsResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

/**
 * /auth
 *
 * Endpoints públicos con throttling estricto (bucket 'auth' definido
 * en AppModule). Esto mitiga brute-force y enumeration sin cambiar
 * la UX de usuarios legítimos.
 */
@ApiTags('auth')
@Controller('auth')
@Throttle({ auth: { limit: 10, ttl: 60_000 } })
@ApiTooManyRequestsResponse({ description: 'Demasiados intentos' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @Throttle({ auth: { limit: 5, ttl: 60_000 } }) // más estricto para login
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
