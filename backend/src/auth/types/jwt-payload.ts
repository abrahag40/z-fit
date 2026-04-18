import { Role } from '@prisma/client';

/**
 * Shape del payload firmado por JwtService.sign().
 * Centralizarlo evita drift entre AuthService, JwtStrategy y el
 * middleware de sockets.
 */
export interface JwtPayload {
  sub: string; // user.id
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

/**
 * Forma del objeto que los guards depositan en `req.user` /
 * `socket.data.user` tras validar el token.
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
}
