import { motion } from "framer-motion";
import { 
  Search, 
  ScanBarcode, 
  Camera, 
  Edit3, 
  FileSpreadsheet,
  Package,
  Sparkles 
} from "lucide-react";

export type AddMethod = 'search' | 'barcode' | 'camera' | 'manual' | 'bulk' | 'sealed';

interface AddMethodOption {
  id: AddMethod;
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: string;
  disabled?: boolean;
}

const methods: AddMethodOption[] = [
  {
    id: 'search',
    icon: <Search className="h-6 w-6" />,
    label: 'Search Database',
    description: 'Find cards by name, set, or number',
  },
  {
    id: 'barcode',
    icon: <ScanBarcode className="h-6 w-6" />,
    label: 'Scan Barcode',
    description: 'Scan product barcode or graded slab',
  },
  {
    id: 'camera',
    icon: <Camera className="h-6 w-6" />,
    label: 'AI Recognition',
    description: 'Take a photo to identify the card',
    badge: 'AI',
  },
  {
    id: 'manual',
    icon: <Edit3 className="h-6 w-6" />,
    label: 'Manual Entry',
    description: 'Enter card details yourself',
  },
  {
    id: 'sealed',
    icon: <Package className="h-6 w-6" />,
    label: 'Sealed Products',
    description: 'Track booster boxes, ETBs, and more',
    badge: 'NEW',
  },
  {
    id: 'bulk',
    icon: <FileSpreadsheet className="h-6 w-6" />,
    label: 'Bulk Import',
    description: 'Import multiple cards from CSV',
  },
];

interface AddMethodSelectorProps {
  selectedMethod: AddMethod | null;
  onSelectMethod: (method: AddMethod) => void;
}

export const AddMethodSelector = ({ 
  selectedMethod, 
  onSelectMethod 
}: AddMethodSelectorProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        How would you like to add cards?
      </h3>
      
      <div className="grid gap-3">
        {methods.map((method, index) => (
          <motion.button
            key={method.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => !method.disabled && onSelectMethod(method.id)}
            disabled={method.disabled}
            className={`
              relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
              ${selectedMethod === method.id 
                ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                : 'border-border/50 bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40'
              }
              ${method.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
              ${selectedMethod === method.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary/50 text-muted-foreground'
              }
            `}>
              {method.icon}
            </div>
            
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{method.label}</span>
                {method.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {method.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{method.description}</p>
            </div>
            
            {selectedMethod === method.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default AddMethodSelector;
