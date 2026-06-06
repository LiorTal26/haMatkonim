// ============================================
// Recipe Book — TypeScript Type Definitions
// ============================================

// --- Database Types ---

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  book_theme: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

// --- Structured Ingredient ---

export type IngredientUnit =
  | 'piece'     // יחידה (ביצים, לימונים)
  | 'g'         // גרם
  | 'kg'        // קילוגרם
  | 'ml'        // מיליליטר
  | 'l'         // ליטר
  | 'cup'       // כוס
  | 'tbsp'      // כף
  | 'tsp'       // כפית
  | 'pinch'     // קמצוץ
  | 'slice'     // פרוסה
  | 'bunch'     // צרור
  | 'clove'     // שן (שום)
  | 'sprig'     // ענף (צמחי תיבול)
  | 'to_taste'  // לפי הטעם
  | 'custom';   // מותאם אישית

export interface StructuredIngredient {
  quantity: number | null;   // null for "to taste" / "as needed"
  unit: IngredientUnit;
  name: string;
  note?: string;             // "גדולות", "חדר חום", "קצוץ דק"
}

export const INGREDIENT_UNITS: { value: IngredientUnit; labelHe: string; labelEn: string; abbrevHe: string; abbrevEn: string }[] = [
  { value: 'piece',    labelHe: 'יחידה',      labelEn: 'Piece',      abbrevHe: 'יח׳',   abbrevEn: 'pc'   },
  { value: 'g',        labelHe: 'גרם',        labelEn: 'Gram',       abbrevHe: 'גר׳',   abbrevEn: 'g'    },
  { value: 'kg',       labelHe: 'קילוגרם',    labelEn: 'Kilogram',   abbrevHe: 'ק"ג',   abbrevEn: 'kg'   },
  { value: 'ml',       labelHe: 'מיליליטר',   labelEn: 'Milliliter', abbrevHe: 'מ"ל',   abbrevEn: 'ml'   },
  { value: 'l',        labelHe: 'ליטר',       labelEn: 'Liter',      abbrevHe: 'ל׳',    abbrevEn: 'L'    },
  { value: 'cup',      labelHe: 'כוס',        labelEn: 'Cup',        abbrevHe: 'כוס',   abbrevEn: 'cup'  },
  { value: 'tbsp',     labelHe: 'כף',         labelEn: 'Tablespoon', abbrevHe: 'כף',    abbrevEn: 'tbsp' },
  { value: 'tsp',      labelHe: 'כפית',       labelEn: 'Teaspoon',   abbrevHe: 'כפית',  abbrevEn: 'tsp'  },
  { value: 'pinch',    labelHe: 'קמצוץ',      labelEn: 'Pinch',      abbrevHe: 'קמצ׳',  abbrevEn: 'pinch'},
  { value: 'slice',    labelHe: 'פרוסה',      labelEn: 'Slice',      abbrevHe: 'פרוסה', abbrevEn: 'slice'},
  { value: 'bunch',    labelHe: 'צרור',       labelEn: 'Bunch',      abbrevHe: 'צרור',  abbrevEn: 'bunch'},
  { value: 'clove',    labelHe: 'שן',         labelEn: 'Clove',      abbrevHe: 'שן',    abbrevEn: 'clove'},
  { value: 'sprig',    labelHe: 'ענף',        labelEn: 'Sprig',      abbrevHe: 'ענף',   abbrevEn: 'sprig'},
  { value: 'to_taste', labelHe: 'לפי הטעם',   labelEn: 'To taste',   abbrevHe: 'לפי הטעם', abbrevEn: 'to taste' },
  { value: 'custom',   labelHe: 'אחר',        labelEn: 'Other',      abbrevHe: '',       abbrevEn: ''     },
];

export interface Recipe {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  ingredients: StructuredIngredient[];
  instructions: string[];
  image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  difficulty: Difficulty;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
}

export interface RecipeNote {
  id: string;
  user_id: string;
  recipe_id: string;
  content: string;
  note_color: string;
  created_at: string;
  updated_at: string;
}

// --- Form Types ---

export interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
}

export interface RecipeFormData {
  title: string;
  description: string;
  category_id: string;
  ingredients: StructuredIngredient[];
  instructions: string[];
  image_url: string;
  prep_time_minutes: number | string;
  cook_time_minutes: number | string;
  servings: number | string;
  difficulty: Difficulty;
}

export interface NoteFormData {
  content: string;
  note_color: string;
}

// --- Sort & Filter Types ---

export type SortOption = 'newest' | 'oldest' | 'name_az' | 'name_za' | 'fastest' | 'slowest';
export type DifficultyFilter = 'all' | Difficulty;
export type TimeFilter = 'all' | 'under30' | 'under60' | 'over60';

