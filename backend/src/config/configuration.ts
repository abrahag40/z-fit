
export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  swagger: {
    title: process.env.SWAGGER_TITLE ?? 'ZaharDev Gym Manager API',
    description: process.env.SWAGGER_DESC ?? 'API',
    version: process.env.SWAGGER_VERSION ?? '1.0.0',
    path: process.env.SWAGGER_PATH ?? '/docs',
  },
  cors: {
    origin: (process.env.CORS_ORIGIN ?? '*').split(',').map(s => s.trim()),
  },
});
