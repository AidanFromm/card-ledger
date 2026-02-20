/**
 * Population Report Component
 * 
 * Displays PSA/BGS grading population data for a card.
 * Shows total graded, breakdown by grade, and rarity indicator.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Users,
  Gem,
  Crown,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

export interface PopulationData {
  gradingCompany: 'psa' | 'bgs' | 'cgc' | 'sgc';
  cardName: string;
  setName: string;
  cardNumber?: string;
  totalPopulation: number;
  grades: GradePopulation[];
  lastUpdated?: string;
  popReportUrl?: string;
}

interface GradePopulation {
  grade: string;
  count: number;
  percentage: number;
}

interface PopulationReportProps {
  cardName: string;
  setName: string;
  cardNumber?: string;
  gradingCompany: 'psa' | 'bgs' | 'cgc' | 'sgc' | 'raw';
  grade?: string;
  className?: string;
  compact?: boolean;
}

// ============================================
// Constants
// ============================================

const GRADING_COMPANY_CONFIG = {
  psa: {
    name: 'PSA',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    popUrl: 'https://www.psacard.com/pop',
    grades: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1.5', '1', 'AUTH'],
  },
  bgs: {
    name: 'BGS',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    popUrl: 'https://www.beckett.com/grading/pop-report',
    grades: ['10', '9.5', '9', '8.5', '8', '7.5', '7', '6.5', '6', '5.5', '5'],
  },
  cgc: {
    name: 'CGC',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    popUrl: 'https://www.cgccards.com/population-report/',
    grades: ['10', '9.5', '9', '8.5', '8', '7.5', '7', '6.5', '6', '5.5', '5'],
  },
  sgc: {
    name: 'SGC',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    popUrl: 'https://www.sgccard.com/population',
    grades: ['10', '9.5', '9', '8.5', '8', '7.5', '7', '6', '5', '4', '3', '2', '1'],
  },
};

// Mock population data generator (replace with real API call)
function generateMockPopulation(
  gradingCompany: 'psa' | 'bgs' | 'cgc' | 'sgc',
  cardName: string
): PopulationData {
  const config = GRADING_COMPANY_CONFIG[gradingCompany];
  const baseTotal = Math.floor(Math.random() * 50000) + 100;
  
  // Generate realistic grade distribution (bell curve centered around 8-9)
  const grades: GradePopulation[] = config.grades.map((grade, index) => {
    let weight: number;
    const gradeNum = parseFloat(grade) || 0;
    
    if (gradeNum >= 10) weight = 0.08;
    else if (gradeNum >= 9) weight = 0.25;
    else if (gradeNum >= 8) weight = 0.30;
    else if (gradeNum >= 7) weight = 0.20;
    else if (gradeNum >= 6) weight = 0.10;
    else weight = 0.07;
    
    // Add some randomness
    weight *= (0.7 + Math.random() * 0.6);
    
    const count = Math.floor(baseTotal * weight);
    return {
      grade,
      count,
      percentage: 0, // Will calculate after
    };
  });
  
  // Calculate actual total and percentages
  const actualTotal = grades.reduce((sum, g) => sum + g.count, 0);
  grades.forEach(g => {
    g.percentage = actualTotal > 0 ? (g.count / actualTotal) * 100 : 0;
  });
  
  return {
    gradingCompany,
    cardName,
    setName: '',
    totalPopulation: actualTotal,
    grades,
    lastUpdated: new Date().toISOString(),
    popReportUrl: config.popUrl,
  };
}

// ============================================
// Rarity Score Calculator
// ============================================

function calculateRarityScore(pop: PopulationData, userGrade?: string): {
  score: number;
  label: string;
  color: string;
  description: string;
} {
  if (!userGrade || pop.totalPopulation === 0) {
    return { score: 0, label: 'Unknown', color: 'text-muted-foreground', description: 'No grade data' };
  }
  
  const gradeNum = parseFloat(userGrade) || 0;
  const gradeData = pop.grades.find(g => g.grade === userGrade);
  const gradeCount = gradeData?.count || 0;
  
  // Higher grades with lower pop = rarer
  const popFactor = Math.max(0, 100 - Math.log10(gradeCount + 1) * 20);
  const gradeFactor = gradeNum * 8; // Higher grade = more valuable
  const score = Math.min(100, (popFactor * 0.6 + gradeFactor * 0.4));
  
  if (score >= 90) return { score, label: 'Ultra Rare', color: 'text-yellow-500', description: 'Top tier collectible' };
  if (score >= 75) return { score, label: 'Very Rare', color: 'text-purple-500', description: 'Highly sought after' };
  if (score >= 60) return { score, label: 'Rare', color: 'text-blue-500', description: 'Above average rarity' };
  if (score >= 40) return { score, label: 'Uncommon', color: 'text-green-500', description: 'Moderate availability' };
  return { score, label: 'Common', color: 'text-muted-foreground', description: 'Readily available' };
}

// ============================================
// Component
// ============================================

export const PopulationReport = ({
  cardName,
  setName,
  cardNumber,
  gradingCompany,
  grade,
  className,
  compact = false,
}: PopulationReportProps) => {
  const [popData, setPopData] = useState<PopulationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(!compact);
  
  // Don't show for raw cards
  if (gradingCompany === 'raw') {
    return null;
  }
  
  const config = GRADING_COMPANY_CONFIG[gradingCompany];
  
  // Fetch population data
  const fetchPopulation = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API call to PSA/BGS
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network
      const data = generateMockPopulation(gradingCompany, cardName);
      data.setName = setName;
      data.cardNumber = cardNumber;
      setPopData(data);
    } catch (err: any) {
      console.error('Failed to fetch population:', err);
      setError('Could not load population data');
    } finally {
      setLoading(false);
    }
  }, [cardName, setName, cardNumber, gradingCompany]);
  
  // Fetch on mount
  useEffect(() => {
    fetchPopulation();
  }, [fetchPopulation]);
  
  // Calculate rarity
  const rarity = popData ? calculateRarityScore(popData, grade) : null;
  
  // Find user's grade in the data
  const userGradeData = popData?.grades.find(g => g.grade === grade);
  
  // Compact view
  if (compact) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between px-3 py-2 h-auto"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Population Report</span>
              {popData && (
                <Badge variant="secondary" className="text-xs">
                  {popData.totalPopulation.toLocaleString()} total
                </Badge>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-3 pb-3">
            {renderContent()}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }
  
  // Full view
  function renderContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading population data...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchPopulation} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </div>
      );
    }
    
    if (!popData) return null;
    
    return (
      <div className="space-y-4">
        {/* Header Stats */}
        <div className="grid grid-cols-2 gap-3">
          {/* Total Population */}
          <div className="bg-card/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Pop</span>
            </div>
            <p className="text-xl font-bold">{popData.totalPopulation.toLocaleString()}</p>
          </div>
          
          {/* Rarity Score */}
          {rarity && grade && (
            <div className="bg-card/50 rounded-lg p-3 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <Gem className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Rarity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-bold", rarity.color)}>
                  {rarity.label}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{rarity.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>
        
        {/* Your Grade Highlight */}
        {userGradeData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-lg p-3 border-2",
              config.bgColor,
              "border-current",
              config.color
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className={cn("h-5 w-5", config.color)} />
                <span className="font-medium">Your Grade: {config.name} {grade}</span>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{userGradeData.count.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {userGradeData.percentage.toFixed(1)}% of population
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Grade Distribution */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Grade Distribution
          </h4>
          
          <div className="space-y-1.5">
            {popData.grades.slice(0, 6).map((gradeItem) => {
              const isUserGrade = gradeItem.grade === grade;
              return (
                <div key={gradeItem.grade} className="group">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={cn(
                      "w-12 font-mono",
                      isUserGrade && "font-bold text-primary"
                    )}>
                      {gradeItem.grade}
                    </span>
                    <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${gradeItem.percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className={cn(
                          "h-full rounded-full",
                          isUserGrade ? "bg-primary" : "bg-muted-foreground/40",
                          "group-hover:opacity-80 transition-opacity"
                        )}
                      />
                    </div>
                    <span className={cn(
                      "w-16 text-right text-xs tabular-nums",
                      isUserGrade ? "font-bold" : "text-muted-foreground"
                    )}>
                      {gradeItem.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {popData.grades.length > 6 && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              +{popData.grades.length - 6} more grades
            </p>
          )}
        </div>
        
        {/* External Link */}
        {config.popUrl && (
          <div className="pt-2 border-t border-border/50">
            <a
              href={config.popUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span>View full {config.name} Pop Report</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card/30 p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <BarChart3 className={cn("h-5 w-5", config.color)} />
          {config.name} Population Report
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={fetchPopulation}
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>
      
      {renderContent()}
    </div>
  );
};

export default PopulationReport;
