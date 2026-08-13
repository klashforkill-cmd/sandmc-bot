// ====== أوامر المودريشن (محسّنة) ======
import { EmbedBuilder, AuditLogEvent } from 'discord.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const WARNS_PATH  = './data/warns.json';
const CASES_PATH  = './data/cases.json';

function ensureDir() { if (!existsSync('./data')) mkdirSync('./data', { recursive: true }); }
function loadWarns() { ensureDir(); if (!existsSync(WARNS_PATH)) return {}; try { return JSON.parse(readFileSync(WARNS_PATH,'utf8')); } catch { return {}; } }
function saveWarns(w) { writeFileSync(WARNS_PATH, JSON.stringify(w,null,2)); }
function loadCases() { ensureDir(); if (!existsSync(CASES_PATH)) return {}; try { return JSON.parse(readFileSync(CASES_PATH,'utf8')); } catch { return {}; } }
function saveCases(c) { writeFileSync(CASES_PATH, JSON.stringify(c,null,2)); }

function nextCaseId(guildId) {
  const cases = loadCases();
  if (!cases[guildId]) cases[guildId] = { count: 0 };
  cases[guildId].count++;
  saveCases(cases);
  return cases[guildId].count;
}

// Embed المودريشن الموحّد
function modEmbed(color, title, fields, caseId = null) {
  const e = new EmbedBuilder().setColor(color).setTitle(title).addFields(fields).setTimestamp();
  if (caseId) e.setFooter({ text: `Case #${caseId}` });
  return e;
}

// ====== /kick ======
export async function cmdKick(message, args) {
  if (!message.member?.permissions.has('KickMembers'))
    return message.reply('❌ ما عندك صلاحية Kick.');

  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ **الاستخدام:** `/kick @شخص [السبب]`');
  if (!target.kickable) return message.reply('❌ ما أقدر أطرد هذا الشخص (صلاحياته أعلى مني).');
  if (target.id === message.author.id) return message.reply('❌ ما تقدر تطرد نفسك!');

  const reason = args.slice(2).join(' ') || 'بدون سبب';
  const caseId = nextCaseId(message.guild?.id);

  try {
    // DM للشخص قبل الطرد
    await target.user.send({ embeds: [new EmbedBuilder()
      .setColor(0xf97316).setTitle('👢 تم طردك')
      .setDescription(`تم طردك من **${message.guild.name}**`)
      .addFields({ name: 'السبب', value: reason })
      .setTimestamp()] }).catch(() => {});

    await target.kick(reason);

    await message.reply({ embeds: [modEmbed(0xf97316, '👢 تم الطرد', [
      { name: '👤 العضو',   value: `${target.user.username} (${target.id})`, inline: true },
      { name: '👮 بواسطة',  value: message.author.username,                 inline: true },
      { name: '📋 السبب',   value: reason,                                  inline: false },
    ], caseId)] });
  } catch (e) {
    await message.reply(`❌ فشل: \`${e.message}\``);
  }
}

// ====== /ban ======
export async function cmdBan(message, args) {
  if (!message.member?.permissions.has('BanMembers'))
    return message.reply('❌ ما عندك صلاحية Ban.');

  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ **الاستخدام:** `/ban @شخص [السبب]`');
  if (!target.bannable) return message.reply('❌ ما أقدر أحظر هذا الشخص.');
  if (target.id === message.author.id) return message.reply('❌ ما تقدر تحظر نفسك!');

  const reason = args.slice(2).join(' ') || 'بدون سبب';
  const caseId = nextCaseId(message.guild?.id);

  try {
    await target.user.send({ embeds: [new EmbedBuilder()
      .setColor(0xef4444).setTitle('🔨 تم حظرك')
      .setDescription(`تم حظرك من **${message.guild.name}**`)
      .addFields({ name: 'السبب', value: reason })
      .setTimestamp()] }).catch(() => {});

    await target.ban({ reason, deleteMessageSeconds: 86400 }); // حذف رسائل آخر يوم

    await message.reply({ embeds: [modEmbed(0xef4444, '🔨 تم الحظر', [
      { name: '👤 العضو',   value: `${target.user.username} (${target.id})`, inline: true },
      { name: '👮 بواسطة',  value: message.author.username,                 inline: true },
      { name: '📋 السبب',   value: reason,                                  inline: false },
    ], caseId)] });
  } catch (e) {
    await message.reply(`❌ فشل: \`${e.message}\``);
  }
}

