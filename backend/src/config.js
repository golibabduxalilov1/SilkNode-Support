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
  maxFileMb: Number(process.env.MAX_FILE_MB || 20),
  maxFilesPerTicket: 10,
  autoCloseAfterDays: Number(process.env.AUTO_CLOSE_AFTER_DAYS || 3),
  databaseUrl: process.env.DATABASE_URL || '',
  superadminTelegramId: process.env.SUPERADMIN_TELEGRAM_ID || '6964589225',
  // Admin Panelga bazadan mustaqil kirish uchun — bazadagi users jadvaliga
  // umuman bog'liq bo'lmagan, faqat .env orqali boshqariladigan alohida akkaunt.
  superadminUsername: process.env.SUPERADMIN_USERNAME || '',
  superadminPasswordHash: process.env.SUPERADMIN_PASSWORD_HASH || '',
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

// Superadmin ixtiyoriy funksiya — sozlanmagan bo'lsa serverni to'xtatmaymiz,
// faqat administratorga eslatma sifatida ogohlantiruvchi log chiqaramiz.
if (config.env === 'production' && !config.superadminUsername && !config.superadminPasswordHash) {
  console.warn(
    '[config] SUPERADMIN_USERNAME va SUPERADMIN_PASSWORD_HASH sozlanmagan. ' +
      "Bazadan mustaqil superadmin kirish yo'li o'chirilgan holatda qoladi. " +
      "Sozlash uchun: npm run hash-password."
  );
}

// Superadmin bazada saqlanmaydi, shuning uchun oddiy foydalanuvchilar id'siga
// (integer) hech qachon to'g'ri kelmaydigan maxsus, barqaror belgi ishlatiladi.
export const SUPERADMIN_ID = 'superadmin';

export const CATEGORIES = ['erp', 'crm', 'production', 'website', 'telephony', 'email', 'network', 'other'];
export const PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const STATUSES = ['new', 'in_progress', 'waiting_user', 'resolved', 'closed'];
export const OPEN_STATUSES = ['new', 'in_progress', 'waiting_user'];

// Bot xabarlari va Excel eksportlarida ishlatiladigan o'zbekcha nomlar (backend-ichki, UI'dagi
// frontend/src/lib/format.js bilan mazmunan bir xil, lekin alohida — ikki qatlam mustaqil).
export const CATEGORY_LABELS = {
  erp: 'ERP', crm: 'CRM', production: 'Ishlab chiqarish', website: 'Veb-sayt',
  telephony: 'Telefoniya', email: 'Elektron pochta', network: 'Tarmoq', other: 'Boshqa',
};
export const PRIORITY_LABELS = { low: 'Past', medium: "O'rta", high: 'Yuqori', critical: 'Kritik' };
export const STATUS_LABELS = {
  new: 'Yangi', in_progress: 'Ish jarayonida', waiting_user: 'Foydalanuvchi javobi kutilmoqda',
  resolved: 'Hal qilindi', closed: 'Yopildi',
};
