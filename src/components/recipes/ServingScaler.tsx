'use client';

import { Minus, Plus, RotateCcw, Users } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { useId, useState } from 'react';
import { MAX_SERVINGS, parseServingCount } from '@/lib/servings';

interface ServingScalerProps {
  originalServings: number;
  adjustedServings: number;
  onServingsChange: (newServings: number) => void;
  roundQuantities?: boolean;
  onRoundingChange?: (enabled: boolean) => void;
}

export default function ServingScaler({ originalServings, adjustedServings, onServingsChange, roundQuantities = true, onRoundingChange }: ServingScalerProps) {
  const { t, locale } = useApp();
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const invalid = draft !== null && parseServingCount(draft) === null;
  const changeCount = (count: number) => {
    setDraft(null);
    onServingsChange(Math.min(MAX_SERVINGS, Math.max(1, count)));
  };
  const isAdjusted = adjustedServings !== originalServings;
  return (
    <section className={`serving-scaler ${isAdjusted ? 'active' : ''}`} aria-label={t.adjustServings}>
      <div className="serving-summary">
        <label className="serving-title" htmlFor={id}><Users size={18} />{t.adjustServings}</label>
        <span className="serving-hint">{t.originalServings}: {originalServings} · {locale === 'he' ? 'הכמויות מתעדכנות אוטומטית' : 'Quantities update automatically'}</span>
      </div>
      <div className="serving-controls">
        <button className="serving-btn" aria-label={locale === 'he' ? 'פחות סועדים' : 'Fewer servings'} onClick={() => changeCount(adjustedServings - 1)} disabled={adjustedServings <= 1} type="button"><Minus size={18} /></button>
        <input id={id} className={`input serving-count ${isAdjusted ? 'adjusted' : ''}`} type="number" inputMode="numeric" min={1} max={MAX_SERVINGS} step={1} value={draft ?? adjustedServings} aria-invalid={invalid} aria-describedby={`${id}-hint`} onFocus={e => e.currentTarget.select()} onChange={e => {
          setDraft(e.target.value);
          const value = parseServingCount(e.target.value);
          if (value !== null) onServingsChange(value);
        }} onBlur={() => setDraft(null)} onKeyDown={e => {
          if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); e.currentTarget.blur(); }
        }} />
        <button className="serving-btn" aria-label={locale === 'he' ? 'עוד סועדים' : 'More servings'} onClick={() => changeCount(adjustedServings + 1)} disabled={adjustedServings >= MAX_SERVINGS} type="button"><Plus size={18} /></button>
        {isAdjusted && <button className="btn btn-ghost btn-sm serving-reset" onClick={() => changeCount(originalServings)} type="button"><RotateCcw size={16} />{t.resetServings}</button>}
      </div>
      <p id={`${id}-hint`} className="serving-hint" aria-live="polite">{invalid ? (locale === 'he' ? 'יש להזין מספר שלם בין 1 ל־1,000.' : 'Enter a whole number from 1 to 1,000.') : isAdjusted ? `${t.adjustedIngredients} ×${Number((adjustedServings / originalServings).toFixed(3))}` : (locale === 'he' ? 'שנו את מספר הסועדים להתאמת כמויות המרכיבים.' : 'Change the servings to scale the ingredient quantities.')}</p>
      {onRoundingChange && <label className="serving-rounding"><input type="checkbox" checked={roundQuantities} onChange={e => onRoundingChange(e.target.checked)} />{locale === 'he' ? 'עיגול נוח למדידה (≈), בתצוגה בלבד' : 'Practical rounding (≈), display only'}</label>}
    </section>
  );
}
