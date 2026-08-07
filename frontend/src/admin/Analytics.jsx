import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { api, downloadBlob } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Loading, ErrorNote } from '../components/Ui.jsx';
import { PageHeader, Input, Select, Button, SectionHeader } from '../components/ui/index.js';
import { CATEGORY, formatDate, formatMinutes } from '../lib/format.js';

const STATUS_COLORS = { new: '#0369a1', in_progress: '#b45309', waiting_user: '#4f46e5', resolved: '#15803d', closed: '#71717a' };
const BRAND = '#4f46e5';
const SUCCESS = '#15803d';

const PERIODS = [
  { key: 'today', label: 'Bugun' },
  { key: '7d', label: '7 kun' },
  { key: '30d', label: '30 kun' },
  { key: 'custom', label: 'Ixtiyoriy' },
];

function periodRange(period, customFrom, customTo) {
  const now = new Date();
  if (period === 'today') {
    const from = new Date(now); from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to: now.toISOString() };
  }
  if (period === '7d') return { from: new Date(now.getTime() - 6 * 86400000).toISOString(), to: now.toISOString() };
  if (period === '30d') return { from: new Date(now.getTime() - 29 * 86400000).toISOString(), to: now.toISOString() };
  if (period === 'custom' && customFrom && customTo) {
    return { from: new Date(customFrom).toISOString(), to: new Date(`${customTo}T23:59:59`).toISOString() };
  }
  return {};
}

