import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, downloadBlob } from '../lib/api.js';
import { StatusBadge, PriorityBadge, MultiSelect, SortHeader, Loading, Empty, ErrorNote } from '../components/Ui.jsx';
import { CATEGORY, STATUS, formatDate, timeAgo } from '../lib/format.js';

export default function TicketsList() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  const get = (k) => params.get(k) || '';
  const getList = (k) => (params.get(k) ? params.get(k).split(',') : []);
  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    next.delete('page');
    setParams(next);
  };
  const setListParam = (k, arr) => setParam(k, arr.join(','));
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

  function onSort(column) {
    const sameColumn = get('sortBy') === column;
    const next = new URLSearchParams(params);
    next.set('sortBy', column);
    next.set('sortDir', sameColumn && get('sortDir') !== 'desc' ? 'desc' : 'asc');
    setParams(next);
  }

  async function exportXlsx() {
    setExporting(true);
    setError('');
    try {
      const q = new URLSearchParams(params);
      q.delete('page'); q.delete('limit');
      await downloadBlob(`/tickets/export/xlsx?${q.toString()}`, 'tickets-export.xlsx');
    } catch (err) { setError(err.message); }
    setExporting(false);
  }

  return (
    <>
      <div className="page-head row-between">
        <div>
          <h1>Murojaatlar</h1>
          <p>{data ? `${data.total} ta murojaat topildi` : 'Yuklanmoqda'}</p>
        </div>
        <button className="btn btn-ghost" onClick={exportXlsx} disabled={exporting}>
          {exporting ? 'Tayyorlanmoqda...' : "Excel'ga eksport"}
        </button>
      </div>

      <div className="toolbar" style={{ flexWrap: 'wrap' }}>
        <input
          className="input grow" placeholder="Raqam, mavzu yoki matn bo'yicha qidirish"
          defaultValue={get('q')}
          onKeyDown={(e) => e.key === 'Enter' && setParam('q', e.target.value.trim())}
        />
        <MultiSelect
          label="Status" values={getList('status')} onChange={(v) => setListParam('status', v)}
          options={Object.entries(STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
        />
        <MultiSelect
          label="Tashkilot" values={getList('organization_id')} onChange={(v) => setListParam('organization_id', v)}
          options={orgs.map((o) => ({ value: String(o.id), label: o.name }))}
        />
        <MultiSelect
          label="Kategoriya" values={getList('category')} onChange={(v) => setListParam('category', v)}
          options={Object.entries(CATEGORY).map(([k, v]) => ({ value: k, label: v }))}
        />
        <MultiSelect
          label="Muhimlik" values={getList('priority')} onChange={(v) => setListParam('priority', v)}
          options={[
            { value: 'low', label: 'Past' }, { value: 'medium', label: "O'rta" },
            { value: 'high', label: 'Yuqori' }, { value: 'critical', label: 'Kritik' },
          ]}
        />
        <MultiSelect
          label="Mas'ul" values={getList('assigned_to')} onChange={(v) => setListParam('assigned_to', v)}
          options={[{ value: 'none', label: 'Tayinlanmagan' }, ...staff.map((s) => ({ value: String(s.id), label: s.fullname }))]}
        />
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
                  <SortHeader label="№" column="number" sortBy={get('sortBy')} sortDir={get('sortDir')} onSort={onSort} />
                  <SortHeader label="Tashkilot" column="organization_name" sortBy={get('sortBy')} sortDir={get('sortDir')} onSort={onSort} />
                  <th>Foydalanuvchi</th>
                  <SortHeader label="Mavzu" column="title" sortBy={get('sortBy')} sortDir={get('sortDir')} onSort={onSort} />
                  <SortHeader label="Kategoriya" column="category" sortBy={get('sortBy')} sortDir={get('sortDir')} onSort={onSort} />
                  <SortHeader label="Muhimlik" column="priority" sortBy={get('sortBy')} sortDir={get('sortDir')} onSort={onSort} />
                  <SortHeader label="Status" column="status" sortBy={get('sortBy')} sortDir={get('sortDir')} onSort={onSort} />
                  <SortHeader label="Mas'ul" column="assignee_name" sortBy={get('sortBy')} sortDir={get('sortDir')} onSort={onSort} />
                  <SortHeader label="Yaratilgan" column="created_at" sortBy={get('sortBy')} sortDir={get('sortDir')} onSort={onSort} />
                  <SortHeader label="Oxirgi xabar" column="last_message_at" sortBy={get('sortBy')} sortDir={get('sortDir')} onSort={onSort} />
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
