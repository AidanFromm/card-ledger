/**
 * Comprehensive grading scales for all supported grading companies.
 * Each company has different grade values, names, and features.
 */

export interface GradeDefinition {
  value: number;
  label: string;
  description: string;
  isBlackLabel?: boolean;  // For BGS Black Label
}

export interface GradingScale {
  name: string;
  fullName: string;
  grades: GradeDefinition[];
  hasHalfGrades: boolean;
  hasSubgrades: boolean;
  subgradeFields?: string[];
}

export interface RawCondition {
  value: string;
  label: string;
  abbrev: string;
  description: string;
}

// PSA Grades (1-10, whole numbers only)
const PSA_GRADES: GradeDefinition[] = [
  { value: 10, label: 'Gem Mint', description: 'Virtually perfect in every way' },
  { value: 9, label: 'Mint', description: 'Superb condition with one minor flaw' },
  { value: 8, label: 'NM-MT', description: 'Near Mint to Mint, slight wear visible' },
  { value: 7, label: 'Near Mint', description: 'Slight surface wear, minor corner wear' },
  { value: 6, label: 'EX-MT', description: 'Excellent to Mint, minor defects' },
  { value: 5, label: 'Excellent', description: 'Moderate wear on corners and edges' },
  { value: 4, label: 'VG-EX', description: 'Very Good to Excellent, noticeable wear' },
  { value: 3, label: 'Very Good', description: 'Well-handled with rounding corners' },
  { value: 2, label: 'Good', description: 'Major defects visible' },
  { value: 1, label: 'Poor', description: 'Significant wear and damage' },
];

// BGS Grades (1-10 with half grades, includes Black Label)
const BGS_GRADES: GradeDefinition[] = [
  { value: 10, label: 'Pristine', description: 'Perfect in every way', isBlackLabel: true },
  { value: 10, label: 'Pristine', description: 'Perfect in every way' },
  { value: 9.5, label: 'Gem Mint', description: 'Nearly perfect with minor imperfection' },
  { value: 9, label: 'Mint', description: 'Superb condition' },
  { value: 8.5, label: 'NM-MT+', description: 'Near Mint to Mint plus' },
  { value: 8, label: 'NM-MT', description: 'Near Mint to Mint' },
  { value: 7.5, label: 'Near Mint+', description: 'Near Mint plus' },
  { value: 7, label: 'Near Mint', description: 'Slight wear visible' },
  { value: 6.5, label: 'EX-MT+', description: 'Excellent to Mint plus' },
  { value: 6, label: 'EX-MT', description: 'Excellent to Mint' },
  { value: 5.5, label: 'Excellent+', description: 'Excellent plus' },
  { value: 5, label: 'Excellent', description: 'Moderate wear' },
];

// CGC Grades (1-10 with half grades)
const CGC_GRADES: GradeDefinition[] = [
  { value: 10, label: 'Pristine', description: 'Perfect under 10x magnification' },
  { value: 10, label: 'Gem Mint', description: 'Appears perfect to naked eye' },
  { value: 9.5, label: 'Mint+', description: 'Nearly perfect' },
  { value: 9, label: 'Mint', description: 'Very minor imperfection' },
  { value: 8.5, label: 'NM-MT+', description: 'Near Mint to Mint plus' },
  { value: 8, label: 'NM-MT', description: 'Near Mint to Mint' },
  { value: 7.5, label: 'Near Mint+', description: 'Near Mint plus' },
  { value: 7, label: 'Near Mint', description: 'Slight wear' },
  { value: 6.5, label: 'EX-MT+', description: 'Excellent to Mint plus' },
  { value: 6, label: 'EX-MT', description: 'Excellent to Mint' },
  { value: 5.5, label: 'Excellent+', description: 'Excellent plus' },
  { value: 5, label: 'Excellent', description: 'Moderate wear' },
];

