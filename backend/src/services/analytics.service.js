import ExcelJS from 'exceljs';
import { db } from '../db.js';
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, OPEN_STATUSES } from '../config.js';

const daysAgoIso = (n) => new Date(Date.now() - n * 86400000).toISOString();

/**
 * `tickets t` uchun WHERE bo'lagini va unga mos parametrlar massivini quradi. Har chaqiruv
 * mustaqil, yangi $1.. dan boshlanadigan massiv qaytaradi — turli so'rovlarda bir xil `args`
 * massivini qayta ishlatish (masalan sana filtri kerak bo'lmagan so'rovda ham uzatilib ketishi)
 * parametr sonini mos kelmay qolishiga olib kelgani uchun ataylab har doim yangidan quriladi.
 */
function whereFragment(filters, { includeDate = true, includeOrg = true, includeCategory = true, includeAgent = true } = {}) {
  const args = [];
  const parts = [];
  if (includeDate && filters.from) { args.push(filters.from); parts.push(`t.created_at >= $${args.length}`); }
  if (includeDate && filters.to) { args.push(filters.to); parts.push(`t.created_at <= $${args.length}`); }
  if (includeOrg && filters.organizationId) { args.push(Number(filters.organizationId)); parts.push(`t.organization_id = $${args.length}`); }
  if (includeCategory && filters.category) { args.push(filters.category); parts.push(`t.category = $${args.length}`); }
  if (includeAgent && filters.agentId) { args.push(Number(filters.agentId)); parts.push(`t.assigned_to = $${args.length}`); }
  return { sql: parts.length ? `AND ${parts.join(' AND ')}` : '', args };
}

