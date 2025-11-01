import { KnexPgAdapter } from '@kottster/server';
import knex from 'knex';
import fs from 'fs'
import path from 'path'

/**
/**
 * Learn more at https://knexjs.org/guide/#configuration-options
 */
const client = knex({
  client: 'pg',
  // connection: 'postgresql://postgres:omar@localhost:5432/mukhtaser',
    connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync(path.join(__dirname, '../../../../', './ca.pem')).toString(), // path to your cert
    },
  },
  searchPath: ['public'],
});

export default new KnexPgAdapter(client);