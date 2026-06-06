'use client';

// ============================================
// Recipe Book — useRecipes Hook
// Thin wrapper around the shared RecipesContext.
// All mutations update the single shared state in DashboardLayout
// so changes are instantly visible everywhere without a re-fetch.
// ============================================

export { useRecipesContext as useRecipes } from '@/app/dashboard/layout';
