const { Telegraf, Markup } = require('telegraf')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const moment = require('moment-timezone')

const bot = new Telegraf(process.env.BOT_TOKEN)
let sock

// EDIT YOUR INFO HERE
const BOT_INFO = {
  name: "༗༊𝐕𝐎𝐈𝐃-𝐂𝐑𝐎𝐒 𝐌𝐃彡★🦋❦",
  owner: "༄𝐌𝐑.𝐍𝐔𝐄𝐋♛",
  prefix: ".",
  version: "1.9.1",
  mode: "Private",
  host: "Render",
  user: "غاضب ᴘʀɪᴍᴇㅏ"
}

// Start WhatsApp MD
async function startWA() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    browser: ['VOÏD CROSS MD', 'Chrome', '1.0.0']
  })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) {
      setTimeout(startWA, 3000)
    } else if (connection === 'open') console.log('WhatsApp Connected')
  })
}
startWA()

// MAIN MENU BUTTONS
const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('♨︎ GROUP MENU ♨︎', 'menu_group'), Markup.button.callback('♨︎ DOWNLOAD ♨︎', 'menu_download')],
  [Markup.button.callback('♨︎ ANIME MENU ♨︎', 'menu_anime'), Markup.button.callback('♨︎ STICKER ♨︎', 'menu_sticker')],
  [Markup.button.callback('♨︎ VOICE MENU ♨︎', 'menu_voice'), Markup.button.callback('♨︎ GFX/LOGO ♨︎', 'menu_gfx')],
  [Markup.button.callback('♨︎ EPHOTO ♨︎', 'menu_ephoto'), Markup.button.callback('♨︎ FUN MENU ♨︎', 'menu_fun')],
  [Markup.button.callback('♨︎ GAME MENU ♨︎', 'menu_game'), Markup.button.callback('♨︎ OTHERS ♨︎', 'menu_others')],
  [Markup.button.callback('♨︎ OWNER MENU ♨︎', 'menu_owner'), Markup.button.callback('♨︎ BUG MENU ♨︎', 'menu_bug')],
  [Markup.button.callback('📱 PAIR WHATSAPP', 'pair_info')]
])

// START COMMAND - SHOWS VENOM-X STYLE MENU
bot.start(async (ctx) => {
  const speed = Date.now() - ctx.message.date * 1000
  const ram = (process.memoryUsage().heapUsed / 1024).toFixed(0)

  const menuText = `┌─────────────────────────┐
│ ${BOT_INFO.name}
├─────────────────────────┤
│ *Bot Name*: ${BOT_INFO.name}
┃ *ᴏᴡɴᴇʀ* : ${BOT_INFO.owner}
┃ *ᴘʀᴇғɪx* : [ ${BOT_INFO.prefix} ]
┃ *ʜᴏsᴛ* : ${BOT_INFO.host}
┃ *ᴜsᴇʀ* : ${BOT_INFO.user}
┃ *ᴘʟᴜɢɪɴs* : 327
┃ *ᴍᴏᴅᴇ* : ${BOT_INFO.mode}
┃ *ᴠᴇʀsɪᴏɴ* : ${BOT_INFO.version}
┃ *sᴘᴇᴇᴅ* : ${speed} ms
┃ *ᴜsᴀɢᴇ* : ${ram} MB
┃ *ʀᴀᴍ:* [█████████░] 94%
┗▣

*Tap a category below to view commands* 👇`

  await ctx.reply(menuText, { parse_mode: 'Markdown',...mainMenu })
})

bot.command('menu', ctx => ctx.reply('Use /start for main menu'))
bot.command('ping', ctx => ctx.reply(`*Pong!* 🏓\nSpeed: ${Date.now() - ctx.message.date * 1000}ms`, { parse_mode: 'Markdown' }))
bot.command('alive', ctx => ctx.reply(`*${BOT_INFO.name}* ✅\nOwner: ${BOT_INFO.owner}\nHost: ${BOT_INFO.host}`, { parse_mode: 'Markdown' }))

