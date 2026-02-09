-- Add sale_group_id column to track bulk sales
ALTER TABLE public.sales 
ADD COLUMN sale_group_id uuid;

-- Create index for better query performance
CREATE INDEX idx_sales_sale_group_id ON public.sales(sale_group_id);

-- Add comment for documentation
COMMENT ON COLUMN public.sales.sale_group_id IS 'Groups multiple items sold together in a single bulk transaction. NULL for single sales.';