'use client';

// ============================================
// Recipe Book — Category Form Modal
// ============================================

import { useState } from 'react';
import { X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useApp } from '@/components/providers/AppProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Category, CATEGORY_COLORS } from '@/types';
import { CATEGORY_ICON_GROUPS } from '@/lib/categoryIcons';
import { getCategoryName } from '@/lib/utils';

interface CategoryFormProps {
  category?: Category;
  onClose: () => void;
}

export default function CategoryForm({ category, onClose }: CategoryFormProps) {
  const [hebrewName, setHebrewName] = useState(() => {
    if (!category?.name) return '';
    const separators = ['/', '|'];
    for (const sep of separators) {
      if (category.name.includes(sep)) {
        return category.name.split(sep)[0].trim();
      }
    }
    return category.name;
  });
  const [englishName, setEnglishName] = useState(() => {
    if (!category?.name) return '';
    const separators = ['/', '|'];
    for (const sep of separators) {
      if (category.name.includes(sep)) {
        return category.name.split(sep)[1].trim();
      }
    }
    return '';
  });
  const [icon, setIcon] = useState(category?.icon || '🍽️');
  const [color, setColor] = useState(category?.color || '#E94560');
  const [isLoading, setIsLoading] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const { createCategory, updateCategory } = useCategories();
  const { t, locale } = useApp();
  const toast = useToast();

  const isEdit = !!category;
  const query = iconSearch.trim().toLocaleLowerCase();
  const iconGroups = CATEGORY_ICON_GROUPS.map(group => ({ ...group, icons: group.icons.filter(item =>
    `${group.he} ${group.en} ${item.join(' ')}`.toLocaleLowerCase().includes(query)
  ) })).filter(group => group.icons.length);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hebrewName.trim()) return;

    setIsLoading(true);
    try {
      const finalName = englishName.trim()
        ? `${hebrewName.trim()} / ${englishName.trim()}`
        : hebrewName.trim();

      if (isEdit) {
        await updateCategory(category.id, { name: finalName, icon, color });
        toast.success(t.editCategory + ' ✓');
      } else {
        await createCategory({ name: finalName, icon, color });
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
      <div className="modal-content animate-scale-in book-dialog book-category-dialog" role="dialog" aria-modal="true" aria-labelledby="category-dialog-title" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" id="category-dialog-title">
            {isEdit ? t.editCategory : t.newCategory}
          </h2>
          <button className="btn btn-ghost btn-icon" aria-label={t.close} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Hebrew Name */}
          <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="input-label" htmlFor="category-name-he-input">{t.categoryNameHebrew}</label>
            <input
              type="text"
              className="input"
              value={hebrewName}
              onChange={e => setHebrewName(e.target.value)}
              placeholder="למשל: מאפים"
              required
              autoFocus
              id="category-name-he-input"
            />
          </div>

          {/* English Name */}
          <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="input-label" htmlFor="category-name-en-input">{t.categoryNameEnglish}</label>
            <input
              type="text"
              className="input"
              value={englishName}
              onChange={e => setEnglishName(e.target.value)}
              placeholder="e.g. Baking"
              id="category-name-en-input"
            />
          </div>

          {/* Icon Picker */}
          <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
            <label className="input-label">{t.categoryIcon}</label>
            <input type="search" className="input" aria-label={locale === 'he' ? 'חיפוש אייקון' : 'Search icons'} placeholder={locale === 'he' ? 'חיפוש: סושי, חטיפים, אסיאתי…' : 'Search sushi, snacks, Asian…'} value={iconSearch} onChange={e => setIconSearch(e.target.value)} />
            <div className="category-icon-picker">
              {iconGroups.map(group => (
                <div key={group.en}>
                  <h3 className="category-icon-group-title">{locale === 'he' ? group.he : group.en}</h3>
                  <div className="emoji-picker-grid">
                    {group.icons.map(([emoji, he, en]) => <button key={emoji} type="button" className={`emoji-btn ${icon === emoji ? 'active' : ''}`} onClick={() => setIcon(emoji)} aria-label={locale === 'he' ? he : en} title={locale === 'he' ? he : en} aria-pressed={icon === emoji}>{emoji}</button>)}
                  </div>
                </div>
              ))}
              {iconGroups.length === 0 && <p className="serving-hint">{t.noResults}</p>}
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
                  aria-label={`${t.categoryColor}: ${c}`}
                  aria-pressed={color === c}
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
             <span style={{ fontWeight: 600 }}>
              {getCategoryName(
                englishName.trim() ? `${hebrewName.trim()} / ${englishName.trim()}` : hebrewName.trim(),
                locale
              ) || t.categoryName}
            </span>
          </div>

          {/* Actions */}
          <div className="modal-footer" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t.cancel}
            </button>
             <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !hebrewName.trim()}
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
