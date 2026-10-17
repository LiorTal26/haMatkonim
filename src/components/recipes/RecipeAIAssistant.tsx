'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Camera, ImagePlus, Sparkles, X } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { formatIngredient } from '@/lib/scaleIngredients';
import { MAX_RECIPE_IMAGES, MAX_RECIPE_TOTAL_IMAGE_BYTES, MAX_RECIPE_PROMPT_LENGTH, recipeImageBytes, validateRecipeDraft, type AIRecipeDraft } from '@/lib/recipeAI';

const copy = {
  he: {
    title: 'מכניסים מתכון בקלות עם AI', intro: 'צלמו מתכון או תארו מה תרצו להכין. ניצור טיוטה שאפשר לערוך לפני השמירה.',
    photo: 'מתכון מתמונות', text: 'יצירה לפי בקשה', camera: 'הוספת צילום', choose: 'בחירת תמונות',
    photoTip: `אפשר לצרף עד ${MAX_RECIPE_IMAGES} תמונות של אותו מתכון, יחד או בהדרגה. סדרו אותן לפי סדר העמודים וצלמו באור טוב.`,
    selected: 'תמונות שנבחרו', page: 'תמונה', earlier: 'הקדמת תמונה', later: 'העברת תמונה להמשך', clear: 'הסרת כל התמונות',
    tooMany: `אפשר לצרף עד ${MAX_RECIPE_IMAGES} תמונות. הסירו תמונה לפני הוספת תמונות נוספות.`,
    prompt: 'מה תרצו להכין?', placeholder: 'למשל: מתכון מוקפץ אסיאתי צמחוני ל־4 אנשים, עם טופו וברוקולי, עד 30 דקות',
    generatePhoto: 'המרת התמונות למתכון אחד', generateText: 'יצירת טיוטת מתכון', working: 'מכינים את הטיוטה…', preparing: 'מכינים את התמונות…',
    privacy: 'בלחיצה על יצירה, כל התמונות שנבחרו או הבקשה יישלחו ל־Google Gemini לעיבוד. במסלול החינמי Google עשויה להשתמש בתוכן לשיפור השירות. המתכון יישמר בספר רק לאחר בדיקה ולחיצה על שמירה.',
    unavailable: 'שירות ה־AI עדיין לא הופעל. בינתיים אפשר להוסיף מתכון ידנית בטופס למטה.', checking: 'בודקים זמינות…',
    failed: 'לא הצלחנו להכין טיוטה. נסו שוב.', badPhoto: 'אחת התמונות אינה נתמכת או גדולה מדי. בחרו תמונות JPG, PNG או WebP ברורות, עד 20MB לכל תמונה. התמונות הקודמות נשמרו.',
    review: 'טיוטה לבדיקה — עדיין לא נשמרה', apply: 'מילוי הטופס עם הטיוטה',
    replace: 'הטופס כבר מכיל תוכן. אני מאשר/ת להחליף את פרטי המתכון בטיוטה הזו.',
    missing: 'לא זוהו כל הפרטים. השלימו כמויות, מספר סועדים ושלבי הכנה לפי הצורך.', remove: 'הסרת התמונה', cancel: 'ביטול',
  },
  en: {
    title: 'Add a recipe easily with AI', intro: 'Photograph a recipe or describe a dish. Get an editable draft to review before saving.',
    photo: 'From photos', text: 'From a request', camera: 'Add a photo', choose: 'Choose images',
    photoTip: `Add up to ${MAX_RECIPE_IMAGES} photos of the same recipe, together or one at a time. Arrange them in page order and use good light.`,
    selected: 'Selected images', page: 'Image', earlier: 'Move image earlier', later: 'Move image later', clear: 'Remove all images',
    tooMany: `You can attach up to ${MAX_RECIPE_IMAGES} images. Remove an image before adding more.`,
    prompt: 'What would you like to cook?', placeholder: 'For example: an Asian vegetarian stir fry for 4, with tofu and broccoli, ready in 30 minutes',
    generatePhoto: 'Read one recipe from all images', generateText: 'Create a recipe draft', working: 'Preparing your draft…', preparing: 'Preparing images…',
    privacy: 'Creating a draft sends all selected images or your request to Google Gemini. On the free tier, Google may use this content to improve its services. The recipe is saved only after you review it and press Save.',
    unavailable: 'AI is not configured yet. You can still add a recipe manually below.', checking: 'Checking availability…',
    failed: 'Could not prepare a draft. Please try again.', badPhoto: 'An image is unsupported or too large. Choose clear JPG, PNG or WebP images, up to 20MB each. Your previous selection was kept.',
    review: 'Review draft — not saved yet', apply: 'Fill the form with this draft',
    replace: 'The form already has content. I agree to replace the recipe details with this draft.',
    missing: 'Some details are missing. Check quantities, servings and instructions before saving.', remove: 'Remove image', cancel: 'Cancel',
  },
};

