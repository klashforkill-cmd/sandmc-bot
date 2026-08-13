import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  AttachmentBuilder,
} from 'discord.js';
import { status } from 'minecraft-server-util';
import { Rcon } from 'rcon-client';
import OpenAI from 'openai';
import { renderLatencyImage } from './chart.js';

// ====== أنظمة البوت ======
import { cmdBalance, cmdDaily, cmdPay, cmdLeaderboard, cmdAddMoney } from './systems/economy.js';
import { cmdKick, cmdBan, cmdUnban, cmdMute, cmdUnmute, cmdWarn, cmdWarns, cmdClear } from './systems/moderation.js';
import { cmdPoll, cmdGiveaway, cmdAnnounce } from './systems/fun.js';
import { resolveAlias, cmdAliasAdd, cmdAliasRemove, cmdAliasList } from './systems/aliases.js';
import { cmdShop, cmdBuy, cmdDeliver, cmdOrders, SHOP_ITEMS } from './systems/shop.js';

// ====== الإعدادات ======
const CONFIG = {
  token: process.env.DISCORD_TOKEN || '',
  channelId: process.env.STATUS_CHANNEL_ID || '1515135241159835650',
  consoleChannelId: '1523068320293720194',
  host: process.env.MC_HOST || 'Sandmc.laxel.host',
  port: Number(process.env.MC_PORT || 19146),
  rconPort: 19146,
  rconPassword: 'sandmcontopbs',
  updateIntervalMs: 5000,
  historySize: 60,
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// ====== Groq (OpenAI-compatible) ======
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

const conversationHistory = new Map();
let latencyHistory = [];
let lastStatus = null;
let lastError = null;
let faviconAttachment = null;

// ====== قراءة حالة السيرفر ======
async function fetchServerStatus() {
  const res = await status(CONFIG.host, CONFIG.port, { timeout: 6000 });
  return {
    online: true,
    version: res.version?.name || 'غير معروف',
    playersOnline: res.players?.online ?? 0,
    playersMax: res.players?.max ?? 0,
    motd: res.motd?.clean || res.motd?.html || '',
    latency: Math.round(res.roundTripLatency ?? 0),
    favicon: res.favicon || null,
    sample: res.players?.sample || [],
  };
}

// ====== بناء الـ Embed ======
function buildEmbed(state) {
  const online = state.online;
  const latency = state.latency;
  const latencyLabel = latency <= 80 ? 'ممتاز ⚡' : latency <= 180 ? 'جيد ✓' : 'ضعيف ⚠️';

  const embed = new EmbedBuilder()
    .setTitle('🟢 بوت مراقبة سيرفر SandMC')
    .setColor(online ? (latency <= 80 ? 0x22c55e : latency <= 180 ? 0xeab308 : 0xef4444) : 0xef4444)
    .setThumbnail(online && faviconAttachment ? 'attachment://favicon.png' : null)
    .addFields(
      { name: 'IP', value: `\`${CONFIG.host}\``, inline: true },
      { name: 'Port', value: `\`${CONFIG.port}\``, inline: true },
      { name: 'Ping', value: `\`${latency} ms\` — ${latencyLabel}`, inline: true },
      { name: 'Players', value: online ? `**${state.playersOnline}** / ${state.playersMax}` : 'N/A', inline: true },
      { name: 'Status', value: online ? '🟢 **Online**' : '🔴 **Offline / Unreachable**', inline: true }
    )
    .setFooter({ text: `آخر تحديث: ${new Date().toLocaleTimeString('ar-SA')} | SandMC` })
    .setTimestamp();

  if (state.motd) embed.setDescription(`> ${state.motd}`);
  return embed;
}

// ====== بناء رسالة الحالة ======
async function buildStatusMessage() {
  try {
    const s = await fetchServerStatus();
    lastStatus = s;
    lastError = null;
    latencyHistory.push(s.latency);
    if (latencyHistory.length > CONFIG.historySize) latencyHistory.shift();
    if (s.favicon && s.favicon.startsWith('data:image')) {
      const buf = Buffer.from(s.favicon.split(',')[1], 'base64');
      faviconAttachment = new AttachmentBuilder(buf, { name: 'favicon.png' });
    } else {
      faviconAttachment = null;
    }
  } catch (e) {
    lastError = e.message;
    latencyHistory.push(lastStatus ? lastStatus.latency : 1000);
    if (latencyHistory.length > CONFIG.historySize) latencyHistory.shift();
  }

  const state = lastStatus || { online: false, version: 'غير معروف', playersOnline: 0, playersMax: 0, latency: 0, motd: '', favicon: null };
  const embed = buildEmbed(state);
  const imgBuf = renderLatencyImage(latencyHistory, lastStatus ? lastStatus.latency : 0, state.motd);
  const attachment = new AttachmentBuilder(imgBuf, { name: 'latency.png' });
  const files = [attachment];
  if (faviconAttachment) files.push(faviconAttachment);
  return { embeds: [embed], files };
}

// ====== التحديث الدوري ======
let statusMessage = null;

async function sendPeriodicUpdate() {
  const channel = client.channels.cache.get(CONFIG.channelId);
  if (!channel) return;
  const payload = await buildStatusMessage();
  try {
    if (statusMessage && statusMessage.editable) {
      await statusMessage.edit(payload);
      console.log(`[update] تم تحديث الرسالة (${new Date().toLocaleTimeString()})`);
    } else {
      statusMessage = await channel.send(payload);
      console.log(`[update] تم إرسال رسالة جديدة في الروم ${channel.id}`);
    }
  } catch (e) {
    try { statusMessage = await channel.send(payload); } catch (_) {}
  }
}

// ====== الذكاء الاصطناعي ======
async function askAI(userId, username, userMessage) {
  if (!conversationHistory.has(userId)) conversationHistory.set(userId, []);
  const history = conversationHistory.get(userId);
  history.push({ role: 'user', content: userMessage });
  if (history.length > 10) history.splice(0, history.length - 10);

  const response = await openai.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `أنت مساعد ذكي اسمك SandBot لسيرفر Minecraft اسمه SandMC.
معلومات السيرفر: IP: Sandmc.laxel.host | Port: 19146 | الإصدار: Paper 1.21.4

قواعد مهمة جداً:
- تحدث دائماً بالعربي بأسلوب ودي وعامي وقصير.
- جاوب على أي سؤال مهما كان حتى لو خارج موضوع Minecraft.
- لا تقول أبداً "لا أستطيع" أو "لا أعرف" أو "هذا خارج اختصاصي".
- إذا ما عندك معلومة دقيقة، اجتهد وأعطِ أفضل إجابة ممكنة.
- كن مرح وخفيف الدم مع اللاعبين.`,
      },
      ...history,
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  const reply = response.choices[0]?.message?.content || 'عذراً، لم أفهم سؤالك.';
  history.push({ role: 'assistant', content: reply });
  return reply;
}

