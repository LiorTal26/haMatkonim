// ============================================
// Recipe Book — Ingredient Scaling Utility
// ============================================

import { StructuredIngredient, INGREDIENT_UNITS, Locale } from '@/types';
import { FRACTIONS, parseLegacyIngredient } from './legacyIngredient';
import { isIngredientSection } from './recipeSections';

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

  if (typeof ing === 'string' || isIngredientSection(ing)) return ing;
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

/** Display-only rounding. Never round pieces up or erase small spice quantities. */
export function roundCookingQuantity(quantity: number, unit: StructuredIngredient['unit']): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return quantity;
  if (['piece', 'slice', 'clove', 'sprig', 'bunch', 'to_taste', 'custom'].includes(unit)) return quantity;
  if (unit === 'g' || unit === 'ml') {
    const step = quantity >= 100 ? 5 : quantity >= 10 ? 1 : quantity >= 1 ? 0.1 : null;
    if (step) {
      const rounded = Number((Math.round(quantity / step) * step).toPrecision(10));
      if (Math.abs(rounded - quantity) / quantity <= 0.02) return rounded;
    }
  }
  // Prefer familiar kitchen fractions only when the difference is at most 2%.
  if (['cup', 'tbsp', 'tsp', 'pinch'].includes(unit)) {
    const whole = Math.floor(quantity);
    const candidates = Object.values(FRACTIONS).map(fraction => whole + fraction);
    candidates.push(whole, whole + 1);
    const nearest = candidates.reduce((best, value) => Math.abs(value - quantity) < Math.abs(best - quantity) ? value : best);
    if (nearest > 0 && Math.abs(nearest - quantity) / quantity <= 0.02) return nearest;
  }
  return Number(quantity.toPrecision(3));
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
  locale: Locale,
  options: { round?: boolean } = {},
): string {
  const ing = normalizeIngredient(ingredient);

  // Plain text (very old entries)
  if (typeof ing === 'string') {
    return ing;
  }
  if (!ing) return '';
  if (isIngredientSection(ing)) return ing.name;

  if (ing.unit === 'to_taste') {
    const suffix = locale === 'he' ? 'לפי הטעם' : 'to taste';
    return `${ing.name || ''} — ${suffix}${ing.note ? ` (${ing.note})` : ''}`;
  }

  const parts: string[] = [];

  if (ing.quantity !== null && ing.quantity !== undefined) {
    const displayed = options.round ? roundCookingQuantity(ing.quantity, ing.unit) : ing.quantity;
    const approximate = Math.abs(displayed - ing.quantity) > Math.max(1e-8, ing.quantity * 1e-8);
    const formatted = ['g', 'kg', 'ml', 'l'].includes(ing.unit)
      ? new Intl.NumberFormat('en', { maximumSignificantDigits: 6, useGrouping: false }).format(displayed)
      : formatQuantity(displayed);
    parts.push(`${approximate ? '≈ ' : ''}${formatted}`);
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
