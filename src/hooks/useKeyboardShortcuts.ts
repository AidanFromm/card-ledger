import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        if (e.key === "Escape") {
          target.blur();
        }
        return;
      }

      // Cmd+K — open command palette (dispatch custom event)
      if (isMod && e.key === "k") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-command-palette"));
        return;
      }

      // Cmd+I — go to import
      if (isMod && e.key === "i") {
        e.preventDefault();
        navigate("/inventory");
        return;
      }

      // Cmd+S — go to scan
      if (isMod && e.key === "s") {
        e.preventDefault();
        navigate("/scan");
        return;
      }

      // Escape — close dialogs (dispatches to all listeners)
      if (e.key === "Escape") {
        window.dispatchEvent(new CustomEvent("close-dialogs"));
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
};

export default useKeyboardShortcuts;
