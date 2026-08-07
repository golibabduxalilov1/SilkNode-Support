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

// Telegram Desktop ba'zan keshlangan WebView'ni ko'rsatadi va shu sababli
// window.Telegram.WebApp mavjud bo'lsa ham initData bo'sh keladi. Bunday holatda
// sahifani bir marta qayta yuklash ko'pincha yordam beradi. Cheksiz reload
// tsiklidan qochish uchun sessionStorage flag orqali faqat bitta urinishga
// ruxsat beramiz.
const RELOAD_FLAG = 'tg-gate-reloaded';

/**
 * Eng tashqi qatlamda ilova haqiqatan ham Telegram WebView ichida ochilganini
 * tekshiradi (window.Telegram.WebApp.initData mavjudligi orqali). Bu faqat
 * kosmetik himoya — asosiy tekshiruv backend'da initData imzosini tasdiqlash
 * orqali amalga oshiriladi.
 */
function retry() {
  sessionStorage.removeItem(RELOAD_FLAG);
  window.location.reload();
}

export default function TelegramGate({ children }) {
  const [state, setState] = useState(DEV_BYPASS ? 'ok' : 'checking');

  useEffect(() => {
    if (DEV_BYPASS) return;
    let cancelled = false;
    (async () => {
      const tg = await waitForTg(TG_WAIT_MS);
      if (cancelled) return;
      if (import.meta.env.DEV) {
        console.info('[TelegramGate] tg mavjud:', !!tg, '| initData uzunligi:', tg?.initData?.length ?? 0, '| platform:', tg?.platform);
      }

      if (tg?.initData) {
        sessionStorage.removeItem(RELOAD_FLAG);
        setState('ok');
        return;
      }

      // tg obyekti bor, lekin initData bo'sh — Telegram Desktop keshlangan WebView
      // ko'rsatayotgan bo'lishi mumkin. Shu holatda bitta marta reload qilib
      // ko'ramiz (sessionStorage flag cheksiz reload tsiklini oldini oladi).
      if (tg && !sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, '1');
        window.location.reload();
        return;
      }

      // tg obyekti bor-u, reload'dan keyin ham initData hamon bo'sh — avtomatik
      // choralar tugadi. Bu holatda jim "ok"ga o'tib davom etish o'rniga
      // foydalanuvchiga aniq, harakatga undovchi xabar ko'rsatamiz, chunki
      // shu yerdan o'tib ketilsa, keyingi qadam (auth.jsx) baribir xom backend
      // xatosiga olib keladi.
      if (tg) {
        setState('blocked');
        return;
      }

      // tg obyektining o'zi umuman topilmadi (Telegram tashqarisida ochilgan
      // bo'lishi mumkin) — bu faqat kosmetik tekshiruv, haqiqiy tasdiqlash
      // backend'da initData HMAC imzosi orqali amalga oshadi, shuning uchun
      // bu holatda ilovani bloklamaymiz.
      setState('ok');
    })();
    return () => { cancelled = true; };
  }, []);

  if (state === 'checking') return null;

  if (state === 'blocked') {
    return (
      <div className="tg-block">
        <div className="tg-block-card">
          <h1>Ilova ochilmadi</h1>
          <p className="muted">
            Telegram ma'lumotlarini yuklab bo'lmadi. Botni to'liq yoping va qaytadan oching.
          </p>
          <button type="button" className="btn" onClick={retry}>Qayta urinish</button>
        </div>
      </div>
    );
  }

  return children;
}
