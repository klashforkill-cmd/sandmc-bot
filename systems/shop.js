// ====== نظام المتجر ======
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { renderShopCard, renderPurchaseCard } from './shopCards.js';

const DB_PATH      = './data/economy.json';
const ORDERS_PATH  = './data/orders.json';
const ADMIN_NOTIF_CHANNEL = '1537251040322392125'; // روم إشعار الإدارة

// ── قائمة المنتجات
export const SHOP_ITEMS = [
  // رتب Discord/SandMC
  { id: 1,  name: 'VIP',        type: 'rank', price: 2000,  desc: 'رتبة VIP في الديسكورد والسيرفر',      featured: false },
  { id: 2,  name: 'MVP',        type: 'rank', price: 4000,  desc: 'رتبة MVP مع مزايا حصرية',             featured: true  },
  { id: 3,  name: 'Elite',      type: 'rank', price: 7000,  desc: 'رتبة Elite — أقوى رتبة متاحة',        featured: true  },
  { id: 4,  name: 'SandMC',     type: 'rank', price: 10000, desc: 'الرتبة الرسمية لأعضاء SandMC',        featured: true  },
  // مفاتيح
  { id: 5,  name: 'Gear Key',   type: 'key',  price: 800,   desc: 'مفتاح صندوق Gear النادر',             featured: false },
  { id: 6,  name: 'KOTH Key',   type: 'key',  price: 1200,  desc: 'مفتاح KOTH — جوائز حصرية',           featured: false },
  { id: 7,  name: 'SandMC Key', type: 'key',  price: 1500,  desc: 'مفتاح SandMC الخاص بالسيرفر',        featured: true  },
  { id: 8,  name: 'AFK Key',    type: 'key',  price: 600,   desc: 'مفتاح AFK للمكافآت الليلية',          featured: false },
  { id: 9,  name: 'Media Key',  type: 'key',  price: 900,   desc: 'مفتاح Media للمحتوى الحصري',          featured: false },
  // كيتات
  { id: 10, name: 'Kit 1',      type: 'kit',  price: 1000,  desc: 'حزمة أدوات البداية الأساسية',         featured: false },
  { id: 11, name: 'Kit 2',      type: 'kit',  price: 2500,  desc: 'حزمة أدوات متقدمة مع سلاح نادر',     featured: true  },
];

// ── قاعدة البيانات
function loadDB()     { if (!existsSync(DB_PATH))     return {}; try { return JSON.parse(readFileSync(DB_PATH,     'utf8')); } catch { return {}; } }
function saveDB(d)    { writeFileSync(DB_PATH,     JSON.stringify(d, null, 2)); }
function loadOrders() { if (!existsSync(ORDERS_PATH)) return []; try { return JSON.parse(readFileSync(ORDERS_PATH,  'utf8')); } catch { return []; } }
function saveOrders(d){ writeFileSync(ORDERS_PATH, JSON.stringify(d, null, 2)); }

function getUser(db, id) {
  if (!db[id]) db[id] = { balance: 0, lastDaily: 0, streak: 0 };
  return db[id];
}

// ====== /shop ======
export async function cmdShop(message) {
  try {
    const imgBuf = renderShopCard(SHOP_ITEMS);
    const att = new AttachmentBuilder(imgBuf, { name: 'shop.png' });
    await message.reply({ files: [att] });
  } catch (e) {
    console.error('[shop-card]', e.message);
    // fallback نصي
    const lines = SHOP_ITEMS.map(i => `\`#${i.id}\` **${i.name}** — ${i.price.toLocaleString()} 💰\n> ${i.desc}`).join('\n');
    await message.reply({ embeds: [new EmbedBuilder().setColor(0xf59e0b).setTitle('🛒 SandMC Store').setDescription(lines)] });
  }
}

