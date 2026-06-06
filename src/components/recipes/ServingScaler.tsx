'use client';

// ============================================
// Recipe Book — Serving Scaler Component
// ============================================

import { useState } from 'react';
import { Minus, Plus, RotateCcw, Scale } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';

interface ServingScalerProps {
  originalServings: number;
  adjustedServings: number;
  scalingEnabled: boolean;
  onServingsChange: (newServings: number) => void;
  onToggleScaling: () => void;
}

export default function ServingScaler({
  originalServings,
  adjustedServings,
  scalingEnabled,
  onServingsChange,
  onToggleScaling,
}: ServingScalerProps) {
  const { t } = useApp();
  const isAdjusted = adjustedServings !== originalServings;

  return (
    <div className={`serving-scaler ${scalingEnabled ? 'active' : ''}`}>
      {/* Toggle */}
      <button
        className={`scaling-toggle ${scalingEnabled ? 'on' : ''}`}
        onClick={onToggleScaling}
        title={scalingEnabled ? t.scalingEnabled : t.scalingDisabled}
        type="button"
      >
        <Scale size={16} />
      </button>

      {scalingEnabled && (
        <div className="serving-controls">
          {/* Decrease */}
          <button
            className="serving-btn"
            onClick={() => onServingsChange(Math.max(1, adjustedServings - 1))}
            disabled={adjustedServings <= 1}
            type="button"
          >
            <Minus size={14} />
          </button>

          {/* Count */}
          <span className={`serving-count ${isAdjusted ? 'adjusted' : ''}`}>
            {adjustedServings}
          </span>

          {/* Increase */}
          <button
            className="serving-btn"
            onClick={() => onServingsChange(adjustedServings + 1)}
            type="button"
          >
            <Plus size={14} />
          </button>

          {/* Reset */}
          {isAdjusted && (
            <button
              className="serving-reset"
              onClick={() => onServingsChange(originalServings)}
              title={t.resetServings}
              type="button"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      )}

      {/* Label */}
      {scalingEnabled && isAdjusted && (
        <span className="serving-label">
          {t.adjustedIngredients}
        </span>
      )}
    </div>
  );
}
