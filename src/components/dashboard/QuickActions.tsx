import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ScanLine, 
  Plus, 
  Package, 
  Bell,
  Camera,
  Sparkles,
  Award,
  Heart,
  Layers,
  Upload,
  ChevronRight,
  Zap,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  gradient: string;
  glowColor: string;
  description: string;
  isPrimary?: boolean;
}

const primaryActions: QuickAction[] = [
  {
    id: 'scan',
    label: 'Scan Card',
    icon: Camera,
    path: '/scan',
    gradient: 'from-navy-600 to-navy-500',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    description: 'AI-powered recognition',
    isPrimary: true,
  },
  {
    id: 'add',
    label: 'Add Card',
    icon: Plus,
    path: '/add',
    gradient: 'from-blue-500 to-indigo-500',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    description: 'Manual entry',
    isPrimary: true,
  },
  {
    id: 'import',
    label: 'Import',
    icon: Upload,
    path: '/import',
    gradient: 'from-violet-500 to-purple-500',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    description: 'Bulk import',
    isPrimary: true,
  },
  {
    id: 'inventory',
    label: 'View All',
    icon: Package,
    path: '/inventory',
    gradient: 'from-zinc-600 to-zinc-700',
    glowColor: 'rgba(113, 113, 122, 0.4)',
    description: 'Your collection',
    isPrimary: true,
  },
];

const secondaryActions: QuickAction[] = [
  {
    id: 'wishlist',
    label: 'Wishlist',
    icon: Heart,
    path: '/wishlist',
    gradient: 'from-pink-500 to-rose-500',
    glowColor: 'rgba(236, 72, 153, 0.4)',
    description: 'Cards to acquire',
  },
  {
    id: 'sets',
    label: 'Sets',
    icon: Layers,
    path: '/sets',
    gradient: 'from-violet-500 to-purple-500',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    description: 'Track completion',
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
    gradient: 'from-orange-500 to-red-500',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    description: 'Price notifications',
  },
];

interface PrimaryActionCardProps {
  action: QuickAction;
  index: number;
}

const PrimaryActionCard = memo(({ action, index }: PrimaryActionCardProps) => {
  const navigate = useNavigate();
  const Icon = action.icon;
  const isScan = action.id === 'scan';

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
      className="relative flex-1 overflow-hidden rounded-2xl group"
    >
      {/* Background with gradient */}
      <div className={`
        absolute inset-0 bg-gradient-to-br ${action.gradient} 
        ${isScan ? 'opacity-100' : 'opacity-15'}
        transition-opacity duration-300 group-hover:opacity-100
      `} />
      
      {/* Animated border/glow */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ boxShadow: `0 0 30px ${action.glowColor}` }}
      />
      
      {/* Border */}
      <div className={`
        absolute inset-0 rounded-2xl border transition-colors duration-300
        ${isScan 
          ? 'border-white/20' 
          : 'border-zinc-700/50 group-hover:border-white/20'
        }
      `} />

      {/* Content */}
      <div className="relative z-10 p-4 flex flex-col items-center text-center min-h-[100px] justify-center">
        {/* Icon with glow */}
        <div className="relative mb-2">
          <motion.div
            animate={isScan ? { 
              boxShadow: [
                '0 0 20px rgba(16, 185, 129, 0.3)',
                '0 0 40px rgba(16, 185, 129, 0.5)',
                '0 0 20px rgba(16, 185, 129, 0.3)',
              ]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              ${isScan 
                ? 'bg-white/20' 
                : `bg-gradient-to-br ${action.gradient} opacity-90 group-hover:opacity-100`
              }
            `}
          >
            <Icon className="w-6 h-6 text-white" />
          </motion.div>
          
          {/* Scan pulse effect */}
          {isScan && (
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-xl bg-navy-400/20"
            />
          )}
        </div>

        {/* Label */}
        <span className={`text-sm font-semibold mb-0.5 ${isScan ? 'text-white' : 'text-white'}`}>
          {action.label}
        </span>
        
        {/* Description */}
        <span className={`text-[10px] ${isScan ? 'text-white/70' : 'text-zinc-400 group-hover:text-white/70'}`}>
          {action.description}
        </span>
      </div>

      {/* Scan shimmer effect */}
      {isScan && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatDelay: 3,
            ease: "easeInOut" 
          }}
          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        />
      )}
    </motion.button>
  );
});

PrimaryActionCard.displayName = "PrimaryActionCard";

interface SecondaryActionButtonProps {
  action: QuickAction;
  index: number;
}

const SecondaryActionButton = memo(({ action, index }: SecondaryActionButtonProps) => {
  const navigate = useNavigate();
  const Icon = action.icon;

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + index * 0.05 }}
      whileHover={{ x: 4, backgroundColor: 'rgba(39, 39, 42, 0.5)' }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(action.path)}
      className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-xl group transition-colors"
    >
      <div className={`
        w-9 h-9 rounded-lg bg-gradient-to-br ${action.gradient} 
        flex items-center justify-center shadow-lg opacity-80 group-hover:opacity-100 transition-opacity
      `} style={{ boxShadow: `0 4px 15px ${action.glowColor}` }}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      
      <div className="flex-1 text-left">
        <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
          {action.label}
        </span>
        <p className="text-[10px] text-zinc-500">{action.description}</p>
      </div>
      
      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" />
    </motion.button>
  );
});

SecondaryActionButton.displayName = "SecondaryActionButton";

interface QuickActionsProps {
  className?: string;
  showSecondary?: boolean;
}

export const QuickActions = memo(({ className = "", showSecondary = false }: QuickActionsProps) => {
  const [expanded, setExpanded] = useState(showSecondary);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 px-1">
        <motion.div 
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
          className="p-1.5 rounded-lg bg-zinc-800/50"
        >
          <Zap className="h-4 w-4 text-amber-400" />
        </motion.div>
        <h3 className="text-base font-bold text-white">Quick Actions</h3>
      </div>

      {/* Primary Action Cards - 2x2 Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {primaryActions.map((action, index) => (
          <PrimaryActionCard 
            key={action.id} 
            action={action} 
            index={index}
          />
        ))}
      </div>

      {/* Secondary Actions - Expandable */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-3 mt-2">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium mb-2 px-3">
                More Actions
              </p>
              <div className="space-y-1">
                {secondaryActions.map((action, index) => (
                  <SecondaryActionButton 
                    key={action.id} 
                    action={action} 
                    index={index}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand/Collapse Toggle */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setExpanded(!expanded)}
        className="w-full mt-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1"
      >
        <span>{expanded ? 'Show less' : 'More actions'}</span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-90" />
        </motion.div>
      </motion.button>
    </motion.div>
  );
});

QuickActions.displayName = "QuickActions";

export default QuickActions;
