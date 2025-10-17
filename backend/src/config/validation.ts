import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(3000),

  SWAGGER_TITLE: Joi.string().default('ZaharDev Gym Manager API'),
  SWAGGER_DESC: Joi.string().default('API'),
  SWAGGER_VERSION: Joi.string().default('1.0.0'),
  SWAGGER_PATH: Joi.string().default('/docs'),

  DATABASE_URL: Joi.string().uri().required(),

  JWT_SECRET: Joi.string().default('change_me'),
  JWT_EXPIRES_IN: Joi.number().default(3600),

  CORS_ORIGIN: Joi.string().default('*'),
});
