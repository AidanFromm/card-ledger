import React from 'react';
import { BGS_LABEL_COLORS, BGS_GRADE_NAMES, BGSSubgrades } from '../types';

interface BGSTemplateProps {
  cardImage: string;
  grade: string;
  cardName: string;
  setName: string;
  year?: string;
  certNumber: string;
  cardNumber?: string;
  subgrades?: BGSSubgrades;
  width?: number;
  height?: number;
}

export const BGSTemplate: React.FC<BGSTemplateProps> = ({
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
  const colors = BGS_LABEL_COLORS[grade] || BGS_LABEL_COLORS['9'];
  const gradeName = BGS_GRADE_NAMES[grade] || grade;
  
  const isPristine = grade === '10';
  const isGemMint = grade === '9.5';
  
  // BGS slab proportions
  const labelHeight = height * 0.26;
  const cardWindowY = labelHeight + 8;
  const cardWindowHeight = height - labelHeight - 24;
  const cardWindowWidth = width - 24;
  const cardWindowX = 12;

  // Determine label style
  const labelStyle = isPristine ? 'black' : isGemMint ? 'gold' : 'silver';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      <defs>
        <linearGradient id="bgsSlabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="50%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        
        {/* Black label gradient */}
        <linearGradient id="blackLabelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="50%" stopColor="#0f0f0f" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
        
        {/* Gold label gradient */}
        <linearGradient id="goldLabelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="25%" stopColor="#f4e4a6" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="75%" stopColor="#c5a028" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
        
        {/* Silver label gradient */}
        <linearGradient id="silverLabelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8e8e8" />
          <stop offset="25%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#d4d4d4" />
          <stop offset="75%" stopColor="#c0c0c0" />
          <stop offset="100%" stopColor="#a8a8a8" />
        </linearGradient>

        <filter id="bgsInnerShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
        
        <clipPath id="bgsCardClip">
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
        fill="url(#bgsSlabGradient)"
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

      {/* Label background based on grade */}
      <rect
        x="8"
        y="8"
        width={width - 16}
        height={labelHeight}
        rx="4"
        ry="4"
        fill={
          labelStyle === 'black' 
            ? 'url(#blackLabelGradient)' 
            : labelStyle === 'gold' 
              ? 'url(#goldLabelGradient)' 
              : 'url(#silverLabelGradient)'
        }
        stroke={labelStyle === 'gold' ? '#8b6914' : labelStyle === 'black' ? '#333' : '#999'}
        strokeWidth="1"
      />

      {/* Beckett Logo area */}
      <g transform={`translate(16, 14)`}>
        {/* BECKETT text */}
        <text
          x="0"
          y="16"
          fontSize="16"
          fontWeight="bold"
          fill={labelStyle === 'silver' ? '#1f2937' : '#ffffff'}
          fontFamily="Arial Black, sans-serif"
          letterSpacing="1"
        >
          BECKETT
        </text>
        
        {/* Grading Services */}
        <text
          x="0"
          y="28"
          fontSize="7"
          fill={labelStyle === 'silver' ? '#374151' : '#e5e7eb'}
        >
          GRADING SERVICES
        </text>
      </g>

      {/* Grade display - large */}
      <g transform={`translate(${width - 80}, 12)`}>
        <rect
          x="0"
          y="0"
          width="64"
          height="40"
          rx="4"
          fill={labelStyle === 'black' ? '#fbbf24' : labelStyle === 'gold' ? '#1f2937' : '#1f2937'}
        />
        <text
          x="32"
          y="28"
          fontSize="22"
          fontWeight="bold"
          fill={labelStyle === 'black' ? '#000000' : '#ffffff'}
          textAnchor="middle"
          fontFamily="Arial Black, sans-serif"
        >
          {grade}
        </text>
        <text
          x="32"
          y="38"
          fontSize="6"
          fontWeight="bold"
          fill={labelStyle === 'black' ? '#000000' : '#e5e7eb'}
          textAnchor="middle"
        >
          {gradeName}
        </text>
      </g>

      {/* Subgrades section */}
      {subgrades && (
        <g transform={`translate(${width - 80}, 56)`}>
          <rect
            x="0"
            y="0"
            width="64"
            height="40"
            rx="2"
            fill={labelStyle === 'silver' ? '#f3f4f6' : 'rgba(255,255,255,0.1)'}
            stroke={labelStyle === 'silver' ? '#d1d5db' : 'rgba(255,255,255,0.2)'}
            strokeWidth="0.5"
          />
          
          {/* Subgrade labels */}
          {[
            { label: 'C', value: subgrades.centering, y: 8 },
            { label: 'E', value: subgrades.edges, y: 16 },
            { label: 'Co', value: subgrades.corners, y: 24 },
            { label: 'S', value: subgrades.surface, y: 32 },
          ].map((sub, i) => (
            <g key={i}>
              <text
                x="6"
                y={sub.y}
                fontSize="6"
                fill={labelStyle === 'silver' ? '#374151' : '#e5e7eb'}
              >
                {sub.label}
              </text>
              <text
                x="58"
                y={sub.y}
                fontSize="6"
                fontWeight="bold"
                fill={labelStyle === 'silver' ? '#1f2937' : '#ffffff'}
                textAnchor="end"
              >
                {sub.value.toFixed(1)}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* Card information */}
      <g transform={`translate(16, ${labelHeight - 36})`}>
        {/* Year and Set */}
        <text
          x="0"
          y="0"
          fontSize="8"
          fill={labelStyle === 'silver' ? '#374151' : '#e5e7eb'}
        >
          {year ? `${year} ` : ''}{setName}
        </text>
        
        {/* Card Name */}
        <text
          x="0"
          y="12"
          fontSize="9"
          fill={labelStyle === 'silver' ? '#1f2937' : '#ffffff'}
          fontWeight="bold"
        >
          {cardName.length > 25 ? cardName.substring(0, 25) + '...' : cardName}
        </text>
        
        {/* Card Number */}
        {cardNumber && (
          <text
            x="0"
            y="24"
            fontSize="7"
            fill={labelStyle === 'silver' ? '#6b7280' : '#d1d5db'}
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
        filter="url(#bgsInnerShadow)"
      />

      {/* Card image */}
      <image
        x={cardWindowX + 4}
        y={cardWindowY + 4}
        width={cardWindowWidth - 8}
        height={cardWindowHeight - 8}
        href={cardImage}
        preserveAspectRatio="xMidYMid meet"
        clipPath="url(#bgsCardClip)"
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
        BGS #{certNumber}
      </text>
    </svg>
  );
};

export default BGSTemplate;
