import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileTypeFromFile } from 'file-type';
import { config } from '../config.js';

fs.mkdirSync(config.uploadDir, { recursive: true });

// TZ 4.2-band: ruxsat etilgan formatlar aniq ro'yxati.
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf', 'docx', 'xlsx', 'txt', 'log', 'zip'];
const EXT_RE = new RegExp(`\\.(${ALLOWED_EXTENSIONS.join('|')})$`, 'i');

// Magic-byte orqali tekshirib bo'lmaydigan (oddiy matn) kengaytmalar — kengaytmaga ishoniladi.
const TEXT_EXTENSIONS = new Set(['txt', 'log']);

// file-type kutubxonasi shu kengaytmalar uchun qaytarishi kutilgan MIME turlari.
// docx/xlsx OOXML formatlari ichida oddiy ZIP arxivi bo'lgani uchun ikkalasi ham qabul qilinadi.
const EXPECTED_MIME = {
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  pdf: ['application/pdf'],
  zip: ['application/zip'],
  docx: ['application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xlsx: ['application/zip', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: config.maxFileMb * 1024 * 1024, files: config.maxFilesPerTicket },
  fileFilter: (_req, file, cb) => {
    if (!EXT_RE.test(file.originalname)) {
      return cb(Object.assign(new Error("Fayl turi qo'llab-quvvatlanmaydi"), { status: 400 }));
    }
    cb(null, true);
  },
});

/**
 * multer'dan keyin ishlatiladi: fayl kengaytmasi haqiqiy tarkibiga (magic bytes) mos kelishini
 * qayta tekshiradi — TZ 4.2: "kamida MIME-type serverda qayta tekshiriladi (faqat kengaytma emas)".
 * Mos kelmasa fayl diskdan o'chiriladi va so'rov rad etiladi.
 */
export async function verifyUploadedFiles(req, res, next) {
  const files = req.files || (req.file ? [req.file] : []);
  try {
    for (const file of files) {
      const ext = path.extname(file.originalname).slice(1).toLowerCase();
      if (TEXT_EXTENSIONS.has(ext)) continue;
      const detected = await fileTypeFromFile(file.path);
      const expected = EXPECTED_MIME[ext] || [];
      if (!detected || !expected.includes(detected.mime)) {
        await fs.promises.unlink(file.path).catch(() => {});
        return res.status(400).json({ error: `Fayl tarkibi kengaytmasiga mos kelmadi: ${file.originalname}` });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}