// ====== RCON ======
async function sendRconCommand(command) {
  const rcon = new Rcon({ host: CONFIG.host, port: CONFIG.rconPort, password: CONFIG.rconPassword, timeout: 8000 });
  try {
    await rcon.connect();
    const response = await rcon.send(command);
    await rcon.end();
    return response || '✅ تم تنفيذ الأمر';
  } catch (e) {
    try { await rcon.end(); } catch (_) {}
    throw e;
  }
}

// ====== معالجة الأوامر ======
async function handleCommand(message) {
  const knownCmds = ['balance','bal','daily','pay','leaderboard','lb','top','addmoney',
    'kick','ban','unban','mute','unmute','warn','warns','clear','poll','giveaway','announce',
    'alias','keyall','help','shop','buy','deliver','orders'];

  // normalize — أضف / إذا الأمر معروف لكن بدون /
  const raw = message.content.trim();
  const rawFirst = raw.split(' ')[0].toLowerCase();
  const content = (!raw.startsWith('/') && knownCmds.includes(rawFirst)) ? '/' + raw : raw;
  const lower = content.toLowerCase();

  // ── حالة السيرفر
  if (lower === 'mc' || lower === 'ip') {
    const payload = await buildStatusMessage();
    await message.reply(payload);
    return true;
  }

  // ── keyall
  if (lower.startsWith('/keyall')) {
    const args = content.trim().split(/\s+/);
    const players = args[1] || '?';
    const time = args[2] || '?';
    const keyEmbed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle('🔑 | Key All')
      .addFields(
        { name: '🌐 IP', value: `\`${CONFIG.host}\``, inline: true },
        { name: '🔌 Port', value: `\`${CONFIG.port}\``, inline: true },
        { name: '🟢 Players', value: `\`${players}\``, inline: true },
        { name: '⏰ Time', value: `\`${time}\``, inline: true }
      )
      .setFooter({ text: 'SandMC | Key All' })
      .setTimestamp();
    try { await message.delete(); } catch (_) {}
    const keyChannel = client.channels.cache.get('1523068320293720194');
    const target = keyChannel || message.channel;
    await target.send({ content: '||@here @everyone||', embeds: [keyEmbed] });
    return true;
  }

  // ── /help
  if (lower === '/help') {
    const embed = new EmbedBuilder()
      .setColor(0x6366f1)
      .setTitle('📖 قائمة الأوامر — SandBot')
      .addFields(
        { name: '⚙️ عام', value: '`mc` `ip` — حالة السيرفر\n`/keyall [players] [time]` — كي أول\n`/help` — هذه القائمة', inline: false },
        { name: '💰 Sand Money', value: '`/balance [@شخص]` — الرصيد\n`/daily` — مكافأة يومية 500 💰\n`/pay @شخص المبلغ` — تحويل\n`/leaderboard` — أغنى اللاعبين\n`/addmoney @شخص المبلغ` — [أدمن]', inline: false },
        { name: '🛡️ مودريشن', value: '`/kick @شخص [سبب]`\n`/ban @شخص [سبب]`\n`/unban ID`\n`/mute @شخص [دقائق] [سبب]`\n`/unmute @شخص`\n`/warn @شخص [سبب]`\n`/warns [@شخص]`\n`/clear [عدد]`', inline: false },
        { name: '🎉 ترفيه', value: '`/poll السؤال | خيار1 | خيار2`\n`/giveaway الدقائق الفائزين الجائزة`\n`/announce النص`', inline: false },
        { name: '⚡ الاختصارات', value: '`/alias add الاختصار الأمر`\n`/alias remove الاختصار`\n`/alias list`', inline: false },
      )
      .setFooter({ text: 'SandMC Bot' })
      .setTimestamp();
    await message.reply({ embeds: [embed] });
    return true;
  }

  // ── الاقتصاد
  if (lower.startsWith('/balance') || lower === '/bal') {
    await cmdBalance(message, lower.split(/\s+/));
    return true;
  }
  if (lower === '/daily') {
    await cmdDaily(message);
    return true;
  }
  if (lower.startsWith('/pay')) {
    await cmdPay(message, content.split(/\s+/));
    return true;
  }
  if (lower === '/leaderboard' || lower === '/lb' || lower === '/top') {
    await cmdLeaderboard(message);
    return true;
  }
  if (lower.startsWith('/addmoney')) {
    await cmdAddMoney(message, content.split(/\s+/));
    return true;
  }

  // ── مودريشن
  if (lower.startsWith('/kick')) { await cmdKick(message, content.split(/\s+/)); return true; }
  if (lower.startsWith('/ban')) { await cmdBan(message, content.split(/\s+/)); return true; }
  if (lower.startsWith('/unban')) { await cmdUnban(message, content.split(/\s+/)); return true; }
  if (lower.startsWith('/mute')) { await cmdMute(message, content.split(/\s+/)); return true; }
  if (lower.startsWith('/unmute')) { await cmdUnmute(message, content.split(/\s+/)); return true; }
  if (lower.startsWith('/warn ')) { await cmdWarn(message, content.split(/\s+/)); return true; }
  if (lower.startsWith('/warns')) { await cmdWarns(message, content.split(/\s+/)); return true; }
  if (lower.startsWith('/clear')) { await cmdClear(message, content.split(/\s+/)); return true; }

  // ── ترفيه
  if (lower.startsWith('/poll')) { await cmdPoll(message, ['poll', content.slice(6)]); return true; }
  if (lower.startsWith('/giveaway')) { await cmdGiveaway(message, content.split(/\s+/)); return true; }
  if (lower.startsWith('/announce')) { await cmdAnnounce(message, content.split(/\s+/)); return true; }

  // ── الاختصارات
  if (lower.startsWith('/alias add')) { await cmdAliasAdd(message, content.split(/\s+/)); return true; }
  if (lower.startsWith('/alias remove')) { await cmdAliasRemove(message, content.split(/\s+/)); return true; }
  if (lower === '/alias list') { await cmdAliasList(message); return true; }

  // ── المتجر
  if (lower === '/shop') { await cmdShop(message); return true; }
  if (lower.startsWith('/buy')) { await cmdBuy(message, content.split(/\s+/)); return true; }
  if (lower.startsWith('/deliver')) { await cmdDeliver(message, content.split(/\s+/)); return true; }
  if (lower === '/orders') { await cmdOrders(message); return true; }

  return false;
}

