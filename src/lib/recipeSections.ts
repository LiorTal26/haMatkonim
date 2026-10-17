import type { StructuredIngredient } from '@/types';

// Instructions remain text[] in Supabase; this explicit marker needs no migration.
const SECTION_PREFIX = '::recipe-section::';

export function createIngredientSection(name = ''): StructuredIngredient {
  return { kind: 'section', name, quantity: null, unit: 'custom', note: '' };
}

export function isIngredientSection(value: StructuredIngredient | string): value is StructuredIngredient & { kind: 'section' } {
  return typeof value !== 'string' && value.kind === 'section';
}

export function createInstructionSection(title = ''): string {
  return SECTION_PREFIX + title;
}

export function getInstructionSection(value: string): string | null {
  return value.startsWith(SECTION_PREFIX) ? value.slice(SECTION_PREFIX.length) : null;
}

export function instructionRows(instructions: string[]) {
  let step = 0;
  return instructions.map(value => {
    const heading = getInstructionSection(value);
    return { text: heading ?? value, isSection: heading !== null, number: heading === null ? ++step : null };
  });
}

export function cleanInstructions(instructions: string[]): string[] {
  return instructions.filter(value => typeof value === 'string' && (getInstructionSection(value) ?? value).trim());
}