export async function analyticsSummary(filters = {}) {
  const withDate = whereFragment(filters);
  const noDate = whereFragment(filters, { includeDate: false });

  const one = async (sql, args) => (await db.query(sql, args)).rows[0];

  const avg = await one(
    `SELECT ROUND(AVG(first_response_minutes)) frt, ROUND(AVG(resolution_minutes)) rt, ROUND(AVG(net_work_minutes)) nwt
     FROM tickets t WHERE 1=1 ${withDate.sql}`,
    withDate.args
  );

  const closed = {
    today: (await one(`SELECT COUNT(*)::int c FROM tickets t WHERE t.closed_at::date = CURRENT_DATE ${noDate.sql}`, noDate.args)).c,
    week: (await one(`SELECT COUNT(*)::int c FROM tickets t WHERE t.closed_at >= now() - interval '7 days' ${noDate.sql}`, noDate.args)).c,
    month: (await one(`SELECT COUNT(*)::int c FROM tickets t WHERE t.closed_at >= now() - interval '30 days' ${noDate.sql}`, noDate.args)).c,
  };

  const { rows: openByStatus } = await db.query(
    `SELECT t.status, COUNT(*)::int c FROM tickets t WHERE t.status = ANY($${noDate.args.length + 1}) ${noDate.sql} GROUP BY t.status`,
    [...noDate.args, OPEN_STATUSES]
  );

  const { rows: longestOpen } = await db.query(
    `SELECT t.id, t.number, t.title, t.status, t.priority, t.created_at, o.name AS organization_name
     FROM tickets t JOIN organizations o ON o.id = t.organization_id
     WHERE t.status = ANY($${noDate.args.length + 1}) ${noDate.sql}
     ORDER BY t.created_at ASC LIMIT 10`,
    [...noDate.args, OPEN_STATUSES]
  );

  const { rows: byCategory } = await db.query(
    `SELECT t.category, COUNT(*)::int c, ROUND(AVG(t.resolution_minutes)) avg_resolution_minutes
     FROM tickets t WHERE 1=1 ${withDate.sql} GROUP BY t.category ORDER BY c DESC`,
    withDate.args
  );

  const { rows: byPriority } = await db.query(
    `SELECT t.priority, COUNT(*)::int c, ROUND(AVG(t.resolution_minutes)) avg_resolution_minutes
     FROM tickets t WHERE 1=1 ${withDate.sql} GROUP BY t.priority ORDER BY c DESC`,
    withDate.args
  );

  // Trend: davr berilmasa oxirgi 30 kun.
  const trendFrom = (filters.from || daysAgoIso(29)).slice(0, 10);
  const trendTo = (filters.to || new Date().toISOString()).slice(0, 10);
  const trendExtra = whereFragment(filters, { includeDate: false });
  const trendArgs = [trendFrom, trendTo, ...trendExtra.args];
  // trendExtra.sql ichidagi $N'lar whereFragment ichida $1'dan boshlab hisoblangan edi;
  // bu yerda $1/$2 sana oralig'iga band qilingani uchun qolgan parametrlarni 2 ta siljitamiz.
  const shiftedTrendExtra = trendExtra.sql.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + 2}`);
  const { rows: trend } = await db.query(
    `WITH days AS (SELECT generate_series($1::date, $2::date, interval '1 day')::date AS day),
      created AS (SELECT t.created_at::date AS day, COUNT(*)::int c FROM tickets t WHERE t.created_at::date BETWEEN $1::date AND $2::date ${shiftedTrendExtra} GROUP BY 1),
      closed AS (SELECT t.closed_at::date AS day, COUNT(*)::int c FROM tickets t WHERE t.closed_at IS NOT NULL AND t.closed_at::date BETWEEN $1::date AND $2::date ${shiftedTrendExtra} GROUP BY 1)
     SELECT days.day, COALESCE(created.c,0) AS created, COALESCE(closed.c,0) AS closed
     FROM days LEFT JOIN created ON created.day = days.day LEFT JOIN closed ON closed.day = days.day
     ORDER BY days.day`,
    trendArgs
  );

  return {
    avgFirstResponseMinutes: Number(avg.frt) || 0,
    avgResolutionMinutes: Number(avg.rt) || 0,
    avgNetWorkMinutes: Number(avg.nwt) || 0,
    closed,
    openByStatus: openByStatus.map((r) => ({ status: r.status, label: STATUS_LABELS[r.status] || r.status, count: r.c })),
    longestOpen,
    byCategory: byCategory.map((r) => ({ category: r.category, label: CATEGORY_LABELS[r.category] || r.category, count: r.c, avgResolutionMinutes: Number(r.avg_resolution_minutes) || null })),
    byPriority: byPriority.map((r) => ({ priority: r.priority, label: PRIORITY_LABELS[r.priority] || r.priority, count: r.c, avgResolutionMinutes: Number(r.avg_resolution_minutes) || null })),
    trend: trend.map((r) => ({ day: r.day, created: r.created, closed: r.closed })),
  };
}

export async function analyticsByOrganizations(filters = {}) {
  const frag = whereFragment(filters, { includeOrg: false });

  const { rows: orgs } = await db.query(
    `SELECT o.id, o.name, o.contact_person, o.contact_phone,
            COUNT(t.id)::int total,
            SUM(CASE WHEN t.status IN ('new','in_progress','waiting_user') THEN 1 ELSE 0 END)::int open_count,
            SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END)::int closed_count,
            ROUND(AVG(t.resolution_minutes)) avg_resolution_minutes
     FROM organizations o
     LEFT JOIN tickets t ON t.organization_id = o.id ${frag.sql}
     GROUP BY o.id ORDER BY total DESC`,
    frag.args
  );

  const { rows: categoryRows } = await db.query(
    `SELECT t.organization_id, t.category, COUNT(*)::int c
     FROM tickets t WHERE 1=1 ${frag.sql} GROUP BY t.organization_id, t.category`,
    frag.args
  );

  return orgs.map((o) => ({
    id: o.id,
    name: o.name,
    contactPerson: o.contact_person,
    contactPhone: o.contact_phone,
    total: o.total,
    openCount: o.open_count,
    closedCount: o.closed_count,
    avgResolutionMinutes: Number(o.avg_resolution_minutes) || null,
    categoryBreakdown: categoryRows
      .filter((r) => r.organization_id === o.id)
      .map((r) => ({ category: r.category, label: CATEGORY_LABELS[r.category] || r.category, count: r.c })),
  }));
}

export async function analyticsByAgents(filters = {}) {
  const frag = whereFragment(filters, { includeAgent: false });

  const { rows: agents } = await db.query(
    `SELECT u.id, u.fullname,
            COUNT(t.id)::int assigned_count,
            SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END)::int closed_count,
            ROUND(AVG(t.first_response_minutes)) avg_first_response_minutes,
            ROUND(AVG(t.resolution_minutes)) avg_resolution_minutes
     FROM users u
     LEFT JOIN tickets t ON t.assigned_to = u.id ${frag.sql}
     WHERE u.role IN ('agent','admin') AND u.is_active = true
     GROUP BY u.id ORDER BY closed_count DESC`,
    frag.args
  );

  const { rows: workloadRows } = await db.query(
    "SELECT assigned_to, COUNT(*)::int c FROM tickets WHERE status IN ('new','in_progress','waiting_user') AND assigned_to IS NOT NULL GROUP BY assigned_to"
  );
  const workloadById = Object.fromEntries(workloadRows.map((r) => [r.assigned_to, r.c]));

  return agents.map((a) => ({
    id: a.id,
    fullname: a.fullname,
    assignedCount: a.assigned_count,
    closedCount: a.closed_count,
    avgFirstResponseMinutes: Number(a.avg_first_response_minutes) || null,
    avgResolutionMinutes: Number(a.avg_resolution_minutes) || null,
    currentWorkload: workloadById[a.id] || 0,
  }));
}

const SHEET_COLUMNS = [
  { header: '№', key: 'number', width: 14 },
  { header: 'Tashkilot', key: 'organization_name', width: 20 },
  { header: 'Foydalanuvchi', key: 'author_name', width: 20 },
  { header: 'Mavzu', key: 'title', width: 32 },
  { header: 'Kategoriya', key: 'category_label', width: 16 },
  { header: 'Muhimlik', key: 'priority_label', width: 12 },
  { header: 'Status', key: 'status_label', width: 22 },
  { header: "Mas'ul", key: 'assignee_name', width: 20 },
  { header: 'Yaratilgan', key: 'created_at', width: 18 },
  { header: 'Birinchi javob (daq)', key: 'first_response_minutes', width: 16 },
  { header: 'Yopish vaqti (daq)', key: 'resolution_minutes', width: 16 },
  { header: 'Sof ishlash (daq)', key: 'net_work_minutes', width: 16 },
];

export async function exportTicketsXlsx(items) {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Murojaatlar');
  sheet.columns = SHEET_COLUMNS;
  sheet.getRow(1).font = { bold: true };
  for (const t of items) {
    sheet.addRow({
      number: t.number,
      organization_name: t.organization_name,
      author_name: t.author_name,
      title: t.title,
      category_label: CATEGORY_LABELS[t.category] || t.category,
      priority_label: PRIORITY_LABELS[t.priority] || t.priority,
      status_label: STATUS_LABELS[t.status] || t.status,
      assignee_name: t.assignee_name || '',
      created_at: t.created_at ? new Date(t.created_at).toLocaleString('uz-UZ') : '',
      first_response_minutes: t.first_response_minutes,
      resolution_minutes: t.resolution_minutes,
      net_work_minutes: t.net_work_minutes,
    });
  }
  return wb.xlsx.writeBuffer();
}

export async function analyticsExport(filters = {}) {
  const [summary, organizations, agents] = await Promise.all([
    analyticsSummary(filters),
    analyticsByOrganizations(filters),
    analyticsByAgents(filters),
  ]);

  const wb = new ExcelJS.Workbook();

  const s = wb.addWorksheet('Umumiy');
  s.columns = [{ header: 'Ko\'rsatkich', key: 'k', width: 40 }, { header: 'Qiymat', key: 'v', width: 20 }];
  s.getRow(1).font = { bold: true };
  s.addRows([
    { k: "O'rtacha birinchi javob vaqti (daq)", v: summary.avgFirstResponseMinutes },
    { k: "O'rtacha yopish vaqti (daq)", v: summary.avgResolutionMinutes },
    { k: "O'rtacha sof ishlash vaqti (daq)", v: summary.avgNetWorkMinutes },
    { k: 'Bugun yopilgan', v: summary.closed.today },
    { k: 'Hafta ichida yopilgan', v: summary.closed.week },
    { k: 'Oy ichida yopilgan', v: summary.closed.month },
  ]);
  s.addRow({});
  s.addRow({ k: 'Kategoriya', v: 'Soni / O\'rtacha yopish (daq)' }).font = { bold: true };
  summary.byCategory.forEach((c) => s.addRow({ k: c.label, v: `${c.count} / ${c.avgResolutionMinutes ?? '—'}` }));

  const o = wb.addWorksheet('Tashkilotlar');
  o.columns = [
    { header: 'Tashkilot', key: 'name', width: 24 },
    { header: 'Jami', key: 'total', width: 10 },
    { header: 'Ochiq', key: 'open', width: 10 },
    { header: 'Yopiq', key: 'closed', width: 10 },
    { header: "O'rtacha yopish (daq)", key: 'avg', width: 20 },
  ];
  o.getRow(1).font = { bold: true };
  organizations.forEach((org) => o.addRow({ name: org.name, total: org.total, open: org.openCount, closed: org.closedCount, avg: org.avgResolutionMinutes ?? '—' }));

  const a = wb.addWorksheet('Mutaxassislar');
  a.columns = [
    { header: 'Mutaxassis', key: 'name', width: 24 },
    { header: 'Tayinlangan', key: 'assigned', width: 14 },
    { header: 'Yopilgan', key: 'closed', width: 12 },
    { header: "O'rtacha javob (daq)", key: 'frt', width: 18 },
    { header: "O'rtacha yopish (daq)", key: 'rt', width: 18 },
    { header: 'Joriy yuklama', key: 'workload', width: 14 },
  ];
  a.getRow(1).font = { bold: true };
  agents.forEach((ag) => a.addRow({ name: ag.fullname, assigned: ag.assignedCount, closed: ag.closedCount, frt: ag.avgFirstResponseMinutes ?? '—', rt: ag.avgResolutionMinutes ?? '—', workload: ag.currentWorkload }));

  return wb.xlsx.writeBuffer();
}
