import { app } from '../../_server/app';
import { getEnvOrThrow } from '@kottster/common';

export const BACKEND_URL = getEnvOrThrow('BACKEND_URL');
/*
 * Custom server procedures for your page
 * 
 * These functions run on the server and can be called from your React components
 * using callProcedure('procedureName', input)
 * 
 * Learn more: https://kottster.app/docs/custom-pages/api
 */

const controller = app.defineCustomController({
  // Define your procedures here
  // For example:
  // getMessage: async (input) => {
  //   return { message: `Hello, ${input.name}!` };
  // },
});

export default controller;