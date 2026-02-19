import { motion } from "framer-motion";
import { ReactNode } from "react";

interface OnboardingStepProps {
  title: string;
  subtitle: string;
  description?: string;
  illustration: ReactNode;
  features?: { icon: ReactNode; text: string }[];
  gradient?: string;
  index: number;
  direction: number;
  interactive?: boolean;
  children?: ReactNode;
}

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.95,
  }),
};

export function OnboardingStep({
  title,
  subtitle,
  description,
  illustration,
  features,
  gradient = "from-primary to-primary/70",
  index,
  direction,
  interactive = false,
  children,
}: OnboardingStepProps) {
  return (
    <motion.div
      key={index}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="p-8 pt-12"
    >
      {/* Illustration */}
      <div className="mb-6">{illustration}</div>

      {/* Text content */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p
            className={`text-sm font-medium bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
          >
            {subtitle}
          </p>
        </motion.div>

        {!interactive && description && (
          <motion.p
            className="text-muted-foreground text-sm leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {description}
          </motion.p>
        )}

        {/* Features */}
        {features && features.length > 0 && (
          <motion.div
            className="flex flex-wrap justify-center gap-2 pt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 text-xs font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <span className="text-primary">{feature.icon}</span>
                {feature.text}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Interactive content */}
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default OnboardingStep;
