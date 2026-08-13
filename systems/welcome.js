// ====== نظام الترحيب والوداع ======
import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const CONFIG_PATH = './data/welcome_config.json';

function ensureDir() { if (!existsSync('./data')) mkdirSync('./data', { recursive: true }); }
function loadConfig() {
  ensureDir();
  if (!existsSync(CONFIG_PATH)) return {};
  try { return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')); } catch { return {}; }
}
function saveConfig(d) { ensureDir(); writeFileSync(CONFIG_PATH, JSON.stringify(d, null, 2)); }

function getGuildConfig(guildId) {
  const cfg = loadConfig();
  if (!cfg[guildId]) cfg[guildId] = { welcomeChannel: null, leaveChannel: null, welcomeMsg: null, leaveMsg: null };
  return cfg[guildId];
}

// رسم بطاقة الترحيب
async function renderWelcomeCard(username, avatarUrl, memberCount, isWelcome = true) {
  const W = 900, H = 300;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // خلفية
  const bg = ctx.createLinearGradient(0, 0, W, H);
  if (isWelcome) {
    bg.addColorStop(0, '#0a1628');
    bg.addColorStop(0.5, '#0f2044');
    bg.addColorStop(1, '#0a1628');
  } else {
    bg.addColorStop(0, '#1a0a0a');
    bg.addColorStop(0.5, '#2d1010');
    bg.addColorStop(1, '#1a0a0a');
  }
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 20);
  ctx.fill();

  // نجوم خلفية
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  for (let i = 0; i < 80; i++) {
    const sx = (i * 137.5) % W;
    const sy = (i * 97.3) % H;
    const sr = 0.4 + (i % 3) * 0.4;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  }

  // حد متوهج
  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  if (isWelcome) {
    borderGrad.addColorStop(0, '#22d3ee');
    borderGrad.addColorStop(0.5, '#3b82f6');
    borderGrad.addColorStop(1, '#22d3ee');
  } else {
    borderGrad.addColorStop(0, '#ef4444');
    borderGrad.addColorStop(0.5, '#dc2626');
    borderGrad.addColorStop(1, '#ef4444');
  }
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(1.5, 1.5, W - 3, H - 3, 20);
  ctx.stroke();

  // خط زخرفي أفقي
  const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.3, isWelcome ? '#22d3ee' : '#ef4444');
  lineGrad.addColorStop(0.7, isWelcome ? '#3b82f6' : '#dc2626');
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

  // توهج حول الأفاتار
  const glowGrad = ctx.createRadialGradient(150, H / 2, 0, 150, H / 2, 90);
  glowGrad.addColorStop(0, isWelcome ? 'rgba(34,211,238,0.3)' : 'rgba(239,68,68,0.3)');
  glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath(); ctx.arc(150, H / 2, 90, 0, Math.PI * 2); ctx.fill();

  // الأفاتار
  try {
    const buf = await fetchImage(avatarUrl);
    const img = await loadImage(buf);

    // حلقة خارجية
    ctx.beginPath(); ctx.arc(150, H / 2, 75, 0, Math.PI * 2);
    ctx.strokeStyle = isWelcome ? 'rgba(34,211,238,0.5)' : 'rgba(239,68,68,0.5)';
    ctx.lineWidth = 2; ctx.stroke();

    // حلقة داخلية
    ctx.beginPath(); ctx.arc(150, H / 2, 68, 0, Math.PI * 2);
    ctx.strokeStyle = isWelcome ? '#22d3ee' : '#ef4444';
    ctx.lineWidth = 3; ctx.stroke();

    // الصورة
    ctx.save();
    ctx.beginPath(); ctx.arc(150, H / 2, 65, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(img, 150 - 65, H / 2 - 65, 130, 130);
    ctx.restore();
  } catch {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(150, H / 2, 65, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isWelcome ? '#22d3ee' : '#ef4444';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(username.charAt(0).toUpperCase(), 150, H / 2 + 14);
  }

  // النص الرئيسي
  ctx.textAlign = 'left';
  const mainText = isWelcome ? '👋 مرحباً بك!' : '👋 وداعاً!';
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = isWelcome ? 'rgba(34,211,238,0.8)' : 'rgba(239,68,68,0.8)';
  ctx.fillText(mainText, 280, 95);

  // اسم المستخدم
  ctx.font = 'bold 42px Arial';
  const nameGrad = ctx.createLinearGradient(280, 110, 700, 160);
  nameGrad.addColorStop(0, '#ffffff');
  nameGrad.addColorStop(1, isWelcome ? '#93c5fd' : '#fca5a5');
  ctx.fillStyle = nameGrad;
  // اختصر الاسم إذا كان طويلاً
  const displayName = username.length > 16 ? username.slice(0, 14) + '..' : username;
  ctx.fillText(displayName, 280, 160);

  // النص الفرعي
  ctx.font = '20px Arial';
  ctx.fillStyle = '#94a3b8';
  if (isWelcome) {
    ctx.fillText(`أنت العضو رقم ${memberCount.toLocaleString()} في السيرفر!`, 280, 200);
  } else {
    ctx.fillText(`سنفتقدك.. كنت العضو رقم ${memberCount.toLocaleString()}`, 280, 200);
  }

  // شريط زخرفي سفلي
  const stripGrad = ctx.createLinearGradient(280, 0, 850, 0);
  stripGrad.addColorStop(0, isWelcome ? '#22d3ee' : '#ef4444');
  stripGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = stripGrad;
  ctx.beginPath(); ctx.roundRect(280, 220, 560, 3, 2); ctx.fill();

  // SandMC watermark
  ctx.textAlign = 'right';
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = 'rgba(148,163,184,0.5)';
  ctx.fillText('SandMC', W - 20, H - 15);

  return canvas.toBuffer('image/png');
}

async function fetchImage(url) {
  const { default: https } = await import('https');
  return new Promise((resolve, reject) => {
    const finalUrl = (url.replace('webp', 'png') + '?size=256').replace('?size=256?size=256', '?size=256');
    https.get(finalUrl, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        https.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
          res2.on('error', reject);
        }).on('error', reject);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ====== معالجة دخول عضو جديد ======
export async function handleMemberJoin(member) {
  const cfg = getGuildConfig(member.guild.id);
  if (!cfg.welcomeChannel) return;

  const channel = member.guild.channels.cache.get(cfg.welcomeChannel);
  if (!channel) return;

  const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
  const memberCount = member.guild.memberCount;

  try {
    const imgBuf = await renderWelcomeCard(member.user.username, avatarUrl, memberCount, true);
    const att = new AttachmentBuilder(imgBuf, { name: 'welcome.png' });

    const customMsg = cfg.welcomeMsg
      ? cfg.welcomeMsg
          .replace('{user}', `<@${member.user.id}>`)
          .replace('{username}', member.user.username)
          .replace('{server}', member.guild.name)
          .replace('{count}', memberCount)
      : `مرحباً <@${member.user.id}> في **${member.guild.name}**! 🎉`;

    await channel.send({ content: customMsg, files: [att] });
  } catch (e) {
    console.error('[welcome-error]', e.message);
    // fallback embed
    const embed = new EmbedBuilder()
      .setColor(0x22d3ee)
      .setTitle('👋 عضو جديد!')
      .setThumbnail(member.user.displayAvatarURL())
      .setDescription(`مرحباً <@${member.user.id}> في **${member.guild.name}**!`)
      .addFields(
        { name: '👤 الاسم', value: member.user.username, inline: true },
        { name: '👥 عدد الأعضاء', value: `${memberCount}`, inline: true },
      )
      .setTimestamp();
    await channel.send({ embeds: [embed] }).catch(() => {});
  }
}

// ====== معالجة مغادرة عضو ======
export async function handleMemberLeave(member) {
  const cfg = getGuildConfig(member.guild.id);
  if (!cfg.leaveChannel) return;

  const channel = member.guild.channels.cache.get(cfg.leaveChannel);
  if (!channel) return;

  const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
  const memberCount = member.guild.memberCount;

  try {
    const imgBuf = await renderWelcomeCard(member.user.username, avatarUrl, memberCount, false);
    const att = new AttachmentBuilder(imgBuf, { name: 'leave.png' });

    const customMsg = cfg.leaveMsg
      ? cfg.leaveMsg
          .replace('{user}', member.user.username)
          .replace('{server}', member.guild.name)
          .replace('{count}', memberCount)
      : `غادرنا **${member.user.username}** 👋`;

    await channel.send({ content: customMsg, files: [att] });
  } catch (e) {
    console.error('[leave-error]', e.message);
    const embed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle('👋 عضو غادر')
      .setDescription(`**${member.user.username}** غادر السيرفر`)
      .setTimestamp();
    await channel.send({ embeds: [embed] }).catch(() => {});
  }
}

// ====== /setwelcome ======
export async function cmdSetWelcome(message, args) {
  if (!message.member?.permissions.has('ManageGuild'))
    return message.reply('❌ هذا الأمر للمشرفين فقط.');

  const sub = args[1]?.toLowerCase();

  if (sub === 'channel') {
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply('❌ منشن الروم: `/setwelcome channel #روم`');
    const cfg = loadConfig();
    if (!cfg[message.guild.id]) cfg[message.guild.id] = {};
    cfg[message.guild.id].welcomeChannel = ch.id;
    saveConfig(cfg);
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0x22d3ee).setTitle('✅ تم ضبط روم الترحيب')
      .setDescription(`سيتم إرسال رسائل الترحيب في ${ch}`)
      .setTimestamp()] });
  }

  if (sub === 'msg') {
    const msg = args.slice(2).join(' ');
    if (!msg) return message.reply('❌ اكتب الرسالة: `/setwelcome msg نص الرسالة`\nمتغيرات: `{user}` `{username}` `{server}` `{count}`');
    const cfg = loadConfig();
    if (!cfg[message.guild.id]) cfg[message.guild.id] = {};
    cfg[message.guild.id].welcomeMsg = msg;
    saveConfig(cfg);
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0x22d3ee).setTitle('✅ تم ضبط رسالة الترحيب')
      .setDescription(`الرسالة: \`${msg}\``)
      .setTimestamp()] });
  }

  if (sub === 'leave') {
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply('❌ `/setwelcome leave #روم`');
    const cfg = loadConfig();
    if (!cfg[message.guild.id]) cfg[message.guild.id] = {};
    cfg[message.guild.id].leaveChannel = ch.id;
    saveConfig(cfg);
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xef4444).setTitle('✅ تم ضبط روم الوداع')
      .setDescription(`سيتم إرسال رسائل الوداع في ${ch}`)
      .setTimestamp()] });
  }

  if (sub === 'leavemsg') {
    const msg = args.slice(2).join(' ');
    if (!msg) return message.reply('❌ `/setwelcome leavemsg النص`\nمتغيرات: `{user}` `{server}` `{count}`');
    const cfg = loadConfig();
    if (!cfg[message.guild.id]) cfg[message.guild.id] = {};
    cfg[message.guild.id].leaveMsg = msg;
    saveConfig(cfg);
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xef4444).setTitle('✅ تم ضبط رسالة الوداع')
      .setDescription(`الرسالة: \`${msg}\``)
      .setTimestamp()] });
  }

  if (sub === 'test') {
    await handleMemberJoin({ guild: message.guild, user: message.author });
    return;
  }

  if (sub === 'testleave') {
    await handleMemberLeave({ guild: message.guild, user: message.author });
    return;
  }

  if (sub === 'status') {
    const cfg = getGuildConfig(message.guild.id);
    const wCh = cfg.welcomeChannel ? `<#${cfg.welcomeChannel}>` : '❌ غير مضبوط';
    const lCh = cfg.leaveChannel ? `<#${cfg.leaveChannel}>` : '❌ غير مضبوط';
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0x6366f1).setTitle('⚙️ إعدادات الترحيب')
      .addFields(
        { name: '👋 روم الترحيب', value: wCh, inline: true },
        { name: '🚪 روم الوداع', value: lCh, inline: true },
        { name: '💬 رسالة الترحيب', value: cfg.welcomeMsg ? `\`${cfg.welcomeMsg.slice(0, 100)}\`` : 'افتراضية', inline: false },
        { name: '💬 رسالة الوداع', value: cfg.leaveMsg ? `\`${cfg.leaveMsg.slice(0, 100)}\`` : 'افتراضية', inline: false },
      )
      .setTimestamp()] });
  }

  // مساعدة
  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0x22d3ee).setTitle('⚙️ أوامر الترحيب')
    .addFields(
      { name: '`/setwelcome channel #روم`', value: 'ضبط روم الترحيب', inline: false },
      { name: '`/setwelcome msg النص`', value: 'ضبط رسالة الترحيب (متغيرات: `{user}` `{username}` `{server}` `{count}`)', inline: false },
      { name: '`/setwelcome leave #روم`', value: 'ضبط روم الوداع', inline: false },
      { name: '`/setwelcome leavemsg النص`', value: 'ضبط رسالة الوداع', inline: false },
      { name: '`/setwelcome test`', value: 'اختبار رسالة الترحيب', inline: true },
      { name: '`/setwelcome testleave`', value: 'اختبار رسالة الوداع', inline: true },
      { name: '`/setwelcome status`', value: 'عرض الإعدادات الحالية', inline: true },
    )
    .setTimestamp()] });
}
