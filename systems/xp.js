// ====== نظام الـ XP والمستويات (بناءً على الرسائل) ======
import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const XP_PATH    = './data/xp.json';
const XP_CFG     = './data/xp_config.json';
const XP_PER_MSG = 15;          // XP لكل رسالة
const XP_COOLDOWN = 30_000;     // 30 ثانية بين كل نقاط
const lastXpTime = new Map();   // userId → timestamp

function ensureDir() { if (!existsSync('./data')) mkdirSync('./data', { recursive: true }); }
function loadXP()  { ensureDir(); if (!existsSync(XP_PATH))  return {}; try { return JSON.parse(readFileSync(XP_PATH,  'utf8')); } catch { return {}; } }
function saveXP(d) { writeFileSync(XP_PATH, JSON.stringify(d, null, 2)); }
function loadXPCfg()   { ensureDir(); if (!existsSync(XP_CFG))  return {}; try { return JSON.parse(readFileSync(XP_CFG, 'utf8')); } catch { return {}; } }
function saveXPCfg(d)  { writeFileSync(XP_CFG, JSON.stringify(d, null, 2)); }

function getUser(db, id) {
  if (!db[id]) db[id] = { xp: 0, level: 0, totalXp: 0 };
  return db[id];
}

// XP لكل لفل
function xpForLevel(level) {
  return Math.floor(100 * Math.pow(level + 1, 1.5));
}

// احسب اللفل من الـ XP الكلي
function calcLevel(totalXp) {
  let level = 0;
  let xpNeeded = 0;
  while (xpNeeded + xpForLevel(level) <= totalXp) {
    xpNeeded += xpForLevel(level);
    level++;
  }
  return { level, xpInLevel: totalXp - xpNeeded, xpNeeded: xpForLevel(level) };
}

