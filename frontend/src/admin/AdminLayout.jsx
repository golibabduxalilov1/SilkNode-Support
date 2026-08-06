import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import Login from './Login.jsx';
import { Loading } from '../components/Ui.jsx';
import { ROLE } from '../lib/format.js';

export default function AdminLayout() {
  const { user, status, logout } = useAuth();

  if (status === 'loading') return <div style={{ padding: 40 }}><Loading /></div>;
  if (status !== 'ready' || !user) return <Login />;

  if (user.role === 'user') {
    return (
      <div className="login-wrap">
        <div className="login-card">
          <h1>Ruxsat yo'q</h1>
          <p className="muted">Bu panel texnik mutaxassislar uchun. Murojaat yuborish uchun Telegram ilovasidan foydalaning.</p>
          <button className="btn btn-ghost btn-block" onClick={logout}>Chiqish</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin">
      <aside className="sidebar">
        <div className="brand">
          Silknode
          <span>Support Desk</span>
        </div>
        <nav>
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/tickets">Murojaatlar</NavLink>
          <NavLink to="/admin/organizations">Tashkilotlar</NavLink>
        </nav>
        <div className="who">
          {user.fullname}
          <div style={{ opacity: .75 }}>{ROLE[user.role]}</div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={logout}>Chiqish</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
