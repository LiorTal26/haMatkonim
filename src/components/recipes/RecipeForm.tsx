'use client';

// ============================================
// Recipe Book — Recipe Form (Add/Edit)
// ============================================

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, X, Clock, Users, ChefHat, Image as ImageIcon, GripVertical,
} from 'lucide-react';
import { useRecipes } from '@/hooks/useRecipes';
import { useCategories } from '@/hooks/useCategories';
import { useApp } from '@/components/providers/AppProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useDragReorder } from '@/hooks/useDragReorder';
import { Recipe, RecipeFormData, Difficulty, createEmptyIngredient } from '@/types';
import IngredientInput from '@/components/recipes/IngredientInput';
import CategoryForm from '@/components/categories/CategoryForm';
import RecipeAIAssistant from '@/components/recipes/RecipeAIAssistant';
import { normalizeIngredient } from '@/lib/scaleIngredients';
import type { AIRecipeDraft } from '@/lib/recipeAI';
import { cleanInstructions, createInstructionSection, getInstructionSection, instructionRows } from '@/lib/recipeSections';
import SectionHeadingInput from './SectionHeadingInput';
import { getCategoryName } from '@/lib/utils';

interface RecipeFormProps {
  recipe?: Recipe;
}

export default function RecipeForm({ recipe }: RecipeFormProps) {
  const router = useRouter();
  const { createRecipe, updateRecipe, uploadImage } = useRecipes();
  const { categories } = useCategories();
  const { t, locale } = useApp();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(recipe?.image_url || null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Resolve initial category_ids from recipe
  const getInitialCategoryIds = (): string[] => {
    if (!recipe) return [];
    if (recipe.categories?.length) return recipe.categories.map(c => c.id);
    if (recipe.recipe_categories?.length) return recipe.recipe_categories.map(rc => rc.category.id);
    if (recipe.category_id) return [recipe.category_id];
    return [];
  };

  const [formData, setFormData] = useState<RecipeFormData>({
    title: recipe?.title || '',
    description: recipe?.description || '',
    category_ids: getInitialCategoryIds(),
    ingredients: recipe?.ingredients?.length
      ? recipe.ingredients.map(ing => {
          const normalized = normalizeIngredient(ing);
          return typeof normalized === 'string'
            ? { quantity: null, unit: 'custom' as const, name: normalized, note: '' }
            : normalized;
        })
      : [createEmptyIngredient()],
    instructions: recipe?.instructions?.length ? recipe.instructions : [''],
    image_url: recipe?.image_url || '',
    prep_time_minutes: recipe?.prep_time_minutes || '',
    cook_time_minutes: recipe?.cook_time_minutes || '',
    servings: recipe?.servings || '',
    difficulty: recipe?.difficulty || 'medium',
  });

  const isEdit = !!recipe;
  const steps = instructionRows(formData.instructions);

  const applyAIDraft = (draft: AIRecipeDraft) => {
    setFormData(previous => ({
      ...previous, title: draft.title, description: draft.description,
      ingredients: draft.ingredients, instructions: draft.instructions.length ? draft.instructions : [''],
      servings: draft.servings ?? '', prep_time_minutes: draft.prep_time_minutes ?? '',
      cook_time_minutes: draft.cook_time_minutes ?? '', difficulty: draft.difficulty,
    }));
    toast.success(locale === 'he' ? 'הטיוטה נוספה לטופס. בדקו את הפרטים ולחצו על שמירה.' : 'Draft added to the form. Review it, then press Save.');
    document.getElementById('recipe-title-input')?.focus();
  };

  const updateField = <K extends keyof RecipeFormData>(key: K, value: RecipeFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Category toggle
  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId],
    }));
  };

  // Instructions list helpers
  const addInstruction = () => {
    setFormData(prev => ({ ...prev, instructions: [...prev.instructions, ''] }));
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => {
      const updated = [...prev.instructions];
      updated[index] = value;
      return { ...prev, instructions: updated };
    });
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => {
      const updated = prev.instructions.filter((_, i) => i !== index);
      return { ...prev, instructions: updated.length ? updated : [''] };
    });
  };

  const moveInstruction = (index: number, direction: -1 | 1) => {
    setFormData(previous => {
      const target = index + direction;
      if (target < 0 || target >= previous.instructions.length) return previous;
      const instructions = [...previous.instructions];
      [instructions[index], instructions[target]] = [instructions[target], instructions[index]];
      return { ...previous, instructions };
    });
  };

  // Drag & drop for instructions
  const instructionDrag = useDragReorder(
    formData.instructions,
    (newInstructions) => updateField('instructions', newInstructions),
  );

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const url = await uploadImage(file);
      updateField('image_url', url);
      toast.success(t.uploadImage + ' ✓');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      if (isEdit) {
        await updateRecipe(recipe.id, formData);
        toast.success(t.editRecipe + ' ✓');
        router.push(`/dashboard/recipe/${recipe.id}`);
      } else {
        const newRecipe = await createRecipe(formData);
        toast.success(t.newRecipe + ' ✓');
        router.push(`/dashboard/recipe/${newRecipe.id}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error saving recipe';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="book-editor">
      {/* Header */}
      <div className="book-page-heading">
        <button className="btn btn-ghost btn-icon" aria-label={t.back} onClick={() => router.back()}>
          <ArrowLeft className="book-back-icon" size={20} />
        </button>
        <div><h1 className="book-page-title">
          {isEdit ? t.editRecipe : t.newRecipe}
        </h1>
        <p className="book-page-description">{locale === 'he' ? 'הפרטים הקטנים שהופכים מנה למתכון שלכם.' : 'The little details that make a recipe your own.'}</p></div>
      </div>

      <RecipeAIAssistant onApply={applyAIDraft} formHasContent={Boolean(formData.title.trim() || formData.description.trim() || formData.ingredients.some(ing => ing.name.trim()) || cleanInstructions(formData.instructions).length)} />

      <form onSubmit={handleSubmit} className="glass-card book-editor-form">
        {/* Image Upload */}
        <div className="form-section book-form-photo">
          <div
            className="image-upload"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <div style={{ position: 'relative', width: '100%' }}>
                <img src={imagePreview} alt="Preview" className="image-upload-preview" />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  style={{ position: 'absolute', top: 8, insetInlineEnd: 8 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview(null);
                    updateField('image_url', '');
                  }}
                >
                  <X size={14} /> {t.removeImage}
                </button>
              </div>
            ) : (
              <>
                <ImageIcon size={40} className="image-upload-icon" />
                <span className="image-upload-text">{t.uploadImage}</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Title & Description */}
        <div className="form-section book-form-identity">
          <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="input-label" htmlFor="recipe-title-input">{t.recipeTitle} *</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={e => updateField('title', e.target.value)}
              placeholder={t.recipeTitle}
              required
              id="recipe-title-input"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="recipe-description-input">{t.description}</label>
            <textarea
              className="input textarea"
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              placeholder={t.description}
              id="recipe-description-input"
            />
          </div>
        </div>

        {/* Categories (Multi-select chips) & Difficulty */}
        <div className="form-section book-form-classification">
          <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="input-label">{t.categories}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categories.map(cat => {
                const isSelected = formData.category_ids.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={isSelected}
                    className="book-category-choice"
                    onClick={() => toggleCategory(cat.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: `2px solid ${isSelected ? cat.color : 'var(--color-border)'}`,
                      background: isSelected ? `${cat.color}20` : 'transparent',
                      color: isSelected ? cat.color : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-sm)',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {cat.icon} {getCategoryName(cat.name, locale)}
                  </button>
                );
              })}
              {/* Add new category button */}
              <button
                type="button"
                className="book-category-choice"
                onClick={() => setShowCategoryForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '2px dashed var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Plus size={14} /> {t.newCategory}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="recipe-difficulty-select">{t.difficulty}</label>
            <select
              className="input select"
              value={formData.difficulty}
              onChange={e => updateField('difficulty', e.target.value as Difficulty)}
              id="recipe-difficulty-select"
            >
              <option value="easy">🟢 {t.easy}</option>
              <option value="medium">🟡 {t.medium}</option>
              <option value="hard">🔴 {t.hard}</option>
            </select>
          </div>
        </div>

        {/* Time & Servings */}
        <div className="form-section book-form-timing">
          <div className="form-row recipe-form-times">
            <div className="input-group">
              <label className="input-label" htmlFor="recipe-prep-time">
                <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginInlineEnd: 4 }} />
                {t.prepTime}
              </label>
              <input
                type="number"
                className="input"
                value={formData.prep_time_minutes}
                onChange={e => updateField('prep_time_minutes', e.target.value)}
                placeholder={t.minutes}
                min="0"
                id="recipe-prep-time"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="recipe-cook-time">
                <ChefHat size={14} style={{ display: 'inline', verticalAlign: 'middle', marginInlineEnd: 4 }} />
                {t.cookTime}
              </label>
              <input
                type="number"
                className="input"
                value={formData.cook_time_minutes}
                onChange={e => updateField('cook_time_minutes', e.target.value)}
                placeholder={t.minutes}
                min="0"
                id="recipe-cook-time"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="recipe-servings">
                <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginInlineEnd: 4 }} />
                {t.servings}
              </label>
              <input
                type="number"
                className="input"
                value={formData.servings}
                onChange={e => updateField('servings', e.target.value)}
                placeholder="4"
                min="1"
                id="recipe-servings"
              />
            </div>
          </div>
        </div>

        {/* Ingredients — Structured */}
        <div className="form-section book-form-ingredients">
          <h3 className="form-section-title">📝 {t.ingredients}</h3>
          <IngredientInput
            ingredients={formData.ingredients}
            onChange={(ingredients) => updateField('ingredients', ingredients)}
          />
        </div>

        {/* Instructions with Drag & Drop */}
        <div className="form-section book-form-steps">
          <h3 className="form-section-title">📋 {t.instructions}</h3>
          <div className="dynamic-list">
            {formData.instructions.map((instruction, index) => getInstructionSection(instruction) !== null ? (
              <SectionHeadingInput key={index} title={getInstructionSection(instruction)!} label={locale === 'he' ? 'כותרת לקבוצת שלבים' : 'Instruction group heading'} first={index === 0} last={index === formData.instructions.length - 1} onChange={title => updateInstruction(index, createInstructionSection(title))} onMove={direction => moveInstruction(index, direction)} onRemove={() => removeInstruction(index)} />
            ) : (
              <div
                key={index}
                className="dynamic-list-item"
                data-reorder-item
                onDragStart={() => instructionDrag.handleDragStart(index)}
                onDragOver={(e) => instructionDrag.handleDragOver(e, index)}
                onDrop={() => instructionDrag.handleDrop(index)}
                onDragEnd={instructionDrag.handleDragEnd}
                style={{
                  opacity: instructionDrag.dragIndex === index ? 0.5 : 1,
                  borderTop: instructionDrag.overIndex === index && instructionDrag.dragIndex !== index
                    ? '2px solid var(--color-primary)'
                    : '2px solid transparent',
                  transition: 'opacity 0.2s ease',
                }}
              >
                {/* Drag handle */}
                <span
                  className="drag-handle"
                  draggable
                  onDragStart={() => instructionDrag.handleDragStart(index)}
                  onTouchStart={e => instructionDrag.handleTouchStart(index, e)}
                  onTouchMove={instructionDrag.handleTouchMove}
                  onTouchEnd={instructionDrag.handleTouchEnd}
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
                <span
                  className="book-form-step-number"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {steps[index].number}
                </span>
                <textarea
                  className="input"
                  value={instruction}
                  onChange={e => updateInstruction(index, e.target.value)}
                  placeholder={`${t.step} ${steps[index].number}`}
                  aria-label={`${t.step} ${steps[index].number}`}
                  rows={2}
                  style={{ minHeight: 60, resize: 'vertical' }}
                />
                {formData.instructions.length > 1 && (
                  <button
                    type="button"
                    className="dynamic-list-remove"
                    aria-label={`${t.delete} ${t.step} ${steps[index].number}`}
                    onClick={() => removeInstruction(index)}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={addInstruction}
              style={{ alignSelf: 'flex-start' }}
            >
              <Plus size={14} /> {t.addStep}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => updateField('instructions', [...formData.instructions, createInstructionSection()])}>{locale === 'he' ? '+ הוספת כותרת / מפריד' : '+ Add heading / divider'}</button>
          </div>
        </div>

        {/* Submit */}
        <div className="book-form-submit">
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
            {t.cancel}
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isLoading || !formData.title.trim()}
            id="recipe-submit-btn"
          >
            {isLoading ? <span className="spinner" /> : t.save}
          </button>
        </div>
      </form>

      {/* Inline Category Form Modal */}
      {showCategoryForm && (
        <CategoryForm onClose={() => setShowCategoryForm(false)} />
      )}
    </div>
  );
}