// ====== /unban ======
export async function cmdUnban(message, args) {
  if (!message.member?.permissions.has('BanMembers'))
    return message.reply('❌ ما عندك صلاحية Unban.');

  const userId = args[1];
  if (!userId) return message.reply('❌ **الاستخدام:** `/unban USER_ID`');

  try {
    const ban = await message.guild.bans.fetch(userId).catch(() => null);
    if (!ban) return message.reply(`❌ المستخدم \`${userId}\` غير محظور.`);

    await message.guild.bans.remove(userId);
    await message.reply({ embeds: [modEmbed(0x22c55e, '✅ تم رفع الحظر', [
      { name: '👤 المستخدم', value: `${ban.user.username} (${userId})`, inline: true },
      { name: '👮 بواسطة',   value: message.author.username,            inline: true },
    ])] });
  } catch (e) {
    await message.reply(`❌ فشل: \`${e.message}\``);
  }
}

// ====== /mute (Timeout) ======
export async function cmdMute(message, args) {
  if (!message.member?.permissions.has('ModerateMembers'))
    return message.reply('❌ ما عندك صلاحية Mute.');

  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ **الاستخدام:** `/mute @شخص [الدقائق] [السبب]`');
  if (!target.moderatable) return message.reply('❌ ما أقدر أكتم هذا الشخص.');
  if (target.id === message.author.id) return message.reply('❌ ما تقدر تكتم نفسك!');

  const minutes = parseInt(args[2]) || 10;
  if (minutes < 1 || minutes > 40320) return message.reply('❌ المدة بين 1 دقيقة و 28 يوم.');
  const reason = args.slice(3).join(' ') || 'بدون سبب';
  const caseId = nextCaseId(message.guild?.id);

  const durationText = minutes < 60
    ? `${minutes} دقيقة`
    : minutes < 1440
    ? `${(minutes/60).toFixed(1)} ساعة`
    : `${(minutes/1440).toFixed(1)} يوم`;

  try {
    await target.timeout(minutes * 60_000, reason);

    await target.user.send({ embeds: [new EmbedBuilder()
      .setColor(0xeab308).setTitle('🔇 تم كتمك')
      .setDescription(`تم كتمك في **${message.guild.name}** لمدة **${durationText}**`)
      .addFields({ name: 'السبب', value: reason })
      .setTimestamp()] }).catch(() => {});

    await message.reply({ embeds: [modEmbed(0xeab308, '🔇 تم الكتم', [
      { name: '👤 العضو',   value: `${target.user.username}`,  inline: true },
      { name: '⏱️ المدة',   value: durationText,              inline: true },
      { name: '👮 بواسطة',  value: message.author.username,   inline: true },
      { name: '📋 السبب',   value: reason,                    inline: false },
    ], caseId)] });
  } catch (e) {
    await message.reply(`❌ فشل: \`${e.message}\``);
  }
}

// ====== /unmute ======
export async function cmdUnmute(message, args) {
  if (!message.member?.permissions.has('ModerateMembers'))
    return message.reply('❌ ما عندك صلاحية Unmute.');

  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ `/unmute @شخص`');

  if (!target.communicationDisabledUntil)
    return message.reply(`⚠️ ${target.user.username} غير مكتوم أصلاً.`);

  try {
    await target.timeout(null);
    await message.reply({ embeds: [modEmbed(0x22c55e, '🔊 تم رفع الكتم', [
      { name: '👤 العضو',  value: target.user.username, inline: true },
      { name: '👮 بواسطة', value: message.author.username, inline: true },
    ])] });
  } catch (e) {
    await message.reply(`❌ فشل: \`${e.message}\``);
  }
}

