import { useState, useCallback } from 'react';
import { SlabConfig, GradingCompany, BGSSubgrades, CGCSubgrades } from './types';
import { generateSlabImage, generateSlabDataURL, downloadSlabImage } from './generateSlabImage';

interface UseSlabGeneratorOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpeg';
  quality?: number;
}

interface UseSlabGeneratorReturn {
  isGenerating: boolean;
  error: string | null;
  generate: (config: SlabConfig) => Promise<Blob | null>;
  generateDataUrl: (config: SlabConfig) => Promise<string | null>;
  download: (config: SlabConfig, filename?: string) => Promise<boolean>;
  createConfig: (params: {
    cardImage: string;
    gradingCompany: GradingCompany;
    grade: string;
    cardName: string;
    setName: string;
    year?: string;
    certNumber: string;
    cardNumber?: string;
    subgrades?: BGSSubgrades | CGCSubgrades;
  }) => SlabConfig;
}

/**
 * Hook for generating slab images throughout the app
 * 
 * @example
 * ```tsx
 * const { generate, download, createConfig } = useSlabGenerator();
 * 
 * const handleGenerateSlab = async () => {
 *   const config = createConfig({
 *     cardImage: 'https://...',
 *     gradingCompany: 'PSA',
 *     grade: '10',
 *     cardName: 'Charizard',
 *     setName: 'Base Set',
 *     certNumber: '12345678',
 *   });
 *   
 *   const blob = await generate(config);
 *   // Use blob...
 * };
 * ```
 */
export function useSlabGenerator(options: UseSlabGeneratorOptions = {}): UseSlabGeneratorReturn {
  const { width = 300, height = 450, format = 'png', quality = 0.95 } = options;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (config: SlabConfig): Promise<Blob | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const blob = await generateSlabImage(config, { width, height, format, quality });
      return blob;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate slab image';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [width, height, format, quality]);

  const generateDataUrl = useCallback(async (config: SlabConfig): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const dataUrl = await generateSlabDataURL(config, { width, height, format, quality });
      return dataUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate slab image';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [width, height, format, quality]);

  const download = useCallback(async (config: SlabConfig, filename?: string): Promise<boolean> => {
    setIsGenerating(true);
    setError(null);

    try {
      const name = filename || `${config.cardName.replace(/\s+/g, '_')}_${config.gradingCompany}_${config.grade}`;
      const success = await downloadSlabImage(config, name, { width, height, format, quality });
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download slab image';
      setError(message);
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, [width, height, format, quality]);

  const createConfig = useCallback((params: {
    cardImage: string;
    gradingCompany: GradingCompany;
    grade: string;
    cardName: string;
    setName: string;
    year?: string;
    certNumber: string;
    cardNumber?: string;
    subgrades?: BGSSubgrades | CGCSubgrades;
  }): SlabConfig => {
    return {
      cardImage: params.cardImage,
      gradingCompany: params.gradingCompany,
      grade: params.grade,
      cardName: params.cardName,
      setName: params.setName,
      year: params.year,
      certNumber: params.certNumber,
      cardNumber: params.cardNumber,
      subgrades: params.subgrades,
    };
  }, []);

  return {
    isGenerating,
    error,
    generate,
    generateDataUrl,
    download,
    createConfig,
  };
}

export default useSlabGenerator;
