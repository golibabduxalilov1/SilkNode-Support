import { useEffect, useState } from 'react';
import { waitForTg } from './telegram.js';

// Telegram Mini App SDK ba'zi WebView muhitlarida (masalan, Telegram Desktop'ning
// eski ichki brauzer dvigateli) window.Telegram.WebApp'ni sahifa yuklanishidan
// bir necha yuz millisoniya kech yaratishi mumkin. Login oqimi (auth.jsx) xuddi
// shu vaqtni kutadi — bu yerda ham shunga moslashtiramiz, aks holda bu tekshiruv
// login ulgurmasdan turib "Telegram emas" deb noto'g'ri xulosa chiqarib qo'yishi mumkin.
const TG_WAIT_MS = 3000;

/**
 * Lokal test uchun mo'ljallangan bypass — faqat `vite dev` rejimida va
 * VITE_DEV_AUTH_BYPASS=1 aniq yoqilganda ishlaydi. Production build'da
 * import.meta.env.DEV har doim false bo'lgani uchun bu yerda ishlamaydi.
 */
const DEV_BYPASS = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === '1';

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';

/**
 * Eng tashqi qatlamda ilova haqiqatan ham Telegram WebView ichida ochilganini
 * tekshiradi (window.Telegram.WebApp.initData mavjudligi orqali). Bu faqat
 * kosmetik himoya — asosiy tekshiruv backend'da initData imzosini tasdiqlash
 * orqali amalga oshiriladi.
 */
export default function TelegramGate({ children }) {
  const [state, setState] = useState(DEV_BYPASS ? 'ok' : 'checking');

  useEffect(() => {
    if (DEV_BYPASS) return;
    let cancelled = false;
    (async () => {
      const tg = await waitForTg(TG_WAIT_MS);
      if (cancelled) return;
      // VAQTINCHALIK DIAGNOSTIKA: Telegram ichida (masalan, Desktop client'da
      // "Enable webview inspecting" yoqilgach, o'ng tugma > Inspect > Console)
      // shu qatorni tekshirib, window.Telegram.WebApp umuman yaratilyaptimi va
      // initData to'ldirilyaptimi — aniqlash mumkin. Muammo hal bo'lgach o'chirib
      // tashlang.
      console.info('[TelegramGate] tg mavjud:', !!tg, '| initData uzunligi:', tg?.initData?.length ?? 0, '| platform:', tg?.platform);
      setState(tg?.initData ? 'ok' : 'blocked');
    })();
    return () => { cancelled = true; };
  }, []);

  if (state === 'checking') return null;

  if (state === 'blocked') {
    return (
      <div className="tg-block">
        <div className="tg-block-card">
          <h1>Faqat Telegram orqali ochiladi</h1>
          <p className="muted">
            Bu ilova Telegram Mini App sifatida ishlaydi va brauzerdan to'g'ridan-to'g'ri ochilmaydi.
            Davom etish uchun Telegram ilovasidagi botdan foydalaning.
          </p>
          {BOT_USERNAME && (
            <a className="btn btn-block" href={`https://t.me/${BOT_USERNAME}`}>
              Botni Telegram'da ochish
            </a>
          )}
        </div>
      </div>
    );
  }

  return children;
}
