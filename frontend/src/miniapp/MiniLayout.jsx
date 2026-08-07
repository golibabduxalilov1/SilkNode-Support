import { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { initTelegram } from '../lib/telegram.js';
import { Loading, ErrorNote } from '../components/Ui.jsx';

export default function MiniLayout() {
  const { status, error, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => { initTelegram(); }, []);

  // Telegram bildirishnomasidagi tugma: /app?ticket=12
  useEffect(() => {
    const ticket = params.get('ticket');
    if (status === 'ready' && ticket) navigate(`/tickets/${ticket}`, { replace: true });
  }, [status, params, navigate]);

  if (status === 'loading') return <div className="mini"><Loading rows={2} /></div>;

  if (status === 'error') {
    return (
      <div className="mini">
        <ErrorNote>{error || "Tizimga kirib bo'lmadi"}</ErrorNote>
        <p className="muted">Ilovani Telegram bot orqali oching yoki qaytadan urinib ko'ring.</p>
      </div>
    );
  }

  // Oddiy foydalanuvchi telefon raqamini botda tasdiqlamaguncha ilovaning
  // hech qanday funksiyasidan foydalana olmaydi. Bu faqat kosmetik himoya —
  // asosiy tekshiruv backend'da (requirePhoneVerified) amalga oshiriladi.
  // Xodimlar/administrator uchun bu cheklov qo'llanilmaydi.
  const isStaff = user?.role === 'agent' || user?.role === 'admin';
  if (!isStaff && !user?.phone) {
    return (
      <div className="tg-block">
        <div className="tg-block-card">
          <h1>Telefon raqamingizni tasdiqlang</h1>
          <p className="muted">
            Davom etishdan oldin Telegram botga o'ting va "Raqamni ulashish" tugmasini bosib
            telefon raqamingizni tasdiqlang.
          </p>
        </div>
      </div>
    );
  }

  return <div className="mini"><Outlet /></div>;
}
