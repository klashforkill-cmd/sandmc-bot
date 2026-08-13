// ====== نظام العملة: Sand Money 💰 (محسّن) ======
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { renderBalanceCard, renderDailyCard, renderLeaderboardCard, renderPayCard } from './cards.js';

const DB_PATH        = './data/economy.json';
const CURRENCY       = 'Sand Money';
const CURRENCY_EMOJI = '💰';
const DAILY_AMOUNT   = 500;
const DAILY_COOLDOWN = 86_400_000; // 24 ساعة

function ensureDir() { if (!existsSync('./data')) mkdirSync('./data', { recursive: true }); }
function loadDB()  { ensureDir(); if (!existsSync(DB_PATH)) return {}; try { return JSON.parse(readFileSync(DB_PATH,'utf8')); } catch { return {}; } }
function saveDB(d) { writeFileSync(DB_PATH, JSON.stringify(d, null, 2)); }
function getUser(db, userId) {
  if (!db[userId]) db[userId] = { balance: 0, lastDaily: 0, streak: 0 };
  if (!('streak' in db[userId])) db[userId].streak = 0;
  return db[userId];
}

// ====== /balance ======
export async function cmdBalance(message, args) {
  const db     = loadDB();
  const target = message.mentions?.users?.first() || message.author;
  const user   = getUser(db, target.id);

  const sorted = Object.entries(db).sort(([,a],[,b]) => b.balance - a.balance);
  const rank   = sorted.findIndex(([id]) => id === target.id) + 1;
  const total  = sorted.length;

  const avatarUrl = target.displayAvatarURL
    ? target.displayAvatarURL({ extension: 'png', size: 256 })
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  try {
    const imgBuf = await renderBalanceCard(
      target.username || target.globalName || 'Player',
      avatarUrl, user.balance, rank || 1, total || 1
    );
    await message.reply({ files: [new AttachmentBuilder(imgBuf, { name: 'balance.png' })] });
  } catch (e) {
    console.error('[balance-card]', e.message);
    await message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xf59e0b).setTitle(`${CURRENCY_EMOJI} رصيد ${target.username}`)
      .addFields(
        { name: 'الرصيد',  value: `**${user.balance.toLocaleString()}** ${CURRENCY}`, inline: true },
        { name: 'الرتبة',  value: `#${rank} من ${total}`,                             inline: true },
        { name: 'الـ streak', value: `🔥 ${user.streak} يوم`,                          inline: true },
      ).setTimestamp()] });
  }
}

// ====== /daily ======
export async function cmdDaily(message) {
  const db   = loadDB();
  const user = getUser(db, message.author.id);
  const now  = Date.now();
  const diff = now - user.lastDaily;

  if (diff < DAILY_COOLDOWN) {
    const remaining = DAILY_COOLDOWN - diff;
    const h = Math.floor(remaining / 3_600_000);
    const m = Math.floor((remaining % 3_600_000) / 60_000);
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xef4444).setTitle('⏰ جرب بعد كم')
      .setDescription(`باقي **${h} ساعة و ${m} دقيقة** على الـ Daily`)
      .setFooter({ text: `streak الحالي: 🔥 ${user.streak} يوم` })
      .setTimestamp()] });
  }

  const dayMs = 86_400_000;
  user.streak = (diff < dayMs * 2) ? (user.streak || 0) + 1 : 1;

  const bonus      = Math.min(user.streak * 50, 500);
  const totalEarned = DAILY_AMOUNT + bonus;
  user.balance    += totalEarned;
  user.lastDaily   = now;
  saveDB(db);

  const avatarUrl = message.author.displayAvatarURL
    ? message.author.displayAvatarURL({ extension: 'png', size: 256 })
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  try {
    const imgBuf = await renderDailyCard(message.author.username, avatarUrl, totalEarned, user.balance, user.streak);
    await message.reply({ files: [new AttachmentBuilder(imgBuf, { name: 'daily.png' })] });
  } catch (e) {
    console.error('[daily-card]', e.message);
    await message.reply({ embeds: [new EmbedBuilder()
      .setColor(0x22c55e).setTitle(`${CURRENCY_EMOJI} Daily مكتسب!`)
      .setDescription(`حصلت على **${totalEarned.toLocaleString()} ${CURRENCY}** ${CURRENCY_EMOJI}`)
      .addFields(
        { name: 'المكسب',     value: `+${totalEarned.toLocaleString()} 💰`, inline: true },
        { name: 'المكافأة',   value: `Streak × 50 = +${bonus} 💰`,          inline: true },
        { name: 'Streak',     value: `🔥 ${user.streak} يوم`,                inline: true },
        { name: 'الرصيد الكلي', value: `${user.balance.toLocaleString()} 💰`, inline: false },
      ).setTimestamp()] });
  }
}

