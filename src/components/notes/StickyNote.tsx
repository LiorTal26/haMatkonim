'use client';

// ============================================
// Recipe Book — Sticky Note Component
// ============================================

import { useMemo } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { RecipeNote } from '@/types';
import { getRandomRotation } from '@/lib/utils';

interface StickyNoteProps {
  note: RecipeNote;
  onEdit: (note: RecipeNote) => void;
  onDelete: (id: string) => void;
}

export default function StickyNote({ note, onEdit, onDelete }: StickyNoteProps) {
  const rotation = useMemo(() => getRandomRotation(), []);

  return (
    <div
      className="sticky-note"
      style={{
        background: note.note_color,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div className="sticky-note-actions">
        <button
          className="sticky-note-btn"
          onClick={() => onEdit(note)}
          title="Edit"
        >
          <Edit3 size={14} />
        </button>
        <button
          className="sticky-note-btn"
          onClick={() => onDelete(note.id)}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {note.content}
      </p>
      <div style={{
        marginTop: 'var(--space-3)',
        fontSize: 'var(--text-xs)',
        opacity: 0.5,
      }}>
        {new Date(note.updated_at).toLocaleDateString()}
      </div>
    </div>
  );
}
