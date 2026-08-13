// ====== أوامر المودريشن ======
import { EmbedBuilder } from 'discord.js';

function modEmbed(color, title, fields) {
  return new EmbedBuilder().setColor(color).setTitle(title).addFields(fields).setTimestamp();
}

// ====== /kick ======
export async function cmdKick(message, args) {
  if (!message.member?.permissions.has('KickMembers')) return message.reply('❌ ما عندك صلاحية Kick.');
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ منشن الشخص: `/kick @شخص السبب`');
  const reason = args.slice(2).join(' ') || 'بدون سبب';
  try {
    await target.kick(reason);
    await message.reply({ embeds: [modEmbed(0xf97316, '👢 تم الطرد', [
      { name: 'العضو', value: target.user.username, inline: true },
      { name: 'السبب', value: reason, inline: true },
      { name: 'بواسطة', value: message.author.username, inline: true },
    ])] });
  } catch (e) {
    await message.reply(`❌ فشل: ${e.message}`);
  }
}

// ====== /ban ======
export async function cmdBan(message, args) {
  if (!message.member?.permissions.has('BanMembers')) return message.reply('❌ ما عندك صلاحية Ban.');
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ منشن الشخص: `/ban @شخص السبب`');
  const reason = args.slice(2).join(' ') || 'بدون سبب';
  try {
    await target.ban({ reason });
    await message.reply({ embeds: [modEmbed(0xef4444, '🔨 تم الحظر', [
      { name: 'العضو', value: target.user.username, inline: true },
      { name: 'السبب', value: reason, inline: true },
      { name: 'بواسطة', value: message.author.username, inline: true },
    ])] });
  } catch (e) {
    await message.reply(`❌ فشل: ${e.message}`);
  }
}

// ====== /unban ======
export async function cmdUnban(message, args) {
  if (!message.member?.permissions.has('BanMembers')) return message.reply('❌ ما عندك صلاحية.');
  const userId = args[1];
  if (!userId) return message.reply('❌ `/unban USER_ID`');
  try {
    await message.guild.members.unban(userId);
    await message.reply(`✅ تم رفع الحظر عن ID: \`${userId}\``);
  } catch (e) {
    await message.reply(`❌ فشل: ${e.message}`);
  }
}

// ====== /mute (Timeout) ======
export async function cmdMute(message, args) {
  if (!message.member?.permissions.has('ModerateMembers')) return message.reply('❌ ما عندك صلاحية Mute.');
  const target = message.mentions.members.first();
  const minutes = parseInt(args[2]) || 10;
  if (!target) return message.reply('❌ `/mute @شخص الدقائق السبب`');
  const reason = args.slice(3).join(' ') || 'بدون سبب';
  try {
    await target.timeout(minutes * 60_000, reason);
    await message.reply({ embeds: [modEmbed(0xeab308, '🔇 تم الكتم', [
      { name: 'العضو', value: target.user.username, inline: true },
      { name: 'المدة', value: `${minutes} دقيقة`, inline: true },
      { name: 'السبب', value: reason, inline: true },
    ])] });
  } catch (e) {
    await message.reply(`❌ فشل: ${e.message}`);
  }
}

// ====== /unmute ======
export async function cmdUnmute(message, args) {
  if (!message.member?.permissions.has('ModerateMembers')) return message.reply('❌ ما عندك صلاحية.');
  const target = message.mentions.members.first();
  if (!target) return message.reply('❌ `/unmute @شخص`');
  try {
    await target.timeout(null);
    await message.reply(`✅ تم رفع الكتم عن ${target.user.username}`);
  } catch (e) {
    await message.reply(`❌ فشل: ${e.message}`);
  }
}

// ====== /warn ======
import { readFileSync, writeFileSync, existsSync } from 'fs';
const WARNS_PATH = './data/warns.json';
function loadWarns() {
  if (!existsSync(WARNS_PATH)) return {};
  try { return JSON.parse(readFileSync(WARNS_PATH, 'utf8')); } catch { return {}; }
}
function saveWarns(w) { writeFileSync(WARNS_PATH, JSON.stringify(w, null, 2)); }

export async function cmdWarn(message, args) {
  if (!message.member?.permissions.has('ModerateMembers')) return message.reply('❌ ما عندك صلاحية.');
  const target = message.mentions.users.first();
  if (!target) return message.reply('❌ `/warn @شخص السبب`');
  const reason = args.slice(2).join(' ') || 'بدون سبب';
  const warns = loadWarns();
  if (!warns[target.id]) warns[target.id] = [];
  warns[target.id].push({ reason, by: message.author.id, at: Date.now() });
  saveWarns(warns);
  const count = warns[target.id].length;
  await message.reply({ embeds: [modEmbed(0xf59e0b, `⚠️ تحذير #${count}`, [
    { name: 'العضو', value: target.username, inline: true },
    { name: 'السبب', value: reason, inline: true },
    { name: 'إجمالي التحذيرات', value: `${count}`, inline: true },
  ])] });
}

export async function cmdWarns(message, args) {
  const target = message.mentions.users.first() || message.author;
  const warns = loadWarns();
  const list = warns[target.id] || [];
  if (!list.length) return message.reply(`✅ ${target.username} ما عنده تحذيرات.`);
  const lines = list.map((w, i) => `**${i + 1}.** ${w.reason}`).join('\n');
  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0xf59e0b).setTitle(`⚠️ تحذيرات ${target.username}`)
    .setDescription(lines).setTimestamp()] });
}

// ====== /clear ======
export async function cmdClear(message, args) {
  if (!message.member?.permissions.has('ManageMessages')) return message.reply('❌ ما عندك صلاحية.');
  const amount = Math.min(parseInt(args[1]) || 10, 100);
  try {
    const deleted = await message.channel.bulkDelete(amount + 1, true);
    const m = await message.channel.send(`✅ تم حذف **${deleted.size - 1}** رسالة.`);
    setTimeout(() => m.delete().catch(() => {}), 3000);
  } catch (e) {
    await message.reply(`❌ فشل: ${e.message}`);
  }
}
