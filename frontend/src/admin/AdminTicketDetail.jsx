import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { StatusBadge, PriorityBadge, Attachments, Loading, ErrorNote } from '../components/Ui.jsx';
import { CATEGORY, STATUS, formatDate, formatMinutes } from '../lib/format.js';
import FilePicker from '../components/FilePicker.jsx';

export default function AdminTicketDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [staff, setStaff] = useState([]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api(`/tickets/${id}`)); } catch (err) { setError(err.message); }
  }, [id]);

  useEffect(() => { load(); api('/users/staff').then((d) => setStaff(d.items)).catch(() => {}); }, [load]);

  async function reply() {
    if (!text.trim() && !files.length) return;
    setBusy(true); setError('');
    try {
      const fd = new FormData();
      fd.append('message', text);
      files.forEach((f) => fd.append('files', f));
      await api(`/tickets/${id}/messages`, { method: 'POST', form: fd });
      setText(''); setFiles([]);
      await load();
    } catch (err) { setError(err.message); }
    setBusy(false);
  }

  async function update(path, body) {
    setError('');
    try { await api(`/tickets/${id}/${path}`, { method: 'PATCH', body }); await load(); }
    catch (err) { setError(err.message); }
  }

  if (!data) return <><ErrorNote>{error}</ErrorNote><Loading rows={3} /></>;
  const { ticket, messages, initialAttachments } = data;

  return (
    <>
      <div className="page-head">
        <Link to="/admin/tickets" className="faint">&larr; Murojaatlar ro'yxati</Link>
        <div className="row" style={{ gap: 12, marginTop: 8 }}>
          <span className="mono-num muted">{ticket.number}</span>
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <h1 style={{ marginTop: 8 }}>{ticket.title}</h1>
      </div>

      <ErrorNote>{error}</ErrorNote>

      <div className="detail-grid" style={{ marginTop: 16 }}>
        <div className="stack" style={{ gap: 16 }}>
          <div className="card">
            <div className="faint" style={{ marginBottom: 6 }}>
              {ticket.author_name} &middot; {formatDate(ticket.created_at)}
            </div>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
            <Attachments items={initialAttachments} />
          </div>

          <div className="thread">
            {messages.map((m) => {
              const staffMsg = m.sender_role !== 'user';
              const kind = m.is_system ? 'system' : staffMsg ? 'staff' : 'user';
              return (
                <div key={m.id} className={`thread-item ${kind}`}>
                  <div className={`bubble ${kind}`}>
                    {!m.is_system && <div className="meta">{m.sender_name} &middot; {formatDate(m.created_at)}</div>}
                    <p>{m.message}</p>
                    <Attachments items={m.attachments} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card stack">
            <textarea
              className="textarea" value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Foydalanuvchiga javob yozing. Javob yuborilganda unga Telegram orqali bildirishnoma boradi."
            />
            <FilePicker files={files} onChange={setFiles} max={3} />
            <div className="row" style={{ gap: 10 }}>
              <button className="btn" onClick={reply} disabled={busy}>{busy ? 'Yuborilmoqda...' : 'Javob yuborish'}</button>
              {ticket.status !== 'resolved' && (
                <button className="btn btn-ghost" onClick={() => update('status', { status: 'resolved' })}>Hal qilindi deb belgilash</button>
              )}
            </div>
          </div>
        </div>

        <div className="stack" style={{ gap: 16 }}>
          <div className="side-card">
            <h3>Boshqaruv</h3>
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="st">Status</label>
              <select id="st" className="select" value={ticket.status} onChange={(e) => update('status', { status: e.target.value })}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="as">Mas'ul</label>
              <select
                id="as" className="select" value={ticket.assigned_to || ''}
                onChange={(e) => update('assign', { assigned_to: e.target.value || null })}
              >
                <option value="">Tayinlanmagan</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.fullname}</option>)}
              </select>
            </div>
          </div>

          <div className="side-card">
            <h3>Ma'lumotlar</h3>
            <div className="kv"><span>Tashkilot</span><span>{ticket.organization_name}</span></div>
            <div className="kv"><span>Foydalanuvchi</span><span>{ticket.author_name}</span></div>
            <div className="kv"><span>Kategoriya</span><span>{CATEGORY[ticket.category]}</span></div>
            <div className="kv"><span>Yaratilgan</span><span>{formatDate(ticket.created_at)}</span></div>
            <div className="kv"><span>Birinchi javob</span><span>{formatDate(ticket.first_response_at)}</span></div>
            <div className="kv"><span>Yopilgan</span><span>{formatDate(ticket.closed_at)}</span></div>
          </div>

          <div className="side-card">
            <h3>Vaqt ko'rsatkichlari</h3>
            <div className="kv"><span>Birinchi javobgacha</span><span>{formatMinutes(ticket.first_response_minutes)}</span></div>
            <div className="kv"><span>Umumiy bajarish</span><span>{formatMinutes(ticket.resolution_minutes)}</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
