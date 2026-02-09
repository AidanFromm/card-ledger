-- Create client_lists table for shareable lists
CREATE TABLE public.client_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  list_name TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_list_items table for items in each list
CREATE TABLE public.client_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.client_lists(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  set_name TEXT NOT NULL,
  card_image_url TEXT,
  grading_company TEXT NOT NULL DEFAULT 'raw',
  grade TEXT,
  market_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_lists
CREATE POLICY "Users can view their own lists"
  ON public.client_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lists"
  ON public.client_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists"
  ON public.client_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists"
  ON public.client_lists FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view lists via share token"
  ON public.client_lists FOR SELECT
  USING (true);

-- RLS Policies for client_list_items
CREATE POLICY "Users can view their own list items"
  ON public.client_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.client_lists
      WHERE client_lists.id = client_list_items.list_id
      AND client_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own list items"
  ON public.client_list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_lists
      WHERE client_lists.id = client_list_items.list_id
      AND client_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own list items"
  ON public.client_list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.client_lists
      WHERE client_lists.id = client_list_items.list_id
      AND client_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own list items"
  ON public.client_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.client_lists
      WHERE client_lists.id = client_list_items.list_id
      AND client_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view list items via share token"
  ON public.client_list_items FOR SELECT
  USING (true);

-- Add updated_at trigger for client_lists
CREATE TRIGGER update_client_lists_updated_at
  BEFORE UPDATE ON public.client_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on share_token for fast lookups
CREATE INDEX idx_client_lists_share_token ON public.client_lists(share_token);

-- Create index on list_id for fast joins
CREATE INDEX idx_client_list_items_list_id ON public.client_list_items(list_id);