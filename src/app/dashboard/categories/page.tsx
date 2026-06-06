'use client';

// ============================================
// Recipe Book — Categories Management Page
// ============================================

import { useState } from 'react';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/useCategories';
import { useApp } from '@/components/providers/AppProvider';
import { useToast } from '@/components/providers/ToastProvider';
import CategoryForm from '@/components/categories/CategoryForm';
import { Category } from '@/types';
import { motion } from 'framer-motion';
import { getCategoryName } from '@/lib/utils';

export default function CategoriesPage() {
  const router = useRouter();
  const { categories, loading, deleteCategory } = useCategories();
  const { t, locale } = useApp();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success(t.deleteCategory + ' ✓');
      setDeletingId(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      toast.error(message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {t.manageCategories}
          </h1>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setEditingCategory(undefined);
            setShowForm(true);
          }}
          id="add-category-btn"
        >
          <Plus size={16} /> {t.newCategory}
        </button>
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h2 className="empty-state-title">{t.noCategoriesYet}</h2>
          <p className="empty-state-text">{t.addFirstCategory}</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            style={{ marginTop: 'var(--space-4)' }}
          >
            <Plus size={16} /> {t.newCategory}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-4) var(--space-5)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  background: `${category.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xl)',
                  flexShrink: 0,
                }}
              >
                {category.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>
                  {getCategoryName(category.name, locale)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => handleEdit(category)}
                  title={t.edit}
                >
                  <Edit size={16} />
                </button>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => setDeletingId(category.id)}
                  title={t.delete}
                  style={{ color: 'var(--color-error)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Category Form Modal */}
      {showForm && (
        <CategoryForm
          category={editingCategory}
          onClose={() => {
            setShowForm(false);
            setEditingCategory(undefined);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="modal-overlay" onClick={() => setDeletingId(null)}>
          <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t.deleteCategory}</h2>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
              {locale === 'he'
                ? 'מחיקת קטגוריה לא תמחק את המתכונים שבה. האם להמשיך?'
                : 'Deleting a category will not delete its recipes. Continue?'}
            </p>
            <div className="modal-footer" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingId(null)}>
                {t.cancel}
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deletingId)}>
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
