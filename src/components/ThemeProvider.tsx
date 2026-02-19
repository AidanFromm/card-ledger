import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "dark" | "light" | "system" | "oled";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light" | "oled";
  isOled: boolean;
  toggleTheme: () => void;
  cycleTheme: () => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  resolvedTheme: "dark",
  isOled: false,
  toggleTheme: () => null,
  cycleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// Color palette for theme-color meta tag
const THEME_COLORS = {
  dark: "#0f1419",
  light: "#fafafa",
  oled: "#000000",
};

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "cardledger-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light" | "oled">("dark");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Apply theme with smooth transition
  const applyTheme = useCallback((newTheme: "dark" | "light" | "oled") => {
    const root = window.document.documentElement;
    
    // Enable transition
    setIsTransitioning(true);
    root.style.setProperty('--theme-transition', 'background-color 0.3s ease, color 0.3s ease');
    root.classList.add('theme-transitioning');
    
    // Remove old theme classes
    root.classList.remove("light", "dark", "oled");
    
    // Add new theme class
    root.classList.add(newTheme);
    setResolvedTheme(newTheme);

    // Update meta theme-color for iOS status bar
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", THEME_COLORS[newTheme]);
    }

    // Update iOS status bar style
    const metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (metaStatusBar) {
      metaStatusBar.setAttribute("content", newTheme === "light" ? "default" : "black-translucent");
    }

    // Remove transition class after animation
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 300);
  }, []);

  // Get effective theme based on setting
  const getEffectiveTheme = useCallback((themeSetting: Theme): "dark" | "light" | "oled" => {
    if (themeSetting === "oled") return "oled";
    if (themeSetting === "light") return "light";
    if (themeSetting === "dark") return "dark";
    
    // System preference
    if (themeSetting === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    
    return "dark";
  }, []);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme(theme);
    applyTheme(effectiveTheme);
  }, [theme, applyTheme, getEffectiveTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light";
      applyTheme(newTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, applyTheme]);

  // Set theme with persistence
  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  }, [storageKey]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const current = resolvedTheme === "oled" ? "dark" : resolvedTheme;
    const next = current === "dark" ? "light" : "dark";
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  // Cycle through all themes
  const cycleTheme = useCallback(() => {
    const order: Theme[] = ["light", "dark", "oled", "system"];
    const currentIndex = order.indexOf(theme);
    const nextIndex = (currentIndex + 1) % order.length;
    setTheme(order[nextIndex]);
  }, [theme, setTheme]);

  const value: ThemeProviderState = {
    theme,
    setTheme,
    resolvedTheme,
    isOled: resolvedTheme === "oled",
    toggleTheme,
    cycleTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {/* Add global styles for theme transitions */}
      <style>{`
        .theme-transitioning,
        .theme-transitioning * {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
        }
        
        /* OLED-specific styles for true black */
        .oled {
          --background: 0 0% 0%;
          --card: 0 0% 3%;
          --popover: 0 0% 3%;
          --muted: 0 0% 8%;
          --border: 0 0% 12%;
          --secondary: 0 0% 8%;
        }
        
        /* Ensure smooth scrollbar transitions */
        .oled ::-webkit-scrollbar-track {
          background: #000;
        }
        .oled ::-webkit-scrollbar-thumb {
          background: #222;
        }
      `}</style>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

// Theme toggle button component
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, cycleTheme, resolvedTheme } = useTheme();
  
  const getIcon = () => {
    switch (resolvedTheme) {
      case "light":
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case "dark":
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        );
      case "oled":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };
  
  const getLabel = () => {
    switch (theme) {
      case "light": return "Light";
      case "dark": return "Dark";
      case "oled": return "OLED";
      case "system": return "Auto";
    }
  };
  
  return (
    <button
      onClick={cycleTheme}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-muted ${className || ''}`}
      title={`Current: ${getLabel()}. Click to cycle themes.`}
    >
      {getIcon()}
      <span className="text-sm font-medium">{getLabel()}</span>
    </button>
  );
}

export default ThemeProvider;
