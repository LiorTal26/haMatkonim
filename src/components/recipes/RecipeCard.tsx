'use client';

// ============================================
// Recipe Book — Recipe Card Component
// ============================================

import { useRouter } from 'next/navigation';
import { Heart, Clock, Users } from 'lucide-react';
import { Recipe } from '@/types';
import { formatTime, getCategoryName } from '@/lib/utils';
import { useRecipes } from '@/hooks/useRecipes';
import { useApp } from '@/components/providers/AppProvider';
import { motion } from 'framer-motion';

interface RecipeCardProps {
  recipe: Recipe;
  index?: number;
}

export default function RecipeCard({ recipe, index = 0 }: RecipeCardProps) {
  const router = useRouter();
  const { toggleFavorite } = useRecipes();
  const { locale } = useApp();

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(recipe.id);
  };

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
  const categoryEmoji = recipe.category?.icon || '🍽️';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="recipe-card"
      onClick={() => router.push(`/dashboard/recipe/${recipe.id}`)}
      style={{ position: 'relative' }}
    >
      {/* Favorite button */}
      <button
        className={`recipe-card-favorite ${recipe.is_favorite ? 'active' : ''}`}
        onClick={handleFavorite}
      >
        <Heart size={18} fill={recipe.is_favorite ? 'var(--color-primary)' : 'none'} />
      </button>

      {/* Image */}
      {recipe.image_url ? (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          className="recipe-card-image"
          loading="lazy"
        />
      ) : (
        <div className="recipe-card-image-placeholder">
          {categoryEmoji}
        </div>
      )}

      {/* Body */}
      <div className="recipe-card-body">
        {/* Category badges */}
        {(() => {
          const cats = recipe.categories?.length ? recipe.categories : (recipe.category ? [recipe.category] : []);
          if (cats.length === 0) return null;
          const shown = cats.slice(0, 2);
          const remaining = cats.length - shown.length;
          return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: 'var(--space-2)' }}>
              {shown.map(cat => (
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
              ))}
              {remaining > 0 && (
                <span
                  className="badge"
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.7rem',
                  }}
                >
                  +{remaining}
                </span>
              )}
            </div>
          );
        })()}

        <h3 className="recipe-card-title">{recipe.title}</h3>

        {recipe.description && (
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: 'var(--space-1) 0',
          }}>
            {recipe.description}
          </p>
        )}

        <div className="recipe-card-meta">
          {totalTime > 0 && (
            <div className="recipe-card-meta-item">
              <Clock size={14} />
              <span>{formatTime(totalTime)}</span>
            </div>
          )}
          {recipe.servings && (
            <div className="recipe-card-meta-item">
              <Users size={14} />
              <span>{recipe.servings}</span>
            </div>
          )}
          {recipe.difficulty && (
            <span
              className="badge"
              style={{
                background:
                  recipe.difficulty === 'easy'
                    ? 'var(--color-success-subtle)'
                    : recipe.difficulty === 'hard'
                    ? 'var(--color-error-subtle)'
                    : 'var(--color-warning-subtle)',
                color:
                  recipe.difficulty === 'easy'
                    ? 'var(--color-success)'
                    : recipe.difficulty === 'hard'
                    ? 'var(--color-error)'
                    : 'var(--color-warning)',
                fontSize: '0.7rem',
              }}
            >
              {recipe.difficulty === 'easy' ? '🟢' : recipe.difficulty === 'hard' ? '🔴' : '🟡'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
