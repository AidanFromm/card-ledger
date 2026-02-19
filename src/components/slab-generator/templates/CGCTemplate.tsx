import React from 'react';
import { CGC_LABEL_COLORS, CGCSubgrades } from '../types';

interface CGCTemplateProps {
  cardImage: string;
  grade: string;
  cardName: string;
  setName: string;
  year?: string;
  certNumber: string;
  cardNumber?: string;
  subgrades?: CGCSubgrades;
  width?: number;
  height?: number;
}

// CGC Grade names
const CGC_GRADE_NAMES: Record<string, string> = {
  '10': 'PRISTINE',
  '9.5': 'GEM MINT',
  '9': 'MINT',
  '8.5': 'NM/MINT+',
  '8': 'NM/MINT',
  '7.5': 'NM+',
  '7': 'NM',
  '6.5': 'FN/VF+',
  '6': 'FN/VF',
  '5': 'FN',
  '4': 'VG',
  '3': 'G/VG',
  '2': 'GOOD',
  '1': 'FR/GOOD',
};

export const CGCTemplate: React.FC<CGCTemplateProps> = ({
  cardImage,
  grade,
  cardName,
  setName,
  year,
  certNumber,
  cardNumber,
  subgrades,
  width = 300,
  height = 450,
}) => {
  const colors = CGC_LABEL_COLORS[grade] || CGC_LABEL_COLORS['9'];
  const gradeName = CGC_GRADE_NAMES[grade] || grade;
  
  const isPerfect = parseFloat(grade) === 10;
  
  // CGC slab proportions
  const labelHeight = height * 0.24;
  const cardWindowY = labelHeight + 8;
  const cardWindowHeight = height - labelHeight - 24;
  const cardWindowWidth = width - 24;
  const cardWindowX = 12;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      <defs>
        <linearGradient id="cgcSlabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="50%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        
        {/* CGC Teal gradient */}
        <linearGradient id="cgcLabelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="50%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        
        {/* Perfect 10 special gradient */}
        <linearGradient id="cgcPerfectGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        <filter id="cgcInnerShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
        
        <clipPath id="cgcCardClip">
          <rect x={cardWindowX + 4} y={cardWindowY + 4} width={cardWindowWidth - 8} height={cardWindowHeight - 8} rx="2" />
        </clipPath>
      </defs>

      {/* Outer slab body */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx="8"
        ry="8"
        fill="url(#cgcSlabGradient)"
        stroke="#94a3b8"
        strokeWidth="1"
      />

      {/* Inner bezel */}
      <rect
        x="4"
        y="4"
        width={width - 8}
        height={height - 8}
        rx="6"
        ry="6"
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="2"
      />

      {/* Label background */}
      <rect
        x="8"
        y="8"
        width={width - 16}
        height={labelHeight}
        rx="4"
        ry="4"
        fill="url(#cgcLabelGradient)"
      />

      {/* CGC Logo area */}
      <g transform={`translate(16, 14)`}>
        {/* CGC Shield/Logo simulation */}
        <rect
          x="0"
          y="0"
          width="50"
          height="32"
          rx="4"
          fill="#ffffff"
          opacity="0.95"
        />
        <text
          x="25"
          y="22"
          fontSize="18"
          fontWeight="bold"
          fill="#0d9488"
          textAnchor="middle"
          fontFamily="Arial Black, sans-serif"
        >
          CGC
        </text>
        
        {/* Trading Cards subtitle */}
        <text
          x="58"
          y="12"
          fontSize="7"
          fill="#ffffff"
          opacity="0.9"
        >
          TRADING CARDS
        </text>
        <text
          x="58"
          y="22"
          fontSize="6"
          fill="#e5f5f3"
        >
          CERTIFIED GUARANTY COMPANY
        </text>
      </g>

      {/* Grade display */}
      <g transform={`translate(${width - 75}, 12)`}>
        <rect
          x="0"
          y="0"
          width="60"
          height="36"
          rx="4"
          fill={isPerfect ? 'url(#cgcPerfectGradient)' : '#ffffff'}
          stroke={isPerfect ? '#b45309' : '#0d9488'}
          strokeWidth="2"
        />
        <text
          x="30"
          y="24"
          fontSize="20"
          fontWeight="bold"
          fill={isPerfect ? '#ffffff' : '#0d9488'}
          textAnchor="middle"
          fontFamily="Arial Black, sans-serif"
        >
          {grade}
        </text>
      </g>

      {/* Grade name */}
      <text
        x={width - 45}
        y="56"
        fontSize="8"
        fontWeight="bold"
        fill="#ffffff"
        textAnchor="middle"
      >
        {gradeName}
      </text>

      {/* Subgrades section */}
      {subgrades && (
        <g transform={`translate(${width - 75}, 62)`}>
          <rect
            x="0"
            y="0"
            width="60"
            height="34"
            rx="2"
            fill="rgba(255,255,255,0.15)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.5"
          />
          
          {[
            { label: 'Centering', value: subgrades.centering, y: 9 },
            { label: 'Surface', value: subgrades.surface, y: 17 },
            { label: 'Corners', value: subgrades.corners, y: 25 },
            { label: 'Edges', value: subgrades.edges, y: 33 },
          ].map((sub, i) => (
            <g key={i}>
              <text
                x="4"
                y={sub.y}
                fontSize="5"
                fill="#e5f5f3"
              >
                {sub.label}
              </text>
              <text
                x="56"
                y={sub.y}
                fontSize="6"
                fontWeight="bold"
                fill="#ffffff"
                textAnchor="end"
              >
                {sub.value.toFixed(1)}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* Card information */}
      <g transform={`translate(16, ${labelHeight - 30})`}>
        {/* Year and Set */}
        <text
          x="0"
          y="0"
          fontSize="8"
          fill="#e5f5f3"
        >
          {year ? `${year} ` : ''}{setName}
        </text>
        
        {/* Card Name */}
        <text
          x="0"
          y="12"
          fontSize="10"
          fill="#ffffff"
          fontWeight="bold"
        >
          {cardName.length > 28 ? cardName.substring(0, 28) + '...' : cardName}
        </text>
        
        {/* Card Number */}
        {cardNumber && (
          <text
            x="0"
            y="24"
            fontSize="7"
            fill="#d1faf5"
          >
            #{cardNumber}
          </text>
        )}
      </g>

      {/* Card window background */}
      <rect
        x={cardWindowX}
        y={cardWindowY}
        width={cardWindowWidth}
        height={cardWindowHeight}
        rx="4"
        fill="#1a1a1a"
        filter="url(#cgcInnerShadow)"
      />

      {/* Card image */}
      <image
        x={cardWindowX + 4}
        y={cardWindowY + 4}
        width={cardWindowWidth - 8}
        height={cardWindowHeight - 8}
        href={cardImage}
        preserveAspectRatio="xMidYMid meet"
        clipPath="url(#cgcCardClip)"
      />

      {/* Card window inner border */}
      <rect
        x={cardWindowX}
        y={cardWindowY}
        width={cardWindowWidth}
        height={cardWindowHeight}
        rx="4"
        fill="none"
        stroke="#374151"
        strokeWidth="2"
      />

      {/* Certification number */}
      <text
        x={width / 2}
        y={height - 6}
        fontSize="8"
        fill="#64748b"
        textAnchor="middle"
        fontFamily="monospace"
      >
        CGC #{certNumber}
      </text>
    </svg>
  );
};

export default CGCTemplate;