// SGC Grades (1-10 with half grades, similar to PSA naming)
const SGC_GRADES: GradeDefinition[] = [
  { value: 10, label: 'Gem Mint', description: 'Virtually perfect' },
  { value: 9.5, label: 'Mint+', description: 'Nearly perfect' },
  { value: 9, label: 'Mint', description: 'One minor flaw allowed' },
  { value: 8.5, label: 'NM-MT+', description: 'Near Mint to Mint plus' },
  { value: 8, label: 'NM-MT', description: 'Near Mint to Mint' },
  { value: 7.5, label: 'Near Mint+', description: 'Near Mint plus' },
  { value: 7, label: 'Near Mint', description: 'Slight wear' },
  { value: 6.5, label: 'EX-MT+', description: 'Excellent to Mint plus' },
  { value: 6, label: 'EX-MT', description: 'Excellent to Mint' },
  { value: 5.5, label: 'Excellent+', description: 'Excellent plus' },
  { value: 5, label: 'Excellent', description: 'Moderate wear' },
];

// ACE Grades (1-10, whole numbers only)
const ACE_GRADES: GradeDefinition[] = [
  { value: 10, label: 'Gem Mint', description: 'Virtually perfect' },
  { value: 9, label: 'Mint', description: 'One minor flaw' },
  { value: 8, label: 'NM-MT', description: 'Near Mint to Mint' },
  { value: 7, label: 'Near Mint', description: 'Slight wear' },
  { value: 6, label: 'EX-MT', description: 'Excellent to Mint' },
  { value: 5, label: 'Excellent', description: 'Moderate wear' },
  { value: 4, label: 'VG-EX', description: 'Very Good to Excellent' },
  { value: 3, label: 'Very Good', description: 'Noticeable wear' },
  { value: 2, label: 'Good', description: 'Major defects' },
  { value: 1, label: 'Poor', description: 'Significant damage' },
];

// TAG Grades (1-10, whole numbers only, uses 1000-point internal scale)
const TAG_GRADES: GradeDefinition[] = [
  { value: 10, label: 'Gem Mint', description: 'Virtually perfect (950-1000 pts)' },
  { value: 9, label: 'Mint', description: 'Minor imperfection (850-949 pts)' },
  { value: 8, label: 'NM-MT', description: 'Near Mint to Mint (750-849 pts)' },
  { value: 7, label: 'Near Mint', description: 'Slight wear (650-749 pts)' },
  { value: 6, label: 'EX-MT', description: 'Excellent to Mint (550-649 pts)' },
  { value: 5, label: 'Excellent', description: 'Moderate wear (450-549 pts)' },
  { value: 4, label: 'VG-EX', description: 'Very Good to Excellent (350-449 pts)' },
  { value: 3, label: 'Very Good', description: 'Noticeable wear (250-349 pts)' },
  { value: 2, label: 'Good', description: 'Major defects (150-249 pts)' },
  { value: 1, label: 'Poor', description: 'Significant damage (0-149 pts)' },
];

// All grading scales
export const GRADING_SCALES: Record<string, GradingScale> = {
  psa: {
    name: 'PSA',
    fullName: 'Professional Sports Authenticator',
    grades: PSA_GRADES,
    hasHalfGrades: false,
    hasSubgrades: false,
  },
  bgs: {
    name: 'BGS',
    fullName: 'Beckett Grading Services',
    grades: BGS_GRADES,
    hasHalfGrades: true,
    hasSubgrades: true,
    subgradeFields: ['centering', 'corners', 'edges', 'surface'],
  },
  cgc: {
    name: 'CGC',
    fullName: 'Certified Guaranty Company',
    grades: CGC_GRADES,
    hasHalfGrades: true,
    hasSubgrades: false,
  },
  sgc: {
    name: 'SGC',
    fullName: 'Sportscard Guaranty Company',
    grades: SGC_GRADES,
    hasHalfGrades: true,
    hasSubgrades: false,
  },
  ace: {
    name: 'ACE',
    fullName: 'ACE Grading',
    grades: ACE_GRADES,
    hasHalfGrades: false,
    hasSubgrades: false,
  },
  tag: {
    name: 'TAG',
    fullName: 'TAG Grading',
    grades: TAG_GRADES,
    hasHalfGrades: false,
    hasSubgrades: false,
  },
};

