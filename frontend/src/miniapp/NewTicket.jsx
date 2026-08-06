import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { backButton, haptic } from '../lib/telegram.js';
import { CATEGORY, PRIORITY } from '../lib/format.js';
import FilePicker from '../components/FilePicker.jsx';
import { ErrorNote } from '../components/Ui.jsx';

export default function NewTicket() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    organization_id: '', title: '', category: 'erp', priority: 'medium', description: '',
  });

  useEffect(() => backButton(() => navigate('/app')), [navigate]);
  useEffect(() => {
    api('/organizations')
      .then((d) => {
        setOrgs(d.items);
        setForm((f) => ({ ...f, organization_id: d.items[0]?.id ? String(d.items[0].id) : '' }));
      })
      .catch((e) => setError(e.message));
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit() {
    setError('');
    if (!form.organization_id) return setError('Tashkilotni tanlang');
    if (form.title.trim().length < 3) return setError("Mavzuni to'liqroq yozing");
    if (form.description.trim().length < 5) return setError('Muammo tavsifini yozing');

    setSending(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('files', f));
      const ticket = await api('/tickets', { method: 'POST', form: fd });
      haptic('medium');
      navigate(`/app/tickets/${ticket.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  }

  return (
    <>
      <header className="mini-head">
        <div className="eyebrow">Yangi murojaat</div>
        <h1>Muammoni tavsiflang</h1>
        <p className="muted" style={{ margin: '6px 0 0', fontSize: 14 }}>
          Qanchalik aniq yozsangiz, javob shunchalik tez keladi.
        </p>
      </header>

      <div className="stack">
        <ErrorNote>{error}</ErrorNote>

        <div className="field">
          <label htmlFor="org">Tashkilot</label>
          <select id="org" className="select" value={form.organization_id} onChange={set('organization_id')}>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor="title">Mavzu</label>
          <input
            id="title" className="input" value={form.title} onChange={set('title')} maxLength={140}
            placeholder="Masalan: ERP da sotuvlar hisoboti ochilmayapti"
          />
        </div>

        <div className="field">
          <label htmlFor="category">Kategoriya</label>
          <select id="category" className="select" value={form.category} onChange={set('category')}>
            {Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor="priority">Muhimlik darajasi</label>
          <select id="priority" className="select" value={form.priority} onChange={set('priority')}>
            {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <span className="hint">Kritik — ish butunlay to'xtagan holatlar uchun.</span>
        </div>

        <div className="field">
          <label htmlFor="description">Muammo tavsifi</label>
          <textarea
            id="description" className="textarea" value={form.description} onChange={set('description')}
            placeholder="Nima qilgansiz, nima kutgansiz va nima sodir bo'ldi? Xato matnini ham yozing."
          />
        </div>

        <FilePicker files={files} onChange={setFiles} />

        <button className="btn btn-block" onClick={submit} disabled={sending}>
          {sending ? 'Yuborilmoqda...' : 'Murojaatni yuborish'}
        </button>
      </div>
    </>
  );
}
