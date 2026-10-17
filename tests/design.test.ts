import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RecipeCard from '../src/components/recipes/RecipeCard';
import { AppProvider } from '../src/components/providers/AppProvider';
import { ToastProvider } from '../src/components/providers/ToastProvider';
import type { Recipe } from '../src/types';

const recipe: Recipe = {
  id: 'design-test', user_id: 'test', category_id: null,
  title: 'פסטה עם בזיליקום', description: 'לארוחת ערב ביתית',
  ingredients: [], instructions: [], image_url: null,
  prep_time_minutes: 10, cook_time_minutes: 15, servings: 4,
  difficulty: 'easy', is_favorite: false,
  created_at: '2026-10-17', updated_at: '2026-10-17',
};

function render(overrides: Partial<Recipe> = {}) {
  return renderToStaticMarkup(createElement(AppProvider, null,
    createElement(ToastProvider, null,
      createElement(RecipeCard, { recipe: { ...recipe, ...overrides } }),
    ),
  ));
}

test('recipe cards have a real navigation link and a separate labelled favourite button', () => {
  const html = render();
  assert.match(html, /<article class="recipe-card">/);
  assert.match(html, /href="\/dashboard\/recipe\/design-test"/);
  assert.match(html, /aria-label="הוספה למועדפים: פסטה עם בזיליקום"/);
  assert.match(html, /aria-pressed="false"/);
  for (const anchor of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)) assert.doesNotMatch(anchor[1], /<button\b/);
  assert.match(html, /25 דקות/);
  assert.match(html, /4 מנות/);
  assert.match(html, /recipe-difficulty">קל/);
});

test('favourite state has an accessible removal label and images are decorative beside the title', () => {
  const html = render({ is_favorite: true, image_url: 'https://example.com/recipe.jpg' });
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /aria-label="הסרה מהמועדפים: פסטה עם בזיליקום"/);
  assert.match(html, /alt=""/);
  assert.match(html, /loading="lazy"/);
});

test('recipe cards tolerate legacy categories, missing photos, empty descriptions, and unknown times', () => {
  const html = render({ description: null, prep_time_minutes: null, cook_time_minutes: null, servings: null,
    category: { id: 'legacy', user_id: 'test', name: 'אסיאתי', icon: '🍜', color: '#fff', sort_order: 0, created_at: '2026-10-17' } });
  assert.match(html, /🍜 אסיאתי/);
  assert.match(html, /recipe-card-image-placeholder/);
  assert.doesNotMatch(html, /recipe-card-description|recipe-card-meta-item|NaN|undefined/);
});
