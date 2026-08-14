import 'dotenv/config';
import {
  Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder,
  REST, Routes, SlashCommandBuilder, PermissionFlagsBits,
} from 'discord.js';
import { status } from 'minecraft-server-util';
import { Rcon } from 'rcon-client';
import OpenAI from 'openai';
import { renderLatencyImage } from './chart.js';

// ====== أنظمة البوت ======
import { cmdBalance, cmdDaily, cmdPay, cmdLeaderboard, cmdAddMoney, cmdRemoveMoney, cmdRob, cmdGamble, cmdDeposit, cmdWithdraw } from './systems/economy.js';
import { cmdKick, cmdBan, cmdUnban, cmdMute, cmdUnmute, cmdWarn, cmdWarns, cmdClearWarns, cmdClear, cmdLock, cmdUnlock, cmdSlowmode, cmdNickname } from './systems/moderation.js';
import { cmdPoll, cmdGiveaway, cmdAnnounce, cmdEmbed, cmdSay, cmdUserInfo, cmdServerInfo } from './systems/fun.js';
import { resolveAlias, cmdAliasAdd, cmdAliasRemove, cmdAliasList } from './systems/aliases.js';
import { cmdShop, cmdBuy, cmdDeliver, cmdOrders, SHOP_ITEMS } from './systems/shop.js';
import { handleMemberJoin, handleMemberLeave, cmdSetWelcome } from './systems/welcome.js';
import { handleXP, cmdRank, cmdXPTop, cmdSetXP } from './systems/xp.js';
import { mkdirSync, existsSync } from 'fs';

// تأكد من وجود مجلد data
if (!existsSync('./data')) mkdirSync('./data', { recursive: true });

// ====== الإعدادات ======
const CONFIG = {
  token:            process.env.DISCORD_TOKEN || '',
  clientId:         process.env.CLIENT_ID     || '',
  channelId:        process.env.STATUS_CHANNEL_ID || '1515135241159835650',
  consoleChannelId: '1523068320293720194',
  host:             process.env.MC_HOST     || 'Sandmc.laxel.host',
  port:             Number(process.env.MC_PORT || 19146),
  rconPort:         19146,
  rconPassword:     process.env.RCON_PASSWORD || 'sandmcontopbs',
  updateIntervalMs: 5000,
  historySize:      60,
};

// ملاحظة: MessageContent و GuildMembers هي Privileged Intents
// لازم تفعّلها في: Discord Developer Portal → Bot → Privileged Gateway Intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,       // ← Privileged (فعّلها في Portal)
    GatewayIntentBits.GuildMembers,         // ← Privileged (فعّلها في Portal)
    GatewayIntentBits.GuildMessageReactions,
    // GuildPresences حُذف — مو ضروري
  ],
});

