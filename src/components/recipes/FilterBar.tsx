'use client';

// ============================================
// Recipe Book — Filter Bar Component
// ============================================

import { ArrowDownAZ, Clock, ChefHat, SlidersHorizontal, Tag } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { useCategories } from '@/hooks/useCategories';
import { SortOption, DifficultyFilter, TimeFilter, Category } from '@/types';
import { getCategoryName } from '@/lib/utils';

interface FilterBarProps {
  sortBy: SortOption;
  filterDifficulty: DifficultyFilter;
  filterTime: TimeFilter;
  onSortChange: (sort: SortOption) => void;
  onDifficultyChange: (d: DifficultyFilter) => void;
  onTimeChange: (t: TimeFilter) => void;
  // Multi-category filter
  selectedCategoryIds?: string[];
  onToggleCategoryFilter?: (id: string) => void;
}

export default function FilterBar({
  sortBy,
  filterDifficulty,
  filterTime,
  onSortChange,
  onDifficultyChange,
  onTimeChange,
  selectedCategoryIds = [],
  onToggleCategoryFilter,
}: FilterBarProps) {
  const { t, locale } = useApp();
  const { categories } = useCategories();

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: t.newest },
    { value: 'oldest', label: t.oldest },
    { value: 'name_az', label: t.nameAZ },
    { value: 'name_za', label: t.nameZA },
    { value: 'fastest', label: t.fastestFirst },
    { value: 'slowest', label: t.slowestFirst },
  ];

  const difficultyOptions: { value: DifficultyFilter; label: string; emoji?: string }[] = [
    { value: 'all', label: t.allDifficulties },
    { value: 'easy', label: t.easy, emoji: '🟢' },
    { value: 'medium', label: t.medium, emoji: '🟡' },
    { value: 'hard', label: t.hard, emoji: '🔴' },
  ];

  const timeOptions: { value: TimeFilter; label: string }[] = [
    { value: 'all', label: t.allTimes },
    { value: 'under30', label: t.upTo30 },
    { value: 'under60', label: t.upTo60 },
    { value: 'over60', label: t.over60 },
  ];

  const hasActiveFilters = filterDifficulty !== 'all' || filterTime !== 'all' || selectedCategoryIds.length > 0;

  return (
    <div className="filter-bar">
      {/* Sort */}
      <div className="filter-group">
        <label className="filter-label">
          <ArrowDownAZ size={14} />
          {t.sortBy}
        </label>
        <select
          className="filter-select"
          value={sortBy}
          onChange={e => onSortChange(e.target.value as SortOption)}
          id="sort-select"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Category chips */}
      {categories.length > 0 && onToggleCategoryFilter && (
        <div className="filter-group">
          <label className="filter-label">
            <Tag size={14} />
            {t.categories}
          </label>
          <div className="filter-chips">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`filter-chip ${selectedCategoryIds.includes(cat.id) ? 'active' : ''}`}
                onClick={() => onToggleCategoryFilter(cat.id)}
                style={selectedCategoryIds.includes(cat.id) ? {
                  background: `${cat.color}25`,
                  borderColor: cat.color,
                  color: cat.color,
                } : undefined}
              >
                <span>{cat.icon}</span>
                {getCategoryName(cat.name, locale)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty chips */}
      <div className="filter-group">
        <label className="filter-label">
          <ChefHat size={14} />
          {t.filterDifficulty}
        </label>
        <div className="filter-chips">
          {difficultyOptions.map(opt => (
            <button
              key={opt.value}
              className={`filter-chip ${filterDifficulty === opt.value ? 'active' : ''}`}
              onClick={() => onDifficultyChange(opt.value)}
            >
              {opt.emoji && <span>{opt.emoji}</span>}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time chips */}
      <div className="filter-group">
        <label className="filter-label">
          <Clock size={14} />
          {t.filterTime}
        </label>
        <div className="filter-chips">
          {timeOptions.map(opt => (
            <button
              key={opt.value}
              className={`filter-chip ${filterTime === opt.value ? 'active' : ''}`}
              onClick={() => onTimeChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <button
          className="filter-clear"
          onClick={() => {
            onDifficultyChange('all');
            onTimeChange('all');
            if (onToggleCategoryFilter) {
              // Clear all category filters by toggling each active one off
              selectedCategoryIds.forEach(id => onToggleCategoryFilter(id));
            }
          }}
        >
          <SlidersHorizontal size={14} />
          {t.cancel}
        </button>
      )}
    </div>
  );
}
