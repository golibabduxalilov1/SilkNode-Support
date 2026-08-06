# Superadmin kirish

Admin Panelga bazadan mustaqil, eng yuqori huquqli kirish yo'li. Bu login/parol
`users` jadvalida saqlanmaydi — faqat server `.env` fayli orqali boshqariladi,
shuning uchun uni faqat serverga fizik/deploy huquqi bor odam o'zgartira oladi.

## Sozlash

1. `npm run hash-password` buyrug'ini ishga tushiring va parolni kiriting.
2. Chiqqan `SUPERADMIN_PASSWORD_HASH` qiymatini `backend/.env` fayliga qo'shing.
3. `SUPERADMIN_USERNAME` qiymatini ham `.env` faylida belgilang.
4. Serverni qayta ishga tushiring.

Kirish uchun Admin Panel login sahifasida shu username/parol yetarli — token
oddiy admin kabi ishlaydi, lekin bazada hech qanday foydalanuvchi qatori
yaratilmaydi.

## Muhim ogohlantirishlar

- **Production serverga chiqarishda `SUPERADMIN_PASSWORD_HASH`ni albatta
  o'zgartiring.** `.env.example` fayldagi standart qiymatlar faqat namuna
  uchun, ular hech qachon haqiqiy muhitda ishlatilmasligi kerak.
- Parolni oddiy matn holida hech qayerda saqlamang — faqat bcrypt hash
  (`SUPERADMIN_PASSWORD_HASH`) `.env` faylida saqlanadi.
- `SUPERADMIN_PASSWORD_HASH` qiymati (yoki asl parol) hech qachon chatda,
  kod repozitoriyida, commit xabarlarida yoki jamoat kanallarida
  ulashilmasligi kerak — bu eng yuqori huquqli akkaunt.
- `.env` fayli `.gitignore` orqali git tomonidan kuzatilmaydi; faqat
  `.env.example` (placeholder qiymatlar bilan) repozitoriyda saqlanadi.
