'use client';

import { Minus, Plus, RotateCcw, Users } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';

interface ServingScalerProps {
  originalServings: number;
  adjustedServings: number;
  onServingsChange: (newServings: number) => void;
}

export default function ServingScaler({ originalServings, adjustedServings, onServingsChange }: ServingScalerProps) {
  const { t, locale } = useApp();
  const isAdjusted = adjustedServings !== originalServings;
  return (
    <section className={`serving-scaler ${isAdjusted ? 'active' : ''}`} aria-label={t.adjustServings}>
      <div className="serving-summary">
        <label className="serving-title" htmlFor="adjusted-servings"><Users size={18} />{t.adjustServings}</label>
        <span className="serving-hint">{t.originalServings}: {originalServings} · {locale === 'he' ? 'הכמויות מתעדכנות אוטומטית' : 'Quantities update automatically'}</span>
      </div>
      <div className="serving-controls">
        <button className="serving-btn" aria-label={locale === 'he' ? 'פחות סועדים' : 'Fewer servings'} onClick={() => onServingsChange(adjustedServings - 1)} disabled={adjustedServings <= 1} type="button"><Minus size={18} /></button>
        <input id="adjusted-servings" className={`input serving-count ${isAdjusted ? 'adjusted' : ''}`} type="number" inputMode="numeric" min={1} max={1000} step={1} value={adjustedServings} onFocus={e => e.currentTarget.select()} onChange={e => {
          const value = Number(e.target.value);
          if (Number.isInteger(value) && value >= 1 && value <= 1000) onServingsChange(value);
        }} />
        <button className="serving-btn" aria-label={locale === 'he' ? 'עוד סועדים' : 'More servings'} onClick={() => onServingsChange(adjustedServings + 1)} disabled={adjustedServings >= 1000} type="button"><Plus size={18} /></button>
        {isAdjusted && <button className="btn btn-ghost btn-sm serving-reset" onClick={() => onServingsChange(originalServings)} type="button"><RotateCcw size={16} />{t.resetServings}</button>}
      </div>
      <p className="serving-hint" aria-live="polite">{isAdjusted ? `${t.adjustedIngredients} ×${Number((adjustedServings / originalServings).toFixed(3))}` : (locale === 'he' ? 'שנו את מספר הסועדים להתאמת כמויות המרכיבים.' : 'Change the servings to scale the ingredient quantities.')}</p>
    </section>
  );
}
