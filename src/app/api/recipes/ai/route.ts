import { createClient } from '@/lib/supabase/server';
import { createRecipeAIHandlers } from '@/lib/recipeAIHandler';

export const runtime = 'nodejs';
export const maxDuration = 60;

const handlers = createRecipeAIHandlers({
  getUserId: async () => {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    return error ? null : user?.id || null;
  },
  apiKey: () => process.env.GEMINI_API_KEY,
  model: () => process.env.GEMINI_RECIPE_MODEL,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
