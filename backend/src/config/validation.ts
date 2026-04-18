import * as Joi from 'joi';

/**
 * Joi schema para validar process.env al arranque.
 *
 * Justificación:
 * - Validar al boot evita que el servicio levante con una configuración
 *   insegura (fail-fast en deploys).
 * - Forzamos JWT_SECRET >= 32 chars y prohibimos valores por defecto
 *   conocidos (`change_me`, `secret`, etc.) para que un copy&paste del
 *   .env.example no termine produciendo tokens forjables en producción.
 * - CORS_ORIGIN acepta lista CSV. En producción se rechaza el wildcard
 *   porque combinarlo con credentials:true viola la spec CORS y abre
 *   la puerta a robo de JWT.
 */

const FORBIDDEN_JWT_SECRETS = ['change_me', 'changeme', 'secret', 'test', ''];

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),

  // ---------- Swagger ----------
  SWAGGER_TITLE: Joi.string().default('ZaharDev Gym Manager API'),
  SWAGGER_DESC: Joi.string().default('API'),
  SWAGGER_VERSION: Joi.string().default('1.0.0'),
  SWAGGER_PATH: Joi.string().default('/docs'),

  // ---------- Persistencia ----------
  DATABASE_URL: Joi.string().uri().required(),

  // ---------- Auth ----------
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .custom((value: string, helpers) => {
      if (FORBIDDEN_JWT_SECRETS.includes(value.toLowerCase())) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'forbid weak defaults')
    .messages({
      'string.min': 'JWT_SECRET debe tener al menos 32 caracteres',
      'any.required': 'JWT_SECRET es obligatorio',
      'any.invalid':
        'JWT_SECRET no puede ser un valor por defecto inseguro (change_me, secret, ...)',
    }),
  JWT_EXPIRES_IN: Joi.number().default(3600),

  // ---------- CORS ----------
  // Acepta CSV: "https://app.example.com,https://admin.example.com"
  // En producción NO admitimos "*" (incompatible con credentials:true).
  CORS_ORIGIN: Joi.string()
    .default('http://localhost:3000')
    .custom((value: string, helpers) => {
      const env = process.env.NODE_ENV ?? 'development';
      if (env === 'production' && value.trim() === '*') {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'no wildcard in production')
    .messages({
      'any.invalid':
        'CORS_ORIGIN="*" no está permitido en producción (violaría credentials:true)',
    }),

  // ---------- Rate limiting ----------
  AUTH_THROTTLE_TTL: Joi.number().default(60), // ventana en segundos
  AUTH_THROTTLE_LIMIT: Joi.number().default(10), // intentos por ventana por IP

  // ---------- Feature flags ----------
  ENABLE_DEBUG_ENDPOINTS: Joi.boolean().default(false),
});
