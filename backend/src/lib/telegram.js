import crypto from 'node:crypto';
import { config } from '../config.js';

/**
 * Telegram Mini App initData imzosini tekshiradi.
 * Hujjat: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function parseInitData(initData) {
  // BOT_TOKEN bo'sh bo'lsa, imzo pastda bo'sh maxfiy kalit bilan hisoblanadi —
  // bu ochiq algoritm bo'lgani uchun har kim shu tarzda hash'ni soxtalashtira oladi.
  if (!config.botToken) throw new Error('BOT_TOKEN sozlanmagan, initData tekshirib bo\'lmaydi');

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new Error('initData ichida hash topilmadi');
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(config.botToken).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (computed !== hash) throw new Error('initData imzosi yaroqsiz');

  const authDate = Number(params.get('auth_date') || 0);
  if (Date.now() / 1000 - authDate > 86400) throw new Error('initData muddati tugagan');

  return JSON.parse(params.get('user') || '{}');
}

/**
 * @param {object} [options]
 * @param {Array<Array<{text:string, callback_data:string}>>} [options.buttons] - "Ko'rish" tugmasidan oldin qo'shiladigan qo'shimcha tugma qatorlari (masalan, Ha/Yo'q tasdiqlash)
 */
export async function sendTelegramMessage(telegramId, text, ticketId, options = {}) {
  if (!config.botToken || !telegramId) return;
  const keyboard = [...(options.buttons || [])];
  if (ticketId) {
    keyboard.push([
      { text: 'Murojaatni ochish', web_app: { url: `${config.miniAppUrl}?ticket=${ticketId}&ts=${Date.now()}` } },
    ]);
  }
  const body = {
    chat_id: telegramId,
    text,
    parse_mode: 'HTML',
    ...(keyboard.length ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  };
  try {
    await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error('[telegram] bildirishnoma yuborilmadi:', err.message);
  }
}
