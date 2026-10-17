'use client';

import Link from 'next/link';
import { BookOpen, Camera, Check, Clock, FolderHeart, Globe, Moon, NotebookPen, Sun, Users } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';

const copy = {
  he: {
    title: 'כל מה שטעים לכם. בספר אחד.',
    description: 'המתכון של אמא, הרעיון מהמסעדה והעוגה שתמיד מצליחה. מקום משלכם לכל מה שתרצו להכין שוב.',
    action: 'פותחים את ספר המתכונים', existing: 'כבר יש לי חשבון',
    caption: 'הצצה לספר המתכונים שלכם', sample: 'מתכון לדוגמה',
    recipe: 'פסטה ירוקה של סוף היום', recipeDescription: 'בזיליקום טרי, קצת לימון, וארוחת ערב שמרגישה כמו בית.',
    category: 'מהיר וטעים', ingredients: 'מה נכנס לסיר?', ingredientList: ['פסטה שאוהבים', 'חופן בזיליקום טרי', 'שמן זית ולימון', 'פרמזן, בנדיבות'],
    minutes: '20 דקות', servings: '2 מנות', noteTitle: 'יש מתכון בתמונה?', note: 'אפשר לצרף עד 6 תמונות. ה־AI יכין טיוטה שתוכלו לבדוק ולשמור.',
    toolsTitle: 'פחות לחפש. יותר לבשל.',
    tools: [
      { title: 'מצילום למתכון', description: 'מצלמים עמוד או בוחרים כמה תמונות, בודקים את הטיוטה ומוסיפים לספר.' },
      { title: 'כל טעם, במקום שלו', description: 'מארגנים לפי קטגוריות משלכם ושומרים קרוב את המתכונים האהובים.' },
      { title: 'מבשלים כמו שנוח לכם', description: 'מתאימים את מספר המנות, מסמנים מרכיבים ומוסיפים הערות לפעם הבאה.' },
    ],
    footer: 'מתכונים ששומרים. טעמים שחוזרים אליהם.', theme: 'שינוי ערכת נושא', language: 'Switch to English',
  },
  en: {
    title: 'Everything you love to cook. In one book.',
    description: 'Mum’s recipe, that restaurant inspiration, the cake that never fails. A place of your own for everything worth making again.',
    action: 'Start your recipe book', existing: 'I already have an account',
    caption: 'A little look inside your recipe book', sample: 'Example recipe',
    recipe: 'End-of-day green pasta', recipeDescription: 'Fresh basil, a squeeze of lemon, and dinner that feels like home.',
    category: 'Quick & delicious', ingredients: 'What goes in?', ingredientList: ['Your favourite pasta', 'A handful of fresh basil', 'Olive oil and lemon', 'A generous grating of Parmesan'],
    minutes: '20 minutes', servings: '2 servings', noteTitle: 'Recipe in a photo?', note: 'Attach up to 6 photos. AI prepares a draft for you to review and save.',
    toolsTitle: 'Less searching. More cooking.',
    tools: [
      { title: 'From photo to recipe', description: 'Photograph a page or choose a few images, review the draft, then add it to your book.' },
      { title: 'A place for every flavour', description: 'Create your own categories and keep your favourite recipes close at hand.' },
      { title: 'Cook it your way', description: 'Adjust the servings, check off ingredients, and leave notes for next time.' },
    ],
    footer: 'Recipes to keep. Flavours to come back to.', theme: 'Change colour theme', language: 'מעבר לעברית',
  },
};
const toolIcons = [Camera, FolderHeart, NotebookPen];

export default function LandingPage() {
  const { t, theme, toggleTheme, locale, setLocale } = useApp();
  const text = copy[locale];

  return (
    <div className="cookbook-landing">
      <a className="skip-link" href="#main-content">{locale === 'he' ? 'דילוג לתוכן' : 'Skip to content'}</a>
      <header className="cookbook-nav">
        <Link href="/" className="cookbook-brand" aria-label={t.appName}>
          <BookOpen size={28} strokeWidth={1.6} aria-hidden="true" /><span>{t.appName}</span>
        </Link>
        <nav className="cookbook-nav-actions" aria-label={locale === 'he' ? 'ניווט ראשי' : 'Main navigation'}>
          <button type="button" className="btn btn-ghost btn-icon" aria-label={text.language} title={text.language} onClick={() => setLocale(locale === 'he' ? 'en' : 'he')}><Globe size={19} /></button>
          <button type="button" className="btn btn-ghost btn-icon" aria-label={text.theme} title={text.theme} onClick={toggleTheme}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
          <Link href="/auth/login" className="btn btn-secondary">{t.login}</Link>
        </nav>
      </header>

      <main id="main-content">
        <section className="cookbook-hero" aria-labelledby="hero-title">
          <div className="cookbook-intro">
            <h1 id="hero-title">{text.title}</h1><p>{text.description}</p>
            <div className="cookbook-hero-actions">
              <Link href="/auth/register" className="btn btn-primary btn-lg"><BookOpen size={20} aria-hidden="true" />{text.action}</Link>
              <Link href="/auth/login" className="cookbook-text-link">{text.existing}</Link>
            </div>
          </div>
          <figure className="cookbook-showcase">
            <div className="cookbook-spread">
              <div className="cookbook-page cookbook-photo-page">
                <div className="cookbook-photo" role="img" aria-label={locale === 'he' ? 'פסטה עם פסטו ירוק ובזיליקום' : 'Pasta with green pesto and basil'} />
                <span className="cookbook-recipe-category">{text.category}</span><h2>{text.recipe}</h2><p>{text.recipeDescription}</p>
                <div className="cookbook-recipe-meta"><span><Clock size={15} />{text.minutes}</span><span><Users size={15} />{text.servings}</span></div>
              </div>
              <div className="cookbook-page cookbook-ingredients-page">
                <span className="cookbook-sample-label">{text.sample}</span><h3>{text.ingredients}</h3>
                <ul>{text.ingredientList.map(ingredient => <li key={ingredient}><span className="cookbook-check"><Check size={12} /></span>{ingredient}</li>)}</ul>
                <div className="cookbook-note"><Camera size={23} strokeWidth={1.5} /><strong>{text.noteTitle}</strong><p>{text.note}</p></div>
              </div>
            </div>
            <figcaption>{text.caption}</figcaption>
          </figure>
        </section>
        <section className="cookbook-tools" aria-labelledby="tools-title">
          <h2 id="tools-title">{text.toolsTitle}</h2>
          <div className="cookbook-tools-grid">{text.tools.map((tool, index) => {
            const Icon = toolIcons[index];
            return <article className="cookbook-tool" key={tool.title}><Icon size={27} strokeWidth={1.5} aria-hidden="true" /><h3>{tool.title}</h3><p>{tool.description}</p></article>;
          })}</div>
        </section>
      </main>
      <footer className="cookbook-footer"><BookOpen size={19} aria-hidden="true" /><span>{text.footer}</span></footer>
    </div>
  );
}
