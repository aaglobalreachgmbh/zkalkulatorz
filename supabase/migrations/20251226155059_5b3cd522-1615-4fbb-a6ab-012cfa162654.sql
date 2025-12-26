-- Create threat_feeds table for storing external threat intelligence data
CREATE TABLE public.threat_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_name TEXT NOT NULL,
    feed_url TEXT NOT NULL,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT NOT NULL DEFAULT 'pending',
    total_entries INTEGER DEFAULT 0,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create threat_feed_entries for caching threat data
CREATE TABLE public.threat_feed_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id UUID REFERENCES public.threat_feeds(id) ON DELETE CASCADE NOT NULL,
    ip_hash TEXT NOT NULL,
    threat_type TEXT,
    confidence_score INTEGER DEFAULT 50,
    first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    auto_blocked BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(feed_id, ip_hash)
);

-- Create daily_security_reports table
CREATE TABLE public.daily_security_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL UNIQUE,
    total_events INTEGER DEFAULT 0,
    critical_events INTEGER DEFAULT 0,
    blocked_ips INTEGER DEFAULT 0,
    top_threats JSONB DEFAULT '[]'::jsonb,
    top_attackers JSONB DEFAULT '[]'::jsonb,
    security_score INTEGER DEFAULT 100,
    email_sent BOOLEAN DEFAULT false,
    report_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.threat_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_feed_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_security_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for threat_feeds
CREATE POLICY "Admins can manage threat feeds"
ON public.threat_feeds
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage threat feeds"
ON public.threat_feeds
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for threat_feed_entries
CREATE POLICY "Admins can view threat entries"
ON public.threat_feed_entries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage threat entries"
ON public.threat_feed_entries
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for daily_security_reports
CREATE POLICY "Admins can view security reports"
ON public.daily_security_reports
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage security reports"
ON public.daily_security_reports
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_threat_feed_entries_ip_hash ON public.threat_feed_entries(ip_hash);
CREATE INDEX idx_threat_feed_entries_auto_blocked ON public.threat_feed_entries(auto_blocked);
CREATE INDEX idx_daily_security_reports_date ON public.daily_security_reports(report_date);

-- Update trigger for threat_feeds
CREATE TRIGGER update_threat_feeds_updated_at
BEFORE UPDATE ON public.threat_feeds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default threat feeds
INSERT INTO public.threat_feeds (feed_name, feed_url, enabled) VALUES
('AbuseIPDB', 'https://api.abuseipdb.com/api/v2/blacklist', true),
('Spamhaus DROP', 'https://www.spamhaus.org/drop/drop.txt', true),
('Emerging Threats', 'https://rules.emergingthreats.net/blockrules/compromised-ips.txt', true);