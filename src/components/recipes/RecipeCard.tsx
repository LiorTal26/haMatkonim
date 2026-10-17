'use client';

import Link from 'next/link';
import { Heart, Clock, Users } from 'lucide-react';
import { Recipe } from '@/types';
import { getCategoryName } from '@/lib/utils';
import { useRecipes } from '@/hooks/useRecipes';
import { useApp } from '@/components/providers/AppProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useState } from 'react';

interface RecipeCardProps { recipe: Recipe; index?: number }

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const { toggleFavorite } = useRecipes();
  const { locale, t } = useApp();
  const toast = useToast();
  const [savingFavorite, setSavingFavorite] = useState(false);
  const categories = recipe.categories?.length ? recipe.categories : recipe.category ? [recipe.category] : [];
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  const handleFavorite = async () => {
    if (savingFavorite) return;
    setSavingFavorite(true);
    try { await toggleFavorite(recipe.id); }
    catch { toast.error(locale === 'he' ? 'לא ניתן לעדכן מועדפים כרגע. נסו שוב.' : 'Could not update favourites. Please try again.'); }
    finally { setSavingFavorite(false); }
  };

  return (
    <article className="recipe-card">
      <button type="button" className={`recipe-card-favorite ${recipe.is_favorite ? 'active' : ''}`} aria-label={`${recipe.is_favorite ? t.unfavorite : t.favorite}: ${recipe.title}`} aria-pressed={recipe.is_favorite} disabled={savingFavorite} onClick={handleFavorite}>
        <Heart size={18} fill={recipe.is_favorite ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>
      {recipe.image_url ? <img src={recipe.image_url} alt="" className="recipe-card-image" loading="lazy" /> : <div className="recipe-card-image-placeholder" aria-hidden="true">{categories[0]?.icon || '🍽️'}</div>}
      <div className="recipe-card-body">
        {categories.length > 0 && <div className="recipe-card-categories">
          {categories.slice(0, 2).map(category => <span key={category.id} className="badge">{category.icon} {getCategoryName(category.name, locale)}</span>)}
          {categories.length > 2 && <span className="badge">+{categories.length - 2}</span>}
        </div>}
        <h3 className="recipe-card-title"><Link className="recipe-card-link" href={`/dashboard/recipe/${recipe.id}`}>{recipe.title}</Link></h3>
        {recipe.description && <p className="recipe-card-description">{recipe.description}</p>}
        <div className="recipe-card-meta">
          {totalTime > 0 && <span className="recipe-card-meta-item"><Clock size={14} aria-hidden="true" /><span>{totalTime} {t.minutes}</span></span>}
          {Boolean(recipe.servings) && <span className="recipe-card-meta-item"><Users size={14} aria-hidden="true" /><span>{recipe.servings} {t.servings}</span></span>}
          {recipe.difficulty && <span className="recipe-difficulty">{t[recipe.difficulty]}</span>}
        </div>
      </div>
    </article>
  );
}
