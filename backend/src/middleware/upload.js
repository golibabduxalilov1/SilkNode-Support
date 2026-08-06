import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { config } from '../config.js';

fs.mkdirSync(config.uploadDir, { recursive: true });

const ALLOWED = /\.(png|jpe?g|gif|webp|pdf|txt|log|csv|xlsx?|docx?|zip|rar|7z)$/i;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: config.maxFileMb * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.test(file.originalname)) return cb(new Error("Fayl turi qo'llab-quvvatlanmaydi"));
    cb(null, true);
  },
});
