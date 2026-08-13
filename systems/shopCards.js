// ====== بطاقة Canvas للمتجر ======
import { createCanvas } from 'canvas';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// أعمدة: 2 لكل صف
export function renderShopCard(items) {
  const COLS = 2;
  const CARD_W = 420, CARD_H = 150;
  const PAD = 24, GAP = 18;
  const rows = Math.ceil(items.length / COLS);
  const W = COLS * CARD_W + (COLS + 1) * GAP + PAD * 2 - GAP;
  const H = 110 + rows * (CARD_H + GAP) + 40;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── خلفية
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#07071a');
  bg.addColorStop(1, '#0f0f2e');
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, W, H, 22); ctx.fill();

  // ── حد ذهبي-بنفسجي
  const bord = ctx.createLinearGradient(0, 0, W, H);
  bord.addColorStop(0, '#f59e0b');
  bord.addColorStop(0.5, '#a78bfa');
  bord.addColorStop(1, '#22c55e');
  ctx.strokeStyle = bord; ctx.lineWidth = 2.5;
  roundRect(ctx, 1, 1, W - 2, H - 2, 22); ctx.stroke();

  // نجوم خلفية
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 80; i++) {
    ctx.beginPath();
    ctx.arc((i * 157) % W, (i * 89) % H, 0.5 + (i % 3) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── عنوان
  const titleGrad = ctx.createLinearGradient(W / 2 - 200, 30, W / 2 + 200, 75);
  titleGrad.addColorStop(0, '#fbbf24');
  titleGrad.addColorStop(0.5, '#a78bfa');
  titleGrad.addColorStop(1, '#22c55e');
  ctx.fillStyle = titleGrad;
  ctx.font = 'bold 38px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🛒  SandMC Store', W / 2, 62);

  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(148,163,184,0.7)';
  ctx.fillText('اكتب  /buy [رقم]  لشراء أي منتج بـ Sand Money 💰', W / 2, 90);

  // ── بطاقات المنتجات
  const categoryColors = {
    rank:  { from: '#7c3aed', to: '#a78bfa', icon: '👑' },
    key:   { from: '#b45309', to: '#f59e0b', icon: '🔑' },
    kit:   { from: '#065f46', to: '#22c55e', icon: '⚔️' },
    boost: { from: '#1e40af', to: '#60a5fa', icon: '⚡' },
  };

  items.forEach((item, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = PAD + col * (CARD_W + GAP);
    const y = 110 + row * (CARD_H + GAP);

    const cat = categoryColors[item.type] || categoryColors.rank;

    // خلفية البطاقة
    const cardBg = ctx.createLinearGradient(x, y, x + CARD_W, y + CARD_H);
    cardBg.addColorStop(0, 'rgba(255,255,255,0.06)');
    cardBg.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = cardBg;
    roundRect(ctx, x, y, CARD_W, CARD_H, 14); ctx.fill();

    // شريط جانبي ملوّن
    const stripe = ctx.createLinearGradient(x, y, x, y + CARD_H);
    stripe.addColorStop(0, cat.from);
    stripe.addColorStop(1, cat.to);
    ctx.fillStyle = stripe;
    roundRect(ctx, x, y, 6, CARD_H, 3); ctx.fill();

    // حد البطاقة
    ctx.strokeStyle = `${cat.from}55`;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, CARD_W, CARD_H, 14); ctx.stroke();

    // رقم المنتج
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`#${item.id}`, x + CARD_W - 14, y + 22);

    // أيقونة + اسم
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${cat.icon}  ${item.name}`, x + 20, y + 42);

    // وصف قصير
    ctx.font = '14px Arial';
    ctx.fillStyle = '#94a3b8';
    const desc = item.desc.length > 55 ? item.desc.slice(0, 52) + '...' : item.desc;
    ctx.fillText(desc, x + 20, y + 68);

    // شريط فاصل
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 14, y + 82); ctx.lineTo(x + CARD_W - 14, y + 82); ctx.stroke();

    // السعر
    const priceGrad = ctx.createLinearGradient(x + 14, y + 90, x + 160, y + 120);
    priceGrad.addColorStop(0, '#fbbf24'); priceGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = priceGrad;
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`${item.price.toLocaleString()} 💰`, x + 20, y + 122);

    // تاج للمنتجات المميزة
    if (item.featured) {
      const tagGrad = ctx.createLinearGradient(x + CARD_W - 100, y + 88, x + CARD_W - 14, y + 108);
      tagGrad.addColorStop(0, '#f59e0b'); tagGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = tagGrad;
      roundRect(ctx, x + CARD_W - 105, y + 90, 91, 28, 14); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
      ctx.fillText('⭐ مميز', x + CARD_W - 59, y + 109);
    }
    ctx.textAlign = 'left';
  });

  // watermark
  ctx.textAlign = 'center';
  ctx.font = '12px Arial';
  ctx.fillStyle = 'rgba(148,163,184,0.3)';
  ctx.fillText('SandMC Store  •  Sand Money Economy', W / 2, H - 12);

  return canvas.toBuffer('image/png');
}

// ── بطاقة إشعار الشراء للأدمن
export function renderPurchaseCard(buyerName, itemName, price, mcName) {
  const W = 650, H = 200;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#052e16'); bg.addColorStop(1, '#14532d');
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, W, H, 18); ctx.fill();

  const bord = ctx.createLinearGradient(0, 0, W, H);
  bord.addColorStop(0, '#22c55e'); bord.addColorStop(1, '#16a34a');
  ctx.strokeStyle = bord; ctx.lineWidth = 2.5;
  roundRect(ctx, 1, 1, W - 2, H - 2, 18); ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = 'bold 26px Arial'; ctx.fillStyle = '#22c55e';
  ctx.fillText('🛒 طلب شراء جديد!', W / 2, 48);

  ctx.textAlign = 'left';
  const fields = [
    ['👤 مشتري الديسكورد', buyerName],
    ['⛏️ اسمه في Minecraft', mcName || 'لم يُحدد'],
    ['🛍️ المنتج', itemName],
    ['💰 المبلغ المدفوع', `${price.toLocaleString()} Sand Money`],
  ];
  fields.forEach(([label, val], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 30 + col * 310, y = 85 + row * 50;
    ctx.font = '13px Arial'; ctx.fillStyle = '#6ee7b7';
    ctx.fillText(label, x, y);
    ctx.font = 'bold 17px Arial'; ctx.fillStyle = '#fff';
    ctx.fillText(val, x, y + 22);
  });

  ctx.textAlign = 'center';
  ctx.font = '13px Arial'; ctx.fillStyle = 'rgba(34,197,94,0.6)';
  ctx.fillText('استخدم /deliver لتأكيد الاستلام', W / 2, H - 14);

  return canvas.toBuffer('image/png');
}
