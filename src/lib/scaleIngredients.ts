// ============================================
// Recipe Book — Ingredient Scaling Utility
// ============================================

import { StructuredIngredient, INGREDIENT_UNITS, Locale } from '@/types';
import { FRACTIONS, parseLegacyIngredient } from './legacyIngredient';

/**
 * Scale a single ingredient's quantity by a ratio.
 * Returns a new StructuredIngredient with the adjusted quantity.
 * Ingredients with null quantity (e.g. "to taste") are not scaled.
 */
export function scaleIngredient(
  ingredient: StructuredIngredient | string,
  ratio: number
): StructuredIngredient | string {
  const ing = normalizeIngredient(ingredient);

  if (typeof ing === 'string') return ing;
  if (ing.quantity === null || ing.quantity === undefined || ing.unit === 'to_taste') {
    return ing;
  }

  if (!Number.isFinite(ratio) || ratio <= 0) return ing;
  const scaled = Number((ing.quantity * ratio).toPrecision(10));
  return Number.isFinite(scaled) ? { ...ing, quantity: scaled } : ing;
}

/**
 * Scale all ingredients from originalServings to newServings.
 * Returns a new array of scaled ingredients.
 */
export function scaleIngredients(
  ingredients: (StructuredIngredient | string)[],
  originalServings: number,
  newServings: number
): (StructuredIngredient | string)[] {
  if (!ingredients) return [];
  if (!Number.isFinite(originalServings) || !Number.isFinite(newServings) || originalServings <= 0 || newServings <= 0) return ingredients;
  if (originalServings === newServings) return ingredients;

  const ratio = newServings / originalServings;
  return ingredients.map(ing => scaleIngredient(ing, ratio));
}

/**
 * Format a quantity for display.
 */
export function formatQuantity(qty: number | null | undefined): string {
  // Bulletproof guard — handles null, undefined, NaN, non-numeric
  if (qty === null || qty === undefined || typeof qty !== 'number' || isNaN(qty) || !isFinite(qty)) return '';
  if (qty === 0) return '0';

  if (Number.isInteger(qty)) return String(qty);
  const whole = Math.floor(qty);
  const frac = qty - whole;
  for (const [symbol, value] of Object.entries(FRACTIONS)) {
    if (Math.abs(frac - value) <= 0.005) return `${whole || ''}${symbol}`;
  }
  return new Intl.NumberFormat('en', { maximumSignificantDigits: 6, useGrouping: false }).format(qty);
}

/**
 * Get the abbreviation for a unit in the given locale
 */
export function getUnitAbbrev(unit: string, locale: Locale): string {
  if (!unit) return '';
  const found = INGREDIENT_UNITS.find(u => u.value === unit);
  if (!found) return unit;
  return locale === 'he' ? found.abbrevHe : found.abbrevEn;
}

/**
 * Normalize an ingredient value — handles three cases:
 * 1. Already a StructuredIngredient object (post-migration or new recipe)
 * 2. A plain text string  (very old recipes, pre-structured-format)
 * 3. A JSON string        (new structured objects saved while still on text[] column)
 */
export function normalizeIngredient(ingredient: StructuredIngredient | string): StructuredIngredient | string {
  if (typeof ingredient !== 'string') {
    // Sanitize even proper objects — quantity must be a valid number or null
    const qty = (ingredient as StructuredIngredient).quantity;
    if (qty !== null && (typeof qty !== 'number' || !Number.isFinite(qty) || qty < 0)) {
      return { ...ingredient, quantity: null };
    }
    return ingredient;
  }

  // Try to parse as JSON
  const trimmed = ingredient.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && 'name' in parsed) {
        // Sanitize quantity
        return normalizeIngredient(parsed as StructuredIngredient);
      }
    } catch {
      // not valid JSON — fall through to plain text
    }
  }

  return parseLegacyIngredient(ingredient);
}

/**
 * Format a structured ingredient as a display string.
 * Handles raw JSON strings (pre-migration), plain text strings, and proper objects.
 */
export function formatIngredient(
  ingredient: StructuredIngredient | string,
  locale: Locale
): string {
  const ing = normalizeIngredient(ingredient);

  // Plain text (very old entries)
  if (typeof ing === 'string') {
    return ing;
  }
  if (!ing) return '';

  if (ing.unit === 'to_taste') {
    const suffix = locale === 'he' ? 'לפי הטעם' : 'to taste';
    return `${ing.name || ''} — ${suffix}`;
  }

  const parts: string[] = [];

  if (ing.quantity !== null && ing.quantity !== undefined) {
    parts.push(formatQuantity(ing.quantity));
  }

  if (ing.unit && ing.unit !== 'piece') {
    parts.push(getUnitAbbrev(ing.unit, locale));
  }

  if (ing.name) {
    parts.push(ing.name);
  }

  if (ing.note) {
    parts.push(`(${ing.note})`);
  }

  return parts.filter(Boolean).join(' ');
}
