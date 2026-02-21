import { useState, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Plus,
  Loader2,
  CheckCircle2,
  Truck,
  Clock,
  DollarSign,
  Calendar,
  ExternalLink,
  Pencil,
  Trash2,
  ChevronRight,
  Filter,
  Search,
  Award,
  BarChart3,
  Calculator,
  TrendingUp,
  TrendingDown,
  Target,
  Gem,
  Star,
  ArrowRight,
  Upload,
  Image,
  Info,
  Sparkles,
  Layers,
  PieChart,
  Activity,
  ChevronDown,
  GripVertical,
  RefreshCw,
} from "lucide-react";
import {
  useGradingSubmissions,
  GRADING_COMPANIES,
  GRADING_STATUSES,
  SERVICE_LEVELS,
  CONDITION_GRADE_PREDICTIONS,
  GRADE_VALUE_MULTIPLIERS,
  type GradingSubmission,
  type GradingStatus,
  type ExtendedGradingSubmission,
} from "@/hooks/useGradingSubmissions";
import { useInventoryDb } from "@/hooks/useInventoryDb";
import { getPlaceholderForItem } from "@/lib/cardNameUtils";
import { triggerHaptic, triggerSuccessHaptic } from "@/lib/haptics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPie,
  Pie,
} from "recharts";
import { cn } from "@/lib/utils";
import CardImage from "@/components/CardImage";
import CenteringTool from "@/components/CenteringTool";

// ============================================================================
// Glass Card Component
// ============================================================================

const GlassCard = memo(({ children, className = "", glowColor }: { 
  children: React.ReactNode; 
  className?: string; 
  glowColor?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "relative overflow-hidden",
      "bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-900/40",
      "backdrop-blur-xl border border-zinc-800/50 rounded-2xl",
      "transition-all duration-300 hover:border-zinc-700/60",
      className
    )}
    style={{
      boxShadow: glowColor ? `0 0 40px ${glowColor}` : undefined,
    }}
  >
    {children}
  </motion.div>
));

// ============================================================================
// Stat Card Component
// ============================================================================

