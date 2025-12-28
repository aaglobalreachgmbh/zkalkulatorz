-- Customer Notes für Timeline-Format
CREATE TABLE public.customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'info',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index für schnelle Abfragen
CREATE INDEX idx_customer_notes_customer_id ON public.customer_notes(customer_id);
CREATE INDEX idx_customer_notes_created_at ON public.customer_notes(created_at DESC);

-- RLS aktivieren
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Nutzer können nur Notizen ihrer eigenen Kunden sehen
CREATE POLICY "Users can view notes of their customers"
ON public.customer_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = customer_notes.customer_id
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create notes for their customers"
ON public.customer_notes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = customer_notes.customer_id
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own notes"
ON public.customer_notes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
ON public.customer_notes
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger für updated_at
CREATE TRIGGER update_customer_notes_updated_at
  BEFORE UPDATE ON public.customer_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Kommentar
COMMENT ON TABLE public.customer_notes IS 'Kunden-Notizen im Timeline-Format für die Kunden-Detailseite';