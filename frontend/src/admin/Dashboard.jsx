import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Loading, ErrorNote } from '../components/Ui.jsx';
import { CATEGORY, formatMinutes } from '../lib/format.js';

const CARDS = [
  { key: 'new', label: 'Yangi', status: 'new' },
  { key: 'in_progress', label: 'Ish jarayonida', status: 'in_progress' },
  { key: 'waiting_user', label: 'Foydalanuvchi javobi kutilmoqda', status: 'waiting_user' },
  { key: 'closed_today', label: 'Bugun yopilgan', status: 'closed' },
  { key: 'open_total', label: 'Barcha ochiq murojaatlar', status: 'open' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { api('/organizations').then((d) => setOrgs(d.items)).catch(() => {}); }, []);
  useEffect(() => {
    setData(null);
    api(`/dashboard/summary${orgId ? `?organization_id=${orgId}` : ''}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [orgId]);

  return (
    <>
      <div className="page-head row-between">
        <div>
          <h1>Dashboard</h1>
          <p>Xizmat ko'rsatish holati va javob berish tezligi.</p>
        </div>
        <select className="select" style={{ width: 220 }} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
          <option value="">Barcha tashkilotlar</option>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      <ErrorNote>{error}</ErrorNote>
      {!data ? <Loading rows={2} /> : (
        <div className="stack" style={{ gap: 20 }}>
          <div className="kpi-grid">
            {CARDS.map((c) => (
              <button
                key={c.key} className="kpi tap"
                onClick={() => navigate(`/admin/tickets?status=${c.status}${orgId ? `&organization_id=${orgId}` : ''}`)}
              >
                <div className="label">{c.label}</div>
                <div className="value">{data.counts[c.key]}</div>
              </button>
            ))}
          </div>

          <div className="kpi-grid">
            <div className="kpi">
              <div className="label">O'rtacha birinchi javob vaqti</div>
              <div className="value">{formatMinutes(data.avgFirstResponseMinutes)}</div>
            </div>
            <div className="kpi">
              <div className="label">O'rtacha yopish vaqti</div>
              <div className="value">{formatMinutes(data.avgResolutionMinutes)}</div>
            </div>
            <div className="kpi">
              <div className="label">Yopilgan: hafta / oy</div>
              <div className="value">{data.closed.week}<small>/ {data.closed.month}</small></div>
            </div>
          </div>

          <div className="detail-grid">
            <div className="side-card">
              <h3>Kategoriyalar bo'yicha</h3>
              {data.byCategory.length === 0 && <p className="muted">Ma'lumot yo'q</p>}
              {data.byCategory.map((c) => {
                const max = Math.max(...data.byCategory.map((x) => x.c));
                return (
                  <div key={c.category} style={{ marginBottom: 10 }}>
                    <div className="row-between" style={{ fontSize: 13.5 }}>
                      <span>{CATEGORY[c.category] || c.category}</span>
                      <span className="mono-num">{c.c}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--line-soft)', borderRadius: 3, marginTop: 4 }}>
                      <div style={{ width: `${(c.c / max) * 100}%`, height: '100%', background: 'var(--brand)', borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="side-card">
              <h3>Tashkilotlar</h3>
              {data.byOrganization.map((o) => (
                <div className="kv" key={o.name}>
                  <span>{o.name}</span>
                  <span className="mono-num">{o.open_count || 0} ochiq / {o.c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
