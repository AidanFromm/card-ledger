import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SlabConfig, GradingCompany, BGSSubgrades, CGCSubgrades } from './types';
import { PSATemplate } from './templates/PSATemplate';
import { BGSTemplate } from './templates/BGSTemplate';
import { CGCTemplate } from './templates/CGCTemplate';
import { SGCTemplate } from './templates/SGCTemplate';

interface SlabGeneratorProps {
  config: SlabConfig;
  width?: number;
  height?: number;
  onGenerated?: (blob: Blob) => void;
  autoExport?: boolean;
  exportFormat?: 'png' | 'jpeg';
  exportQuality?: number;
  className?: string;
}

export const SlabGenerator: React.FC<SlabGeneratorProps> = ({
  config,
  width = 300,
  height = 450,
  onGenerated,
  autoExport = false,
  exportFormat = 'png',
  exportQuality = 0.95,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const renderTemplate = () => {
    const commonProps = {
      cardImage: config.cardImage,
      grade: config.grade,
      cardName: config.cardName,
      setName: config.setName,
      year: config.year,
      certNumber: config.certNumber,
      cardNumber: config.cardNumber,
      width,
      height,
    };

    switch (config.gradingCompany) {
      case 'PSA':
        return <PSATemplate {...commonProps} />;
      case 'BGS':
        return (
          <BGSTemplate 
            {...commonProps} 
            subgrades={config.subgrades as BGSSubgrades} 
          />
        );
      case 'CGC':
        return (
          <CGCTemplate 
            {...commonProps} 
            subgrades={config.subgrades as CGCSubgrades} 
          />
        );
      case 'SGC':
        return <SGCTemplate {...commonProps} />;
      default:
        return <PSATemplate {...commonProps} />;
    }
  };

  const exportToBlob = useCallback(async (): Promise<Blob | null> => {
    const svgElement = svgRef.current;
    if (!svgElement) return null;

    setIsExporting(true);

    try {
      // Serialize SVG to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      
      // Create a blob from the SVG
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Create canvas and draw
      const canvas = document.createElement('canvas');
      canvas.width = width * 2; // 2x for higher resolution
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        return null;
      }

      // Scale for higher resolution
      ctx.scale(2, 2);

      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);

          canvas.toBlob(
            (blob) => {
              setIsExporting(false);
              resolve(blob);
            },
            `image/${exportFormat}`,
            exportQuality
          );
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          setIsExporting(false);
          resolve(null);
        };
        img.src = url;
      });
    } catch (error) {
      console.error('Error exporting slab image:', error);
      setIsExporting(false);
      return null;
    }
  }, [width, height, exportFormat, exportQuality]);

  // Auto-export when config changes
  useEffect(() => {
    if (autoExport && onGenerated) {
      const timeoutId = setTimeout(async () => {
        const blob = await exportToBlob();
        if (blob) {
          onGenerated(blob);
        }
      }, 100); // Small delay to ensure SVG is rendered

      return () => clearTimeout(timeoutId);
    }
  }, [autoExport, onGenerated, exportToBlob, config]);

  return (
    <div className={`slab-generator ${className}`} style={{ position: 'relative' }}>
      <div ref={svgRef as any} style={{ display: 'inline-block' }}>
        {renderTemplate()}
      </div>
      
      {isExporting && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
          }}
        >
          <div style={{ color: 'white', fontSize: '14px' }}>Generating...</div>
        </div>
      )}
    </div>
  );
};

// Hook for programmatic export
export const useSlabExport = () => {
  const exportSlab = async (
    config: SlabConfig,
    options: {
      width?: number;
      height?: number;
      format?: 'png' | 'jpeg';
      quality?: number;
    } = {}
  ): Promise<Blob | null> => {
    const { width = 300, height = 450, format = 'png', quality = 0.95 } = options;

    // Create temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);

    return new Promise((resolve) => {
      // Use ReactDOM to render (this requires the component to be used within React)
      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(container);
        
        root.render(
          <SlabGenerator
            config={config}
            width={width}
            height={height}
            autoExport={true}
            exportFormat={format}
            exportQuality={quality}
            onGenerated={(blob) => {
              root.unmount();
              document.body.removeChild(container);
              resolve(blob);
            }}
          />
        );

        // Cleanup timeout
        setTimeout(() => {
          try {
            root.unmount();
            document.body.removeChild(container);
          } catch (e) {}
          resolve(null);
        }, 5000);
      });
    });
  };

  return { exportSlab };
};

export default SlabGenerator;