// --- i18n Types ---

export type Locale = 'he' | 'en';

export interface Translations {
  // General
  appName: string;
  search: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  back: string;
  loading: string;
  noResults: string;
  confirm: string;
  close: string;

  // Auth
  login: string;
  register: string;
  email: string;
  password: string;
  displayName: string;
  loginTitle: string;
  registerTitle: string;
  loginSubtitle: string;
  registerSubtitle: string;
  noAccount: string;
  haveAccount: string;
  loginWithGoogle: string;
  logout: string;
  forgotPassword: string;

  // Categories
  categories: string;
  allRecipes: string;
  favorites: string;
  newCategory: string;
  editCategory: string;
  deleteCategory: string;
  categoryName: string;
  categoryNameHebrew: string;
  categoryNameEnglish: string;
  categoryIcon: string;
  categoryColor: string;
  manageCategories: string;
  noCategoriesYet: string;
  addFirstCategory: string;

  // Recipes
  recipes: string;
  newRecipe: string;
  editRecipe: string;
  deleteRecipe: string;
  recipeTitle: string;
  description: string;
  ingredients: string;
  instructions: string;
  addIngredient: string;
  addStep: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  difficulty: string;
  easy: string;
  medium: string;
  hard: string;
  minutes: string;
  favorite: string;
  unfavorite: string;
  noRecipesYet: string;
  addFirstRecipe: string;
  searchRecipes: string;
  uploadImage: string;
  removeImage: string;
  step: string;

  // Ingredient fields
  ingredientName: string;
  ingredientQuantity: string;
  ingredientUnit: string;
  ingredientNote: string;
  ingredientNotePlaceholder: string;

  // Sort & Filter
  sortBy: string;
  newest: string;
  oldest: string;
  nameAZ: string;
  nameZA: string;
  fastestFirst: string;
  slowestFirst: string;
  filterDifficulty: string;
  allDifficulties: string;
  filterTime: string;
  allTimes: string;
  upTo30: string;
  upTo60: string;
  over60: string;
  filters: string;

  // Serving Scaler
  adjustServings: string;
  scalingEnabled: string;
  scalingDisabled: string;
  originalServings: string;
  adjustedIngredients: string;
  resetServings: string;

  // Notes
  myNotes: string;
  addNote: string;
  editNote: string;
  deleteNote: string;
  noteContent: string;
  noteColor: string;
  noNotesYet: string;
  addFirstNote: string;

  // Dashboard
  dashboard: string;
  welcome: string;
  totalRecipes: string;
  totalCategories: string;
  recentRecipes: string;

  // Settings
  settings: string;
  theme: string;
  darkMode: string;
  lightMode: string;
  language: string;
  profile: string;

  // Landing
  heroTitle: string;
  heroSubtitle: string;
  getStarted: string;
  features: string;
  featureOrganize: string;
  featureOrganizeDesc: string;
  featureNotes: string;
  featureNotesDesc: string;
  featureSearch: string;
  featureSearchDesc: string;
}

// --- UI Types ---

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export type NoteColor = '#FFF3CD' | '#FFD6E0' | '#D0E8FF' | '#D4EDDA';

export const NOTE_COLORS: { value: NoteColor; label: string }[] = [
  { value: '#FFF3CD', label: 'Yellow' },
  { value: '#FFD6E0', label: 'Pink' },
  { value: '#D0E8FF', label: 'Blue' },
  { value: '#D4EDDA', label: 'Green' },
];

export const DIFFICULTY_CONFIG: Record<Difficulty, { color: string; emoji: string }> = {
  easy: { color: '#2ECC71', emoji: '🟢' },
  medium: { color: '#F5A623', emoji: '🟡' },
  hard: { color: '#E94560', emoji: '🔴' },
};

export const CATEGORY_EMOJIS = [
  '🍽️', '🍝', '🥗', '🍖', '🍰', '🍲', '🥘', '🍳', '🥧',
  '🍕', '🍔', '🌮', '🍣', '🥙', '🧁', '🍩', '🥞', '☕',
  '🍷', '🥤', '🫕', '🥡', '🧆', '🍜', '🥐', '🫘', '🍗',
];

export const CATEGORY_COLORS = [
  '#E94560', '#F5A623', '#2ECC71', '#53D8FB', '#9B59B6',
  '#1ABC9C', '#E67E22', '#3498DB', '#E74C3C', '#F39C12',
  '#27AE60', '#8E44AD', '#2980B9', '#D35400', '#16A085',
];

// --- Utility: create empty ingredient ---

export function createEmptyIngredient(): StructuredIngredient {
  return { quantity: null, unit: 'piece', name: '', note: '' };
}