// ====== /pay ======
export async function cmdPay(message, args) {
  const db     = loadDB();
  const target = message.mentions?.users?.first();
  const amount = parseInt(args[2]);

  if (!target || isNaN(amount) || amount <= 0)
    return message.reply('❌ **الاستخدام:** `/pay @شخص المبلغ`');
  if (target.id === message.author.id)
    return message.reply('❌ ما تقدر تحول لنفسك!');
  if (target.bot)
    return message.reply('❌ ما تقدر تحول للبوتات!');

  const sender   = getUser(db, message.author.id);
  if (sender.balance < amount)
    return message.reply(`❌ ما عندك رصيد كافٍ! رصيدك: **${sender.balance.toLocaleString()} ${CURRENCY}**`);

  sender.balance -= amount;
  const receiver = getUser(db, target.id);
  receiver.balance += amount;
  saveDB(db);

  const fromAvatar = message.author.displayAvatarURL?.({ extension:'png', size:256 }) || `https://cdn.discordapp.com/embed/avatars/0.png`;
  const toAvatar   = target.displayAvatarURL?.({ extension:'png', size:256 })          || `https://cdn.discordapp.com/embed/avatars/1.png`;

  try {
    const imgBuf = await renderPayCard(
      { username: message.author.username, avatarUrl: fromAvatar },
      { username: target.username,         avatarUrl: toAvatar   },
      amount, sender.balance
    );
    await message.reply({ files: [new AttachmentBuilder(imgBuf, { name: 'pay.png' })] });
  } catch (e) {
    console.error('[pay-card]', e.message);
    await message.reply({ embeds: [new EmbedBuilder()
      .setColor(0x22c55e).setTitle(`${CURRENCY_EMOJI} تحويل ناجح`)
      .addFields(
        { name: 'من',      value: message.author.username,           inline: true },
        { name: 'إلى',     value: target.username,                   inline: true },
        { name: 'المبلغ',  value: `${amount.toLocaleString()} 💰`,    inline: true },
        { name: 'رصيدك',  value: `${sender.balance.toLocaleString()} 💰`, inline: false },
      ).setTimestamp()] });
  }
}

// ====== /leaderboard ======
export async function cmdLeaderboard(message) {
  const db     = loadDB();
  const sorted = Object.entries(db).sort(([,a],[,b]) => b.balance - a.balance).slice(0, 10);
  if (!sorted.length) return message.reply('ما في بيانات بعد.');

  const entries = await Promise.all(sorted.map(async ([id, data], i) => {
    let username = `User#${id.slice(-4)}`, avatarUrl = `https://cdn.discordapp.com/embed/avatars/${i%6}.png`;
    try {
      const u = await message.client.users.fetch(id);
      username  = u.username || u.globalName || username;
      avatarUrl = u.displayAvatarURL({ extension: 'png', size: 128 });
    } catch {}
    return { rank: i+1, username, balance: data.balance, avatarUrl };
  }));

  try {
    const imgBuf = await renderLeaderboardCard(entries);
    await message.reply({ files: [new AttachmentBuilder(imgBuf, { name: 'leaderboard.png' })] });
  } catch (e) {
    console.error('[lb-card]', e.message);
    const lines = entries.map((e, i) => {
      const m = ['🥇','🥈','🥉'][i] || `**${i+1}.**`;
      return `${m} ${e.username} — **${e.balance.toLocaleString()} ${CURRENCY}**`;
    });
    await message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xf59e0b).setTitle(`${CURRENCY_EMOJI} أغنى اللاعبين`)
      .setDescription(lines.join('\n')).setTimestamp()] });
  }
}

// ====== /addmoney (Admin) ======
export async function cmdAddMoney(message, args) {
  if (!message.member?.permissions.has('Administrator'))
    return message.reply('❌ هذا الأمر للأدمن فقط.');

  const db     = loadDB();
  const target = message.mentions?.users?.first();
  const amount = parseInt(args[2]);
  if (!target || isNaN(amount)) return message.reply('❌ `/addmoney @شخص المبلغ`');

  const user = getUser(db, target.id);
  user.balance += amount;
  if (user.balance < 0) user.balance = 0;
  saveDB(db);

  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(amount >= 0 ? 0x22c55e : 0xef4444)
    .setTitle(amount >= 0 ? '✅ تم إضافة رصيد' : '✅ تم خصم رصيد')
    .addFields(
      { name: 'العضو',       value: target.username,                  inline: true },
      { name: amount >= 0 ? 'المضاف' : 'المخصوم', value: `${Math.abs(amount).toLocaleString()} 💰`, inline: true },
      { name: 'الرصيد الكلي', value: `${user.balance.toLocaleString()} 💰`, inline: true },
    ).setTimestamp()] });
}

