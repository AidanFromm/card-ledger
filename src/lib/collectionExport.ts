/**
 * Collection Export Utilities
 * 
 * Export collection as:
 * - Shareable web link (reuses client list infrastructure)
 * - Social media card (canvas-based image)
 * - PDF report (future - requires jspdf)
 */

/**
 * Generate a social media share card as a data URL image.
 * Shows total value, card count, and branding.
 */
export async function generateShareCard(opts: {
  totalValue: number;
  cardCount: number;
  topCards?: { name: string; value: number }[];
  userName?: string;
}): Promise<string> {
  const { totalValue, cardCount, topCards = [], userName } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
  grad.addColorStop(0, '#0a0a0f');
  grad.addColorStop(0.5, '#0d1525');
  grad.addColorStop(1, '#0a0a0f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1080);

  // Accent circle glow
  ctx.save();
  const radGrad = ctx.createRadialGradient(540, 400, 50, 540, 400, 400);
  radGrad.addColorStop(0, 'rgba(0, 116, 251, 0.15)');
  radGrad.addColorStop(1, 'rgba(0, 116, 251, 0)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.restore();

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px "SF Pro Display", -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MY COLLECTION', 540, 180);

  // Subtitle line
  ctx.strokeStyle = 'rgba(0, 116, 251, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(340, 210);
  ctx.lineTo(740, 210);
  ctx.stroke();

  // Total value
  ctx.font = 'bold 96px "SF Pro Display", -apple-system, sans-serif';
  ctx.fillStyle = '#0074fb';
  const valueStr = `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  ctx.fillText(valueStr, 540, 370);

  ctx.font = '28px "SF Pro Display", -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('TOTAL PORTFOLIO VALUE', 540, 420);

  // Card count
  ctx.font = 'bold 64px "SF Pro Display", -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(cardCount), 540, 540);

  ctx.font = '24px "SF Pro Display", -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(cardCount === 1 ? 'CARD' : 'CARDS', 540, 575);

  // Top cards
  if (topCards.length > 0) {
    ctx.font = '20px "SF Pro Display", -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('TOP CARDS', 540, 660);

    const startY = 700;
    topCards.slice(0, 3).forEach((card, i) => {
      ctx.font = '26px "SF Pro Display", -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'left';
      const name = card.name.length > 30 ? card.name.slice(0, 27) + '...' : card.name;
      ctx.fillText(name, 200, startY + i * 50);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#0074fb';
      ctx.fillText(`$${card.value.toLocaleString()}`, 880, startY + i * 50);
    });
  }

  // Branding
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px "SF Pro Display", -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(0, 116, 251, 0.8)';
  ctx.fillText('CardLedger', 540, 980);

  ctx.font = '16px "SF Pro Display", -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('Track • Collect • Profit', 540, 1010);

  return canvas.toDataURL('image/png');
}

/**
 * Download a data URL as a file
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
