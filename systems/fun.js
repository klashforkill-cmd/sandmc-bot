// ====== أوامر الترفيه (محسّنة) ======
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// ====== /poll ======
export async function cmdPoll(message, args) {
  // /poll السؤال | خيار1 | خيار2 | ...
  const full = args.slice(1).join(' ').replace(/^\|?\s*/, '');
  const parts = full.split('|').map(s => s.trim()).filter(Boolean);

  if (parts.length < 2) {
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xef4444).setTitle('❌ خطأ في الاستخدام')
      .setDescription('**الصح:** `/poll السؤال | خيار1 | خيار2 | خيار3`\n**مثال:** `/poll وش أحسن؟ | Minecraft | Roblox | Fortnite`')
      .setTimestamp()] });
  }

  const [question, ...options] = parts;

  if (options.length < 2) return message.reply('❌ لازم يكون فيه خيارين على الأقل.');
  if (options.length > 9) return message.reply('❌ الحد الأقصى 9 خيارات.');

  const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
  const lines = options.map((o, i) => `${emojis[i]} **${o}**`).join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(0x6366f1)
    .setTitle(`📊 ${question}`)
    .setDescription(lines)
    .addFields(
      { name: '📍 كيف تصوت؟', value: 'اضغط على الإيموجي المقابل تحت الرسالة', inline: false }
    )
    .setFooter({ text: `بواسطة ${message.author.username} • اضغط للتصويت` })
    .setTimestamp();

  const pollMsg = await message.channel.send({ embeds: [embed] });
  for (let i = 0; i < options.length; i++) {
    await pollMsg.react(emojis[i]).catch(() => {});
  }
  await message.delete().catch(() => {});
}

// ====== /giveaway ======
const activeGiveaways = new Map();

export async function cmdGiveaway(message, args) {
  if (!message.member?.permissions.has('ManageGuild'))
    return message.reply('❌ هذا الأمر للمشرفين فقط.');

  const minutes = parseInt(args[1]);
  const winners = parseInt(args[2]);
  const prize   = args.slice(3).join(' ');

  if (!minutes || !winners || !prize || minutes < 1 || winners < 1) {
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xef4444).setTitle('❌ خطأ')
      .setDescription('**الاستخدام:** `/giveaway الدقائق عدد_الفائزين الجائزة`\n**مثال:** `/giveaway 60 2 رانك VIP + 5000 💰`')
      .setTimestamp()] });
  }

  const endsAt = Date.now() + minutes * 60_000;
  const durationText = minutes < 60
    ? `${minutes} دقيقة`
    : minutes < 1440
    ? `${(minutes/60).toFixed(1)} ساعة`
    : `${(minutes/1440).toFixed(1)} يوم`;

  const embed = new EmbedBuilder()
    .setColor(0xa855f7)
    .setTitle('🎉 GIVEAWAY!')
    .setDescription(`## ${prize}\n\nاضغط 🎉 للمشاركة في السحب!`)
    .addFields(
      { name: '⏳ ينتهي خلال', value: durationText,          inline: true },
      { name: '🏆 الفائزون',    value: `${winners} شخص`,      inline: true },
      { name: '👤 بواسطة',      value: message.author.username, inline: true },
      { name: '📅 وقت الانتهاء', value: `<t:${Math.floor(endsAt/1000)}:R>`, inline: true },
    )
    .setFooter({ text: '• اضغط 🎉 للمشاركة •' })
    .setTimestamp(endsAt);

  const gwMsg = await message.channel.send({ embeds: [embed] });
  await gwMsg.react('🎉');
  await message.delete().catch(() => {});

  activeGiveaways.set(gwMsg.id, {
    channelId: message.channel.id, winners, prize,
    messageId: gwMsg.id, by: message.author.username
  });

  setTimeout(async () => {
    try {
      const msg = await message.channel.messages.fetch(gwMsg.id, { force: true });
      const reaction = msg.reactions.cache.get('🎉') ?? msg.reactions.resolve('🎉');
      let entries = [];

      if (reaction) {
        await reaction.fetch();
        const users = await reaction.users.fetch({ limit: 100 });
        entries = [...users.values()].filter(u => !u.bot);
      }

      if (!entries.length) {
        await msg.edit({ embeds: [new EmbedBuilder()
          .setColor(0xef4444).setTitle('😢 انتهى الـ Giveaway')
          .setDescription(`**${prize}**\n\nللأسف ما حد شارك في الـ Giveaway 😢`)
          .setTimestamp()] }).catch(() => {});
        return message.channel.send({ embeds: [new EmbedBuilder()
          .setColor(0xef4444).setTitle('😢 انتهى بدون فائز!')
          .setDescription(`ما في فائز للجائزة: **${prize}**`)
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
        .addFields(
          { name: '👤 بواسطة',      value: message.author.username, inline: true },
          { name: '👥 المشاركون',   value: `${entries.length} شخص`,  inline: true },
        )
        .setFooter({ text: 'انتهى' }).setTimestamp()] }).catch(() => {});

      await message.channel.send({
        content: `🎉 مبروك ${mentions}! فزتوا بـ **${prize}** 🎉`,
        embeds: [new EmbedBuilder()
          .setColor(0xa855f7).setTitle('🏆 الفائزون!')
          .setDescription(`**${prize}**\n\n🥇 ${mentions}`)
          .setTimestamp()]
      });
    } catch (e) {
      console.error('[giveaway-error]', e.message);
    }
    activeGiveaways.delete(gwMsg.id);
  }, minutes * 60_000);
}

