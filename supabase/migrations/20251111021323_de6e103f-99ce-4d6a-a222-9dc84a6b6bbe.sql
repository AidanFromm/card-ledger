-- Create purchase_entries table to track individual purchases
CREATE TABLE public.purchase_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchase_price NUMERIC NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.purchase_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own purchase entries" 
ON public.purchase_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchase entries" 
ON public.purchase_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase entries" 
ON public.purchase_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase entries" 
ON public.purchase_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_purchase_entries_updated_at
BEFORE UPDATE ON public.purchase_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for faster queries
CREATE INDEX idx_purchase_entries_user_id ON public.purchase_entries(user_id);
CREATE INDEX idx_purchase_entries_inventory_item_id ON public.purchase_entries(inventory_item_id);
CREATE INDEX idx_purchase_entries_purchase_date ON public.purchase_entries(purchase_date);