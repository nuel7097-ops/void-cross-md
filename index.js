import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT || 3000;
const URL = 'https://void-cross-md.onrender.com';

bot.start((ctx) => ctx.reply('VOÏD CROSS MD is online 🔥\nUse /ping to test me'));

bot.command('ping', (ctx) => ctx.reply('Pong! VOÏD CROSS is alive 😈'));

bot.command('grimoire', (ctx) => ctx.reply('*VOID CROSS GRIMOIRE*\n\n/ping - Check if bot alive\n/grimoire - Show commands\n/void <text> - Reverse text'));

bot.command('void', (ctx) => {
  const text = ctx.message.text.replace('/void ', '');
  if (!text) return ctx.reply('Usage: /void hello');
  const reversed = text.split('').reverse().join('');
  ctx.reply(reversed);
});

bot.launch({
  webhook: {
    domain: URL,
    port: PORT
  }
});

console.log('Bot running via webhook');
