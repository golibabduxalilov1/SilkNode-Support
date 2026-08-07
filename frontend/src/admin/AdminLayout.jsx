import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Ticket, BarChart3, Building2, Users, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import Login from './Login.jsx';
import { Loading } from '../components/Ui.jsx';
import Button from '../components/ui/Button.jsx';
import { ROLE } from '../lib/format.js';

const NAV = [
  { to: '/', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tickets', label: 'Murojaatlar', icon: Ticket },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/organizations', label: 'Tashkilotlar', icon: Building2 },
  { to: '/staff', label: 'Xodimlar', icon: Users, adminOnly: true },
];

export default function AdminLayout() {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Telegram bildirishnomasidagi tugma: /admin?ticket=12
  useEffect(() => {
    const ticket = params.get('ticket');
    if (status === 'ready' && user && ticket) navigate(`/tickets/${ticket}`, { replace: true });
  }, [status, user, params, navigate]);

  if (status === 'loading') return <div style={{ padding: 40 }}><Loading /></div>;
  if (status !== 'ready' || !user) return <Login />;

  if (user.role === 'user') {
    return (
      <div className="login-wrap">
        <div className="login-card stack">
          <div>
            <h1>Ruxsat yo'q</h1>
            <p className="muted" style={{ marginTop: 4 }}>Bu panel texnik mutaxassislar uchun. Murojaat yuborish uchun Telegram ilovasidan foydalaning.</p>
          </div>
          <Button variant="outline" fullWidth onClick={logout}>Chiqish</Button>
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
          {NAV.filter((item) => !item.adminOnly || user.role === 'admin').map(({ to, end, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={17} strokeWidth={1.75} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="who">
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{user.fullname}</div>
          <div>{ROLE[user.role]}</div>
          <Button variant="quiet" size="sm" iconLeft={LogOut} className="px-0!" style={{ marginTop: 10 }} onClick={logout}>Chiqish</Button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