// ====== /removemoney (Admin) ======
export async function cmdRemoveMoney(message, args) {
  if (!message.member?.permissions.has('Administrator'))
    return message.reply('❌ هذا الأمر للأدمن فقط.');

  const db     = loadDB();
  const target = message.mentions?.users?.first();
  const amount = parseInt(args[2]);
  if (!target || isNaN(amount) || amount <= 0) return message.reply('❌ `/removemoney @شخص المبلغ`');

  const user = getUser(db, target.id);
  user.balance = Math.max(0, user.balance - amount);
  saveDB(db);

  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0xef4444).setTitle('💸 تم خصم رصيد')
    .addFields(
      { name: 'العضو',        value: target.username,                  inline: true },
      { name: 'المخصوم',      value: `${amount.toLocaleString()} 💰`,    inline: true },
      { name: 'الرصيد المتبقي', value: `${user.balance.toLocaleString()} 💰`, inline: true },
    ).setTimestamp()] });
}

// ====== /rob (سرقة) ======
const robCooldown = new Map();
export async function cmdRob(message, args) {
  const target = message.mentions?.users?.first();
  if (!target)       return message.reply('❌ `/rob @شخص`');
  if (target.bot)    return message.reply('❌ ما تقدر تسرق بوت! 😂');
  if (target.id === message.author.id) return message.reply('❌ ما تقدر تسرق نفسك!');

  const now     = Date.now();
  const coolKey = `rob_${message.author.id}`;
  const cooldown = 300_000; // 5 دقائق
  if (robCooldown.has(coolKey) && now - robCooldown.get(coolKey) < cooldown) {
    const left = Math.ceil((cooldown - (now - robCooldown.get(coolKey))) / 60_000);
    return message.reply(`⏰ لازم تنتظر **${left} دقيقة** قبل ما تسرق مرة ثانية.`);
  }

  const db       = loadDB();
  const thief    = getUser(db, message.author.id);
  const victim   = getUser(db, target.id);

  if (victim.balance < 200)
    return message.reply(`❌ **${target.username}** فقير ما يستاهل السرقة! رصيده أقل من 200 💰 😂`);

  robCooldown.set(coolKey, now);

  const success = Math.random() < 0.45; // 45% نجاح

  if (success) {
    const stolen = Math.floor(victim.balance * (0.05 + Math.random() * 0.15)); // 5-20%
    thief.balance  += stolen;
    victim.balance -= stolen;
    saveDB(db);

    await message.reply({ embeds: [new EmbedBuilder()
      .setColor(0x22c55e).setTitle('💰 سرقة ناجحة!')
      .setDescription(`سرقت من **${target.username}** وهربت بـ **${stolen.toLocaleString()} 💰** 😈`)
      .addFields(
        { name: '💸 المسروق',   value: `${stolen.toLocaleString()} 💰`,        inline: true },
        { name: '💰 رصيدك الآن', value: `${thief.balance.toLocaleString()} 💰`, inline: true },
      ).setTimestamp()] });
  } else {
    const fine = Math.floor(thief.balance * 0.1);
    thief.balance = Math.max(0, thief.balance - fine);
    saveDB(db);

    await message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xef4444).setTitle('🚨 السرقة فشلت!')
      .setDescription(`أمسكوك وهو تحاول تسرق **${target.username}**!\nدفعت غرامة **${fine.toLocaleString()} 💰** 😅`)
      .addFields({ name: '💰 رصيدك الآن', value: `${thief.balance.toLocaleString()} 💰`, inline: true })
      .setTimestamp()] });
  }
}

