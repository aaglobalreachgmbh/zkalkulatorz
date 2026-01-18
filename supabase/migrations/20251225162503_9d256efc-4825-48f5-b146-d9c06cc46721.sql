-- Create saved_offers table for cloud storage of offer configurations
CREATE TABLE public.saved_offers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    config JSONB NOT NULL,
    preview JSONB,
    is_draft BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own offers"
ON public.saved_offers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own offers"
ON public.saved_offers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offers"
ON public.saved_offers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offers"
ON public.saved_offers
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_saved_offers_updated_at
BEFORE UPDATE ON public.saved_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster user queries
CREATE INDEX idx_saved_offers_user_id ON public.saved_offers(user_id);
CREATE INDEX idx_saved_offers_updated_at ON public.saved_offers(updated_at DESC);