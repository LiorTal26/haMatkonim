-- ============================================
-- Recipe Book — Migration v3: Multi-Category Support + Structured Ingredients
-- Run this in Supabase SQL Editor
-- ============================================

-- ─────────────────────────────────────────────
-- Part A: Multi-Category Support (recipe_categories)
-- ─────────────────────────────────────────────

-- 1. Create many-to-many join table
CREATE TABLE IF NOT EXISTS recipe_categories (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (recipe_id, category_id)
);

-- 2. Enable RLS
ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy — users can manage their own recipe-category links
DO $pol$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recipe_categories' 
    AND policyname = 'Users can manage own recipe_categories'
  ) THEN
    CREATE POLICY "Users can manage own recipe_categories"
      ON recipe_categories
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM recipes 
          WHERE recipes.id = recipe_categories.recipe_id 
          AND recipes.user_id = auth.uid()
        )
      );
  END IF;
END $pol$;

-- 4. Migrate existing data: copy category_id → recipe_categories
INSERT INTO recipe_categories (recipe_id, category_id)
SELECT id, category_id
FROM recipes
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- Part B: Convert ingredients from TEXT[] to JSONB
-- (Needed for structured ingredients with quantity/unit/name/note)
-- ─────────────────────────────────────────────

-- 5. Helper function to migrate existing text ingredients
CREATE OR REPLACE FUNCTION migrate_ingredients_to_jsonb(arr TEXT[])
RETURNS JSONB AS $$
DECLARE
  result JSONB := '[]';
  elem TEXT;
BEGIN
  IF arr IS NULL OR array_length(arr, 1) IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;
  FOREACH elem IN ARRAY arr LOOP
    IF elem ~ '^\s*\{' THEN
      result := result || jsonb_build_array(elem::JSONB);
    ELSE
      result := result || jsonb_build_array(
        jsonb_build_object('quantity', NULL, 'unit', 'custom', 'name', elem, 'note', '')
      );
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 6. Add temp JSONB column
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS ingredients_jsonb JSONB DEFAULT '[]';

-- 7. Populate it
UPDATE recipes SET ingredients_jsonb = migrate_ingredients_to_jsonb(ingredients);

-- 8. Swap columns
ALTER TABLE recipes DROP COLUMN ingredients;
ALTER TABLE recipes RENAME COLUMN ingredients_jsonb TO ingredients;
ALTER TABLE recipes ALTER COLUMN ingredients SET DEFAULT '[]'::jsonb;

-- 9. Cleanup helper function
DROP FUNCTION IF EXISTS migrate_ingredients_to_jsonb(TEXT[]);
