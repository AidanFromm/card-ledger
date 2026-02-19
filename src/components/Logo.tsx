import { motion } from "framer-motion";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  animated?: boolean;
}

export const Logo = ({ size = 32, showText = true, className = "", animated = false }: LogoProps) => {
  const iconSize = size;
  const fontSize = Math.max(size * 0.45, 14);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <motion.div
        whileHover={{ scale: 1.05, rotate: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="relative"
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          <defs>
            <linearGradient id="logoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0074fb" />
              <stop offset="100%" stopColor="#0058c4" />
            </linearGradient>
            <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3d9bff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0074fb" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="logoGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6db8ff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3d9bff" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="logoHolo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.15" />
            </linearGradient>
          </defs>
          
          {/* Back card (fanned) */}
          <g transform="rotate(-12 24 28)">
            <rect x="10" y="6" width="22" height="30" rx="3.5" fill="url(#logoGrad3)" />
          </g>
          
          {/* Middle card (fanned) */}
          <g transform="rotate(-4 24 28)">
            <rect x="11" y="7" width="22" height="30" rx="3.5" fill="url(#logoGrad2)" />
          </g>
          
          {/* Front card (main) */}
          <rect x="13" y="8" width="22" height="30" rx="3.5" fill="url(#logoGrad1)" />
          
          {/* Holographic shine on front card */}
          <rect x="13" y="8" width="22" height="30" rx="3.5" fill="url(#logoHolo)" />
          
          {/* Slab/grading label area on front card */}
          <rect x="16" y="11" width="16" height="3" rx="1.5" fill="white" fillOpacity="0.25" />
          
          {/* Dollar sign — value tracking */}
          <text
            x="24"
            y="28"
            textAnchor="middle"
            fill="white"
            fontSize="13"
            fontWeight="800"
            fontFamily="-apple-system, 'SF Pro Display', system-ui, sans-serif"
          >
            $
          </text>
          
          {/* Bottom label bar */}
          <rect x="17" y="32" width="14" height="2.5" rx="1.25" fill="white" fillOpacity="0.2" />
        </svg>

        {/* Animated glow ring */}
        {animated && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(0,116,251,0.3) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>

      {showText && (
        <span
          className="font-bold tracking-tight text-foreground"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.1 }}
        >
          Card<span className="text-primary">Ledger</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
