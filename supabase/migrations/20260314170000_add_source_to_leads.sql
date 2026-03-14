-- Add source column to leads table for UTM/referral tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source text;
