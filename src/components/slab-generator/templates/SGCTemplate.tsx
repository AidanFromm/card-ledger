import React from 'react';
import { SGC_GRADE_NAMES } from '../types';

interface SGCTemplateProps {
  cardImage: string;
  grade: string;
  cardName: string;
  setName: string;
  year?: string;
  certNumber: string;
  cardNumber?: string;
  width?: number;
  height?: number;
}

export const SGCTemplate: React.FC<SGCTemplateProps> = ({
  cardImage,
  grade,
  cardName,
  setName,
  year,
  certNumber,
  cardNumber,
  width = 300,
  height = 450,
}) => {
  const gradeName = SGC_GRADE_NAMES[grade] || grade;
  const isPristine = parseFloat(grade) === 10;
  
  // SGC slab proportions - Tuxedo style
  const labelHeight = height * 0.20;
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
        {/* SGC uses a more matte, premium look */}
        <linearGradient id="sgcSlabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        
        {/* Tuxedo black gradient */}
        <linearGradient id="sgcTuxedoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2d2d2d" />
          <stop offset="50%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0f0f0f" />
        </linearGradient>
        
        {/* Gold accent for 10s */}
        <linearGradient id="sgcGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        <filter id="sgcInnerShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
        
        <clipPath id="sgcCardClip">
          <rect x={cardWindowX + 4} y={cardWindowY + 4} width={cardWindowWidth - 8} height={cardWindowHeight - 8} rx="2" />
        </clipPath>
      </defs>

      {/* Outer slab body - clean white */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx="8"
        ry="8"
        fill="url(#sgcSlabGradient)"
        stroke="#e2e8f0"
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
        stroke="#e2e8f0"
        strokeWidth="2"
      />

      {/* Tuxedo Label - black background */}
      <rect
        x="8"
        y="8"
        width={width - 16}
        height={labelHeight}
        rx="4"
        ry="4"
        fill="url(#sgcTuxedoGradient)"
      />

      {/* SGC Logo - left side */}
      <g transform={`translate(16, 14)`}>
        {/* SGC letters in gold/white */}
        <text
          x="0"
          y="24"
          fontSize="28"
          fontWeight="bold"
          fill={isPristine ? 'url(#sgcGoldGradient)' : '#ffffff'}
          fontFamily="Georgia, serif"
          letterSpacing="2"
        >
          SGC
        </text>
        
        {/* Tagline */}
        <text
          x="0"
          y="38"
          fontSize="6"
          fill="#9ca3af"
          letterSpacing="1"
        >
          SPORTSCARD GUARANTY
        </text>
      </g>

      {/* Grade display - prominent right side */}
      <g transform={`translate(${width - 85}, 10)`}>
        {/* Grade background */}
        <rect
          x="0"
          y="0"
          width="70"
          height="48"
          rx="4"
          fill={isPristine ? 'url(#sgcGoldGradient)' : '#ffffff'}
        />
        
        {/* Grade number */}
        <text
          x="35"
          y="32"
          fontSize="28"
          fontWeight="bold"
          fill={isPristine ? '#1a1a1a' : '#1a1a1a'}
          textAnchor="middle"
          fontFamily="Georgia, serif"
        >
          {grade}
        </text>
        
        {/* Grade name below */}
        <text
          x="35"
          y="44"
          fontSize="7"
          fontWeight="bold"
          fill={isPristine ? '#1a1a1a' : '#4b5563'}
          textAnchor="middle"
        >
          {gradeName}
        </text>
      </g>

      {/* Card information bar - below label */}
      <g transform={`translate(16, ${labelHeight - 18})`}>
        {/* Year and Set - small text */}
        <text
          x="0"
          y="0"
          fontSize="7"
          fill="#9ca3af"
        >
          {year ? `${year} ` : ''}{setName}
        </text>
        
        {/* Card Name - bold */}
        <text
          x="0"
          y="12"
          fontSize="9"
          fill="#ffffff"
          fontWeight="bold"
        >
          {cardName.length > 30 ? cardName.substring(0, 30) + '...' : cardName}
        </text>
      </g>

      {/* Card window background - black */}
      <rect
        x={cardWindowX}
        y={cardWindowY}
        width={cardWindowWidth}
        height={cardWindowHeight}
        rx="4"
        fill="#0a0a0a"
        filter="url(#sgcInnerShadow)"
      />

      {/* Card image */}
      <image
        x={cardWindowX + 4}
        y={cardWindowY + 4}
        width={cardWindowWidth - 8}
        height={cardWindowHeight - 8}
        href={cardImage}
        preserveAspectRatio="xMidYMid meet"
        clipPath="url(#sgcCardClip)"
      />

      {/* Card window border - subtle */}
      <rect
        x={cardWindowX}
        y={cardWindowY}
        width={cardWindowWidth}
        height={cardWindowHeight}
        rx="4"
        fill="none"
        stroke="#2d2d2d"
        strokeWidth="2"
      />

      {/* Card number overlay if exists */}
      {cardNumber && (
        <g transform={`translate(${cardWindowX + 8}, ${cardWindowY + cardWindowHeight - 20})`}>
          <rect
            x="0"
            y="0"
            width="50"
            height="14"
            rx="2"
            fill="rgba(0,0,0,0.7)"
          />
          <text
            x="25"
            y="10"
            fontSize="8"
            fill="#ffffff"
            textAnchor="middle"
            fontFamily="monospace"
          >
            #{cardNumber}
          </text>
        </g>
      )}

      {/* Certification number - bottom center */}
      <g transform={`translate(${width / 2}, ${height - 8})`}>
        <text
          x="0"
          y="0"
          fontSize="8"
          fill="#64748b"
          textAnchor="middle"
          fontFamily="monospace"
        >
          SGC #{certNumber}
        </text>
      </g>

      {/* Bottom branding bar */}
      <rect
        x="8"
        y={height - 18}
        width={width - 16}
        height="10"
        rx="2"
        fill="#1a1a1a"
        opacity="0.3"
      />
    </svg>
  );
};

export default SGCTemplate;
