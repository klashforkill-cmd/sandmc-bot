// ====== نظام اللفلات — 100 لفل ======
export const LEVELS = [
  // ── مبتدئ (1-10)
  { level:  1, name: 'Newbie',        emoji: '🥚', min: 0,                    max: 499,                   color: '#6b7280' },
  { level:  2, name: 'Broke',         emoji: '🪨', min: 500,                  max: 1499,                  color: '#64748b' },
  { level:  3, name: 'Starter',       emoji: '🌱', min: 1500,                 max: 3999,                  color: '#4ade80' },
  { level:  4, name: 'Worker',        emoji: '⛏️', min: 4000,                 max: 7999,                  color: '#22c55e' },
  { level:  5, name: 'Grinder',       emoji: '💪', min: 8000,                 max: 14999,                 color: '#16a34a' },
  { level:  6, name: 'Hustler',       emoji: '💼', min: 15000,                max: 24999,                 color: '#15803d' },
  { level:  7, name: 'Earner',        emoji: '📈', min: 25000,                max: 39999,                 color: '#60a5fa' },
  { level:  8, name: 'Investor',      emoji: '💹', min: 40000,                max: 59999,                 color: '#3b82f6' },
  { level:  9, name: 'Trader',        emoji: '🏦', min: 60000,                max: 89999,                 color: '#2563eb' },
  { level: 10, name: 'Merchant',      emoji: '🛍️', min: 90000,                max: 129999,                color: '#1d4ed8' },
  // ── صاعد (11-20)
  { level: 11, name: 'Wealthy',       emoji: '💸', min: 130000,               max: 199999,                color: '#818cf8' },
  { level: 12, name: 'Affluent',      emoji: '💎', min: 200000,               max: 299999,                color: '#6366f1' },
  { level: 13, name: 'Rich',          emoji: '🪙', min: 300000,               max: 449999,                color: '#4f46e5' },
  { level: 14, name: 'Tycoon',        emoji: '🏰', min: 450000,               max: 649999,                color: '#a78bfa' },
  { level: 15, name: 'Mogul',         emoji: '🏯', min: 650000,               max: 999999,                color: '#7c3aed' },
  { level: 16, name: 'Magnate',       emoji: '🗝️', min: 1000000,              max: 1499999,               color: '#6d28d9' },
  { level: 17, name: 'Millionaire',   emoji: '💰', min: 1500000,              max: 2199999,               color: '#fbbf24' },
  { level: 18, name: 'HighRoller',    emoji: '🎰', min: 2200000,              max: 3199999,               color: '#f59e0b' },
  { level: 19, name: 'Plutocrat',     emoji: '🏆', min: 3200000,              max: 4599999,               color: '#d97706' },
  { level: 20, name: 'Elite',         emoji: '👑', min: 4600000,              max: 6499999,               color: '#b45309' },
  // ── متقدم (21-30)
  { level: 21, name: 'Baron',         emoji: '🎖️', min: 6500000,              max: 9499999,               color: '#fb923c' },
  { level: 22, name: 'Count',         emoji: '⚜️', min: 9500000,              max: 13999999,              color: '#f97316' },
  { level: 23, name: 'Duke',          emoji: '🦅', min: 14000000,             max: 19999999,              color: '#ea580c' },
  { level: 24, name: 'Prince',        emoji: '🤴', min: 20000000,             max: 29999999,              color: '#f43f5e' },
  { level: 25, name: 'King',          emoji: '👸', min: 30000000,             max: 44999999,              color: '#e11d48' },
  { level: 26, name: 'Emperor',       emoji: '🔱', min: 45000000,             max: 64999999,              color: '#ef4444' },
  { level: 27, name: 'Overlord',      emoji: '⚔️', min: 65000000,             max: 94999999,              color: '#dc2626' },
  { level: 28, name: 'Warlord',       emoji: '🗡️', min: 95000000,             max: 139999999,             color: '#b91c1c' },
  { level: 29, name: 'Conqueror',     emoji: '🌍', min: 140000000,            max: 199999999,             color: '#ec4899' },
  { level: 30, name: 'Dominator',     emoji: '💥', min: 200000000,            max: 299999999,             color: '#db2777' },
  // ── خبير (31-40)
  { level: 31, name: 'Champion',      emoji: '🥇', min: 300000000,            max: 449999999,             color: '#c026d3' },
  { level: 32, name: 'Master',        emoji: '🎓', min: 450000000,            max: 649999999,             color: '#a21caf' },
  { level: 33, name: 'GrandMaster',   emoji: '🔮', min: 650000000,            max: 999999999,             color: '#86efac' },
  { level: 34, name: 'Legend',        emoji: '🔥', min: 1000000000,           max: 1499999999,            color: '#4ade80' },
  { level: 35, name: 'Mythic',        emoji: '🧬', min: 1500000000,           max: 2199999999,            color: '#2dd4bf' },
  { level: 36, name: 'Immortal',      emoji: '♾️', min: 2200000000,           max: 3199999999,            color: '#22d3ee' },
  { level: 37, name: 'Eternal',       emoji: '🌊', min: 3200000000,           max: 4599999999,            color: '#0ea5e9' },
  { level: 38, name: 'Cosmic',        emoji: '🌌', min: 4600000000,           max: 6599999999,            color: '#0284c7' },
  { level: 39, name: 'Galactic',      emoji: '🌠', min: 6600000000,           max: 9499999999,            color: '#7dd3fc' },
  { level: 40, name: 'Universal',     emoji: '🪐', min: 9500000000,           max: 13999999999,           color: '#38bdf8' },
  // ── أسطوري (41-50)
  { level: 41, name: 'Transcendent',  emoji: '🌈', min: 14000000000,          max: 19999999999,           color: '#a3e635' },
  { level: 42, name: 'Divine',        emoji: '✨', min: 20000000000,          max: 29999999999,           color: '#facc15' },
  { level: 43, name: 'Demigod',       emoji: '⚡', min: 30000000000,          max: 44999999999,           color: '#fbbf24' },
  { level: 44, name: 'Titan',         emoji: '🌋', min: 45000000000,          max: 64999999999,           color: '#f59e0b' },
  { level: 45, name: 'SandKing',      emoji: '💫', min: 65000000000,          max: 94999999999,           color: '#fde68a' },
  { level: 46, name: 'Ascended',      emoji: '🦋', min: 95000000000,          max: 139999999999,          color: '#d946ef' },
  { level: 47, name: 'Omnipotent',    emoji: '🌀', min: 140000000000,         max: 199999999999,          color: '#c084fc' },
  { level: 48, name: 'Infinite',      emoji: '∞',  min: 200000000000,         max: 299999999999,          color: '#818cf8' },
  { level: 49, name: 'Beyond',        emoji: '🔭', min: 300000000000,         max: 449999999999,          color: '#67e8f9' },
  { level: 50, name: 'GOD',           emoji: '🌟', min: 450000000000,         max: 649999999999,          color: '#fbbf24' },
  // ── إلهي (51-60)
  { level: 51, name: 'AbsoluteGOD',  emoji: '🔯', min: 650000000000,          max: 999999999999,          color: '#fef08a' },
  { level: 52, name: 'Omega',        emoji: '🌞', min: 1000000000000,          max: 1499999999999,         color: '#fda4af' },
  { level: 53, name: 'Alpha',        emoji: '🎆', min: 1500000000000,          max: 2199999999999,         color: '#f9a8d4' },
  { level: 54, name: 'Origin',       emoji: '🌐', min: 2200000000000,          max: 3199999999999,         color: '#e879f9' },
  { level: 55, name: 'Primordial',   emoji: '🌑', min: 3200000000000,          max: 4599999999999,         color: '#d946ef' },
  { level: 56, name: 'Celestial',    emoji: '🌙', min: 4600000000000,          max: 6599999999999,         color: '#a855f7' },
  { level: 57, name: 'Nebula',       emoji: '🌀', min: 6600000000000,          max: 9499999999999,         color: '#9333ea' },
  { level: 58, name: 'Supernova',    emoji: '💫', min: 9500000000000,          max: 13999999999999,        color: '#7e22ce' },
  { level: 59, name: 'BlackHole',    emoji: '🕳️', min: 14000000000000,         max: 19999999999999,        color: '#581c87' },
  { level: 60, name: 'DarkMatter',   emoji: '🖤', min: 20000000000000,         max: 29999999999999,        color: '#38bdf8' },
  // ── ما وراء الواقع (61-70)
  { level: 61, name: 'Singularity',  emoji: '🔵', min: 30000000000000,         max: 44999999999999,        color: '#22d3ee' },
  { level: 62, name: 'Multiverse',   emoji: '🌍', min: 45000000000000,         max: 64999999999999,        color: '#2dd4bf' },
  { level: 63, name: 'Paradox',      emoji: '🌀', min: 65000000000000,         max: 94999999999999,        color: '#34d399' },
  { level: 64, name: 'Anomaly',      emoji: '⚗️', min: 95000000000000,         max: 139999999999999,       color: '#6ee7b7' },
  { level: 65, name: 'Void',         emoji: '🌫️', min: 140000000000000,        max: 199999999999999,       color: '#a7f3d0' },
  { level: 66, name: 'Phantom',      emoji: '👻', min: 200000000000000,        max: 299999999999999,       color: '#5eead4' },
  { level: 67, name: 'Specter',      emoji: '🌃', min: 300000000000000,        max: 449999999999999,       color: '#f87171' },
  { level: 68, name: 'Wraith',       emoji: '🌌', min: 450000000000000,        max: 649999999999999,       color: '#60a5fa' },
  { level: 69, name: 'Nether',       emoji: '🧨', min: 650000000000000,        max: 949999999999999,       color: '#818cf8' },
  { level: 70, name: 'Abyss',        emoji: '🌊', min: 950000000000000,        max: 1399999999999999,      color: '#6366f1' },
  // ── النجوم (71-80)
  { level: 71, name: 'Eclipse',      emoji: '🌒', min: 1400000000000000,       max: 1999999999999999,      color: '#fbbf24' },
  { level: 72, name: 'NightFall',    emoji: '🌃', min: 2000000000000000,       max: 2999999999999999,      color: '#fcd34d' },
  { level: 73, name: 'DawnBreaker',  emoji: '🌅', min: 3000000000000000,       max: 4499999999999999,      color: '#fde68a' },
  { level: 74, name: 'Solaris',      emoji: '☀️', min: 4500000000000000,       max: 6499999999999999,      color: '#fffbeb' },
  { level: 75, name: 'Nova',         emoji: '✴️', min: 6500000000000000,       max: 9499999999999999,      color: '#fef3c7' },
  { level: 76, name: 'StarLord',     emoji: '⭐', min: 9500000000000000,       max: 13999999999999999,     color: '#ef4444' },
  { level: 77, name: 'Quasar',       emoji: '🌟', min: 14000000000000000,      max: 19999999999999999,     color: '#dc2626' },
  { level: 78, name: 'Pulsar',       emoji: '💥', min: 20000000000000000,      max: 29999999999999999,     color: '#f97316' },
  { level: 79, name: 'Magnetar',     emoji: '🔴', min: 30000000000000000,      max: 44999999999999999,     color: '#a3a3a3' },
  { level: 80, name: 'Hyperion',     emoji: '🟠', min: 45000000000000000,      max: 64999999999999999,     color: '#84cc16' },
  // ── الإله الأعلى (81-90)
  { level: 81, name: 'Colossus',     emoji: '🗿', min: 65000000000000000,      max: 94999999999999999,     color: '#22c55e' },
  { level: 82, name: 'Behemoth',     emoji: '🦕', min: 95000000000000000,      max: 139999999999999999,    color: '#ef4444' },
  { level: 83, name: 'Leviathan',    emoji: '🐉', min: 140000000000000000,     max: 199999999999999999,    color: '#dc2626' },
  { level: 84, name: 'Apocalypse',   emoji: '☠️', min: 200000000000000000,     max: 299999999999999999,    color: '#b91c1c' },
  { level: 85, name: 'Armageddon',   emoji: '💣', min: 300000000000000000,     max: 449999999999999999,    color: '#7f1d1d' },
  { level: 86, name: 'Destroyer',    emoji: '🌪️', min: 450000000000000000,     max: 649999999999999999,    color: '#fbbf24' },
  { level: 87, name: 'Oblivion',     emoji: '🌑', min: 650000000000000000,     max: 949999999999999999,    color: '#f59e0b' },
  { level: 88, name: 'Reckoning',    emoji: '⚖️', min: 950000000000000000,     max: 1399999999999999999,   color: '#d97706' },
  { level: 89, name: 'Sovereign',    emoji: '🏅', min: 1400000000000000000,    max: 1999999999999999999,   color: '#22d3ee' },
  { level: 90, name: 'Supreme',      emoji: '♛',  min: 2000000000000000000,    max: 2999999999999999999,   color: '#818cf8' },
  // ── ما بعد الوجود (91-100)
  { level: 91, name: 'Absolute',     emoji: '💠', min: 3000000000000000000,    max: 4499999999999999999,   color: '#67e8f9' },
  { level: 92, name: 'Infinite∞',    emoji: '∞',  min: 4500000000000000000,    max: 6999999999999999999,   color: '#a3e635' },
  { level: 93, name: 'Beyond∞',      emoji: '🌌', min: 7000000000000000000,    max: 9999999999999999999,   color: '#facc15' },
  { level: 94, name: 'Eternal∞',     emoji: '🔄', min: 10000000000000000000,   max: 14999999999999999999,  color: '#fde68a' },
  { level: 95, name: 'OmegaGOD',     emoji: '🔰', min: 15000000000000000000,   max: 24999999999999999999,  color: '#fcd34d' },
  { level: 96, name: 'TrueGOD',      emoji: '🌠', min: 25000000000000000000,   max: 49999999999999999999,  color: '#fbbf24' },
  { level: 97, name: 'GodOfGods',    emoji: '👁️', min: 50000000000000000000,   max: 99999999999999999999,  color: '#f59e0b' },
  { level: 98, name: 'Creator',      emoji: '⚡', min: 100000000000000000000,  max: 499999999999999999999, color: '#d97706' },
  { level: 99, name: 'Omniscient',   emoji: '🧿', min: 500000000000000000000,  max: 999999999999999999999, color: '#a78bfa' },
  { level:100, name: 'THE ONE',      emoji: '🌟', min: 1000000000000000000000, max: Infinity,              color: '#fbbf24' },
];


