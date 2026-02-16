import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Package, TrendingUp, Search, Plus, Sparkles, Trophy, Target, Bell, Users, BarChart3, Wallet, Gift, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  illustration?: "cards" | "search" | "sales" | "achievements" | "goals" | "alerts" | "wishlist" | "trades" | "leaderboard" | "grading" | "none";
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
}

// Card stack illustration SVG
const CardStackIllustration = () => (
  <motion.svg
    width="200"
    height="160"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
  >
    {/* Background glow */}
    <motion.ellipse
      cx="100"
      cy="140"
      rx="80"
      ry="15"
      className="fill-primary/5"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    />
    
    {/* Back card */}
    <motion.g
      initial={{ x: -10, y: 10, rotate: -10, opacity: 0 }}
      animate={{ x: 0, y: 0, rotate: -8, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <rect
        x="40"
        y="25"
        width="70"
        height="95"
        rx="6"
        className="fill-secondary stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="47"
        y="32"
        width="56"
        height="40"
        rx="3"
        className="fill-muted/50"
      />
      <rect x="47" y="78" width="40" height="4" rx="2" className="fill-muted" />
      <rect x="47" y="86" width="30" height="3" rx="1.5" className="fill-muted/50" />
    </motion.g>
    
    {/* Middle card */}
    <motion.g
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <rect
        x="65"
        y="20"
        width="70"
        height="95"
        rx="6"
        className="fill-card stroke-border"
        strokeWidth="1.5"
      />
      <rect
        x="72"
        y="27"
        width="56"
        height="40"
        rx="3"
        className="fill-primary/10"
      />
      <rect x="72" y="73" width="45" height="4" rx="2" className="fill-muted" />
      <rect x="72" y="81" width="35" height="3" rx="1.5" className="fill-muted/50" />
      {/* Star sparkle */}
      <motion.path
        d="M115 35 L117 40 L122 40 L118 44 L120 49 L115 46 L110 49 L112 44 L108 40 L113 40 Z"
        className="fill-primary/60"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.8, type: "spring" }}
      />
    </motion.g>
    
    {/* Front card (highlighted) */}
    <motion.g
      initial={{ x: 10, y: -10, rotate: 10, opacity: 0 }}
      animate={{ x: 0, y: 0, rotate: 6, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <rect
        x="90"
        y="15"
        width="70"
        height="95"
        rx="6"
        className="fill-card stroke-primary/50"
        strokeWidth="2"
      />
      <rect
        x="97"
        y="22"
        width="56"
        height="40"
        rx="3"
        className="fill-gradient-to-br from-primary/20 to-primary/5"
      />
      {/* Card image placeholder with gradient */}
      <defs>
        <linearGradient id="cardGradient" x1="97" y1="22" x2="153" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="97" y="22" width="56" height="40" rx="3" fill="url(#cardGradient)" />
      
      {/* Text lines */}
      <rect x="97" y="68" width="50" height="4" rx="2" className="fill-foreground/20" />
      <rect x="97" y="76" width="38" height="3" rx="1.5" className="fill-muted-foreground/30" />
      
      {/* Price badge */}
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.9, type: "spring" }}
      >
        <rect x="97" y="85" width="30" height="14" rx="4" className="fill-primary/20" />
        <text x="112" y="95" textAnchor="middle" className="fill-primary text-[8px] font-bold">
          $0.00
        </text>
      </motion.g>
    </motion.g>
    
    {/* Floating sparkles */}
    <motion.circle
      cx="170"
      cy="30"
      r="3"
      className="fill-primary/40"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1, 0.8, 1], opacity: [0, 1, 0.8, 1] }}
      transition={{ duration: 1.5, delay: 1, repeat: Infinity, repeatDelay: 2 }}
    />
    <motion.circle
      cx="30"
      cy="50"
      r="2"
      className="fill-primary/30"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1, 0.8, 1], opacity: [0, 1, 0.8, 1] }}
      transition={{ duration: 1.5, delay: 1.3, repeat: Infinity, repeatDelay: 2.5 }}
    />
    <motion.circle
      cx="180"
      cy="90"
      r="2.5"
      className="fill-primary/35"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1, 0.8, 1], opacity: [0, 1, 0.8, 1] }}
      transition={{ duration: 1.5, delay: 1.6, repeat: Infinity, repeatDelay: 3 }}
    />
  </motion.svg>
);

