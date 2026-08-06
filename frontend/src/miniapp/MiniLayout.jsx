import { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { initTelegram } from '../lib/telegram.js';
import { Loading, ErrorNote } from '../components/Ui.jsx';

export default function MiniLayout() {
  const { status, error } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => { initTelegram(); }, []);

  // Telegram bildirishnomasidagi tugma: /app?ticket=12
  useEffect(() => {
    const ticket = params.get('ticket');
    if (status === 'ready' && ticket) navigate(`/app/tickets/${ticket}`, { replace: true });
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

  return <div className="mini"><Outlet /></div>;
}
