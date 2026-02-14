import { motion } from "framer-motion";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: "icon" | "full" | "text";
}

export const Logo = ({ 
  size = 32, 
  showText = true, 
  className = "",
  variant = "icon"
}: LogoProps) => {
  // Full logo with text (horizontal)
  if (variant === "full") {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={`${className}`}
      >
        <img 
          src="/logo-full.jpg" 
          alt="Card Ledger" 
          style={{ height: size * 1.5 }}
          className="object-contain"
        />
      </motion.div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <motion.div
        whileHover={{ scale: 1.05, rotate: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="relative"
      >
        {/* CL Logo Icon - Navy theme */}
        <img 
          src="/logo-light.jpg" 
          alt="CL" 
          width={size}
          height={size}
          className="rounded-lg object-contain"
          style={{ 
            width: size, 
            height: size,
            background: 'transparent'
          }}
        />
      </motion.div>

      {showText && (
        <span className="text-white font-bold text-lg tracking-tight">
          Card Ledger
        </span>
      )}
    </div>
  );
};

// Navy blue color from logo: #1e3a5f (approximate)
export const LOGO_NAVY = "#1e3a5f";

export default Logo;
