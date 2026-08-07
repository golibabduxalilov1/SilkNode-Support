import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { backButton, haptic } from '../lib/telegram.js';
import { CATEGORY, PRIORITY } from '../lib/format.js';
import FilePicker from '../components/FilePicker.jsx';
import { ErrorNote } from '../components/Ui.jsx';
import { Field, Input, Select, TextArea, Button } from '../components/ui/index.js';

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';

export default function NewTicket() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [phoneNotConfirmed, setPhoneNotConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    organization_id: '', title: '', category: 'erp', priority: 'medium', description: '',
  });

  useEffect(() => backButton(() => navigate('/')), [navigate]);
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
    setPhoneNotConfirmed(false);
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
      navigate(`/tickets/${ticket.id}`, { replace: true });
    } catch (err) {
      if (err.status === 403) {
        setPhoneNotConfirmed(true);
      } else {
        setError(err.message);
      }
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
        {phoneNotConfirmed ? (
          <div className="alert alert-error">
            <p style={{ margin: 0 }}>
              Telefon raqamingiz tasdiqlanmagan. Iltimos, botga qayting va /start orqali raqamingizni ulashing.
            </p>
            {BOT_USERNAME && (
              <Button
                as="a" fullWidth style={{ marginTop: 10, textDecoration: 'none' }}
                href={`https://t.me/${BOT_USERNAME}`}
                target="_blank"
                rel="noreferrer"
              >
                Botni ochish
              </Button>
            )}
          </div>
        ) : (
          <ErrorNote>{error}</ErrorNote>
        )}

        <Field label="Tashkilot" htmlFor="org">
          <Select id="org" value={form.organization_id} onChange={set('organization_id')}>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
        </Field>

        <Field label="Mavzu" htmlFor="title">
          <Input
            id="title" value={form.title} onChange={set('title')} maxLength={140}
            placeholder="Masalan: ERP da sotuvlar hisoboti ochilmayapti"
          />
        </Field>

        <Field label="Kategoriya" htmlFor="category">
          <Select id="category" value={form.category} onChange={set('category')}>
            {Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>

        <Field label="Muhimlik darajasi" htmlFor="priority" hint="Kritik — ish butunlay to'xtagan holatlar uchun.">
          <Select id="priority" value={form.priority} onChange={set('priority')}>
            {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>

        <Field label="Muammo tavsifi" htmlFor="description">
          <TextArea
            id="description" value={form.description} onChange={set('description')}
            placeholder="Nima qilgansiz, nima kutgansiz va nima sodir bo'ldi? Xato matnini ham yozing."
          />
        </Field>

        <FilePicker files={files} onChange={setFiles} />

        <Button fullWidth loading={sending} onClick={submit}>
          {sending ? 'Yuborilmoqda...' : 'Murojaatni yuborish'}
        </Button>
      </div>
    </>
  );
}
