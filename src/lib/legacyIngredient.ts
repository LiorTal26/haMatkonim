import type { StructuredIngredient } from '@/types';

export const FRACTIONS: Record<string, number> = {
  '¼': 1 / 4, '½': 1 / 2, '¾': 3 / 4, '⅓': 1 / 3, '⅔': 2 / 3,
  '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8,
};

const units: [RegExp, StructuredIngredient['unit']][] = [
  [/^(?:קילוגרם|קילו|ק[״"]ג|kilograms?|kg)\s+/i, 'kg'],
  [/^(?:גרמים|גרם|גר[׳']?\.?|grams?|g)\s+/i, 'g'],
  [/^(?:מיליליטר|מ[״"]ל|milliliters?|ml)\s+/i, 'ml'],
  [/^(?:ליטרים|ליטר|liters?|l)\s+/i, 'l'],
  [/^(?:כוסות|כוס|cups?)\s+/i, 'cup'],
  [/^(?:כפות|כף|tablespoons?|tbsp)\s+/i, 'tbsp'],
  [/^(?:כפיות|כפית|teaspoons?|tsp)\s+/i, 'tsp'],
  [/^(?:שיני|שן|cloves?)\s+/i, 'clove'],
  [/^(?:פרוסות|פרוסה|slices?)\s+/i, 'slice'],
  [/^(?:צרורות|צרור|bunch(?:es)?)\s+/i, 'bunch'],
  [/^(?:ענפים|ענף|sprigs?)\s+/i, 'sprig'],
  [/^(?:קמצוצים|קמצוץ|pinches|pinch)\s+/i, 'pinch'],
  [/^(?:יחידות|יחידה|יח[׳']|pieces?|pcs?)\s+/i, 'piece'],
];

/** Parse only explicit leading quantities; ambiguous ranges stay untouched. */
export function parseLegacyIngredient(text: string): StructuredIngredient | string {
  const match = text.trim().match(/^(\d+\s+\d+\s*\/\s*\d+|\d+\s*[¼½¾⅓⅔⅛⅜⅝⅞]|\d+\s*\/\s*\d+|[¼½¾⅓⅔⅛⅜⅝⅞]|\d+(?:[.,]\d+)?)(?:\s+|(?=[א-תA-Za-z]))(.+)$/u);
  if (!match) return text;
  const raw = match[1].replace(/\s+/g, ' ').trim();
  let quantity: number;
  const fraction = FRACTIONS[raw.at(-1) || ''];
  if (fraction) quantity = Number(raw.slice(0, -1).trim() || 0) + fraction;
  else if (raw.includes('/')) {
    const parts = raw.split(/[ /]+/).map(Number);
    quantity = parts.length === 3 ? parts[0] + parts[1] / parts[2] : parts[0] / parts[1];
  } else quantity = Number(raw.replace(',', '.'));
  if (!Number.isFinite(quantity) || quantity < 0) return text;

  let name = match[2].trim();
  if (/^(?:[-–—/]|(?:to|עד)\s)/iu.test(name)) return text;
  let unit: StructuredIngredient['unit'] = 'piece';
  for (const [pattern, value] of units) {
    if (pattern.test(name)) { unit = value; name = name.replace(pattern, '').trim(); break; }
  }
  return name ? { quantity, unit, name, note: '' } : text;
}