// Search illustration SVG
const SearchIllustration = () => (
  <motion.svg
    width="160"
    height="140"
    viewBox="0 0 160 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Magnifying glass */}
    <motion.circle
      cx="65"
      cy="60"
      r="35"
      className="stroke-muted-foreground/30"
      strokeWidth="8"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    />
    <motion.line
      x1="92"
      y1="88"
      x2="125"
      y2="121"
      className="stroke-muted-foreground/30"
      strokeWidth="10"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, delay: 0.8 }}
    />
    
    {/* Card inside magnifier */}
    <motion.rect
      x="50"
      y="42"
      width="30"
      height="40"
      rx="3"
      className="fill-muted/50 stroke-muted-foreground/20"
      strokeWidth="1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 1 }}
    />
    <motion.rect
      x="54"
      y="46"
      width="22"
      height="16"
      rx="2"
      className="fill-primary/10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 1.1 }}
    />
    <motion.rect
      x="54"
      y="66"
      width="16"
      height="2"
      rx="1"
      className="fill-muted-foreground/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 1.2 }}
    />
    
    {/* Question marks */}
    <motion.text
      x="125"
      y="45"
      className="fill-muted-foreground/30 text-lg font-bold"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 1.3 }}
    >
      ?
    </motion.text>
    <motion.text
      x="20"
      y="95"
      className="fill-muted-foreground/20 text-sm font-bold"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 1.5 }}
    >
      ?
    </motion.text>
  </motion.svg>
);

// Sales/trending illustration
const SalesIllustration = () => (
  <motion.svg
    width="180"
    height="140"
    viewBox="0 0 180 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Chart axes */}
    <motion.line
      x1="30"
      y1="110"
      x2="150"
      y2="110"
      className="stroke-muted-foreground/30"
      strokeWidth="2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    />
    <motion.line
      x1="30"
      y1="110"
      x2="30"
      y2="20"
      className="stroke-muted-foreground/30"
      strokeWidth="2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    />
    
    {/* Trend line going up */}
    <motion.path
      d="M40 90 L70 70 L100 75 L130 40"
      className="stroke-primary/60"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
    />
    
    {/* Data points */}
    {[
      { cx: 40, cy: 90, delay: 0.6 },
      { cx: 70, cy: 70, delay: 0.7 },
      { cx: 100, cy: 75, delay: 0.8 },
      { cx: 130, cy: 40, delay: 0.9 },
    ].map((point, i) => (
      <motion.circle
        key={i}
        cx={point.cx}
        cy={point.cy}
        r="5"
        className="fill-primary/80"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: point.delay, type: "spring" }}
      />
    ))}
    
    {/* Arrow at end */}
    <motion.path
      d="M130 40 L140 35 M130 40 L140 50"
      className="stroke-primary/60"
      strokeWidth="2"
      strokeLinecap="round"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 1 }}
    />
    
    {/* Dollar signs */}
    <motion.text
      x="150"
      y="25"
      className="fill-primary/40 text-lg font-bold"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 1.1 }}
    >
      $
    </motion.text>
  </motion.svg>
);

// Achievements/Trophy illustration
const AchievementsIllustration = () => (
  <motion.svg
    width="180"
    height="160"
    viewBox="0 0 180 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Trophy base */}
    <motion.rect
      x="60"
      y="125"
      width="60"
      height="15"
      rx="3"
      className="fill-muted/50"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.4, delay: 0.8 }}
    />
    <motion.rect
      x="75"
      y="115"
      width="30"
      height="15"
      className="fill-muted/40"
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.3, delay: 0.7 }}
    />
    
    {/* Trophy cup */}
    <motion.path
      d="M50 30 L50 70 Q50 95 90 95 Q130 95 130 70 L130 30 Z"
      className="fill-amber-400/30 stroke-amber-500/50"
      strokeWidth="3"
      initial={{ pathLength: 0, fillOpacity: 0 }}
      animate={{ pathLength: 1, fillOpacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    />
    
    {/* Trophy handles */}
    <motion.path
      d="M50 40 Q25 40 25 60 Q25 80 50 80"
      className="stroke-amber-500/40"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    />
    <motion.path
      d="M130 40 Q155 40 155 60 Q155 80 130 80"
      className="stroke-amber-500/40"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    />
    
    {/* Star inside trophy */}
    <motion.path
      d="M90 45 L95 60 L110 60 L98 70 L103 85 L90 75 L77 85 L82 70 L70 60 L85 60 Z"
      className="fill-amber-400/60"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: 1, type: "spring" }}
    />
    
    {/* Sparkles */}
    <motion.circle
      cx="35"
      cy="25"
      r="4"
      className="fill-amber-400/50"
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1] }}
      transition={{ duration: 0.5, delay: 1.2, repeat: Infinity, repeatDelay: 2 }}
    />
    <motion.circle
      cx="145"
      cy="35"
      r="3"
      className="fill-amber-400/40"
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1] }}
      transition={{ duration: 0.5, delay: 1.5, repeat: Infinity, repeatDelay: 2.5 }}
    />
    <motion.circle
      cx="160"
      cy="70"
      r="2"
      className="fill-amber-400/30"
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1] }}
      transition={{ duration: 0.5, delay: 1.8, repeat: Infinity, repeatDelay: 3 }}
    />
  </motion.svg>
);

