// ====== نظام العملة: Sand Money 💰 ======
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { renderBalanceCard, renderDailyCard, renderLeaderboardCard, renderPayCard } from './cards.js';

const DB_PATH = './data/economy.json';
const CURRENCY = 'Sand Money';
const CURRENCY_EMOJI = '💰';
const DAILY_AMOUNT = 500;
const DAILY_COOLDOWN = 86_400_000;

function loadDB() {
  if (!existsSync(DB_PATH)) return {};
  try { return JSON.parse(readFileSync(DB_PATH, 'utf8')); } catch { return {}; }
}
function saveDB(db) { writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
function getUser(db, userId) {
  if (!db[userId]) db[userId] = { balance: 0, lastDaily: 0, streak: 0 };
  if (!db[userId].streak) db[userId].streak = 0;
  return db[userId];
}

// ====== /balance ======
export async function cmdBalance(message, args) {
  const db = loadDB();
  const target = message.mentions?.users?.first() || message.author;
  const user = getUser(db, target.id);

  // احسب الرتبة
  const sorted = Object.entries(db).sort(([,a],[,b]) => b.balance - a.balance);
  const rank = sorted.findIndex(([id]) => id === target.id) + 1;
  const total = sorted.length;

  const avatarUrl = target.displayAvatarURL
    ? target.displayAvatarURL({ extension: 'png', size: 256 })
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  try {
    const imgBuf = await renderBalanceCard(
      target.username || target.globalName || 'Player',
      avatarUrl,
      user.balance,
      rank || 1,
      total || 1
    );
    const attachment = new AttachmentBuilder(imgBuf, { name: 'balance.png' });
    await message.reply({ files: [attachment] });
  } catch (e) {
    console.error('[balance-card]', e.message);
    // fallback embed
    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle(`${CURRENCY_EMOJI} رصيد ${target.username}`)
      .addFields({ name: 'الرصيد', value: `**${user.balance.toLocaleString()}** ${CURRENCY}`, inline: true })
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  }
}

// ====== /daily ======
export async function cmdDaily(message) {
  const db = loadDB();
  const user = getUser(db, message.author.id);
  const now = Date.now();
  const diff = now - user.lastDaily;

  if (diff < DAILY_COOLDOWN) {
    const remaining = DAILY_COOLDOWN - diff;
    const h = Math.floor(remaining / 3_600_000);
    const m = Math.floor((remaining % 3_600_000) / 60_000);
    const embed = new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle('⏰ ما جاء وقت الـ Daily')
      .setDescription(`جرب بعد **${h} ساعة ${m} دقيقة**`)
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  }

  // streak — إذا مضى يوم كامل من آخر مرة (ليس أكثر من يومين)
  const dayMs = 86_400_000;
  if (diff < dayMs * 2) {
    user.streak = (user.streak || 0) + 1;
  } else {
    user.streak = 1;
  }

  // مكافأة streak
  const bonus = Math.min(user.streak * 50, 500);
  const totalEarned = DAILY_AMOUNT + bonus;
  user.balance += totalEarned;
  user.lastDaily = now;
  saveDB(db);

  const avatarUrl = message.author.displayAvatarURL
    ? message.author.displayAvatarURL({ extension: 'png', size: 256 })
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  try {
    const imgBuf = await renderDailyCard(
      message.author.username,
      avatarUrl,
      totalEarned,
      user.balance,
      user.streak
    );
    const attachment = new AttachmentBuilder(imgBuf, { name: 'daily.png' });
    await message.reply({ files: [attachment] });
  } catch (e) {
    console.error('[daily-card]', e.message);
    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle(`${CURRENCY_EMOJI} Daily!`)
      .setDescription(`حصلت على **${totalEarned.toLocaleString()} ${CURRENCY}** ${CURRENCY_EMOJI}\nرصيدك: **${user.balance.toLocaleString()}**`)
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  }
}

// ====== /pay ======
export async function cmdPay(message, args) {
  const db = loadDB();
  const target = message.mentions?.users?.first();
  const amount = parseInt(args[2]);

  if (!target || isNaN(amount) || amount <= 0)
    return message.reply('❌ الاستخدام: `/pay @شخص المبلغ`');
  if (target.id === message.author.id)
    return message.reply('❌ ما تقدر تحول لنفسك!');

  const sender = getUser(db, message.author.id);
  if (sender.balance < amount)
    return message.reply(`❌ ما عندك رصيد كافي! رصيدك: **${sender.balance.toLocaleString()} ${CURRENCY}**`);

  sender.balance -= amount;
  const receiver = getUser(db, target.id);
  receiver.balance += amount;
  saveDB(db);

  const fromAvatar = message.author.displayAvatarURL
    ? message.author.displayAvatarURL({ extension: 'png', size: 256 })
    : `https://cdn.discordapp.com/embed/avatars/0.png`;
  const toAvatar = target.displayAvatarURL
    ? target.displayAvatarURL({ extension: 'png', size: 256 })
    : `https://cdn.discordapp.com/embed/avatars/1.png`;

  try {
    const imgBuf = await renderPayCard(
      { username: message.author.username, avatarUrl: fromAvatar },
      { username: target.username, avatarUrl: toAvatar },
      amount,
      sender.balance
    );
    const attachment = new AttachmentBuilder(imgBuf, { name: 'pay.png' });
    await message.reply({ files: [attachment] });
  } catch (e) {
    console.error('[pay-card]', e.message);
    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle(`${CURRENCY_EMOJI} تحويل ناجح`)
      .addFields(
        { name: 'من', value: message.author.username, inline: true },
        { name: 'إلى', value: target.username, inline: true },
        { name: 'المبلغ', value: `**${amount.toLocaleString()} ${CURRENCY}**`, inline: true }
      ).setTimestamp();
    await message.reply({ embeds: [embed] });
  }
}

// ====== /leaderboard ======
export async function cmdLeaderboard(message) {
  const db = loadDB();
  const sorted = Object.entries(db)
    .sort(([,a],[,b]) => b.balance - a.balance)
    .slice(0, 10);

  if (!sorted.length) return message.reply('ما في بيانات بعد.');

  // جمع بيانات اللاعبين
  const entries = await Promise.all(sorted.map(async ([id, data], i) => {
    let username = `User#${id.slice(-4)}`;
    let avatarUrl = `https://cdn.discordapp.com/embed/avatars/${i % 6}.png`;
    try {
      const u = await message.client.users.fetch(id);
      username = u.username || u.globalName || username;
      avatarUrl = u.displayAvatarURL({ extension: 'png', size: 128 });
    } catch {}
    return { rank: i + 1, username, balance: data.balance, avatarUrl };
  }));

  try {
    const imgBuf = await renderLeaderboardCard(entries);
    const attachment = new AttachmentBuilder(imgBuf, { name: 'leaderboard.png' });
    await message.reply({ files: [attachment] });
  } catch (e) {
    console.error('[lb-card]', e.message);
    const lines = entries.map((e, i) => {
      const m = ['🥇','🥈','🥉'][i] || `**${i+1}.**`;
      return `${m} ${e.username} — **${e.balance.toLocaleString()} ${CURRENCY}**`;
    });
    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle(`${CURRENCY_EMOJI} أغنى اللاعبين`)
      .setDescription(lines.join('\n'))
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  }
}

// ====== /addmoney (Admin) ======
export async function cmdAddMoney(message, args) {
  if (!message.member?.permissions.has('Administrator'))
    return message.reply('❌ هذا الأمر للأدمن فقط.');
  const db = loadDB();
  const target = message.mentions?.users?.first();
  const amount = parseInt(args[2]);
  if (!target || isNaN(amount)) return message.reply('❌ `/addmoney @شخص المبلغ`');
  const user = getUser(db, target.id);
  user.balance += amount;
  saveDB(db);
  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle('✅ تم إضافة رصيد')
    .addFields(
      { name: 'العضو', value: target.username, inline: true },
      { name: 'المضاف', value: `${amount.toLocaleString()} 💰`, inline: true },
      { name: 'الرصيد الكلي', value: `${user.balance.toLocaleString()} 💰`, inline: true }
    ).setTimestamp()] });
}
