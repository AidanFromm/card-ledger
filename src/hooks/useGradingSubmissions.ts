import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type GradingSubmission = Database['public']['Tables']['grading_submissions']['Row'];
type GradingSubmissionInsert = Database['public']['Tables']['grading_submissions']['Insert'];
type GradingSubmissionUpdate = Database['public']['Tables']['grading_submissions']['Update'];
type GradingStatus = Database['public']['Enums']['grading_status'];

export const GRADING_COMPANIES = [
  { value: 'psa', label: 'PSA', fullName: 'Professional Sports Authenticator' },
  { value: 'bgs', label: 'BGS', fullName: 'Beckett Grading Services' },
  { value: 'cgc', label: 'CGC', fullName: 'Certified Guaranty Company' },
  { value: 'sgc', label: 'SGC', fullName: 'Sportscard Guaranty Corporation' },
  { value: 'ace', label: 'ACE', fullName: 'ACE Grading' },
  { value: 'tag', label: 'TAG', fullName: 'TAG Grading' },
] as const;

export const GRADING_STATUSES: { value: GradingStatus; label: string; description: string; color: string }[] = [
  { value: 'submitted', label: 'Submitted', description: 'Sent to grading company', color: 'bg-blue-500/15 text-blue-500' },
  { value: 'received', label: 'Received', description: 'Received by grading company', color: 'bg-cyan-500/15 text-cyan-500' },
  { value: 'grading', label: 'Grading', description: 'Being graded', color: 'bg-amber-500/15 text-amber-500' },
  { value: 'shipped', label: 'Shipped', description: 'Shipped back to you', color: 'bg-purple-500/15 text-purple-500' },
  { value: 'complete', label: 'Complete', description: 'Grading complete', color: 'bg-emerald-500/15 text-emerald-500' },
];

export const useGradingSubmissions = () => {
  const [submissions, setSubmissions] = useState<GradingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubmissions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('grading_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('submission_date', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error('Error fetching grading submissions:', error);
      toast({
        title: 'Error loading submissions',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const createSubmission = async (submission: Omit<GradingSubmissionInsert, 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('grading_submissions')
        .insert({
          ...submission,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setSubmissions(prev => [data, ...prev]);
      toast({
        title: 'Submission created',
        description: `Card sent to ${submission.grading_company.toUpperCase()}`,
      });

      return data;
    } catch (error: any) {
      console.error('Error creating submission:', error);
      toast({
        title: 'Error creating submission',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateSubmission = async (id: string, updates: GradingSubmissionUpdate) => {
    try {
      const { data, error } = await supabase
        .from('grading_submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSubmissions(prev => prev.map(s => s.id === id ? data : s));
      toast({
        title: 'Submission updated',
      });

      return data;
    } catch (error: any) {
      console.error('Error updating submission:', error);
      toast({
        title: 'Error updating submission',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateStatus = async (id: string, status: GradingStatus, finalGrade?: string, certNumber?: string) => {
    const updates: GradingSubmissionUpdate = { status };
    
    if (status === 'complete') {
      if (finalGrade) updates.final_grade = finalGrade;
      if (certNumber) updates.cert_number = certNumber;
    }

    return updateSubmission(id, updates);
  };

  const deleteSubmission = async (id: string) => {
    try {
      const { error } = await supabase
        .from('grading_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubmissions(prev => prev.filter(s => s.id !== id));
      toast({
        title: 'Submission deleted',
      });
    } catch (error: any) {
      console.error('Error deleting submission:', error);
      toast({
        title: 'Error deleting submission',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Link a completed grading submission back to the inventory
  const linkToInventory = async (submissionId: string, inventoryItemId: string) => {
    try {
      const submission = submissions.find(s => s.id === submissionId);
      if (!submission) throw new Error('Submission not found');
      if (!submission.final_grade) throw new Error('Submission has no final grade');

      // Update inventory item with graded info
      const { error: invError } = await supabase
        .from('inventory_items')
        .update({
          grading_company: submission.grading_company as any,
          grade: submission.final_grade,
          category: 'graded',
        })
        .eq('id', inventoryItemId);

      if (invError) throw invError;

      // Update submission to link to inventory
      await updateSubmission(submissionId, { inventory_item_id: inventoryItemId });

      toast({
        title: 'Card linked to inventory',
        description: `Graded ${submission.grading_company.toUpperCase()} ${submission.final_grade}`,
      });
    } catch (error: any) {
      console.error('Error linking to inventory:', error);
      toast({
        title: 'Error linking to inventory',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Get submissions by status
  const getByStatus = (status: GradingStatus) => 
    submissions.filter(s => s.status === status);

  // Get active (non-complete) submissions
  const activeSubmissions = submissions.filter(s => s.status !== 'complete');

  // Get completed submissions
  const completedSubmissions = submissions.filter(s => s.status === 'complete');

  // Calculate total costs
  const totalCosts = submissions.reduce((acc, s) => ({
    submission: acc.submission + (s.submission_cost || 0),
    shipping: acc.shipping + (s.shipping_cost || 0),
    insurance: acc.insurance + (s.insurance_cost || 0),
    total: acc.total + (s.submission_cost || 0) + (s.shipping_cost || 0) + (s.insurance_cost || 0),
  }), { submission: 0, shipping: 0, insurance: 0, total: 0 });

  return {
    submissions,
    loading,
    refetch: fetchSubmissions,
    createSubmission,
    updateSubmission,
    updateStatus,
    deleteSubmission,
    linkToInventory,
    getByStatus,
    activeSubmissions,
    completedSubmissions,
    totalCosts,
  };
};

export type { GradingSubmission, GradingSubmissionInsert, GradingSubmissionUpdate, GradingStatus };
