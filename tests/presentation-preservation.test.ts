import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { presentationIntegrity, textHash } from './helpers/presentationIntegrity';

// Reviewed baseline: new-style commit 2df0c9e. These guards intentionally lock
// this reskin to presentation-only changes. Refresh only alongside a separately
// reviewed functional change, never just to make an unexpected failure pass.
const views: Record<string, [string, string]> = {
  'src/app/dashboard/layout.tsx': ['48aa295897727696a153326e65e9a6db8e33a1f1e0d28aad49aae95eca24cc3c', '6f2754d3953ae0c45b256df5229b3b77fc1ff6e0daeea554429b08ac75590640'],
  'src/app/dashboard/page.tsx': ['8bf4e0c46359866165dc1deeaeda9ac586450d58145d7f9fddadc850870836c1', '0775abea31476d9c49a518d3e18469fd72860ec8d8688a3ac4b337de93d37726'],
  'src/app/dashboard/recipe/[id]/page.tsx': ['670f681477d47a1dd8b1e4f491d69f308e66335314771cc3a3a5b3a3d17858a4', '7b7cfa57e8c8522b2ec3476dca51865526c313677137852ce676d46e7d8435fe'],
  'src/components/layout/Sidebar.tsx': ['b4c898dcfc2fc20fffc60d020f39c4108f3dce5453be7e44326978cd7d91af97', '57d9cf6d6908fe56e8c300b24a47300cfe7e77fecef89bd8eac604aa5df3128f'],
  'src/components/recipes/RecipeForm.tsx': ['cedbb01e897b60dadaec64dfdd8dd54f0bcf66724c46e4a7ded455d33ab190bd', 'efab2e836919927b7dd5404812cc64d991e4274c9452042b70da6d525f504907'],
  'src/app/dashboard/categories/page.tsx': ['e13a7032fb0084dbddc745b0cba21d04f2c5a6b9ff062fdf3ceec73237500fcf', '0db6b6af39cfa1b5008de504378cd4e7075d6a728d5fd9540e065e5064199b59'],
  'src/components/categories/CategoryForm.tsx': ['27df0158fa863337ddadd0dbe25a4b536ec3020aa5579b56a1fb60b894c5c9b7', 'f0fe21f773fd23a2cfa2a217bdd2160b1a79678ae117efd460ccfec49c044471'],
  'src/components/notes/NoteBoard.tsx': ['d150e92b33641882275acde687485a2488a731ccff4e6dec9a313c749e89b62f', '6ebace0b0d14c2646f5feeb7d009147af95ed461e551bcdfbf863fd3bbbabe07'],
  'src/components/notes/NoteEditor.tsx': ['d9877d5205c5015e8ec3dcc7b0a47efb9c4289afb7c18915d5ec9f4cc08d819e', 'a5de7677f31449a198b57b8c342bb5a03cccaa75832474d5254a157db6f1a7df'],
};
for (const [path, [logic, events]] of Object.entries(views)) {
  test(`reskin preserves component logic and event handlers: ${path}`, () => {
    assert.deepEqual(presentationIntegrity(readFileSync(path, 'utf8'), path), { logic, events });
  });
}

const untouched: Record<string, string> = {
  'src/components/special/ChooCelebration.tsx': '3197830f22f0b3517e30167def58ec512a4a4a412adf405a0a0a8488ab0c5932',
  'src/components/providers/AppProvider.tsx': '07c33154a11cdb9fcbff6f6b25a4443a33416ac8df1365c150e17495d24a59c6',
  'src/hooks/useNotes.ts': '72e7addc2380167f0318972c1cb0e2af8fc5d19a43e2740d919e270c267662cf',
  'src/hooks/useAuth.ts': '4dc0850881c4bb9896e02e6f675e8ca94d86500a38d6c74b1b7d3882657e6ba9',
  'src/hooks/useDragReorder.ts': 'd3797a1dbb484236f5f82e6e2abee862bcc3ec48a17ff282d80a2432591ebed5',
  'src/hooks/useWakeLock.ts': '147b31939975bcb9fa97554ecc5b19ce7644043dea09fe0dd721712388e20de2',
  'src/lib/scaleIngredients.ts': 'fb35dd58210fd5023571c4f8bb23923b9a46d79ab19e1e19ef4dd85196fda0c7',
  'src/lib/servings.ts': '7adfe5fcacc5e69ed27188180e7fe426fddc18a2caa30175e8a7201642074360',
  'src/lib/recipeSections.ts': 'c380ab699ee4ab0e5c540bd8f453485ef189308f94f9438b7d8c071a8284ed90',
  'src/lib/recipeAI.ts': 'fa8122dc6dbcbb37260858423099e4677212976e693d26c53dd488ff6242be0c',
  'src/lib/recipeAIHandler.ts': 'f0bc1f95de381d74525328c314254ced5421290eaa733ff0ebedc6cc8eb1d93b',
  'src/proxy.ts': '2e59bd85a85097baa7862a7f12d3e0eca73737c40e6ff3de07b8bd8d084367c7',
};
for (const [path, expected] of Object.entries(untouched)) {
  test(`reskin leaves protected implementation unchanged: ${path}`, () => {
    assert.equal(textHash(readFileSync(path, 'utf8')), expected);
  });
}
