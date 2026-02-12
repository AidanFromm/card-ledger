import React, { useState, useCallback } from 'react';
import { SlabGenerator } from './SlabGenerator';
import { downloadSlabImage, generateSlabDataURL } from './generateSlabImage';
import { SlabConfig, GradingCompany, BGSSubgrades, CGCSubgrades } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, RefreshCw, Share2 } from 'lucide-react';

// Grade options for each company
const GRADE_OPTIONS: Record<GradingCompany, string[]> = {
  PSA: ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', 'Authentic', 'Altered'],
  BGS: ['1', '2', '3', '4', '5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'],
  CGC: ['1', '2', '3', '4', '5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'],
  SGC: ['1', '2', '3', '4', '5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'],
};

interface SlabPreviewProps {
  initialConfig?: Partial<SlabConfig>;
  onSave?: (config: SlabConfig, imageBlob: Blob) => void;
  compact?: boolean;
}

export const SlabPreview: React.FC<SlabPreviewProps> = ({
  initialConfig = {},
  onSave,
  compact = false,
}) => {
  const [config, setConfig] = useState<SlabConfig>({
    cardImage: initialConfig.cardImage || '/placeholder-card.png',
    gradingCompany: initialConfig.gradingCompany || 'PSA',
    grade: initialConfig.grade || '10',
    cardName: initialConfig.cardName || 'Charizard',
    setName: initialConfig.setName || 'Base Set',
    year: initialConfig.year || '1999',
    certNumber: initialConfig.certNumber || '12345678',
    cardNumber: initialConfig.cardNumber || '4',
    subgrades: initialConfig.subgrades,
  });

  const [subgrades, setSubgrades] = useState<BGSSubgrades>({
    centering: 9.5,
    corners: 9.5,
    edges: 9.5,
    surface: 10,
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const handleCompanyChange = (company: GradingCompany) => {
    setConfig(prev => ({
      ...prev,
      gradingCompany: company,
      grade: GRADE_OPTIONS[company].includes(prev.grade) ? prev.grade : '10',
      subgrades: (company === 'BGS' || company === 'CGC') ? subgrades : undefined,
    }));
  };

  const handleSubgradeChange = (key: keyof BGSSubgrades, value: number) => {
    const newSubgrades = { ...subgrades, [key]: value };
    setSubgrades(newSubgrades);
    if (config.gradingCompany === 'BGS' || config.gradingCompany === 'CGC') {
      setConfig(prev => ({ ...prev, subgrades: newSubgrades }));
    }
  };

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const filename = `${config.cardName.replace(/\s+/g, '_')}_${config.gradingCompany}_${config.grade}`;
      await downloadSlabImage(config, filename);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [config]);

  const handleShare = useCallback(async () => {
    try {
      const dataUrl = await generateSlabDataURL(config);
      if (dataUrl && navigator.share) {
        // Convert data URL to blob for sharing
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `${config.cardName}_slab.png`, { type: 'image/png' });
        
        await navigator.share({
          files: [file],
          title: `${config.cardName} - ${config.gradingCompany} ${config.grade}`,
        });
      } else if (dataUrl) {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(dataUrl);
        alert('Image data copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [config]);

  const handleSave = useCallback(async () => {
    if (onSave) {
      const dataUrl = await generateSlabDataURL(config);
      if (dataUrl) {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        onSave(config, blob);
      }
    }
  }, [config, onSave]);

  return (
    <div className={`slab-preview ${compact ? 'flex flex-row gap-4' : 'flex flex-col gap-6'}`}>
      {/* Preview */}
      <Card className={compact ? 'w-fit' : 'w-full max-w-[320px] mx-auto'}>
        <CardContent className="p-4 flex items-center justify-center">
          <SlabGenerator
            config={config}
            width={compact ? 200 : 300}
            height={compact ? 300 : 450}
          />
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className={compact ? 'flex-1' : 'w-full'}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Customize Slab</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Grading Company */}
          <div className="space-y-2">
            <Label>Grading Company</Label>
            <Select
              value={config.gradingCompany}
              onValueChange={(value) => handleCompanyChange(value as GradingCompany)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PSA">PSA</SelectItem>
                <SelectItem value="BGS">BGS (Beckett)</SelectItem>
                <SelectItem value="CGC">CGC</SelectItem>
                <SelectItem value="SGC">SGC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grade */}
          <div className="space-y-2">
            <Label>Grade</Label>
            <Select
              value={config.grade}
              onValueChange={(value) => setConfig(prev => ({ ...prev, grade: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRADE_OPTIONS[config.gradingCompany].map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Card Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Card Name</Label>
              <Input
                value={config.cardName}
                onChange={(e) => setConfig(prev => ({ ...prev, cardName: e.target.value }))}
                placeholder="Card name"
              />
            </div>
            <div className="space-y-2">
              <Label>Set Name</Label>
              <Input
                value={config.setName}
                onChange={(e) => setConfig(prev => ({ ...prev, setName: e.target.value }))}
                placeholder="Set name"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                value={config.year || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, year: e.target.value }))}
                placeholder="Year"
              />
            </div>
            <div className="space-y-2">
              <Label>Card #</Label>
              <Input
                value={config.cardNumber || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, cardNumber: e.target.value }))}
                placeholder="#"
              />
            </div>
            <div className="space-y-2">
              <Label>Cert #</Label>
              <Input
                value={config.certNumber}
                onChange={(e) => setConfig(prev => ({ ...prev, certNumber: e.target.value }))}
                placeholder="Cert #"
              />
            </div>
          </div>

          {/* Subgrades for BGS/CGC */}
          {(config.gradingCompany === 'BGS' || config.gradingCompany === 'CGC') && (
            <div className="space-y-2">
              <Label>Subgrades</Label>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Centering</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={subgrades.centering}
                    onChange={(e) => handleSubgradeChange('centering', parseFloat(e.target.value))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Corners</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={subgrades.corners}
                    onChange={(e) => handleSubgradeChange('corners', parseFloat(e.target.value))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Edges</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={subgrades.edges}
                    onChange={(e) => handleSubgradeChange('edges', parseFloat(e.target.value))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Surface</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={subgrades.surface}
                    onChange={(e) => handleSubgradeChange('surface', parseFloat(e.target.value))}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Card Image URL */}
          <div className="space-y-2">
            <Label>Card Image URL</Label>
            <Input
              value={config.cardImage}
              onChange={(e) => setConfig(prev => ({ ...prev, cardImage: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1"
            >
              {isDownloading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download
            </Button>
            
            {navigator.share && (
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            )}

            {onSave && (
              <Button variant="secondary" onClick={handleSave}>
                Save
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SlabPreview;