// ====== Groq AI ======
let openai = null;
if (process.env.GROQ_API_KEY) {
  openai = new OpenAI({
    apiKey:  process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

const conversationHistory = new Map();
let latencyHistory = [];
let lastStatus     = null;
let lastError      = null;
let faviconAttachment = null;

// ====== حالة السيرفر ======
async function fetchServerStatus() {
  const res = await status(CONFIG.host, CONFIG.port, { timeout: 6000 });
  return {
    online:        true,
    version:       res.version?.name || 'غير معروف',
    playersOnline: res.players?.online ?? 0,
    playersMax:    res.players?.max    ?? 0,
    motd:          res.motd?.clean || res.motd?.html || '',
    latency:       Math.round(res.roundTripLatency ?? 0),
    favicon:       res.favicon || null,
    sample:        res.players?.sample || [],
  };
}

function buildEmbed(state) {
  const { online, latency } = state;
  const latencyLabel = latency <= 80 ? 'ممتاز ⚡' : latency <= 180 ? 'جيد ✓' : 'ضعيف ⚠️';

  const embed = new EmbedBuilder()
    .setTitle('🟢 بوت مراقبة سيرفر SandMC')
    .setColor(online ? (latency <= 80 ? 0x22c55e : latency <= 180 ? 0xeab308 : 0xef4444) : 0xef4444)
    .setThumbnail(online && faviconAttachment ? 'attachment://favicon.png' : null)
    .addFields(
      { name: 'IP',      value: `\`${CONFIG.host}\``,                                       inline: true },
      { name: 'Port',    value: `\`${CONFIG.port}\``,                                        inline: true },
      { name: 'Ping',    value: `\`${latency} ms\` — ${latencyLabel}`,                       inline: true },
      { name: 'Players', value: online ? `**${state.playersOnline}** / ${state.playersMax}` : 'N/A', inline: true },
      { name: 'Status',  value: online ? '🟢 **Online**' : '🔴 **Offline / Unreachable**',  inline: true },
    )
    .setFooter({ text: `آخر تحديث: ${new Date().toLocaleTimeString('ar-SA')} | SandMC` })
    .setTimestamp();

  if (state.motd) embed.setDescription(`> ${state.motd}`);
  return embed;
}

async function buildStatusMessage() {
  try {
    const s    = await fetchServerStatus();
    lastStatus = s; lastError = null;
    latencyHistory.push(s.latency);
    if (latencyHistory.length > CONFIG.historySize) latencyHistory.shift();
    if (s.favicon?.startsWith('data:image')) {
      const buf = Buffer.from(s.favicon.split(',')[1], 'base64');
      faviconAttachment = new AttachmentBuilder(buf, { name: 'favicon.png' });
    } else faviconAttachment = null;
  } catch (e) {
    lastError = e.message;
    latencyHistory.push(lastStatus ? lastStatus.latency : 1000);
    if (latencyHistory.length > CONFIG.historySize) latencyHistory.shift();
  }

  const state = lastStatus || { online: false, version: 'غير معروف', playersOnline: 0, playersMax: 0, latency: 0, motd: '' };
  const embed = buildEmbed(state);
  const imgBuf = renderLatencyImage(latencyHistory, lastStatus ? lastStatus.latency : 0, state.motd);
  const attachment = new AttachmentBuilder(imgBuf, { name: 'latency.png' });
  const files = [attachment];
  if (faviconAttachment) files.push(faviconAttachment);
  return { embeds: [embed], files };
}

let statusMessage = null;
async function sendPeriodicUpdate() {
  const channel = client.channels.cache.get(CONFIG.channelId);
  if (!channel) return;
  const payload = await buildStatusMessage();
  try {
    if (statusMessage?.editable) {
      await statusMessage.edit(payload);
    } else {
      statusMessage = await channel.send(payload);
    }
  } catch (e) {
    try { statusMessage = await channel.send(payload); } catch {}
  }
}

// ====== الذكاء الاصطناعي ======
async function askAI(userId, username, userMessage) {
  if (!openai) return 'عذراً، خدمة الذكاء الاصطناعي غير مفعّلة حالياً. تواصل مع المشرف.';
  if (!conversationHistory.has(userId)) conversationHistory.set(userId, []);
  const history = conversationHistory.get(userId);
  history.push({ role: 'user', content: userMessage });
  if (history.length > 12) history.splice(0, history.length - 12);

  const response = await openai.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `أنت مساعد ذكي اسمك SandBot لسيرفر Minecraft اسمه SandMC.
معلومات السيرفر: IP: Sandmc.laxel.host | Port: 19146 | الإصدار: Paper 1.21.4

قواعد مهمة:
- تحدث دائماً بالعربي بأسلوب ودي وعامي وقصير.
- جاوب على أي سؤال مهما كان.
- لا تقول "لا أستطيع" أو "لا أعرف".
- كن مرح وخفيف الدم مع اللاعبين.
- إذا سألوا عن أوامر البوت، وجّههم لـ /help`,
      },
      ...history,
    ],
    max_tokens: 500,
    temperature: 0.75,
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
    try { await rcon.end(); } catch {}
    throw e;
  }
}

// ====== معالجة الأوامر النصية ======
const knownCmds = [
  'balance','bal','daily','pay','leaderboard','lb','top','addmoney','removemoney',
  'rob','gamble','deposit','withdraw',
  'kick','ban','unban','mute','unmute','warn','warns','clearwarns','clear',
  'lock','unlock','slowmode','nickname','nick',
  'poll','giveaway','announce','embed','say','userinfo','serverinfo',
  'alias','keyall','help','shop','buy','deliver','orders',
  'setwelcome','rank','xptop','setxp',
];

