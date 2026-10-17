'use client';

import { Check } from 'lucide-react';
import type { Locale, StructuredIngredient } from '@/types';
import { formatIngredient, normalizeIngredient } from '@/lib/scaleIngredients';
import { instructionRows, isIngredientSection } from '@/lib/recipeSections';

export function RecipeIngredients({ ingredients, locale, checked, onToggle, scaled = false, round = false }: {
  ingredients: (StructuredIngredient | string)[];
  locale: Locale;
  checked: Set<number>;
  onToggle: (index: number) => void;
  scaled?: boolean;
  round?: boolean;
}) {
  return <ul className="ingredient-list">{ingredients.map((value, index) => {
    const ingredient = normalizeIngredient(value);
    if (isIngredientSection(ingredient)) return <li key={index} className="recipe-subsection"><h3>{ingredient.name}</h3></li>;
    return <li key={index} className={`ingredient-item ${checked.has(index) ? 'checked' : ''} ${scaled ? 'ingredient-scaled' : ''}`}>
      <button type="button" className="ingredient-check-target" aria-pressed={checked.has(index)} onClick={() => onToggle(index)}>
        <span className="ingredient-checkbox" aria-hidden="true">{checked.has(index) && <Check size={14} color="white" />}</span>
        <span>{formatIngredient(ingredient, locale, { round: scaled && round })}</span>
      </button>
    </li>;
  })}</ul>;
}

export function RecipeInstructions({ instructions }: { instructions: string[] }) {
  return <ol className="instruction-list">{instructionRows(instructions).map((row, index) => row.isSection
    ? <li key={index} className="recipe-subsection"><h3>{row.text}</h3></li>
    : <li key={index} className="instruction-item"><span className="instruction-number">{row.number}</span><span className="instruction-text">{row.text}</span></li>)}</ol>;
}
