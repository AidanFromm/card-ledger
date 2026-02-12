import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Circle,
  Truck,
  Clock,
  DollarSign,
  Calendar,
  Hash,
  ExternalLink,
  Pencil,
  Trash2,
  ChevronRight,
  Filter,
  Search,
  Award,
} from "lucide-react";
import {
  useGradingSubmissions,
  GRADING_COMPANIES,
  GRADING_STATUSES,
  type GradingSubmission,
  type GradingStatus,
} from "@/hooks/useGradingSubmissions";
import { getPlaceholderForItem } from "@/lib/cardNameUtils";
import { triggerHaptic, triggerSuccessHaptic } from "@/lib/haptics";

// Status progress indicator
const StatusProgress = ({ status }: { status: GradingStatus }) => {
  const statusIndex = GRADING_STATUSES.findIndex(s => s.value === status);
  
  return (
    <div className="flex items-center gap-1 w-full">
      {GRADING_STATUSES.map((s, i) => (
        <div key={s.value} className="flex items-center flex-1">
          <div className={`w-full h-1.5 rounded-full transition-colors ${
            i <= statusIndex ? 'bg-primary' : 'bg-muted'
          }`} />
        </div>
      ))}
    </div>
  );
};

// Submission Card Component
const SubmissionCard = ({
  submission,
  onEdit,
  onUpdateStatus,
  onDelete,
}: {
  submission: GradingSubmission;
  onEdit: () => void;
  onUpdateStatus: () => void;
  onDelete: () => void;
}) => {
  const statusInfo = GRADING_STATUSES.find(s => s.value === submission.status);
  const companyInfo = GRADING_COMPANIES.find(c => c.value === submission.grading_company);
  const totalCost = (submission.submission_cost || 0) + (submission.shipping_cost || 0) + (submission.insurance_cost || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="bg-card border rounded-2xl overflow-hidden"
    >
      <div className="p-4">
        {/* Header with image and info */}
        <div className="flex gap-4">
          {/* Card Image */}
          <div className="w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-muted/30">
            {submission.card_image_url ? (
              <img
                src={submission.card_image_url}
                alt={submission.card_name}
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={getPlaceholderForItem({ category: 'raw', grading_company: 'raw' })}
                alt="Placeholder"
                className="w-full h-full object-contain p-2 opacity-50"
              />
            )}
          </div>

          {/* Card Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">{submission.card_name}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
              {submission.set_name}
              {submission.card_number && <span> #{submission.card_number}</span>}
            </p>

            {/* Company & Status */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px] font-bold">
                {companyInfo?.label || submission.grading_company.toUpperCase()}
              </Badge>
              <Badge className={`text-[10px] ${statusInfo?.color || ''}`}>
                {statusInfo?.label || submission.status}
              </Badge>
            </div>

            {/* Final Grade (if complete) */}
            {submission.status === 'complete' && submission.final_grade && (
              <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg w-fit">
                <Award className="h-3.5 w-3.5" />
                <span className="text-sm font-bold">{submission.final_grade}</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status Progress */}
        <div className="mt-4 mb-3">
          <StatusProgress status={submission.status} />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Submitted {format(new Date(submission.submission_date), 'MMM d, yyyy')}</span>
          </div>
          {submission.tracking_number && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-3.5 w-3.5" />
              <span className="truncate">{submission.tracking_number}</span>
            </div>
          )}
          {totalCost > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <span>${totalCost.toFixed(2)} total cost</span>
            </div>
          )}
          {submission.expected_return_date && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Expected {format(new Date(submission.expected_return_date), 'MMM d')}</span>
            </div>
          )}
        </div>

        {/* Update Status Button */}
        {submission.status !== 'complete' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={onUpdateStatus}
          >
            Update Status
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// Empty State
const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
  >
    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
      <Package className="h-10 w-10 text-amber-500" />
    </div>
    <h3 className="text-lg font-bold text-white mb-2">No Grading Submissions</h3>
    <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">
      Track your cards sent out for grading. Monitor status, costs, and results all in one place.
    </p>
    <Button onClick={onAdd} className="gap-2">
      <Plus className="h-4 w-4" />
      Add Submission
    </Button>
  </motion.div>
);

// Skeleton Loader
const SubmissionSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-card border rounded-2xl p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="w-20 h-28 bg-muted rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-5 bg-muted rounded w-12" />
              <div className="h-5 bg-muted rounded w-16" />
            </div>
          </div>
        </div>
        <div className="h-1.5 bg-muted rounded mt-4" />
      </div>
    ))}
  </div>
);

