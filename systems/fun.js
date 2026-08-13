// ====== أوامر الترفيه ======
import { EmbedBuilder } from 'discord.js';

// ====== /poll ======
export async function cmdPoll(message, args) {
  // /poll السؤال | خيار1 | خيار2 | خيار3
  const full = args.slice(1).join('|').replace(/^[\|\s]+/, '');
  const parts = full.split('|').map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) {
    return message.reply('❌ الاستخدام: `/poll السؤال | خيار1 | خيار2`\nمثال: `/poll وش أحسن؟ | Minecraft | Roblox`');
  }

  const [question, ...options] = parts;
  if (options.length < 2) return message.reply('❌ لازم يكون فيه خيارين على الأقل.');
  if (options.length > 10) return message.reply('❌ الحد الأقصى 10 خيارات.');

  const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
  const lines = options.map((o, i) => `${emojis[i]} ${o}`).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0x6366f1)
    .setTitle(`📊 ${question}`)
    .setDescription(lines)
    .setFooter({ text: `بواسطة ${message.author.username}` })
    .setTimestamp();

  const pollMsg = await message.channel.send({ embeds: [embed] });
  for (let i = 0; i < options.length; i++) {
    await pollMsg.react(emojis[i]);
  }
  await message.delete().catch(() => {});
}

// ====== /giveaway ======
const activeGiveaways = new Map();

export async function cmdGiveaway(message, args) {
  if (!message.member?.permissions.has('ManageGuild')) return message.reply('❌ هذا الأمر للمشرفين فقط.');
  // /giveaway الدقائق عدد_الفائزين الجائزة
  const minutes = parseInt(args[1]);
  const winners = parseInt(args[2]);
  const prize = args.slice(3).join(' ');

  if (!minutes || !winners || !prize) {
    return message.reply('❌ الاستخدام: `/giveaway الدقائق عدد_الفائزين الجائزة`\nمثال: `/giveaway 10 1 سكن نادر`');
  }

  const endsAt = Date.now() + minutes * 60_000;

  const embed = new EmbedBuilder()
    .setColor(0xa855f7)
    .setTitle('🎉 GIVEAWAY!')
    .setDescription(`**${prize}**\n\nاضغط 🎉 للمشاركة!`)
    .addFields(
      { name: '⏳ ينتهي بعد', value: `${minutes} دقيقة`, inline: true },
      { name: '🏆 عدد الفائزين', value: `${winners}`, inline: true },
      { name: '👤 بواسطة', value: message.author.username, inline: true },
    )
    .setFooter({ text: 'ينتهي' })
    .setTimestamp(endsAt);

  const gwMsg = await message.channel.send({ embeds: [embed] });
  await gwMsg.react('🎉');
  await message.delete().catch(() => {});

  // حفظ الـ Giveaway
  activeGiveaways.set(gwMsg.id, { channelId: message.channel.id, winners, prize, messageId: gwMsg.id });

  setTimeout(async () => {
    try {
      // جيب الرسالة من Discord مباشرة (مش من الـ cache)
      const msg = await message.channel.messages.fetch(gwMsg.id, { force: true });

      // جيب الـ reaction بعد fetch كامل
      const reaction = msg.reactions.cache.get('🎉') ?? msg.reactions.resolve('🎉');
      let entries = [];

      if (reaction) {
        // fetch جميع المشاركين من Discord مباشرة
        await reaction.fetch();
        const users = await reaction.users.fetch({ limit: 100 });
        entries = [...users.values()].filter(u => !u.bot);
      }

      if (!entries.length) {
        const nooneEmbed = new EmbedBuilder()
          .setColor(0xef4444)
          .setTitle('😢 انتهى الـ Giveaway بدون فائز!')
          .setDescription(`**${prize}**\n\nما حد شارك في الـ Giveaway`)
          .setTimestamp();
        return message.channel.send({ embeds: [nooneEmbed] });
      }

      const selected = [];
      const pool = [...entries];
      for (let i = 0; i < Math.min(winners, pool.length); i++) {
        const idx = Math.floor(Math.random() * pool.length);
        selected.push(pool.splice(idx, 1)[0]);
      }
      const mentions = selected.map(u => `<@${u.id}>`).join(', ');

      // حدّث رسالة الـ Giveaway الأصلية
      await msg.edit({ embeds: [new EmbedBuilder()
        .setColor(0x22c55e)
        .setTitle('🏆 انتهى الـ Giveaway!')
        .setDescription(`**${prize}**\n\n🎉 الفائز: ${mentions}`)
        .addFields({ name: '👤 بواسطة', value: message.author.username, inline: true })
        .setFooter({ text: 'انتهى' })
        .setTimestamp()] }).catch(() => {});

      await message.channel.send({
        content: `🎉 مبروك ${mentions}! فزت بـ **${prize}**`,
        embeds: [new EmbedBuilder()
          .setColor(0xa855f7)
          .setTitle('🏆 الفائزون في الـ Giveaway!')
          .setDescription(`**${prize}**\n\nالفائزون: ${mentions}`)
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
  if (!message.member?.permissions.has('ManageGuild')) return message.reply('❌ هذا الأمر للمشرفين فقط.');
  const text = args.slice(1).join(' ');
  if (!text) return message.reply('❌ `/announce النص`');

  const embed = new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle('📢 إعلان')
    .setDescription(text)
    .setFooter({ text: `بواسطة ${message.author.username}` })
    .setTimestamp();

  await message.channel.send({ content: '@everyone', embeds: [embed] });
  await message.delete().catch(() => {});
}
