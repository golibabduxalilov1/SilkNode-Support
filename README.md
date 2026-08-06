# Silknode Support — Service Desk (MVP)

Texnik topshiriq asosida ishlab chiqilgan ichki Service Desk tizimi.
Stek: Express.js (REST API) + React.js (Vite) + PostgreSQL + Telegram Bot/Mini App.

## Tarkib

    backend/                    Express.js REST API
      src/index.js              server, route larni ulash, xatolarni qayta ishlash
      src/db.js                 PostgreSQL ulanishi, sxema va boshlangich malumotlar
      src/config.js             .env va lugatlar (kategoriya, status, muhimlik)
      src/lib/telegram.js       initData imzosini tekshirish + bildirishnoma yuborish
      src/lib/jwt.js            JWT token
      src/middleware/           auth (rol tekshirish), upload (multer)
      src/services/tickets.service.js   biznes-logika: time tracking, status oqimi
      src/routes/               auth, tickets, organizations, dashboard, users, files
      src/bot/bot.js            Telegram bot (/start -> Mini App tugmasi)
      src/seed.js               demo malumotlar

    frontend/                   React.js (bitta build, ikkita zona)
      src/miniapp/              Telegram Mini App  -> /app
      src/admin/                Web Admin Panel    -> /admin
      src/lib/                  api klient, auth konteksti, Telegram SDK, formatlash
      src/styles/app.css        dizayn tokenlari va komponent stillari

## Ishga tushirish

1. Backend

       cd backend
       cp .env.example .env      # BOT_TOKEN va MINIAPP_URL ni toldiring
       npm install
       npm run seed              # ixtiyoriy: demo malumotlar
       npm run dev               # http://localhost:4000/api

2. Frontend

       cd frontend
       npm install
       npm run dev               # http://localhost:5173

   Mini App:      http://localhost:5173/app
   Admin Panel:   http://localhost:5173/admin

3. Telegram bot (BOT_TOKEN kiritilgandan keyin)

       cd backend
       npm run bot

## Kirish malumotlari (seed dan keyin)

    admin / admin123    — administrator (tashkilotlar, xodimlar, barcha murojaatlar)
    agent / agent123    — texnik mutaxassis

Mini App Telegram ichida ochilganda foydalanuvchi initData orqali avtomatik
autentifikatsiya qilinadi. Brauzerda lokal test uchun .env dagi DEV_AUTH_BYPASS=1
test foydalanuvchisini yaratadi. Productionda uni 0 ga oting.

## Telegram sozlash

1. BotFather da bot yarating, tokenni .env ga yozing.
2. BotFather -> /setmenubutton orqali Mini App URL ni korsating: https://domen.uz/app
3. MINIAPP_URL ni .env da ayni shu manzilga tenglashtiring — bildirishnomadagi
   "Murojaatni ochish" tugmasi shu manzilga ticket id bilan otadi.
4. Telegram faqat HTTPS manzillarni qabul qiladi (lokal test uchun ngrok mos keladi).

## REST API

    POST   /api/auth/telegram          initData orqali kirish (Mini App)
    POST   /api/auth/login             login/parol orqali kirish (Admin Panel)
    GET    /api/auth/me                joriy foydalanuvchi

    GET    /api/organizations          tashkilotlar royxati
    POST   /api/organizations          yangi tashkilot (admin)
    PATCH  /api/organizations/:id      nomi / faollik holati (admin)

    GET    /api/tickets                filtrlar: status, organization_id, category,
                                       priority, assigned_to, q, page, limit, scope
    POST   /api/tickets                murojaat yaratish (multipart, files[])
    GET    /api/tickets/:id            murojaat + suhbat + fayllar
    POST   /api/tickets/:id/messages   xabar yuborish (multipart, files[])
    PATCH  /api/tickets/:id/status     status ozgartirish
    PATCH  /api/tickets/:id/assign     ijrochini tayinlash
    GET    /api/tickets/meta/dictionaries   lugatlar

    GET    /api/dashboard/summary      dashboard korsatkichlari
    GET    /api/users/staff            texnik xodimlar royxati
    POST   /api/users/staff            yangi xodim (admin)
    GET    /api/files/:id              faylni yuklab olish (huquq tekshiriladi)

Barcha himoyalangan endpointlar `Authorization: Bearer <token>` sarlavhasini talab qiladi.

## Statuslar va avtomatik oqim

    new           murojaat yaratildi
    in_progress   ijrochi tayinlandi yoki foydalanuvchi javob qaytardi
    waiting_user  texnik mutaxassis javob berdi
    resolved      hal qilindi (closed_at va resolution_minutes yoziladi)
    closed        yopildi

Time tracking avtomatik: birinchi mutaxassis javobida first_response_at va
first_response_minutes, yopilganda closed_at va resolution_minutes hisoblanadi.

## Huquqlar

    user    faqat oz murojaatlarini koradi va yaratadi, ozi yopishi mumkin
    agent   barcha murojaatlar, javob berish, status va ijrochi ozgartirish
    admin   agent huquqlari + tashkilotlar va xodimlarni boshqarish

## Production uchun eslatmalar

- JWT_SECRET ni ozgartiring, DEV_AUTH_BYPASS=0 qiling.
- SPA marshrutlari uchun nginx da fallback yozing:

      location /api/ { proxy_pass http://127.0.0.1:4000; }
      location / { try_files $uri /index.html; }

- Yuklangan fayllar backend/uploads da saqlanadi — zaxira nusxaga qoshing.
- Malumotlar bazasi PostgreSQL. Ulanish backend/.env dagi DATABASE_URL yoki
  PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE orqali sozlanadi. Server ishga
  tushganda (npm run dev / npm start) sxema avtomatik yaratiladi.

## Kelajakdagi kengaytmalar (arxitektura tayyor)

SLA taymerlari (tickets jadvaliga sla_due_at qoshiladi), KPI hisobotlari,
Analytics/Reports eksporti, ERP integratsiyasi uchun webhook qatlami.
