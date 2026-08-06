import { Telegraf, Markup } from 'telegraf';
import { config } from '../config.js';
import { db } from '../db.js';
import { changeStatus, getTicketById } from '../services/tickets.service.js';

if (!config.botToken) {
  console.error('BOT_TOKEN .env faylida korsatilmagan');
  process.exit(1);
}

const bot = new Telegraf(config.botToken);

const welcome =
  'Silknode Support xizmatiga xush kelibsiz.\n\n' +
  'Texnik yordam so\'rash uchun quyidagi tugma orqali Service Desk\'ni oching. ' +
  'Murojaatingizga javob kelganda shu chatga bildirishnoma yuboriladi.';

const askPhoneText =
  "Davom etishdan oldin telefon raqamingizni tasdiqlang.\n\n" +
  "Quyidagi \"Raqamni ulashish\" tugmasini bosing — bu eng ishonchli usul, chunki Telegram bu raqam " +
  "haqiqatan sizning akkauntingizga tegishli ekanini o'zi tasdiqlaydi.";

/**
 * Telegram Desktop ba'zan bir marta ochilgan Mini App'ning WebView'ini keshlab
 * qo'yadi va keyingi safar tugma bosilganda eski (initData'siz) sahifani qayta
 * ko'rsatadi. Har safar tugma yuborilganda URL'ga unique query parametr
 * qo'shib, Telegram'ni har doim yangi WebView ochishga majburlaymiz.
 */
const withCacheBust = (url) => {
  const u = new URL(url);
  u.searchParams.set('ts', Date.now().toString());
  return u.toString();
};

const miniAppKeyboard = () =>
  Markup.keyboard([[Markup.button.webApp("Service Desk'ni ochish", withCacheBust(config.miniAppUrl))]]).resize();
const phoneKeyboard = Markup.keyboard([[Markup.button.contactRequest("Raqamni ulashish")]])
  .resize()
  .oneTime();

const adminWelcome = 'Administrator sifatida tanildingiz.\n\nAdmin panelni ochish uchun quyidagi tugmani bosing.';
const adminKeyboard = () =>
  Markup.keyboard([[Markup.button.webApp("Admin Panel'ni ochish", withCacheBust(config.adminUrl))]]).resize();

/** Faqat config'dagi superadmin Telegram ID'siga tenglikni tekshiradi. */
const isSuperadmin = (from) => String(from.id) === String(config.superadminTelegramId);

/** telegram_id bo'yicha foydalanuvchini topadi, topilmasa yangi qator yaratadi. */
async function findOrCreateUser(from) {
  const telegramId = String(from.id);
  const { rows } = await db.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
  if (rows[0]) return rows[0];

  const fullname = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Foydalanuvchi';
  const inserted = await db.query(
    'INSERT INTO users (telegram_id, fullname, username, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [telegramId, fullname, from.username || null, 'user']
  );
  return inserted.rows[0];
}

bot.start(async (ctx) => {
  if (isSuperadmin(ctx.from)) {
    await findOrCreateUser(ctx.from);
    return ctx.reply(adminWelcome, adminKeyboard());
  }

  const user = await findOrCreateUser(ctx.from);
  if (!user.phone) {
    return ctx.reply(askPhoneText, phoneKeyboard);
  }
  return ctx.reply(welcome, miniAppKeyboard());
});

bot.help((ctx) => ctx.reply("Service Desk'ni ochish tugmasini bosing yoki /start buyrug'ini yuboring."));

// Generic 'message' handlerdan oldin ro'yxatdan o'tishi shart, aks holda contact
// xabarlari o'sha umumiy handlerda "yutilib" ketadi va bu yerga yetib kelmaydi.
bot.on('contact', async (ctx) => {
  const contact = ctx.message.contact;

  // Foydalanuvchi boshqa birovning kontaktini yuborib, uni o'ziniki qilib ko'rsatishi mumkin emas.
  if (String(contact.user_id) !== String(ctx.from.id)) {
    return ctx.reply(
      "Faqat o'zingizning telefon raqamingizni yuborishingiz mumkin. Iltimos, \"Raqamni ulashish\" tugmasidan foydalaning.",
      phoneKeyboard
    );
  }

  const user = await findOrCreateUser(ctx.from);
  await db.query('UPDATE users SET phone = $1 WHERE id = $2', [contact.phone_number, user.id]);

  await ctx.reply('Rahmat! Raqamingiz tasdiqlandi.', Markup.removeKeyboard());
  return ctx.reply(welcome, miniAppKeyboard());
});

// "Hal qilindi" holatida foydalanuvchiga yuborilgan Ha/Yo'q tasdiqlash tugmalari.
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery?.data || '';
  const match = /^confirm:(\d+):(yes|no)$/.exec(data);
  if (!match) return ctx.answerCbQuery();

  const [, ticketIdRaw, answer] = match;
  try {
    const ticket = await getTicketById(Number(ticketIdRaw));
    if (!ticket) return ctx.answerCbQuery('Murojaat topilmadi', { show_alert: true });

    const user = await findOrCreateUser(ctx.from);
    if (ticket.author_id !== user.id) {
      return ctx.answerCbQuery('Bu tugma sizga tegishli emas', { show_alert: true });
    }
    if (ticket.status !== 'resolved') {
      return ctx.answerCbQuery('Bu murojaat allaqachon boshqa holatda', { show_alert: true });
    }

    const nextStatus = answer === 'yes' ? 'closed' : 'in_progress';
    await changeStatus({ ticket, status: nextStatus, actor: user });
    await ctx.answerCbQuery(answer === 'yes' ? 'Rahmat! Murojaat yopildi.' : 'Tushunarli, mutaxassis davom etadi.');
    await ctx.editMessageReplyMarkup(undefined).catch(() => {});
  } catch (err) {
    console.error('[bot] callback_query xatosi:', err.message);
    await ctx.answerCbQuery('Xatolik yuz berdi', { show_alert: true });
  }
});

bot.on('message', async (ctx) => {
  if (isSuperadmin(ctx.from)) {
    await findOrCreateUser(ctx.from);
    return ctx.reply(adminWelcome, adminKeyboard());
  }

  const user = await findOrCreateUser(ctx.from);
  if (!user.phone) {
    return ctx.reply(askPhoneText, phoneKeyboard);
  }
  return ctx.reply("Murojaatlar Service Desk ilovasi orqali qabul qilinadi.", miniAppKeyboard());
});

bot.launch().then(() => console.log('Telegram bot ishga tushdi'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
