import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scaleIngredients, normalizeIngredient, formatIngredient, formatQuantity, roundCookingQuantity } from '../src/lib/scaleIngredients';
import { createIngredientSection, isIngredientSection, createInstructionSection, getInstructionSection, instructionRows, cleanInstructions } from '../src/lib/recipeSections';
import { parseServingCount } from '../src/lib/servings';
import { CATEGORY_EMOJIS } from '../src/lib/categoryIcons';
import { validateRecipeDraft, type AIRecipeDraft } from '../src/lib/recipeAI';
import { createRecipeAIHandlers } from '../src/lib/recipeAIHandler';

test('scaling doubles quantities, preserves unquantified ingredients and never mutates the source', () => {
  const ingredients = [
    { quantity: 250, unit: 'g' as const, name: 'קמח' },
    { quantity: 0.5, unit: 'cup' as const, name: 'מים' },
    { quantity: null, unit: 'to_taste' as const, name: 'מלח' },
  ];
  const scaled = scaleIngredients(ingredients, 4, 8);
  assert.equal((scaled[0] as { quantity: number }).quantity, 500);
  assert.equal((scaled[1] as { quantity: number }).quantity, 1);
  assert.equal((scaled[2] as { quantity: null }).quantity, null);
  assert.equal(ingredients[0].quantity, 250);
  assert.deepEqual(scaleIngredients(ingredients, 4, 4), ingredients);
});

test('legacy Hebrew, English, fractions and serialized objects can be scaled', () => {
  const source = ['2 כוסות קמח', '1 1/2 cups flour', '1½ כפות שמן', '½ כפית מלח', '0,5 כוס מים', JSON.stringify({ quantity: 2, unit: 'piece', name: 'ביצים' })];
  const result = scaleIngredients(source, 2, 4);
  assert.deepEqual(result.map(item => typeof item === 'string' ? item : item.quantity), [4, 3, 3, 1, 1, 4]);
  assert.equal(formatIngredient(result[0], 'he'), '4 כוס קמח');
});

test('ambiguous quantities and free text are retained', () => {
  for (const ingredient of ['מלח לפי הטעם', '2-3 cups flour', '2 - 3 cups flour', '2 עד 3 כוסות קמח', '2 to 3 cups flour', '1/0 cup sugar', '{broken JSON']) {
    assert.equal(scaleIngredients([ingredient], 2, 4)[0], ingredient);
  }
});

test('invalid serving counts cannot produce NaN or Infinity', () => {
  const ingredients = [{ quantity: 1, unit: 'cup' as const, name: 'water' }];
  for (const value of [0, -2, NaN, Infinity]) {
    assert.deepEqual(scaleIngredients(ingredients, value, 4), ingredients);
    assert.deepEqual(scaleIngredients(ingredients, 4, value), ingredients);
  }
  assert.equal((normalizeIngredient({ quantity: Infinity, unit: 'g', name: 'flour' }) as { quantity: null }).quantity, null);
});

test('small quantities are not rounded down to zero; common fractions remain legible', () => {
  assert.equal(formatQuantity(0.01), '0.01');
  assert.equal(formatQuantity(0.000125), '0.000125');
  assert.equal(formatQuantity(0.5), '½');
  assert.equal(formatQuantity(1.333333), '1⅓');
  assert.equal(formatQuantity(1.99), '1.99');
});

test('category icons include the new food groups and are unique', () => {
  assert.ok(CATEGORY_EMOJIS.length >= 90);
  assert.equal(new Set(CATEGORY_EMOJIS).size, CATEGORY_EMOJIS.length);
  for (const icon of ['🍣', '🍿', '🥢', '🥟', '🍱']) assert.ok(CATEGORY_EMOJIS.includes(icon));
});

test('section headings round-trip through existing JSON ingredients and text instructions', () => {
  const heading = createIngredientSection('לרוטב');
  const normalized = normalizeIngredient(JSON.stringify(heading));
  assert.ok(isIngredientSection(normalized));
  assert.deepEqual(normalized, heading);
  assert.deepEqual(scaleIngredients([heading], 2, 8), [heading]);
  assert.equal(formatIngredient(heading, 'he'), 'לרוטב');
  const title = createInstructionSection('הרכבה ואפייה');
  assert.equal(getInstructionSection(title), 'הרכבה ואפייה');
  assert.equal(getInstructionSection('הוראה ישנה רגילה'), null);
  assert.deepEqual(instructionRows([title, 'ערבבו', createInstructionSection('אפייה'), 'אפו']).map(row => row.number), [null, 1, null, 2]);
  assert.deepEqual(cleanInstructions(['', createInstructionSection('  '), title, 'ערבבו']), [title, 'ערבבו']);
});

