import { INGREDIENT_UNITS, type Difficulty, type StructuredIngredient } from '@/types';

export interface AIRecipeDraft {
  title: string;
  description: string;
  ingredients: StructuredIngredient[];
  instructions: string[];
  servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  difficulty: Difficulty;
  warnings: string[];
}

// Base64 adds ~33%; keep the JSON upload under Vercel's 4.5 MB request limit.
export const MAX_RECIPE_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_RECIPE_TOTAL_IMAGE_BYTES = MAX_RECIPE_IMAGE_BYTES;
export const MAX_RECIPE_IMAGES = 6;
export const MAX_RECIPE_PROMPT_LENGTH = 3000;

/** Exact decoded size without allocating a binary copy in the browser. */
export function recipeImageBytes(image: string): number | null {
  const match = image.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[2].length % 4 !== 0) return null;
  const padding = match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0;
  return match[2].length * 3 / 4 - padding;
}

export const recipeDraftSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    title: { type: 'string' }, description: { type: 'string' },
    ingredients: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      properties: {
        quantity: { type: ['number', 'null'] },
        unit: { type: 'string', enum: INGREDIENT_UNITS.map(unit => unit.value) },
        name: { type: 'string' }, note: { type: 'string' },
      }, required: ['quantity', 'unit', 'name', 'note'],
    } },
    instructions: { type: 'array', items: { type: 'string' } },
    servings: { type: ['integer', 'null'] },
    prep_time_minutes: { type: ['integer', 'null'] },
    cook_time_minutes: { type: ['integer', 'null'] },
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
    warnings: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'description', 'ingredients', 'instructions', 'servings', 'prep_time_minutes', 'cook_time_minutes', 'difficulty', 'warnings'],
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validate again at the trust boundary, even with provider structured outputs. */
export function validateRecipeDraft(value: unknown): AIRecipeDraft {
  if (!isRecord(value)) throw new Error('Invalid draft');
  const text = (input: unknown, max: number): string => {
    if (typeof input !== 'string' || input.length > max) throw new Error('Invalid text');
    return input.trim();
  };
  const nullableInteger = (input: unknown, min: number, max: number) => {
    if (input === null) return null;
    if (typeof input !== 'number' || !Number.isInteger(input) || input < min || input > max) throw new Error('Invalid number');
    return input;
  };
  const textList = (input: unknown, maxItems: number, maxLength: number) => {
    if (!Array.isArray(input) || input.length > maxItems) throw new Error('Invalid list');
    return input.map(item => text(item, maxLength)).filter(Boolean);
  };
  const title = text(value.title, 200);
  if (!title || !Array.isArray(value.ingredients) || !value.ingredients.length || value.ingredients.length > 80) throw new Error('No readable recipe');
  const ingredients = value.ingredients.map((item): StructuredIngredient => {
    if (!isRecord(item)) throw new Error('Invalid ingredient');
    if (!INGREDIENT_UNITS.some(unit => unit.value === item.unit)) throw new Error('Invalid unit');
    const name = text(item.name, 300);
    if (!name) throw new Error('Missing ingredient name');
    if (item.quantity !== null && (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity < 0 || item.quantity > 1_000_000)) throw new Error('Invalid quantity');
    return { name, quantity: item.unit === 'to_taste' ? null : item.quantity as number | null, unit: item.unit as StructuredIngredient['unit'], note: text(item.note, 500) };
  });
  if (!['easy', 'medium', 'hard'].includes(String(value.difficulty))) throw new Error('Invalid difficulty');
  return {
    title, description: text(value.description, 3000), ingredients,
    instructions: textList(value.instructions, 60, 3000),
    servings: nullableInteger(value.servings, 1, 1000),
    prep_time_minutes: nullableInteger(value.prep_time_minutes, 0, 10080),
    cook_time_minutes: nullableInteger(value.cook_time_minutes, 0, 10080),
    difficulty: value.difficulty as Difficulty, warnings: textList(value.warnings, 15, 600),
  };
}
