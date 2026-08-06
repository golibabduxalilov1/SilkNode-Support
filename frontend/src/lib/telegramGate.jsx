import { useEffect, useState } from 'react';
import { waitForTg } from './telegram.js';

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
      const tg = await waitForTg(1500);
      if (cancelled) return;
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
