import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { haptic } from '../lib/telegram.js';
import { StatusBadge } from '../components/Ui.jsx';
import { timeAgo } from '../lib/format.js';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    api('/tickets?limit=3').then((d) => setRecent(d.items)).catch(() => {});
  }, []);

  const go = (path) => { haptic(); navigate(path); };
  const openCount = recent.filter((t) => ['new', 'in_progress', 'waiting_user'].includes(t.status)).length;

  return (
    <>
      <header className="mini-head">
        <div className="eyebrow">Silknode Support</div>
        <h1>Salom, {user?.fullname?.split(' ')[0] || 'xodim'}</h1>
        <p className="muted" style={{ margin: '6px 0 0' }}>
          {openCount ? `Sizda ${openCount} ta ochiq murojaat bor.` : 'Ochiq murojaatlaringiz yo\u2018q.'}
        </p>
      </header>

      <div className="stack">
        <button className="tile" onClick={() => go('/new')}>
          <span>
            <strong>Yangi murojaat</strong>
            <div className="faint">Muammoni tavsiflang va fayl biriktiring</div>
          </span>
          <span className="arrow" aria-hidden>&rarr;</span>
        </button>

        <button className="tile" onClick={() => go('/tickets')}>
          <span>
            <strong>Mening murojaatlarim</strong>
            <div className="faint">Holat, javoblar va suhbat tarixi</div>
          </span>
          <span className="arrow" aria-hidden>&rarr;</span>
        </button>
      </div>

      {recent.length > 0 && (
        <>
          <h2 style={{ fontSize: 15, margin: '24px 0 10px', color: 'var(--ink-soft)' }}>Oxirgi murojaatlar</h2>
          <div className="stack">
            {recent.map((t) => (
              <button key={t.id} className="ticket-card" style={{ textAlign: 'left' }} onClick={() => go(`/tickets/${t.id}`)}>
                <div className="row-between">
                  <span className="mono-num faint">{t.number}</span>
                  <StatusBadge status={t.status} />
                </div>
                <h3>{t.title}</h3>
                <div className="faint">{timeAgo(t.last_message_at || t.created_at)}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