test('practical rounding is display-only, unit-aware and never rounds eggs up', () => {
  const flour = { quantity: 166.6666667, unit: 'g' as const, name: 'קמח' };
  assert.equal(roundCookingQuantity(flour.quantity, 'g'), 165);
  assert.equal(roundCookingQuantity(33.333333, 'ml'), 33);
  assert.equal(roundCookingQuantity(0.6666667, 'cup'), 2 / 3);
  assert.equal(roundCookingQuantity(1.5, 'piece'), 1.5);
  assert.equal(roundCookingQuantity(0.012345, 'tsp'), 0.0123);
  assert.ok(roundCookingQuantity(0.000012345, 'g') > 0);
  assert.equal(formatIngredient(flour, 'he', { round: true }), '≈ 165 גר׳ קמח');
  assert.equal(formatIngredient({ ...flour, quantity: 187.5 }, 'he'), '187.5 גר׳ קמח');
  assert.equal(flour.quantity, 166.6666667);
  assert.ok(!formatIngredient(flour, 'he').includes('≈'));
  for (const quantity of [0.00012345, 1.05, 2.25, 10.5, 99.9, 102.5, 166.6667]) {
    assert.ok(Math.abs(roundCookingQuantity(quantity, 'g') - quantity) / quantity <= 0.02);
  }
});

test('serving input accepts replacements but rejects empty, decimal or out-of-range values', () => {
  for (const value of ['', '0', '-1', '2.5', '1001', 'NaN', '1e2']) assert.equal(parseServingCount(value), null);
  assert.equal(parseServingCount('12'), 12);
  assert.equal(parseServingCount('1000'), 1000);
  assert.equal(parseServingCount(' 8 '), 8);
});

const draft: AIRecipeDraft = {
  title: 'פנקייק', description: 'פנקייק פשוט', ingredients: [{ quantity: 1, unit: 'cup', name: 'קמח', note: '' }],
  instructions: ['ערבבו את המרכיבים.', 'טגנו במחבת.'], servings: 4,
  prep_time_minutes: 5, cook_time_minutes: 10, difficulty: 'easy', warnings: [],
};

const providerResult = (value: unknown = draft) => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } }] });
const request = (payload: unknown) => new Request('http://localhost/api/recipes/ai', { method: 'POST', headers: { 'Content-Type': 'application/json', origin: 'http://localhost' }, body: JSON.stringify(payload) });
function handlers(overrides: Partial<Parameters<typeof createRecipeAIHandlers>[0]> = {}) {
  return createRecipeAIHandlers({ getUserId: async () => 'test-user', apiKey: () => 'test-only-key', model: () => undefined, fetch: async () => providerResult(), allowRequest: () => true, ...overrides });
}

test('AI requires authentication before reading uploads or calling the provider', async () => {
  const api = handlers({ getUserId: async () => null, fetch: async () => { throw new Error('Must not call'); } });
  assert.equal((await api.GET()).status, 401);
  assert.equal((await api.POST(request({ mode: 'text', prompt: 'pancakes' }))).status, 401);
});

test('AI availability and configuration errors support manual recipe entry', async () => {
  const api = handlers({ apiKey: () => undefined });
  assert.deepEqual(await (await api.GET()).json(), { available: false });
  assert.equal((await api.POST(request({ mode: 'text', prompt: 'pancakes' }))).status, 503);
});

test('rejects cross-origin requests, invalid input and oversized uploads', async () => {
  const api = handlers({ fetch: async () => { throw new Error('Must not call'); } });
  const crossOrigin = new Request('http://localhost/api/recipes/ai', { method: 'POST', headers: { origin: 'https://elsewhere.example' }, body: '{}' });
  assert.equal((await api.POST(crossOrigin)).status, 403);
  for (const payload of [{}, { mode: 'text', prompt: '' }, { mode: 'text', prompt: 'a'.repeat(3001) }, { mode: 'photo', image: 'https://example.com/image.png' }, { mode: 'photo', image: 'data:image/png;base64,YmFk' }]) {
    assert.equal((await api.POST(request(payload))).status, 400);
  }
  const oversized = new Request('http://localhost/api/recipes/ai', { method: 'POST', headers: { 'Content-Length': String(7 * 1024 * 1024) }, body: '{}' });
  assert.equal((await api.POST(oversized)).status, 413);
});