// ====== معالجة الرسائل ======
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // روم الكونسل — RCON
  if (message.channel.id === CONFIG.consoleChannelId) {
    const cmd = message.content.trim();
    if (!cmd) return;
    message.channel.sendTyping().catch(() => {});
    sendRconCommand(cmd)
      .then(async (response) => {
        const embed = new EmbedBuilder()
          .setColor(0x22c55e)
          .setTitle('✅ Console')
          .addFields(
            { name: '📥 Command', value: `\`${cmd}\``, inline: false },
            { name: '📤 Response', value: `\`\`\`${response.slice(0, 1000) || 'No output'}\`\`\``, inline: false }
          )
          .setTimestamp();
        await message.reply({ embeds: [embed] });
      })
      .catch(async (e) => {
        const embed = new EmbedBuilder()
          .setColor(0xef4444)
          .setTitle('❌ Console Error')
          .addFields(
            { name: '📥 Command', value: `\`${cmd}\``, inline: false },
            { name: '⚠️ Error', value: `\`\`\`${e.message}\`\`\``, inline: false }
          )
          .setTimestamp();
        await message.reply({ embeds: [embed] });
      });
    return;
  }

  const content = message.content.trim();
  const lower = content.toLowerCase();

  // تحقق من الاختصارات أولاً
  if (message.guild) {
    const resolved = resolveAlias(message.guild.id, content);
    if (resolved) {
      console.log(`[alias] "${content}" → "${resolved}"`);
      // أنشئ نسخة من الرسالة بمحتوى الأمر الحقيقي
      const aliasMsg = new Proxy(message, {
        get(target, prop) {
          if (prop === 'content') return resolved;
          return target[prop];
        }
      });
      const aliasHandled = await handleCommand(aliasMsg).catch(e => {
        console.error('[alias-error]', e.message);
        return false;
      });
      if (!aliasHandled) {
        await message.reply(`⚠️ الاختصار \`${content.split(' ')[0]}\` يشير لأمر غير صالح: \`${resolved}\``);
      }
      return;
    }
  }

  // الأوامر العادية
  const handled = await handleCommand(message).catch((e) => {
    console.error('[cmd-error]', e.message);
    return false;
  });

  if (handled) return;

  // الذكاء الاصطناعي — فقط في روم الـ AI المخصص
  const AI_CHANNEL_ID = '1537237893813370989';
  if (message.channel.id !== AI_CHANNEL_ID) return;

  // تجاهل الأوامر
  if (lower === 'mc' || lower === 'ip' || lower.startsWith('/')) return;

  const cleanText = content.replace(/<@!?\d+>/g, '').trim();
  if (cleanText.length < 1) return;

  message.channel.sendTyping().catch(() => {});
  askAI(message.author.id, message.author.username, cleanText)
    .then(async (reply) => {
      const chunks = reply.match(/[\s\S]{1,1900}/g) || [reply];
      for (const chunk of chunks) await message.reply(chunk);
    })
    .catch(async (e) => {
      console.error('[ai-error]', e.message);
      await message.reply('❌ حدث خطأ في الذكاء الاصطناعي، حاول مرة ثانية.').catch(() => {});
    });
});

