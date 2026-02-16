import { Goals } from "@/components/Goals";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { useAchievements } from "@/hooks/useAchievements";
import { useDailyLogin } from "@/hooks/useDailyLogin";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function GoalsPage() {
  const navigate = useNavigate();
  const { items } = useInventoryDb();
  const { completedAchievements } = useAchievements();
  const { data: loginData } = useDailyLogin();

  // Calculate current values for goals
  const unsoldItems = items.filter(item => !item.sold_date && !item.deleted_at);
  const totalValue = unsoldItems.reduce((sum, item) => 
    sum + ((item.market_price || item.purchase_price) * item.quantity), 0);
  const totalCards = unsoldItems.reduce((sum, item) => sum + item.quantity, 0);
  const gradedCards = unsoldItems.filter(item => 
    item.grading_company && item.grading_company !== 'raw' && item.grade
  ).length;
  const currentStreak = loginData?.streak || 0;
  const achievementCount = completedAchievements.length;

  return (
    <PageTransition>
      <div className="min-h-screen pb-24 bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 px-4 pt-safe-top bg-background/95 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-3 py-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Collection Goals</h1>
          </div>
        </header>

        {/* Goals Component */}
        <main className="px-4 py-6">
          <Goals
            currentValue={totalValue}
            currentCards={totalCards}
            currentGraded={gradedCards}
            currentStreak={currentStreak}
            currentAchievements={achievementCount}
          />
        </main>
      </div>
      <BottomNav />
    </PageTransition>
  );
}
