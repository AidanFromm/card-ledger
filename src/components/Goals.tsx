import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Plus, 
  Trophy, 
  Check, 
  Trash2, 
  Edit2,
  DollarSign,
  Package,
  Award,
  Flame,
  Calendar,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { triggerCelebration } from './Celebration';
import { useToast } from '@/hooks/use-toast';

const GOALS_KEY = 'cardledger_goals';
const COMPLETED_GOALS_KEY = 'cardledger_completed_goals';

export type GoalType = 'value' | 'cards' | 'graded' | 'streak' | 'achievements' | 'custom';

export interface CollectionGoal {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  deadline?: string;
  createdAt: string;
  completedAt?: string;
  icon: string;
}

const GOAL_TEMPLATES = [
  { 
    type: 'value' as const, 
    title: 'Portfolio Value', 
    icon: 'DollarSign',
    presets: [1000, 5000, 10000, 25000, 50000, 100000],
    description: 'Reach a portfolio value of'
  },
  { 
    type: 'cards' as const, 
    title: 'Card Count', 
    icon: 'Package',
    presets: [50, 100, 250, 500, 1000, 2500],
    description: 'Collect a total of'
  },
  { 
    type: 'graded' as const, 
    title: 'Graded Cards', 
    icon: 'Award',
    presets: [5, 10, 25, 50, 100],
    description: 'Own graded cards totaling'
  },
  { 
    type: 'streak' as const, 
    title: 'Daily Streak', 
    icon: 'Flame',
    presets: [7, 14, 30, 60, 100],
    description: 'Maintain a login streak of'
  },
  { 
    type: 'achievements' as const, 
    title: 'Achievements', 
    icon: 'Trophy',
    presets: [5, 10, 20, 30, 40],
    description: 'Unlock achievements totaling'
  },
];

const getGoalIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    DollarSign: <DollarSign className="w-5 h-5" />,
    Package: <Package className="w-5 h-5" />,
    Award: <Award className="w-5 h-5" />,
    Flame: <Flame className="w-5 h-5" />,
    Trophy: <Trophy className="w-5 h-5" />,
    Target: <Target className="w-5 h-5" />,
  };
  return icons[iconName] || <Target className="w-5 h-5" />;
};

const formatGoalValue = (type: GoalType, value: number): string => {
  switch (type) {
    case 'value':
      return `$${value.toLocaleString()}`;
    case 'cards':
    case 'graded':
      return `${value} cards`;
    case 'streak':
      return `${value} days`;
    case 'achievements':
      return `${value} badges`;
    default:
      return value.toString();
  }
};

interface GoalsProps {
  // Current stats from the app
  portfolioValue?: number;
  cardCount?: number;
  gradedCount?: number;
  currentStreak?: number;
  achievementCount?: number;
}

