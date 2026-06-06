'use client';

// ============================================
// Recipe Book — Categories Hook
// Exposes the shared Categories Context from the layout.
// This allows sidebar, forms, and pages to share the same
// categories state instantly without manual page refreshes.
// ============================================

export { useCategoriesContext as useCategories } from '@/app/dashboard/layout';