// ====== Slash Commands Handler ======
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options } = interaction;

  // دالة مساعدة: تحويل interaction لـ message-like object
  const fakeMsg = {
    author: interaction.user,
    member: interaction.member,
    guild: interaction.guild,
    channel: interaction.channel,
    client: client,
    mentions: {
      users: { first: () => options.getUser?.('user') || null },
      members: { first: () => options.getMember?.('user') || null },
      has: () => false,
    },
    reply: async (payload) => {
      if (interaction.replied || interaction.deferred) {
        return interaction.followUp(typeof payload === 'string' ? { content: payload } : payload);
      }
      return interaction.reply(typeof payload === 'string' ? { content: payload } : payload);
    },
    channel: {
      ...interaction.channel,
      send: async (payload) => interaction.channel.send(payload),
      sendTyping: async () => {},
      bulkDelete: async (n, f) => interaction.channel.bulkDelete(n, f),
    },
    delete: async () => {},
    content: '',
    id: interaction.id,
  };

  // defer للاستجابات التي تأخذ وقتاً
  try { await interaction.deferReply(); } catch {}

  try {
    switch (commandName) {
      case 'help': {
        const embed = new EmbedBuilder()
          .setColor(0x6366f1)
          .setTitle('📖 قائمة الأوامر — SandBot')
          .addFields(
            { name: '⚙️ عام', value: '`/keyall` — كي أول\n`mc` `ip` — حالة السيرفر', inline: false },
            { name: '💰 Sand Money', value: '`/balance` `/daily` `/pay` `/leaderboard` `/addmoney`', inline: false },
            { name: '🛡️ مودريشن', value: '`/kick` `/ban` `/unban` `/mute` `/unmute` `/warn` `/warns` `/clear`', inline: false },
            { name: '🎉 ترفيه', value: '`/poll` `/giveaway` `/announce`', inline: false },
            { name: '🛒 المتجر', value: '`/shop` — عرض المنتجات\n`/buy [رقم] [اسم MC]` — شراء\n`/orders` `/deliver [رقم]` — [أدمن]', inline: false },
            { name: '⚡ اختصارات', value: '`/alias add` `/alias remove` `/alias list`', inline: false },
          )
          .setFooter({ text: 'SandMC Bot' }).setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'balance':
        await cmdBalance(fakeMsg, ['balance']);
        break;

      case 'daily':
        await cmdDaily(fakeMsg);
        break;

      case 'pay': {
        const target = options.getUser('user');
        const amount = options.getInteger('amount');
        fakeMsg.mentions.users.first = () => target;
        fakeMsg.content = `/pay <@${target?.id}> ${amount}`;
        await cmdPay(fakeMsg, ['/pay', `<@${target?.id}>`, String(amount)]);
        break;
      }

      case 'leaderboard':
        await cmdLeaderboard(fakeMsg);
        break;

      case 'addmoney': {
        const target = options.getUser('user');
        const amount = options.getInteger('amount');
        fakeMsg.mentions.users.first = () => target;
        await cmdAddMoney(fakeMsg, ['/addmoney', `<@${target?.id}>`, String(amount)]);
        break;
      }

      case 'kick': {
        const target = options.getMember('user');
        const reason = options.getString('reason') || 'بدون سبب';
        fakeMsg.mentions.members.first = () => target;
        await cmdKick(fakeMsg, ['/kick', `<@${target?.id}>`, reason]);
        break;
      }

      case 'ban': {
        const target = options.getMember('user');
        const reason = options.getString('reason') || 'بدون سبب';
        fakeMsg.mentions.members.first = () => target;
        await cmdBan(fakeMsg, ['/ban', `<@${target?.id}>`, reason]);
        break;
      }

      case 'unban': {
        const userId = options.getString('userid');
        await cmdUnban(fakeMsg, ['/unban', userId]);
        break;
      }

      case 'mute': {
        const target = options.getMember('user');
        const minutes = options.getInteger('minutes') || 10;
        const reason = options.getString('reason') || 'بدون سبب';
        fakeMsg.mentions.members.first = () => target;
        await cmdMute(fakeMsg, ['/mute', `<@${target?.id}>`, String(minutes), reason]);
        break;
      }

      case 'unmute': {
        const target = options.getMember('user');
        fakeMsg.mentions.members.first = () => target;
        await cmdUnmute(fakeMsg, ['/unmute', `<@${target?.id}>`]);
        break;
      }

      case 'warn': {
        const target = options.getUser('user');
        const reason = options.getString('reason') || 'بدون سبب';
        fakeMsg.mentions.users.first = () => target;
        await cmdWarn(fakeMsg, ['/warn', `<@${target?.id}>`, reason]);
        break;
      }

      case 'warns': {
        const target = options.getUser('user');
        fakeMsg.mentions.users.first = () => target || null;
        await cmdWarns(fakeMsg, ['/warns']);
        break;
      }

      case 'clear': {
        const amount = options.getInteger('amount') || 10;
        // bulkDelete مباشرة
        try {
          const deleted = await interaction.channel.bulkDelete(amount, true);
          await interaction.editReply(`✅ تم حذف **${deleted.size}** رسالة.`);
        } catch (e) {
          await interaction.editReply(`❌ فشل: ${e.message}`);
        }
        break;
      }

      case 'poll': {
        const question = options.getString('question');
        const opts = [
          options.getString('option1'),
          options.getString('option2'),
          options.getString('option3'),
          options.getString('option4'),
        ].filter(Boolean);
        const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣'];
        const lines = opts.map((o, i) => `${emojis[i]} ${o}`).join('\n');
        const embed = new EmbedBuilder()
          .setColor(0x6366f1)
          .setTitle(`📊 ${question}`)
          .setDescription(lines)
          .setFooter({ text: `بواسطة ${interaction.user.username}` })
          .setTimestamp();
        const pollMsg = await interaction.editReply({ embeds: [embed], fetchReply: true });
        for (let i = 0; i < opts.length; i++) await pollMsg.react(emojis[i]).catch(()=>{});
        break;
      }

      case 'giveaway': {
        const minutes = options.getInteger('minutes');
        const winners = options.getInteger('winners');
        const prize = options.getString('prize');
        const endsAt = Date.now() + minutes * 60_000;
        const embed = new EmbedBuilder()
          .setColor(0xa855f7).setTitle('🎉 GIVEAWAY!')
          .setDescription(`**${prize}**\n\nاضغط 🎉 للمشاركة!`)
          .addFields(
            { name: '⏳ ينتهي بعد', value: `${minutes} دقيقة`, inline: true },
            { name: '🏆 عدد الفائزين', value: `${winners}`, inline: true },
            { name: '👤 بواسطة', value: interaction.user.username, inline: true },
          )
          .setFooter({ text: 'ينتهي' }).setTimestamp(endsAt);
        const gwMsg = await interaction.editReply({ embeds: [embed], fetchReply: true });
        await gwMsg.react('🎉');
        setTimeout(async () => {
          try {
            // جيب الرسالة من Discord مباشرة
            const msg = await interaction.channel.messages.fetch(gwMsg.id, { force: true });
            const reaction = msg.reactions.cache.get('🎉') ?? msg.reactions.resolve('🎉');
            let entries = [];
            if (reaction) {
              await reaction.fetch();
              const users = await reaction.users.fetch({ limit: 100 });
              entries = [...users.values()].filter(u => !u.bot);
            }
            if (!entries.length) {
              return interaction.channel.send({ embeds: [new EmbedBuilder()
                .setColor(0xef4444)
                .setTitle('😢 انتهى الـ Giveaway بدون فائز!')
                .setDescription(`**${prize}**\n\nما حد شارك في الـ Giveaway`)
                .setTimestamp()] });
            }
            const selected = [];
            const pool = [...entries];
            for (let i = 0; i < Math.min(winners, pool.length); i++) {
              selected.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
            }
            const mentions = selected.map(u => `<@${u.id}>`).join(', ');
            await msg.edit({ embeds: [new EmbedBuilder()
              .setColor(0x22c55e).setTitle('🏆 انتهى الـ Giveaway!')
              .setDescription(`**${prize}**\n\n🎉 الفائز: ${mentions}`)
              .setFooter({ text: 'انتهى' }).setTimestamp()] }).catch(() => {});
            await interaction.channel.send({
              content: `🎉 مبروك ${mentions}! فزت بـ **${prize}**`,
              embeds: [new EmbedBuilder().setColor(0xa855f7).setTitle('🏆 الفائزون!').setDescription(`**${prize}**\n${mentions}`).setTimestamp()]
            });
          } catch (e) { console.error('[giveaway-error]', e.message); }
        }, minutes * 60_000);
        break;
      }

      case 'announce': {
        const text = options.getString('text');
        if (!interaction.member?.permissions.has('ManageGuild')) {
          await interaction.editReply('❌ هذا الأمر للمشرفين فقط.');
          break;
        }
        const embed = new EmbedBuilder()
          .setColor(0x22c55e).setTitle('📢 إعلان')
          .setDescription(text)
          .setFooter({ text: `بواسطة ${interaction.user.username}` }).setTimestamp();
        await interaction.channel.send({ content: '@everyone', embeds: [embed] });
        await interaction.editReply('✅ تم الإرسال.');
        break;
      }

      case 'alias': {
        const action = options.getString('action');
        const aliasName = options.getString('alias');
        const command = options.getString('command');
        if (action === 'list') {
          await cmdAliasList(fakeMsg);
        } else if (action === 'add') {
          fakeMsg.content = `/alias add ${aliasName} ${command}`;
          await cmdAliasAdd(fakeMsg, ['/alias', 'add', aliasName, command]);
        } else if (action === 'remove') {
          await cmdAliasRemove(fakeMsg, ['/alias', 'remove', aliasName]);
        }
        break;
      }

      case 'shop':
        await cmdShop(fakeMsg);
        break;

      case 'buy': {
        const itemNum = options.getInteger('item');
        const mcName = options.getString('mc_name') || null;
        await cmdBuy(fakeMsg, ['/buy', String(itemNum), ...(mcName ? mcName.split(' ') : [])]);
        break;
      }

      case 'orders':
        await cmdOrders(fakeMsg);
        break;

      case 'deliver': {
        const oid = options.getInteger('order_id');
        await cmdDeliver(fakeMsg, ['/deliver', String(oid)]);
        break;
      }

      case 'keyall': {
        const players = options.getString('players') || '?';
        const time = options.getString('time') || '?';
        const keyEmbed = new EmbedBuilder()
          .setColor(0xf59e0b).setTitle('🔑 | Key All')
          .addFields(
            { name: '🌐 IP', value: `\`${CONFIG.host}\``, inline: true },
            { name: '🔌 Port', value: `\`${CONFIG.port}\``, inline: true },
            { name: '🟢 Players', value: `\`${players}\``, inline: true },
            { name: '⏰ Time', value: `\`${time}\``, inline: true }
          )
          .setFooter({ text: 'SandMC | Key All' }).setTimestamp();
        const keyChannel = client.channels.cache.get('1523068320293720194');
        const target = keyChannel || interaction.channel;
        await target.send({ content: '||@here @everyone||', embeds: [keyEmbed] });
        await interaction.editReply('✅ تم الإرسال.');
        break;
      }

      default:
        await interaction.editReply('❌ أمر غير معروف.');
    }
  } catch (e) {
    console.error('[slash-error]', e.message);
    try {
      if (interaction.deferred) await interaction.editReply(`❌ حدث خطأ: ${e.message}`);
    } catch {}
  }
});

// ====== الإقلاع ======
client.once('ready', async () => {
  console.log('✅ البوت متصل:', client.user.tag);
  client.user.setActivity('مراقبة SandMC | /help', { type: 3 });
  await sendPeriodicUpdate();
  setInterval(() => sendPeriodicUpdate().catch(e => console.error('[periodic-error]', e.message)), CONFIG.updateIntervalMs);
});

client.on('error', (e) => console.error('[discord-error]', e.message));
client.on('shardDisconnect', (_, id) => console.warn(`[shard-disconnect] shard ${id}`));
client.on('shardReconnecting', (id) => console.log(`[shard-reconnect] shard ${id} reconnecting...`));

process.on('uncaughtException', (err) => console.error('[uncaughtException]', err.message));
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));

if (!CONFIG.token) { console.error('❌ لم يتم تحديد DISCORD_TOKEN'); process.exit(1); }

async function loginWithRetry() {
  while (true) {
    try { await client.login(CONFIG.token); break; }
    catch (e) {
      console.error('[login-error]', e.message, '— إعادة المحاولة خلال 10 ثوانٍ...');
      await new Promise(r => setTimeout(r, 10_000));
    }
  }
}

loginWithRetry();
