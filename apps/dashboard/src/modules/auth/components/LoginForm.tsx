import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import type { LoginResponse } from '@trackflow/shared-types';
import { useAuth } from '../context/useAuth';
import { login } from '@/api/mutations/auth.mutation';
import { loginSchema } from '../utils/validators/login.validator';
import type { LoginFormValues } from '../utils/validators/login.validator';
import { LanguageSwitcher } from './LanguageSwitcher';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const { setSession } = useAuth();
  const { t } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progressActive, setProgressActive] = useState(false);

  const loginDataRef = useRef<LoginResponse | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!isSuccess) return;
    const t1 = setTimeout(() => setProgressActive(true), 50);
    const t2 = setTimeout(() => {
      if (loginDataRef.current) setSession(loginDataRef.current);
    }, 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isSuccess, setSession]);

  async function onSubmit(values: LoginFormValues) {
    try {
      const data = await login(values.email, values.password);
      loginDataRef.current = data;
      setIsSuccess(true);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : t('auth.title'),
      });
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2>{t('auth.title')}</h2>
          <LanguageSwitcher />
        </div>
        <p>{t('auth.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.group}>
          <label className={styles.label}>{t('auth.email')}</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#8ba3c0" strokeWidth="1.8" />
                <polyline points="22,6 12,13 2,6" stroke="#8ba3c0" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <input
              className={styles.input}
              type="email"
              placeholder="manager@company.uz"
              autoComplete="email"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <div className={styles.fieldError}>{t(errors.email.message ?? '')}</div>
          )}
        </div>

        <div className={styles.group}>
          <label className={styles.label}>{t('auth.password')}</label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#8ba3c0" strokeWidth="1.8" />
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="#8ba3c0" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <input
              className={styles.input}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
            />
            <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(v => !v)}>
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="#8ba3c0" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="#8ba3c0" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="1" y1="1" x2="23" y2="23" stroke="#8ba3c0" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#8ba3c0" strokeWidth="1.8" />
                  <circle cx="12" cy="12" r="3" stroke="#8ba3c0" strokeWidth="1.8" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <div className={styles.fieldError}>{t(errors.password.message ?? '')}</div>
          )}
        </div>

        <div className={styles.formRow}>
          <div className={styles.checkLabel} onClick={() => setRememberMe(v => !v)}>
            <div className={`${styles.checkBox}${rememberMe ? ` ${styles.checked}` : ''}`}>
              {rememberMe && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span>{t('auth.rememberMe')}</span>
          </div>
          <button type="button" className={styles.forgotLink}>{t('auth.forgot')}</button>
        </div>

        {errors.root && <div className={styles.error}>{errors.root.message}</div>}

        <button type="submit" className={styles.loginBtn} disabled={isSubmitting}>
          {isSubmitting ? (
            <div className={styles.spinner} />
          ) : (
            <>
              <span>{t('auth.submit')}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </form>

      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>{t('auth.orWith')}</span>
        <div className={styles.dividerLine} />
      </div>

      <button type="button" className={styles.ssoBtn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="9" height="9" rx="1" fill="#4285F4" />
          <rect x="13" y="2" width="9" height="9" rx="1" fill="#34A853" />
          <rect x="2" y="13" width="9" height="9" rx="1" fill="#FBBC05" />
          <rect x="13" y="13" width="9" height="9" rx="1" fill="#EA4335" />
        </svg>
        {t('auth.google')}
      </button>

      <div className={styles.footer}>
        {t('auth.noAccount')} <a href="#">{t('auth.register')}</a>
      </div>

      <div className={styles.sslNote}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#3a5470" strokeWidth="1.8" />
        </svg>
        {t('auth.ssl')}
      </div>

      {isSuccess && (
        <div className={styles.successOverlay}>
          <div className={styles.successIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#00E5A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className={styles.successTitle}>{t('auth.success')}</div>
          <div className={styles.successSub}>{t('auth.loading')}</div>
          <div className={styles.progressTrack}>
            <div className={`${styles.progressBar}${progressActive ? ` ${styles.active}` : ''}`} />
          </div>
        </div>
      )}
    </div>
  );
}
