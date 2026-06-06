'use client';

// ============================================
// Recipe Book — Filter Bar Component
// ============================================

import { ArrowDownAZ, ArrowUpAZ, Clock, ChefHat, SlidersHorizontal } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { SortOption, DifficultyFilter, TimeFilter } from '@/types';

interface FilterBarProps {
  sortBy: SortOption;
  filterDifficulty: DifficultyFilter;
  filterTime: TimeFilter;
  onSortChange: (sort: SortOption) => void;
  onDifficultyChange: (d: DifficultyFilter) => void;
  onTimeChange: (t: TimeFilter) => void;
}

export default function FilterBar({
  sortBy,
  filterDifficulty,
  filterTime,
  onSortChange,
  onDifficultyChange,
  onTimeChange,
}: FilterBarProps) {
  const { t } = useApp();

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

  const hasActiveFilters = filterDifficulty !== 'all' || filterTime !== 'all';

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
          }}
        >
          <SlidersHorizontal size={14} />
          {t.cancel}
        </button>
      )}
    </div>
  );
}
