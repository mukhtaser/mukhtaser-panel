import { createApp, createIdentityProvider } from '@kottster/server';
import schema from '../../kottster-app.json';
import { getEnvOrThrow } from '@kottster/common';

const SECRET_KEY = getEnvOrThrow('SECRET_KEY');
const JWT_SECRET_SALT = getEnvOrThrow('JWT_SECRET_SALT');
const ROOT_USER_PASSWORD = getEnvOrThrow('ROOT_USER_PASSWORD');
const ROOT_USERNAME = getEnvOrThrow('ROOT_USERNAME');
const API_TOKEN = getEnvOrThrow('API_TOKEN');

/* 
 * For security, consider moving the secret data to environment variables.
 * See https://kottster.app/docs/deploying#before-you-deploy
 */
export const app = createApp({
  schema,
  secretKey: SECRET_KEY, 
  kottsterApiToken: API_TOKEN , 

  /*
   * The identity provider configuration.
   * See https://kottster.app/docs/app-configuration/identity-provider
   */
  identityProvider: createIdentityProvider('sqlite', {
    fileName: 'app.db',

    passwordHashAlgorithm: 'bcrypt',
    jwtSecretSalt: JWT_SECRET_SALT,

    /* The root admin user credentials */
    rootUsername: ROOT_USERNAME,
    rootPassword: ROOT_USER_PASSWORD,
  }),
});