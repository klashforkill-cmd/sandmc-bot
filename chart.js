import { createCanvas } from 'canvas';

/**
 * يرسم صورة (Sparkline + شريط اللاق) لحالة استقرار اللاق في السيرفر.
 * @param {number[]} history مصفوفة من قيم اللاق (ms) بترتيب زمني
 * @param {number} currentMs آخر قيمة لاق
 * @param {string} motd نص MOTD لعرضه في أعلى الصورة
 * @returns {Buffer} صورة PNG
 */
export function renderLatencyImage(history, currentMs, motd = '') {
  const W = 900;
  const H = 320;
  const padX = 40;
  const padTop = 96;
  const padBottom = 46;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // خلفية داكنة أنيقة
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(1, '#1e293b');
  ctx.fillStyle = bg;
  ctx.roundRect(0, 0, W, H, 18);
  ctx.fill();

  // إطار
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 2;
  ctx.roundRect(0, 0, W, H, 18);
  ctx.stroke();

  // العنوان
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ استقرار اللاق (Ping Stability)', W / 2, 40);

  // MOTD
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText(motd.slice(0, 60), W / 2, 66);

  // قيمة اللاق الحالية
  const msTxt = `${Math.round(currentMs)} ms`;
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(msTxt, W - padX, 60);

  // منطقة الرسم
  const chartY = padTop;
  const chartH = H - padTop - padBottom;

  // شبكة أفقية
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = chartY + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(W - padX, y);
    ctx.stroke();
  }

  // خطوط المحور الزمني
  ctx.fillStyle = '#64748b';
  ctx.font = '12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('الآن', W - padX - 20, H - padBottom + 22);

  let maxV = Math.max(...history, 20);
  maxV = Math.max(maxV, currentMs, 20);
  const minV = Math.min(...history, 0);

  const n = history.length;
  const plotW = W - padX * 2;
  const xAt = (i) => padX + (i / Math.max(n - 1, 1)) * plotW;
  const yAt = (v) => chartY + chartH - ((v - minV) / Math.max(maxV - minV, 1)) * chartH;

  // تعبئة تحت المنحنى
  ctx.beginPath();
  ctx.moveTo(xAt(0), chartY + chartH);
  for (let i = 0; i < n; i++) {
    ctx.lineTo(xAt(i), yAt(history[i]));
  }
  ctx.lineTo(xAt(n - 1), chartY + chartH);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
  grad.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
  grad.addColorStop(1, 'rgba(34, 211, 238, 0.02)');
  ctx.fillStyle = grad;
  ctx.fill();

  // خط اللاق
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const x = xAt(i);
    const y = yAt(history[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // نقاط البيانات - تشفير حسب الجودة
  for (let i = 0; i < n; i++) {
    const v = history[i];
    const x = xAt(i);
    const y = yAt(v);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    if (v <= 80) ctx.fillStyle = '#22c55e';
    else if (v <= 180) ctx.fillStyle = '#eab308';
    else ctx.fillStyle = '#ef4444';
    ctx.fill();
  }

  // شريط الحالة السفلي
  const barW = plotW;
  const barH = 8;
  const barY = H - padBottom + 8;
  const barGrad = ctx.createLinearGradient(padX, 0, padX + barW, 0);
  barGrad.addColorStop(0, '#22c55e');
  barGrad.addColorStop(0.5, '#eab308');
  barGrad.addColorStop(1, '#ef4444');
  ctx.fillStyle = barGrad;
  ctx.beginPath();
  ctx.roundRect(padX, barY, barW, barH, 4);
  ctx.fill();

  // مؤشر اللاق الحالي على الشريط
  const ratio = Math.min(Math.max(currentMs / maxV, 0), 1);
  const markerX = padX + ratio * barW;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(markerX, barY + barH / 2, 5, 0, Math.PI * 2);
  ctx.fill();

  // تسميات المحور الطولي
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${maxV}ms`, 6, chartY + 6);
  ctx.fillText(`${minV}ms`, 6, chartY + chartH);

  return canvas.toBuffer('image/png');
}