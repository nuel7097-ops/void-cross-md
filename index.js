const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const express = require('express')
const os = require('os')
const axios = require('axios')
const fs = require('fs')
const { exec } = require('child_process')

let sock
let startTime = Date.now()

// BOT CONFIG - YOUR BRANDING
const BOT_INFO = {
  name: "༗༊𝐕𝐎𝐈𝐃-𝐂𝐑𝐎𝐒 𝐌𝐃彡★🦋❦",
  dev: "༄𝐌𝐑.𝐍𝐔𝐄𝐋♛",
  version: "v3.0.6 ULTRA",
  prefix: ".",
  mode: "public"
}

// API KEYS
const API_KEYS = {
  gpt: process.env.GPT_KEY || "",
  gemini: process.env.GEMINI_KEY || "",
  ytdl: "https://api.dreaded.site",
  removebg: process.env.REMOVEBG_KEY || ""
}

// EXPRESS
const app = express()
app.get('/', (req, res) => res.send(`${BOT_INFO.name} v3.0.6 ULTRA by ${BOT_INFO.dev} Online`))
app.listen(process.env.PORT || 3000, () => console.log(`[${BOT_INFO.name}] Server running`))

// AUTO GC
setInterval(() => { if (global.gc) global.gc() }, 30000)

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
    
    const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''
    if (!body.startsWith(BOT_INFO.prefix)) return
    
    const cmd = body.slice(1).split(' ')[0].toLowerCase()
    const args = body.slice(BOT_INFO.prefix.length + cmd.length).trim()
    const from = m.key.remoteJid
    const sender = m.key.participant || from
    const isGroup = from.endsWith('@g.us')
    const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid || []

    try {
      switch(cmd) {
        // 📡 GENERAL
        case 'menu': case 'help':
          await sendMenu(from, m)
          break
        
        case 'ping': case 'alive':
          const { speed } = getStats()
          await sock.sendMessage(from, { text: `*Pong!* 🏓\nSpeed: ${speed}ms\nStatus: ONLINE\n*Bot: ${BOT_INFO.name}*\n*Dev: ${BOT_INFO.dev}*` }, { quoted: m })
          break

        case 'owner':
          await sock.sendMessage(from, { text: `*Owner:* ${BOT_INFO.dev}\n*Bot:* ${BOT_INFO.name}\n*Version:* ${BOT_INFO.version}` }, { quoted: m })
          break

        case 'jid': case 'url':
          await sock.sendMessage(from, { text: `*Chat JID:* ${from}\n*User JID:* ${sender}` }, { quoted: m })
          break

        case 'joke':
          const jokes = ["Why don't scientists trust atoms? Because they make up everything!", "I told my wife she was drawing her eyebrows too high. She looked surprised."]
          await sock.sendMessage(from, { text: jokes[Math.floor(Math.random()*jokes.length)] }, { quoted: m })
          break

        case 'quote':
          const quotes = ["The only way to do great work is to love what you do. - Steve Jobs", "Code is like humor. When you have to explain it, it's bad."]
          await sock.sendMessage(from, { text: quotes[Math.floor(Math.random()*quotes.length)] }, { quoted: m })
          break

        case 'fact':
          await sock.sendMessage(from, { text: `*Fact:* Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that's still edible.` }, { quoted: m })
          break

        case '8ball':
          if (!args) return sock.sendMessage(from, { text: `*Usage:* ${BOT_INFO.prefix}8ball will I be rich` }, { quoted: m })
          const responses = ["Yes", "No", "Maybe", "Definitely", "Ask again later", "Without a doubt"]
          await sock.sendMessage(from, { text: `🎱 *Question:* ${args}\n*Answer:* ${responses[Math.floor(Math.random()*responses.length)]}` }, { quoted: m })
          break

        case 'weather':
          if (!args) return sock.sendMessage(from, { text: `*Usage:* ${BOT_INFO.prefix}weather Lagos` }, { quoted: m })
          try {
            const res = await axios.get(`https://wttr.in/${args}?format=3`)
            await sock.sendMessage(from, { text: `*Weather:* ${res.data}` }, { quoted: m })
          } catch { await sock.sendMessage(from, { text: `❌ City not found` }, { quoted: m }) }
          break

        case 'groupinfo':
          if (!isGroup) return sock.sendMessage(from, { text: `❌ Group only` }, { quoted: m })
          const metadata = await sock.groupMetadata(from)
          await sock.sendMessage(from, { text: `*Group:* ${metadata.subject}\n*Members:* ${metadata.participants.length}\n*ID:* ${from}` }, { quoted: m })
          break

        // 🧠 AI POWER
        case 'gpt':
          if (!args) return sock.sendMessage(from, { text: `*Usage:* ${BOT_INFO.prefix}gpt who is messi` }, { quoted: m })
          if (!API_KEYS.gpt) return sock.sendMessage(from, { text: `❌ GPT API key not set` }, { quoted: m })
          await sock.sendMessage(from, { text: `🤖 *Thinking...*` }, { quoted: m })
          try {
            const res = await axios.post('https://api.openai.com/v1/chat/completions', {
              model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: args }]
            }, { headers: { 'Authorization': `Bearer ${API_KEYS.gpt}` }})
            await sock.sendMessage(from, { text: res.data.choices[0].message.content }, { quoted: m })
          } catch (e) { await sock.sendMessage(from, { text: `❌ GPT Error: ${e.message}` }, { quoted: m }) }
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
          } catch (e) { await sock.sendMessage(from, { text: `❌ Gemini Error: ${e.message}` }, { quoted: m }) }
          break

        // 🎬 MEDIA & DOWNLOAD
        case 'play': case 'song':
          if (!args) return sock.sendMessage(from, { text: `*Usage:* ${BOT_INFO.prefix}play faded` }, { quoted: m })
          await sock.sendMessage(from, { text: `🔍 *Searching:* ${args}...` }, { quoted: m })
          try {
            const res = await axios.get(`${API_KEYS.ytdl}/api/ytdl/audio?query=${encodeURIComponent(args)}`)
            if (res.data.status && res.data.result.download_url) {
              await sock.sendMessage(from, { audio: { url: res.data.result.download_url }, mimetype: 'audio/mpeg', fileName: `${res.data.result.title}.mp3` }, { quoted: m })
            } else { await sock.sendMessage(from, { text: `❌ Song not found` }, { quoted: m }) }
          } catch (e) { await sock.sendMessage(from, { text: `❌ API Error: ${e.message}` }, { quoted: m }) }
          break

        case 'video':
          if (!args) return sock.sendMessage(from, { text: `*Usage:* ${BOT_INFO.prefix}video faded` }, { quoted: m })
          await sock.sendMessage(from, { text: `🔍 *Searching:* ${args}...` }, { quoted: m })
          try {
            const res = await axios.get(`${API_KEYS.ytdl}/api/ytdl/video?query=${encodeURIComponent(args)}`)
            if (res.data.status && res.data.result.download_url) {
              await sock.sendMessage(from, { video: { url: res.data.result.download_url }, caption: `*${res.data.result.title}*\n*By ${BOT_INFO.name}*` }, { quoted: m })
            } else { await sock.sendMessage(from, { text: `❌ Video not found` }, { quoted: m }) }
          } catch (e) { await sock.sendMessage(from, { text: `❌ API Error: ${e.message}` }, { quoted: m }) }
          break

        case 'tiktok': case 'tt':
          if (!args) return sock.sendMessage(from, { text: `*Usage:* ${BOT_INFO.prefix}tiktok <url>` }, { quoted: m })
          await sock.sendMessage(from, { text: `⏳ *Downloading...*` }, { quoted: m })
          try {
            const res = await axios.get(`${API_KEYS.ytdl}/api/tiktok?url=${args}`)
            if (res.data.status && res.data.result.video) {
              await sock.sendMessage(from, { video: { url: res.data.result.video }, caption: `*By ${BOT_INFO.name}*` }, { quoted: m })
            } else { await sock.sendMessage(from, { text: `❌ Invalid TikTok URL` }, { quoted: m }) }
          } catch (e) { await sock.sendMessage(from, { text: `❌ API Error: ${e.message}` }, { quoted: m }) }
          break

        case 'instagram': case 'ig':
          if (!args) return sock.sendMessage(from, { text: `*Usage:* ${BOT_INFO.prefix}instagram <url>` }, { quoted: m })
          await sock.sendMessage(from, { text: `⏳ *Downloading...*` }, { quoted: m })
          try {
            const res = await axios.get(`${API_KEYS.ytdl}/api/instagram?url=${args}`)
            if (res.data.status && res.data.result.video) {
              await sock.sendMessage(from, { video: { url: res.data.result.video }, caption: `*By ${BOT_INFO.name}*` }, { quoted: m })
            } else { await sock.sendMessage(from, { text: `❌ Invalid Instagram URL` }, { quoted: m }) }
          } catch (e) { await sock.sendMessage(from, { text: `❌ API Error: ${e.message}` }, { quoted: m }) }
          break

        // 🛡️ ADMIN PANEL
        case 'tagall':
          if (!isGroup) return sock.sendMessage(from, { text: `❌ Group only` }, { quoted: m })
          const groupMeta = await sock.groupMetadata(from)
          const members = groupMeta.participants.map(u => u.id)
          await sock.sendMessage(from, { text: args || `Tagged by ${BOT_INFO.name}`, mentions: members }, { quoted: m })
          break

        case 'hidetag':
          if (!isGroup) return sock.sendMessage(from, { text: `❌ Group only` }, { quoted: m })
          const gMeta = await sock.groupMetadata(from)
          const mems = gMeta.participants.map(u => u.id)
          await sock.sendMessage(from, { text: args || '.', mentions: mems }, { quoted: m })
          break

        case 'kick': case 'ban':
          if (!isGroup) return sock.sendMessage(from, { text: `❌ Group only` }, { quoted: m })
          if (!mentioned[0]) return sock.sendMessage(from, { text: `*Usage:* ${BOT_INFO.prefix}kick @user` }, { quoted: m })
          try {
            await sock.groupParticipantsUpdate(from, [mentioned[0]], 'remove')
            await sock.sendMessage(from, { text: `✅ Kicked @${mentioned[0].split('@')[0]}`, mentions: [mentioned[0]] }, { quoted: m })
          } catch { await sock.sendMessage(from, { text: `❌ Failed. Bot needs admin` }, { quoted: m }) }
          break

        case 'promote':
          if (!isGroup) return sock.sendMessage(from, { text: `❌ Group only` }, { quoted: m })
          if (!mentioned[0]) return sock.sendMessage(from, { text: `*Usage
