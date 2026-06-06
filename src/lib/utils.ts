// ============================================
// Recipe Book — Utility Functions
// ============================================

import { Difficulty } from '@/types';

/**
 * Format minutes to a readable time string
 */
export function formatTime(minutes: number | null): string {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Get difficulty label with emoji
 */
export function getDifficultyLabel(
  difficulty: Difficulty,
  locale: 'he' | 'en' = 'he'
): string {
  const labels = {
    easy: { he: '🟢 קל', en: '🟢 Easy' },
    medium: { he: '🟡 בינוני', en: '🟡 Medium' },
    hard: { he: '🔴 קשה', en: '🔴 Hard' },
  };
  return labels[difficulty][locale];
}

/**
 * Generate a random rotation for sticky notes (-3deg to 3deg)
 */
export function getRandomRotation(): number {
  return (Math.random() - 0.5) * 6;
}

/**
 * Debounce function for search
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Get initials from a display name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get Supabase storage URL for recipe images
 */
export function getImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/recipe-images/${path}`;
}

// ─── Category Translation Dictionary ──────────────────────────────────────────

const CATEGORY_DICTIONARY: Record<string, { he: string; en: string }> = {
  'מתוקים': { he: 'מתוקים', en: 'Sweets' },
  'sweets': { he: 'מתוקים', en: 'Sweets' },
  'בשר טחון': { he: 'בשר טחון', en: 'Ground Meat' },
  'ground meat': { he: 'בשר טחון', en: 'Ground Meat' },
  'minced meat': { he: 'בשר טחון', en: 'Ground Meat' },
  'אסיאתי': { he: 'אסיאתי', en: 'Asian' },
  'asian': { he: 'אסיאתי', en: 'Asian' },
  'עיקריות': { he: 'עיקריות', en: 'Mains' },
  'mains': { he: 'עיקריות', en: 'Mains' },
  'main dishes': { he: 'עיקריות', en: 'Mains' },
  'ראשונות': { he: 'ראשונות', en: 'Starters' },
  'starters': { he: 'ראשונות', en: 'Starters' },
  'appetizers': { he: 'ראשונות', en: 'Starters' },
  'קינוחים': { he: 'קינוחים', en: 'Desserts' },
  'desserts': { he: 'קינוחים', en: 'Desserts' },
  'סלטים': { he: 'סלטים', en: 'Salads' },
  'salads': { he: 'סלטים', en: 'Salads' },
  'מרקים': { he: 'מרקים', en: 'Soups' },
  'soups': { he: 'מרקים', en: 'Soups' },
  'מאפים': { he: 'מאפים', en: 'Baking' },
  'baking': { he: 'מאפים', en: 'Baking' },
  'pastries': { he: 'מאפים', en: 'Baking' },
  'דגים': { he: 'דגים', en: 'Fish' },
  'fish': { he: 'דגים', en: 'Fish' },
  'עוף': { he: 'עוף', en: 'Chicken' },
  'chicken': { he: 'עוף', en: 'Chicken' },
  'בשר': { he: 'בשר', en: 'Meat' },
  'meat': { he: 'בשר', en: 'Meat' },
  'beef': { he: 'בשר', en: 'Meat' },
  'חלבי': { he: 'חלבי', en: 'Dairy' },
  'dairy': { he: 'חלבי', en: 'Dairy' },
  'טבעוני': { he: 'טבעוני', en: 'Vegan' },
  'vegan': { he: 'טבעוני', en: 'Vegan' },
  'צמחוני': { he: 'צמחוני', en: 'Vegetarian' },
  'vegetarian': { he: 'צמחוני', en: 'Vegetarian' },
  'ללא גלוטן': { he: 'ללא גלוטן', en: 'Gluten Free' },
  'gluten free': { he: 'ללא גלוטן', en: 'Gluten Free' },
  'לחמים': { he: 'לחמים', en: 'Bread' },
  'bread': { he: 'לחמים', en: 'Bread' },
  'רטבים': { he: 'רטבים', en: 'Sauces' },
  'sauces': { he: 'רטבים', en: 'Sauces' },
  'משקאות': { he: 'משקאות', en: 'Drinks' },
  'drinks': { he: 'משקאות', en: 'Drinks' },
  'beverages': { he: 'משקאות', en: 'Drinks' },
  'ארוחת בוקר': { he: 'ארוחת בוקר', en: 'Breakfast' },
  'breakfast': { he: 'ארוחת בוקר', en: 'Breakfast' },
  'פסטה': { he: 'פסטה', en: 'Pasta' },
  'pasta': { he: 'פסטה', en: 'Pasta' },
  'פיצה': { he: 'פיצה', en: 'Pizza' },
  'pizza': { he: 'פיצה', en: 'Pizza' },
  'אורז': { he: 'אורז', en: 'Rice' },
  'rice': { he: 'אורז', en: 'Rice' },
  'מתאבנים': { he: 'מתאבנים', en: 'Appetizers' },
};

/**
 * Get category name translated based on current locale.
 * Supports auto-translation from a built-in dictionary and
 * bilingual name formats (e.g. "פשטידות / Pies" or "דגים | Fish").
 */
export function getCategoryName(name: string | null | undefined, locale: 'he' | 'en'): string {
  if (!name) return '';

  // 1. Check if name contains a slash or vertical bar separator (e.g. "Hebrew / English")
  const separators = ['/', '|'];
  for (const sep of separators) {
    if (name.includes(sep)) {
      const parts = name.split(sep).map(p => p.trim());
      if (parts.length >= 2) {
        return locale === 'he' ? parts[0] : parts[1];
      }
    }
  }

  // 2. Check if name is in dictionary
  const cleanName = name.toLowerCase().trim();
  const matched = CATEGORY_DICTIONARY[cleanName];
  if (matched) {
    return locale === 'he' ? matched.he : matched.en;
  }

  return name;
}
