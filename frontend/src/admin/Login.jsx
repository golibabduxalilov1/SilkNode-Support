import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { ErrorNote } from '../components/Ui.jsx';

export default function Login() {
  const { loginWithPassword } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await loginWithPassword(form.username, form.password); }
    catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <div className="login-wrap">
      <form className="login-card stack" onSubmit={submit}>
        <div>
          <h1>Silknode Support</h1>
          <p className="muted" style={{ margin: '2px 0 0', fontSize: 14 }}>Texnik mutaxassislar paneli</p>
        </div>

        <ErrorNote>{error}</ErrorNote>

        <div className="field">
          <label htmlFor="u">Login</label>
          <input id="u" className="input" autoComplete="username" value={form.username}
                 onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </div>

        <div className="field">
          <label htmlFor="p">Parol</label>
          <input id="p" type="password" className="input" autoComplete="current-password" value={form.password}
                 onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>

        <button className="btn btn-block" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
      </form>
    </div>
  );
}
