-- ============================================
-- Recipe Book — Migration: Structured Ingredients
-- Run this in Supabase SQL Editor
-- ============================================

-- Change ingredients column from text[] to jsonb
-- This stores structured ingredient objects

ALTER TABLE recipes
  ALTER COLUMN ingredients TYPE jsonb USING to_jsonb(ingredients);

-- Set default to empty JSON array
ALTER TABLE recipes
  ALTER COLUMN ingredients SET DEFAULT '[]'::jsonb;
