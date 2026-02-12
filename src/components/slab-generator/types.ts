// Slab Generator Types

export type GradingCompany = 'PSA' | 'BGS' | 'CGC' | 'SGC';

export type PSAGrade = 
  | '1' | '1.5' | '2' | '2.5' | '3' | '3.5' | '4' | '4.5' 
  | '5' | '5.5' | '6' | '6.5' | '7' | '7.5' | '8' | '8.5' 
  | '9' | '9.5' | '10' | 'Authentic' | 'Altered';

export type NumericGrade = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '9.5' | '10';

export interface BGSSubgrades {
  centering: number;
  corners: number;
  edges: number;
  surface: number;
}

export interface CGCSubgrades {
  centering: number;
  surface: number;
  corners: number;
  edges: number;
}

export interface SlabConfig {
  cardImage: string;
  gradingCompany: GradingCompany;
  grade: string;
  cardName: string;
  setName: string;
  year?: string;
  certNumber: string;
  cardNumber?: string;
  subgrades?: BGSSubgrades | CGCSubgrades;
}

export interface SlabDimensions {
  width: number;
  height: number;
  labelHeight: number;
  cardWindowX: number;
  cardWindowY: number;
  cardWindowWidth: number;
  cardWindowHeight: number;
  cornerRadius: number;
}

// PSA label colors based on grade
export const PSA_LABEL_COLORS: Record<string, { background: string; text: string; accent: string }> = {
  '10': { background: '#1e3a8a', text: '#ffffff', accent: '#fbbf24' }, // Blue label - Gem Mint
  '9.5': { background: '#dc2626', text: '#ffffff', accent: '#fbbf24' }, // Red label
  '9': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' }, // Red label - Mint
  '8.5': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' },
  '8': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' }, // Red label - NM-MT
  '7.5': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' },
  '7': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' }, // Red label - NM
  '6.5': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' },
  '6': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' }, // Red label - EX-MT
  '5.5': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' },
  '5': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' }, // Red label - EX
  '4.5': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' },
  '4': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' }, // Red label - VG-EX
  '3.5': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' },
  '3': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' }, // Red label - VG
  '2.5': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' },
  '2': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' }, // Red label - Good
  '1.5': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' },
  '1': { background: '#dc2626', text: '#ffffff', accent: '#ffffff' }, // Red label - Poor
  'Authentic': { background: '#ca8a04', text: '#ffffff', accent: '#ffffff' }, // Yellow/Gold label
  'Altered': { background: '#7c3aed', text: '#ffffff', accent: '#ffffff' }, // Purple label
};

// BGS label colors based on grade
export const BGS_LABEL_COLORS: Record<string, { background: string; text: string; accent: string }> = {
  '10': { background: '#0f0f0f', text: '#ffffff', accent: '#fbbf24' }, // Black label - Pristine
  '9.5': { background: '#b8860b', text: '#ffffff', accent: '#ffffff' }, // Gold label - Gem Mint
  '9': { background: '#e5e7eb', text: '#1f2937', accent: '#1f2937' }, // Silver/white label
  '8.5': { background: '#e5e7eb', text: '#1f2937', accent: '#1f2937' },
  '8': { background: '#e5e7eb', text: '#1f2937', accent: '#1f2937' },
  '7.5': { background: '#e5e7eb', text: '#1f2937', accent: '#1f2937' },
  '7': { background: '#e5e7eb', text: '#1f2937', accent: '#1f2937' },
  '6.5': { background: '#e5e7eb', text: '#1f2937', accent: '#1f2937' },
  '6': { background: '#e5e7eb', text: '#1f2937', accent: '#1f2937' },
  '5': { background: '#e5e7eb', text: '#1f2937', accent: '#1f2937' },
  '4': { background: '#e5e7eb', text: '#1f2937', accent: '#1f2937' },
  '3': { background: '#e5e7eb', text: '#1f2937', accent: '#1f2937' },
  '2': { background: '#e5e7eb', text: '#1f2937', accent: '#1f2937' },
  '1': { background: '#e5e7eb', text: '#1f2937', accent: '#1f2937' },
};

// CGC label colors
export const CGC_LABEL_COLORS: Record<string, { background: string; text: string; accent: string }> = {
  '10': { background: '#0d9488', text: '#ffffff', accent: '#fbbf24' }, // Teal - Perfect
  '9.5': { background: '#0d9488', text: '#ffffff', accent: '#ffffff' },
  '9': { background: '#0d9488', text: '#ffffff', accent: '#ffffff' },
  '8.5': { background: '#0d9488', text: '#ffffff', accent: '#ffffff' },
  '8': { background: '#0d9488', text: '#ffffff', accent: '#ffffff' },
  '7.5': { background: '#0d9488', text: '#ffffff', accent: '#ffffff' },
  '7': { background: '#0d9488', text: '#ffffff', accent: '#ffffff' },
  '6.5': { background: '#0d9488', text: '#ffffff', accent: '#ffffff' },
  '6': { background: '#0d9488', text: '#ffffff', accent: '#ffffff' },
  '5': { background: '#0d9488', text: '#ffffff', accent: '#ffffff' },
  '4': { background: '#0d9488', text: '#ffffff', accent: '#ffffff' },
  '3': { background: '#0d9488', text: '#ffffff', accent: '#ffffff' },
  '2': { background: '#0d9488', text: '#ffffff', accent: '#ffffff' },
  '1': { background: '#0d9488', text: '#ffffff', accent: '#ffffff' },
};

// SGC uses tuxedo (black/white) design for all grades
export const SGC_LABEL_COLORS = {
  background: '#1f2937',
  text: '#ffffff',
  accent: '#fbbf24',
};

// Grade name mappings
export const PSA_GRADE_NAMES: Record<string, string> = {
  '10': 'GEM MINT',
  '9.5': 'MINT+',
  '9': 'MINT',
  '8.5': 'NM-MT+',
  '8': 'NM-MT',
  '7.5': 'NM+',
  '7': 'NM',
  '6.5': 'EX-MT+',
  '6': 'EX-MT',
  '5.5': 'EX+',
  '5': 'EX',
  '4.5': 'VG-EX+',
  '4': 'VG-EX',
  '3.5': 'VG+',
  '3': 'VG',
  '2.5': 'GOOD+',
  '2': 'GOOD',
  '1.5': 'FAIR',
  '1': 'POOR',
  'Authentic': 'AUTHENTIC',
  'Altered': 'ALTERED',
};

export const BGS_GRADE_NAMES: Record<string, string> = {
  '10': 'PRISTINE',
  '9.5': 'GEM MINT',
  '9': 'MINT',
  '8.5': 'NM-MT+',
  '8': 'NM-MT',
  '7.5': 'NM+',
  '7': 'NM',
  '6.5': 'EX-MT+',
  '6': 'EX-MT',
  '5': 'EX',
  '4': 'VG-EX',
  '3': 'VG',
  '2': 'GOOD',
  '1': 'POOR',
};

export const SGC_GRADE_NAMES: Record<string, string> = {
  '10': 'GEM MINT',
  '9.5': 'MINT+',
  '9': 'MINT',
  '8.5': 'NM-MT+',
  '8': 'NM-MT',
  '7.5': 'NM+',
  '7': 'NM',
  '6.5': 'EX-MT+',
  '6': 'EX-MT',
  '5': 'EX',
  '4': 'VG-EX',
  '3': 'VG',
  '2': 'GOOD',
  '1': 'POOR',
};
