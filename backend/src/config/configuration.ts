/**
 * Configuración tipada que consume el resto de la app.
 *
 * Importante: la validación Joi ya normalizó y rechazó valores inseguros
 * antes de llegar aquí (ver src/config/validation.ts), así que no
 * repetimos defaults "peligrosos" (p.ej. CORS_ORIGIN="*").
 */
export default () => {
  const corsRaw = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  const corsList = corsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),

    swagger: {
      title: process.env.SWAGGER_TITLE ?? 'ZaharDev Gym Manager API',
      description: process.env.SWAGGER_DESC ?? 'API',
      version: process.env.SWAGGER_VERSION ?? '1.0.0',
      path: process.env.SWAGGER_PATH ?? '/docs',
    },

    cors: {
      // Lista explícita (o ['*'] solo en dev).
      origin: corsList,
    },

    auth: {
      jwtSecret: process.env.JWT_SECRET as string, // Joi garantiza su existencia
      jwtExpiresIn: parseInt(process.env.JWT_EXPIRES_IN ?? '3600', 10),
      throttleTtl: parseInt(process.env.AUTH_THROTTLE_TTL ?? '60', 10),
      throttleLimit: parseInt(process.env.AUTH_THROTTLE_LIMIT ?? '10', 10),
    },

    features: {
      debugEndpoints:
        (process.env.ENABLE_DEBUG_ENDPOINTS ?? 'false').toLowerCase() ===
        'true',
    },
  };
};
