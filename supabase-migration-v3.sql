-- ============================================
-- Recipe Book — Migration v3: Multi-Category Support
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create many-to-many join table
CREATE TABLE IF NOT EXISTS recipe_categories (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (recipe_id, category_id)
);

-- 2. Enable RLS
ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy — users can manage their own recipe-category links
CREATE POLICY "Users can manage own recipe_categories"
  ON recipe_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = recipe_categories.recipe_id AND recipes.user_id = auth.uid()
    )
  );

-- 4. Migrate existing data: copy category_id → recipe_categories
INSERT INTO recipe_categories (recipe_id, category_id)
SELECT id, category_id
FROM recipes
WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;