async function prepareImage(file: File, budget: number): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type) || file.size > 20 * 1024 * 1024) throw new Error('image');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('image')); image.src = url; });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('image');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('image');
    for (const [edge, quality] of [[2000, 0.88], [1800, 0.82], [1600, 0.76], [1400, 0.7]]) {
      const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', quality);
      const size = recipeImageBytes(data);
      if (size !== null && size <= budget) return data;
    }
    throw new Error('image');
  } finally { URL.revokeObjectURL(url); }
}

interface Props { onApply: (draft: AIRecipeDraft) => void; formHasContent: boolean }
interface RecipePhoto { id: string; file: File; data: string }

export default function RecipeAIAssistant({ onApply, formHasContent }: Props) {
  const { locale } = useApp();
  const text = copy[locale];
  const [mode, setMode] = useState<'photo' | 'text'>('photo');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<RecipePhoto[]>([]);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<AIRecipeDraft | null>(null);
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const preparingRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/recipes/ai', { signal: controller.signal, cache: 'no-store' })
      .then(async response => { const data = await response.json(); setAvailable(response.ok && data.available === true); })
      .catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    return () => { controller.abort(); requestRef.current?.abort(); };
  }, []);

  const choosePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || busy || preparingRef.current) return;
    if (photos.length + files.length > MAX_RECIPE_IMAGES) { setError(text.tooMany); return; }
    preparingRef.current = true;
    setError(''); setPreparing(true);
    const next = [...photos, ...files.map(file => ({ id: crypto.randomUUID(), file, data: '' }))];
    const budget = Math.floor(MAX_RECIPE_TOTAL_IMAGE_BYTES / next.length);
    setProgress({ done: 0, total: next.length });
    try {
      const prepared: RecipePhoto[] = [];
      // Decode sequentially to avoid holding several full-resolution photos in memory.
      for (const photo of next) {
        const size = recipeImageBytes(photo.data);
        const data = size !== null && size <= budget ? photo.data : await prepareImage(photo.file, budget);
        prepared.push({ ...photo, data });
        setProgress({ done: prepared.length, total: next.length });
      }
      setPhotos(prepared); setDraft(null); setReplaceConfirmed(false);
    }
    catch { setError(text.badPhoto); }
    finally { preparingRef.current = false; setPreparing(false); }
  };

  const removePhoto = (id: string) => {
    setPhotos(previous => previous.filter(photo => photo.id !== id));
    setDraft(null); setError(''); setReplaceConfirmed(false);
  };

  const movePhoto = (id: string, direction: -1 | 1) => {
    setPhotos(previous => {
      const index = previous.findIndex(photo => photo.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= previous.length) return previous;
      const updated = [...previous];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
    setDraft(null); setReplaceConfirmed(false);
  };

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || preparing || available !== true) return;
    setBusy(true); setError(''); setDraft(null); setReplaceConfirmed(false);
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 55_000);
    try {
      const response = await fetch('/api/recipes/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, locale, ...(mode === 'photo' ? { images: photos.map(photo => photo.data) } : { prompt }) }), signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : text.failed);
      setDraft(validateRecipeDraft(data.draft));
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : text.failed);
      else if (requestRef.current === controller) setError(text.failed);
    } finally { clearTimeout(timeout); setBusy(false); requestRef.current = null; }
  };

  return (
    <section className="recipe-ai-panel" aria-labelledby="recipe-ai-title">
      <div className="recipe-ai-heading"><Sparkles size={22} /><h2 id="recipe-ai-title">{text.title}</h2></div>
      <p className="serving-hint">{text.intro}</p>
      <div className="recipe-ai-modes">
        {(['photo', 'text'] as const).map(value => <button key={value} type="button" className={`btn ${mode === value ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={mode === value} disabled={busy || preparing} onClick={() => { setMode(value); setDraft(null); setError(''); }}>{value === 'photo' ? <Camera size={18} /> : <Sparkles size={18} />}{text[value]}</button>)}
      </div>
      {available !== true && <p role="status" className="recipe-ai-notice">{available === null ? text.checking : text.unavailable}</p>}
      <form onSubmit={generate} className="recipe-ai-inputs">
        {mode === 'photo' ? <>
          <div className="recipe-ai-photo-actions">
            <button type="button" className="btn btn-secondary" disabled={busy || preparing || photos.length >= MAX_RECIPE_IMAGES} onClick={() => cameraRef.current?.click()}><Camera size={18} />{text.camera}</button>
            <button type="button" className="btn btn-secondary" disabled={busy || preparing || photos.length >= MAX_RECIPE_IMAGES} onClick={() => imageRef.current?.click()}><ImagePlus size={18} />{text.choose}</button>
          </div>
          <input type="file" ref={cameraRef} accept="image/*" capture="environment" onChange={choosePhoto} hidden />
          <input type="file" ref={imageRef} accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple onChange={choosePhoto} hidden />
          <p className="serving-hint" role="status">{preparing ? `${text.preparing} ${progress.done}/${progress.total}` : `${text.selected}: ${photos.length}/${MAX_RECIPE_IMAGES}`}</p>
          <p className="serving-hint">{text.photoTip}</p>
          {photos.length > 0 && <>
            <ol className="recipe-ai-photos" aria-label={text.selected}>{photos.map((photo, index) => <li key={photo.id} className="recipe-ai-photo-preview">
              <figure><img src={photo.data} alt={`${text.page} ${index + 1}`} /><figcaption><strong>{text.page} {index + 1}</strong><span>{photo.file.name}</span></figcaption></figure>
              <div className="recipe-ai-photo-controls">
                <button type="button" className="btn btn-secondary btn-icon" disabled={busy || preparing || index === 0} aria-label={`${text.earlier} ${index + 1}`} onClick={() => movePhoto(photo.id, -1)}><ArrowUp size={16} /></button>
                <button type="button" className="btn btn-secondary btn-icon" disabled={busy || preparing || index === photos.length - 1} aria-label={`${text.later} ${index + 1}`} onClick={() => movePhoto(photo.id, 1)}><ArrowDown size={16} /></button>
                <button type="button" className="btn btn-secondary btn-icon" disabled={busy || preparing} aria-label={`${text.remove} ${index + 1}`} onClick={() => removePhoto(photo.id)}><X size={16} /></button>
              </div>
            </li>)}</ol>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy || preparing} onClick={() => { setPhotos([]); setDraft(null); setError(''); setReplaceConfirmed(false); }}>{text.clear}</button>
          </>}
        </> : <div className="input-group"><label className="input-label" htmlFor="ai-recipe-prompt">{text.prompt}</label><textarea id="ai-recipe-prompt" className="input textarea" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={text.placeholder} maxLength={MAX_RECIPE_PROMPT_LENGTH} disabled={busy} required /><span className="serving-hint">{prompt.length} / {MAX_RECIPE_PROMPT_LENGTH}</span></div>}
        <p className="recipe-ai-privacy">{text.privacy}</p>
        <div className="recipe-ai-photo-actions">
          <button type="submit" className="btn btn-primary" disabled={available !== true || busy || preparing || (mode === 'photo' ? !photos.length : !prompt.trim())}>{busy ? <span className="spinner" /> : <Sparkles size={18} />}{busy ? text.working : mode === 'photo' ? text.generatePhoto : text.generateText}</button>
          {busy && <button type="button" className="btn btn-ghost" onClick={() => { requestRef.current?.abort(); requestRef.current = null; }}>{text.cancel}</button>}
        </div>
      </form>
      {error && <p role="alert" className="recipe-ai-error">{error}</p>}
      {draft && <div className="recipe-ai-draft" aria-live="polite">
        <span className="badge badge-warning">{text.review}</span><h3>{draft.title}</h3>
        {draft.description && <p className="serving-hint">{draft.description}</p>}
        <ul className="recipe-ai-draft-list">{draft.ingredients.map((ingredient, index) => <li key={index}>{formatIngredient(ingredient, locale)}</li>)}</ul>
        <ol className="recipe-ai-draft-list">{draft.instructions.map((step, index) => <li key={index}>{step}</li>)}</ol>
        {(draft.servings === null || !draft.instructions.length || draft.ingredients.some(ingredient => ingredient.quantity === null && ingredient.unit !== 'to_taste')) && <p className="recipe-ai-notice">{text.missing}</p>}
        {draft.warnings.length > 0 && <ul className="recipe-ai-notice recipe-ai-draft-list">{draft.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul>}
        {formHasContent && <label className="recipe-ai-confirm"><input type="checkbox" checked={replaceConfirmed} onChange={e => setReplaceConfirmed(e.target.checked)} />{text.replace}</label>}
        <button type="button" className="btn btn-primary" disabled={formHasContent && !replaceConfirmed} onClick={() => { onApply(draft); setDraft(null); }}>{text.apply}</button>
      </div>}
    </section>
  );
}
