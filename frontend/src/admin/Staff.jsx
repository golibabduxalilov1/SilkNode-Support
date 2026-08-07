import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Loading, ErrorNote, Empty } from '../components/Ui.jsx';
import { PageHeader, Input, Select, Button, StatusTag } from '../components/ui/index.js';
import { ROLE } from '../lib/format.js';

export default function Staff() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('agent');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () =>
    api('/users/staff').then((d) => setItems(d.items)).catch((e) => setError(e.message));

  useEffect(() => { if (user?.role === 'admin') load(); }, [user]);

  if (user?.role !== 'admin') {
    return <Empty title="Ruxsat yo'q" text="Bu sahifa faqat administratorlar uchun." />;
  }

  async function add() {
    if (!fullname.trim() || !username.trim() || !password) return;
    setError('');
    setSaving(true);
    try {
      await api('/users/staff', {
        method: 'POST',
        body: { fullname: fullname.trim(), username: username.trim(), password, role },
      });
      setFullname(''); setUsername(''); setPassword(''); setRole('agent');
      load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader title="Xodimlar" description="Admin panelga kiruvchi texnik mutaxassis va administratorlar ro'yxati." />

      <ErrorNote>{error}</ErrorNote>

      <div className="toolbar" style={{ flexWrap: 'wrap' }}>
        <Input className="grow" placeholder="To'liq ism" value={fullname}
               onChange={(e) => setFullname(e.target.value)} />
        <Input style={{ width: 170 }} placeholder="Login" value={username}
               onChange={(e) => setUsername(e.target.value)} />
        <Input style={{ width: 170 }} type="password" placeholder="Parol" value={password}
               onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Select style={{ width: 170 }} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="agent">Texnik mutaxassis</option>
          <option value="admin">Administrator</option>
        </Select>
        <Button loading={saving} onClick={add}>Qo'shish</Button>
      </div>

      {!items ? <Loading rows={3} /> : (
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Ism</th><th>Login</th><th>Rol</th></tr></thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: 600 }}>{u.fullname}</td>
                  <td>{u.username}</td>
                  <td><StatusTag variant={u.role === 'admin' ? 'accent' : 'neutral'} dot={false}>{ROLE[u.role] || u.role}</StatusTag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
