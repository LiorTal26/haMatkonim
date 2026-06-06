'use client';

// ============================================
// Recipe Book — Structured Ingredient Input
// ============================================

import { Plus, X, GripVertical } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { StructuredIngredient, INGREDIENT_UNITS, createEmptyIngredient } from '@/types';

interface IngredientInputProps {
  ingredients: StructuredIngredient[];
  onChange: (ingredients: StructuredIngredient[]) => void;
}

export default function IngredientInput({ ingredients, onChange }: IngredientInputProps) {
  const { t, locale } = useApp();

  const updateIngredient = (index: number, field: keyof StructuredIngredient, value: unknown) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addIngredient = () => {
    onChange([...ingredients, createEmptyIngredient()]);
  };

  const removeIngredient = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    onChange(updated.length ? updated : [createEmptyIngredient()]);
  };

  return (
    <div className="ingredient-input-container">
      {/* Header row labels */}
      <div className="ingredient-input-header">
        <div className="ingredient-input-col-qty">{t.ingredientQuantity}</div>
        <div className="ingredient-input-col-unit">{t.ingredientUnit}</div>
        <div className="ingredient-input-col-name">{t.ingredientName}</div>
        <div className="ingredient-input-col-note">{t.ingredientNote}</div>
        <div className="ingredient-input-col-action" />
      </div>

      {/* Ingredient rows */}
      {ingredients.map((ingredient, index) => (
        <div key={index} className="ingredient-input-row">
          {/* Quantity */}
          <div className="ingredient-input-col-qty">
            <input
              type="number"
              className="input ingredient-input-qty"
              value={ingredient.quantity ?? ''}
              onChange={e => {
                const val = e.target.value;
                updateIngredient(index, 'quantity', val === '' ? null : Number(val));
              }}
              placeholder="—"
              min="0"
              step="0.25"
              disabled={ingredient.unit === 'to_taste'}
            />
          </div>

          {/* Unit */}
          <div className="ingredient-input-col-unit">
            <select
              className="input select ingredient-input-unit"
              value={ingredient.unit}
              onChange={e => {
                const unit = e.target.value;
                updateIngredient(index, 'unit', unit);
                if (unit === 'to_taste') {
                  updateIngredient(index, 'quantity', null);
                }
              }}
            >
              {INGREDIENT_UNITS.map(u => (
                <option key={u.value} value={u.value}>
                  {locale === 'he' ? u.labelHe : u.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div className="ingredient-input-col-name">
            <input
              type="text"
              className="input"
              value={ingredient.name}
              onChange={e => updateIngredient(index, 'name', e.target.value)}
              placeholder={`${t.ingredientName}...`}
            />
          </div>

          {/* Note */}
          <div className="ingredient-input-col-note">
            <input
              type="text"
              className="input ingredient-input-note"
              value={ingredient.note || ''}
              onChange={e => updateIngredient(index, 'note', e.target.value)}
              placeholder={t.ingredientNotePlaceholder}
            />
          </div>

          {/* Remove */}
          <div className="ingredient-input-col-action">
            {ingredients.length > 1 && (
              <button
                type="button"
                className="dynamic-list-remove"
                onClick={() => removeIngredient(index)}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add button */}
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={addIngredient}
        style={{ alignSelf: 'flex-start', marginTop: 'var(--space-2)' }}
      >
        <Plus size={14} /> {t.addIngredient}
      </button>
    </div>
  );
}