// ====== /announce ======
export async function cmdAnnounce(message, args) {
  if (!message.member?.permissions.has('ManageGuild'))
    return message.reply('❌ هذا الأمر للمشرفين فقط.');

  const text = args.slice(1).join(' ');
  if (!text) return message.reply('❌ **الاستخدام:** `/announce النص`');

  const embed = new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle('📢 إعلان رسمي')
    .setDescription(text)
    .setThumbnail(message.guild?.iconURL() || null)
    .setFooter({ text: `بواسطة ${message.author.username} • ${message.guild?.name || ''}` })
    .setTimestamp();

  await message.channel.send({ content: '@everyone', embeds: [embed] });
  await message.delete().catch(() => {});
}

// ====== /embed (إنشاء embed مخصص) ======
export async function cmdEmbed(message, args) {
  if (!message.member?.permissions.has('ManageMessages'))
    return message.reply('❌ ما عندك صلاحية ManageMessages.');

  // /embed title:العنوان | desc:الوصف | color:الكود | image:رابط
  const raw = args.slice(1).join(' ');
  const titleMatch = raw.match(/title:([^|]+)/i);
  const descMatch  = raw.match(/desc:([^|]+)/i);
  const colorMatch = raw.match(/color:#?([0-9a-fA-F]{6})/i);
  const imageMatch = raw.match(/image:(https?:\/\/[^\s|]+)/i);

  if (!titleMatch && !descMatch) {
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0x6366f1).setTitle('📝 كيفية استخدام /embed')
      .setDescription([
        '`/embed title:العنوان | desc:الوصف | color:#HEX | image:URL`',
        '',
        '**مثال:**',
        '`/embed title:مرحباً | desc:أهلاً بالجميع | color:#6366f1`',
      ].join('\n'))
      .setTimestamp()] });
  }

  const embed = new EmbedBuilder().setTimestamp();
  if (titleMatch) embed.setTitle(titleMatch[1].trim());
  if (descMatch)  embed.setDescription(descMatch[1].trim());
  if (colorMatch) embed.setColor(parseInt(colorMatch[1], 16));
  else            embed.setColor(0x6366f1);
  if (imageMatch) embed.setImage(imageMatch[1].trim());
  embed.setFooter({ text: `بواسطة ${message.author.username}` });

  await message.channel.send({ embeds: [embed] });
  await message.delete().catch(() => {});
}

// ====== /say ======
export async function cmdSay(message, args) {
  if (!message.member?.permissions.has('ManageMessages'))
    return message.reply('❌ ما عندك صلاحية.');

  const text = args.slice(1).join(' ');
  if (!text) return message.reply('❌ `/say النص`');

  await message.channel.send(text);
  await message.delete().catch(() => {});
}

// ====== /userinfo ======
export async function cmdUserInfo(message, args) {
  const target = message.mentions.members?.first() || message.member;
  if (!target) return message.reply('❌ `/userinfo [@شخص]`');

  const user = target.user;
  const roles = target.roles.cache
    .filter(r => r.id !== message.guild?.id)
    .sort((a, b) => b.position - a.position)
    .map(r => `<@&${r.id}>`)
    .slice(0, 10);

  const embed = new EmbedBuilder()
    .setColor(target.displayHexColor || 0x6366f1)
    .setTitle(`👤 معلومات ${user.username}`)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: '🏷️ الاسم الكامل', value: `${user.username}`, inline: true },
      { name: '🆔 الـ ID',         value: `\`${user.id}\``,   inline: true },
      { name: '🤖 بوت؟',           value: user.bot ? 'نعم' : 'لا', inline: true },
      { name: '📅 تاريخ إنشاء الحساب', value: `<t:${Math.floor(user.createdTimestamp/1000)}:D>`, inline: true },
      { name: '📅 تاريخ الانضمام',  value: target.joinedAt ? `<t:${Math.floor(target.joinedTimestamp/1000)}:D>` : 'غير معروف', inline: true },
      { name: '🎭 الأدوار',         value: roles.length ? roles.join(' ') : 'لا أدوار', inline: false },
    )
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}

// ====== /serverinfo ======
export async function cmdServerInfo(message) {
  const guild = message.guild;
  if (!guild) return message.reply('❌ هذا الأمر في السيرفر فقط.');

  const online  = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
  const bots    = guild.members.cache.filter(m => m.user.bot).size;
  const channels = guild.channels.cache;

  const embed = new EmbedBuilder()
    .setColor(0x6366f1)
    .setTitle(`📊 معلومات ${guild.name}`)
    .setThumbnail(guild.iconURL() || null)
    .addFields(
      { name: '👑 المالك',         value: `<@${guild.ownerId}>`,                    inline: true },
      { name: '🆔 الـ ID',          value: `\`${guild.id}\``,                        inline: true },
      { name: '📅 تاريخ الإنشاء',   value: `<t:${Math.floor(guild.createdTimestamp/1000)}:D>`, inline: true },
      { name: '👥 الأعضاء',         value: `${guild.memberCount} (🤖 ${bots} بوت)`,  inline: true },
      { name: '💬 القنوات',          value: `${channels.size} قناة`,                 inline: true },
      { name: '🎭 الأدوار',          value: `${guild.roles.cache.size} دور`,          inline: true },
      { name: '😀 الإيموجيز',        value: `${guild.emojis.cache.size}`,              inline: true },
      { name: '🔒 التحقق',           value: `${guild.verificationLevel}`,              inline: true },
    )
    .setImage(guild.bannerURL() || null)
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
