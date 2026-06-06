'use client';

// ============================================
// Recipe Book — Sidebar Component
// ============================================

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Heart, Layers, Plus, Settings, ChefHat } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useApp } from '@/components/providers/AppProvider';
import CategoryForm from '@/components/categories/CategoryForm';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  onShowFavorites: () => void;
  showFavorites: boolean;
  onShowAll: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  selectedCategoryId,
  onSelectCategory,
  onShowFavorites,
  showFavorites,
  onShowAll,
}: SidebarProps) {
  const { categories } = useCategories();
  const { t } = useApp();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigate = (action: () => void) => {
    action();
    onClose();
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <BookOpen size={24} style={{ color: 'var(--color-primary)' }} />
        <span className="sidebar-logo">{t.appName}</span>
      </div>

      {/* Quick Filters */}
      <div className="sidebar-section">
        <nav className="sidebar-nav">
          <Link
            href="/dashboard"
            className={`category-card ${!selectedCategoryId && !showFavorites ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavigate(onShowAll);
            }}
          >
            <div className="category-card-icon" style={{ background: 'var(--color-primary-subtle)' }}>
              <ChefHat size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <span className="category-card-name">{t.allRecipes}</span>
          </Link>

          <button
            className={`category-card ${showFavorites ? 'active' : ''}`}
            onClick={() => handleNavigate(onShowFavorites)}
          >
            <div className="category-card-icon" style={{ background: 'var(--color-error-subtle)' }}>
              <Heart size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <span className="category-card-name">{t.favorites}</span>
          </button>
        </nav>
      </div>

      {/* Categories */}
      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-section-title">{t.categories}</div>
        <nav className="sidebar-nav">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-card ${selectedCategoryId === category.id ? 'active' : ''}`}
              onClick={() => handleNavigate(() => onSelectCategory(category.id))}
            >
              <div
                className="category-card-icon"
                style={{ background: `${category.color}20` }}
              >
                {category.icon}
              </div>
              <span className="category-card-name">{category.name}</span>
            </button>
          ))}

          <button
            className="category-card"
            onClick={() => {
              onClose();
              setShowCategoryForm(true);
            }}
            style={{ color: 'var(--color-text-muted)' }}
          >
            <div className="category-card-icon" style={{ background: 'var(--color-surface)' }}>
              <Plus size={18} />
            </div>
            <span className="category-card-name">{t.newCategory}</span>
          </button>
        </nav>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link href="/dashboard/categories" className="category-card" onClick={onClose}>
          <div className="category-card-icon" style={{ background: 'var(--color-surface)' }}>
            <Settings size={18} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <span className="category-card-name">{t.manageCategories}</span>
        </Link>
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <CategoryForm onClose={() => setShowCategoryForm(false)} />
      )}
    </aside>
  );
}
