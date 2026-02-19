import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type GradingSubmission = Database['public']['Tables']['grading_submissions']['Row'];
type GradingSubmissionInsert = Database['public']['Tables']['grading_submissions']['Insert'];
type GradingSubmissionUpdate = Database['public']['Tables']['grading_submissions']['Update'];
type GradingStatus = Database['public']['Enums']['grading_status'];

// Extended submission with additional calculated fields
export interface ExtendedGradingSubmission extends GradingSubmission {
  raw_value?: number;
  graded_value?: number;
  graded_image_url?: string;
  value_increase?: number;
  roi_percent?: number;
}

export const GRADING_COMPANIES = [
  { value: 'psa', label: 'PSA', fullName: 'Professional Sports Authenticator', popReportUrl: 'https://www.psacard.com/pop' },
  { value: 'bgs', label: 'BGS', fullName: 'Beckett Grading Services', popReportUrl: 'https://www.beckett.com/grading/pop-report' },
  { value: 'cgc', label: 'CGC', fullName: 'Certified Guaranty Company', popReportUrl: 'https://www.cgccomics.com/census' },
  { value: 'sgc', label: 'SGC', fullName: 'Sportscard Guaranty Corporation', popReportUrl: 'https://www.sgccard.com/population' },
  { value: 'ace', label: 'ACE', fullName: 'ACE Grading', popReportUrl: 'https://acegrading.com' },
  { value: 'tag', label: 'TAG', fullName: 'TAG Grading', popReportUrl: 'https://taggrading.com' },
] as const;

export const SERVICE_LEVELS = [
  { value: 'economy', label: 'Economy', days: '60-90 days', multiplier: 1.0 },
  { value: 'regular', label: 'Regular', days: '30-45 days', multiplier: 1.5 },
  { value: 'express', label: 'Express', days: '10-15 days', multiplier: 2.5 },
  { value: 'super_express', label: 'Super Express', days: '3-5 days', multiplier: 4.0 },
  { value: 'walkthrough', label: 'Walk-Through', days: '1-2 days', multiplier: 6.0 },
] as const;

export const GRADING_STATUSES: { value: GradingStatus; label: string; description: string; color: string; bgColor: string }[] = [
  { value: 'submitted', label: 'Preparing', description: 'Preparing for submission', color: 'text-slate-400', bgColor: 'bg-slate-500/15' },
  { value: 'received', label: 'Shipped', description: 'In transit to grader', color: 'text-blue-400', bgColor: 'bg-blue-500/15' },
  { value: 'grading', label: 'Grading', description: 'Being graded', color: 'text-amber-400', bgColor: 'bg-amber-500/15' },
  { value: 'shipped', label: 'Returning', description: 'Shipped back to you', color: 'text-purple-400', bgColor: 'bg-purple-500/15' },
  { value: 'complete', label: 'Complete', description: 'Grading complete', color: 'text-navy-400', bgColor: 'bg-navy-500/15' },
];

// Grade value multipliers (rough estimates for demonstration)
export const GRADE_VALUE_MULTIPLIERS: Record<string, number> = {
  '10': 10.0,
  '9.5': 5.0,
  '9': 3.0,
  '8.5': 2.0,
  '8': 1.5,
  '7.5': 1.3,
  '7': 1.2,
  '6.5': 1.1,
  '6': 1.0,
  '5.5': 0.9,
  '5': 0.8,
  '4': 0.6,
  '3': 0.4,
  '2': 0.3,
  '1': 0.2,
};

// Condition to grade prediction mapping
export const CONDITION_GRADE_PREDICTIONS: Record<string, { min: string; max: string; likely: string }> = {
  'mint': { min: '9', max: '10', likely: '9.5' },
  'near-mint': { min: '8', max: '9.5', likely: '9' },
  'lightly-played': { min: '6', max: '8', likely: '7' },
  'moderately-played': { min: '4', max: '6', likely: '5' },
  'heavily-played': { min: '2', max: '4', likely: '3' },
  'damaged': { min: '1', max: '3', likely: '2' },
};

