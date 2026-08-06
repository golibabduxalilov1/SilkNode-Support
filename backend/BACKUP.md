# Zaxira nusxalash (Backup)

TZ 15.2-band: "Ma'lumotlar bazasining kunlik avtomatik backup'i" va "Fayllar
(attachments) uchun alohida saqlash joyi va uning backup'i". Bu hujjat tavsiya
etilgan strategiyani tavsiflaydi — haqiqiy infratuzilma (server, cron, bulutli
saqlash) loyiha kodidan tashqarida, deploy vaqtida sozlanadi.

## PostgreSQL — kunlik backup

Serverda (yoki alohida backup xostida) kunlik `cron` job:

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%Y-%m-%d)
pg_dump "$DATABASE_URL" | gzip > "/backups/silknode-$STAMP.sql.gz"
# 30 kundan eski nusxalarni o'chirish
find /backups -name 'silknode-*.sql.gz' -mtime +30 -delete
```

`crontab -e`:

```
0 3 * * * /opt/silknode/backup-db.sh >> /var/log/silknode-backup.log 2>&1
```

Tiklash uchun: `gunzip -c silknode-2026-08-06.sql.gz | psql "$DATABASE_URL"`.

## Fayllar (`uploads/`)

MVP bosqichida fayllar `UPLOAD_DIR` (standart `./uploads`) papkasida disk
ustida saqlanadi. Tavsiya etiladi:

- Production muhitida `UPLOAD_DIR`ni S3-mos object storage (MinIO / AWS S3)
  bilan mount qilish yoki fayllarni to'g'ridan-to'g'ri shu xizmatga yozadigan
  qilib `middleware/upload.js`ni kengaytirish (TZ 17-bo'lim texnologik stek
  tavsiyasi).
- Disk ustida saqlanayotgan paytda `uploads/`ni ham DB bilan bir xil kunlik
  jadvalda (`rsync`/`tar` orqali) alohida backup joyiga nusxalash.

## Nazorat

Backup fayllari muntazam ravishda (masalan, oyiga bir marta) real muhitga
tiklab ko'rilishi tavsiya etiladi — fayl mavjudligi backup'ning ishlashini
kafolatlamaydi.
