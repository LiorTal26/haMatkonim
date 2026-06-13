'use client';

// ============================================
// Recipe Book — Dashboard Layout + Shared State
// ============================================

import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/components/providers/AppProvider';
import ChooCelebration from '@/components/special/ChooCelebration';
import { Recipe, RecipeFormData, SortOption, DifficultyFilter, TimeFilter, Category, CategoryFormData } from '@/types';

// ─── Recipes Context (single source of truth) ───────────────────────────────

interface RecipesContextType {
  recipes: Recipe[];
  loading: boolean;
  fetchRecipes: () => Promise<void>;
  createRecipe: (data: RecipeFormData) => Promise<Recipe>;
  updateRecipe: (id: string, data: Partial<RecipeFormData>) => Promise<Recipe>;
  deleteRecipe: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  uploadImage: (file: File) => Promise<string>;
}

const RecipesContext = createContext<RecipesContextType>({
  recipes: [],
  loading: true,
  fetchRecipes: async () => {},
  createRecipe: async () => { throw new Error('No provider'); },
  updateRecipe: async () => { throw new Error('No provider'); },
  deleteRecipe: async () => {},
  toggleFavorite: async () => {},
  uploadImage: async () => '',
});

export function useRecipesContext() {
  return useContext(RecipesContext);
}

// ─── Categories Context (single source of truth) ──────────────────────────────

