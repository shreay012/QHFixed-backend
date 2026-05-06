/**
 * Drizzle Kit config — used for CLI commands like `drizzle-kit push:pg`
 * and `drizzle-kit generate:pg` during the strangler-fig migration.
 *
 * The schema file uses ESM imports; Drizzle Kit reads it directly.
 * Connection string is sourced from the same env.PG_URL the app uses.
 */

import 'dotenv/config';

export default {
  schema: './src/db/schema.js',
  out:    './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.PG_URL || 'postgresql://localhost:5432/quickhire',
  },
  verbose: true,
  strict: true,
};
