-- Add card details to sales table for complete purchase history
ALTER TABLE public.sales 
ADD COLUMN set_name TEXT,
ADD COLUMN condition TEXT,
ADD COLUMN grading_company TEXT,
ADD COLUMN grade TEXT;