import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { StatusBadge, PriorityBadge, Loading, Empty, ErrorNote } from '../components/Ui.jsx';
import { CATEGORY, STATUS, formatDate, timeAgo } from '../lib/format.js';

export default function TicketsList() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const get = (k) => params.get(k) || '';
  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    next.delete('page');
    setParams(next);
  };
  const page = Number(get('page') || 1);

  useEffect(() => {
    api('/organizations').then((d) => setOrgs(d.items)).catch(() => {});
    api('/users/staff').then((d) => setStaff(d.items)).catch(() => {});
  }, []);

  useEffect(() => {
    setData(null);
    const q = new URLSearchParams(params);
    q.set('scope', 'all');
    q.set('limit', '25');
    api(`/tickets?${q.toString()}`).then(setData).catch((e) => setError(e.message));
  }, [params]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <>
      <div className="page-head">
        <h1>Murojaatlar</h1>
        <p>{data ? `${data.total} ta murojaat topildi` : 'Yuklanmoqda'}</p>
      </div>

      <div className="toolbar">
        <input
          className="input grow" placeholder="Raqam, mavzu yoki matn bo'yicha qidirish"
          defaultValue={get('q')}
          onKeyDown={(e) => e.key === 'Enter' && setParam('q', e.target.value.trim())}
        />
        <select className="select" value={get('status')} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">Barcha statuslar</option>
          <option value="open">Ochiq</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="select" value={get('organization_id')} onChange={(e) => setParam('organization_id', e.target.value)}>
          <option value="">Barcha tashkilotlar</option>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select className="select" value={get('category')} onChange={(e) => setParam('category', e.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="select" value={get('assigned_to')} onChange={(e) => setParam('assigned_to', e.target.value)}>
          <option value="">Barcha mas'ullar</option>
          <option value="none">Tayinlanmagan</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.fullname}</option>)}
        </select>
      </div>

      <ErrorNote>{error}</ErrorNote>

      {!data ? <Loading rows={4} /> : data.items.length === 0 ? (
        <Empty title="Murojaat topilmadi" text="Filtrlarni o'zgartiring yoki qidiruvni tozalang." />
      ) : (
        <>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>№</th><th>Tashkilot</th><th>Foydalanuvchi</th><th>Mavzu</th><th>Kategoriya</th>
                  <th>Muhimlik</th><th>Status</th><th>Mas'ul</th><th>Yaratilgan</th><th>Oxirgi xabar</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((t) => (
                  <tr key={t.id} onClick={() => navigate(`/admin/tickets/${t.id}`)}>
                    <td className="mono-num">{t.number}</td>
                    <td>{t.organization_name}</td>
                    <td>{t.author_name}</td>
                    <td className="td-title">{t.title}</td>
                    <td>{CATEGORY[t.category]}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>{t.assignee_name || <span className="faint">tayinlanmagan</span>}</td>
                    <td className="faint">{formatDate(t.created_at, false)}</td>
                    <td className="faint">{timeAgo(t.last_message_at || t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="row" style={{ marginTop: 14, gap: 8 }}>
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setParams(prev(params, page - 1))}>Oldingi</button>
              <span className="faint">{page} / {pages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setParams(prev(params, page + 1))}>Keyingi</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function prev(params, page) {
  const next = new URLSearchParams(params);
  next.set('page', String(page));
  return next;
}
