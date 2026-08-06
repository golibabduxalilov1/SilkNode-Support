import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 20000,
    hookTimeout: 20000,
    // Testlar bitta umumiy Postgres bazasini ishlatadi (har testdan oldin TRUNCATE qilinadi) —
    // parallel fork'lar bir-birining ma'lumotini buzmasligi uchun ketma-ket ishlaydi.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    // `env` — vitest test fayllari import qilinishidan OLDIN process.env'ga yoziladi (setupFiles'dan
    // farqli o'laroq collection bosqichida ham amal qiladi), shuning uchun config.js/dotenv bu
    // qiymatlarni haqiqiy .env fayl o'rniga ishlatadi.
    env: {
      NODE_ENV: 'test',
      PGHOST: 'localhost',
      PGPORT: '5432',
      PGUSER: 'postgres',
      PGPASSWORD: '2002',
      PGDATABASE: 'silknode_test',
      JWT_SECRET: 'test-secret',
      BOT_TOKEN: '123456:test-bot-token-for-hmac',
      DEV_AUTH_BYPASS: '0',
      CORS_ORIGIN: 'http://localhost:5173',
      MINIAPP_URL: 'http://localhost:5173/app',
      ADMIN_URL: 'http://localhost:5173/admin',
      AUTO_CLOSE_AFTER_DAYS: '3',
      SUPERADMIN_USERNAME: '',
      SUPERADMIN_PASSWORD_HASH: '',
    },
  },
});
