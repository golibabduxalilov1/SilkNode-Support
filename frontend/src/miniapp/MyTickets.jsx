import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { backButton } from '../lib/telegram.js';
import { StatusBadge, Loading, Empty, ErrorNote } from '../components/Ui.jsx';
import { formatDate, CATEGORY } from '../lib/format.js';

const FILTERS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'open', label: 'Ochiq' },
  { key: 'closed', label: 'Yopilgan' },
];

export default function MyTickets() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => backButton(() => navigate('/')), [navigate]);

  useEffect(() => {
    setState('loading');
    const q = filter === 'all' ? '' : `?status=${filter}`;
    api(`/tickets${q}`)
      .then((d) => { setItems(d.items); setState('ready'); })
      .catch((e) => { setError(e.message); setState('ready'); });
  }, [filter]);

  return (
    <>
      <header className="mini-head">
        <div className="eyebrow">Mening murojaatlarim</div>
        <h1>Murojaatlar</h1>
      </header>

      <div className="row" style={{ marginBottom: 14, gap: 8 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`btn btn-sm ${filter === f.key ? '' : 'btn-ghost'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ErrorNote>{error}</ErrorNote>

      {state === 'loading' ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty
          title="Murojaat yo'q"
          text="Bu bo'limda hozircha hech narsa yo'q. Muammo yuzaga kelsa, yangi murojaat yuboring."
          action={<Link className="btn" to="/new">Yangi murojaat</Link>}
        />
      ) : (
        <div className="stack">
          {items.map((t) => (
            <Link key={t.id} to={`/tickets/${t.id}`} className="ticket-card">
              <div className="row-between">
                <span className="mono-num faint">{t.number}</span>
                <StatusBadge status={t.status} />
              </div>
              <h3>{t.title}</h3>
              <div className="faint">{CATEGORY[t.category]} &middot; {formatDate(t.created_at)}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