// ====== /buy [id] [mc_name] ======
export async function cmdBuy(message, args) {
  const itemId  = parseInt(args[1]);
  const mcName  = args.slice(2).join(' ') || null;
  const item    = SHOP_ITEMS.find(i => i.id === itemId);

  if (!item) {
    return message.reply(`❌ رقم منتج غلط. اكتب \`/shop\` لرؤية الأرقام.`);
  }

  const db   = loadDB();
  const user = getUser(db, message.author.id);

  if (user.balance < item.price) {
    const need = item.price - user.balance;
    return message.reply({ embeds: [new EmbedBuilder()
      .setColor(0xef4444)
      .setTitle('❌ رصيد غير كافٍ')
      .setDescription(`تحتاج **${need.toLocaleString()} 💰** إضافية.\nرصيدك الحالي: **${user.balance.toLocaleString()} 💰**\n\nاجمع المزيد عبر \`/daily\` يومياً!`)
      .setTimestamp()] });
  }

  // خصم الرصيد
  user.balance -= item.price;
  saveDB(db);

  // حفظ الطلب
  const orders = loadOrders();
  const orderId = orders.length + 1;
  const order = {
    id: orderId,
    userId: message.author.id,
    username: message.author.username,
    mcName: mcName || 'غير محدد',
    itemId: item.id,
    itemName: item.name,
    price: item.price,
    status: 'pending',
    at: Date.now(),
  };
  orders.push(order);
  saveOrders(orders);

  // ── رد على المشتري
  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle('✅ تم الشراء بنجاح!')
    .setDescription([
      `اشتريت **${item.name}** بـ **${item.price.toLocaleString()} 💰**`,
      `رصيدك المتبقي: **${user.balance.toLocaleString()} 💰**`,
      '',
      '> 📩 **اذهب إلى الديسكورد وافتح تكت مع الإدارة لاستلام منتجك!**',
      `> رقم طلبك: \`#${orderId}\``,
    ].join('\n'))
    .addFields(
      { name: '🛍️ المنتج', value: item.name, inline: true },
      { name: '⛏️ اسم MC', value: mcName || 'لم تحدد — اذكره في التكت', inline: true },
      { name: '📋 رقم الطلب', value: `#${orderId}`, inline: true },
    )
    .setTimestamp()] });

  // ── إشعار روم الإدارة
  try {
    const adminCh = message.client.channels.cache.get(ADMIN_NOTIF_CHANNEL);
    if (adminCh) {
      const imgBuf = renderPurchaseCard(message.author.username, item.name, item.price, mcName || '—');
      const att = new AttachmentBuilder(imgBuf, { name: 'order.png' });
      await adminCh.send({
        content: `🔔 **طلب جديد #${orderId}** | <@${message.author.id}>`,
        files: [att],
        embeds: [new EmbedBuilder()
          .setColor(0x22c55e)
          .addFields(
            { name: 'Discord', value: `<@${message.author.id}>`, inline: true },
            { name: 'Minecraft', value: mcName || 'لم يحدد', inline: true },
            { name: 'المنتج', value: item.name, inline: true },
            { name: 'المبلغ', value: `${item.price.toLocaleString()} 💰`, inline: true },
            { name: 'الحالة', value: '⏳ قيد الانتظار', inline: true },
          )
          .setFooter({ text: `استخدم /deliver ${orderId} لتأكيد الاستلام` })
          .setTimestamp()],
      });
    }
  } catch (e) {
    console.error('[shop-notif]', e.message);
  }
}

// ====== /deliver [order_id] — للأدمن ======
export async function cmdDeliver(message, args) {
  if (!message.member?.permissions.has('Administrator'))
    return message.reply('❌ هذا الأمر للأدمن فقط.');

  const orderId = parseInt(args[1]);
  if (isNaN(orderId)) return message.reply('❌ `/deliver [رقم_الطلب]`');

  const orders = loadOrders();
  const order  = orders.find(o => o.id === orderId);
  if (!order)          return message.reply(`❌ الطلب #${orderId} غير موجود.`);
  if (order.status === 'delivered') return message.reply(`⚠️ الطلب #${orderId} تم تسليمه مسبقاً.`);

  order.status = 'delivered';
  order.deliveredBy = message.author.id;
  order.deliveredAt = Date.now();
  saveOrders(orders);

  // إشعار المشتري
  try {
    const buyer = await message.client.users.fetch(order.userId);
    await buyer.send({ embeds: [new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle('📦 تم تسليم طلبك!')
      .setDescription(`تم تسليم **${order.itemName}** ✅\nرقم طلبك: \`#${orderId}\`\n\nشكراً لدعمك SandMC! 🎮`)
      .setTimestamp()] }).catch(() => {});
  } catch {}

  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0x22c55e)
    .setTitle(`✅ تم تسليم الطلب #${orderId}`)
    .addFields(
      { name: 'المشتري', value: order.username, inline: true },
      { name: 'المنتج',  value: order.itemName,  inline: true },
      { name: 'MC',      value: order.mcName,    inline: true },
    ).setTimestamp()] });
}

// ====== /orders — للأدمن ======
export async function cmdOrders(message, args) {
  if (!message.member?.permissions.has('Administrator'))
    return message.reply('❌ هذا الأمر للأدمن فقط.');

  const orders  = loadOrders();
  const pending = orders.filter(o => o.status === 'pending');
  if (!pending.length) return message.reply('✅ ما في طلبات معلقة.');

  const lines = pending.map(o =>
    `\`#${o.id}\` **${o.itemName}** — ${o.username} (MC: ${o.mcName})`
  ).join('\n');

  await message.reply({ embeds: [new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle(`📋 الطلبات المعلقة (${pending.length})`)
    .setDescription(lines)
    .setFooter({ text: 'استخدم /deliver [رقم] للتسليم' })
    .setTimestamp()] });
}