test('text generation uses a schema and a free-tier model without saving recipes', async () => {
  let body: Record<string, unknown> = {};
  const api = handlers({ fetch: async (url, options) => { assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent'); body = JSON.parse(String(options?.body)); return providerResult(); } });
  const response = await api.POST(request({ mode: 'text', prompt: 'פנקייק לארבעה אנשים', locale: 'he' }));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).draft, draft);
  const config = body.generationConfig as { responseFormat: { text: { mimeType: string; schema: unknown } }; thinkingConfig: unknown };
  assert.equal(config.responseFormat.text.mimeType, 'APPLICATION_JSON');
  assert.ok(config.responseFormat.text.schema);
  assert.deepEqual(config.thinkingConfig, { thinkingLevel: 'MINIMAL' });
});

test('legacy projects can explicitly select Gemini 2.5 with compatible thinking settings', async () => {
  const api = handlers({ model: () => 'gemini-2.5-flash-lite', fetch: async (url, options) => {
    assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent');
    const config = JSON.parse(String(options?.body)).generationConfig;
    assert.equal(config.responseMimeType, 'application/json');
    assert.deepEqual(config.thinkingConfig, { thinkingBudget: 0 });
    return providerResult();
  } });
  assert.equal((await api.POST(request({ mode: 'text', prompt: 'pancakes' }))).status, 200);
});

test('provider quota, authentication and unavailable-model errors are actionable and redacted', async () => {
  for (const [status, code] of [[401, 'configuration'], [403, 'configuration'], [404, 'modelUnavailable'], [429, 'quota']] as const) {
    let calls = 0;
    const api = handlers({ fetch: async () => { calls++; return Response.json({ error: 'private upstream details' }, { status }); } });
    const response = await api.POST(request({ mode: 'text', prompt: 'pancakes', locale: 'en' }));
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.code, code);
    assert.ok(!JSON.stringify(body).includes('private upstream details'));
    assert.equal(calls, 1, 'Never retry against a different or paid model');
  }
});

test('photo import sends the selected image to the vision model', async () => {
  const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF1sAAAAASUVORK5CYII=';
  let sawImage = false;
  const api = handlers({ fetch: async (_url, options) => { const body = JSON.parse(String(options?.body)); sawImage = body.contents[0].parts.some((item: { inline_data?: { mime_type: string; data: string } }) => item.inline_data?.mime_type === 'image/png' && item.inline_data.data === image.split(',')[1]); return providerResult(); } });
  assert.equal((await api.POST(request({ mode: 'photo', image }))).status, 200);
  assert.equal(sawImage, true);
});

test('handles provider failures, refusals and incomplete responses without exposing credentials', async () => {
  for (const provider of [
    () => Response.json({ error: 'sensitive upstream details' }, { status: 401 }),
    () => Response.json({ candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [] } }] }),
    () => Response.json({ promptFeedback: { blockReason: 'SAFETY' } }),
    () => providerResult({ ...draft, ingredients: [] }),
  ]) {
    const response = await handlers({ fetch: async () => provider() }).POST(request({ mode: 'text', prompt: 'pancakes' }));
    assert.ok(response.status >= 400);
    const body = await response.text();
    assert.ok(!body.includes('test-only-key') && !body.includes('sensitive upstream details'));
  }
});

test('rate limits are enforced before calling the provider', async () => {
  const response = await handlers({ allowRequest: () => false, fetch: async () => { throw new Error('Must not call'); } }).POST(request({ mode: 'text', prompt: 'pancakes' }));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '600');
});

test('paid-only models are rejected without contacting a provider', async () => {
  const response = await handlers({ model: () => 'gemini-2.5-pro', fetch: async () => { throw new Error('Must not call'); } }).POST(request({ mode: 'text', prompt: 'pancakes' }));
  assert.equal(response.status, 503);
});

test('floating aliases are rejected and readiness uses the same model allowlist', async () => {
  const api = handlers({ model: () => 'gemini-flash-latest', fetch: async () => { throw new Error('Must not call'); } });
  assert.deepEqual(await (await api.GET()).json(), { available: false });
  assert.equal((await api.POST(request({ mode: 'text', prompt: 'pancakes' }))).status, 503);
});

test('validates model output and preserves unknown quantities for manual review', () => {
  assert.throws(() => validateRecipeDraft({ ...draft, ingredients: [{ quantity: '1 cup', unit: 'cup', name: 'flour', note: '' }] }));
  assert.throws(() => validateRecipeDraft({ ...draft, servings: 0 }));
  const result = validateRecipeDraft({ ...draft, ingredients: [{ quantity: null, unit: 'custom', name: 'מלח', note: 'הכמות אינה קריאה' }], servings: null });
  assert.equal(result.ingredients[0].quantity, null);
  assert.equal(result.servings, null);
});
