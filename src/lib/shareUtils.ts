/**
 * Share Utilities for CardLedger
 * Handles link generation, social share URLs, and image generation
 */

// Base URL for the app
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://usecardledger.com';
};

// Generate shareable collection link
export const generateCollectionLink = (shareToken: string): string => {
  return `${getBaseUrl()}/share/${shareToken}`;
};

// Generate public profile link
export const generateProfileLink = (username: string): string => {
  return `${getBaseUrl()}/u/${username}`;
};

// Social share URL generators
export const socialShareUrls = {
  twitter: (url: string, text: string): string => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
  },

  facebook: (url: string): string => {
    const encodedUrl = encodeURIComponent(url);
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  },

  reddit: (url: string, title: string): string => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    return `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
  },

  discord: (url: string, text: string): string => {
    // Discord doesn't have a direct share URL, so we copy to clipboard
    // This returns a message that can be pasted
    return `${text}\n${url}`;
  },

  whatsapp: (url: string, text: string): string => {
    const message = encodeURIComponent(`${text}\n${url}`);
    return `https://wa.me/?text=${message}`;
  },

  telegram: (url: string, text: string): string => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  },

  email: (url: string, subject: string, body: string): string => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(`${body}\n\n${url}`);
    return `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
  },
};

// Open share URL in a popup window
export const openShareWindow = (url: string, name: string = 'share'): void => {
  const width = 600;
  const height = 400;
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;
  
  window.open(
    url,
    name,
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );
};

// Copy text to clipboard with fallback
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Format large numbers for display
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Generate share message for collection
export const generateShareMessage = (stats: {
  totalCards: number;
  totalValue: number;
  level?: number;
  achievements?: number;
}): string => {
  const parts = [
    '🎴 Check out my card collection!',
    `📦 ${stats.totalCards.toLocaleString()} cards`,
    `💰 ${formatCurrency(stats.totalValue)} portfolio value`,
  ];
  
  if (stats.level) {
    parts.push(`🏆 Level ${stats.level}`);
  }
  
  if (stats.achievements) {
    parts.push(`⭐ ${stats.achievements} achievements`);
  }
  
  parts.push('\nTrack your collection at usecardledger.com');
  
  return parts.join('\n');
};

// Generate stats card canvas image
export interface StatsCardData {
  totalCards: number;
  totalValue: number;
  level: number;
  achievements: number;
  streak: number;
  topCards?: Array<{
    name: string;
    imageUrl?: string;
    value: number;
  }>;
}

export const generateStatsImage = async (
  container: HTMLElement
): Promise<string | null> => {
  try {
    // Dynamic import to avoid SSR issues
    const html2canvas = (await import('html2canvas')).default;
    
    const canvas = await html2canvas(container, {
      backgroundColor: '#0a0a0a',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to generate stats image:', error);
    return null;
  }
};

// Download image from data URL
export const downloadImage = (dataUrl: string, filename: string = 'cardledger-stats.png'): void => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generate QR code data URL (using qrcode.react)
// The actual QR code is rendered as a React component
// This is a helper to get the QR code as an image
export const getQRCodeDataUrl = async (
  qrCodeElement: HTMLCanvasElement | SVGSVGElement
): Promise<string | null> => {
  try {
    if (qrCodeElement instanceof HTMLCanvasElement) {
      return qrCodeElement.toDataURL('image/png');
    }
    
    // For SVG, we need to convert to canvas first
    const svg = qrCodeElement;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    });
  } catch (error) {
    console.error('Failed to get QR code data URL:', error);
    return null;
  }
};

// Check if Web Share API is supported
export const isWebShareSupported = (): boolean => {
  return typeof navigator !== 'undefined' && !!navigator.share;
};

// Use native share if available
export const nativeShare = async (data: {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}): Promise<boolean> => {
  if (!isWebShareSupported()) {
    return false;
  }
  
  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    // User cancelled or share failed
    if ((error as Error).name !== 'AbortError') {
      console.error('Share failed:', error);
    }
    return false;
  }
};

// Convert data URL to File for sharing
export const dataUrlToFile = async (
  dataUrl: string,
  filename: string
): Promise<File | null> => {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  } catch (error) {
    console.error('Failed to convert data URL to file:', error);
    return null;
  }
};

// Generate username from email (for public profiles)
export const generateUsernameFromEmail = (email: string): string => {
  const localPart = email.split('@')[0];
  // Remove special characters and make lowercase
  const clean = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  // Add random suffix for uniqueness
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${clean}${suffix}`;
};