// Goals/Target illustration
const GoalsIllustration = () => (
  <motion.svg
    width="180"
    height="160"
    viewBox="0 0 180 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Target circles */}
    {[60, 45, 30, 15].map((r, i) => (
      <motion.circle
        key={i}
        cx="90"
        cy="80"
        r={r}
        className={i % 2 === 0 ? "fill-red-400/20 stroke-red-400/40" : "fill-white stroke-red-400/40"}
        strokeWidth="2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 + i * 0.1, type: "spring" }}
      />
    ))}
    
    {/* Bullseye */}
    <motion.circle
      cx="90"
      cy="80"
      r="6"
      className="fill-red-500"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.7, type: "spring" }}
    />
    
    {/* Arrow */}
    <motion.g
      initial={{ x: 50, y: -30, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.9, type: "spring" }}
    >
      <line
        x1="90"
        y1="80"
        x2="140"
        y2="30"
        className="stroke-primary"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polygon
        points="145,20 150,35 135,30"
        className="fill-primary"
      />
      {/* Arrow feathers */}
      <line x1="88" y1="82" x2="75" y2="95" className="stroke-primary/60" strokeWidth="2" />
      <line x1="88" y1="82" x2="95" y2="95" className="stroke-primary/60" strokeWidth="2" />
    </motion.g>
    
    {/* Checkmark */}
    <motion.path
      d="M150 60 L155 65 L165 50"
      className="stroke-green-500"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.4, delay: 1.2 }}
    />
  </motion.svg>
);

// Alerts/Bell illustration
const AlertsIllustration = () => (
  <motion.svg
    width="160"
    height="150"
    viewBox="0 0 160 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Bell body */}
    <motion.path
      d="M80 25 C60 25 45 45 45 70 L45 95 L35 105 L125 105 L115 95 L115 70 C115 45 100 25 80 25"
      className="fill-primary/20 stroke-primary/50"
      strokeWidth="3"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    />
    
    {/* Bell clapper */}
    <motion.ellipse
      cx="80"
      cy="115"
      rx="12"
      ry="8"
      className="fill-primary/40"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.5, type: "spring" }}
    />
    
    {/* Bell top */}
    <motion.circle
      cx="80"
      cy="25"
      r="6"
      className="fill-primary/50"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    />
    
    {/* Sound waves */}
    <motion.path
      d="M130 55 Q140 65 130 75"
      className="stroke-primary/30"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: [0, 1, 0], x: 5 }}
      transition={{ duration: 1.5, delay: 0.8, repeat: Infinity }}
    />
    <motion.path
      d="M140 50 Q155 65 140 80"
      className="stroke-primary/20"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: [0, 1, 0], x: 5 }}
      transition={{ duration: 1.5, delay: 1, repeat: Infinity }}
    />
    <motion.path
      d="M30 55 Q20 65 30 75"
      className="stroke-primary/30"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      initial={{ opacity: 0, x: 5 }}
      animate={{ opacity: [0, 1, 0], x: -5 }}
      transition={{ duration: 1.5, delay: 0.8, repeat: Infinity }}
    />
    <motion.path
      d="M20 50 Q5 65 20 80"
      className="stroke-primary/20"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      initial={{ opacity: 0, x: 5 }}
      animate={{ opacity: [0, 1, 0], x: -5 }}
      transition={{ duration: 1.5, delay: 1, repeat: Infinity }}
    />
    
    {/* ZZZ for sleeping/no alerts */}
    <motion.text
      x="95"
      y="40"
      className="fill-muted-foreground/40 text-sm font-bold"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
    >
      z
    </motion.text>
    <motion.text
      x="105"
      y="30"
      className="fill-muted-foreground/30 text-xs font-bold"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
    >
      z
    </motion.text>
  </motion.svg>
);

