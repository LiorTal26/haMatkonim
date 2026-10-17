'use client';

// ============================================
// Recipe Book — Structured Ingredient Input
// ============================================

import { Plus, X, GripVertical, SeparatorHorizontal } from 'lucide-react';
import { useId } from 'react';
import { useApp } from '@/components/providers/AppProvider';
import { StructuredIngredient, INGREDIENT_UNITS, createEmptyIngredient } from '@/types';
import { useDragReorder } from '@/hooks/useDragReorder';
import { createIngredientSection, isIngredientSection } from '@/lib/recipeSections';
import SectionHeadingInput from './SectionHeadingInput';

interface IngredientInputProps {
  ingredients: StructuredIngredient[];
  onChange: (ingredients: StructuredIngredient[]) => void;
}

export default function IngredientInput({ ingredients, onChange }: IngredientInputProps) {
  const { t, locale } = useApp();
  const inputId = useId();

  const drag = useDragReorder(ingredients, onChange);

  const updateIngredient = (index: number, patch: Partial<StructuredIngredient>) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  };

  const addIngredient = () => {
    onChange([...ingredients, createEmptyIngredient()]);
  };

  const removeIngredient = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    onChange(updated.length ? updated : [createEmptyIngredient()]);
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ingredients.length) return;
    const updated = [...ingredients];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    onChange(updated);
  };

  return (
    <div className="ingredient-input-container">
      {/* Header row labels */}
      <div className="ingredient-input-header">
        <div style={{ width: 24 }} /> {/* drag handle spacer */}
        <div className="ingredient-input-col-qty">{t.ingredientQuantity}</div>
        <div className="ingredient-input-col-unit">{t.ingredientUnit}</div>
        <div className="ingredient-input-col-name">{t.ingredientName}</div>
        <div className="ingredient-input-col-note">{t.ingredientNote}</div>
        <div className="ingredient-input-col-action" />
      </div>

      {/* Ingredient rows */}
      {ingredients.map((ingredient, index) => isIngredientSection(ingredient) ? (
        <SectionHeadingInput key={index} title={ingredient.name} label={locale === 'he' ? 'כותרת לקבוצת רכיבים' : 'Ingredient group heading'} first={index === 0} last={index === ingredients.length - 1} onChange={name => updateIngredient(index, { name })} onMove={direction => moveSection(index, direction)} onRemove={() => removeIngredient(index)} />
      ) : (
        <div
          key={index}
          className="ingredient-input-row"
          data-reorder-item
          onDragStart={() => drag.handleDragStart(index)}
          onDragOver={(e) => drag.handleDragOver(e, index)}
          onDrop={() => drag.handleDrop(index)}
          onDragEnd={drag.handleDragEnd}
          style={{
            opacity: drag.dragIndex === index ? 0.5 : 1,
            borderTop: drag.overIndex === index && drag.dragIndex !== index
              ? '2px solid var(--color-primary)'
              : '2px solid transparent',
            transition: 'opacity 0.2s ease',
          }}
        >
          {/* Drag handle */}
          <span
            className="drag-handle"
            draggable
            onDragStart={() => drag.handleDragStart(index)}
            onTouchStart={e => drag.handleTouchStart(index, e)}
            onTouchMove={drag.handleTouchMove}
            onTouchEnd={drag.handleTouchEnd}
            aria-label={locale === 'he' ? 'גרירה לסידור המרכיבים' : 'Drag to reorder ingredients'}
            style={{
              cursor: 'grab',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              touchAction: 'none',
            }}
          >
            <GripVertical size={16} />
          </span>

          {/* Quantity */}
          <div className="ingredient-input-col-qty">
            <label className="ingredient-field-label" htmlFor={`${inputId}-${index}-qty`}>{t.ingredientQuantity}</label>
            <input
              id={`${inputId}-${index}-qty`}
              aria-label={`${t.ingredientQuantity} ${index + 1}`}
              inputMode="decimal"
              type="number"
              className="input ingredient-input-qty"
              value={ingredient.quantity ?? ''}
              onChange={e => {
                const val = e.target.value;
                updateIngredient(index, { quantity: val === '' ? null : Number(val) });
              }}
              placeholder="—"
              min="0"
              step="any"
              disabled={ingredient.unit === 'to_taste'}
            />
          </div>

          {/* Unit */}
          <div className="ingredient-input-col-unit">
            <label className="ingredient-field-label" htmlFor={`${inputId}-${index}-unit`}>{t.ingredientUnit}</label>
            <select
              id={`${inputId}-${index}-unit`}
              aria-label={`${t.ingredientUnit} ${index + 1}`}
              className="input select ingredient-input-unit"
              value={ingredient.unit}
              onChange={e => {
                const unit = e.target.value as StructuredIngredient['unit'];
                updateIngredient(index, { unit, ...(unit === 'to_taste' ? { quantity: null } : {}) });
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
            <label className="ingredient-field-label" htmlFor={`${inputId}-${index}-name`}>{t.ingredientName}</label>
            <textarea
              id={`${inputId}-${index}-name`}
              aria-label={`${t.ingredientName} ${index + 1}`}
              rows={2}
              className="input ingredient-input-name"
              value={ingredient.name}
              onChange={e => updateIngredient(index, { name: e.target.value })}
              placeholder={`${t.ingredientName}...`}
            />
          </div>

          {/* Note */}
          <div className="ingredient-input-col-note">
            <label className="ingredient-field-label" htmlFor={`${inputId}-${index}-note`}>{t.ingredientNote}</label>
            <input
              id={`${inputId}-${index}-note`}
              aria-label={`${t.ingredientNote} ${index + 1}`}
              type="text"
              className="input ingredient-input-note"
              value={ingredient.note || ''}
              onChange={e => updateIngredient(index, { note: e.target.value })}
              placeholder={t.ingredientNotePlaceholder}
            />
          </div>

          {/* Remove */}
          <div className="ingredient-input-col-action">
            {ingredients.length > 1 && (
              <button
                type="button"
                className="dynamic-list-remove"
                aria-label={`${t.delete} ${t.ingredientName} ${index + 1}`}
                onClick={() => removeIngredient(index)}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add button */}
      <div className="recipe-list-actions"><button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={addIngredient}
        style={{ alignSelf: 'flex-start', marginTop: 'var(--space-2)' }}
      >
        <Plus size={14} /> {t.addIngredient}
      </button><button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange([...ingredients, createIngredientSection()])}><SeparatorHorizontal size={16} />{locale === 'he' ? 'הוספת כותרת / מפריד' : 'Add heading / divider'}</button></div>
    </div>
  );
}