// PAIR COMMAND
bot.command('pair', async (ctx) => {
  const num = ctx.message.text.split(' ')[1]?.replace(/[^0-9]/g, '')
  if (!num) return ctx.replyWithMarkdown('*Usage:* `/pair 2348012345678`\n\nLink your WhatsApp to use MD features')
  if (!sock) return ctx.reply('⏳ WhatsApp starting... try in 15s')

  try {
    await ctx.reply(`⏳ *Generating code for +${num}...*`, { parse_mode: 'Markdown' })
    const code = await sock.requestPairingCode(num)
    ctx.replyWithMarkdown(`*✅ PAIRING CODE* \n\n*Number:* \`+${num}\`\n*Code:* \`${code}\`\n\n*WhatsApp → Linked Devices → Link with phone number*\n\n⚠️ Expires in 60s`)
  } catch (e) {
    ctx.reply(`❌ *Failed:* ${e.message}`, { parse_mode: 'Markdown' })
  }
})

// MENU CATEGORIES
bot.action('menu_group', ctx => {
  ctx.editMessageText(`♨︎ ɢʀᴏᴜᴘ ᴍᴇɴᴜ ♨︎\n│\n.hidetag\n│\n.tagall\n│\n.demote\n│\n.promote\n│\n.mute\n│\n.unmute\n│\n.kick\n│\n.add\n│\n.antilink\n│\n.grouplink\n│\n.welcome\n┗┅┅┅➢`, {
    parse_mode: 'Markdown',
   ...Markup.inlineKeyboard([[Markup.button.callback('« Back', 'back_main')]])
  })
})

bot.action('menu_download', ctx => {
  ctx.editMessageText(`♨︎ ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ ♨︎\n│\n.play\n│\n.play2\n│\n.tiktok\n│\n.ytsearch\n│\n.tomp3\n│\n.tomp4\n│\n.apk\n│\n.qrcode\n┗┅┅┅➢`, {
    parse_mode: 'Markdown',
   ...Markup.inlineKeyboard([[Markup.button.callback('« Back', 'back_main')]])
  })
})

bot.action('menu_owner', ctx => {
  ctx.editMessageText(`♨︎ ᴏᴡɴᴇʀ ᴍᴇɴᴜ ♨︎\n│\n.setpp\n│\n.owner\n│\n.ban\n│\n.unban\n│\n.block\n│\n.alive\n│\n.ping\n│\n.self\n│\n.public\n┗┅┅┅➢`, {
    parse_mode: 'Markdown',
   ...Markup.inlineKeyboard([[Markup.button.callback('« Back', 'back_main')]])
  })
})

bot.action('back_main', async ctx => {
  const speed = Date.now() - ctx.callbackQuery.message.date * 1000
  const ram = (process.memoryUsage().heapUsed / 1024).toFixed(0)

  const menuText = `┌─────────────────────────┐
│ ${BOT_INFO.name}
├─────────────────────────┤
│ *Bot Name*: ${BOT_INFO.name}
┃ *ᴏᴡɴᴇʀ* : ${BOT_INFO.owner}
┃ *ᴘʀᴇғɪx* : [ ${BOT_INFO.prefix} ]
┃ *ʜᴏsᴛ* : ${BOT_INFO.host}
┃ *ᴜsᴇʀ* : ${BOT_INFO.user}
┃ *ᴘʟᴜɢɪɴs* : 327
┃ *ᴍᴏᴅᴇ* : ${BOT_INFO.mode}
┃ *ᴠᴇʀsɪᴏɴ* : ${BOT_INFO.version}
┃ *sᴘᴇᴇᴅ* : ${speed} ms
┃ *ᴜsᴀɢᴇ* : ${ram} MB
┃ *ʀᴀᴍ:* [█████████░] 94%
┗▣

*Tap a category below to view commands* 👇`

  await ctx.editMessageText(menuText, { parse_mode: 'Markdown',...mainMenu })
})

bot.action('pair_info', ctx => {
  ctx.answerCbQuery()
  ctx.replyWithMarkdown('*📱 PAIR WHATSAPP*\n\nUse: `/pair 2348012345678`\n\nLink your number to use WhatsApp MD')
})

bot.launch()
console.log(`${BOT_INFO.name} Started`)