export function getLevel(balance) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (balance >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

// نسبة التقدم للفل التالي (0..1)
function getLevelProgress(balance) {
  const cur = getLevel(balance);
  if (cur.max === Infinity) return 1;
  const range = cur.max - cur.min + 1;
  const progress = (balance - cur.min) / range;
  return Math.min(Math.max(progress, 0), 1);
}


// dynamic import للـ canvas مع fallback
let createCanvas, loadImage;
try {
  const canvasLib = await import('canvas');
  createCanvas = canvasLib.createCanvas;
  loadImage    = canvasLib.loadImage;
} catch {
  createCanvas = null;
  loadImage    = null;
}
import https from 'https';

// جلب صورة من URL كـ Buffer
async function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url.replace('webp', 'png') + '?size=256', (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// رسم مستطيل مستدير
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

// رسم صورة دائرية
function drawCircleImage(ctx, img, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

// ارسم تأثير توهج
function drawGlow(ctx, x, y, r, color) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, color.replace(')', ', 0.4)').replace('rgb', 'rgba'));
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// ===== بطاقة BALANCE =====
export async function renderBalanceCard(username, avatarUrl, balance, rank, totalUsers) {
  const W = 900, H = 280;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── خلفية gradient داكنة فاخرة
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0a0a1a');
  bg.addColorStop(0.5, '#111130');
  bg.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, W, H, 20);
  ctx.fill();

  // ── نجوم خلفية صغيرة
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  for (let i = 0; i < 60; i++) {
    const sx = (i * 137.5) % W;
    const sy = (i * 97.3) % H;
    const sr = 0.5 + (i % 3) * 0.5;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  }

  // ── حد ذهبي متوهج
  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0, '#f59e0b');
  borderGrad.addColorStop(0.5, '#fbbf24');
  borderGrad.addColorStop(1, '#d97706');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2.5;
  roundRect(ctx, 1, 1, W - 2, H - 2, 20);
  ctx.stroke();

  // ── بانيل ناعم للمحتوى
  const panel = ctx.createLinearGradient(0, 0, 0, H);
  panel.addColorStop(0, 'rgba(255,255,255,0.05)');
  panel.addColorStop(1, 'rgba(255,255,255,0.02)');
  ctx.fillStyle = panel;
  roundRect(ctx, 160, 30, W - 190, H - 60, 14);
  ctx.fill();

  // ── توهج ذهبي حول الأفاتار
  drawGlow(ctx, 90, H / 2, 80, 'rgb(245,158,11)');

  // ── الأفاتار
  try {
    const buf = await fetchImage(avatarUrl);
    const img = await loadImage(buf);
    // حلقة ذهبية
    ctx.beginPath();
    ctx.arc(90, H / 2, 56, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();
    drawCircleImage(ctx, img, 90, H / 2, 52);
  } catch {
    // fallback دائرة فارغة
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(90, H / 2, 52, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(username.charAt(0).toUpperCase(), 90, H / 2 + 11);
  }

  // ── اسم المستخدم
  ctx.textAlign = 'left';
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(username, 185, 85);

  // ── شارة SAND MONEY
  const badgeGrad = ctx.createLinearGradient(185, 95, 320, 115);
  badgeGrad.addColorStop(0, '#f59e0b');
  badgeGrad.addColorStop(1, '#d97706');
  ctx.fillStyle = badgeGrad;
  roundRect(ctx, 185, 98, 130, 24, 12);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('💰 SAND MONEY', 250, 114);

  // ── الرصيد الكبير
  ctx.textAlign = 'left';
  ctx.font = 'bold 52px Arial, sans-serif';
  const balGrad = ctx.createLinearGradient(185, 130, 185, 190);
  balGrad.addColorStop(0, '#fbbf24');
  balGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = balGrad;
  ctx.fillText(balance.toLocaleString(), 185, 185);

  // ── وحدة العملة
  ctx.font = '18px Arial';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Sand Money', 185, 210);

  // ── فاصل رأسي
  ctx.strokeStyle = 'rgba(245,158,11,0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(560, 55); ctx.lineTo(560, H - 55); ctx.stroke();

  // ── الرتبة
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('الرتبة', 650, 80);
  ctx.font = 'bold 48px Arial';
  const rankGrad = ctx.createLinearGradient(600, 90, 700, 160);
  rankGrad.addColorStop(0, '#a78bfa');
  rankGrad.addColorStop(1, '#7c3aed');
  ctx.fillStyle = rankGrad;
  ctx.fillText(`#${rank}`, 650, 150);
  ctx.font = '14px Arial';
  ctx.fillStyle = '#475569';
  ctx.fillText(`من ${totalUsers} لاعب`, 650, 175);

  // ── شريط اللفل
  const lvl     = getLevel(balance);
  const nextLvl = LEVELS[lvl.level] || lvl; // اللفل التالي
  const pct     = getLevelProgress(balance);
  const barX = 185, barY = 222, barW = 380, barH = 14;

  // خلفية الشريط
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRect(ctx, barX, barY, barW, barH, 7); ctx.fill();

  // الشريط المملوء بلون اللفل
  const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  fillGrad.addColorStop(0, lvl.color + 'cc');
  fillGrad.addColorStop(1, lvl.color);
  ctx.fillStyle = fillGrad;
  roundRect(ctx, barX, barY, Math.max(barW * pct, barH), barH, 7); ctx.fill();

  // توهج عند نهاية الشريط
  const dotX = barX + barW * pct;
  ctx.shadowColor = lvl.color;
  ctx.shadowBlur  = 10;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(dotX, barY + barH / 2, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = lvl.color;
  ctx.beginPath(); ctx.arc(dotX, barY + barH / 2, 5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // ── اسم اللفل الحالي (يسار)
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px Arial';
  ctx.fillStyle = lvl.color;
  ctx.fillText(`${lvl.emoji} ${lvl.name} · Lv.${lvl.level}`, barX, barY + 32);

  // ── اللفل التالي (يمين)
  if (lvl.max !== Infinity) {
    ctx.textAlign = 'right';
    ctx.font = '12px Arial';
    ctx.fillStyle = '#475569';
    const needed = lvl.max + 1 - balance;
    ctx.fillText(`${needed.toLocaleString()} 💰 للـ ${nextLvl.emoji} ${nextLvl.name}`, barX + barW, barY + 32);
  } else {
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('MAX LEVEL 🌟', barX + barW, barY + 32);
  }

  // ── SandMC watermark
  ctx.textAlign = 'right';
  ctx.font = '12px Arial';
  ctx.fillStyle = 'rgba(148,163,184,0.4)';
  ctx.fillText('SandMC Economy', W - 18, H - 12);

  return canvas.toBuffer('image/png');
}

// ===== بطاقة DAILY =====
export async function renderDailyCard(username, avatarUrl, earned, newBalance, streak) {
  const W = 700, H = 240;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // خلفية خضراء داكنة
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#052e16');
  bg.addColorStop(1, '#064e3b');
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, W, H, 20); ctx.fill();

  // حبيبات ذهبية
  for (let i = 0; i < 25; i++) {
    const px = (i * 191) % W, py = (i * 113) % H;
    ctx.fillStyle = `rgba(251,191,36,${0.05 + (i % 5) * 0.03})`;
    ctx.beginPath(); ctx.arc(px, py, 2 + i % 4, 0, Math.PI * 2); ctx.fill();
  }

  // حد أخضر متوهج
  const border = ctx.createLinearGradient(0, 0, W, H);
  border.addColorStop(0, '#22c55e'); border.addColorStop(1, '#16a34a');
  ctx.strokeStyle = border; ctx.lineWidth = 2.5;
  roundRect(ctx, 1, 1, W - 2, H - 2, 20); ctx.stroke();

  // أفاتار
  try {
    const buf = await fetchImage(avatarUrl);
    const img = await loadImage(buf);
    drawGlow(ctx, 80, H / 2, 70, 'rgb(34,197,94)');
    ctx.beginPath(); ctx.arc(80, H / 2, 50, 0, Math.PI * 2);
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3; ctx.stroke();
    drawCircleImage(ctx, img, 80, H / 2, 46);
  } catch {}

  // اسم
  ctx.textAlign = 'left'; ctx.font = 'bold 22px Arial'; ctx.fillStyle = '#fff';
  ctx.fillText(username, 155, 70);

  // DAILY REWARD شارة
  const dg = ctx.createLinearGradient(155, 78, 310, 100);
  dg.addColorStop(0, '#22c55e'); dg.addColorStop(1, '#16a34a');
  ctx.fillStyle = dg; roundRect(ctx, 155, 80, 150, 22, 11); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
  ctx.fillText('✅ DAILY REWARD', 230, 95);

  // المبلغ المكتسب
  ctx.textAlign = 'left';
  ctx.font = 'bold 56px Arial';
  const eg = ctx.createLinearGradient(155, 105, 155, 170);
  eg.addColorStop(0, '#fbbf24'); eg.addColorStop(1, '#f59e0b');
  ctx.fillStyle = eg;
  ctx.fillText(`+${earned.toLocaleString()}`, 155, 168);
  ctx.font = '16px Arial'; ctx.fillStyle = '#6ee7b7';
  ctx.fillText('Sand Money 💰', 155, 192);

  // فاصل
  ctx.strokeStyle = 'rgba(34,197,94,0.3)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(450, 40); ctx.lineTo(450, H - 40); ctx.stroke();

  // الرصيد الكلي + streak
  ctx.textAlign = 'center';
  ctx.font = '14px Arial'; ctx.fillStyle = '#6ee7b7';
  ctx.fillText('الرصيد الكلي', 570, 70);
  ctx.font = 'bold 34px Arial'; ctx.fillStyle = '#fbbf24';
  ctx.fillText(newBalance.toLocaleString(), 570, 115);
  ctx.font = '13px Arial'; ctx.fillStyle = '#34d399';
  ctx.fillText('🔥 streak: ' + streak + ' يوم', 570, 150);

  ctx.textAlign = 'right'; ctx.font = '11px Arial';
  ctx.fillStyle = 'rgba(148,163,184,0.4)';
  ctx.fillText('SandMC Economy', W - 15, H - 10);

  return canvas.toBuffer('image/png');
}

// ===== بطاقة LEADERBOARD =====
export async function renderLeaderboardCard(entries) {
  // entries: [{rank, username, balance, avatarUrl}]
  const W = 700;
  const rowH = 62;
  const H = 80 + entries.length * rowH + 30;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // خلفية
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0f0f23'); bg.addColorStop(1, '#1a1a35');
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, W, H, 20); ctx.fill();

  // حد ذهبي
  const bord = ctx.createLinearGradient(0, 0, W, H);
  bord.addColorStop(0, '#f59e0b'); bord.addColorStop(1, '#a78bfa');
  ctx.strokeStyle = bord; ctx.lineWidth = 2.5;
  roundRect(ctx, 1, 1, W - 2, H - 2, 20); ctx.stroke();

  // عنوان
  ctx.textAlign = 'center';
  const titleGrad = ctx.createLinearGradient(200, 20, 500, 60);
  titleGrad.addColorStop(0, '#fbbf24'); titleGrad.addColorStop(1, '#a78bfa');
  ctx.fillStyle = titleGrad;
  ctx.font = 'bold 28px Arial';
  ctx.fillText('🏆  أغنى اللاعبين — Sand Money', W / 2, 52);

  const medals = ['🥇', '🥈', '🥉'];
  const rowColors = [
    'rgba(251,191,36,0.12)', // ذهبي
    'rgba(148,163,184,0.08)', // فضي
    'rgba(180,120,60,0.10)',  // برونزي
  ];

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const y = 80 + i * rowH;

    // خلفية الصف
    ctx.fillStyle = rowColors[i] || 'rgba(255,255,255,0.03)';
    roundRect(ctx, 20, y, W - 40, rowH - 6, 10); ctx.fill();

    // رقم الرتبة / ميدالية
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = i < 3 ? ['#fbbf24','#cbd5e1','#d97706'][i] : '#64748b';
    ctx.fillText(medals[i] || `#${i + 1}`, 55, y + rowH / 2 + 8);

    // الأفاتار
    try {
      const buf = await fetchImage(e.avatarUrl);
      const img = await loadImage(buf);
      const cx = 105, cy = y + rowH / 2 - 3;
      ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.strokeStyle = i < 3 ? ['#fbbf24','#cbd5e1','#d97706'][i] : '#334155';
      ctx.lineWidth = 2; ctx.stroke();
      drawCircleImage(ctx, img, cx, cy, 20);
    } catch {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.arc(105, y + rowH/2 - 3, 20, 0, Math.PI*2); ctx.fill();
    }

    // اسم المستخدم
    ctx.textAlign = 'left';
    ctx.font = `${i < 3 ? 'bold' : ''} 20px Arial`;
    ctx.fillStyle = i < 3 ? '#fff' : '#cbd5e1';
    ctx.fillText(e.username, 140, y + rowH / 2 + 7);

    // الرصيد
    ctx.textAlign = 'right';
    ctx.font = 'bold 22px Arial';
    const rg = ctx.createLinearGradient(W - 200, y, W - 30, y + rowH);
    rg.addColorStop(0, '#fbbf24'); rg.addColorStop(1, '#f59e0b');
    ctx.fillStyle = i < 3 ? rg : '#94a3b8';
    ctx.fillText(`${e.balance.toLocaleString()} 💰`, W - 38, y + rowH / 2 + 7);
  }

  // watermark
  ctx.textAlign = 'right'; ctx.font = '11px Arial';
  ctx.fillStyle = 'rgba(148,163,184,0.35)';
  ctx.fillText('SandMC Economy', W - 20, H - 10);

  return canvas.toBuffer('image/png');
}

// ===== بطاقة PAY (تحويل) =====
export async function renderPayCard(fromUser, toUser, amount, fromBalance) {
  const W = 700, H = 220;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0c1445'); bg.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = bg;
  roundRect(ctx, 0, 0, W, H, 20); ctx.fill();

  // حد أرجواني
  const bord = ctx.createLinearGradient(0,0,W,H);
  bord.addColorStop(0,'#a78bfa'); bord.addColorStop(1,'#7c3aed');
  ctx.strokeStyle = bord; ctx.lineWidth = 2.5;
  roundRect(ctx, 1, 1, W-2, H-2, 20); ctx.stroke();

  // أفاتار المُرسِل
  try {
    const buf = await fetchImage(fromUser.avatarUrl);
    const img = await loadImage(buf);
    drawGlow(ctx, 80, H/2, 65, 'rgb(167,139,250)');
    ctx.beginPath(); ctx.arc(80, H/2, 46, 0, Math.PI*2);
    ctx.strokeStyle='#a78bfa'; ctx.lineWidth=2.5; ctx.stroke();
    drawCircleImage(ctx, img, 80, H/2, 43);
  } catch {}

  // أفاتار المُستقبِل
  try {
    const buf = await fetchImage(toUser.avatarUrl);
    const img = await loadImage(buf);
    drawGlow(ctx, W-80, H/2, 65, 'rgb(34,197,94)');
    ctx.beginPath(); ctx.arc(W-80, H/2, 46, 0, Math.PI*2);
    ctx.strokeStyle='#22c55e'; ctx.lineWidth=2.5; ctx.stroke();
    drawCircleImage(ctx, img, W-80, H/2, 43);
  } catch {}

  // سهم التحويل في المنتصف
  ctx.textAlign = 'center';
  ctx.font = 'bold 40px Arial'; ctx.fillStyle = '#fbbf24';
  ctx.fillText('➜', W/2, H/2 + 15);

  // المبلغ
  ctx.font = 'bold 30px Arial';
  const ag = ctx.createLinearGradient(W/2-80, H/2-50, W/2+80, H/2-10);
  ag.addColorStop(0,'#fbbf24'); ag.addColorStop(1,'#f59e0b');
  ctx.fillStyle = ag;
  ctx.fillText(`${amount.toLocaleString()} 💰`, W/2, H/2 - 25);

  // أسماء
  ctx.font = 'bold 16px Arial'; ctx.fillStyle = '#a78bfa';
  ctx.fillText(fromUser.username, 80, H - 42);
  ctx.fillStyle = '#22c55e';
  ctx.fillText(toUser.username, W-80, H - 42);

  // رصيد المُرسِل بعد التحويل
  ctx.font = '13px Arial'; ctx.fillStyle = '#64748b';
  ctx.fillText(`رصيدك: ${fromBalance.toLocaleString()} 💰`, 80, H - 22);

  ctx.textAlign='right'; ctx.font='11px Arial';
  ctx.fillStyle='rgba(148,163,184,0.4)';
  ctx.fillText('SandMC Economy', W-15, H-10);

  return canvas.toBuffer('image/png');
}