export default function Analytics() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();

  const [period, setPeriod] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [orgId, setOrgId] = useState('');
  const [category, setCategory] = useState('');
  const [agentId, setAgentId] = useState('');

  const [orgs, setOrgs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [summary, setSummary] = useState(null);
  const [orgStats, setOrgStats] = useState(null);
  const [agentStats, setAgentStats] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const range = useMemo(() => periodRange(period, customFrom, customTo), [period, customFrom, customTo]);

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (range.from) q.set('from', range.from);
    if (range.to) q.set('to', range.to);
    if (isAdmin && orgId) q.set('organization_id', orgId);
    if (category) q.set('category', category);
    if (isAdmin && agentId) q.set('agent_id', agentId);
    return q.toString();
  }, [range, orgId, category, agentId, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      api('/organizations').then((d) => setOrgs(d.items)).catch(() => {});
      api('/users/staff').then((d) => setStaff(d.items)).catch(() => {});
    }
  }, [isAdmin]);

  useEffect(() => {
    setSummary(null);
    setError('');
    api(`/analytics/summary?${query}`).then(setSummary).catch((e) => setError(e.message));
    if (isAdmin) {
      api(`/analytics/organizations?${query}`).then((d) => setOrgStats(d.items)).catch(() => {});
      api(`/analytics/agents?${query}`).then((d) => setAgentStats(d.items)).catch(() => {});
    }
  }, [query, isAdmin]);

  async function exportXlsx() {
    setExporting(true);
    setError('');
    try { await downloadBlob(`/analytics/export?${query}`, 'analytics-export.xlsx'); }
    catch (err) { setError(err.message); }
    setExporting(false);
  }

  const pieData = summary?.openByStatus?.map((s) => ({ ...s, fill: STATUS_COLORS[s.status] || '#999' })) || [];

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Vaqt ko'rsatkichlari, tashkilot va mutaxassislar bo'yicha statistika."
        actions={isAdmin && (
          <Button variant="outline" loading={exporting} onClick={exportXlsx}>
            {exporting ? 'Tayyorlanmoqda...' : "Excel'ga eksport"}
          </Button>
        )}
      />

      <div className="toolbar" style={{ flexWrap: 'wrap' }}>
        <div className="row" style={{ gap: 6 }}>
          {PERIODS.map((p) => (
            <Button
              key={p.key} variant={period === p.key ? 'accent' : 'outline'} size="sm"
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        {period === 'custom' && (
          <>
            <Input type="date" style={{ width: 150 }} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <Input type="date" style={{ width: 150 }} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </>
        )}
        {isAdmin && (
          <Select style={{ width: 190 }} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">Barcha tashkilotlar</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
        )}
        <Select style={{ width: 190 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Barcha kategoriyalar</option>
          {Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        {isAdmin && (
          <Select style={{ width: 190 }} value={agentId} onChange={(e) => setAgentId(e.target.value)}>
            <option value="">Barcha mutaxassislar</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.fullname}</option>)}
          </Select>
        )}
      </div>

      <ErrorNote>{error}</ErrorNote>

      {!summary ? <Loading rows={3} /> : (
        <div className="stack" style={{ gap: 20 }}>
          <div className="kpi-grid">
            <div className="kpi">
              <div className="label">O'rtacha birinchi javob</div>
              <div className="value">{formatMinutes(summary.avgFirstResponseMinutes)}</div>
            </div>
            <div className="kpi">
              <div className="label">O'rtacha yopish vaqti</div>
              <div className="value">{formatMinutes(summary.avgResolutionMinutes)}</div>
            </div>
            <div className="kpi">
              <div className="label">O'rtacha sof ishlash vaqti</div>
              <div className="value">{formatMinutes(summary.avgNetWorkMinutes)}</div>
            </div>
            <div className="kpi">
              <div className="label">Yopilgan: bugun / hafta / oy</div>
              <div className="value">{summary.closed.today}<small> / {summary.closed.week} / {summary.closed.month}</small></div>
            </div>
          </div>
          <p className="faint" style={{ margin: 0 }}>
            Vaqt ko'rsatkichlari taqvim (24/7) asosida hisoblanadi — ish vaqti (business hours) bo'yicha hisoblash kelajakdagi SLA modulida qo'shiladi.
          </p>

          <div className="detail-grid">
            <div className="side-card" style={{ minHeight: 300 }}>
              <SectionHeader title="Vaqt bo'yicha trend" />
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={summary.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" />
                  <XAxis dataKey="day" tickFormatter={(d) => formatDate(d, false)} fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip labelFormatter={(d) => formatDate(d, false)} />
                  <Legend />
                  <Line type="monotone" dataKey="created" name="Yaratilgan" stroke={BRAND} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="closed" name="Yopilgan" stroke={SUCCESS} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="side-card" style={{ minHeight: 300 }}>
              <SectionHeader title="Ochiq murojaatlar — status bo'yicha" />
              {pieData.length === 0 ? <p className="muted">Ochiq murojaat yo'q</p> : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90} label>
                      {pieData.map((entry) => <Cell key={entry.status} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="detail-grid">
              <div className="side-card" style={{ minHeight: 300 }}>
                <SectionHeader title="Tashkilotlar bo'yicha (jami murojaat)" />
                {!orgStats || orgStats.length === 0 ? <p className="muted">Ma'lumot yo'q</p> : (
                  <ResponsiveContainer width="100%" height={Math.max(200, orgStats.length * 36)}>
                    <BarChart data={orgStats} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" />
                      <XAxis type="number" allowDecimals={false} fontSize={12} />
                      <YAxis type="category" dataKey="name" width={140} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="total" name="Jami" fill={BRAND} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="side-card" style={{ minHeight: 300 }}>
                <SectionHeader title="Mutaxassislar bo'yicha (yopilgan tiketlar)" />
                {!agentStats || agentStats.length === 0 ? <p className="muted">Ma'lumot yo'q</p> : (
                  <ResponsiveContainer width="100%" height={Math.max(200, agentStats.length * 36)}>
                    <BarChart data={agentStats} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--line-soft)" />
                      <XAxis type="number" allowDecimals={false} fontSize={12} />
                      <YAxis type="category" dataKey="fullname" width={140} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="closedCount" name="Yopilgan" fill={SUCCESS} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          <div className="detail-grid">
            <div className="side-card">
              <SectionHeader title="Kategoriya bo'yicha" />
              {summary.byCategory.length === 0 && <p className="muted">Ma'lumot yo'q</p>}
              {summary.byCategory.map((c) => {
                const max = Math.max(...summary.byCategory.map((x) => x.count));
                return (
                  <div key={c.category} style={{ marginBottom: 10 }}>
                    <div className="row-between" style={{ fontSize: 13.5 }}>
                      <span>{c.label}</span>
                      <span className="mono-num">{c.count} &middot; {formatMinutes(c.avgResolutionMinutes)}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--line-soft)', borderRadius: 3, marginTop: 4 }}>
                      <div style={{ width: `${(c.count / max) * 100}%`, height: '100%', background: 'var(--brand)', borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="side-card">
              <SectionHeader title="Muhimlik darajasi bo'yicha" />
              {summary.byPriority.length === 0 && <p className="muted">Ma'lumot yo'q</p>}
              {summary.byPriority.map((c) => {
                const max = Math.max(...summary.byPriority.map((x) => x.count));
                return (
                  <div key={c.priority} style={{ marginBottom: 10 }}>
                    <div className="row-between" style={{ fontSize: 13.5 }}>
                      <span>{c.label}</span>
                      <span className="mono-num">{c.count} &middot; {formatMinutes(c.avgResolutionMinutes)}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--line-soft)', borderRadius: 3, marginTop: 4 }}>
                      <div style={{ width: `${(c.count / max) * 100}%`, height: '100%', background: 'var(--amber)', borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="side-card">
            <SectionHeader title="Eng uzoq ochiq turgan murojaatlar" />
            {summary.longestOpen.length === 0 ? <p className="muted">Ochiq murojaat yo'q</p> : (
              <div className="table-wrap">
                <table className="data">
                  <thead><tr><th>№</th><th>Tashkilot</th><th>Mavzu</th><th>Yaratilgan</th></tr></thead>
                  <tbody>
                    {summary.longestOpen.map((t) => (
                      <tr key={t.id} onClick={() => navigate(`/tickets/${t.id}`)}>
                        <td className="mono-num">{t.number}</td>
                        <td>{t.organization_name}</td>
                        <td className="td-title">{t.title}</td>
                        <td className="faint">{formatDate(t.created_at, false)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
