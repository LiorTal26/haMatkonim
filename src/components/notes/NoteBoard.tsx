'use client';

// ============================================
// Recipe Book — Note Board Component
// ============================================

import { useState } from 'react';
import { Plus, StickyNote as StickyNoteIcon } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { useApp } from '@/components/providers/AppProvider';
import { useToast } from '@/components/providers/ToastProvider';
import StickyNote from '@/components/notes/StickyNote';
import NoteEditor from '@/components/notes/NoteEditor';
import { RecipeNote } from '@/types';

interface NoteBoardProps {
  recipeId: string;
}

export default function NoteBoard({ recipeId }: NoteBoardProps) {
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes(recipeId);
  const { t } = useApp();
  const toast = useToast();
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<RecipeNote | undefined>();

  const handleSave = async (content: string, color: string) => {
    try {
      if (editingNote) {
        await updateNote(editingNote.id, { content, note_color: color });
        toast.success(t.editNote + ' ✓');
      } else {
        await createNote({ content, note_color: color });
        toast.success(t.addNote + ' ✓');
      }
      setShowEditor(false);
      setEditingNote(undefined);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      toast.error(message);
    }
  };

  const handleEdit = (note: RecipeNote) => {
    setEditingNote(note);
    setShowEditor(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
      toast.success(t.deleteNote + ' ✓');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error';
      toast.error(message);
    }
  };

  return (
    <div style={{ marginTop: 'var(--space-8)' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 className="recipe-section-title">
          <StickyNoteIcon size={22} style={{ color: 'var(--color-secondary)' }} />
          📌 {t.myNotes}
        </h2>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setEditingNote(undefined);
            setShowEditor(true);
          }}
          id="add-note-btn"
        >
          <Plus size={14} /> {t.addNote}
        </button>
      </div>

      {loading ? (
        <div className="note-board">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-sm)' }} />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
          <div className="empty-state-icon">📝</div>
          <p className="empty-state-text">{t.noNotesYet}</p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowEditor(true)}
          >
            <Plus size={14} /> {t.addFirstNote}
          </button>
        </div>
      ) : (
        <div className="note-board">
          {notes.map(note => (
            <StickyNote
              key={note.id}
              note={note}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showEditor && (
        <NoteEditor
          note={editingNote}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingNote(undefined);
          }}
        />
      )}
    </div>
  );
}
