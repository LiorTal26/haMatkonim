'use client';

// ============================================
// Recipe Book — Drag & Drop Reorder Hook
// Supports both mouse drag and touch on mobile
// ============================================

import { useState, useRef, useCallback } from 'react';

interface DragReorderResult<T> {
  dragIndex: number | null;
  overIndex: number | null;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  handleDrop: (index: number) => void;
  // Touch support
  handleTouchStart: (index: number, e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  isDragging: boolean;
}

export function useDragReorder<T>(
  items: T[],
  onChange: (items: T[]) => void,
): DragReorderResult<T> {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Touch tracking
  const touchStartY = useRef<number>(0);
  const touchItemHeight = useRef<number>(0);
  const touchStartIndex = useRef<number | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const updated = [...items];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      onChange(updated);
    },
    [items, onChange],
  );

  // ── Mouse / Pointer Drag ──

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (index: number) => {
      if (dragIndex !== null) {
        reorder(dragIndex, index);
      }
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, reorder],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  // ── Touch Drag ──

  const handleTouchStart = useCallback((index: number, e: React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    touchStartY.current = e.touches[0].clientY;
    touchItemHeight.current = target.getBoundingClientRect().height;
    touchStartIndex.current = index;
    containerRef.current = target.parentElement;
    setDragIndex(index);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartIndex.current === null) return;
    e.preventDefault();

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    const indexOffset = Math.round(diff / (touchItemHeight.current || 50));
    const newIndex = Math.max(
      0,
      Math.min(items.length - 1, touchStartIndex.current + indexOffset),
    );
    setOverIndex(newIndex);
  }, [items.length]);

  const handleTouchEnd = useCallback(() => {
    if (touchStartIndex.current !== null && overIndex !== null) {
      reorder(touchStartIndex.current, overIndex);
    }
    touchStartIndex.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }, [overIndex, reorder]);

  return {
    dragIndex,
    overIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isDragging: dragIndex !== null,
  };
}