// ====== /warn ======
export async function cmdWarn(message, args) {
  if (!message.member?.permissions.has('ModerateMembers'))
    return message.reply('❌ ما عندك صلاحية Warn.');

  const target = message.mentions.users.first();
  if (!target) return message.reply('❌ **الاستخدام:** `/warn @شخص [السبب]`');
  if (target.id === message.author.id) return message.reply('❌ ما تقدر تحذر نفسك!');
  if (target.bot) return message.reply('❌ ما تقدر تحذر بوت!');

  const reason = args.slice(2).join(' ') || 'بدون سبب';
  const warns = loadWarns();
  const key = `${message.guild?.id}_${target.id}`;
  if (!warns[key]) warns[key] = [];
  warns[key].push({ reason, by: message.author.id, byName: message.author.username, at: Date.now() });
  saveWarns(warns);

  const count = warns[key].length;
  const caseId = nextCaseId(message.guild?.id);

  // DM للشخص
  await target.send({ embeds: [new EmbedBuilder()
    .setColor(0xf59e0b).setTitle(`⚠️ تحذير #${count}`)
    .setDescription(`استلمت تحذيراً في **${message.guild?.name}**`)
    .addFields({ name: 'السبب', value: reason })
    .setTimestamp()] }).catch(() => {});

  // تحذير تلقائي عند الوصول لـ 3
  let extraAction = '';
  if (count >= 3) {
    const member = message.guild?.members.cache.get(target.id);
    if (member?.moderatable) {
      await member.timeout(10 * 60_000, `3 تحذيرات: ${reason}`).catch(() => {});
      extraAction = '\n⚠️ **كتم تلقائي 10 دقائق** بسبب 3 تحذيرات!';
    }
  }

  await message.reply({ embeds: [modEmbed(0xf59e0b, `⚠️ تحذير #${count}`, [
    { name: '👤 العضو',         value: `${target.username}`,        inline: true },
    { name: '👮 بواسطة',        value: message.author.username,      inline: true },
    { name: '📊 إجمالي',        value: `${count} تحذير`,            inline: true },
    { name: '📋 السبب',         value: reason + extraAction,         inline: false },
  ], caseId)] });
}

// ====== /warns ======
export async function cmdWarns(message, args) {
  const target = message.mentions.users.first() || message.author;
  const warns = loadWarns();
  const key = `${message.guild?.id}_${target.id}`;
  const list = warns[key] || [];

  if (!list.length)
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0x22c55e).setTitle('✅ لا تحذيرات')
      .setDescription(`${target.username} ما عنده أي تحذيرات.`)
      .setTimestamp()] });

  const lines = list.map((w, i) =>
    `**${i + 1}.** ${w.reason} — بواسطة <@${w.by}> · <t:${Math.floor(w.at/1000)}:R>`
  ).join('\n');

  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0xf59e0b).setTitle(`⚠️ تحذيرات ${target.username} (${list.length})`)
    .setDescription(lines.slice(0, 4000))
    .setThumbnail(target.displayAvatarURL?.() || null)
    .setTimestamp()] });
}

// ====== /clearwarns ======
export async function cmdClearWarns(message, args) {
  if (!message.member?.permissions.has('Administrator'))
    return message.reply('❌ هذا الأمر للأدمن فقط.');

  const target = message.mentions.users.first();
  if (!target) return message.reply('❌ `/clearwarns @شخص`');

  const warns = loadWarns();
  const key = `${message.guild?.id}_${target.id}`;
  const count = (warns[key] || []).length;
  warns[key] = [];
  saveWarns(warns);

  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0x22c55e).setTitle('🗑️ تم حذف التحذيرات')
    .setDescription(`تم حذف **${count}** تحذير من ${target.username}`)
    .setTimestamp()] });
}