async function handleCommand(message) {
  const raw      = message.content.trim();
  const rawFirst = raw.split(' ')[0].toLowerCase().replace(/^\//, '');
  const content  = (!raw.startsWith('/') && knownCmds.includes(rawFirst)) ? '/' + raw : raw;
  const lower    = content.toLowerCase();
  const args     = content.trim().split(/\s+/);

  // حالة السيرفر
  if (lower === 'mc' || lower === 'ip') {
    await message.reply(await buildStatusMessage());
    return true;
  }

  // keyall
  if (lower.startsWith('/keyall')) {
    const players = args[1] || '?', time = args[2] || '?';
    const keyEmbed = new EmbedBuilder()
      .setColor(0xf59e0b).setTitle('🔑 | Key All')
      .addFields(
        { name: '🌐 IP',      value: `\`${CONFIG.host}\``, inline: true },
        { name: '🔌 Port',    value: `\`${CONFIG.port}\``, inline: true },
        { name: '🟢 Players', value: `\`${players}\``,     inline: true },
        { name: '⏰ Time',    value: `\`${time}\``,         inline: true },
      )
      .setFooter({ text: 'SandMC | Key All' }).setTimestamp();
    try { await message.delete(); } catch {}
    const keyChannel = client.channels.cache.get('1523068320293720194');
    await (keyChannel || message.channel).send({ content: '||@here @everyone||', embeds: [keyEmbed] });
    return true;
  }

  // help
  if (lower === '/help') {
    const embed = new EmbedBuilder()
      .setColor(0x6366f1).setTitle('📖 قائمة الأوامر — SandBot')
      .addFields(
        { name: '⚙️ عام',           value: '`mc` `ip` — حالة السيرفر\n`/keyall [players] [time]`\n`/help`',                              inline: false },
        { name: '💰 Sand Money',     value: '`/balance` `/daily` `/pay` `/leaderboard`\n`/rob` `/gamble` `/deposit` `/withdraw`\n`/addmoney` `/removemoney` [أدمن]', inline: false },
        { name: '📊 XP & Levels',    value: '`/rank` — بطاقة الرانك\n`/xptop` — أعلى XP\n`/setxp` [أدمن]',                               inline: false },
        { name: '🛡️ مودريشن',        value: '`/kick` `/ban` `/unban` `/mute` `/unmute`\n`/warn` `/warns` `/clearwarns` `/clear`\n`/lock` `/unlock` `/slowmode` `/nickname`', inline: false },
        { name: '🎉 ترفيه',          value: '`/poll` `/giveaway` `/announce` `/embed` `/say`\n`/userinfo` `/serverinfo`',                  inline: false },
        { name: '👋 الترحيب',        value: '`/setwelcome channel #روم`\n`/setwelcome msg [نص]`\n`/setwelcome leave #روم`\n`/setwelcome status`', inline: false },
        { name: '🛒 المتجر',         value: '`/shop` `/buy [رقم] [MC_name]`\n`/orders` `/deliver [رقم]` [أدمن]',                          inline: false },
        { name: '⚡ اختصارات',       value: '`/alias add` `/alias remove` `/alias list`',                                                  inline: false },
      )
      .setFooter({ text: 'SandMC Bot • /help لعرض هذه القائمة' }).setTimestamp();
    await message.reply({ embeds: [embed] });
    return true;
  }

  // الاقتصاد
  if (lower.startsWith('/balance') || lower === '/bal') { await cmdBalance(message, args); return true; }
  if (lower === '/daily')                                { await cmdDaily(message);         return true; }
  if (lower.startsWith('/pay'))                          { await cmdPay(message, args);     return true; }
  if (['/leaderboard','/lb','/top'].includes(lower))     { await cmdLeaderboard(message);   return true; }
  if (lower.startsWith('/addmoney'))                     { await cmdAddMoney(message, args);    return true; }
  if (lower.startsWith('/removemoney'))                  { await cmdRemoveMoney(message, args);  return true; }
  if (lower.startsWith('/rob'))                          { await cmdRob(message, args);      return true; }
  if (lower.startsWith('/gamble'))                       { await cmdGamble(message, args);   return true; }
  if (lower.startsWith('/deposit'))                      { await cmdDeposit(message, args);  return true; }
  if (lower.startsWith('/withdraw'))                     { await cmdWithdraw(message, args); return true; }

  // مودريشن
  if (lower.startsWith('/kick'))       { await cmdKick(message, args);        return true; }
  if (lower.startsWith('/ban'))        { await cmdBan(message, args);         return true; }
  if (lower.startsWith('/unban'))      { await cmdUnban(message, args);       return true; }
  if (lower.startsWith('/mute'))       { await cmdMute(message, args);        return true; }
  if (lower.startsWith('/unmute'))     { await cmdUnmute(message, args);      return true; }
  if (lower.startsWith('/warn '))      { await cmdWarn(message, args);        return true; }
  if (lower.startsWith('/warns'))      { await cmdWarns(message, args);       return true; }
  if (lower.startsWith('/clearwarns')) { await cmdClearWarns(message, args);  return true; }
  if (lower.startsWith('/clear'))      { await cmdClear(message, args);       return true; }
  if (lower.startsWith('/lock'))       { await cmdLock(message, args);        return true; }
  if (lower.startsWith('/unlock'))     { await cmdUnlock(message, args);      return true; }
  if (lower.startsWith('/slowmode'))   { await cmdSlowmode(message, args);    return true; }
  if (lower.startsWith('/nickname') || lower.startsWith('/nick')) { await cmdNickname(message, args); return true; }

  // ترفيه
  if (lower.startsWith('/poll'))       { await cmdPoll(message, ['poll', content.slice(6)]);  return true; }
  if (lower.startsWith('/giveaway'))   { await cmdGiveaway(message, args);    return true; }
  if (lower.startsWith('/announce'))   { await cmdAnnounce(message, args);    return true; }
  if (lower.startsWith('/embed'))      { await cmdEmbed(message, args);       return true; }
  if (lower.startsWith('/say'))        { await cmdSay(message, args);         return true; }
  if (lower.startsWith('/userinfo'))   { await cmdUserInfo(message, args);    return true; }
  if (lower === '/serverinfo')         { await cmdServerInfo(message);        return true; }

  // ترحيب
  if (lower.startsWith('/setwelcome')) { await cmdSetWelcome(message, args);  return true; }

  // XP
  if (lower.startsWith('/rank'))  { await cmdRank(message, args);   return true; }
  if (lower === '/xptop')         { await cmdXPTop(message);        return true; }
  if (lower.startsWith('/setxp')) { await cmdSetXP(message, args);  return true; }

  // اختصارات
  if (lower.startsWith('/alias add'))    { await cmdAliasAdd(message, args);    return true; }
  if (lower.startsWith('/alias remove')) { await cmdAliasRemove(message, args); return true; }
  if (lower === '/alias list')           { await cmdAliasList(message);         return true; }

  // متجر
  if (lower === '/shop')               { await cmdShop(message);               return true; }
  if (lower.startsWith('/buy'))        { await cmdBuy(message, args);          return true; }
  if (lower.startsWith('/deliver'))    { await cmdDeliver(message, args);      return true; }
  if (lower === '/orders')             { await cmdOrders(message);             return true; }

  return false;
}

// ====== معالجة الرسائل ======
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // XP
  handleXP(message).catch(() => {});

  // روم الكونسل — RCON
  if (message.channel.id === CONFIG.consoleChannelId) {
    const cmd = message.content.trim();
    if (!cmd) return;
    message.channel.sendTyping().catch(() => {});
    sendRconCommand(cmd)
      .then(async (response) => {
        await message.reply({ embeds: [new EmbedBuilder()
          .setColor(0x22c55e).setTitle('✅ Console')
          .addFields(
            { name: '📥 Command',  value: `\`${cmd}\``,                               inline: false },
            { name: '📤 Response', value: `\`\`\`${response.slice(0, 1000) || 'No output'}\`\`\``, inline: false },
          ).setTimestamp()] });
      })
      .catch(async (e) => {
        await message.reply({ embeds: [new EmbedBuilder()
          .setColor(0xef4444).setTitle('❌ Console Error')
          .addFields(
            { name: '📥 Command', value: `\`${cmd}\``,          inline: false },
            { name: '⚠️ Error',   value: `\`\`\`${e.message}\`\`\``, inline: false },
          ).setTimestamp()] });
      });
    return;
  }

  const content = message.content.trim();

  // اختصارات
  if (message.guild) {
    const resolved = resolveAlias(message.guild.id, content);
    if (resolved) {
      const aliasMsg = new Proxy(message, { get(t,p) { return p==='content' ? resolved : t[p]; } });
      const ok = await handleCommand(aliasMsg).catch(e => { console.error('[alias-error]', e.message); return false; });
      if (!ok) await message.reply(`⚠️ الاختصار يشير لأمر غير صالح: \`${resolved}\``);
      return;
    }
  }

  // الأوامر العادية
  const handled = await handleCommand(message).catch(e => { console.error('[cmd-error]', e.message); return false; });
  if (handled) return;

  // ذكاء اصطناعي — روم مخصص
  const AI_CHANNEL_ID = '1537237893813370989';
  if (message.channel.id !== AI_CHANNEL_ID) return;
  if (content.toLowerCase() === 'mc' || content.toLowerCase() === 'ip' || content.startsWith('/')) return;

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

// ====== أحداث الأعضاء ======
client.on('guildMemberAdd',    member => handleMemberJoin(member).catch(e  => console.error('[welcome-error]',  e.message)));
client.on('guildMemberRemove', member => handleMemberLeave(member).catch(e => console.error('[leave-error]',    e.message)));

// ====== Slash Commands ======
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, options } = interaction;

  const fakeMsg = {
    author:  interaction.user,
    member:  interaction.member,
    guild:   interaction.guild,
    channel: interaction.channel,
    client:  client,
    mentions: {
      users:    { first: () => options.getUser?.('user')   || null },
      members:  { first: () => options.getMember?.('user') || null },
      channels: { first: () => options.getChannel?.('channel') || null },
      has: () => false,
    },
    reply: async (payload) => {
      if (interaction.replied || interaction.deferred)
        return interaction.followUp(typeof payload === 'string' ? { content: payload } : payload);
      return interaction.reply(typeof payload === 'string' ? { content: payload } : payload);
    },
    channel: {
      ...interaction.channel,
      id:          interaction.channelId,
      send:        async (p) => interaction.channel.send(p),
      sendTyping:  async () => {},
      bulkDelete:  async (n, f) => interaction.channel.bulkDelete(n, f),
      permissionOverwrites: interaction.channel.permissionOverwrites,
      setRateLimitPerUser: (s) => interaction.channel.setRateLimitPerUser(s),
    },
    delete: async () => {},
    content: '',
    id: interaction.id,
  };

  try { await interaction.deferReply(); } catch {}

  try {
    switch (commandName) {

      case 'help': {
        const embed = new EmbedBuilder()
          .setColor(0x6366f1).setTitle('📖 قائمة الأوامر — SandBot')
          .addFields(
            { name: '💰 Sand Money',  value: '`/balance` `/daily` `/pay` `/leaderboard`\n`/rob` `/gamble` `/deposit` `/withdraw`', inline: false },
            { name: '📊 XP',          value: '`/rank` `/xptop`',                                                                     inline: false },
            { name: '🛡️ مودريشن',    value: '`/kick` `/ban` `/unban` `/mute` `/unmute` `/warn` `/warns` `/clear`\n`/lock` `/unlock` `/slowmode`', inline: false },
            { name: '🎉 ترفيه',       value: '`/poll` `/giveaway` `/announce` `/userinfo` `/serverinfo`',                           inline: false },
            { name: '👋 الترحيب',    value: '`/setwelcome` — ضبط الترحيب والوداع',                                                 inline: false },
            { name: '🛒 المتجر',      value: '`/shop` `/buy` `/orders`',                                                            inline: false },
          )
          .setFooter({ text: 'SandMC Bot' }).setTimestamp();
        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'balance': await cmdBalance(fakeMsg, ['balance']); break;
      case 'daily':   await cmdDaily(fakeMsg);                break;

      case 'pay': {
        const target = options.getUser('user');
        const amount = options.getInteger('amount');
        fakeMsg.mentions.users.first = () => target;
        await cmdPay(fakeMsg, ['/pay', `<@${target?.id}>`, String(amount)]);
        break;
      }

      case 'leaderboard': await cmdLeaderboard(fakeMsg); break;

      case 'addmoney': {
        const target = options.getUser('user');
        const amount = options.getInteger('amount');
        fakeMsg.mentions.users.first = () => target;
        await cmdAddMoney(fakeMsg, ['/addmoney', `<@${target?.id}>`, String(amount)]);
        break;
      }

      case 'rob': {
        const target = options.getUser('user');
        fakeMsg.mentions.users.first = () => target;
        await cmdRob(fakeMsg, ['/rob', `<@${target?.id}>`]);
        break;
      }

      case 'gamble': {
        const amount = options.getString('amount');
        await cmdGamble(fakeMsg, ['/gamble', amount]);
        break;
      }

      case 'deposit': {
        const amount = options.getString('amount');
        await cmdDeposit(fakeMsg, ['/deposit', amount]);
        break;
      }

      case 'withdraw': {
        const amount = options.getString('amount');
        await cmdWithdraw(fakeMsg, ['/withdraw', amount]);
        break;
      }

      case 'rank': {
        const target = options.getUser('user') || null;
        fakeMsg.mentions.users.first = () => target;
        await cmdRank(fakeMsg, ['/rank']);
        break;
      }

      case 'xptop': await cmdXPTop(fakeMsg); break;

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
        const target  = options.getMember('user');
        const minutes = options.getInteger('minutes') || 10;
        const reason  = options.getString('reason')  || 'بدون سبب';
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

      case 'clearwarns': {
        const target = options.getUser('user');
        fakeMsg.mentions.users.first = () => target;
        await cmdClearWarns(fakeMsg, ['/clearwarns']);
        break;
      }

      case 'clear': {
        const amount = options.getInteger('amount') || 10;
        try {
          const deleted = await interaction.channel.bulkDelete(amount, true);
          await interaction.editReply(`✅ تم حذف **${deleted.size}** رسالة.`);
        } catch (e) {
          await interaction.editReply(`❌ فشل: ${e.message}`);
        }
        break;
      }

      case 'lock': {
        const reason = options.getString('reason') || 'بواسطة المودريشن';
        await cmdLock(fakeMsg, ['/lock', '', reason]);
        break;
      }

      case 'unlock': await cmdUnlock(fakeMsg, ['/unlock']); break;

      case 'slowmode': {
        const seconds = options.getInteger('seconds');
        await cmdSlowmode(fakeMsg, ['/slowmode', String(seconds)]);
        break;
      }

      case 'nickname': {
        const target = options.getMember('user');
        const nick   = options.getString('nick') || null;
        fakeMsg.mentions.members.first = () => target;
        await cmdNickname(fakeMsg, ['/nickname', `<@${target?.id}>`, ...(nick ? nick.split(' ') : [])]);
        break;
      }

      case 'poll': {
        const question = options.getString('question');
        const opts = [
          options.getString('option1'), options.getString('option2'),
          options.getString('option3'), options.getString('option4'),
        ].filter(Boolean);
        const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣'];
        const embed = new EmbedBuilder()
          .setColor(0x6366f1).setTitle(`📊 ${question}`)
          .setDescription(opts.map((o,i) => `${emojis[i]} **${o}**`).join('\n\n'))
          .setFooter({ text: `بواسطة ${interaction.user.username}` }).setTimestamp();
        const pollMsg = await interaction.editReply({ embeds: [embed], fetchReply: true });
        for (let i = 0; i < opts.length; i++) await pollMsg.react(emojis[i]).catch(() => {});
        break;
      }

      case 'giveaway': {
        const minutes = options.getInteger('minutes');
        const winners = options.getInteger('winners');
        const prize   = options.getString('prize');
        const endsAt  = Date.now() + minutes * 60_000;
        const embed = new EmbedBuilder()
          .setColor(0xa855f7).setTitle('🎉 GIVEAWAY!')
          .setDescription(`## ${prize}\n\nاضغط 🎉 للمشاركة!`)
          .addFields(
            { name: '⏳ ينتهي خلال', value: `${minutes} دقيقة`,           inline: true },
            { name: '🏆 الفائزون',   value: `${winners} شخص`,             inline: true },
            { name: '👤 بواسطة',     value: interaction.user.username,    inline: true },
            { name: '📅 الانتهاء',   value: `<t:${Math.floor(endsAt/1000)}:R>`, inline: true },
          )
          .setFooter({ text: 'اضغط 🎉 للمشاركة' }).setTimestamp(endsAt);
        const gwMsg = await interaction.editReply({ embeds: [embed], fetchReply: true });
        await gwMsg.react('🎉');
        setTimeout(async () => {
          try {
            const msg = await interaction.channel.messages.fetch(gwMsg.id, { force: true });
            const reaction = msg.reactions.cache.get('🎉');
            let entries = [];
            if (reaction) { await reaction.fetch(); const users = await reaction.users.fetch({ limit:100 }); entries = [...users.values()].filter(u=>!u.bot); }
            if (!entries.length) return interaction.channel.send({ embeds: [new EmbedBuilder().setColor(0xef4444).setTitle('😢 انتهى بدون فائز!').setDescription(`**${prize}**\n\nما حد شارك`).setTimestamp()] });
            const selected = [];
            const pool = [...entries];
            for (let i = 0; i < Math.min(winners, pool.length); i++) selected.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
            const mentions = selected.map(u=>`<@${u.id}>`).join(', ');
            await msg.edit({ embeds: [new EmbedBuilder().setColor(0x22c55e).setTitle('🏆 انتهى الـ Giveaway!').setDescription(`**${prize}**\n\n🎉 الفائز: ${mentions}`).setTimestamp()] }).catch(()=>{});
            await interaction.channel.send({ content: `🎉 مبروك ${mentions}! فزتوا بـ **${prize}**` });
          } catch(e) { console.error('[giveaway-slash]', e.message); }
        }, minutes * 60_000);
        break;
      }

      case 'announce': {
        const text = options.getString('text');
        if (!interaction.member?.permissions.has('ManageGuild')) { await interaction.editReply('❌ للمشرفين فقط.'); break; }
        const embed = new EmbedBuilder().setColor(0x22c55e).setTitle('📢 إعلان رسمي')
          .setDescription(text).setFooter({ text: `بواسطة ${interaction.user.username}` }).setTimestamp();
        await interaction.channel.send({ content: '@everyone', embeds: [embed] });
        await interaction.editReply('✅ تم الإرسال.');
        break;
      }

      case 'userinfo': {
        const target = options.getMember('user') || interaction.member;
        fakeMsg.mentions.members.first = () => target;
        await cmdUserInfo(fakeMsg, ['/userinfo']);
        break;
      }

      case 'serverinfo': await cmdServerInfo(fakeMsg); break;

      case 'alias': {
        const action = options.getString('action');
        const aliasName = options.getString('alias');
        const command   = options.getString('command');
        if (action === 'list')   await cmdAliasList(fakeMsg);
        else if (action === 'add')    await cmdAliasAdd(fakeMsg,    ['/alias', 'add',    aliasName, command]);
        else if (action === 'remove') await cmdAliasRemove(fakeMsg, ['/alias', 'remove', aliasName]);
        break;
      }

      case 'shop':  await cmdShop(fakeMsg); break;

      case 'buy': {
        const itemNum = options.getInteger('item');
        const mcName  = options.getString('mc_name') || null;
        await cmdBuy(fakeMsg, ['/buy', String(itemNum), ...(mcName ? mcName.split(' ') : [])]);
        break;
      }

      case 'orders':  await cmdOrders(fakeMsg);  break;

      case 'deliver': {
        const oid = options.getInteger('order_id');
        await cmdDeliver(fakeMsg, ['/deliver', String(oid)]);
        break;
      }

      case 'keyall': {
        const players = options.getString('players') || '?';
        const time    = options.getString('time')    || '?';
        const keyEmbed = new EmbedBuilder()
          .setColor(0xf59e0b).setTitle('🔑 | Key All')
          .addFields(
            { name: '🌐 IP',      value: `\`${CONFIG.host}\``, inline: true },
            { name: '🔌 Port',    value: `\`${CONFIG.port}\``, inline: true },
            { name: '🟢 Players', value: `\`${players}\``,     inline: true },
            { name: '⏰ Time',    value: `\`${time}\``,         inline: true },
          )
          .setFooter({ text: 'SandMC | Key All' }).setTimestamp();
        const keyChannel = client.channels.cache.get('1523068320293720194');
        await (keyChannel || interaction.channel).send({ content: '||@here @everyone||', embeds: [keyEmbed] });
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

// ====== تسجيل Slash Commands ======
async function registerSlashCommands() {
  // استخلاص CLIENT_ID من التوكن تلقائياً لو مو موجود
  const resolvedClientId = CONFIG.clientId ||
    Buffer.from(CONFIG.token.split('.')[0], 'base64').toString('utf8');

  if (!resolvedClientId || !CONFIG.token) {
    console.warn('[slash] لا يوجد TOKEN — تم تخطي تسجيل الأوامر');
    return;
  }
  const commands = [
    new SlashCommandBuilder().setName('help').setDescription('قائمة الأوامر'),
    new SlashCommandBuilder().setName('balance').setDescription('عرض رصيدك')
      .addUserOption(o => o.setName('user').setDescription('عضو اختياري')),
    new SlashCommandBuilder().setName('daily').setDescription('استلام مكافأة يومية'),
    new SlashCommandBuilder().setName('pay').setDescription('تحويل رصيد')
      .addUserOption(o => o.setName('user').setDescription('المستلم').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('المبلغ').setRequired(true).setMinValue(1)),
    new SlashCommandBuilder().setName('leaderboard').setDescription('أغنى اللاعبين'),
    new SlashCommandBuilder().setName('rob').setDescription('سرقة شخص')
      .addUserOption(o => o.setName('user').setDescription('الضحية').setRequired(true)),
    new SlashCommandBuilder().setName('gamble').setDescription('مراهنة بالرصيد')
      .addStringOption(o => o.setName('amount').setDescription('المبلغ أو "all"').setRequired(true)),
    new SlashCommandBuilder().setName('deposit').setDescription('إيداع في البنك')
      .addStringOption(o => o.setName('amount').setDescription('المبلغ أو "all"').setRequired(true)),
    new SlashCommandBuilder().setName('withdraw').setDescription('سحب من البنك')
      .addStringOption(o => o.setName('amount').setDescription('المبلغ أو "all"').setRequired(true)),
    new SlashCommandBuilder().setName('rank').setDescription('عرض بطاقة الرانك XP')
      .addUserOption(o => o.setName('user').setDescription('عضو اختياري')),
    new SlashCommandBuilder().setName('xptop').setDescription('قائمة أعلى XP'),
    new SlashCommandBuilder().setName('addmoney').setDescription('[أدمن] إضافة رصيد')
      .addUserOption(o => o.setName('user').setDescription('العضو').setRequired(true))
      .addIntegerOption(o => o.setName('amount').setDescription('المبلغ').setRequired(true)),
    new SlashCommandBuilder().setName('kick').setDescription('طرد عضو')
      .addUserOption(o => o.setName('user').setDescription('العضو').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('السبب')),
    new SlashCommandBuilder().setName('ban').setDescription('حظر عضو')
      .addUserOption(o => o.setName('user').setDescription('العضو').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('السبب')),
    new SlashCommandBuilder().setName('unban').setDescription('رفع الحظر')
      .addStringOption(o => o.setName('userid').setDescription('ID المستخدم').setRequired(true)),
    new SlashCommandBuilder().setName('mute').setDescription('كتم عضو')
      .addUserOption(o => o.setName('user').setDescription('العضو').setRequired(true))
      .addIntegerOption(o => o.setName('minutes').setDescription('الدقائق (افتراضي 10)').setMinValue(1).setMaxValue(40320))
      .addStringOption(o => o.setName('reason').setDescription('السبب')),
    new SlashCommandBuilder().setName('unmute').setDescription('رفع الكتم')
      .addUserOption(o => o.setName('user').setDescription('العضو').setRequired(true)),
    new SlashCommandBuilder().setName('warn').setDescription('تحذير عضو')
      .addUserOption(o => o.setName('user').setDescription('العضو').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('السبب')),
    new SlashCommandBuilder().setName('warns').setDescription('عرض التحذيرات')
      .addUserOption(o => o.setName('user').setDescription('عضو اختياري')),
    new SlashCommandBuilder().setName('clearwarns').setDescription('[أدمن] حذف تحذيرات عضو')
      .addUserOption(o => o.setName('user').setDescription('العضو').setRequired(true)),
    new SlashCommandBuilder().setName('clear').setDescription('حذف رسائل')
      .addIntegerOption(o => o.setName('amount').setDescription('العدد (1-100)').setMinValue(1).setMaxValue(100)),
    new SlashCommandBuilder().setName('lock').setDescription('قفل الروم الحالي')
      .addStringOption(o => o.setName('reason').setDescription('السبب')),
    new SlashCommandBuilder().setName('unlock').setDescription('فتح الروم الحالي'),
    new SlashCommandBuilder().setName('slowmode').setDescription('ضبط الـ Slowmode')
      .addIntegerOption(o => o.setName('seconds').setDescription('الثوانٍ (0 لإيقاف)').setRequired(true).setMinValue(0).setMaxValue(21600)),
    new SlashCommandBuilder().setName('nickname').setDescription('تغيير لقب عضو')
      .addUserOption(o => o.setName('user').setDescription('العضو').setRequired(true))
      .addStringOption(o => o.setName('nick').setDescription('اللقب الجديد (اتركه فارغاً للإزالة)')),
    new SlashCommandBuilder().setName('poll').setDescription('إنشاء استطلاع')
      .addStringOption(o => o.setName('question').setDescription('السؤال').setRequired(true))
      .addStringOption(o => o.setName('option1').setDescription('الخيار 1').setRequired(true))
      .addStringOption(o => o.setName('option2').setDescription('الخيار 2').setRequired(true))
      .addStringOption(o => o.setName('option3').setDescription('الخيار 3'))
      .addStringOption(o => o.setName('option4').setDescription('الخيار 4')),
    new SlashCommandBuilder().setName('giveaway').setDescription('بدء Giveaway')
      .addIntegerOption(o => o.setName('minutes').setDescription('المدة بالدقائق').setRequired(true).setMinValue(1))
      .addIntegerOption(o => o.setName('winners').setDescription('عدد الفائزين').setRequired(true).setMinValue(1))
      .addStringOption(o => o.setName('prize').setDescription('الجائزة').setRequired(true)),
    new SlashCommandBuilder().setName('announce').setDescription('إرسال إعلان رسمي')
      .addStringOption(o => o.setName('text').setDescription('نص الإعلان').setRequired(true)),
    new SlashCommandBuilder().setName('userinfo').setDescription('معلومات عضو')
      .addUserOption(o => o.setName('user').setDescription('العضو')),
    new SlashCommandBuilder().setName('serverinfo').setDescription('معلومات السيرفر'),
    new SlashCommandBuilder().setName('alias').setDescription('إدارة الاختصارات')
      .addStringOption(o => o.setName('action').setDescription('العملية').setRequired(true).addChoices({ name:'add',value:'add' },{ name:'remove',value:'remove' },{ name:'list',value:'list' }))
      .addStringOption(o => o.setName('alias').setDescription('الاختصار'))
      .addStringOption(o => o.setName('command').setDescription('الأمر')),
    new SlashCommandBuilder().setName('shop').setDescription('عرض متجر SandMC'),
    new SlashCommandBuilder().setName('buy').setDescription('شراء منتج من المتجر')
      .addIntegerOption(o => o.setName('item').setDescription('رقم المنتج').setRequired(true).setMinValue(1))
      .addStringOption(o => o.setName('mc_name').setDescription('اسمك في Minecraft')),
    new SlashCommandBuilder().setName('orders').setDescription('[أدمن] عرض الطلبات المعلقة'),
    new SlashCommandBuilder().setName('deliver').setDescription('[أدمن] تسليم طلب')
      .addIntegerOption(o => o.setName('order_id').setDescription('رقم الطلب').setRequired(true)),
    new SlashCommandBuilder().setName('keyall').setDescription('إرسال Key All')
      .addStringOption(o => o.setName('players').setDescription('عدد اللاعبين'))
      .addStringOption(o => o.setName('time').setDescription('الوقت')),
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(CONFIG.token);
  try {
    await rest.put(Routes.applicationCommands(resolvedClientId), { body: commands });
    console.log(`✅ تم تسجيل ${commands.length} Slash Command`);
  } catch (e) {
    console.error('[slash-register]', e.message);
  }
}

// ====== الإقلاع ======
client.once('clientReady', async () => {
  console.log(`✅ البوت متصل: ${client.user.tag}`);
  client.user.setActivity('مراقبة SandMC | /help', { type: 3 });
  await registerSlashCommands();
  await sendPeriodicUpdate();
  setInterval(() => sendPeriodicUpdate().catch(e => console.error('[periodic-error]', e.message)), CONFIG.updateIntervalMs);
});

client.on('error', e => console.error('[discord-error]', e.message));
client.on('shardDisconnect',   (_,id) => console.warn(`[shard-disconnect] shard ${id}`));
client.on('shardReconnecting', id     => console.log(`[shard-reconnect] shard ${id} reconnecting...`));

process.on('uncaughtException',  err    => console.error('[uncaughtException]',  err.message));
process.on('unhandledRejection', reason => console.error('[unhandledRejection]', reason));

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
