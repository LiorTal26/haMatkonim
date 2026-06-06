'use client';

// ============================================
// Recipe Book — Recipe Form (Add/Edit)
// ============================================

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Plus, X, Clock, Users, ChefHat, Image as ImageIcon,
} from 'lucide-react';
import { useRecipes } from '@/hooks/useRecipes';
import { useCategories } from '@/hooks/useCategories';
import { useApp } from '@/components/providers/AppProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Recipe, RecipeFormData, Difficulty, StructuredIngredient, createEmptyIngredient } from '@/types';
import IngredientInput from '@/components/recipes/IngredientInput';

interface RecipeFormProps {
  recipe?: Recipe;
}

export default function RecipeForm({ recipe }: RecipeFormProps) {
  const router = useRouter();
  const { createRecipe, updateRecipe, uploadImage } = useRecipes();
  const { categories } = useCategories();
  const { t } = useApp();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(recipe?.image_url || null);
  const [formData, setFormData] = useState<RecipeFormData>({
    title: recipe?.title || '',
    description: recipe?.description || '',
    category_id: recipe?.category_id || '',
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

        {/* Category & Difficulty */}
        <div className="form-section">
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">{t.categories}</label>
              <select
                className="input select"
                value={formData.category_id}
                onChange={e => updateField('category_id', e.target.value)}
                id="recipe-category-select"
              >
                <option value="">—</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
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

        {/* Instructions */}
        <div className="form-section">
          <h3 className="form-section-title">📋 {t.instructions}</h3>
          <div className="dynamic-list">
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="dynamic-list-item">
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
    </div>
  );
}
