import 'dotenv/config';

const miniAppUrl = process.env.MINIAPP_URL || 'http://localhost:5173/app';
const adminUrl = process.env.ADMIN_URL || 'http://localhost:5173/admin';

// CORS_ORIGIN aniq ko'rsatilmasa, faqat mini app va admin panel ishlatadigan
// domenlarga (MINIAPP_URL / ADMIN_URL) toraytiramiz — hech qachon "*" ga emas.
const defaultCorsOrigins = [...new Set([miniAppUrl, adminUrl].map((u) => new URL(u).origin))];

export const config = {
  port: Number(process.env.PORT || 4000),
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  botToken: process.env.BOT_TOKEN || '',
  miniAppUrl,
  adminUrl,
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : defaultCorsOrigins,
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

// Production muhitida xavfli lokal sozlamalar tasodifan yoqilib qolmasligi kerak —
// bunday holatda serverni butunlay ishga tushirmaymiz.
if (config.env === 'production' && config.devAuthBypass) {
  console.error(
    '[config] DEV_AUTH_BYPASS=1 production muhitida (NODE_ENV=production) yoqilgan. ' +
      'Bu initData tekshiruvini butunlay chetlab o\'tishga imkon beradi. Serverni ishga tushirish to\'xtatildi.'
  );
  process.exit(1);
}

if (config.env === 'production' && !config.botToken) {
  console.error(
    '[config] BOT_TOKEN production muhitida sozlanmagan. ' +
      "Telegram initData imzosini tekshirib bo'lmaydi, bu autentifikatsiyani soxtalashtirishga imkon beradi. Serverni ishga tushirish to'xtatildi."
  );
  process.exit(1);
}

export const CATEGORIES = ['erp', 'crm', 'production', 'website', 'telephony', 'email', 'network', 'other'];
export const PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const STATUSES = ['new', 'in_progress', 'waiting_user', 'resolved', 'closed'];
export const OPEN_STATUSES = ['new', 'in_progress', 'waiting_user'];