// Raw card conditions
export const RAW_CONDITIONS: RawCondition[] = [
  { value: 'NM', label: 'Near Mint', abbrev: 'NM', description: 'Minimal wear, crisp corners, no visible flaws' },
  { value: 'LP', label: 'Lightly Played', abbrev: 'LP', description: 'Minor edge wear, small scuffs, slight whitening' },
  { value: 'MP', label: 'Moderately Played', abbrev: 'MP', description: 'Noticeable wear, scratches, corner/edge damage' },
  { value: 'HP', label: 'Heavily Played', abbrev: 'HP', description: 'Major wear, creases, still tournament playable' },
  { value: 'DMG', label: 'Damaged', abbrev: 'DMG', description: 'Structural damage, tears, water damage' },
];

// Helper function to get grade label for a company and grade value
export function getGradeLabel(company: string, gradeValue: number | string, isBlackLabel?: boolean): string {
  const scale = GRADING_SCALES[company.toLowerCase()];
  if (!scale) return String(gradeValue);

  const numValue = typeof gradeValue === 'string' ? parseFloat(gradeValue) : gradeValue;

  // For BGS Black Label 10
  if (company.toLowerCase() === 'bgs' && numValue === 10 && isBlackLabel) {
    return 'Black Label';
  }

  const grade = scale.grades.find(g => g.value === numValue && (!isBlackLabel || g.isBlackLabel === isBlackLabel));
  return grade?.label || String(gradeValue);
}

// Helper function to get available grades for a company
export function getGradesForCompany(company: string): GradeDefinition[] {
  const scale = GRADING_SCALES[company.toLowerCase()];
  if (!scale) return [];

  // Filter out duplicate values (like BGS having two 10s for Pristine and Black Label)
  const seen = new Set<string>();
  return scale.grades.filter(g => {
    const key = `${g.value}-${g.isBlackLabel || false}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Helper function to check if a company supports half grades
export function supportsHalfGrades(company: string): boolean {
  const scale = GRADING_SCALES[company.toLowerCase()];
  return scale?.hasHalfGrades || false;
}

// Helper function to check if a company has subgrades
export function hasSubgrades(company: string): boolean {
  const scale = GRADING_SCALES[company.toLowerCase()];
  return scale?.hasSubgrades || false;
}

// Helper to get unique grade values for a company (for UI selection)
export function getUniqueGradeValues(company: string): number[] {
  const scale = GRADING_SCALES[company.toLowerCase()];
  if (!scale) return [];

  const values = new Set<number>();
  scale.grades.forEach(g => values.add(g.value));
  return Array.from(values).sort((a, b) => b - a); // Descending order (10 first)
}

// BGS subgrade fields with labels
export const BGS_SUBGRADE_FIELDS = [
  { key: 'centering', label: 'Centering', abbrev: 'C' },
  { key: 'corners', label: 'Corners', abbrev: 'Cor' },
  { key: 'edges', label: 'Edges', abbrev: 'E' },
  { key: 'surface', label: 'Surface', abbrev: 'S' },
] as const;

// BGS subgrade valid values (10, 9.5, 9, 8.5, 8, etc.)
export const BGS_SUBGRADE_VALUES = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5];

// Slab template configuration
export interface SlabTemplate {
  company: string;
  grade: number | string;
  imagePath: string;
}

// Generate slab template paths for all supported grades
export function getSlabTemplatePath(company: string, grade: number | string, isBlackLabel?: boolean): string {
  const normalizedCompany = company.toLowerCase();
  const normalizedGrade = String(grade).replace('.', '-'); // 9.5 -> 9-5

  if (normalizedCompany === 'bgs' && isBlackLabel && grade === 10) {
    return `/slabs/${normalizedCompany}-10-bl.png`;
  }

  return `/slabs/${normalizedCompany}-${normalizedGrade}.png`;
}

// Get all supported slab template grades for a company
export function getSupportedSlabGrades(company: string): (number | string)[] {
  const scale = GRADING_SCALES[company.toLowerCase()];
  if (!scale) return [];

  // Only support grades 5-10 for slab templates
  const supportedGrades = scale.grades
    .filter(g => g.value >= 5)
    .map(g => g.value);

  // Remove duplicates and sort
  return [...new Set(supportedGrades)].sort((a, b) => b - a);
}
