import { SlabConfig, GradingCompany, PSA_LABEL_COLORS, BGS_LABEL_COLORS, CGC_LABEL_COLORS, SGC_LABEL_COLORS, PSA_GRADE_NAMES, BGS_GRADE_NAMES, SGC_GRADE_NAMES, BGSSubgrades, CGCSubgrades } from './types';

interface GenerateOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
}

/**
 * Generates a slab image as a Blob
 * This utility creates the SVG string directly and converts to image
 */
export async function generateSlabImage(
  config: SlabConfig,
  options: GenerateOptions = {}
): Promise<Blob | null> {
  const { width = 300, height = 450, format = 'png', quality = 0.95 } = options;

  const svgString = generateSlabSVG(config, width, height);
  
  return svgToBlob(svgString, width, height, format, quality);
}

/**
 * Generates a slab image as a data URL
 */
export async function generateSlabDataURL(
  config: SlabConfig,
  options: GenerateOptions = {}
): Promise<string | null> {
  const blob = await generateSlabImage(config, options);
  if (!blob) return null;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

/**
 * Downloads the slab image
 */
export async function downloadSlabImage(
  config: SlabConfig,
  filename: string = 'slab',
  options: GenerateOptions = {}
): Promise<boolean> {
  const blob = await generateSlabImage(config, options);
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${options.format || 'png'}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return true;
}

// Helper: Convert SVG string to Blob
async function svgToBlob(
  svgString: string,
  width: number,
  height: number,
  format: 'png' | 'jpeg',
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const canvas = document.createElement('canvas');
    canvas.width = width * 2; // 2x resolution
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      URL.revokeObjectURL(url);
      resolve(null);
      return;
    }

    ctx.scale(2, 2);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => resolve(blob),
        `image/${format}`,
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

// Generate SVG string based on grading company
function generateSlabSVG(config: SlabConfig, width: number, height: number): string {
  switch (config.gradingCompany) {
    case 'PSA':
      return generatePSASVG(config, width, height);
    case 'BGS':
      return generateBGSSVG(config, width, height);
    case 'CGC':
      return generateCGCSVG(config, width, height);
    case 'SGC':
      return generateSGCSVG(config, width, height);
    default:
      return generatePSASVG(config, width, height);
  }
}

// PSA SVG Generator
function generatePSASVG(config: SlabConfig, width: number, height: number): string {
  const colors = PSA_LABEL_COLORS[config.grade] || PSA_LABEL_COLORS['9'];
  const gradeName = PSA_GRADE_NAMES[config.grade] || config.grade;
  
  const labelHeight = height * 0.22;
  const cardWindowY = labelHeight + 8;
  const cardWindowHeight = height - labelHeight - 24;
  const cardWindowWidth = width - 24;
  const cardWindowX = 12;
  
  const isGemMint = config.grade === '10';

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="slabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="50%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </linearGradient>
        <clipPath id="cardClip">
          <rect x="${cardWindowX + 4}" y="${cardWindowY + 4}" width="${cardWindowWidth - 8}" height="${cardWindowHeight - 8}" rx="2"/>
        </clipPath>
      </defs>
      
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="url(#slabGradient)" stroke="#94a3b8" stroke-width="1"/>
      <rect x="4" y="4" width="${width - 8}" height="${height - 8}" rx="6" fill="none" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="8" y="8" width="${width - 16}" height="${labelHeight}" rx="4" fill="${colors.background}"/>
      
      <text x="16" y="36" font-size="24" font-weight="bold" fill="${colors.text}" font-family="Arial Black">PSA</text>
      <text x="16" y="50" font-size="7" fill="${colors.text}" opacity="0.9">PROFESSIONAL SPORTS AUTHENTICATOR</text>
      
      <circle cx="${width - 36}" cy="44" r="24" fill="${isGemMint ? colors.accent : colors.text}" stroke="${colors.text}" stroke-width="2"/>
      <text x="${width - 36}" y="${config.grade.length > 2 ? 42 : 48}" font-size="${config.grade.length > 2 ? 12 : 18}" font-weight="bold" fill="${isGemMint ? '#1e3a8a' : colors.background}" text-anchor="middle" font-family="Arial Black">${config.grade}</text>
      
      <text x="16" y="${labelHeight - 14}" font-size="9" fill="${colors.text}" font-weight="bold">${config.year ? config.year + ' ' : ''}${config.setName}</text>
      <text x="16" y="${labelHeight - 2}" font-size="10" fill="${colors.text}" font-weight="bold">${truncate(config.cardName, 30)}</text>
      
      <rect x="${cardWindowX}" y="${cardWindowY}" width="${cardWindowWidth}" height="${cardWindowHeight}" rx="4" fill="#1a1a1a"/>
      <image x="${cardWindowX + 4}" y="${cardWindowY + 4}" width="${cardWindowWidth - 8}" height="${cardWindowHeight - 8}" href="${config.cardImage}" preserveAspectRatio="xMidYMid meet" clip-path="url(#cardClip)"/>
      <rect x="${cardWindowX}" y="${cardWindowY}" width="${cardWindowWidth}" height="${cardWindowHeight}" rx="4" fill="none" stroke="#374151" stroke-width="2"/>
      
      <text x="${width / 2}" y="${height - 6}" font-size="8" fill="#64748b" text-anchor="middle" font-family="monospace">Cert #${config.certNumber}</text>
    </svg>
  `;
}

// BGS SVG Generator
function generateBGSSVG(config: SlabConfig, width: number, height: number): string {
  const colors = BGS_LABEL_COLORS[config.grade] || BGS_LABEL_COLORS['9'];
  const gradeName = BGS_GRADE_NAMES[config.grade] || config.grade;
  
  const isPristine = config.grade === '10';
  const isGemMint = config.grade === '9.5';
  const labelStyle = isPristine ? 'black' : isGemMint ? 'gold' : 'silver';
  
  const labelHeight = height * 0.26;
  const cardWindowY = labelHeight + 8;
  const cardWindowHeight = height - labelHeight - 24;
  const cardWindowWidth = width - 24;
  const cardWindowX = 12;

  const labelFill = labelStyle === 'black' ? '#0f0f0f' : labelStyle === 'gold' ? '#b8860b' : '#e5e7eb';
  const textFill = labelStyle === 'silver' ? '#1f2937' : '#ffffff';
  const subgrades = config.subgrades as BGSSubgrades;

  let subgradesSection = '';
  if (subgrades) {
    subgradesSection = `
      <rect x="${width - 80}" y="56" width="64" height="40" rx="2" fill="${labelStyle === 'silver' ? '#f3f4f6' : 'rgba(255,255,255,0.1)'}"/>
      <text x="${width - 74}" y="64" font-size="6" fill="${labelStyle === 'silver' ? '#374151' : '#e5e7eb'}">C</text>
      <text x="${width - 22}" y="64" font-size="6" font-weight="bold" fill="${textFill}" text-anchor="end">${subgrades.centering.toFixed(1)}</text>
      <text x="${width - 74}" y="72" font-size="6" fill="${labelStyle === 'silver' ? '#374151' : '#e5e7eb'}">E</text>
      <text x="${width - 22}" y="72" font-size="6" font-weight="bold" fill="${textFill}" text-anchor="end">${subgrades.edges.toFixed(1)}</text>
      <text x="${width - 74}" y="80" font-size="6" fill="${labelStyle === 'silver' ? '#374151' : '#e5e7eb'}">Co</text>
      <text x="${width - 22}" y="80" font-size="6" font-weight="bold" fill="${textFill}" text-anchor="end">${subgrades.corners.toFixed(1)}</text>
      <text x="${width - 74}" y="88" font-size="6" fill="${labelStyle === 'silver' ? '#374151' : '#e5e7eb'}">S</text>
      <text x="${width - 22}" y="88" font-size="6" font-weight="bold" fill="${textFill}" text-anchor="end">${subgrades.surface.toFixed(1)}</text>
    `;
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgsSlabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f1f5f9"/>
          <stop offset="50%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </linearGradient>
        <clipPath id="bgsCardClip">
          <rect x="${cardWindowX + 4}" y="${cardWindowY + 4}" width="${cardWindowWidth - 8}" height="${cardWindowHeight - 8}" rx="2"/>
        </clipPath>
      </defs>
      
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="url(#bgsSlabGradient)" stroke="#94a3b8" stroke-width="1"/>
      <rect x="4" y="4" width="${width - 8}" height="${height - 8}" rx="6" fill="none" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="8" y="8" width="${width - 16}" height="${labelHeight}" rx="4" fill="${labelFill}"/>
      
      <text x="16" y="30" font-size="16" font-weight="bold" fill="${textFill}" font-family="Arial Black" letter-spacing="1">BECKETT</text>
      <text x="16" y="42" font-size="7" fill="${labelStyle === 'silver' ? '#374151' : '#e5e7eb'}">GRADING SERVICES</text>
      
      <rect x="${width - 80}" y="12" width="64" height="40" rx="4" fill="${labelStyle === 'black' ? '#fbbf24' : '#1f2937'}"/>
      <text x="${width - 48}" y="40" font-size="22" font-weight="bold" fill="${labelStyle === 'black' ? '#000000' : '#ffffff'}" text-anchor="middle" font-family="Arial Black">${config.grade}</text>
      
      ${subgradesSection}
      
      <text x="16" y="${labelHeight - 18}" font-size="8" fill="${labelStyle === 'silver' ? '#374151' : '#e5e7eb'}">${config.year ? config.year + ' ' : ''}${config.setName}</text>
      <text x="16" y="${labelHeight - 6}" font-size="9" fill="${textFill}" font-weight="bold">${truncate(config.cardName, 25)}</text>
      
      <rect x="${cardWindowX}" y="${cardWindowY}" width="${cardWindowWidth}" height="${cardWindowHeight}" rx="4" fill="#1a1a1a"/>
      <image x="${cardWindowX + 4}" y="${cardWindowY + 4}" width="${cardWindowWidth - 8}" height="${cardWindowHeight - 8}" href="${config.cardImage}" preserveAspectRatio="xMidYMid meet" clip-path="url(#bgsCardClip)"/>
      <rect x="${cardWindowX}" y="${cardWindowY}" width="${cardWindowWidth}" height="${cardWindowHeight}" rx="4" fill="none" stroke="#374151" stroke-width="2"/>
      
      <text x="${width / 2}" y="${height - 6}" font-size="8" fill="#64748b" text-anchor="middle" font-family="monospace">BGS #${config.certNumber}</text>
    </svg>
  `;
}

// CGC SVG Generator
function generateCGCSVG(config: SlabConfig, width: number, height: number): string {
  const isPerfect = parseFloat(config.grade) === 10;
  
  const labelHeight = height * 0.24;
  const cardWindowY = labelHeight + 8;
  const cardWindowHeight = height - labelHeight - 24;
  const cardWindowWidth = width - 24;
  const cardWindowX = 12;

  const subgrades = config.subgrades as CGCSubgrades;
  let subgradesSection = '';
  if (subgrades) {
    subgradesSection = `
      <rect x="${width - 75}" y="62" width="60" height="34" rx="2" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>
      <text x="${width - 71}" y="71" font-size="5" fill="#e5f5f3">Centering</text>
      <text x="${width - 19}" y="71" font-size="6" font-weight="bold" fill="#ffffff" text-anchor="end">${subgrades.centering.toFixed(1)}</text>
      <text x="${width - 71}" y="79" font-size="5" fill="#e5f5f3">Surface</text>
      <text x="${width - 19}" y="79" font-size="6" font-weight="bold" fill="#ffffff" text-anchor="end">${subgrades.surface.toFixed(1)}</text>
      <text x="${width - 71}" y="87" font-size="5" fill="#e5f5f3">Corners</text>
      <text x="${width - 19}" y="87" font-size="6" font-weight="bold" fill="#ffffff" text-anchor="end">${subgrades.corners.toFixed(1)}</text>
      <text x="${width - 71}" y="95" font-size="5" fill="#e5f5f3">Edges</text>
      <text x="${width - 19}" y="95" font-size="6" font-weight="bold" fill="#ffffff" text-anchor="end">${subgrades.edges.toFixed(1)}</text>
    `;
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cgcSlabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f1f5f9"/>
          <stop offset="50%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </linearGradient>
        <linearGradient id="cgcLabelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#14b8a6"/>
          <stop offset="50%" stop-color="#0d9488"/>
          <stop offset="100%" stop-color="#0f766e"/>
        </linearGradient>
        <clipPath id="cgcCardClip">
          <rect x="${cardWindowX + 4}" y="${cardWindowY + 4}" width="${cardWindowWidth - 8}" height="${cardWindowHeight - 8}" rx="2"/>
        </clipPath>
      </defs>
      
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="url(#cgcSlabGradient)" stroke="#94a3b8" stroke-width="1"/>
      <rect x="4" y="4" width="${width - 8}" height="${height - 8}" rx="6" fill="none" stroke="#cbd5e1" stroke-width="2"/>
      <rect x="8" y="8" width="${width - 16}" height="${labelHeight}" rx="4" fill="url(#cgcLabelGradient)"/>
      
      <rect x="16" y="14" width="50" height="32" rx="4" fill="#ffffff" opacity="0.95"/>
      <text x="41" y="36" font-size="18" font-weight="bold" fill="#0d9488" text-anchor="middle" font-family="Arial Black">CGC</text>
      <text x="74" y="26" font-size="7" fill="#ffffff" opacity="0.9">TRADING CARDS</text>
      <text x="74" y="36" font-size="6" fill="#e5f5f3">CERTIFIED GUARANTY COMPANY</text>
      
      <rect x="${width - 75}" y="12" width="60" height="36" rx="4" fill="${isPerfect ? '#fbbf24' : '#ffffff'}" stroke="${isPerfect ? '#b45309' : '#0d9488'}" stroke-width="2"/>
      <text x="${width - 45}" y="36" font-size="20" font-weight="bold" fill="${isPerfect ? '#ffffff' : '#0d9488'}" text-anchor="middle" font-family="Arial Black">${config.grade}</text>
      
      ${subgradesSection}
      
      <text x="16" y="${labelHeight - 18}" font-size="8" fill="#e5f5f3">${config.year ? config.year + ' ' : ''}${config.setName}</text>
      <text x="16" y="${labelHeight - 6}" font-size="10" fill="#ffffff" font-weight="bold">${truncate(config.cardName, 28)}</text>
      
      <rect x="${cardWindowX}" y="${cardWindowY}" width="${cardWindowWidth}" height="${cardWindowHeight}" rx="4" fill="#1a1a1a"/>
      <image x="${cardWindowX + 4}" y="${cardWindowY + 4}" width="${cardWindowWidth - 8}" height="${cardWindowHeight - 8}" href="${config.cardImage}" preserveAspectRatio="xMidYMid meet" clip-path="url(#cgcCardClip)"/>
      <rect x="${cardWindowX}" y="${cardWindowY}" width="${cardWindowWidth}" height="${cardWindowHeight}" rx="4" fill="none" stroke="#374151" stroke-width="2"/>
      
      <text x="${width / 2}" y="${height - 6}" font-size="8" fill="#64748b" text-anchor="middle" font-family="monospace">CGC #${config.certNumber}</text>
    </svg>
  `;
}

// SGC SVG Generator
function generateSGCSVG(config: SlabConfig, width: number, height: number): string {
  const gradeName = SGC_GRADE_NAMES[config.grade] || config.grade;
  const isPristine = parseFloat(config.grade) === 10;
  
  const labelHeight = height * 0.20;
  const cardWindowY = labelHeight + 8;
  const cardWindowHeight = height - labelHeight - 24;
  const cardWindowWidth = width - 24;
  const cardWindowX = 12;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sgcSlabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="50%" stop-color="#f1f5f9"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
        <linearGradient id="sgcTuxedoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2d2d2d"/>
          <stop offset="50%" stop-color="#1a1a1a"/>
          <stop offset="100%" stop-color="#0f0f0f"/>
        </linearGradient>
        <clipPath id="sgcCardClip">
          <rect x="${cardWindowX + 4}" y="${cardWindowY + 4}" width="${cardWindowWidth - 8}" height="${cardWindowHeight - 8}" rx="2"/>
        </clipPath>
      </defs>
      
      <rect x="0" y="0" width="${width}" height="${height}" rx="8" fill="url(#sgcSlabGradient)" stroke="#e2e8f0" stroke-width="1"/>
      <rect x="4" y="4" width="${width - 8}" height="${height - 8}" rx="6" fill="none" stroke="#e2e8f0" stroke-width="2"/>
      <rect x="8" y="8" width="${width - 16}" height="${labelHeight}" rx="4" fill="url(#sgcTuxedoGradient)"/>
      
      <text x="16" y="38" font-size="28" font-weight="bold" fill="${isPristine ? '#fbbf24' : '#ffffff'}" font-family="Georgia, serif" letter-spacing="2">SGC</text>
      <text x="16" y="52" font-size="6" fill="#9ca3af" letter-spacing="1">SPORTSCARD GUARANTY</text>
      
      <rect x="${width - 85}" y="10" width="70" height="48" rx="4" fill="${isPristine ? '#fbbf24' : '#ffffff'}"/>
      <text x="${width - 50}" y="42" font-size="28" font-weight="bold" fill="#1a1a1a" text-anchor="middle" font-family="Georgia, serif">${config.grade}</text>
      <text x="${width - 50}" y="54" font-size="7" font-weight="bold" fill="${isPristine ? '#1a1a1a' : '#4b5563'}" text-anchor="middle">${gradeName}</text>
      
      <text x="16" y="${labelHeight - 10}" font-size="7" fill="#9ca3af">${config.year ? config.year + ' ' : ''}${config.setName}</text>
      <text x="16" y="${labelHeight + 2}" font-size="9" fill="#ffffff" font-weight="bold">${truncate(config.cardName, 30)}</text>
      
      <rect x="${cardWindowX}" y="${cardWindowY}" width="${cardWindowWidth}" height="${cardWindowHeight}" rx="4" fill="#0a0a0a"/>
      <image x="${cardWindowX + 4}" y="${cardWindowY + 4}" width="${cardWindowWidth - 8}" height="${cardWindowHeight - 8}" href="${config.cardImage}" preserveAspectRatio="xMidYMid meet" clip-path="url(#sgcCardClip)"/>
      <rect x="${cardWindowX}" y="${cardWindowY}" width="${cardWindowWidth}" height="${cardWindowHeight}" rx="4" fill="none" stroke="#2d2d2d" stroke-width="2"/>
      
      ${config.cardNumber ? `
        <rect x="${cardWindowX + 8}" y="${cardWindowY + cardWindowHeight - 20}" width="50" height="14" rx="2" fill="rgba(0,0,0,0.7)"/>
        <text x="${cardWindowX + 33}" y="${cardWindowY + cardWindowHeight - 10}" font-size="8" fill="#ffffff" text-anchor="middle" font-family="monospace">#${config.cardNumber}</text>
      ` : ''}
      
      <rect x="8" y="${height - 18}" width="${width - 16}" height="10" rx="2" fill="#1a1a1a" opacity="0.3"/>
      <text x="${width / 2}" y="${height - 8}" font-size="8" fill="#64748b" text-anchor="middle" font-family="monospace">SGC #${config.certNumber}</text>
    </svg>
  `;
}

// Helper to truncate text
function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

export default generateSlabImage;
