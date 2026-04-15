
ALTER TABLE public.response_drafts
ADD COLUMN target_path text DEFAULT NULL;

ALTER TABLE public.response_drafts
ADD CONSTRAINT chk_target_path
CHECK (target_path IS NULL OR target_path IN ('architect', 'operator', 'practitioner', 'member_curiosity'));
