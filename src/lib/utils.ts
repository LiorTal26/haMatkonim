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
