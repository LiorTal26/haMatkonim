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
import { Recipe, RecipeFormData, Difficulty, StructuredIngredient, createEmptyIngredient } from '@/types';
import IngredientInput from '@/components/recipes/IngredientInput';
import CategoryForm from '@/components/categories/CategoryForm';
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
          // Already a proper object
          if (typeof ing !== 'string') return ing;
          // Try JSON parse (saved before DB migration)
          const trimmed = (ing as string).trim();
          if (trimmed.startsWith('{')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed && typeof parsed === 'object' && 'name' in parsed) {
                return parsed as StructuredIngredient;
              }
            } catch { /* fall through */ }
          }
          // Plain text ingredient
          return { quantity: null, unit: 'custom' as const, name: ing as string, note: '' };
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
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center gap-4" style={{ marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          {isEdit ? t.editRecipe : t.newRecipe}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-card">
        {/* Image Upload */}
        <div className="form-section">
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
        <div className="form-section">
          <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="input-label">{t.recipeTitle} *</label>
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
            <label className="input-label">{t.description}</label>
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
        <div className="form-section">
          <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="input-label">{t.categories}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categories.map(cat => {
                const isSelected = formData.category_ids.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
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
            <label className="input-label">{t.difficulty}</label>
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
        <div className="form-section">
          <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="input-group">
              <label className="input-label">
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
              <label className="input-label">
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
              <label className="input-label">
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
        <div className="form-section">
          <h3 className="form-section-title">📝 {t.ingredients}</h3>
          <IngredientInput
            ingredients={formData.ingredients}
            onChange={(ingredients) => updateField('ingredients', ingredients)}
          />
        </div>

        {/* Instructions with Drag & Drop */}
        <div className="form-section">
          <h3 className="form-section-title">📋 {t.instructions}</h3>
          <div className="dynamic-list">
            {formData.instructions.map((instruction, index) => (
              <div
                key={index}
                className="dynamic-list-item"
                draggable
                onDragStart={() => instructionDrag.handleDragStart(index)}
                onDragOver={(e) => instructionDrag.handleDragOver(e, index)}
                onDrop={() => instructionDrag.handleDrop(index)}
                onDragEnd={instructionDrag.handleDragEnd}
                onTouchStart={(e) => instructionDrag.handleTouchStart(index, e)}
                onTouchMove={instructionDrag.handleTouchMove}
                onTouchEnd={instructionDrag.handleTouchEnd}
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
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>
                <textarea
                  className="input"
                  value={instruction}
                  onChange={e => updateInstruction(index, e.target.value)}
                  placeholder={`${t.step} ${index + 1}`}
                  rows={2}
                  style={{ minHeight: 60, resize: 'vertical' }}
                />
                {formData.instructions.length > 1 && (
                  <button
                    type="button"
                    className="dynamic-list-remove"
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
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-between" style={{ paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
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