interface CategoriesContextType {
  categories: Category[];
  loading: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (data: CategoryFormData) => Promise<Category>;
  updateCategory: (id: string, data: Partial<CategoryFormData>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextType>({
  categories: [],
  loading: true,
  fetchCategories: async () => {},
  createCategory: async () => { throw new Error('No provider'); },
  updateCategory: async () => { throw new Error('No provider'); },
  deleteCategory: async () => {},
});

export function useCategoriesContext() {
  return useContext(CategoriesContext);
}

// ─── Dashboard UI Context ────────────────────────────────────────────────────

interface DashboardContextType {
  selectedCategoryIds: string[];
  showFavorites: boolean;
  searchQuery: string;
  sortBy: SortOption;
  filterDifficulty: DifficultyFilter;
  filterTime: TimeFilter;
  setSelectedCategoryIds: (ids: string[]) => void;
  toggleCategoryFilter: (id: string) => void;
  setShowFavorites: (fav: boolean) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (sort: SortOption) => void;
  setFilterDifficulty: (d: DifficultyFilter) => void;
  setFilterTime: (t: TimeFilter) => void;
}

const DashboardContext = createContext<DashboardContextType>({
  selectedCategoryIds: [],
  showFavorites: false,
  searchQuery: '',
  sortBy: 'newest',
  filterDifficulty: 'all',
  filterTime: 'all',
  setSelectedCategoryIds: () => {},
  toggleCategoryFilter: () => {},
  setShowFavorites: () => {},
  setSearchQuery: () => {},
  setSortBy: () => {},
  setFilterDifficulty: () => {},
  setFilterTime: () => {},
});

export function useDashboard() {
  return useContext(DashboardContext);
}

// ─── Layout Component ─────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const pathname = usePathname();

  // ── Sidebar / nav state ──
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Dashboard UI state ──
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyFilter>('all');
  const [filterTime, setFilterTime] = useState<TimeFilter>('all');

  const toggleCategoryFilter = useCallback((id: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
    setShowFavorites(false);
  }, []);

  // ── Recipes state (single source of truth) ──
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Categories state (single source of truth) ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipes')
      .select('*, category:categories(*), recipe_categories(category:categories(*))')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Normalize: populate categories[] from recipe_categories join
      const normalized = data.map((r: Recipe) => ({
        ...r,
        categories: r.recipe_categories?.map((rc: { category: Category }) => rc.category).filter(Boolean) || 
                    (r.category ? [r.category] : []),
      }));
      setRecipes(normalized);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
    setCategoriesLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial load
  useEffect(() => {
    fetchRecipes();
    fetchCategories();
  }, [fetchRecipes, fetchCategories]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // ── Recipe CRUD operations — all mutate shared state directly ──

  const createRecipe = useCallback(async (formData: RecipeFormData): Promise<Recipe> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Use first category_id for legacy column
    const primaryCategoryId = formData.category_ids?.[0] || null;

    const { data, error } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description || null,
        category_id: primaryCategoryId,
        ingredients: formData.ingredients.filter(i => (i.name || '').trim()),
        instructions: formData.instructions.filter(i => (i || '').trim()),
        image_url: formData.image_url || null,
        prep_time_minutes: Number(formData.prep_time_minutes) || null,
        cook_time_minutes: Number(formData.cook_time_minutes) || null,
        servings: Number(formData.servings) || null,
        difficulty: formData.difficulty,
      })
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;

    // Insert multi-category links
    if (formData.category_ids?.length) {
      const links = formData.category_ids.map(cid => ({
        recipe_id: data.id,
        category_id: cid,
      }));
      await supabase.from('recipe_categories').insert(links);
    }

    // Fetch full recipe with categories
    const { data: fullRecipe } = await supabase
      .from('recipes')
      .select('*, category:categories(*), recipe_categories(category:categories(*))')
      .eq('id', data.id)
      .single();

    const normalized = fullRecipe ? {
      ...fullRecipe,
      categories: fullRecipe.recipe_categories?.map((rc: { category: Category }) => rc.category).filter(Boolean) || [],
    } : { ...data, categories: [] };

    setRecipes(prev => [normalized, ...prev]);
    return normalized;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRecipe = useCallback(async (id: string, formData: Partial<RecipeFormData>): Promise<Recipe> => {
    const updates: Record<string, unknown> = { ...formData };
    // Remove category_ids from updates (handled separately)
    delete updates.category_ids;
    if (formData.ingredients) {
      updates.ingredients = formData.ingredients.filter(i => (i.name || '').trim());
    }
    if (formData.instructions) {
      updates.instructions = formData.instructions.filter(i => (i || '').trim());
    }
    if (formData.prep_time_minutes !== undefined) {
      updates.prep_time_minutes = Number(formData.prep_time_minutes) || null;
    }
    if (formData.cook_time_minutes !== undefined) {
      updates.cook_time_minutes = Number(formData.cook_time_minutes) || null;
    }
    if (formData.servings !== undefined) {
      updates.servings = Number(formData.servings) || null;
    }

    // Update legacy category_id
    if (formData.category_ids) {
      updates.category_id = formData.category_ids[0] || null;
    }

    const { data, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;

    // Update multi-category links
    if (formData.category_ids) {
      // Remove old links
      await supabase.from('recipe_categories').delete().eq('recipe_id', id);
      // Insert new links
      if (formData.category_ids.length > 0) {
        const links = formData.category_ids.map(cid => ({
          recipe_id: id,
          category_id: cid,
        }));
        await supabase.from('recipe_categories').insert(links);
      }
    }

    // Fetch full recipe with categories
    const { data: fullRecipe } = await supabase
      .from('recipes')
      .select('*, category:categories(*), recipe_categories(category:categories(*))')
      .eq('id', id)
      .single();

    const normalized = fullRecipe ? {
      ...fullRecipe,
      categories: fullRecipe.recipe_categories?.map((rc: { category: Category }) => rc.category).filter(Boolean) || [],
    } : { ...data, categories: [] };

    setRecipes(prev => prev.map(r => (r.id === id ? normalized : r)));
    return normalized;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteRecipe = useCallback(async (id: string) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw error;
    setRecipes(prev => prev.filter(r => r.id !== id)); // optimistic remove
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    // Optimistic update first — flip immediately in UI
    setRecipes(prev =>
      prev.map(r => r.id === id ? { ...r, is_favorite: !r.is_favorite } : r)
    );

    const currentRecipe = recipes.find(r => r.id === id);
    if (!currentRecipe) return;

    const { error } = await supabase
      .from('recipes')
      .update({ is_favorite: !currentRecipe.is_favorite })
      .eq('id', id);

    if (error) {
      // Revert on error
      setRecipes(prev =>
        prev.map(r => r.id === id ? { ...r, is_favorite: currentRecipe.is_favorite } : r)
      );
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes]);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const ext = file.name.split('.').pop();
    const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from('recipe-images').upload(fileName, file);
    if (error) throw error;

    const { data } = supabase.storage.from('recipe-images').getPublicUrl(fileName);
    return data.publicUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Category CRUD operations — all mutate shared state directly ──

  const createCategory = useCallback(async (formData: CategoryFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: formData.name,
        icon: formData.icon,
        color: formData.color,
        sort_order: categories.length,
      })
      .select()
      .single();

    if (error) throw error;
    setCategories(prev => [...prev, data]);
    return data;
  }, [categories.length]);

  const updateCategory = useCallback(async (id: string, formData: Partial<CategoryFormData>) => {
    const { data, error } = await supabase
      .from('categories')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    setCategories(prev => prev.map(c => (c.id === id ? data : c)));
    return data;
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const recipesValue = useMemo(() => ({
    recipes,
    loading,
    fetchRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    uploadImage,
  }), [recipes, loading, fetchRecipes, createRecipe, updateRecipe, deleteRecipe, toggleFavorite, uploadImage]);

  const categoriesValue = useMemo(() => ({
    categories,
    loading: categoriesLoading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }), [categories, categoriesLoading, fetchCategories, createCategory, updateCategory, deleteCategory]);

  const dashboardValue = useMemo(() => ({
    selectedCategoryIds,
    showFavorites,
    searchQuery,
    sortBy,
    filterDifficulty,
    filterTime,
    setSelectedCategoryIds,
    toggleCategoryFilter,
    setShowFavorites,
    setSearchQuery,
    setSortBy,
    setFilterDifficulty,
    setFilterTime,
  }), [selectedCategoryIds, showFavorites, searchQuery, sortBy, filterDifficulty, filterTime, toggleCategoryFilter]);

  const { showChooGreeting, setShowChooGreeting } = useApp();

  // Easter Egg Search Trigger
  useEffect(() => {
    const normalized = searchQuery.toLowerCase().trim();
    if (normalized === 'choo' || normalized === "צ'ו") {
      setSearchQuery('');
      setShowChooGreeting(true);
    }
  }, [searchQuery, setShowChooGreeting]);

  return (
    <RecipesContext.Provider value={recipesValue}>
      <CategoriesContext.Provider value={categoriesValue}>
        <DashboardContext.Provider value={dashboardValue}>
          <div className="dashboard-layout">
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              selectedCategoryIds={selectedCategoryIds}
              onToggleCategory={toggleCategoryFilter}
              onShowFavorites={() => {
                setShowFavorites(true);
                setSelectedCategoryIds([]);
              }}
              showFavorites={showFavorites}
              onShowAll={() => {
                setSelectedCategoryIds([]);
                setShowFavorites(false);
              }}
            />
            <div className="main-content">
              <Header
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
              <div className="dashboard-body">
                {children}
              </div>
            </div>
            <MobileNav />
            {/* Sidebar overlay for mobile */}
            {sidebarOpen && (
              <div
                className="modal-overlay"
                style={{ zIndex: 'var(--z-overlay)' as never, background: 'rgba(0,0,0,0.5)' }}
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <ChooCelebration show={showChooGreeting} onClose={() => setShowChooGreeting(false)} />
          </div>
        </DashboardContext.Provider>
      </CategoriesContext.Provider>
    </RecipesContext.Provider>
  );
}