// Wishlist/Heart illustration
const WishlistIllustration = () => (
  <motion.svg
    width="180"
    height="160"
    viewBox="0 0 180 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Heart */}
    <motion.path
      d="M90 130 C50 95 20 65 20 45 C20 25 40 15 55 15 C70 15 80 25 90 40 C100 25 110 15 125 15 C140 15 160 25 160 45 C160 65 130 95 90 130"
      className="fill-pink-400/20 stroke-pink-500/50"
      strokeWidth="3"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
    />
    
    {/* Card inside heart */}
    <motion.rect
      x="70"
      y="50"
      width="40"
      height="55"
      rx="4"
      className="fill-white/80 stroke-pink-400/40"
      strokeWidth="2"
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    />
    <motion.rect
      x="76"
      y="56"
      width="28"
      height="22"
      rx="2"
      className="fill-pink-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.8 }}
    />
    <motion.rect
      x="76"
      y="82"
      width="20"
      height="3"
      rx="1"
      className="fill-muted/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.9 }}
    />
    
    {/* Sparkles */}
    <motion.circle
      cx="45"
      cy="30"
      r="4"
      className="fill-pink-400/50"
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
    <motion.circle
      cx="140"
      cy="40"
      r="3"
      className="fill-pink-400/40"
      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
    />
  </motion.svg>
);

