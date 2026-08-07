import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Loading, ErrorNote } from '../components/Ui.jsx';
import { PageHeader, Input, Button, StatusTag, Modal } from '../components/ui/index.js';

export default function Organizations() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState(null);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ contact_person: '', contact_phone: '' });
  const [deactivating, setDeactivating] = useState(null);

  const load = () =>
    api(`/organizations${isAdmin ? '?all=1' : ''}`).then((d) => setItems(d.items)).catch((e) => setError(e.message));

  useEffect(() => { load(); }, [isAdmin]);

  async function add() {
    if (!name.trim()) return;
    setError('');
    try {
      await api('/organizations', {
        method: 'POST',
        body: { name: name.trim(), contact_person: contactPerson.trim(), contact_phone: contactPhone.trim() },
      });
      setName(''); setContactPerson(''); setContactPhone('');
      load();
    } catch (err) { setError(err.message); }
  }

  async function toggle(org) {
    setError('');
    try { await api(`/organizations/${org.id}`, { method: 'PATCH', body: { is_active: !org.is_active } }); load(); }
    catch (err) { setError(err.message); }
  }

  function requestToggle(org) {
    if (org.is_active) setDeactivating(org);
    else toggle(org);
  }

  async function confirmDeactivate() {
    if (!deactivating) return;
    await toggle(deactivating);
    setDeactivating(null);
  }

  function startEdit(org) {
    setEditingId(org.id);
    setEditForm({ contact_person: org.contact_person || '', contact_phone: org.contact_phone || '' });
  }

  async function saveEdit(org) {
    setError('');
    try {
      await api(`/organizations/${org.id}`, { method: 'PATCH', body: editForm });
      setEditingId(null);
      load();
    } catch (err) { setError(err.message); }
  }

  return (
    <>
      <PageHeader title="Tashkilotlar" description="Foydalanuvchi murojaat yaratishda shu ro'yxatdan tanlaydi." />

      <ErrorNote>{error}</ErrorNote>

      {isAdmin && (
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
          <Input className="grow" placeholder="Yangi tashkilot nomi" value={name}
                 onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <Input style={{ width: 200 }} placeholder="Mas'ul shaxs (ixtiyoriy)" value={contactPerson}
                 onChange={(e) => setContactPerson(e.target.value)} />
          <Input style={{ width: 170 }} placeholder="Telefon (ixtiyoriy)" value={contactPhone}
                 onChange={(e) => setContactPhone(e.target.value)} />
          <Button onClick={add}>Qo'shish</Button>
        </div>
      )}

      {!items ? <Loading rows={3} /> : (
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Nomi</th><th>Mas'ul shaxs</th><th>Telefon</th><th>Holat</th>{isAdmin && <th></th>}</tr></thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: 600 }}>{o.name}</td>
                  {editingId === o.id ? (
                    <>
                      <td>
                        <Input value={editForm.contact_person}
                               onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })} />
                      </td>
                      <td>
                        <Input value={editForm.contact_phone}
                               onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })} />
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{o.contact_person || <span className="faint">—</span>}</td>
                      <td>{o.contact_phone || <span className="faint">—</span>}</td>
                    </>
                  )}
                  <td><StatusTag variant={o.is_active ? 'positive' : 'neutral'}>{o.is_active ? 'Faol' : 'Faol emas'}</StatusTag></td>
                  {isAdmin && (
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {editingId === o.id ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => saveEdit(o)}>Saqlash</Button>
                          <Button variant="quiet" size="sm" onClick={() => setEditingId(null)}>Bekor qilish</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={() => startEdit(o)}>Tahrirlash</Button>
                          <Button variant="quiet" size="sm" onClick={() => requestToggle(o)}>
                            {o.is_active ? 'Faolsizlantirish' : 'Faollashtirish'}
                          </Button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!deactivating}
        onClose={() => setDeactivating(null)}
        title="Tashkilotni faolsizlantirish"
        footer={(
          <>
            <Button variant="quiet" onClick={() => setDeactivating(null)}>Bekor qilish</Button>
            <Button variant="danger" onClick={confirmDeactivate}>Faolsizlantirish</Button>
          </>
        )}
      >
        <p style={{ margin: 0 }}>
          <strong>{deactivating?.name}</strong> faolsizlantirilsa, foydalanuvchilar yangi murojaat yaratishda uni tanlay olmaydi.
          Buni istalgan vaqt qaytarish mumkin.
        </p>
      </Modal>
    </>
  );
}