// ====== /clear ======
export async function cmdClear(message, args) {
  if (!message.member?.permissions.has('ManageMessages'))
    return message.reply('❌ ما عندك صلاحية ManageMessages.');

  const amount = Math.min(parseInt(args[1]) || 10, 100);
  if (amount < 1) return message.reply('❌ الكمية بين 1 و 100.');

  try {
    const deleted = await message.channel.bulkDelete(amount + 1, true);
    const msg = await message.channel.send({ embeds: [new EmbedBuilder()
      .setColor(0x22c55e).setTitle('🗑️ تم المسح')
      .setDescription(`حُذفت **${deleted.size - 1}** رسالة بواسطة ${message.author.username}`)
      .setTimestamp()] });
    setTimeout(() => msg.delete().catch(() => {}), 4000);
  } catch (e) {
    await message.reply(`❌ فشل: \`${e.message}\`\n> ملاحظة: لا يمكن حذف رسائل أقدم من 14 يوم.`);
  }
}

// ====== /lock / /unlock ======
export async function cmdLock(message, args) {
  if (!message.member?.permissions.has('ManageChannels'))
    return message.reply('❌ ما عندك صلاحية ManageChannels.');

  const ch = message.mentions.channels.first() || message.channel;
  const reason = args.slice(2).join(' ') || 'بواسطة المودريشن';

  try {
    await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false }, { reason });
    await message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xef4444).setTitle('🔒 تم قفل الروم')
      .setDescription(`${ch} مقفل الآن.\n**السبب:** ${reason}`)
      .setTimestamp()] });
  } catch (e) {
    await message.reply(`❌ فشل: \`${e.message}\``);
  }
}

export async function cmdUnlock(message, args) {
  if (!message.member?.permissions.has('ManageChannels'))
    return message.reply('❌ ما عندك صلاحية ManageChannels.');

  const ch = message.mentions.channels.first() || message.channel;

  try {
    await ch.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
    await message.reply({ embeds: [new EmbedBuilder()
      .setColor(0x22c55e).setTitle('🔓 تم فتح الروم')
      .setDescription(`${ch} مفتوح الآن.`)
      .setTimestamp()] });
  } catch (e) {
    await message.reply(`❌ فشل: \`${e.message}\``);
  }
}

// ====== /slowmode ======
export async function cmdSlowmode(message, args) {
  if (!message.member?.permissions.has('ManageChannels'))
    return message.reply('❌ ما عندك صلاحية ManageChannels.');

  const seconds = parseInt(args[1]);
  if (isNaN(seconds) || seconds < 0 || seconds > 21600)
    return message.reply('❌ **الاستخدام:** `/slowmode [ثوانٍ]` (0 لإيقاف، الحد الأقصى 21600)');

  try {
    await message.channel.setRateLimitPerUser(seconds);
    await message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xeab308).setTitle('⏱️ Slowmode')
      .setDescription(seconds === 0 ? '✅ تم إيقاف الـ Slowmode.' : `✅ Slowmode مضبوط على **${seconds} ثانية**.`)
      .setTimestamp()] });
  } catch (e) {
    await message.reply(`❌ فشل: \`${e.message}\``);
  }
}

// ====== /nickname ======
export async function cmdNickname(message, args) {
  if (!message.member?.permissions.has('ManageNicknames'))
    return message.reply('❌ ما عندك صلاحية ManageNicknames.');

  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ `/nickname @شخص [الاسم الجديد]`');

  const newNick = args.slice(2).join(' ') || null;
  try {
    await target.setNickname(newNick);
    await message.reply(`✅ تم ${newNick ? `تغيير اسم ${target.user.username} إلى **${newNick}**` : `إزالة لقب ${target.user.username}`}.`);
  } catch (e) {
    await message.reply(`❌ فشل: \`${e.message}\``);
  }
}
