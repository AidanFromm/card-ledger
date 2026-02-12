# Slab Generator

Professional grading slab mockup generator for trading cards. Supports PSA, BGS, CGC, and SGC slabs with accurate styling.

## Features

- **PSA Slabs**: All grades 1-10 with half grades, plus Authentic and Altered
  - Blue label for Gem Mint 10
  - Red label for all other grades
  - Yellow/Gold label for Authentic
  - Purple label for Altered
  
- **BGS (Beckett) Slabs**: Grades 1-10 with subgrades
  - Black label for Pristine 10
  - Gold label for Gem Mint 9.5
  - Silver/white label for 9 and below
  - Full subgrades: Centering, Corners, Edges, Surface
  
- **CGC Slabs**: Grades 1-10 with subgrades
  - Teal/green color scheme
  - Gold badge for Perfect 10
  - Full subgrades support
  
- **SGC Slabs**: Grades 1-10
  - "Tuxedo" black and white design
  - Gold accent for 10s
  - Clean modern look

## Usage

### Basic Component Usage

```tsx
import { SlabGenerator } from '@/components/slab-generator';

function MyComponent() {
  const config = {
    cardImage: 'https://example.com/card.jpg',
    gradingCompany: 'PSA',
    grade: '10',
    cardName: 'Charizard',
    setName: 'Base Set',
    year: '1999',
    certNumber: '12345678',
    cardNumber: '4',
  };

  return <SlabGenerator config={config} width={300} height={450} />;
}
```

### Using the Hook

```tsx
import { useSlabGenerator } from '@/components/slab-generator';

function MyComponent() {
  const { generate, download, createConfig, isGenerating } = useSlabGenerator();

  const handleGenerate = async () => {
    const config = createConfig({
      cardImage: 'https://example.com/card.jpg',
      gradingCompany: 'PSA',
      grade: '10',
      cardName: 'Charizard',
      setName: 'Base Set',
      certNumber: '12345678',
    });

    // Generate as blob
    const blob = await generate(config);
    
    // Or download directly
    await download(config, 'my-slab');
  };

  return (
    <button onClick={handleGenerate} disabled={isGenerating}>
      Generate Slab
    </button>
  );
}
```

### Direct Utility Functions

```tsx
import { generateSlabImage, generateSlabDataURL, downloadSlabImage } from '@/components/slab-generator';

// Generate as Blob
const blob = await generateSlabImage(config);

// Generate as Data URL (base64)
const dataUrl = await generateSlabDataURL(config);

// Download directly
await downloadSlabImage(config, 'filename');
```

### Interactive Preview Component

```tsx
import { SlabPreview } from '@/components/slab-generator';

function MyComponent() {
  return (
    <SlabPreview
      initialConfig={{
        cardImage: 'https://example.com/card.jpg',
        gradingCompany: 'PSA',
        grade: '10',
        cardName: 'Charizard',
        setName: 'Base Set',
        certNumber: '12345678',
      }}
      onSave={(config, blob) => {
        // Handle save
        console.log('Saved:', config, blob);
      }}
    />
  );
}
```

## Configuration Options

### SlabConfig

| Property | Type | Description |
|----------|------|-------------|
| cardImage | string | URL or data URL of the card image |
| gradingCompany | 'PSA' \| 'BGS' \| 'CGC' \| 'SGC' | Grading company |
| grade | string | Grade value (e.g., '10', '9.5', 'Authentic') |
| cardName | string | Name of the card |
| setName | string | Name of the set |
| year | string? | Year of the set |
| certNumber | string | Certification number |
| cardNumber | string? | Card number in the set |
| subgrades | BGSSubgrades \| CGCSubgrades? | Subgrades for BGS/CGC |

### BGSSubgrades / CGCSubgrades

```ts
interface BGSSubgrades {
  centering: number;
  corners: number;
  edges: number;
  surface: number;
}
```

## Export Options

```ts
interface GenerateOptions {
  width?: number;   // Default: 300
  height?: number;  // Default: 450
  format?: 'png' | 'jpeg';  // Default: 'png'
  quality?: number; // Default: 0.95
}
```

## Grade Mappings

### PSA Grades
- 10: GEM MINT (Blue Label)
- 9.5: MINT+
- 9: MINT
- 8.5: NM-MT+
- 8: NM-MT
- 7.5: NM+
- 7: NM
- 6.5: EX-MT+
- 6: EX-MT
- 5.5: EX+
- 5: EX
- 4.5: VG-EX+
- 4: VG-EX
- 3.5: VG+
- 3: VG
- 2.5: GOOD+
- 2: GOOD
- 1.5: FAIR
- 1: POOR
- Authentic: AUTHENTIC (Yellow Label)
- Altered: ALTERED (Purple Label)

### BGS/SGC Grades
- 10: PRISTINE / GEM MINT
- 9.5: GEM MINT
- 9: MINT
- 8: NM-MT
- etc.

## Architecture

```
slab-generator/
├── index.ts              # Main exports
├── types.ts              # Type definitions and color mappings
├── SlabGenerator.tsx     # Main React component
├── SlabPreview.tsx       # Interactive preview component
├── useSlabGenerator.ts   # React hook
├── generateSlabImage.ts  # Utility functions (SVG to PNG)
└── templates/
    ├── PSATemplate.tsx   # PSA slab SVG template
    ├── BGSTemplate.tsx   # BGS slab SVG template
    ├── CGCTemplate.tsx   # CGC slab SVG template
    └── SGCTemplate.tsx   # SGC slab SVG template
```
