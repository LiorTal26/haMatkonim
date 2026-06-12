'use client';

// ============================================
// Recipe Book — Wake Lock Hook
// Prevents screen from turning off while viewing a recipe
// ============================================

import { useEffect, useRef } from 'react';

/**
 * Requests a screen wake lock to keep the display on.
 * Automatically releases when the component unmounts or the page becomes hidden.
 * Silently does nothing if the Wake Lock API is not supported.
 */
export function useWakeLock(active: boolean = true) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let released = false;

    const requestLock = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      } catch {
        // Wake lock request failed (e.g., low battery, permissions)
      }
    };

    const handleVisibilityChange = async () => {
      if (released) return;
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        await requestLock();
      }
    };

    requestLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [active]);
}
