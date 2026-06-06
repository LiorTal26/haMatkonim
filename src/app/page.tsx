'use client';

// ============================================
// Recipe Book — Landing Page
// ============================================

import Link from 'next/link';
import { BookOpen, ChefHat, StickyNote, Search, ArrowRight, Sun, Moon, Globe } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const { t, theme, toggleTheme, locale, setLocale } = useApp();

  const features = [
    {
      icon: <ChefHat size={36} />,
      title: t.featureOrganize,
      desc: t.featureOrganizeDesc,
      emoji: '📂',
    },
    {
      icon: <StickyNote size={36} />,
      title: t.featureNotes,
      desc: t.featureNotesDesc,
      emoji: '📌',
    },
    {
      icon: <Search size={36} />,
      title: t.featureSearch,
      desc: t.featureSearchDesc,
      emoji: '🔍',
    },
  ];

  return (
    <div className="bg-gradient">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="flex items-center gap-2">
          <BookOpen size={24} style={{ color: 'var(--color-primary)' }} />
          <span className="landing-nav-logo">{t.appName}</span>
        </div>
        <div className="landing-nav-actions">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setLocale(locale === 'he' ? 'en' : 'he')}
          >
            <Globe size={18} />
          </button>
          <button className="btn btn-ghost btn-icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/auth/login" className="btn btn-secondary btn-sm">
            {t.login}
          </Link>
          <Link href="/auth/register" className="btn btn-primary btn-sm">
            {t.register}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          {/* Floating book emoji */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '4rem', marginBottom: 'var(--space-6)' }}
          >
            📖
          </motion.div>

          <h1 className="landing-hero-title">
            <span className="gradient-text">{t.heroTitle}</span>
          </h1>

          <p className="landing-hero-subtitle">
            {t.heroSubtitle}
          </p>

          <div className="flex items-center gap-4">
            <Link href="/auth/register" className="btn btn-primary btn-lg">
              {t.getStarted}
              <ArrowRight size={18} />
            </Link>
            <Link href="/auth/login" className="btn btn-secondary btn-lg">
              {t.login}
            </Link>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="landing-features"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              className="landing-feature-card glass-card"
            >
              <div className="landing-feature-icon">{feature.emoji}</div>
              <h3 className="landing-feature-title">{feature.title}</h3>
              <p className="landing-feature-desc">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
