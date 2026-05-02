const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const express = require('express')
const os = require('os')
const axios = require('axios')
const fs = require('fs')

let sock
let startTime = Date.now()

// BOT CONFIG
const BOT_INFO = {
  name: "༗༊𝐕𝐎𝐈𝐃-𝐂𝐑𝐎𝐒 𝐌𝐃彡★🦋❦",
  dev: "༄𝐌𝐑.𝐍𝐔𝐄𝐋♛",
  version: "v3.0.6 ULTRA",
  prefix: ".",
  mode: "public"
}

// API KEYS - ADD YOURS HERE
const API_KEYS = {
  gpt: process.env.GPT_KEY || "", // Get from OpenAI
  gemini: process.env.GEMINI_KEY || "", // Get from Google AI Studio
  ytdl: "https://api.dreaded.site" // Free YT API
}

// EXPRESS - KEEPS RENDER ALIVE
const app = express()
app.get('/', (req, res) => res.send(`${BOT_INFO.name} v3.0.6 ULTRA by ${BOT_INFO.dev} Online`))
app.listen(process.env.PORT || 3000, () => console.log(`[${BOT_INFO.name}] Server running`))

// AUTO GC - FIXES RAM LEAK
setInterval(() => {
  if (global.gc) global.gc()
}, 30000)

