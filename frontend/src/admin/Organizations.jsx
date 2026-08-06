import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Loading, ErrorNote } from '../components/Ui.jsx';

export default function Organizations() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    api(`/organizations${isAdmin ? '?all=1' : ''}`).then((d) => setItems(d.items)).catch((e) => setError(e.message));

  useEffect(() => { load(); }, [isAdmin]);

  async function add() {
    if (!name.trim()) return;
    setError('');
    try { await api('/organizations', { method: 'POST', body: { name: name.trim() } }); setName(''); load(); }
    catch (err) { setError(err.message); }
  }

  async function toggle(org) {
    setError('');
    try { await api(`/organizations/${org.id}`, { method: 'PATCH', body: { is_active: !org.is_active } }); load(); }
    catch (err) { setError(err.message); }
  }

  return (
    <>
      <div className="page-head">
        <h1>Tashkilotlar</h1>
        <p>Foydalanuvchi murojaat yaratishda shu ro'yxatdan tanlaydi.</p>
      </div>

      <ErrorNote>{error}</ErrorNote>

      {isAdmin && (
        <div className="toolbar">
          <input className="input grow" placeholder="Yangi tashkilot nomi" value={name}
                 onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className="btn" onClick={add}>Qo'shish</button>
        </div>
      )}

      {!items ? <Loading rows={3} /> : (
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Nomi</th><th>Holat</th>{isAdmin && <th></th>}</tr></thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: 600 }}>{o.name}</td>
                  <td>{o.is_active ? 'Faol' : 'Faol emas'}</td>
                  {isAdmin && (
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggle(o)}>
                        {o.is_active ? 'Faolsizlantirish' : 'Faollashtirish'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
