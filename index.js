
const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// /start command
bot.start((ctx) => {
  ctx.reply(`☠️ *VOÏD CROSS MD* 
Born from void. Feeds on chaos.

Use /grimoire to see all commands.
Master: @cross006`, { parse_mode: 'Markdown' });
});

// /ping command
bot.command('ping', (ctx) => {
  ctx.reply('Pong! VOÏD CROSS is alive 😈');
});

// /void command
bot.command('void', (ctx) => {
  const text = ctx.message.text.split(' ').slice(1).join(' ');
  if (!text) return ctx.reply('☠️ Speak into the void. Example: `/void who are you`', { parse_mode: 'Markdown' });
  ctx.reply(`*VOÏD whispers:* ${text.split('').reverse().join('')}`, { parse_mode: 'Markdown' });
});

// /grimoire - list commands
bot.command('grimoire', (ctx) => {
  ctx.reply(`*☠️ VOÏD CROSS GRIMOIRE ☠️*

/ping - Check if bot is alive
/void <text> - Speak to the void
/grimoire - Show this menu
/about - Bot info
/dl - Download media [coming soon]
/ai - Demonic AI [coming soon]
/owner - Contact master
/bug - Report issues

*Master:* @cross006`, { parse_mode: 'Markdown' });
});

// /about command
bot.command('about', (ctx) => {
  ctx.reply(`*VOÏD CROSS MD*
Dark multi-purpose bot born from chaos.

*Version:* 1.0.0 Void
*Master:* @cross006
*Power:* Telegraf + Node.js`, { parse_mode: 'Markdown' });
});

// /owner command
bot.command('owner', (ctx) => {
  ctx.reply('My master is @cross006 😈');
});

// /bug command
bot.command('bug', (ctx) => {
  ctx.reply('Found a bug? Report to @cross006 with screenshots.');
});

// Placeholder for /dl and /ai
bot.command(['dl', 'ai'], (ctx) => {
  ctx
