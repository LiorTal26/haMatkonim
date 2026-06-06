'use client';

// ============================================
// Recipe Book — Sidebar Component
// ============================================

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Heart, Layers, Plus, Settings, ChefHat } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useApp } from '@/components/providers/AppProvider';
import CategoryForm from '@/components/categories/CategoryForm';
import { getCategoryName } from '@/lib/utils';

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
  const { t, locale, chooMode, setChooMode, setShowChooGreeting } = useApp();
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const nextClicks = logoClicks + 1;
    if (nextClicks >= 5) {
      setLogoClicks(0);
      const nextMode = !chooMode;
      setChooMode(nextMode);
      if (nextMode) {
        setShowChooGreeting(true);
      }
    } else {
      setLogoClicks(nextClicks);
      clickTimeoutRef.current = setTimeout(() => {
        setLogoClicks(0);
      }, 3000);
    }
  };

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
      <div
        className="sidebar-header"
        onClick={handleLogoClick}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        title={chooMode ? "צ'ו מופעל! ❤️" : undefined}
      >
        {chooMode ? (
          <span className="choo-pulse" style={{ fontSize: 'var(--text-2xl)' }}>🎂</span>
        ) : (
          <BookOpen size={24} style={{ color: 'var(--color-primary)' }} />
        )}
        <span
          className="sidebar-logo"
          style={chooMode ? { fontSize: '1.02rem', whiteSpace: 'nowrap' } : undefined}
        >
          {chooMode ? (locale === 'he' ? "ספר המתכונים של צ'ו 🎂" : "Choo's Recipe Book 🎂") : t.appName}
        </span>
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
              <span className="category-card-name">{getCategoryName(category.name, locale)}</span>
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
