'use client';

// ============================================
// Recipe Book — Header Component
// ============================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Menu, Sun, Moon, Plus, Globe, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/components/providers/AppProvider';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({ onMenuClick, searchQuery, onSearchChange }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const { t, theme, toggleTheme, locale, setLocale } = useApp();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <header className="dashboard-header">
      {/* Mobile menu button */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={onMenuClick}
        id="menu-toggle-btn"
        style={{ display: 'none' }}
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="search-bar">
        <Search size={18} className="search-bar-icon" />
        <input
          type="text"
          className="input"
          placeholder={t.searchRecipes}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          id="search-input"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Add Recipe */}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => router.push('/dashboard/recipe/new')}
          id="add-recipe-btn"
        >
          <Plus size={16} />
          <span className="hide-mobile">{t.newRecipe}</span>
        </button>

        {/* Language Toggle */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setLocale(locale === 'he' ? 'en' : 'he')}
          title={locale === 'he' ? 'English' : 'עברית'}
          id="language-toggle-btn"
        >
          <Globe size={18} />
        </button>

        {/* Theme Toggle */}
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? t.lightMode : t.darkMode}
          id="theme-toggle-btn"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Menu */}
        <div className="user-menu">
          <button
            className="avatar"
            onClick={() => setShowUserMenu(!showUserMenu)}
            id="user-menu-btn"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            {profile?.display_name ? getInitials(profile.display_name) : '?'}
          </button>

          {showUserMenu && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-dropdown)' }}
                onClick={() => setShowUserMenu(false)}
              />
              <div className="user-menu-dropdown">
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                    {profile?.display_name || 'User'}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {profile?.email}
                  </div>
                </div>
                <button className="user-menu-item" onClick={handleLogout}>
                  <LogOut size={16} />
                  {t.logout}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none; }
          #menu-toggle-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
