import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Command, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SHORTCUTS_SEEN_KEY = 'cardledger_shortcuts_seen';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Open command palette' },
  { keys: ['⌘', '/'], description: 'Toggle keyboard shortcuts' },
  { keys: ['A'], description: 'Add new card' },
  { keys: ['D'], description: 'Go to Dashboard' },
  { keys: ['I'], description: 'Go to Inventory' },
  { keys: ['S'], description: 'Go to Settings' },
];

export function KeyboardShortcutsHint() {
  const [isVisible, setIsVisible] = useState(false);
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    // Only show on desktop
    if (window.innerWidth < 768) return;

    const seen = localStorage.getItem(SHORTCUTS_SEEN_KEY);
    if (!seen) {
      const timer = setTimeout(() => setIsVisible(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(SHORTCUTS_SEEN_KEY, 'true');
    setIsVisible(false);
  };

  // Listen for ⌘/ to toggle full shortcuts view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowFull(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Small hint tooltip */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="hidden md:flex fixed bottom-6 right-6 z-40"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-2xl shadow-xl">
              <Keyboard className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-sm text-white">Pro tip: Press <kbd className="px-1.5 py-0.5 mx-1 bg-zinc-800 rounded text-xs">⌘ K</kbd> for quick navigation</p>
              </div>
              <button
                onClick={dismiss}
                className="p-1 rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full shortcuts modal */}
      <AnimatePresence>
        {showFull && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFull(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
            >
              <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-600 flex items-center justify-center">
                      <Keyboard className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
                  </div>
                  <button
                    onClick={() => setShowFull(false)}
                    className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <div className="space-y-3">
                  {SHORTCUTS.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                    >
                      <span className="text-zinc-300">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, j) => (
                          <kbd
                            key={j}
                            className="px-2 py-1 bg-zinc-800 rounded text-sm font-mono text-zinc-300"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-zinc-500 mt-6 text-center">
                  Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-xs">⌘ /</kbd> to toggle this view
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default KeyboardShortcutsHint;