// Trades/Swap illustration
const TradesIllustration = () => (
  <motion.svg
    width="200"
    height="150"
    viewBox="0 0 200 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Left card */}
    <motion.g
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <rect
        x="25"
        y="35"
        width="55"
        height="75"
        rx="5"
        className="fill-blue-100 stroke-blue-400/50"
        strokeWidth="2"
      />
      <rect x="32" y="42" width="41" height="32" rx="3" className="fill-blue-200/50" />
      <rect x="32" y="80" width="30" height="4" rx="2" className="fill-blue-300/50" />
      <rect x="32" y="88" width="22" height="3" rx="1" className="fill-blue-200/50" />
    </motion.g>
    
    {/* Right card */}
    <motion.g
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <rect
        x="120"
        y="35"
        width="55"
        height="75"
        rx="5"
        className="fill-purple-100 stroke-purple-400/50"
        strokeWidth="2"
      />
      <rect x="127" y="42" width="41" height="32" rx="3" className="fill-purple-200/50" />
      <rect x="127" y="80" width="30" height="4" rx="2" className="fill-purple-300/50" />
      <rect x="127" y="88" width="22" height="3" rx="1" className="fill-purple-200/50" />
    </motion.g>
    
    {/* Swap arrows */}
    <motion.g
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.4, delay: 0.6, type: "spring" }}
    >
      {/* Top arrow */}
      <motion.path
        d="M85 55 L115 55"
        className="stroke-primary"
        strokeWidth="3"
        strokeLinecap="round"
        animate={{ x: [0, 3, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <polygon points="118,55 110,50 110,60" className="fill-primary" />
      
      {/* Bottom arrow */}
      <motion.path
        d="M115 90 L85 90"
        className="stroke-primary"
        strokeWidth="3"
        strokeLinecap="round"
        animate={{ x: [0, -3, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <polygon points="82,90 90,85 90,95" className="fill-primary" />
    </motion.g>
    
    {/* Equal sign */}
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <rect x="95" y="68" width="10" height="3" rx="1" className="fill-green-500/60" />
      <rect x="95" y="74" width="10" height="3" rx="1" className="fill-green-500/60" />
    </motion.g>
  </motion.svg>
);

// Leaderboard/Podium illustration  
const LeaderboardIllustration = () => (
  <motion.svg
    width="200"
    height="160"
    viewBox="0 0 200 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* Podium blocks */}
    {/* 2nd place */}
    <motion.rect
      x="30"
      y="85"
      width="50"
      height="55"
      className="fill-slate-300"
      initial={{ scaleY: 0, originY: 1 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    />
    <motion.text
      x="55"
      y="120"
      textAnchor="middle"
      className="fill-slate-600 font-bold text-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      2
    </motion.text>
    
    {/* 1st place */}
    <motion.rect
      x="75"
      y="55"
      width="50"
      height="85"
      className="fill-amber-400"
      initial={{ scaleY: 0, originY: 1 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    />
    <motion.text
      x="100"
      y="100"
      textAnchor="middle"
      className="fill-amber-700 font-bold text-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      1
    </motion.text>
    
    {/* 3rd place */}
    <motion.rect
      x="120"
      y="100"
      width="50"
      height="40"
      className="fill-orange-300"
      initial={{ scaleY: 0, originY: 1 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    />
    <motion.text
      x="145"
      y="125"
      textAnchor="middle"
      className="fill-orange-600 font-bold text-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
    >
      3
    </motion.text>
    
    {/* Crown on 1st */}
    <motion.path
      d="M85 45 L90 55 L100 45 L110 55 L115 45 L115 55 L85 55 Z"
      className="fill-amber-500"
      initial={{ scale: 0, y: 10 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.8, type: "spring" }}
    />
    
    {/* Star */}
    <motion.path
      d="M100 25 L103 32 L110 32 L104 37 L106 44 L100 40 L94 44 L96 37 L90 32 L97 32 Z"
      className="fill-yellow-400"
      initial={{ scale: 0 }}
      animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
      transition={{ duration: 0.5, delay: 1, type: "spring" }}
    />
    
    {/* People silhouettes */}
    <motion.circle cx="55" cy="70" r="8" className="fill-slate-400" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.7 }} />
    <motion.circle cx="100" cy="40" r="8" className="fill-amber-500" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }} />
    <motion.circle cx="145" cy="85" r="8" className="fill-orange-400" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }} />
  </motion.svg>
);

// Grading illustration
const GradingIllustration = () => (
  <motion.svg
    width="180"
    height="160"
    viewBox="0 0 180 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    {/* PSA-style slab */}
    <motion.rect
      x="45"
      y="20"
      width="90"
      height="120"
      rx="8"
      className="fill-slate-100 stroke-slate-300"
      strokeWidth="3"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    />
    
    {/* Inner card area */}
    <motion.rect
      x="55"
      y="45"
      width="70"
      height="80"
      rx="4"
      className="fill-white stroke-slate-200"
      strokeWidth="2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
    />
    
    {/* Card content */}
    <motion.rect
      x="60"
      y="50"
      width="60"
      height="45"
      rx="2"
      className="fill-blue-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    />
    <motion.rect x="60" y="100" width="45" height="4" rx="2" className="fill-slate-200" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />
    <motion.rect x="60" y="108" width="35" height="3" rx="1" className="fill-slate-150" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} />
    
    {/* Grade label at top */}
    <motion.rect
      x="55"
      y="25"
      width="70"
      height="18"
      rx="3"
      className="fill-red-500"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: 0.7, type: "spring" }}
    />
    <motion.text
      x="90"
      y="38"
      textAnchor="middle"
      className="fill-white text-[11px] font-bold"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.9 }}
    >
      GEM MT 10
    </motion.text>
    
    {/* Sparkle */}
    <motion.path
      d="M145 35 L148 42 L155 42 L150 47 L152 55 L145 50 L138 55 L140 47 L135 42 L142 42 Z"
      className="fill-yellow-400"
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 1, type: "spring" }}
    />
    
    {/* Checkmark badge */}
    <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1, type: "spring" }}>
      <circle cx="150" cy="110" r="15" className="fill-green-500" />
      <path d="M143 110 L148 115 L158 105" className="stroke-white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </motion.g>
  </motion.svg>
);

