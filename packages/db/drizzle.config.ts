import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Загружаем .env из корня проекта
config({ path: '../../.env' });

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