// رسم بطاقة الرانك
async function renderRankCard(username, avatarUrl, level, xpInLevel, xpNeeded, rank, totalUsers) {
  const W = 900, H = 220;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // خلفية
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0d0d1f');
  bg.addColorStop(1, '#161628');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 20); ctx.fill();

  // نجوم
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 60; i++) {
    const sx = (i * 141.7) % W, sy = (i * 93.5) % H;
    ctx.beginPath(); ctx.arc(sx, sy, 0.4 + (i % 3) * 0.3, 0, Math.PI * 2); ctx.fill();
  }

  // حد
  const bord = ctx.createLinearGradient(0, 0, W, H);
  bord.addColorStop(0, '#6366f1'); bord.addColorStop(0.5, '#a78bfa'); bord.addColorStop(1, '#6366f1');
  ctx.strokeStyle = bord; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(1.5, 1.5, W - 3, H - 3, 20); ctx.stroke();

  // الأفاتار
  const cx = 110, cy = H / 2;
  try {
    const buf = await fetchImage(avatarUrl);
    const img = await loadImage(buf);
    // توهج
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 75);
    glow.addColorStop(0, 'rgba(99,102,241,0.4)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, 75, 0, Math.PI * 2); ctx.fill();
    // الحلقة
    ctx.beginPath(); ctx.arc(cx, cy, 65, 0, Math.PI * 2);
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 3; ctx.stroke();
    // الصورة
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, 62, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(img, cx - 62, cy - 62, 124, 124);
    ctx.restore();
  } catch {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(cx, cy, 62, 0, Math.PI * 2); ctx.fill();
  }

  // اسم
  ctx.textAlign = 'left';
  ctx.font = 'bold 30px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(username.length > 18 ? username.slice(0, 16) + '..' : username, 210, 70);

  // اللفل
  ctx.font = 'bold 20px Arial';
  ctx.fillStyle = '#a78bfa';
  ctx.fillText(`LEVEL  ${level}`, 210, 105);

  // XP
  ctx.font = '16px Arial';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`${xpInLevel.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`, 210, 130);

  // شريط XP
  const pct = Math.min(xpInLevel / xpNeeded, 1);
  const barX = 210, barY = 145, barW = 560, barH = 18;

  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 9); ctx.fill();

  const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  fillGrad.addColorStop(0, '#6366f1'); fillGrad.addColorStop(1, '#a78bfa');
  ctx.fillStyle = fillGrad;
  const filledW = Math.max(barW * pct, barH);
  ctx.beginPath(); ctx.roundRect(barX, barY, filledW, barH, 9); ctx.fill();

  // نقطة نهاية الشريط
  ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 12;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(barX + filledW, barY + barH / 2, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a78bfa';
  ctx.beginPath(); ctx.arc(barX + filledW, barY + barH / 2, 6, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // رتبة
  ctx.textAlign = 'right';
  ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#64748b';
  ctx.fillText('RANK', W - 35, 80);
  ctx.font = 'bold 52px Arial';
  const rankGrad = ctx.createLinearGradient(W - 130, 85, W - 30, 145);
  rankGrad.addColorStop(0, '#fbbf24'); rankGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = rankGrad;
  ctx.fillText(`#${rank}`, W - 35, 148);
  ctx.font = '13px Arial'; ctx.fillStyle = '#475569';
  ctx.fillText(`من ${totalUsers}`, W - 35, 168);

  // watermark
  ctx.textAlign = 'right'; ctx.font = '11px Arial';
  ctx.fillStyle = 'rgba(148,163,184,0.35)';
  ctx.fillText('SandMC XP', W - 20, H - 10);

  return canvas.toBuffer('image/png');
}

async function fetchImage(url) {
  const https = (await import('https')).default;
  return new Promise((resolve, reject) => {
    const finalUrl = url.replace('webp', 'png') + (url.includes('?') ? '&size=256' : '?size=256');
    https.get(finalUrl, (res) => {
      if ([301, 302].includes(res.statusCode)) {
        https.get(res.headers.location, (r2) => {
          const c = []; r2.on('data', x => c.push(x)); r2.on('end', () => resolve(Buffer.concat(c))); r2.on('error', reject);
        }).on('error', reject); return;
      }
      const c = []; res.on('data', x => c.push(x)); res.on('end', () => resolve(Buffer.concat(c))); res.on('error', reject);
    }).on('error', reject);
  });
}

// ====== معالجة الرسائل لإضافة XP ======
export async function handleXP(message) {
  if (message.author.bot) return;
  if (!message.guild) return;

  // cooldown
  const key = `${message.guild.id}_${message.author.id}`;
  const now = Date.now();
  if (lastXpTime.has(key) && now - lastXpTime.get(key) < XP_COOLDOWN) return;
  lastXpTime.set(key, now);

  // تحقق من الإعدادات — هل XP مفعّل في هذا السيرفر؟
  const cfg = loadXPCfg();
  const guildCfg = cfg[message.guild.id];
  if (guildCfg?.disabled) return;

  // تجاهل أروم المستثناة
  if (guildCfg?.ignoredChannels?.includes(message.channel.id)) return;

  const db = loadXP();
  const guildDb = db[message.guild.id] || {};
  const user = guildDb[message.author.id] || { totalXp: 0 };

  const prevLevel = calcLevel(user.totalXp).level;
  user.totalXp += XP_PER_MSG + Math.floor(Math.random() * 10); // 15-24 XP
  const newLevelData = calcLevel(user.totalXp);

  guildDb[message.author.id] = user;
  db[message.guild.id] = guildDb;
  saveXP(db);

  // رفع لفل
  if (newLevelData.level > prevLevel) {
    const lvlChannel = guildCfg?.levelUpChannel
      ? message.guild.channels.cache.get(guildCfg.levelUpChannel)
      : message.channel;

    if (lvlChannel) {
      const embed = new EmbedBuilder()
        .setColor(0xa78bfa)
        .setTitle('🎉 رفعت لفل!')
        .setDescription(`مبروك <@${message.author.id}>! وصلت للفل **${newLevelData.level}** 🚀`)
        .setThumbnail(message.author.displayAvatarURL())
        .setTimestamp();
      lvlChannel.send({ embeds: [embed] }).catch(() => {});
    }
  }
}

// ====== /rank ======
export async function cmdRank(message, args) {
  const db = loadXP();
  const target = message.mentions?.users?.first() || message.author;
  const guildDb = db[message.guild?.id] || {};
  const userXp  = guildDb[target.id] || { totalXp: 0 };

  const { level, xpInLevel, xpNeeded } = calcLevel(userXp.totalXp);

  // الرتبة
  const sorted = Object.entries(guildDb).sort(([,a],[,b]) => (b.totalXp||0) - (a.totalXp||0));
  const rank = sorted.findIndex(([id]) => id === target.id) + 1 || sorted.length + 1;

  const avatarUrl = target.displayAvatarURL
    ? target.displayAvatarURL({ extension: 'png', size: 256 })
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  try {
    const imgBuf = await renderRankCard(
      target.username, avatarUrl, level, xpInLevel, xpNeeded, rank, sorted.length || 1
    );
    await message.reply({ files: [new AttachmentBuilder(imgBuf, { name: 'rank.png' })] });
  } catch (e) {
    console.error('[rank-card]', e.message);
    await message.reply({ embeds: [new EmbedBuilder()
      .setColor(0x6366f1).setTitle(`📊 رانك ${target.username}`)
      .addFields(
        { name: 'اللفل', value: `**${level}**`, inline: true },
        { name: 'الـ XP', value: `**${userXp.totalXp.toLocaleString()}**`, inline: true },
        { name: 'الرتبة', value: `**#${rank}**`, inline: true },
      ).setTimestamp()] });
  }
}

// ====== /xptop ======
export async function cmdXPTop(message) {
  const db = loadXP();
  const guildDb = db[message.guild?.id] || {};
  const sorted = Object.entries(guildDb)
    .sort(([,a],[,b]) => (b.totalXp||0) - (a.totalXp||0))
    .slice(0, 10);

  if (!sorted.length) return message.reply('ما في بيانات XP بعد، ابدأ بالكتابة!');

  const medals = ['🥇','🥈','🥉'];
  const lines = await Promise.all(sorted.map(async ([id, data], i) => {
    let username = `User#${id.slice(-4)}`;
    try { const u = await message.client.users.fetch(id); username = u.username; } catch {}
    const lvl = calcLevel(data.totalXp || 0).level;
    return `${medals[i] || `**${i+1}.**`} **${username}** — Lv.${lvl} | ${(data.totalXp||0).toLocaleString()} XP`;
  }));

  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0x6366f1).setTitle('🏆 قائمة الـ XP الأعلى')
    .setDescription(lines.join('\n'))
    .setTimestamp()] });
}

