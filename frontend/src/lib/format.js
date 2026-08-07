export const STATUS = {
  new:          { label: 'Yangi',                        variant: 'informative' },
  in_progress:  { label: 'Ish jarayonida',               variant: 'caution' },
  waiting_user: { label: 'Foydalanuvchi javobi kutilmoqda', variant: 'accent' },
  resolved:     { label: 'Hal qilindi',                  variant: 'positive' },
  closed:       { label: 'Yopildi',                      variant: 'neutral' },
};

export const PRIORITY = {
  low:      { label: 'Past',      variant: 'neutral' },
  medium:   { label: "O'rtacha",  variant: 'informative' },
  high:     { label: 'Yuqori',    variant: 'caution' },
  critical: { label: 'Kritik',    variant: 'critical' },
};

export const CATEGORY = {
  erp: 'ERP', crm: 'CRM', production: 'Ishlab chiqarish', website: 'Veb-sayt',
  telephony: 'Telefoniya', email: 'Elektron pochta', network: 'Tarmoq', other: 'Boshqa',
};

export const ROLE = { user: 'Foydalanuvchi', agent: 'Texnik mutaxassis', admin: 'Administrator' };

export function formatDate(value, withTime = true) {
  if (!value) return '—';
  const d = new Date(value);
  const date = d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return withTime ? `${date} ${d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}` : date;
}

export function formatMinutes(min) {
  if (min === null || min === undefined) return '—';
  if (min < 60) return `${min} daq`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat ${min % 60} daq`;
  return `${Math.floor(h / 24)} kun ${h % 24} soat`;
}

export function timeAgo(value) {
  if (!value) return '—';
  const diff = Math.round((Date.now() - Date.parse(value)) / 60000);
  if (diff < 1) return 'hozir';
  if (diff < 60) return `${diff} daq oldin`;
  if (diff < 1440) return `${Math.floor(diff / 60)} soat oldin`;
  return formatDate(value, false);
}

export const bytes = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
