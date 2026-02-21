import { motion } from "framer-motion";
import { Trophy, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";
import { AchievementsPanel } from "@/components/Achievements";

const AchievementsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <div className="flex">
        <DesktopSidebar />
        <PageTransition>
          <div className="flex-1">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Achievements</h1>
                  <p className="text-xs text-muted-foreground">Track your progress</p>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Content */}
        <div className="px-4 py-6">
          <AchievementsPanel />
        </div>

        <BottomNav />
          </div>
        </PageTransition>
      </div>
    </div>
  );
};

export default AchievementsPage;