export const Goals = ({
  portfolioValue = 0,
  cardCount = 0,
  gradedCount = 0,
  currentStreak = 0,
  achievementCount = 0,
}: GoalsProps) => {
  const [goals, setGoals] = useState<CollectionGoal[]>([]);
  const [completedGoals, setCompletedGoals] = useState<CollectionGoal[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CollectionGoal | null>(null);
  const { toast } = useToast();

  // Form state
  const [selectedType, setSelectedType] = useState<GoalType>('value');
  const [customTitle, setCustomTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [deadline, setDeadline] = useState('');

  // Load goals from localStorage
  useEffect(() => {
    try {
      const savedGoals = localStorage.getItem(GOALS_KEY);
      const savedCompleted = localStorage.getItem(COMPLETED_GOALS_KEY);
      
      if (savedGoals) setGoals(JSON.parse(savedGoals));
      if (savedCompleted) setCompletedGoals(JSON.parse(savedCompleted));
    } catch (e) {
      console.error('Error loading goals:', e);
    }
  }, []);

  // Save goals
  const saveGoals = useCallback((newGoals: CollectionGoal[], newCompleted: CollectionGoal[]) => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
    localStorage.setItem(COMPLETED_GOALS_KEY, JSON.stringify(newCompleted));
    setGoals(newGoals);
    setCompletedGoals(newCompleted);
  }, []);

  // Update goal progress based on current stats
  useEffect(() => {
    const updatedGoals = goals.map(goal => {
      let currentValue = goal.currentValue;
      
      switch (goal.type) {
        case 'value':
          currentValue = portfolioValue;
          break;
        case 'cards':
          currentValue = cardCount;
          break;
        case 'graded':
          currentValue = gradedCount;
          break;
        case 'streak':
          currentValue = currentStreak;
          break;
        case 'achievements':
          currentValue = achievementCount;
          break;
      }
      
      return { ...goal, currentValue };
    });

    // Check for newly completed goals
    const stillActive: CollectionGoal[] = [];
    const newlyCompleted: CollectionGoal[] = [];

    updatedGoals.forEach(goal => {
      if (goal.currentValue >= goal.targetValue && !goal.completedAt) {
        newlyCompleted.push({
          ...goal,
          completedAt: new Date().toISOString(),
        });
      } else {
        stillActive.push(goal);
      }
    });

    if (newlyCompleted.length > 0) {
      // Celebrate!
      triggerCelebration('big');
      newlyCompleted.forEach(goal => {
        toast({
          title: "🎯 Goal Achieved!",
          description: `You've reached your goal: ${goal.title}`,
        });
      });
      
      saveGoals(stillActive, [...completedGoals, ...newlyCompleted]);
    } else if (JSON.stringify(updatedGoals) !== JSON.stringify(goals)) {
      // Just update progress without completion
      setGoals(updatedGoals);
      localStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
    }
  }, [portfolioValue, cardCount, gradedCount, currentStreak, achievementCount]);

  // Create new goal
  const createGoal = () => {
    const template = GOAL_TEMPLATES.find(t => t.type === selectedType);
    const target = parseInt(targetValue);
    
    if (isNaN(target) || target <= 0) {
      toast({
        title: "Invalid target",
        description: "Please enter a valid target value",
        variant: "destructive",
      });
      return;
    }

    let currentValue = 0;
    switch (selectedType) {
      case 'value':
        currentValue = portfolioValue;
        break;
      case 'cards':
        currentValue = cardCount;
        break;
      case 'graded':
        currentValue = gradedCount;
        break;
      case 'streak':
        currentValue = currentStreak;
        break;
      case 'achievements':
        currentValue = achievementCount;
        break;
    }

    const newGoal: CollectionGoal = {
      id: crypto.randomUUID(),
      title: customTitle || `${template?.title}: ${formatGoalValue(selectedType, target)}`,
      description: template?.description || '',
      type: selectedType,
      targetValue: target,
      currentValue,
      deadline: deadline || undefined,
      createdAt: new Date().toISOString(),
      icon: template?.icon || 'Target',
    };

    saveGoals([...goals, newGoal], completedGoals);
    
    // Reset form
    setSelectedType('value');
    setCustomTitle('');
    setTargetValue('');
    setDeadline('');
    setIsCreateOpen(false);

    toast({
      title: "Goal Created!",
      description: `New goal: ${newGoal.title}`,
    });
  };

  // Delete goal
  const deleteGoal = (id: string, completed: boolean = false) => {
    if (completed) {
      saveGoals(goals, completedGoals.filter(g => g.id !== id));
    } else {
      saveGoals(goals.filter(g => g.id !== id), completedGoals);
    }
  };

  const selectedTemplate = GOAL_TEMPLATES.find(t => t.type === selectedType);

  return (
    <div className="space-y-6">
      {/* Active Goals */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          My Goals
        </h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {/* Goal Type */}
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as GoalType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TEMPLATES.map(template => (
                      <SelectItem key={template.type} value={template.type}>
                        <div className="flex items-center gap-2">
                          {getGoalIcon(template.icon)}
                          {template.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Presets */}
              {selectedTemplate && (
                <div className="space-y-2">
                  <Label>Quick Select</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.presets.map(preset => (
                      <Button
                        key={preset}
                        variant={targetValue === preset.toString() ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTargetValue(preset.toString())}
                      >
                        {formatGoalValue(selectedType, preset)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Target */}
              <div className="space-y-2">
                <Label>Target Value</Label>
                <Input
                  type="number"
                  placeholder="Enter custom target..."
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                />
              </div>

              {/* Custom Title (optional) */}
              <div className="space-y-2">
                <Label>Custom Title (Optional)</Label>
                <Input
                  placeholder="Give your goal a name..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                />
              </div>

              {/* Deadline (optional) */}
              <div className="space-y-2">
                <Label>Target Date (Optional)</Label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <Button onClick={createGoal} className="w-full gap-2">
                <Target className="w-4 h-4" />
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        <AnimatePresence>
          {goals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Goals Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set collection goals to stay motivated and track your progress
              </p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Goal
              </Button>
            </motion.div>
          ) : (
            goals.map((goal, index) => {
              const progress = Math.min(100, (goal.currentValue / goal.targetValue) * 100);
              const isClose = progress >= 80 && progress < 100;
              
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`
                    relative overflow-hidden
                    ${isClose ? 'ring-2 ring-amber-500/50' : ''}
                  `}>
                    {isClose && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-xs font-bold px-2 py-1 rounded-bl-lg">
                        Almost there!
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`
                          p-3 rounded-xl
                          ${isClose ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/20 text-primary'}
                        `}>
                          {getGoalIcon(goal.icon)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold truncate">{goal.title}</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteGoal(goal.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <span>{formatGoalValue(goal.type, goal.currentValue)}</span>
                            <ChevronRight className="w-4 h-4" />
                            <span className="font-medium text-foreground">
                              {formatGoalValue(goal.type, goal.targetValue)}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <Progress value={progress} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{progress.toFixed(0)}% complete</span>
                              {goal.deadline && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Due {new Date(goal.deadline).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4 mt-8">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
            <Trophy className="w-5 h-5 text-amber-500" />
            Completed Goals
          </h3>
          
          <div className="space-y-3">
            {completedGoals.slice(0, 5).map((goal) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
              >
                <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{goal.title}</span>
                  <span className="text-xs text-muted-foreground">
                    Completed {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