// ====== /setxp (إدارة) ======
export async function cmdSetXP(message, args) {
  if (!message.member?.permissions.has('Administrator'))
    return message.reply('❌ هذا الأمر للأدمن فقط.');

  const sub = args[1]?.toLowerCase();

  if (sub === 'levelchannel') {
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply('❌ `/setxp levelchannel #روم`');
    const cfg = loadXPCfg();
    if (!cfg[message.guild.id]) cfg[message.guild.id] = {};
    cfg[message.guild.id].levelUpChannel = ch.id;
    saveXPCfg(cfg);
    return message.reply(`✅ رسائل رفع اللفل ستُرسل في ${ch}`);
  }

  if (sub === 'disable') {
    const cfg = loadXPCfg();
    if (!cfg[message.guild.id]) cfg[message.guild.id] = {};
    cfg[message.guild.id].disabled = true;
    saveXPCfg(cfg);
    return message.reply('✅ تم تعطيل نظام XP.');
  }

  if (sub === 'enable') {
    const cfg = loadXPCfg();
    if (!cfg[message.guild.id]) cfg[message.guild.id] = {};
    cfg[message.guild.id].disabled = false;
    saveXPCfg(cfg);
    return message.reply('✅ تم تفعيل نظام XP.');
  }

  if (sub === 'add') {
    const target = message.mentions.users.first();
    const amount = parseInt(args[3]);
    if (!target || isNaN(amount)) return message.reply('❌ `/setxp add @شخص المقدار`');
    const db = loadXP();
    if (!db[message.guild.id]) db[message.guild.id] = {};
    if (!db[message.guild.id][target.id]) db[message.guild.id][target.id] = { totalXp: 0 };
    db[message.guild.id][target.id].totalXp += amount;
    saveXP(db);
    return message.reply(`✅ تم إضافة **${amount} XP** لـ ${target.username}`);
  }

  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0x6366f1).setTitle('⚙️ أوامر XP')
    .addFields(
      { name: '`/setxp levelchannel #روم`', value: 'روم رسائل رفع اللفل', inline: false },
      { name: '`/setxp enable / disable`', value: 'تفعيل/تعطيل XP', inline: false },
      { name: '`/setxp add @شخص المقدار`', value: 'إضافة XP لشخص', inline: false },
    ).setTimestamp()] });
}