// Helper to get illustration component
const getIllustration = (type: EmptyStateProps["illustration"]) => {
  switch (type) {
    case "cards": return <CardStackIllustration />;
    case "search": return <SearchIllustration />;
    case "sales": return <SalesIllustration />;
    case "achievements": return <AchievementsIllustration />;
    case "goals": return <GoalsIllustration />;
    case "alerts": return <AlertsIllustration />;
    case "wishlist": return <WishlistIllustration />;
    case "trades": return <TradesIllustration />;
    case "leaderboard": return <LeaderboardIllustration />;
    case "grading": return <GradingIllustration />;
    default: return null;
  }
};

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  illustration = "none",
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      {/* Illustration */}
      {illustration !== "none" && getIllustration(illustration)}
      
      {/* Icon fallback */}
      {illustration === "none" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="w-20 h-20 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center mb-6"
        >
          {icon || <Package className="h-10 w-10 text-muted-foreground/50" />}
        </motion.div>
      )}

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: illustration !== "none" ? 0.6 : 0.2, duration: 0.3 }}
        className="text-xl font-semibold text-foreground mb-2 mt-4"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: illustration !== "none" ? 0.7 : 0.25, duration: 0.3 }}
        className="text-muted-foreground max-w-sm mb-6"
      >
        {description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: illustration !== "none" ? 0.8 : 0.3, duration: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {(actionLabel && (actionHref || onAction)) && (
          <>
            {actionHref ? (
              <Link to={actionHref}>
                <Button className="gap-2 h-11 px-6 rounded-xl">
                  <Plus className="h-4 w-4" />
                  {actionLabel}
                </Button>
              </Link>
            ) : (
              <Button onClick={onAction} className="gap-2 h-11 px-6 rounded-xl">
                <Plus className="h-4 w-4" />
                {actionLabel}
              </Button>
            )}
          </>
        )}
        
        {(secondaryActionLabel && (secondaryActionHref || onSecondaryAction)) && (
          <>
            {secondaryActionHref ? (
              <Link to={secondaryActionHref}>
                <Button variant="outline" className="gap-2 h-11 px-6 rounded-xl">
                  {secondaryActionLabel}
                </Button>
              </Link>
            ) : (
              <Button variant="outline" onClick={onSecondaryAction} className="gap-2 h-11 px-6 rounded-xl">
                {secondaryActionLabel}
              </Button>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

// Pre-configured empty states with illustrations
export const EmptyInventory = () => (
  <EmptyState
    illustration="cards"
    title="Your collection awaits!"
    description="Add your first card to begin tracking your portfolio value, see price trends, and discover hidden gems."
    actionLabel="Add Your First Card"
    actionHref="/scan"
    secondaryActionLabel="Import Collection"
    secondaryActionHref="/import"
  />
);

export const EmptySales = () => (
  <EmptyState
    illustration="sales"
    title="Track your profits!"
    description="When you sell cards from your collection, your profits, ROI, and performance analytics will appear here."
    actionLabel="Record a Sale"
    actionHref="/inventory"
  />
);

export const EmptySearchResults = () => (
  <EmptyState
    illustration="search"
    title="No matches found"
    description="Try a different search term, check your spelling, or adjust your filters to find what you're looking for."
  />
);

export const EmptyAchievements = () => (
  <EmptyState
    illustration="achievements"
    title="Start unlocking achievements!"
    description="Add cards to your collection, make trades, and hit milestones to earn badges and climb the ranks."
    actionLabel="Add Cards to Start"
    actionHref="/scan"
  />
);

export const EmptyGoals = () => (
  <EmptyState
    illustration="goals"
    title="Set your first goal!"
    description="Create portfolio targets to stay motivated. Track your progress toward collection milestones."
    actionLabel="Create a Goal"
  />
);

export const EmptyAlerts = () => (
  <EmptyState
    illustration="alerts"
    title="No price alerts yet"
    description="Set alerts on cards you're watching. We'll notify you when prices hit your targets."
    actionLabel="Set Price Alert"
    actionHref="/alerts"
  />
);

export const EmptyWishlist = () => (
  <EmptyState
    illustration="wishlist"
    title="Your wishlist is empty"
    description="Save cards you want to acquire. Track prices and get alerts when they drop."
    actionLabel="Browse Cards"
    actionHref="/market"
  />
);

export const EmptyTrades = () => (
  <EmptyState
    illustration="trades"
    title="No trades yet"
    description="Connect with other collectors to swap cards. Fair trades make everyone happy!"
    actionLabel="Find Trade Partners"
    actionHref="/trading"
  />
);

export const EmptyLeaderboard = () => (
  <EmptyState
    illustration="leaderboard"
    title="Leaderboards coming soon!"
    description="Compete with other collectors. Top portfolios, most cards, best ROI—climb the ranks!"
  />
);

export const EmptyGrading = () => (
  <EmptyState
    illustration="grading"
    title="No cards in grading"
    description="Track cards you've sent for professional grading. Monitor status and calculate potential ROI."
    actionLabel="Submit for Grading"
    actionHref="/grading"
  />
);
