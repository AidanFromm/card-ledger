// Slab Generator Module
// Generates professional grading slab mockup images for PSA, BGS, CGC, and SGC

export { SlabGenerator, useSlabExport } from './SlabGenerator';
export { generateSlabImage, generateSlabDataURL, downloadSlabImage } from './generateSlabImage';
export { PSATemplate } from './templates/PSATemplate';
export { BGSTemplate } from './templates/BGSTemplate';
export { CGCTemplate } from './templates/CGCTemplate';
export { SGCTemplate } from './templates/SGCTemplate';
export * from './types';

// Default export
export { default as SlabGenerator } from './SlabGenerator';
