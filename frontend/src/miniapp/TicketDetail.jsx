import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { backButton, haptic } from '../lib/telegram.js';
import { StatusBadge, PriorityBadge, Attachments, Loading, ErrorNote } from '../components/Ui.jsx';
import { CATEGORY, formatDate, formatMinutes } from '../lib/format.js';
import FilePicker from '../components/FilePicker.jsx';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => backButton(() => navigate('/app/tickets')), [navigate]);

  const load = useCallback(async () => {
    try { setData(await api(`/tickets/${id}`)); }
    catch (err) { setError(err.message); }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = setInterval(load, 20000); // yangi javoblarni avtomatik olish
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [data?.messages?.length]);

  async function send() {
    if (!text.trim() && !files.length) return;
    setSending(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('message', text);
      files.forEach((f) => fd.append('files', f));
      await api(`/tickets/${id}/messages`, { method: 'POST', form: fd });
      setText(''); setFiles([]); haptic();
      await load();
    } catch (err) { setError(err.message); }
    setSending(false);
  }

  async function closeTicket() {
    try {
      await api(`/tickets/${id}/status`, { method: 'PATCH', body: { status: 'closed' } });
      await load();
    } catch (err) { setError(err.message); }
  }

  if (!data) return <div className="stack"><ErrorNote>{error}</ErrorNote><Loading /></div>;

  const { ticket, messages, initialAttachments } = data;
  const isClosed = ticket.status === 'closed';

  return (
    <>
      <header className="mini-head">
        <div className="row-between">
          <span className="mono-num faint">{ticket.number}</span>
          <StatusBadge status={ticket.status} />
        </div>
        <h1 style={{ fontSize: 20, marginTop: 8 }}>{ticket.title}</h1>
        <div className="row faint" style={{ gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
          <span>{ticket.organization_name}</span>
          <span>&middot;</span>
          <span>{CATEGORY[ticket.category]}</span>
          <span>&middot;</span>
          <PriorityBadge priority={ticket.priority} />
        </div>
      </header>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
        <Attachments items={initialAttachments} />
        <div className="faint" style={{ marginTop: 10 }}>
          Yaratilgan: {formatDate(ticket.created_at)}
          {ticket.first_response_minutes !== null && ` \u00b7 Birinchi javob: ${formatMinutes(ticket.first_response_minutes)}`}
        </div>
      </div>

      <div className="thread">
        {messages.length === 0 && <p className="muted" style={{ marginTop: 0 }}>Javob kutilmoqda. Texnik mutaxassis javob berganda Telegram orqali xabar olasiz.</p>}
        {messages.map((m) => {
          const staff = m.sender_role !== 'user';
          const kind = m.is_system ? 'system' : staff ? 'staff' : 'user';
          return (
            <div key={m.id} className={`thread-item ${kind}`}>
              <div className={`bubble ${kind}`}>
                {!m.is_system && (
                  <div className="meta">
                    {staff ? `${m.sender_name} \u00b7 texnik mutaxassis` : 'Siz'} &middot; {formatDate(m.created_at)}
                  </div>
                )}
                <p>{m.message}</p>
                <Attachments items={m.attachments} />
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <ErrorNote>{error}</ErrorNote>

      {isClosed ? (
        <div className="card" style={{ textAlign: 'center', marginTop: 12 }}>
          <p className="muted" style={{ margin: 0 }}>Murojaat yopilgan. Muammo qaytalansa, yangi murojaat yuboring.</p>
        </div>
      ) : (
        <div className="composer stack">
          <textarea
            className="textarea" style={{ minHeight: 80 }} value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Javob yozing yoki qo'shimcha ma'lumot bering"
          />
          <FilePicker files={files} onChange={setFiles} max={3} />
          <div className="row" style={{ gap: 10 }}>
            <button className="btn" style={{ flex: 1 }} onClick={send} disabled={sending}>
              {sending ? 'Yuborilmoqda...' : 'Yuborish'}
            </button>
            <button className="btn btn-ghost" onClick={closeTicket}>Murojaatni yopish</button>
          </div>
        </div>
      )}
    </>
  );
}
