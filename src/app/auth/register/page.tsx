'use client';

// ============================================
// Recipe Book — Register Page
// ============================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/components/providers/AppProvider';
import { useToast } from '@/components/providers/ToastProvider';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const { t, locale } = useApp();
  const toast = useToast();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.warning('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      await signUpWithEmail(email, password, displayName);
      setIsSuccess(true);
      toast.success(locale === 'he' ? 'החשבון נוצר בהצלחה! אנא בדקו את תיבת הדואר לאימות.' : 'Account created successfully! Please check your email to verify.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      toast.error(message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        {isSuccess ? (
          <div className="auth-header" style={{ animation: 'fadeIn 0.5s ease', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>✉️</div>
            <h1 className="auth-title">
              {locale === 'he' ? 'אימות חשבון נדרש' : 'Verification Required'}
            </h1>
            <p className="auth-subtitle" style={{ lineHeight: 'var(--leading-relaxed)', margin: 'var(--space-3) 0 var(--space-6)' }}>
              {locale === 'he'
                ? `שלחנו קישור אימות לכתובת: ${email}. אנא כנסו לתיבת המייל שלכם ולחצו על הקישור כדי להפעיל את החשבון.`
                : `We've sent a verification link to: ${email}. Please check your inbox and click the link to activate your account.`}
            </p>
            <Link href="/auth/login" className="btn btn-primary btn-lg w-full" style={{ justifyContent: 'center' }}>
              {t.login}
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <BookOpen size={32} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="auth-logo">{t.appName}</div>
              <h1 className="auth-title">{t.registerTitle}</h1>
              <p className="auth-subtitle">{t.registerSubtitle}</p>
            </div>

            <button
              className="google-btn"
              onClick={handleGoogleLogin}
              type="button"
              id="google-register-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t.loginWithGoogle}
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <form className="auth-form" onSubmit={handleRegister}>
              <div className="input-group">
                <label className="input-label" htmlFor="register-name">{t.displayName}</label>
                <input
                  id="register-name"
                  type="text"
                  className="input"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={t.displayName}
                  required
                  autoComplete="name"
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="register-email">{t.email}</label>
                <input
                  id="register-email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="register-password">{t.password}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      insetInlineEnd: '12px',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={isLoading}
                id="register-submit-btn"
              >
                {isLoading ? <span className="spinner" /> : t.register}
              </button>
            </form>

            <div className="auth-footer">
              {t.haveAccount}{' '}
              <Link href="/auth/login" className="auth-link">
                {t.login}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
