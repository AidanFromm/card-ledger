import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";

interface AppLayoutProps {
  children: ReactNode;
  /** Hide sidebar (e.g. for public/share pages) */
  noSidebar?: boolean;
  /** Hide navbar */
  noNavbar?: boolean;
  /** Hide bottom nav */
  noBottomNav?: boolean;
}

/**
 * Consistent app shell: Navbar + DesktopSidebar + content + BottomNav.
 * Ensures every page gets the desktop sidebar on md+ screens.
 */
export const AppLayout = ({ children, noSidebar, noNavbar, noBottomNav }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background pb-safe pt-safe">
      {!noNavbar && <Navbar />}
      <div className="flex">
        {!noSidebar && <DesktopSidebar />}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
      {!noBottomNav && <BottomNav />}
    </div>
  );
};

export default AppLayout;