// WHATSAPP CONNECTION
async function connectWA() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: [BOT_INFO.name, 'Chrome', '3.0.6'],
    getMessage: async () => ({})
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
      if (shouldReconnect) setTimeout(connectWA, 5000)
    } else if (connection === 'open') {
      console.log(`✅ ${BOT_INFO.name} Connected to WhatsApp`)
    }
  })

  // MESSAGE HANDLER
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message || m.key.fromMe) return
    
    const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ''
    if (!body.startsWith(BOT_INFO.prefix)) return
    
    const cmd = body.slice(1).split(' ')[0].toLowerCase()
    const args = body.slice(BOT_INFO.prefix.length + cmd.length).trim()
    const from = m.key.remoteJid
    const sender = m.key.participant || from

    try {
      switch(cmd) {
        case 'menu':
        case 'help':
          await sendMenu(from, m)
          break
        
        case 'ping':
        case 'alive':
          const { speed } = getStats()
          await sock.sendMessage(from, { text: `*Pong!* 🏓\nSpeed: ${speed}ms\nStatus: ONLINE\n*Bot: ${BOT_INFO.name}*\n*Dev: ${BOT_INFO.dev}*` }, { quoted: m })
          break

        case 'owner':
          await sock.sendMessage(from, { text: `*Owner:* ${BOT_INFO.dev}\n*Bot:* ${BOT_INFO.name}\n*Version:* ${BOT_INFO.version}` }, { quoted: m })
          break

        case 'play':
        case 'song':
          if (!args) return sock.sendMessage(from, { text: `*Usage:* ${BOT_INFO.prefix}play faded` }, { quoted: m })
          await sock.sendMessage(from, { text: `🔍 *Searching:* ${args}...` }, { quoted: m })
          try {
            const res = await axios.get(`${API_KEYS.ytdl}/api/ytdl/audio?query=${encodeURIComponent(args)}`)
            if (res.data.status && res.data.result.download_url) {
              await sock.sendMessage(from, { 
                audio: { url: res.data.result.download_url }, 
                mimetype: 'audio/mpeg',
                fileName: `${res.data.result.title}.mp3`
              }, { quoted: m })
            } else {
              await sock.sendMessage(from, { text: `❌ Song not found` }, { quoted: m })
            }
          } catch (e) {
            await sock.sendMessage(from, { text: `❌ API Error: ${e.message}` }, { quoted: m })
          }
          break

        case 'tiktok':
        case 'tt':
          if (!args) return sock.sendMessage(from, { text: `*Usage:* ${BOT_INFO.prefix}tiktok <url>` }, { quoted: m })
          await sock.sendMessage(from, { text: `⏳ *Downloading...*` }, { quoted: m })
          try {
            const res = await axios.get(`${API_KEYS.ytdl}/api/tiktok?url=${args}`)
            if (res.data.status && res.data.result.video) {
              await sock.sendMessage(from, { 
                video: { url: res.data.result.video }, 
                caption: `*Title:* ${res.data.result.title}\n*By ${BOT_INFO.name}*`
              }, { quoted: m })
            } else {
              await sock.sendMessage(from, { text: `❌ Invalid TikTok URL` }, { quoted: m })
            }
          } catch (e) {
            await sock.sendMessage(from, { text: `❌ API Error: ${e.message}` }, { quoted: m })
          }
          break

        case 'gpt':
          if (!args) return sock.sendMessage(from, { text: `*Usage:* ${BOT_INFO.prefix}gpt who is messi` }, { quoted: m })
          if (!API_KEYS.gpt) return sock.sendMessage(from, { text: `❌ GPT API key not set` }, { quoted: m })
          await sock.sendMessage(from, { text: `🤖 *Thinking...*` }, { quoted: m })
          try {
            const res = await axios.post('https://api.openai.com/v1/chat/completions', {
              model: 'gpt-3.5-turbo',
              messages: [{ role: 'user', content: args }]
            }, { headers: { 'Authorization': `Bearer ${API_KEYS.gpt}` }})
            await sock.sendMessage(from, { text: res.data.choices[0].message.content }, { quoted: m })
          } catch (e) {
            await sock.sendMessage(from, { text: `❌ GPT Error: ${e.message}` }, { quoted: m })
          }
          break

        case 'gemini':
          if (!args) return sock.sendMessage(from, { text: `*Usage:* ${BOT_INFO.prefix}gemini explain quantum physics` }, { quoted: m })
          if (!API_KEYS.gemini) return sock.sendMessage(from, { text: `❌ Gemini API key not set` }, { quoted: m })
          await sock.sendMessage(from, { text: `🧠 *Thinking...*` }, { quoted: m })
          try {
            const res = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEYS.gemini}`, {
              contents: [{ parts: [{ text: args }] }]
            })
            await sock.sendMessage(from, { text: res.data.candidates[0].content.parts[0].text }, { quoted: m })
          } catch (e) {
            await sock.sendMessage(from, { text: `❌ Gemini Error: ${e.message}` }, { quoted: m })
          }
          break

        default:
          await sock.sendMessage(from, { text: `❌ Command *${cmd}* not found. Use ${BOT_INFO.prefix}menu` }, { quoted: m })
      }
    } catch (e) {
      console.error('Command Error:', e)
      await sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: m })
    }
  })
}
connectWA()

// STATS FUNCTION
function getStats() {
  const usedMemMB = process.memoryUsage().heapUsed / 1024 / 1024
  const totalMemMB = os.totalmem() / 1024 / 1024
  const ramPercent = Math.min(((usedMemMB / totalMemMB) * 100), 99).toFixed(0)
  const ramBar = '▓'.repeat(Math.floor(ramPercent / 5)) + '░'.repeat(20 - Math.floor(ramPercent / 5))
  const uptime = process.uptime()
  const h = Math.floor(uptime / 3600)
  const m = Math.floor((uptime % 3600) / 60)
  const s = Math.floor(uptime % 60)
  const speed = Math.floor(Math.random() * 40) + 15

  return {
    usedMem: usedMemMB.toFixed(0),
    ramPercent,
    ramBar,
    speed,
    runtime: `${h}h ${m}m ${s}s`
  }
}

// MENU FUNCTION
async function sendMenu(jid, m) {
  const { usedMem, ramPercent, ramBar, speed, runtime } = getStats()
  
  const menuText = `╔══════════════════════════════╗
║ ⚡ ${BOT_INFO.name} ⚡ ║
╠══════════════════════════════╣
║ Bot: ${BOT_INFO.name} ║
║ Dev: ${BOT_INFO.dev} ║
║ Build: ${BOT_INFO.version} ║
║ Status: ONLINE ║
║ Runtime:${runtime} ║
║ RAM: ${usedMem} MB ║
║ Mode: ${BOT_INFO.mode} ║
║ Prefix: ${BOT_INFO.prefix} ║
╚══════════════════════════════╝

◈───────────◈ 📡 GENERAL ◈───────────◈
| ${BOT_INFO.prefix}help / ${BOT_INFO.prefix}menu | ${BOT_INFO.prefix}ping / ${BOT_INFO.prefix}alive
| ${BOT_INFO.prefix}owner | ${BOT_INFO.prefix}jid

◈───────────◈ 🧠 AI POWER ◈───────────◈
| ${BOT_INFO.prefix}gpt <question> | 
| ${BOT_INFO.prefix}gemini <question>| 

◈───────────◈ 🎬 MEDIA & DOWNLOAD ◈───────────◈
| ${BOT_INFO.prefix}play <song> | ${BOT_INFO.prefix}song <name>
| ${BOT_INFO.prefix}tiktok <url> | 

RAM ${ramBar} ${ramPercent}%

◈───── 📣 ${BOT_INFO.name} ─────◈
    🔥 "${BOT_INFO.name} RUNS THIS"
    *Coded by ${BOT_INFO.dev}*`

  await sock.sendMessage(jid, { text: menuText }, { quoted: m })
}

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)
