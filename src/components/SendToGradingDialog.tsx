import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Loader2, Award } from "lucide-react";
import { useGradingSubmissions, GRADING_COMPANIES } from "@/hooks/useGradingSubmissions";
import { triggerSuccessHaptic } from "@/lib/haptics";

interface InventoryItem {
  id: string;
  name: string;
  set_name: string;
  card_number: string | null;
  card_image_url: string | null;
}

interface SendToGradingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSuccess?: () => void;
}

export const SendToGradingDialog = ({
  open,
  onOpenChange,
  item,
  onSuccess,
}: SendToGradingDialogProps) => {
  const { createSubmission } = useGradingSubmissions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    grading_company: 'psa',
    submission_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    tracking_number: '',
    submission_cost: '',
    shipping_cost: '',
    service_level: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      grading_company: 'psa',
      submission_date: new Date().toISOString().split('T')[0],
      expected_return_date: '',
      tracking_number: '',
      submission_cost: '',
      shipping_cost: '',
      service_level: '',
      notes: '',
    });
  };

  const handleSubmit = async () => {
    if (!item) return;

    setIsSubmitting(true);
    try {
      await createSubmission({
        inventory_item_id: item.id,
        card_name: item.name,
        set_name: item.set_name,
        card_number: item.card_number,
        card_image_url: item.card_image_url,
        grading_company: formData.grading_company,
        submission_date: formData.submission_date,
        expected_return_date: formData.expected_return_date || null,
        tracking_number: formData.tracking_number || null,
        submission_cost: parseFloat(formData.submission_cost) || 0,
        shipping_cost: parseFloat(formData.shipping_cost) || 0,
        service_level: formData.service_level || null,
        notes: formData.notes || null,
      });
      triggerSuccessHaptic();
      onOpenChange(false);
      resetForm();
      if (onSuccess) onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Send to Grading
          </DialogTitle>
          <DialogDescription>
            Track this card being sent for professional grading
          </DialogDescription>
        </DialogHeader>

        {/* Card Preview */}
        <div className="flex gap-3 p-3 rounded-xl bg-muted/50 border">
          {item.card_image_url && (
            <img
              src={item.card_image_url}
              alt={item.name}
              className="w-16 h-22 object-contain rounded-lg"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-2">{item.name}</h4>
            <p className="text-xs text-muted-foreground">
              {item.set_name}
              {item.card_number && ` #${item.card_number}`}
            </p>
          </div>
        </div>

        <div className="space-y-4 py-2">
          {/* Grading Company */}
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
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Service Level</Label>
              <Input
                placeholder="e.g., Regular"
                value={formData.service_level}
                onChange={(e) => setFormData(prev => ({ ...prev, service_level: e.target.value }))}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Tracking */}
          <div>
            <Label>Tracking Number</Label>
            <Input
              placeholder="Optional tracking number"
              value={formData.tracking_number}
              onChange={(e) => setFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
            />
          </div>

          {/* Costs */}
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Optional notes..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="resize-none h-16"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Award className="h-4 w-4" />
            )}
            Send to Grading
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendToGradingDialog;
