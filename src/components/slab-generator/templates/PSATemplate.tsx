import React from 'react';
import { PSA_LABEL_COLORS, PSA_GRADE_NAMES } from '../types';

interface PSATemplateProps {
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

export const PSATemplate: React.FC<PSATemplateProps> = ({
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
  const colors = PSA_LABEL_COLORS[grade] || PSA_LABEL_COLORS['9'];
  const gradeName = PSA_GRADE_NAMES[grade] || grade;
  
  // PSA slab proportions (based on real PSA slabs)
  const labelHeight = height * 0.22;
  const cardWindowY = labelHeight + 8;
  const cardWindowHeight = height - labelHeight - 24;
  const cardWindowWidth = width - 24;
  const cardWindowX = 12;
  
  const isGemMint = grade === '10';
  const isAuthentic = grade === 'Authentic';
  const isAltered = grade === 'Altered';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: 'Arial, sans-serif' }}
    >
      {/* Slab outer shell - clear plastic effect */}
      <defs>
        <linearGradient id="slabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="psaLabelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.background} />
          <stop offset="100%" stopColor={colors.background} style={{ filter: 'brightness(0.8)' }} />
        </linearGradient>
        <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
        <clipPath id="cardClip">
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
        fill="url(#slabGradient)"
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
        fill={colors.background}
      />

      {/* PSA Logo area */}
      <g transform={`translate(16, 16)`}>
        {/* PSA text logo */}
        <text
          x="0"
          y="20"
          fontSize="24"
          fontWeight="bold"
          fill={colors.text}
          fontFamily="Arial Black, sans-serif"
        >
          PSA
        </text>
        
        {/* Certification text */}
        <text
          x="0"
          y="34"
          fontSize="7"
          fill={colors.text}
          opacity="0.9"
        >
          PROFESSIONAL SPORTS AUTHENTICATOR
        </text>
      </g>

      {/* Grade circle/badge */}
      <g transform={`translate(${width - 60}, 20)`}>
        <circle
          cx="24"
          cy="24"
          r="24"
          fill={isGemMint ? colors.accent : colors.text}
          stroke={colors.text}
          strokeWidth="2"
        />
        <text
          x="24"
          y={grade.length > 2 ? "22" : "28"}
          fontSize={grade.length > 2 ? "12" : "18"}
          fontWeight="bold"
          fill={isGemMint ? '#1e3a8a' : colors.background}
          textAnchor="middle"
          fontFamily="Arial Black, sans-serif"
        >
          {grade}
        </text>
        {grade.length <= 2 && (
          <text
            x="24"
            y="38"
            fontSize="6"
            fontWeight="bold"
            fill={isGemMint ? '#1e3a8a' : colors.background}
            textAnchor="middle"
          >
            {gradeName}
          </text>
        )}
      </g>

      {/* Card information area */}
      <g transform={`translate(16, ${labelHeight - 32})`}>
        {/* Year and Set */}
        <text
          x="0"
          y="0"
          fontSize="9"
          fill={colors.text}
          fontWeight="bold"
        >
          {year ? `${year} ` : ''}{setName}
        </text>
        
        {/* Card Name */}
        <text
          x="0"
          y="12"
          fontSize="10"
          fill={colors.text}
          fontWeight="bold"
        >
          {cardName.length > 30 ? cardName.substring(0, 30) + '...' : cardName}
        </text>
        
        {/* Card Number */}
        {cardNumber && (
          <text
            x="0"
            y="24"
            fontSize="8"
            fill={colors.text}
            opacity="0.9"
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
        filter="url(#innerShadow)"
      />

      {/* Card image */}
      <image
        x={cardWindowX + 4}
        y={cardWindowY + 4}
        width={cardWindowWidth - 8}
        height={cardWindowHeight - 8}
        href={cardImage}
        preserveAspectRatio="xMidYMid meet"
        clipPath="url(#cardClip)"
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

      {/* Certification number at bottom */}
      <text
        x={width / 2}
        y={height - 6}
        fontSize="8"
        fill="#64748b"
        textAnchor="middle"
        fontFamily="monospace"
      >
        Cert #{certNumber}
      </text>

      {/* Holographic effect overlay (subtle) */}
      <rect
        x="8"
        y="8"
        width={width - 16}
        height={labelHeight}
        rx="4"
        fill="url(#holoGradient)"
        opacity="0.1"
      />
      
      <defs>
        <linearGradient id="holoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff0000" />
          <stop offset="25%" stopColor="#00ff00" />
          <stop offset="50%" stopColor="#0000ff" />
          <stop offset="75%" stopColor="#ff00ff" />
          <stop offset="100%" stopColor="#ffff00" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default PSATemplate;
