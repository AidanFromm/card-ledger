-- Create newsletter_signups table for collecting contact information
CREATE TABLE public.newsletter_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subscribed BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.newsletter_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their phone number (public signup)
CREATE POLICY "Anyone can sign up for newsletter"
ON public.newsletter_signups
FOR INSERT
WITH CHECK (true);

-- Only authenticated users (admins) can view signups
CREATE POLICY "Authenticated users can view newsletter signups"
ON public.newsletter_signups
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create index for efficient querying
CREATE INDEX idx_newsletter_signups_created_at ON public.newsletter_signups(created_at DESC);