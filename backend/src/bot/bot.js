import { Telegraf, Markup } from 'telegraf';
import { config } from '../config.js';
import { db } from '../db.js';

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

const miniAppKeyboard = Markup.keyboard([[Markup.button.webApp("Service Desk'ni ochish", config.miniAppUrl)]]).resize();
const phoneKeyboard = Markup.keyboard([[Markup.button.contactRequest("Raqamni ulashish")]])
  .resize()
  .oneTime();

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
  const user = await findOrCreateUser(ctx.from);
  if (!user.phone) {
    return ctx.reply(askPhoneText, phoneKeyboard);
  }
  return ctx.reply(welcome, miniAppKeyboard);
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
  return ctx.reply(welcome, miniAppKeyboard);
});

bot.on('message', async (ctx) => {
  const user = await findOrCreateUser(ctx.from);
  if (!user.phone) {
    return ctx.reply(askPhoneText, phoneKeyboard);
  }
  return ctx.reply("Murojaatlar Service Desk ilovasi orqali qabul qilinadi.", miniAppKeyboard);
});

bot.launch().then(() => console.log('Telegram bot ishga tushdi'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
