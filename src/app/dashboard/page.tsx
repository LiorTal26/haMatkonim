'use client';

// ============================================
// Recipe Book — Dashboard Main Page (Recipe Grid)
// ============================================

import { useMemo } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDashboard } from './layout';
import { useRecipes } from '@/hooks/useRecipes';
import { useApp } from '@/components/providers/AppProvider';
import RecipeCard from '@/components/recipes/RecipeCard';
import FilterBar from '@/components/recipes/FilterBar';
import { Recipe, SortOption, DifficultyFilter, TimeFilter } from '@/types';
import { motion } from 'framer-motion';

// ─── Client-side sort/filter helpers ─────────────────────────────────────────

function getTotalTime(recipe: Recipe): number {
  return (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
}

function filterByDifficulty(recipes: Recipe[], filter: DifficultyFilter): Recipe[] {
  if (filter === 'all') return recipes;
  return recipes.filter(r => r.difficulty === filter);
}

function filterByTime(recipes: Recipe[], filter: TimeFilter): Recipe[] {
  if (filter === 'all') return recipes;
  return recipes.filter(r => {
    const total = getTotalTime(r);
    if (total === 0) return false;
    switch (filter) {
      case 'under30': return total <= 30;
      case 'under60': return total <= 60;
      case 'over60': return total > 60;
      default: return true;
    }
  });
}

function sortRecipes(recipes: Recipe[], sort: SortOption): Recipe[] {
  const sorted = [...recipes];
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'name_az':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'name_za':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'fastest':
      return sorted.sort((a, b) => getTotalTime(a) - getTotalTime(b));
    case 'slowest':
      return sorted.sort((a, b) => getTotalTime(b) - getTotalTime(a));
    default:
      return sorted;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const {
    selectedCategoryIds,
    showFavorites,
    searchQuery,
    sortBy,
    filterDifficulty,
    filterTime,
    setSortBy,
    setFilterDifficulty,
    setFilterTime,
    toggleCategoryFilter,
  } = useDashboard();

  const { recipes, loading } = useRecipes();
  const { t, locale, chooMode } = useApp();
  const router = useRouter();

  // Apply client-side category / search / favorites filtering then sort
  const processedRecipes = useMemo(() => {
    let result = recipes;

    // Category filter (multi-select, OR logic)
    if (selectedCategoryIds.length > 0) {
      result = result.filter(r => {
        // Check multi-category join
        if (r.categories?.length) {
          return r.categories.some(c => selectedCategoryIds.includes(c.id));
        }
        // Fallback to legacy category_id
        return r.category_id ? selectedCategoryIds.includes(r.category_id) : false;
      });
    }

    // Favorites
    if (showFavorites) {
      result = result.filter(r => r.is_favorite);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => r.title.toLowerCase().includes(q));
    }

    // Difficulty filter
    result = filterByDifficulty(result, filterDifficulty);

    // Time filter
    result = filterByTime(result, filterTime);

    // Sort
    result = sortRecipes(result, sortBy);

    if (chooMode) {
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

      const matchesSearch = !searchQuery || secret.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryIds.length === 0 || selectedCategoryIds.includes('choo-love-category');
      const matchesFavorites = !showFavorites || secret.is_favorite;

      if (matchesSearch && matchesCategory && matchesFavorites) {
        result = [secret as any, ...result];
      }
    }

    return result;
  }, [recipes, selectedCategoryIds, showFavorites, searchQuery, filterDifficulty, filterTime, sortBy, locale, chooMode]);

  return (
    <>
      {/* Choo Birthday Banner */}
      {chooMode && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(255, 46, 147, 0.15) 0%, rgba(255, 90, 118, 0.05) 100%)',
            border: '1px dashed rgba(255, 46, 147, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4) var(--space-5)',
            marginBottom: 'var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            boxShadow: '0 4px 15px rgba(255, 46, 147, 0.1)',
          }}
        >
          <span className="choo-pulse" style={{ fontSize: 'var(--text-2xl)', flexShrink: 0 }}>🎉</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 700, color: '#FF2E93', fontSize: 'var(--text-base)' }}>יום הולדת שמח לצ'ו אהובתי! 🎂❤️</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              ספר המתכונים המיוחד שלך מופעל כעת במצב יום הולדת חגיגי.
            </p>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {showFavorites ? `❤️ ${t.favorites}` : t.allRecipes}
          </h1>
          {!loading && (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
              {processedRecipes.length} {t.recipes}
              {processedRecipes.length !== recipes.length && (
                <span> / {recipes.length} {t.allRecipes}</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        sortBy={sortBy}
        filterDifficulty={filterDifficulty}
        filterTime={filterTime}
        onSortChange={setSortBy}
        onDifficultyChange={setFilterDifficulty}
        onTimeChange={setFilterTime}
        selectedCategoryIds={selectedCategoryIds}
        onToggleCategoryFilter={toggleCategoryFilter}
      />

      {/* Loading skeletons */}
      {loading ? (
        <div className="recipe-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : processedRecipes.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="empty-state"
        >
          <div className="empty-state-icon">
            <BookOpen size={64} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <h2 className="empty-state-title">{t.noRecipesYet}</h2>
          <p className="empty-state-text">{t.addFirstRecipe}</p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => router.push('/dashboard/recipe/new')}
            style={{ marginTop: 'var(--space-4)' }}
          >
            <Plus size={18} /> {t.newRecipe}
          </button>
        </motion.div>
      ) : (
        /* Recipe grid */
        <div className="recipe-grid">
          {processedRecipes.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index} />
          ))}
        </div>
      )}
    </>
  );
}
