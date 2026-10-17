'use client';

import { ArrowUp, ArrowDown, X, SeparatorHorizontal } from 'lucide-react';
import { useId } from 'react';
import { useApp } from '@/components/providers/AppProvider';

interface Props {
  title: string;
  label: string;
  first: boolean;
  last: boolean;
  onChange: (title: string) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

export default function SectionHeadingInput({ title, label, first, last, onChange, onMove, onRemove }: Props) {
  const id = useId();
  const { locale, t } = useApp();
  return <div className="recipe-section-editor" data-reorder-item>
    <div className="recipe-section-editor-field">
      <label htmlFor={id}><SeparatorHorizontal size={18} />{label}</label>
      <input id={id} className="input" value={title} onChange={e => onChange(e.target.value)} placeholder={locale === 'he' ? 'למשל: לבצק, לרוטב, הרכבה ואפייה' : 'For example: Dough, Sauce, Assembly'} />
    </div>
    <div className="recipe-section-actions">
      <button type="button" className="btn btn-ghost btn-icon" disabled={first} aria-label={`${locale === 'he' ? 'הזזת כותרת למעלה' : 'Move heading up'}: ${title}`} onClick={() => onMove(-1)}><ArrowUp size={18} /></button>
      <button type="button" className="btn btn-ghost btn-icon" disabled={last} aria-label={`${locale === 'he' ? 'הזזת כותרת למטה' : 'Move heading down'}: ${title}`} onClick={() => onMove(1)}><ArrowDown size={18} /></button>
      <button type="button" className="btn btn-ghost btn-icon" aria-label={`${t.delete}: ${label} ${title}`} onClick={onRemove}><X size={18} /></button>
    </div>
  </div>;
}
