-- Community Radar: Reddit/community monitoring tables
-- Used by n8n to store monitored threads and by the dashboard to display them

-- Thread status enum
CREATE TYPE public.thread_status AS ENUM ('new', 'reviewed', 'replied', 'archived', 'flagged');

-- Platform enum (extensible for future channels)
CREATE TYPE public.radar_platform AS ENUM ('reddit', 'discord', 'forum', 'other');

-- Monitored community threads table
CREATE TABLE public.community_threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    platform public.radar_platform NOT NULL DEFAULT 'reddit',
    subreddit text,
    post_id text NOT NULL,
    post_title text NOT NULL,
    post_url text NOT NULL,
    author text,
    snippet text,
    matched_keywords text[] DEFAULT '{}',
    relevance_score integer DEFAULT 0,
    status public.thread_status NOT NULL DEFAULT 'new',
    notes text,
    replied_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (platform, post_id)
);

ALTER TABLE public.community_threads ENABLE ROW LEVEL SECURITY;

-- Authenticated users with architect/admin role can read threads
CREATE POLICY "architects_can_read_threads"
    ON public.community_threads FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('architect', 'administrator')
        )
    );

-- Authenticated architects can update thread status/notes
CREATE POLICY "architects_can_update_threads"
    ON public.community_threads FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('architect', 'administrator')
        )
    );

-- Service role (n8n) can insert threads
CREATE POLICY "service_can_insert_threads"
    ON public.community_threads FOR INSERT TO service_role
    WITH CHECK (true);

-- Service role (n8n) can update threads
CREATE POLICY "service_can_update_threads"
    ON public.community_threads FOR UPDATE TO service_role
    USING (true);

-- Reply templates table
CREATE TABLE public.reply_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL,
    title text NOT NULL,
    scaffold text NOT NULL,
    keywords text[] DEFAULT '{}',
    funnel_url text,
    is_active boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reply_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_can_read_templates"
    ON public.reply_templates FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "architects_can_manage_templates"
    ON public.reply_templates FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('architect', 'administrator')
        )
    );

-- Indexes for performance
CREATE INDEX idx_community_threads_status ON public.community_threads (status);
CREATE INDEX idx_community_threads_platform ON public.community_threads (platform, subreddit);
CREATE INDEX idx_community_threads_created ON public.community_threads (created_at DESC);
CREATE INDEX idx_reply_templates_category ON public.reply_templates (category);

-- Seed initial reply templates
INSERT INTO public.reply_templates (category, title, scaffold, keywords, funnel_url) VALUES
('regenerative_ag', 'Soil/Food Systems Question', 'Share personal experience with [specific system]. Mention coordination infrastructure concept. If they ask for more: fieldguide link.', ARRAY['soil', 'regenerative', 'food systems', 'permaculture', 'composting'], 'https://fieldguide.livingsys.org/'),
('burning_man', 'Playa/Community Builder', 'Connect through shared burn culture. Reference the gap between principles and year-round practice. If aligned: playa-optin link.', ARRAY['burning man', 'playa', 'radical inclusion', 'gifting economy', 'community resilience'], 'https://fieldguide.livingsys.org/playa-optin'),
('coordination', 'Infrastructure/Systems Question', 'Describe the coordination hub model. Reference Sori Village or Kakuma as proof points. If they want details: field guide link.', ARRAY['coordination', 'infrastructure', 'village', 'hub', 'knowledge transfer', 'BSF'], 'https://fieldguide.livingsys.org/'),
('veteran', 'Veteran/Transition Thread', 'Lead with personal transition story. Reference the silence after. If resonates: shannondobbs.com path.', ARRAY['veteran', 'military', 'transition', 'service'], 'https://shannondobbs.com'),
('disability_justice', 'Disability/Inclusion Thread', 'Reference DICB model - disability as coordination nucleus. The design insight about consistency. If engaged: field guide.', ARRAY['disability', 'inclusion', 'accessibility', 'refugee'], 'https://fieldguide.livingsys.org/');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_community_threads_updated_at
    BEFORE UPDATE ON public.community_threads
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reply_templates_updated_at
    BEFORE UPDATE ON public.reply_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