// ====== /gamble (قمار) ======
const gambleCooldown = new Map();
export async function cmdGamble(message, args) {
  const amount = parseInt(args[1]) || (args[1] === 'all' ? -1 : 0);
  if (!amount || isNaN(amount) && args[1] !== 'all')
    return message.reply('❌ **الاستخدام:** `/gamble [المبلغ]` أو `/gamble all`');

  const db   = loadDB();
  const user = getUser(db, message.author.id);

  const bet = args[1] === 'all' ? user.balance : amount;
  if (bet <= 0)   return message.reply(`❌ رصيدك فاضي! استخدم \`/daily\` أولاً.`);
  if (bet > user.balance) return message.reply(`❌ ما عندك رصيد كافٍ! رصيدك: **${user.balance.toLocaleString()} 💰**`);
  if (bet < 10)   return message.reply('❌ الحد الأدنى للمراهنة هو 10 💰');
  if (bet > 50000) return message.reply('❌ الحد الأقصى لكل مراهنة 50,000 💰');

  const now = Date.now();
  const coolKey = `gamble_${message.author.id}`;
  if (gambleCooldown.has(coolKey) && now - gambleCooldown.get(coolKey) < 10_000) {
    return message.reply('⏰ انتظر 10 ثوانٍ بين كل مراهنة.');
  }
  gambleCooldown.set(coolKey, now);

  const roll = Math.random();
  let multiplier, outcome, emoji;

  if (roll < 0.05)       { multiplier = 5;   outcome = '🎰 JACKPOT!';   emoji = '🏆' }
  else if (roll < 0.20)  { multiplier = 2;   outcome = 'ربحت ×2!';       emoji = '🎉' }
  else if (roll < 0.45)  { multiplier = 1.5; outcome = 'ربحت ×1.5';      emoji = '😊' }
  else                   { multiplier = 0;   outcome = 'خسرت!';          emoji = '😢' }

  const gained = Math.floor(bet * multiplier);
  user.balance = user.balance - bet + gained;
  saveDB(db);

  const netChange = gained - bet;
  const color = netChange > 0 ? 0x22c55e : netChange === 0 ? 0xeab308 : 0xef4444;

  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} ${outcome}`)
    .setDescription(`راهنت بـ **${bet.toLocaleString()} 💰** وحصلت على **${gained.toLocaleString()} 💰**`)
    .addFields(
      { name: netChange >= 0 ? '📈 الربح' : '📉 الخسارة', value: `${netChange >= 0 ? '+' : ''}${netChange.toLocaleString()} 💰`, inline: true },
      { name: '💰 رصيدك الآن', value: `${user.balance.toLocaleString()} 💰`, inline: true },
    )
    .setFooter({ text: `احتمال الـ Jackpot: 5% | ×2: 15% | ×1.5: 25% | خسارة: 55%` })
    .setTimestamp()] });
}

// ====== /deposit / /withdraw (بنك) ======
export async function cmdDeposit(message, args) {
  const db     = loadDB();
  const user   = getUser(db, message.author.id);
  if (!db[message.author.id].bank) db[message.author.id].bank = 0;

  const amount = args[1] === 'all' ? user.balance : parseInt(args[1]);
  if (!amount || isNaN(amount) || amount <= 0)
    return message.reply('❌ `/deposit [المبلغ]` أو `/deposit all`');
  if (amount > user.balance)
    return message.reply(`❌ ما عندك رصيد كافٍ! الكاش الحالي: **${user.balance.toLocaleString()} 💰**`);

  user.balance -= amount;
  db[message.author.id].bank += amount;
  saveDB(db);

  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0x22c55e).setTitle('🏦 إيداع ناجح')
    .addFields(
      { name: 'المودَع',   value: `${amount.toLocaleString()} 💰`,                       inline: true },
      { name: 'الكاش',     value: `${user.balance.toLocaleString()} 💰`,                 inline: true },
      { name: 'في البنك',  value: `${db[message.author.id].bank.toLocaleString()} 💰`,    inline: true },
    ).setTimestamp()] });
}

export async function cmdWithdraw(message, args) {
  const db   = loadDB();
  const user = getUser(db, message.author.id);
  if (!db[message.author.id].bank) db[message.author.id].bank = 0;

  const bank   = db[message.author.id].bank;
  const amount = args[1] === 'all' ? bank : parseInt(args[1]);
  if (!amount || isNaN(amount) || amount <= 0)
    return message.reply('❌ `/withdraw [المبلغ]` أو `/withdraw all`');
  if (amount > bank)
    return message.reply(`❌ ما في رصيد كافٍ في البنك! رصيد البنك: **${bank.toLocaleString()} 💰**`);

  user.balance += amount;
  db[message.author.id].bank -= amount;
  saveDB(db);

  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0x22c55e).setTitle('🏦 سحب ناجح')
    .addFields(
      { name: 'المسحوب',   value: `${amount.toLocaleString()} 💰`,                       inline: true },
      { name: 'الكاش',     value: `${user.balance.toLocaleString()} 💰`,                 inline: true },
      { name: 'في البنك',  value: `${db[message.author.id].bank.toLocaleString()} 💰`,    inline: true },
    ).setTimestamp()] });
}
