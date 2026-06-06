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
    selectedCategoryId,
    showFavorites,
    searchQuery,
    sortBy,
    filterDifficulty,
    filterTime,
    setSortBy,
    setFilterDifficulty,
    setFilterTime,
  } = useDashboard();

  const { recipes, loading } = useRecipes();
  const { t } = useApp();
  const router = useRouter();

  // Apply client-side category / search / favorites filtering then sort
  const processedRecipes = useMemo(() => {
    let result = recipes;

    // Category
    if (selectedCategoryId) {
      result = result.filter(r => r.category_id === selectedCategoryId);
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

    return result;
  }, [recipes, selectedCategoryId, showFavorites, searchQuery, filterDifficulty, filterTime, sortBy]);

  return (
    <>
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