const StatCard = memo(({ 
  label, 
  value, 
  icon: Icon, 
  color = "text-primary",
  subValue,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
}) => (
  <GlassCard className="p-4">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={cn("text-2xl font-bold", color)}>{value}</p>
        {subValue && (
          <div className="flex items-center gap-1 mt-1">
            {trend === 'up' && <TrendingUp className="h-3 w-3 text-navy-400" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-400" />}
            <span className="text-xs text-muted-foreground">{subValue}</span>
          </div>
        )}
      </div>
      <div className={cn("p-2 rounded-xl bg-gradient-to-br", color.replace('text-', 'from-') + '/20', 'to-transparent')}>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
    </div>
  </GlassCard>
));

// ============================================================================
// Kanban Column Component
// ============================================================================

const KanbanColumn = memo(({ 
  status, 
  submissions, 
  onCardClick,
  onDrop,
}: {
  status: typeof GRADING_STATUSES[number];
  submissions: ExtendedGradingSubmission[];
  onCardClick: (submission: ExtendedGradingSubmission) => void;
  onDrop: (submissionId: string, newStatus: GradingStatus) => void;
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('ring-2', 'ring-primary/50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('ring-2', 'ring-primary/50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-primary/50');
    const submissionId = e.dataTransfer.getData('submissionId');
    if (submissionId) {
      onDrop(submissionId, status.value);
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-72 md:w-80"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={cn(
        "rounded-xl border transition-all duration-200",
        status.bgColor,
        "border-zinc-800/50"
      )}>
        {/* Column Header */}
        <div className="p-3 border-b border-zinc-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", status.color.replace('text-', 'bg-'))} />
              <span className={cn("font-semibold text-sm", status.color)}>{status.label}</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              {submissions.length}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{status.description}</p>
        </div>

        {/* Column Content */}
        <div className="p-2 space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {submissions.map((submission) => (
              <KanbanCard 
                key={submission.id} 
                submission={submission} 
                onClick={() => onCardClick(submission)}
              />
            ))}
          </AnimatePresence>
          
          {submissions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Drop cards here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Kanban Card Component
// ============================================================================

const KanbanCard = memo(({ 
  submission, 
  onClick 
}: { 
  submission: ExtendedGradingSubmission;
  onClick: () => void;
}) => {
  const companyInfo = GRADING_COMPANIES.find(c => c.value === submission.grading_company);
  const totalCost = (submission.submission_cost || 0) + (submission.shipping_cost || 0) + (submission.insurance_cost || 0);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('submissionId', submission.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={cn(
        "bg-card/80 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-3",
        "cursor-grab active:cursor-grabbing hover:border-primary/30",
        "transition-all duration-200"
      )}
    >
      <div className="flex gap-3">
        {/* Card Thumbnail */}
        <div className="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted/30">
          <CardImage
            src={submission.card_image_url}
            alt={submission.card_name}
            size="sm"
            rounded="lg"
            containerClassName="w-full h-full"
            className="w-full h-full object-contain"
            loading="lazy"
            graded={!!submission.returned_grade}
            gradingCompany={submission.grading_company}
            grade={submission.returned_grade}
          />
        </div>

        {/* Card Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-xs line-clamp-1">{submission.card_name}</h4>
          <p className="text-[10px] text-muted-foreground line-clamp-1">
            {submission.set_name}
          </p>
          
          <div className="flex items-center gap-1.5 mt-2">
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold">
              {companyInfo?.label}
            </Badge>
            {submission.final_grade && (
              <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">
                <Star className="h-2.5 w-2.5 mr-0.5" />
                {submission.final_grade}
              </Badge>
            )}
          </div>
        </div>

        <GripVertical className="h-4 w-4 text-muted-foreground/30 flex-shrink-0 self-center" />
      </div>

      {/* Progress Bar for Active Submissions */}
      {submission.status !== 'complete' && submission.expected_return_date && (
        <div className="mt-2">
          <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
            <span>{format(new Date(submission.submission_date), 'MMM d')}</span>
            <span>{format(new Date(submission.expected_return_date), 'MMM d')}</span>
          </div>
          <Progress 
            value={calculateProgress(submission.submission_date, submission.expected_return_date)} 
            className="h-1"
          />
        </div>
      )}
    </motion.div>
  );
});

// Calculate progress between submission and expected return date
const calculateProgress = (start: string, end: string): number => {
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  const now = Date.now();
  
  if (now <= startDate) return 0;
  if (now >= endDate) return 100;
  
  return Math.round(((now - startDate) / (endDate - startDate)) * 100);
};

// ============================================================================
// Grade Distribution Chart
// ============================================================================

const GradeDistributionChart = memo(({ data }: { data: Record<string, number> }) => {
  const chartData = Object.entries(data)
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => parseFloat(b.grade) - parseFloat(a.grade));

  const colors = {
    '10': '#10B981',
    '9.5': '#34D399',
    '9': '#6EE7B7',
    '8.5': '#FCD34D',
    '8': '#FBBF24',
    '7.5': '#F59E0B',
    '7': '#FB923C',
  };

  const getColor = (grade: string) => {
    const numGrade = parseFloat(grade);
    if (numGrade >= 10) return '#10B981';
    if (numGrade >= 9) return '#34D399';
    if (numGrade >= 8) return '#FBBF24';
    if (numGrade >= 7) return '#F59E0B';
    return '#EF4444';
  };

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        No graded cards yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis 
          dataKey="grade" 
          tick={{ fill: '#71717a', fontSize: 10 }} 
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          tick={{ fill: '#71717a', fontSize: 10 }} 
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#18181b', 
            border: '1px solid #27272a',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#fafafa' }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.grade)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});

// ============================================================================
// Company Distribution Pie Chart
// ============================================================================

const CompanyDistributionChart = memo(({ data }: { data: Record<string, number> }) => {
  const chartData = Object.entries(data).map(([company, count]) => ({
    name: company.toUpperCase(),
    value: count,
  }));

  const colors = ['#14B8A6', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981'];

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        No submissions yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsPie>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={3}
          dataKey="value"
          label={({ name, value }) => `${name}: ${value}`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#18181b', 
            border: '1px solid #27272a',
            borderRadius: '8px',
          }}
        />
      </RechartsPie>
    </ResponsiveContainer>
  );
});

// ============================================================================
// Grade Predictor Component
// ============================================================================

const GradePredictor = memo(({ calculateGradingROI }: { 
  calculateGradingROI: (rawValue: number, condition: string, gradingCost: number) => any;
}) => {
  const [rawValue, setRawValue] = useState(50);
  const [condition, setCondition] = useState('near-mint');
  const [gradingCost, setGradingCost] = useState(30);

  const prediction = useMemo(() => 
    calculateGradingROI(rawValue, condition, gradingCost),
    [rawValue, condition, gradingCost, calculateGradingROI]
  );

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">Grade Predictor & ROI Calculator</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-5">
          <div>
            <Label className="text-sm text-muted-foreground">Raw Card Value</Label>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-2xl font-bold text-primary">${rawValue}</span>
              <Slider
                value={[rawValue]}
                onValueChange={([v]) => setRawValue(v)}
                min={10}
                max={1000}
                step={10}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Card Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mint">Mint (Pack Fresh)</SelectItem>
                <SelectItem value="near-mint">Near Mint</SelectItem>
                <SelectItem value="lightly-played">Lightly Played</SelectItem>
                <SelectItem value="moderately-played">Moderately Played</SelectItem>
                <SelectItem value="heavily-played">Heavily Played</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Grading Cost</Label>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xl font-bold">${gradingCost}</span>
              <Slider
                value={[gradingCost]}
                onValueChange={([v]) => setGradingCost(v)}
                min={15}
                max={300}
                step={5}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {/* Grade Prediction */}
          <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
            <h4 className="text-xs text-muted-foreground mb-2">Estimated Grade Range</h4>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <span className="text-lg font-bold text-red-400">{prediction.prediction.min}</span>
                <p className="text-[10px] text-muted-foreground">Low</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-center">
                <span className="text-2xl font-bold text-primary">{prediction.prediction.likely}</span>
                <p className="text-[10px] text-muted-foreground">Likely</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-center">
                <span className="text-lg font-bold text-navy-400">{prediction.prediction.max}</span>
                <p className="text-[10px] text-muted-foreground">High</p>
              </div>
            </div>
          </div>

          {/* Value Estimates */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-900/50 rounded-lg p-3 text-center border border-zinc-800/50">
              <p className="text-[10px] text-muted-foreground">Min Value</p>
              <p className="text-sm font-bold text-red-400">
                ${prediction.estimatedValues.min.toFixed(0)}
              </p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-3 text-center border border-primary/30">
              <p className="text-[10px] text-muted-foreground">Likely Value</p>
              <p className="text-lg font-bold text-primary">
                ${prediction.estimatedValues.likely.toFixed(0)}
              </p>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-3 text-center border border-zinc-800/50">
              <p className="text-[10px] text-muted-foreground">Max Value</p>
              <p className="text-sm font-bold text-navy-400">
                ${prediction.estimatedValues.max.toFixed(0)}
              </p>
            </div>
          </div>

          {/* ROI Result */}
          <div className={cn(
            "rounded-xl p-4 text-center border",
            prediction.roi > 50 ? "bg-navy-500/10 border-navy-500/30" :
            prediction.roi > 0 ? "bg-amber-500/10 border-amber-500/30" :
            "bg-red-500/10 border-red-500/30"
          )}>
            <p className="text-xs text-muted-foreground mb-1">Expected ROI</p>
            <p className={cn("text-3xl font-bold", prediction.recommendationColor)}>
              {prediction.roi > 0 ? '+' : ''}{prediction.roi.toFixed(0)}%
            </p>
            <p className={cn("text-sm font-medium mt-1", prediction.recommendationColor)}>
              {prediction.recommendation}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Net Gain: ${prediction.netGain > 0 ? '+' : ''}{prediction.netGain.toFixed(0)}
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
});

// ============================================================================
// Add Submission Dialog
// ============================================================================

interface AddSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  inventoryItems: any[];
  selectedSubmission?: ExtendedGradingSubmission | null;
}

const AddSubmissionDialog = memo(({
  open,
  onOpenChange,
  onSubmit,
  inventoryItems,
  selectedSubmission,
}: AddSubmissionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>('');
  const [formData, setFormData] = useState({
    card_name: '',
    set_name: '',
    card_number: '',
    card_image_url: '',
    grading_company: 'psa',
    service_level: 'regular',
    submission_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    tracking_number: '',
    submission_cost: '',
    shipping_cost: '',
    insurance_cost: '',
    notes: '',
    raw_value: '',
    graded_value: '',
  });

  // Reset form when dialog opens
  const resetForm = useCallback(() => {
    setSelectedInventoryId('');
    setFormData({
      card_name: selectedSubmission?.card_name || '',
      set_name: selectedSubmission?.set_name || '',
      card_number: selectedSubmission?.card_number || '',
      card_image_url: selectedSubmission?.card_image_url || '',
      grading_company: selectedSubmission?.grading_company || 'psa',
      service_level: selectedSubmission?.service_level || 'regular',
      submission_date: selectedSubmission?.submission_date?.split('T')[0] || new Date().toISOString().split('T')[0],
      expected_return_date: selectedSubmission?.expected_return_date?.split('T')[0] || '',
      tracking_number: selectedSubmission?.tracking_number || '',
      submission_cost: selectedSubmission?.submission_cost?.toString() || '',
      shipping_cost: selectedSubmission?.shipping_cost?.toString() || '',
      insurance_cost: selectedSubmission?.insurance_cost?.toString() || '',
      notes: selectedSubmission?.notes || '',
      raw_value: selectedSubmission?.raw_value?.toString() || '',
      graded_value: selectedSubmission?.graded_value?.toString() || '',
    });
  }, [selectedSubmission]);

  // Populate form when selecting from inventory
  const handleInventorySelect = (itemId: string) => {
    setSelectedInventoryId(itemId);
    const item = inventoryItems.find(i => i.id === itemId);
    if (item) {
      setFormData(prev => ({
        ...prev,
        card_name: item.name,
        set_name: item.set_name,
        card_number: item.card_number || '',
        card_image_url: item.card_image_url || '',
        raw_value: item.market_price?.toString() || item.purchase_price?.toString() || '',
      }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Build notes with embedded values
      let notes = formData.notes;
      if (formData.raw_value) notes += ` raw_value:${formData.raw_value}`;
      if (formData.graded_value) notes += ` graded_value:${formData.graded_value}`;

      await onSubmit({
        ...formData,
        notes: notes.trim(),
        inventory_item_id: selectedInventoryId || null,
        submission_cost: parseFloat(formData.submission_cost) || 0,
        shipping_cost: parseFloat(formData.shipping_cost) || 0,
        insurance_cost: parseFloat(formData.insurance_cost) || 0,
      });
      onOpenChange(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Raw inventory items (ungraded)
  const rawInventoryItems = useMemo(() => 
    inventoryItems.filter(i => i.grading_company === 'raw' || !i.grade),
    [inventoryItems]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            {selectedSubmission ? 'Edit Submission' : 'New Grading Submission'}
          </DialogTitle>
          <DialogDescription>
            {selectedSubmission ? 'Update submission details' : 'Track a card being sent for professional grading'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Select from Inventory */}
          {!selectedSubmission && rawInventoryItems.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Select from Inventory
              </Label>
              <Select value={selectedInventoryId} onValueChange={handleInventorySelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a card from your inventory..." />
                </SelectTrigger>
                <SelectContent>
                  {rawInventoryItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        {item.card_image_url && (
                          <CardImage 
                            src={item.card_image_url} 
                            alt={item.name}
                            size="xs" 
                            rounded="md"
                            containerClassName="w-6 h-8"
                            className="w-full h-full object-contain" 
                          />
                        )}
                        <span className="truncate">{item.name}</span>
                        <span className="text-muted-foreground text-xs">({item.set_name})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Or enter card details manually below</p>
            </div>
          )}

          {/* Card Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" /> Card Details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 md:col-span-1">
                <Label>Card Name *</Label>
                <Input
                  placeholder="e.g., Charizard"
                  value={formData.card_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, card_name: e.target.value }))}
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label>Set Name</Label>
                <Input
                  placeholder="e.g., Base Set"
                  value={formData.set_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, set_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Card Number</Label>
                <Input
                  placeholder="e.g., 4/102"
                  value={formData.card_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, card_number: e.target.value }))}
                />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  placeholder="Card image URL"
                  value={formData.card_image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, card_image_url: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Grading Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" /> Grading Details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Grading Company *</Label>
                <Select
                  value={formData.grading_company}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, grading_company: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADING_COMPANIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{c.label}</span>
                          <span className="text-muted-foreground text-xs">- {c.fullName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service Level</Label>
                <Select
                  value={formData.service_level}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, service_level: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_LEVELS.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center gap-2">
                          <span>{s.label}</span>
                          <span className="text-muted-foreground text-xs">({s.days})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Dates & Tracking */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Dates & Tracking
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label>Submission Date</Label>
                <Input
                  type="date"
                  value={formData.submission_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, submission_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Expected Return</Label>
                <Input
                  type="date"
                  value={formData.expected_return_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expected_return_date: e.target.value }))}
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <Label>Tracking Number</Label>
                <Input
                  placeholder="Enter tracking #"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Costs */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Costs
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Grading Fee</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.submission_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, submission_cost: e.target.value }))}
                    className="pl-7"
                  />
                </div>
              </div>
              <div>
                <Label>Shipping</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.shipping_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, shipping_cost: e.target.value }))}
                    className="pl-7"
                  />
                </div>
              </div>
              <div>
                <Label>Insurance</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.insurance_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, insurance_cost: e.target.value }))}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Value Tracking */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Value Tracking (Optional)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Raw Value (Before)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.raw_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, raw_value: e.target.value }))}
                    className="pl-7"
                  />
                </div>
              </div>
              <div>
                <Label>Graded Value (After)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.graded_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, graded_value: e.target.value }))}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Add any notes about this submission..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.card_name || !formData.grading_company || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Award className="h-4 w-4" />
            )}
            {selectedSubmission ? 'Save Changes' : 'Create Submission'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============================================================================
// Submission Detail Dialog
// ============================================================================

const SubmissionDetailDialog = memo(({
  open,
  onOpenChange,
  submission,
  onEdit,
  onUpdateStatus,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: ExtendedGradingSubmission | null;
  onEdit: () => void;
  onUpdateStatus: (status: GradingStatus, grade?: string, cert?: string) => void;
  onDelete: () => void;
}) => {
  const [newStatus, setNewStatus] = useState<GradingStatus>('submitted');
  const [finalGrade, setFinalGrade] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const companyInfo = GRADING_COMPANIES.find(c => c.value === submission?.grading_company);
  const statusInfo = GRADING_STATUSES.find(s => s.value === submission?.status);
  const totalCost = submission 
    ? (submission.submission_cost || 0) + (submission.shipping_cost || 0) + (submission.insurance_cost || 0)
    : 0;

  // Reset state when submission changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && submission) {
      setNewStatus(submission.status);
      setFinalGrade(submission.final_grade || '');
      setCertNumber(submission.cert_number || '');
    }
    onOpenChange(isOpen);
  };

  if (!submission) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {submission.card_image_url && (
                <CardImage 
                  src={submission.card_image_url} 
                  alt={submission.card_name}
                  size="sm"
                  rounded="lg"
                  containerClassName="w-12 h-16"
                  className="w-full h-full object-contain"
                  graded={!!submission.returned_grade}
                  gradingCompany={submission.grading_company}
                  grade={submission.returned_grade}
                />
              )}
              <div>
                <h3 className="font-bold">{submission.card_name}</h3>
                <p className="text-sm text-muted-foreground font-normal">
                  {submission.set_name} {submission.card_number && `#${submission.card_number}`}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status & Company */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-bold">
                {companyInfo?.label}
              </Badge>
              <Badge className={cn(statusInfo?.bgColor, statusInfo?.color)}>
                {statusInfo?.label}
              </Badge>
              {submission.final_grade && (
                <Badge className="bg-amber-500/20 text-amber-400">
                  <Star className="h-3 w-3 mr-1" />
                  Grade: {submission.final_grade}
                </Badge>
              )}
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                {GRADING_STATUSES.map((s, i) => (
                  <span 
                    key={s.value}
                    className={cn(
                      "transition-colors",
                      GRADING_STATUSES.findIndex(st => st.value === submission.status) >= i 
                        ? "text-primary" 
                        : ""
                    )}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
              <Progress 
                value={(GRADING_STATUSES.findIndex(s => s.value === submission.status) + 1) / GRADING_STATUSES.length * 100} 
                className="h-2"
              />
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                <p className="font-medium">{format(new Date(submission.submission_date), 'MMM d, yyyy')}</p>
              </div>
              {submission.expected_return_date && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Expected Return</p>
                  <p className="font-medium">{format(new Date(submission.expected_return_date), 'MMM d, yyyy')}</p>
                </div>
              )}
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                <p className="font-medium">${totalCost.toFixed(2)}</p>
              </div>
              {submission.tracking_number && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Tracking</p>
                  <p className="font-medium text-xs truncate">{submission.tracking_number}</p>
                </div>
              )}
            </div>

            {/* ROI Section (for completed) */}
            {submission.status === 'complete' && submission.raw_value && submission.graded_value && (
              <div className="bg-gradient-to-r from-navy-500/10 to-primary/10 rounded-xl p-4 border border-navy-500/20">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-navy-400" />
                  Value Analysis
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Raw Value</p>
                    <p className="font-bold">${submission.raw_value}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Graded Value</p>
                    <p className="font-bold text-navy-400">${submission.graded_value}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ROI</p>
                    <p className={cn(
                      "font-bold",
                      (submission.roi_percent || 0) > 0 ? "text-navy-400" : "text-red-400"
                    )}>
                      {(submission.roi_percent || 0) > 0 ? '+' : ''}{(submission.roi_percent || 0).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pop Report Link */}
            {companyInfo?.popReportUrl && (
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => window.open(companyInfo.popReportUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                View {companyInfo.label} Population Report
              </Button>
            )}

            {/* Status Update (if not complete) */}
            {submission.status !== 'complete' && (
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <h4 className="text-sm font-medium">Update Status</h4>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as GradingStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADING_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", s.color.replace('text-', 'bg-'))} />
                          <span>{s.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {newStatus === 'complete' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Final Grade</Label>
                      <Input
                        placeholder="e.g., 9.5"
                        value={finalGrade}
                        onChange={(e) => setFinalGrade(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Cert Number</Label>
                      <Input
                        placeholder="Certificate #"
                        value={certNumber}
                        onChange={(e) => setCertNumber(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full"
                  onClick={() => {
                    onUpdateStatus(newStatus, finalGrade, certNumber);
                    onOpenChange(false);
                  }}
                >
                  Update to {GRADING_STATUSES.find(s => s.value === newStatus)?.label}
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 text-destructive hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the grading submission for "{submission?.card_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDelete();
                setShowDeleteConfirm(false);
                onOpenChange(false);
              }} 
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

// ============================================================================
// Main Grading Center Component
// ============================================================================

const GradingCenter = () => {
  const {
    submissions,
    loading,
    refetch,
    createSubmission,
    updateSubmission,
    updateStatus,
    deleteSubmission,
    activeSubmissions,
    completedSubmissions,
    totalCosts,
    statistics,
    calculateGradingROI,
    getByStatus,
  } = useGradingSubmissions();

  const { items: inventoryItems } = useInventoryDb();

  const [activeTab, setActiveTab] = useState('pipeline');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ExtendedGradingSubmission | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCenteringTool, setShowCenteringTool] = useState(false);

  // Handle drag and drop status update
  const handleDrop = useCallback(async (submissionId: string, newStatus: GradingStatus) => {
    try {
      await updateStatus(submissionId, newStatus);
      triggerSuccessHaptic();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }, [updateStatus]);

  // Handle card click
  const handleCardClick = useCallback((submission: ExtendedGradingSubmission) => {
    setSelectedSubmission(submission);
    setShowDetailDialog(true);
  }, []);

  // Handle add submission
  const handleAddSubmission = useCallback(async (data: any) => {
    await createSubmission(data);
    triggerSuccessHaptic();
  }, [createSubmission]);

  // Handle edit
  const handleEdit = useCallback(() => {
    setShowDetailDialog(false);
    setShowAddDialog(true);
  }, []);

  // Handle status update
  const handleStatusUpdate = useCallback(async (status: GradingStatus, grade?: string, cert?: string) => {
    if (selectedSubmission) {
      await updateStatus(selectedSubmission.id, status, grade, cert);
      triggerSuccessHaptic();
    }
  }, [selectedSubmission, updateStatus]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (selectedSubmission) {
      await deleteSubmission(selectedSubmission.id);
      setSelectedSubmission(null);
    }
  }, [selectedSubmission, deleteSubmission]);

  // Filter submissions by search
  const filteredSubmissions = useMemo(() => {
    if (!searchQuery) return submissions;
    const query = searchQuery.toLowerCase();
    return submissions.filter(s =>
      s.card_name.toLowerCase().includes(query) ||
      s.set_name?.toLowerCase().includes(query) ||
      s.grading_company.toLowerCase().includes(query)
    );
  }, [submissions, searchQuery]);

  // Group submissions by status for Kanban
  const submissionsByStatus = useMemo(() => {
    const grouped: Record<GradingStatus, ExtendedGradingSubmission[]> = {
      submitted: [],
      received: [],
      grading: [],
      shipped: [],
      complete: [],
    };
    
    filteredSubmissions.forEach(s => {
      grouped[s.status].push(s);
    });
    
    return grouped;
  }, [filteredSubmissions]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8 max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Award className="h-6 w-6 text-amber-500" />
                  Grading Center
                </h1>
                <p className="text-sm text-zinc-400">Track, analyze, and optimize your grading submissions</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setShowCenteringTool(true)} className="gap-2">
                  <Target className="h-4 w-4" />
                  Centering
                </Button>
                <Button onClick={() => { setSelectedSubmission(null); setShowAddDialog(true); }} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Submission
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                label="Active Submissions"
                value={statistics.activeCount}
                icon={Package}
                color="text-amber-400"
              />
              <StatCard
                label="Completed"
                value={statistics.completedCount}
                icon={CheckCircle2}
                color="text-navy-400"
              />
              <StatCard
                label="Avg Grade"
                value={statistics.averageGrade.toFixed(1)}
                icon={Star}
                color="text-primary"
              />
              <StatCard
                label="Total Invested"
                value={`$${totalCosts.total.toFixed(0)}`}
                icon={DollarSign}
                color="text-blue-400"
              />
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-zinc-900/50 border border-zinc-800">
              <TabsTrigger value="pipeline" className="gap-2">
                <Layers className="h-4 w-4" />
                Pipeline
              </TabsTrigger>
              <TabsTrigger value="statistics" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="predictor" className="gap-2">
                <Calculator className="h-4 w-4" />
                Predictor
              </TabsTrigger>
            </TabsList>

            {/* Pipeline Tab */}
            <TabsContent value="pipeline" className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-zinc-900/50 border-zinc-800"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : submissions.length === 0 ? (
                <GlassCard className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
                    <Package className="h-10 w-10 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No Grading Submissions</h3>
                  <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">
                    Track your cards sent out for grading. Monitor status, costs, and results all in one place.
                  </p>
                  <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add First Submission
                  </Button>
                </GlassCard>
              ) : (
                <div className="overflow-x-auto pb-4 -mx-4 px-4">
                  <div className="flex gap-4 min-w-max">
                    {GRADING_STATUSES.map((status) => (
                      <KanbanColumn
                        key={status.value}
                        status={status}
                        submissions={submissionsByStatus[status.value]}
                        onCardClick={handleCardClick}
                        onDrop={handleDrop}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Grade Distribution */}
                <GlassCard className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Grade Distribution
                  </h3>
                  <GradeDistributionChart data={statistics.gradeDistribution} />
                </GlassCard>

                {/* Company Distribution */}
                <GlassCard className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Submissions by Company
                  </h3>
                  <CompanyDistributionChart data={statistics.companyDistribution} />
                </GlassCard>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Perfect 10s"
                  value={statistics.perfect10s}
                  icon={Gem}
                  color="text-navy-400"
                />
                <StatCard
                  label="Gem Mint (9+)"
                  value={statistics.gem9s}
                  icon={Sparkles}
                  color="text-primary"
                />
                <StatCard
                  label="Value Gained"
                  value={`$${statistics.totalValueGained.toFixed(0)}`}
                  icon={TrendingUp}
                  color="text-navy-400"
                  trend={statistics.totalValueGained > 0 ? 'up' : 'down'}
                />
                <StatCard
                  label="Overall ROI"
                  value={`${statistics.overallROI > 0 ? '+' : ''}${statistics.overallROI.toFixed(0)}%`}
                  icon={Activity}
                  color={statistics.overallROI > 0 ? "text-navy-400" : "text-red-400"}
                />
              </div>

              {/* Cost Breakdown */}
              <GlassCard className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Cost Breakdown
                </h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Grading Fees</p>
                    <p className="text-xl font-bold">${totalCosts.submission.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Shipping</p>
                    <p className="text-xl font-bold">${totalCosts.shipping.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Insurance</p>
                    <p className="text-xl font-bold">${totalCosts.insurance.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-primary">${totalCosts.total.toFixed(0)}</p>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>

            {/* Predictor Tab */}
            <TabsContent value="predictor">
              <GradePredictor calculateGradingROI={calculateGradingROI} />

              {/* Grade Value Reference */}
              <GlassCard className="p-6 mt-4">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Grade Value Multipliers (Reference)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  These are approximate value multipliers compared to raw card value. Actual results vary by card.
                </p>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {Object.entries(GRADE_VALUE_MULTIPLIERS).map(([grade, multiplier]) => (
                    <div 
                      key={grade}
                      className={cn(
                        "text-center p-2 rounded-lg border",
                        parseFloat(grade) >= 9 ? "bg-navy-500/10 border-navy-500/30" :
                        parseFloat(grade) >= 7 ? "bg-amber-500/10 border-amber-500/30" :
                        "bg-zinc-800/50 border-zinc-700/30"
                      )}
                    >
                      <p className="font-bold text-sm">{grade}</p>
                      <p className="text-xs text-muted-foreground">{multiplier}x</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </main>
      </PageTransition>
      <BottomNav />

      {/* Add/Edit Dialog */}
      <AddSubmissionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={selectedSubmission 
          ? (data) => updateSubmission(selectedSubmission.id, data)
          : handleAddSubmission
        }
        inventoryItems={inventoryItems}
        selectedSubmission={selectedSubmission}
      />

      {/* Detail Dialog */}
      <SubmissionDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        submission={selectedSubmission}
        onEdit={handleEdit}
        onUpdateStatus={handleStatusUpdate}
        onDelete={handleDelete}
      />

      {/* Centering Tool */}
      <CenteringTool
        open={showCenteringTool}
        onOpenChange={setShowCenteringTool}
        cardName={selectedSubmission?.card_name}
      />
    </div>
  );
};

export default GradingCenter;
