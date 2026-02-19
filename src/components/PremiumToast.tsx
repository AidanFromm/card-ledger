import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  LucideIcon 
} from "lucide-react";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";

// Toast types
type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Toast configuration
const toastConfig: Record<ToastType, { icon: LucideIcon; color: string; bg: string }> = {
  success: { 
    icon: CheckCircle2, 
    color: "text-gain", 
    bg: "bg-gain/10 border-gain/20" 
  },
  error: { 
    icon: XCircle, 
    color: "text-loss", 
    bg: "bg-loss/10 border-loss/20" 
  },
  warning: { 
    icon: AlertCircle, 
    color: "text-warning", 
    bg: "bg-warning/10 border-warning/20" 
  },
  info: { 
    icon: Info, 
    color: "text-primary", 
    bg: "bg-primary/10 border-primary/20" 
  },
};

// Single toast component
const ToastItem = ({ 
  toast, 
  onRemove 
}: { 
  toast: Toast; 
  onRemove: () => void;
}) => {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(onRemove, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
        relative flex items-start gap-3 w-full max-w-sm
        p-4 rounded-xl border backdrop-blur-sm
        shadow-lg shadow-black/10
        ${config.bg}
      `}
    >
      {/* Icon with pulse animation on appear */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
      >
        <Icon className={`w-5 h-5 ${config.color} shrink-0`} />
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{toast.description}</p>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={onRemove}
        className="shrink-0 p-1 rounded-lg hover:bg-background/50 transition-colors"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: (toast.duration || 4000) / 1000, ease: "linear" }}
        className={`absolute bottom-0 left-0 right-0 h-0.5 ${config.color.replace('text-', 'bg-')} origin-left rounded-b-xl opacity-50`}
      />
    </motion.div>
  );
};

// Toast container
export const ToastContainer = () => {
  const context = useContext(ToastContext);
  if (!context) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {context.toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem 
              toast={toast} 
              onRemove={() => context.removeToast(toast.id)} 
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Toast provider
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }].slice(-5)); // Max 5 toasts
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (title: string, description?: string) => {
    addToast({ type: "success", title, description });
  };

  const error = (title: string, description?: string) => {
    addToast({ type: "error", title, description });
  };

  const warning = (title: string, description?: string) => {
    addToast({ type: "warning", title, description });
  };

  const info = (title: string, description?: string) => {
    addToast({ type: "info", title, description });
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Standalone toast component for manual positioning
interface StandaloneToastProps {
  show: boolean;
  type: ToastType;
  title: string;
  description?: string;
  onClose?: () => void;
  position?: "top" | "bottom";
}

export const StandaloneToast = ({
  show,
  type,
  title,
  description,
  onClose,
  position = "top",
}: StandaloneToastProps) => {
  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -20 : 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === "top" ? -20 : 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={`
            fixed ${position === "top" ? "top-4" : "bottom-24"} left-4 right-4
            z-[100] mx-auto max-w-sm
            flex items-start gap-3
            p-4 rounded-xl border backdrop-blur-sm
            shadow-lg shadow-black/10
            ${config.bg}
          `}
        >
          <Icon className={`w-5 h-5 ${config.color} shrink-0`} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="shrink-0 p-1 rounded-lg hover:bg-background/50 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastProvider;
