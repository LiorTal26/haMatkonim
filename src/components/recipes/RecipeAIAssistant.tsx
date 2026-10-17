'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Sparkles, X } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { formatIngredient } from '@/lib/scaleIngredients';
import { MAX_RECIPE_IMAGE_BYTES, MAX_RECIPE_PROMPT_LENGTH, validateRecipeDraft, type AIRecipeDraft } from '@/lib/recipeAI';

const copy = {
  he: {
    title: 'מכניסים מתכון בקלות עם AI', intro: 'צלמו מתכון או תארו מה תרצו להכין. ניצור טיוטה שאפשר לערוך לפני השמירה.',
    photo: 'מתכון מתמונה', text: 'יצירה לפי בקשה', camera: 'צילום במצלמה', choose: 'בחירת תמונה',
    photoTip: 'צלמו באור טוב, כך שרשימת המרכיבים וההוראות יהיו חדות ובתוך התמונה.',
    prompt: 'מה תרצו להכין?', placeholder: 'למשל: מתכון מוקפץ אסיאתי צמחוני ל־4 אנשים, עם טופו וברוקולי, עד 30 דקות',
    generatePhoto: 'המרת התמונה למתכון', generateText: 'יצירת טיוטת מתכון', working: 'מכינים את הטיוטה…', preparing: 'מכינים את התמונה…',
    privacy: 'בלחיצה על יצירה, התמונה או הבקשה יישלחו ל־Google Gemini לעיבוד. במסלול החינמי Google עשויה להשתמש בתוכן לשיפור השירות. המתכון יישמר בספר רק לאחר בדיקה ולחיצה על שמירה.',
    unavailable: 'שירות ה־AI עדיין לא הופעל. בינתיים אפשר להוסיף מתכון ידנית בטופס למטה.', checking: 'בודקים זמינות…',
    failed: 'לא הצלחנו להכין טיוטה. נסו שוב.', badPhoto: 'לא ניתן לקרוא את התמונה. בחרו תמונת JPG, PNG או WebP ברורה, עד 20MB.',
    review: 'טיוטה לבדיקה — עדיין לא נשמרה', apply: 'מילוי הטופס עם הטיוטה',
    replace: 'הטופס כבר מכיל תוכן. אני מאשר/ת להחליף את פרטי המתכון בטיוטה הזו.',
    missing: 'לא זוהו כל הפרטים. השלימו כמויות, מספר סועדים ושלבי הכנה לפי הצורך.', remove: 'הסרת התמונה', cancel: 'ביטול',
  },
  en: {
    title: 'Add a recipe easily with AI', intro: 'Photograph a recipe or describe a dish. Get an editable draft to review before saving.',
    photo: 'From a photo', text: 'From a request', camera: 'Take a photo', choose: 'Choose an image',
    photoTip: 'Use good light and include a clear view of both ingredients and instructions.',
    prompt: 'What would you like to cook?', placeholder: 'For example: an Asian vegetarian stir fry for 4, with tofu and broccoli, ready in 30 minutes',
    generatePhoto: 'Read recipe from image', generateText: 'Create a recipe draft', working: 'Preparing your draft…', preparing: 'Preparing the image…',
    privacy: 'Creating a draft sends your image or request to Google Gemini. On the free tier, Google may use this content to improve its services. The recipe is saved only after you review it and press Save.',
    unavailable: 'AI is not configured yet. You can still add a recipe manually below.', checking: 'Checking availability…',
    failed: 'Could not prepare a draft. Please try again.', badPhoto: 'Could not read the image. Choose a clear JPG, PNG or WebP image, up to 20MB.',
    review: 'Review draft — not saved yet', apply: 'Fill the form with this draft',
    replace: 'The form already has content. I agree to replace the recipe details with this draft.',
    missing: 'Some details are missing. Check quantities, servings and instructions before saving.', remove: 'Remove image', cancel: 'Cancel',
  },
};

async function prepareImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type) || file.size > 20 * 1024 * 1024) throw new Error('image');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('image')); image.src = url; });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('image');
    const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('image');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/jpeg', 0.88);
    if ((data.length - data.indexOf(',') - 1) * 0.75 > MAX_RECIPE_IMAGE_BYTES) throw new Error('image');
    return data;
  } finally { URL.revokeObjectURL(url); }
}

interface Props { onApply: (draft: AIRecipeDraft) => void; formHasContent: boolean }

export default function RecipeAIAssistant({ onApply, formHasContent }: Props) {
  const { locale } = useApp();
  const text = copy[locale];
  const [mode, setMode] = useState<'photo' | 'text'>('photo');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [image, setImage] = useState('');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<AIRecipeDraft | null>(null);
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/recipes/ai', { signal: controller.signal, cache: 'no-store' })
      .then(async response => { const data = await response.json(); setAvailable(response.ok && data.available === true); })
      .catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    return () => { controller.abort(); requestRef.current?.abort(); };
  }, []);

  const choosePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(''); setDraft(null); setImage(''); setPreparing(true); setReplaceConfirmed(false);
    try { setImage(await prepareImage(file)); }
    catch { setError(text.badPhoto); }
    finally { setPreparing(false); }
  };

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || preparing || available !== true) return;
    setBusy(true); setError(''); setDraft(null); setReplaceConfirmed(false);
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 55_000);
    try {
      const response = await fetch('/api/recipes/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, locale, ...(mode === 'photo' ? { image } : { prompt }) }), signal: controller.signal });
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
            <button type="button" className="btn btn-secondary" disabled={busy || preparing} onClick={() => cameraRef.current?.click()}><Camera size={18} />{text.camera}</button>
            <button type="button" className="btn btn-secondary" disabled={busy || preparing} onClick={() => imageRef.current?.click()}><ImagePlus size={18} />{text.choose}</button>
          </div>
          <input type="file" ref={cameraRef} accept="image/*" capture="environment" onChange={choosePhoto} hidden />
          <input type="file" ref={imageRef} accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={choosePhoto} hidden />
          <p className="serving-hint">{preparing ? text.preparing : text.photoTip}</p>
          {image && <div className="recipe-ai-photo-preview"><img src={image} alt={locale === 'he' ? 'תמונת המתכון שנבחרה' : 'Selected recipe image'} /><button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => { setImage(''); setDraft(null); }}><X size={16} />{text.remove}</button></div>}
        </> : <div className="input-group"><label className="input-label" htmlFor="ai-recipe-prompt">{text.prompt}</label><textarea id="ai-recipe-prompt" className="input textarea" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={text.placeholder} maxLength={MAX_RECIPE_PROMPT_LENGTH} disabled={busy} required /><span className="serving-hint">{prompt.length} / {MAX_RECIPE_PROMPT_LENGTH}</span></div>}
        <p className="recipe-ai-privacy">{text.privacy}</p>
        <div className="recipe-ai-photo-actions">
          <button type="submit" className="btn btn-primary" disabled={available !== true || busy || preparing || (mode === 'photo' ? !image : !prompt.trim())}>{busy ? <span className="spinner" /> : <Sparkles size={18} />}{busy ? text.working : mode === 'photo' ? text.generatePhoto : text.generateText}</button>
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
