// ====== نظام الاختصارات ======
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { EmbedBuilder } from 'discord.js';

const ALIASES_PATH = './data/aliases.json';

function load() {
  if (!existsSync(ALIASES_PATH)) return {};
  try { return JSON.parse(readFileSync(ALIASES_PATH, 'utf8')); } catch { return {}; }
}

function save(data) { writeFileSync(ALIASES_PATH, JSON.stringify(data, null, 2)); }

// تحقق إذا الاختصار يطابق رسالة ويرجع الأمر الحقيقي
export function resolveAlias(guildId, text) {
  const db = load();
  const guild = db[guildId] || {};
  const prefix = text.split(' ')[0].toLowerCase();
  // ابحث عن اختصار يطابق بادئة الرسالة
  for (const [alias, command] of Object.entries(guild)) {
    if (prefix === alias.toLowerCase()) {
      // استبدل الاختصار بالأمر الحقيقي، وأبقي باقي الكلمات
      const rest = text.slice(prefix.length).trim();
      return rest ? `${command} ${rest}` : command;
    }
  }
  return null;
}

// /alias add الاختصار الأمر
export async function cmdAliasAdd(message, args) {
  if (!message.member?.permissions.has('ManageGuild')) return message.reply('❌ هذا الأمر للمشرفين فقط.');
  const alias = args[2]?.toLowerCase();
  const command = args.slice(3).join(' ');
  if (!alias || !command) return message.reply('❌ الاستخدام: `/alias add الاختصار الأمر`\nمثال: `/alias add k /kick`');

  const db = load();
  if (!db[message.guild.id]) db[message.guild.id] = {};
  db[message.guild.id][alias] = command;
  save(db);

  const tip = !command.startsWith('/') && command !== 'mc' && command !== 'ip'
    ? `\n> 💡 تلميح: إذا كان الأمر Slash، أضف \`/\` في البداية مثلاً \`/balance\`` : '';

  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle('✅ تم إضافة الاختصار')
    .setDescription(`الآن اكتب \`${alias}\` وسيُنفّذ تلقائياً \`${command}\`${tip}`)
    .addFields(
      { name: 'الاختصار', value: `\`${alias}\``, inline: true },
      { name: 'ينفذ', value: `\`${command}\``, inline: true },
    ).setTimestamp()] });
}

// /alias remove الاختصار
export async function cmdAliasRemove(message, args) {
  if (!message.member?.permissions.has('ManageGuild')) return message.reply('❌ هذا الأمر للمشرفين فقط.');
  const alias = args[2]?.toLowerCase();
  if (!alias) return message.reply('❌ `/alias remove الاختصار`');

  const db = load();
  if (!db[message.guild.id]?.[alias]) return message.reply(`❌ الاختصار \`${alias}\` ما يوجد.`);

  delete db[message.guild.id][alias];
  save(db);
  await message.reply(`✅ تم حذف الاختصار \`${alias}\`.`);
}

// /alias list
export async function cmdAliasList(message) {
  const db = load();
  const guild = db[message.guild.id] || {};
  const entries = Object.entries(guild);
  if (!entries.length) return message.reply('📋 ما في اختصارات مضافة بعد.');

  const lines = entries.map(([a, c]) => `\`${a}\` → \`${c}\``).join('\n');
  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0x6366f1)
    .setTitle('📋 قائمة الاختصارات')
    .setDescription(lines)
    .setTimestamp()] });
}
