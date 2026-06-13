'use client';

// ============================================
// Recipe Book — Edit Recipe Page
// ============================================

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import RecipeForm from '@/components/recipes/RecipeForm';
import { Recipe } from '@/types';

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*, category:categories!recipes_category_id_fkey(*), recipe_categories(category:categories(*))')
        .eq('id', params.id as string)
        .single();

      if (error || !data) {
        router.push('/dashboard');
        return;
      }
      // Normalize categories from recipe_categories join
      const normalized = {
        ...data,
        categories: data.recipe_categories?.map((rc: { category: any }) => rc.category).filter(Boolean) ||
                    (data.category ? [data.category] : []),
      };
      setRecipe(normalized);
      setLoading(false);
    };

    fetchRecipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="skeleton skeleton-title" style={{ marginBottom: 'var(--space-6)' }} />
        <div className="skeleton skeleton-card" />
      </div>
    );
  }

  if (!recipe) return null;

  return <RecipeForm recipe={recipe} />;
}