const GradingTracker = () => {
  const {
    submissions,
    loading,
    createSubmission,
    updateSubmission,
    updateStatus,
    deleteSubmission,
    activeSubmissions,
    completedSubmissions,
    totalCosts,
  } = useGradingSubmissions();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<GradingSubmission | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'complete'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    card_name: '',
    set_name: '',
    card_number: '',
    grading_company: 'psa',
    submission_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    tracking_number: '',
    submission_cost: '',
    shipping_cost: '',
    insurance_cost: '',
    service_level: '',
    notes: '',
  });

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    let result = submissions;

    if (filter === 'active') {
      result = activeSubmissions;
    } else if (filter === 'complete') {
      result = completedSubmissions;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.card_name.toLowerCase().includes(query) ||
        s.set_name?.toLowerCase().includes(query) ||
        s.grading_company.toLowerCase().includes(query)
      );
    }

    return result;
  }, [submissions, filter, searchQuery, activeSubmissions, completedSubmissions]);

  const resetForm = () => {
    setFormData({
      card_name: '',
      set_name: '',
      card_number: '',
      grading_company: 'psa',
      submission_date: new Date().toISOString().split('T')[0],
      expected_return_date: '',
      tracking_number: '',
      submission_cost: '',
      shipping_cost: '',
      insurance_cost: '',
      service_level: '',
      notes: '',
    });
  };

  const handleAddSubmission = async () => {
    if (!formData.card_name || !formData.grading_company) return;

    setIsSubmitting(true);
    try {
      await createSubmission({
        card_name: formData.card_name,
        set_name: formData.set_name || null,
        card_number: formData.card_number || null,
        grading_company: formData.grading_company,
        submission_date: formData.submission_date,
        expected_return_date: formData.expected_return_date || null,
        tracking_number: formData.tracking_number || null,
        submission_cost: parseFloat(formData.submission_cost) || 0,
        shipping_cost: parseFloat(formData.shipping_cost) || 0,
        insurance_cost: parseFloat(formData.insurance_cost) || 0,
        service_level: formData.service_level || null,
        notes: formData.notes || null,
      });
      triggerSuccessHaptic();
      setShowAddDialog(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmission = (submission: GradingSubmission) => {
    setSelectedSubmission(submission);
    setFormData({
      card_name: submission.card_name,
      set_name: submission.set_name || '',
      card_number: submission.card_number || '',
      grading_company: submission.grading_company,
      submission_date: submission.submission_date.split('T')[0],
      expected_return_date: submission.expected_return_date?.split('T')[0] || '',
      tracking_number: submission.tracking_number || '',
      submission_cost: submission.submission_cost?.toString() || '',
      shipping_cost: submission.shipping_cost?.toString() || '',
      insurance_cost: submission.insurance_cost?.toString() || '',
      service_level: submission.service_level || '',
      notes: submission.notes || '',
    });
    setShowAddDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSubmission) return;

    setIsSubmitting(true);
    try {
      await updateSubmission(selectedSubmission.id, {
        card_name: formData.card_name,
        set_name: formData.set_name || null,
        card_number: formData.card_number || null,
        grading_company: formData.grading_company,
        submission_date: formData.submission_date,
        expected_return_date: formData.expected_return_date || null,
        tracking_number: formData.tracking_number || null,
        submission_cost: parseFloat(formData.submission_cost) || 0,
        shipping_cost: parseFloat(formData.shipping_cost) || 0,
        insurance_cost: parseFloat(formData.insurance_cost) || 0,
        service_level: formData.service_level || null,
        notes: formData.notes || null,
      });
      triggerSuccessHaptic();
      setShowAddDialog(false);
      setSelectedSubmission(null);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: GradingStatus, finalGrade?: string, certNumber?: string) => {
    if (!selectedSubmission) return;

    try {
      await updateStatus(selectedSubmission.id, newStatus, finalGrade, certNumber);
      triggerSuccessHaptic();
      setShowStatusDialog(false);
      setSelectedSubmission(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDelete = async () => {
    if (!selectedSubmission) return;

    try {
      await deleteSubmission(selectedSubmission.id);
      setShowDeleteConfirm(false);
      setSelectedSubmission(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-safe pt-safe">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 py-6 pb-28 md:pb-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Grading Tracker</h1>
                <p className="text-sm text-zinc-400">Track your cards out for grading</p>
              </div>
              <Button onClick={() => { resetForm(); setSelectedSubmission(null); setShowAddDialog(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            {/* Stats */}
            {submissions.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-card border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Active</p>
                  <p className="text-xl font-bold text-amber-500">{activeSubmissions.length}</p>
                </div>
                <div className="bg-card border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Complete</p>
                  <p className="text-xl font-bold text-emerald-500">{completedSubmissions.length}</p>
                </div>
                <div className="bg-card border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Total Cost</p>
                  <p className="text-xl font-bold">${totalCosts.total.toFixed(0)}</p>
                </div>
              </div>
            )}

            {/* Search & Filter */}
            {submissions.length > 0 && (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search submissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                  <SelectTrigger className="w-[120px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </motion.div>

          {/* Content */}
          {loading ? (
            <SubmissionSkeleton />
          ) : submissions.length === 0 ? (
            <EmptyState onAdd={() => { resetForm(); setShowAddDialog(true); }} />
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No submissions match your filter</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredSubmissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    onEdit={() => handleEditSubmission(submission)}
                    onUpdateStatus={() => {
                      setSelectedSubmission(submission);
                      setShowStatusDialog(true);
                    }}
                    onDelete={() => {
                      setSelectedSubmission(submission);
                      setShowDeleteConfirm(true);
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </PageTransition>
      <BottomNav />

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSubmission ? 'Edit Submission' : 'Add Grading Submission'}</DialogTitle>
            <DialogDescription>
              {selectedSubmission ? 'Update submission details' : 'Track a card sent for grading'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Card Info */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="card_name">Card Name *</Label>
                <Input
                  id="card_name"
                  placeholder="e.g., Charizard"
                  value={formData.card_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, card_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="set_name">Set Name</Label>
                  <Input
                    id="set_name"
                    placeholder="e.g., Base Set"
                    value={formData.set_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, set_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="card_number">Card #</Label>
                  <Input
                    id="card_number"
                    placeholder="e.g., 4/102"
                    value={formData.card_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, card_number: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Grading Info */}
            <div className="space-y-3">
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
                          {c.label} - {c.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Service Level</Label>
                  <Input
                    placeholder="e.g., Regular, Express"
                    value={formData.service_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, service_level: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Submission Date *</Label>
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
              </div>
              <div>
                <Label>Tracking Number</Label>
                <Input
                  placeholder="Enter tracking number"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
                />
              </div>
            </div>

            {/* Costs */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Costs</h4>
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

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Add any notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="resize-none h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={selectedSubmission ? handleSaveEdit : handleAddSubmission}
              disabled={!formData.card_name || !formData.grading_company || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {selectedSubmission ? 'Save Changes' : 'Add Submission'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        submission={selectedSubmission}
        onUpdate={handleUpdateStatus}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the grading submission for "{selectedSubmission?.card_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Status Update Dialog Component
const StatusUpdateDialog = ({
  open,
  onOpenChange,
  submission,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: GradingSubmission | null;
  onUpdate: (status: GradingStatus, finalGrade?: string, certNumber?: string) => void;
}) => {
  const [newStatus, setNewStatus] = useState<GradingStatus>('submitted');
  const [finalGrade, setFinalGrade] = useState('');
  const [certNumber, setCertNumber] = useState('');

  // Initialize when opened
  useState(() => {
    if (submission) {
      setNewStatus(submission.status);
      setFinalGrade(submission.final_grade || '');
      setCertNumber(submission.cert_number || '');
    }
  });

  const currentIndex = GRADING_STATUSES.findIndex(s => s.value === submission?.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
          <DialogDescription>
            Change the grading status for {submission?.card_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Options */}
          <div className="space-y-2">
            {GRADING_STATUSES.map((status, index) => {
              const isDisabled = index < currentIndex;
              const isSelected = newStatus === status.value;

              return (
                <button
                  key={status.value}
                  onClick={() => !isDisabled && setNewStatus(status.value)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : isDisabled
                      ? 'opacity-50 cursor-not-allowed border-muted'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    index <= currentIndex ? 'bg-primary text-primary-foreground' : 'border-2 border-muted'
                  }`}>
                    {index <= currentIndex && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{status.label}</p>
                    <p className="text-xs text-muted-foreground">{status.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Final Grade & Cert (only for complete status) */}
          {newStatus === 'complete' && (
            <div className="space-y-3 pt-3 border-t">
              <div>
                <Label>Final Grade</Label>
                <Input
                  placeholder="e.g., 10, 9.5, 9"
                  value={finalGrade}
                  onChange={(e) => setFinalGrade(e.target.value)}
                />
              </div>
              <div>
                <Label>Cert Number</Label>
                <Input
                  placeholder="Certificate number"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onUpdate(newStatus, finalGrade, certNumber)}>
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GradingTracker;
