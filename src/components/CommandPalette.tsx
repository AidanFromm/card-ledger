import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Package,
  LayoutDashboard,
  TrendingUp,
  Plus,
  Settings,
  Trophy,
  Bell,
  Heart,
  Layers,
  Camera,
  BarChart3,
  Users,
  ArrowRight,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  shortcut?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Command items
  const commands: CommandItem[] = useMemo(() => [
    {
      id: 'add-card',
      label: 'Add Card',
      description: 'Add a new card to your collection',
      icon: Plus,
      action: () => navigate('/scan'),
      keywords: ['new', 'create', 'scan'],
      shortcut: 'A',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'View your portfolio analytics',
      icon: LayoutDashboard,
      action: () => navigate('/dashboard'),
      keywords: ['home', 'analytics', 'overview'],
      shortcut: 'D',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      description: 'Browse your collection',
      icon: Package,
      action: () => navigate('/inventory'),
      keywords: ['collection', 'cards', 'browse'],
      shortcut: 'I',
    },
    {
      id: 'market',
      label: 'Market Trends',
      description: 'See what\'s hot in the market',
      icon: TrendingUp,
      action: () => navigate('/market'),
      keywords: ['prices', 'trends', 'hot'],
    },
    {
      id: 'sales',
      label: 'Sales',
      description: 'Track your sales and profit',
      icon: BarChart3,
      action: () => navigate('/sales'),
      keywords: ['profit', 'sold', 'revenue'],
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      description: 'Cards you want to buy',
      icon: Heart,
      action: () => navigate('/wishlist'),
      keywords: ['want', 'buy', 'wish'],
    },
    {
      id: 'sets',
      label: 'Set Completion',
      description: 'Track your set progress',
      icon: Layers,
      action: () => navigate('/sets'),
      keywords: ['complete', 'progress', 'collection'],
    },
    {
      id: 'scan',
      label: 'Scan Card',
      description: 'Use AI to identify a card',
      icon: Camera,
      action: () => navigate('/scan/ai'),
      keywords: ['camera', 'photo', 'identify', 'ai'],
    },
    {
      id: 'achievements',
      label: 'Achievements',
      description: 'View your badges and progress',
      icon: Trophy,
      action: () => navigate('/achievements'),
      keywords: ['badges', 'progress', 'level'],
    },
    {
      id: 'alerts',
      label: 'Price Alerts',
      description: 'Manage your price notifications',
      icon: Bell,
      action: () => navigate('/alerts'),
      keywords: ['notifications', 'price', 'watch'],
    },
    {
      id: 'clients',
      label: 'Client Lists',
      description: 'Manage wholesale clients',
      icon: Users,
      action: () => navigate('/lists'),
      keywords: ['wholesale', 'buyers', 'crm'],
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'App preferences and account',
      icon: Settings,
      action: () => navigate('/settings'),
      keywords: ['preferences', 'account', 'config'],
      shortcut: 'S',
    },
  ], [navigate]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    
    const searchLower = search.toLowerCase();
    return commands.filter(cmd => {
      const labelMatch = cmd.label.toLowerCase().includes(searchLower);
      const descMatch = cmd.description?.toLowerCase().includes(searchLower);
      const keywordMatch = cmd.keywords?.some(k => k.toLowerCase().includes(searchLower));
      return labelMatch || descMatch || keywordMatch;
    });
  }, [commands, search]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }

      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }

      // Navigate with arrows
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        }
        if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
          e.preventDefault();
          executeCommand(filteredCommands[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  const executeCommand = useCallback((cmd: CommandItem) => {
    setIsOpen(false);
    setSearch('');
    cmd.action();
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed inset-x-4 top-20 z-50 max-w-lg mx-auto"
          >
            <div className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                <Search className="w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search commands..."
                  autoFocus
                  className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none text-lg"
                />
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs">
                  <Command className="w-3 h-3" />K
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center text-zinc-500">
                    No commands found
                  </div>
                ) : (
                  filteredCommands.map((cmd, index) => {
                    const Icon = cmd.icon;
                    const isSelected = index === selectedIndex;
                    
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                          isSelected ? "bg-navy-600/30" : "hover:bg-zinc-800/50"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          isSelected ? "bg-navy-600" : "bg-zinc-800"
                        )}>
                          <Icon className={cn(
                            "w-5 h-5",
                            isSelected ? "text-white" : "text-zinc-400"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium truncate",
                            isSelected ? "text-white" : "text-zinc-200"
                          )}>
                            {cmd.label}
                          </p>
                          {cmd.description && (
                            <p className="text-xs text-zinc-500 truncate">
                              {cmd.description}
                            </p>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd className={cn(
                            "px-2 py-1 rounded text-xs",
                            isSelected ? "bg-navy-500 text-white" : "bg-zinc-800 text-zinc-400"
                          )}>
                            {cmd.shortcut}
                          </kbd>
                        )}
                        {isSelected && (
                          <ArrowRight className="w-4 h-4 text-navy-400" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t border-zinc-800 flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800">↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800">↵</kbd> Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800">Esc</kbd> Close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
