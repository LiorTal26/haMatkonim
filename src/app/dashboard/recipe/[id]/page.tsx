'use client';

// ============================================
// Recipe Book — Recipe Detail Page
// ============================================

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Heart, Edit, Trash2, Clock, Users, ChefHat, Flame,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRecipes } from '@/hooks/useRecipes';
import { useApp } from '@/components/providers/AppProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useWakeLock } from '@/hooks/useWakeLock';
import NoteBoard from '@/components/notes/NoteBoard';
import ServingScaler from '@/components/recipes/ServingScaler';
import { RecipeIngredients, RecipeInstructions } from '@/components/recipes/RecipeContent';
import { Recipe } from '@/types';
import { formatTime, getDifficultyLabel, getCategoryName } from '@/lib/utils';
import { scaleIngredients, normalizeIngredient } from '@/lib/scaleIngredients';
import { motion } from 'framer-motion';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useApp();
  const toast = useToast();
  const { recipes, loading: listLoading, toggleFavorite, deleteRecipe } = useRecipes();
  
  const [localRecipe, setLocalRecipe] = useState<Recipe | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Serving scaler state
  const [servingAdjustment, setServingAdjustment] = useState<{ recipeId: string; count: number } | null>(null);
  const [roundQuantities, setRoundQuantities] = useState(true);

  const supabase = createClient();
  const recipeId = params.id as string;

  // Prevent screen from sleeping while viewing recipe
  useWakeLock(true);

  // Resolve recipe (find in context list or use local fallback)
  const recipe = useMemo(() => {
    const fromList = recipes.find(r => r.id === recipeId);
    return fromList || localRecipe;
  }, [recipes, recipeId, localRecipe]);

  const adjustedServings = servingAdjustment?.recipeId === recipeId
    ? servingAdjustment.count : recipe?.servings || 1;

  // Fetch recipe from Supabase if not found in list (fallback)
  useEffect(() => {
    if (recipeId === 'choo-secret-recipe') {
      const secret = {
        id: 'choo-secret-recipe',
        user_id: 'system',
        category_id: 'choo-love-category',
        title: locale === 'he' ? "המתכון הסודי לאושר של צ'ו" : "Choo's Secret Recipe for Happiness",
        description: locale === 'he' 
          ? "המתכון הכי חשוב בספר - איך להכין את המשפחה והחיים הכי מאושרים בעולם" 
          : "The most important recipe in the book - how to build the happiest life and family in the world",
        ingredients: [
          { quantity: 1, unit: 'custom', name: locale === 'he' ? "טון של אהבה" : "Ton of love" },
          { quantity: null, unit: 'custom', name: locale === 'he' ? "חיבוקים חמים ללא הגבלה" : "Unlimited warm hugs" },
          { quantity: null, unit: 'custom', name: locale === 'he' ? "חיוכים כל בוקר" : "Daily morning smiles" },
          { quantity: 1, unit: 'pinch', name: locale === 'he' ? "קמצוץ סבלנות לבעל" : "Pinch of patience for Lior" },
          { quantity: null, unit: 'to_taste', name: locale === 'he' ? "מבט אחד בעיניים" : "A single warm gaze" }
        ],
        instructions: locale === 'he' ? [
          "מערבבים את כל החלומות והתקוות ביחד בקערה גדולה של תמיכה הדדית.",
          "מוסיפים המון צחוק והרפתקאות משותפות מדי יום.",
          "אופים בטמפרטורת החדר החמה של הבית למשך כל החיים."
        ] : [
          "Mix all dreams and hopes together in a large bowl of mutual support.",
          "Add plenty of laughter and shared adventures daily.",
          "Bake in the warm room temperature of your home for a lifetime."
        ],
        image_url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=800',
        prep_time_minutes: 5,
        cook_time_minutes: 0,
        servings: 2,
        difficulty: 'easy',
        is_favorite: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: {
          id: 'choo-love-category',
          user_id: 'system',
          name: locale === 'he' ? "אהבה" : "Love",
          icon: '❤️',
          color: '#D63384',
          sort_order: -1,
          created_at: new Date().toISOString()
        }
      };
      setLocalRecipe(secret as Recipe);
      setLocalLoading(false);
      return;
    }

    if (listLoading) return;
    const fromList = recipes.find(r => r.id === recipeId);
    if (fromList) {
      setLocalRecipe(null);
      return;
    }

    const fetchRecipe = async () => {
      setLocalLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select('*, category:categories!recipes_category_id_fkey(*), recipe_categories(category:categories(*))')
        .eq('id', recipeId)
        .single();

      if (error || !data) {
        toast.error('Recipe not found');
        router.push('/dashboard');
        return;
      }
      setLocalRecipe(data);
      setLocalLoading(false);
    };

    fetchRecipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId, listLoading, recipes, locale]);

  // Resolve loading state
  const loading = listLoading || (recipe === null && localLoading);

  // Compute scaled ingredients
  const displayIngredients = useMemo(() => {
    if (!recipe) return [];
    const original = recipe.ingredients || [];
    if (!recipe.servings || adjustedServings === recipe.servings) {
      return original;
    }
    return scaleIngredients(original, recipe.servings, adjustedServings);
  }, [recipe, adjustedServings]);

  const handleToggleFavorite = async () => {
    if (!recipe) return;
    if (recipe.id === 'choo-secret-recipe') {
      toast.success(locale === 'he' ? 'המתכון הזה תמיד במועדפים! ❤️' : 'This recipe is always in favorites! ❤️');
      return;
    }
    try {
      await toggleFavorite(recipe.id); // updates shared list
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    if (recipe.id === 'choo-secret-recipe') {
      toast.error(locale === 'he' ? 'אי אפשר למחוק אהבת אמת! ❤️' : 'True love cannot be deleted! ❤️');
      setShowDeleteConfirm(false);
      return;
    }
    try {
      await deleteRecipe(recipe.id);
      toast.success(t.deleteRecipe + ' ✓');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      toast.error(message);
    }
  };

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-6)' }} />
        <div className="skeleton skeleton-title" style={{ marginBottom: 'var(--space-4)' }} />
        <div className="skeleton skeleton-text" style={{ marginBottom: 'var(--space-2)' }} />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
      </div>
    );
  }

  if (!recipe) return null;

  const categoryEmoji = recipe.category?.icon || '🍽️';
  const isScaled = Boolean(recipe.servings && adjustedServings !== recipe.servings);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="recipe-book"
    >
      {/* Header */}
      <div className="recipe-book-toolbar">
        <div className="recipe-book-tags">
          <button className="btn btn-ghost btn-icon" aria-label={t.back} onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="book-back-icon" size={20} />
          </button>
          {(() => {
            const cats = recipe.categories?.length ? recipe.categories : (recipe.category ? [recipe.category] : []);
            return cats.map(cat => (
              <span
                key={cat.id}
                className="badge"
                style={{
                  background: `${cat.color}20`,
                  color: cat.color,
                }}
              >
                {cat.icon} {getCategoryName(cat.name, locale)}
              </span>
            ));
          })()}
        </div>

        <div className="recipe-book-actions">
          <button
            className={`btn btn-ghost btn-icon ${recipe.is_favorite ? 'active' : ''}`}
            onClick={handleToggleFavorite}
            title={recipe.is_favorite ? t.unfavorite : t.favorite}
            aria-label={recipe.is_favorite ? t.unfavorite : t.favorite}
            aria-pressed={recipe.is_favorite}
          >
            <Heart
              size={20}
              fill={recipe.is_favorite ? 'var(--color-primary)' : 'none'}
              color={recipe.is_favorite ? 'var(--color-primary)' : 'currentColor'}
            />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => {
              if (recipe.id === 'choo-secret-recipe') {
                toast.error(locale === 'he' ? 'אי אפשר לערוך שלמות! ❤️' : 'Perfection cannot be edited! ❤️');
              } else {
                router.push(`/dashboard/recipe/${recipe.id}/edit`);
              }
            }}
            title={t.edit}
            aria-label={t.edit}
          >
            <Edit size={20} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setShowDeleteConfirm(true)}
            title={t.delete}
            aria-label={t.delete}
            style={{ color: 'var(--color-error)' }}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="recipe-book-cover">
      {/* Hero Image */}
      {recipe.image_url ? (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="recipe-detail-hero"
        />
      ) : (
        <div className="recipe-detail-hero-placeholder">
          {categoryEmoji}
        </div>
      )}

      <div className="recipe-book-cover-copy">
      {/* Title */}
      <h1 className="recipe-book-title">
        {recipe.title}
      </h1>

      {recipe.description && (
        <p className="recipe-book-description">
          {recipe.description}
        </p>
      )}

      {/* Meta Strip */}
      <div className="recipe-meta-strip">
        {Boolean(recipe.prep_time_minutes) && (
          <div className="recipe-meta-item">
            <Clock size={18} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                {formatTime(recipe.prep_time_minutes)}
              </div>
              <div style={{ fontSize: 'var(--text-xs)' }}>{t.prepTime}</div>
            </div>
          </div>
        )}
        {Boolean(recipe.cook_time_minutes) && (
          <div className="recipe-meta-item">
            <Flame size={18} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                {formatTime(recipe.cook_time_minutes)}
              </div>
              <div style={{ fontSize: 'var(--text-xs)' }}>{t.cookTime}</div>
            </div>
          </div>
        )}
        {recipe.servings && (
          <div className="recipe-meta-item">
            <Users size={18} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                {adjustedServings}
              </div>
              <div style={{ fontSize: 'var(--text-xs)' }}>{t.servings}</div>
            </div>
          </div>
        )}
        {recipe.difficulty && (
          <div className="recipe-meta-item">
            <ChefHat size={18} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                {getDifficultyLabel(recipe.difficulty, locale)}
              </div>
              <div style={{ fontSize: 'var(--text-xs)' }}>{t.difficulty}</div>
            </div>
          </div>
        )}
      </div>
      </div>
      </div>

      <div className="recipe-book-paper">
      {/* Serving Scaler */}
      {recipe.servings ? (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <ServingScaler
            key={recipeId}
            originalServings={recipe.servings}
            adjustedServings={adjustedServings}
            onServingsChange={count => setServingAdjustment({ recipeId, count })}
            roundQuantities={roundQuantities}
            onRoundingChange={setRoundQuantities}
          />
        </div>
      ) : (
        <div className="serving-scaler" style={{ marginBottom: 'var(--space-6)' }}>
          <p className="serving-hint">{locale === 'he' ? 'כדי להתאים את כמויות המרכיבים, הגדירו למתכון מספר סועדים מקורי.' : 'Set the original serving count to adjust ingredient quantities.'}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => router.push(`/dashboard/recipe/${recipe.id}/edit`)}>{locale === 'he' ? 'הגדרת מספר סועדים' : 'Set servings'}</button>
        </div>
      )}

      {/* Ingredients & Instructions */}
      <div className="recipe-sections">
        {/* Ingredients */}
        {displayIngredients.length > 0 && (
          <section className="recipe-book-ingredients">
            <h2 className="recipe-section-title">
              📝 {t.ingredients}
              {isScaled && (
                <span className="badge badge-warning" style={{ marginInlineStart: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                  {t.adjustedIngredients}
                </span>
              )}
            </h2>
            <RecipeIngredients ingredients={displayIngredients} locale={locale} checked={checkedIngredients} onToggle={toggleIngredient} scaled={isScaled} round={roundQuantities} />
            {isScaled && displayIngredients.some(ing => typeof normalizeIngredient(ing) === 'string') && (
              <p className="serving-hint">{locale === 'he' ? 'מרכיבים ללא כמות מזוהה נשארו ללא שינוי. אפשר לערוך את המתכון ולהזין להם כמות.' : 'Ingredients without a recognised quantity are unchanged. Edit the recipe to add their quantities.'}</p>
            )}
          </section>
        )}

        {/* Instructions */}
        {recipe.instructions.length > 0 && (
          <section className="recipe-book-instructions">
            <h2 className="recipe-section-title">📋 {t.instructions}</h2>
            <RecipeInstructions instructions={recipe.instructions} />
          </section>
        )}
      </div>

      {/* Notes Board */}
      <NoteBoard recipeId={recipeId} />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content animate-scale-in book-dialog" role="dialog" aria-modal="true" aria-labelledby="recipe-delete-title" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" id="recipe-delete-title">{t.deleteRecipe}</h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
              {locale === 'he'
                ? `האם אתם בטוחים שרוצים למחוק את "${recipe.title}"?`
                : `Are you sure you want to delete "${recipe.title}"?`}
            </p>
            <div className="modal-footer" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                {t.cancel}
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
