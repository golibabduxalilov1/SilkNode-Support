import { Telegraf, Markup } from 'telegraf';
import { config } from '../config.js';

if (!config.botToken) {
  console.error('BOT_TOKEN .env faylida korsatilmagan');
  process.exit(1);
}

const bot = new Telegraf(config.botToken);

const welcome =
  'Silknode Support xizmatiga xush kelibsiz.\n\n' +
  'Texnik yordam so\'rash uchun quyidagi tugma orqali Service Desk\'ni oching. ' +
  'Murojaatingizga javob kelganda shu chatga bildirishnoma yuboriladi.';

bot.start((ctx) =>
  ctx.reply(welcome, Markup.keyboard([[Markup.button.webApp("Service Desk'ni ochish", config.miniAppUrl)]]).resize())
);

bot.help((ctx) => ctx.reply("Service Desk'ni ochish tugmasini bosing yoki /start buyrug'ini yuboring."));

bot.on('message', (ctx) =>
  ctx.reply(
    "Murojaatlar Service Desk ilovasi orqali qabul qilinadi.",
    Markup.keyboard([[Markup.button.webApp("Service Desk'ni ochish", config.miniAppUrl)]]).resize()
  )
);

bot.launch().then(() => console.log('Telegram bot ishga tushdi'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
