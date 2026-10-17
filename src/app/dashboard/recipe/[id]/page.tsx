'use client';

// ============================================
// Recipe Book — Recipe Detail Page
// ============================================

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Heart, Edit, Trash2, Clock, Users, ChefHat, Flame, Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRecipes } from '@/hooks/useRecipes';
import { useApp } from '@/components/providers/AppProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useWakeLock } from '@/hooks/useWakeLock';
import NoteBoard from '@/components/notes/NoteBoard';
import ServingScaler from '@/components/recipes/ServingScaler';
import { Recipe } from '@/types';
import { formatTime, getDifficultyLabel, getCategoryName } from '@/lib/utils';
import { scaleIngredients, formatIngredient, normalizeIngredient } from '@/lib/scaleIngredients';
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
      style={{ maxWidth: 900, margin: '0 auto' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={20} />
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

        <div className="flex items-center gap-2">
          <button
            className={`btn btn-ghost btn-icon ${recipe.is_favorite ? 'active' : ''}`}
            onClick={handleToggleFavorite}
            title={recipe.is_favorite ? t.unfavorite : t.favorite}
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
          >
            <Edit size={20} />
          </button>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setShowDeleteConfirm(true)}
            title={t.delete}
            style={{ color: 'var(--color-error)' }}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

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

      {/* Title */}
      <h1 style={{
        fontSize: 'var(--text-3xl)',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        marginBottom: 'var(--space-2)',
      }}>
        {recipe.title}
      </h1>

      {recipe.description && (
        <p style={{
          fontSize: 'var(--text-base)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-4)',
          lineHeight: 'var(--leading-relaxed)',
        }}>
          {recipe.description}
        </p>
      )}

      {/* Meta Strip */}
      <div className="recipe-meta-strip">
        {recipe.prep_time_minutes && (
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
        {recipe.cook_time_minutes && (
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

      {/* Serving Scaler */}
      {recipe.servings ? (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <ServingScaler
            originalServings={recipe.servings}
            adjustedServings={adjustedServings}
            onServingsChange={count => setServingAdjustment({ recipeId, count })}
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
          <div>
            <h2 className="recipe-section-title">
              📝 {t.ingredients}
              {isScaled && (
                <span className="badge badge-warning" style={{ marginInlineStart: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                  {t.adjustedIngredients}
                </span>
              )}
            </h2>
            <ul className="ingredient-list">
              {displayIngredients.map((ingredient, i: number) => (
                <li
                  key={i}
                  className={`ingredient-item ${checkedIngredients.has(i) ? 'checked' : ''} ${isScaled ? 'ingredient-scaled' : ''}`}
                  onClick={() => toggleIngredient(i)}
                >
                  <div className="ingredient-checkbox">
                    {checkedIngredients.has(i) && <Check size={14} color="white" />}
                  </div>
                  <span>{formatIngredient(ingredient, locale)}</span>
                </li>
              ))}
            </ul>
            {isScaled && displayIngredients.some(ing => typeof normalizeIngredient(ing) === 'string') && (
              <p className="serving-hint">{locale === 'he' ? 'מרכיבים ללא כמות מזוהה נשארו ללא שינוי. אפשר לערוך את המתכון ולהזין להם כמות.' : 'Ingredients without a recognised quantity are unchanged. Edit the recipe to add their quantities.'}</p>
            )}
          </div>
        )}

        {/* Instructions */}
        {recipe.instructions.length > 0 && (
          <div>
            <h2 className="recipe-section-title">📋 {t.instructions}</h2>
            <ol className="instruction-list">
              {recipe.instructions.map((instruction, i) => (
                <li key={i} className="instruction-item">
                  <span className="instruction-number">{i + 1}</span>
                  <span className="instruction-text">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Notes Board */}
      <NoteBoard recipeId={recipeId} />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t.deleteRecipe}</h2>
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
