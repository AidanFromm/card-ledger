import { motion } from "framer-motion";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const Logo = ({ size = 32, showText = true, className = "" }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <motion.div
        whileHover={{ scale: 1.05, rotate: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="relative"
      >
        {/* Card stack icon */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-md"
        >
          <defs>
            <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#e0e7ff" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="cardGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="cardGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {/* Back card */}
          <rect
            x="4"
            y="2"
            width="16"
            height="22"
            rx="2.5"
            fill="url(#cardGradient3)"
          />
          {/* Middle card */}
          <rect
            x="8"
            y="5"
            width="16"
            height="22"
            rx="2.5"
            fill="url(#cardGradient2)"
          />
          {/* Front card */}
          <rect
            x="12"
            y="8"
            width="16"
            height="22"
            rx="2.5"
            fill="url(#cardGradient)"
          />
          {/* Dollar sign on front card */}
          <text
            x="20"
            y="22"
            textAnchor="middle"
            fill="#3b82f6"
            fontSize="10"
            fontWeight="bold"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            $
          </text>
        </svg>
      </motion.div>

      {showText && (
        <span className="text-white font-bold text-lg tracking-tight">
          Card Ledger
        </span>
      )}
    </div>
  );
};

export default Logo;