export const useGradingSubmissions = () => {
  const [submissions, setSubmissions] = useState<ExtendedGradingSubmission[]>([]);
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
      
      // Calculate extended fields
      const extendedData: ExtendedGradingSubmission[] = (data || []).map(sub => {
        const totalCost = (sub.submission_cost || 0) + (sub.shipping_cost || 0) + (sub.insurance_cost || 0);
        const gradedValue = sub.notes ? parseFloat(sub.notes.match(/graded_value:(\d+\.?\d*)/)?.[1] || '0') : 0;
        const rawValue = sub.notes ? parseFloat(sub.notes.match(/raw_value:(\d+\.?\d*)/)?.[1] || '0') : 0;
        const valueIncrease = gradedValue - rawValue;
        const roiPercent = totalCost > 0 ? ((valueIncrease - totalCost) / totalCost) * 100 : 0;
        
        return {
          ...sub,
          raw_value: rawValue,
          graded_value: gradedValue,
          graded_image_url: sub.notes?.match(/graded_image_url:([^\s]+)/)?.[1],
          value_increase: valueIncrease,
          roi_percent: roiPercent,
        };
      });
      
      setSubmissions(extendedData);
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

      setSubmissions(prev => [data as ExtendedGradingSubmission, ...prev]);
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

      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, ...data } as ExtendedGradingSubmission : s));
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
  const activeSubmissions = useMemo(() => 
    submissions.filter(s => s.status !== 'complete'), [submissions]);

  // Get completed submissions
  const completedSubmissions = useMemo(() => 
    submissions.filter(s => s.status === 'complete'), [submissions]);

  // Calculate total costs
  const totalCosts = useMemo(() => submissions.reduce((acc, s) => ({
    submission: acc.submission + (s.submission_cost || 0),
    shipping: acc.shipping + (s.shipping_cost || 0),
    insurance: acc.insurance + (s.insurance_cost || 0),
    total: acc.total + (s.submission_cost || 0) + (s.shipping_cost || 0) + (s.insurance_cost || 0),
  }), { submission: 0, shipping: 0, insurance: 0, total: 0 }), [submissions]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const completed = completedSubmissions;
    const grades = completed
      .map(s => parseFloat(s.final_grade || '0'))
      .filter(g => g > 0);
    
    const avgGrade = grades.length > 0 
      ? grades.reduce((a, b) => a + b, 0) / grades.length 
      : 0;

    // Grade distribution
    const gradeDistribution: Record<string, number> = {};
    completed.forEach(s => {
      if (s.final_grade) {
        const grade = s.final_grade;
        gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
      }
    });

    // Company distribution
    const companyDistribution: Record<string, number> = {};
    submissions.forEach(s => {
      companyDistribution[s.grading_company] = (companyDistribution[s.grading_company] || 0) + 1;
    });

    // Total value calculations
    const totalRawValue = completed.reduce((acc, s) => acc + (s.raw_value || 0), 0);
    const totalGradedValue = completed.reduce((acc, s) => acc + (s.graded_value || 0), 0);
    const totalValueGained = totalGradedValue - totalRawValue;
    const totalGradingCost = totalCosts.total;
    const overallROI = totalGradingCost > 0 
      ? ((totalValueGained - totalGradingCost) / totalGradingCost) * 100 
      : 0;

    return {
      totalSubmitted: submissions.length,
      activeCount: activeSubmissions.length,
      completedCount: completed.length,
      averageGrade: avgGrade,
      gradeDistribution,
      companyDistribution,
      totalRawValue,
      totalGradedValue,
      totalValueGained,
      overallROI,
      perfect10s: completed.filter(s => s.final_grade === '10').length,
      gem9s: completed.filter(s => parseFloat(s.final_grade || '0') >= 9).length,
    };
  }, [submissions, completedSubmissions, activeSubmissions, totalCosts]);

  // Predict grade value
  const predictGradeValue = useCallback((rawValue: number, condition: string) => {
    const prediction = CONDITION_GRADE_PREDICTIONS[condition] || CONDITION_GRADE_PREDICTIONS['near-mint'];
    
    return {
      condition,
      prediction,
      estimatedValues: {
        min: rawValue * (GRADE_VALUE_MULTIPLIERS[prediction.min] || 1),
        likely: rawValue * (GRADE_VALUE_MULTIPLIERS[prediction.likely] || 1),
        max: rawValue * (GRADE_VALUE_MULTIPLIERS[prediction.max] || 1),
      },
    };
  }, []);

  // Calculate if grading is worth it
  const calculateGradingROI = useCallback((
    rawValue: number, 
    condition: string, 
    gradingCost: number = 30
  ) => {
    const prediction = predictGradeValue(rawValue, condition);
    const likelyValue = prediction.estimatedValues.likely;
    const valueIncrease = likelyValue - rawValue;
    const netGain = valueIncrease - gradingCost;
    const roi = gradingCost > 0 ? (netGain / gradingCost) * 100 : 0;
    
    return {
      ...prediction,
      gradingCost,
      valueIncrease,
      netGain,
      roi,
      recommendation: roi > 50 ? 'Highly Recommended' : 
                      roi > 0 ? 'Worth Considering' : 
                      'Not Recommended',
      recommendationColor: roi > 50 ? 'text-green-400' : 
                          roi > 0 ? 'text-amber-400' : 
                          'text-red-400',
    };
  }, [predictGradeValue]);

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
    statistics,
    predictGradeValue,
    calculateGradingROI,
  };
};

export type { GradingSubmission, GradingSubmissionInsert, GradingSubmissionUpdate, GradingStatus, ExtendedGradingSubmission };
