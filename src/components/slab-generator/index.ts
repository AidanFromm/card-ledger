// Slab Generator Module
// Generates professional grading slab mockup images for PSA, BGS, CGC, and SGC

// Main components
export { SlabGenerator, useSlabExport } from './SlabGenerator';
export { SlabPreview } from './SlabPreview';

// Utility functions
export { generateSlabImage, generateSlabDataURL, downloadSlabImage } from './generateSlabImage';

// Hook
export { useSlabGenerator } from './useSlabGenerator';

// Templates (for advanced usage)
export { PSATemplate } from './templates/PSATemplate';
export { BGSTemplate } from './templates/BGSTemplate';
export { CGCTemplate } from './templates/CGCTemplate';
export { SGCTemplate } from './templates/SGCTemplate';

// Types
export * from './types';

// Default export
export { default as SlabGenerator } from './SlabGenerator';
