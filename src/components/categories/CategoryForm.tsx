'use client';

// ============================================
// Recipe Book — Category Form Modal
// ============================================

import { useState } from 'react';
import { X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useApp } from '@/components/providers/AppProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Category, CATEGORY_EMOJIS, CATEGORY_COLORS } from '@/types';

interface CategoryFormProps {
  category?: Category;
  onClose: () => void;
}

export default function CategoryForm({ category, onClose }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || '🍽️');
  const [color, setColor] = useState(category?.color || '#E94560');
  const [isLoading, setIsLoading] = useState(false);
  const { createCategory, updateCategory } = useCategories();
  const { t } = useApp();
  const toast = useToast();

  const isEdit = !!category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      if (isEdit) {
        await updateCategory(category.id, { name, icon, color });
        toast.success(t.editCategory + ' ✓');
      } else {
        await createCategory({ name, icon, color });
        toast.success(t.newCategory + ' ✓');
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? t.editCategory : t.newCategory}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="input-label">{t.categoryName}</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.categoryName}
              required
              autoFocus
              id="category-name-input"
            />
          </div>

          {/* Icon Picker */}
          <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="input-label">{t.categoryIcon}</label>
            <div className="emoji-picker-grid">
              {CATEGORY_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={`emoji-btn ${icon === emoji ? 'active' : ''}`}
                  onClick={() => setIcon(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="input-label">{t.categoryColor}</label>
            <div className="color-picker-grid">
              {CATEGORY_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface)',
            marginBottom: 'var(--space-5)',
          }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: `${color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-xl)',
              }}
            >
              {icon}
            </div>
            <span style={{ fontWeight: 600 }}>{name || t.categoryName}</span>
          </div>

          {/* Actions */}
          <div className="modal-footer" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t.cancel}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !name.trim()}
              id="category-submit-btn"
            >
              {isLoading ? <span className="spinner" /> : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
