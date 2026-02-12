import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ScanLine, 
  Plus, 
  Package, 
  Bell,
  Camera,
  Sparkles,
  Award,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  gradient: string;
  glowColor: string;
  description: string;
}

const actions: QuickAction[] = [
  {
    id: 'scan',
    label: 'Scan Card',
    icon: Camera,
    path: '/scan',
    gradient: 'from-emerald-500 to-teal-500',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    description: 'AI-powered recognition',
  },
  {
    id: 'add',
    label: 'Add Card',
    icon: Plus,
    path: '/add',
    gradient: 'from-blue-500 to-indigo-500',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    description: 'Manual entry',
  },
  {
    id: 'grading',
    label: 'Grading',
    icon: Award,
    path: '/grading',
    gradient: 'from-amber-500 to-yellow-500',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    description: 'Track submissions',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    icon: Bell,
    path: '/alerts',
    gradient: 'from-rose-500 to-pink-500',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    description: 'Price notifications',
  },
];

interface QuickActionCardProps {
  action: QuickAction;
  index: number;
}

const QuickActionCard = memo(({ action, index }: QuickActionCardProps) => {
  const navigate = useNavigate();
  const Icon = action.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.08,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(action.path)}
      className="flex-1 min-w-[140px] relative overflow-hidden rounded-2xl"
    >
      {/* Background */}
      <div className={`
        absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-10
        transition-opacity duration-300
      `} />
      
      {/* Border glow on hover */}
      <div className={`
        absolute inset-0 rounded-2xl border border-white/10
        transition-all duration-300
      `} style={{ boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.1)` }} />

      {/* Content */}
      <div className="relative z-10 p-4 flex flex-col items-center text-center">
        {/* Icon with gradient background */}
        <div className={`
          w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient}
          flex items-center justify-center mb-3
          shadow-lg
        `} style={{ boxShadow: `0 4px 20px ${action.glowColor}` }}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Label */}
        <span className="text-sm font-semibold text-white mb-0.5">
          {action.label}
        </span>
        
        {/* Description */}
        <span className="text-[10px] text-zinc-500">
          {action.description}
        </span>
      </div>
    </motion.button>
  );
});

QuickActionCard.displayName = "QuickActionCard";

interface QuickActionsProps {
  className?: string;
}

export const QuickActions = memo(({ className = "" }: QuickActionsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 px-1">
        <div className="p-1.5 rounded-lg bg-zinc-800/50">
          <Sparkles className="h-4 w-4 text-amber-400" />
        </div>
        <h3 className="text-base font-semibold text-white">Quick Actions</h3>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <QuickActionCard 
            key={action.id} 
            action={action} 
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
});

QuickActions.displayName = "QuickActions";

export default QuickActions;
