'use client';

// ============================================
// Recipe Book — Notes Hook
// ============================================

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RecipeNote, NoteFormData } from '@/types';

export function useNotes(recipeId: string) {
  const [notes, setNotes] = useState<RecipeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipe_notes')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotes(data);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  useEffect(() => {
    if (recipeId) {
      fetchNotes();
    }
  }, [recipeId, fetchNotes]);

  const createNote = useCallback(
    async (formData: NoteFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('recipe_notes')
        .insert({
          user_id: user.id,
          recipe_id: recipeId,
          content: formData.content,
          note_color: formData.note_color,
        })
        .select()
        .single();

      if (error) throw error;
      setNotes(prev => [data, ...prev]);
      return data;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recipeId]
  );

  const updateNote = useCallback(
    async (id: string, formData: Partial<NoteFormData>) => {
      const { data, error } = await supabase
        .from('recipe_notes')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setNotes(prev => prev.map(n => (n.id === id ? data : n)));
      return data;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const deleteNote = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('recipe_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== id));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    notes,
    loading,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}
