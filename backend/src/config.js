import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 4000),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  botToken: process.env.BOT_TOKEN || '',
  miniAppUrl: process.env.MINIAPP_URL || 'http://localhost:5173/app',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:5173/admin',
  corsOrigin: (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim()),
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileMb: Number(process.env.MAX_FILE_MB || 15),
  databaseUrl: process.env.DATABASE_URL || '',
  pg: {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'silknode',
  },
  devAuthBypass: process.env.DEV_AUTH_BYPASS === '1',
};

export const CATEGORIES = ['erp', 'crm', 'production', 'website', 'telephony', 'email', 'network', 'other'];
export const PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const STATUSES = ['new', 'in_progress', 'waiting_user', 'resolved', 'closed'];
export const OPEN_STATUSES = ['new', 'in_progress', 'waiting_user'];
