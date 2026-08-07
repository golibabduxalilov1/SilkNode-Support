import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { ErrorNote } from '../components/Ui.jsx';
import { Field, Input } from '../components/ui/Field.jsx';
import Button from '../components/ui/Button.jsx';

export default function Login() {
  const { loginWithPassword, error: authError } = useAuth();
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

        <ErrorNote>{error || authError}</ErrorNote>

        <Field label="Login" htmlFor="u">
          <Input id="u" autoComplete="username" value={form.username}
                 onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </Field>

        <Field label="Parol" htmlFor="p">
          <Input id="p" type="password" autoComplete="current-password" value={form.password}
                 onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>

        <Button type="submit" fullWidth loading={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</Button>
      </form>
    </div>
  );
}
