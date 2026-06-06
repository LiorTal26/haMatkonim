'use client';

// ============================================
// Recipe Book — Note Editor Modal
// ============================================

import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { RecipeNote, NoteColor, NOTE_COLORS } from '@/types';

interface NoteEditorProps {
  note?: RecipeNote;
  onSave: (content: string, color: string) => void;
  onClose: () => void;
}

export default function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
  const [content, setContent] = useState(note?.content || '');
  const [color, setColor] = useState<string>(note?.note_color || '#FFF3CD');
  const { t } = useApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSave(content, color);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {note ? t.editNote : t.addNote}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Color Picker */}
          <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="input-label">{t.noteColor}</label>
            <div className="flex gap-2">
              {NOTE_COLORS.map(nc => (
                <button
                  key={nc.value}
                  type="button"
                  className={`color-swatch ${color === nc.value ? 'active' : ''}`}
                  style={{ background: nc.value, width: 44, height: 44 }}
                  onClick={() => setColor(nc.value)}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="input-label">{t.noteContent}</label>
            <textarea
              className="input textarea"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={t.noteContent}
              rows={5}
              style={{
                background: color,
                color: 'var(--note-text)',
                minHeight: 150,
              }}
              required
              autoFocus
              id="note-content-input"
            />
          </div>

          {/* Actions */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t.cancel}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!content.trim()}
              id="note-submit-btn"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
