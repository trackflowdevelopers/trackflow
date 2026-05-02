import { useTranslation } from 'react-i18next';
import { setLanguage } from '@/lib/i18n/index';
import styles from './LanguageSwitcher.module.css';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language as 'uz' | 'ru';

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={`${styles.btn}${current === 'uz' ? ` ${styles.active}` : ''}`}
        onClick={() => setLanguage('uz')}
      >
        UZ
      </button>
      <div className={styles.sep} />
      <button
        type="button"
        className={`${styles.btn}${current === 'ru' ? ` ${styles.active}` : ''}`}
        onClick={() => setLanguage('ru')}
      >
        RU
      </button>
    </div>
  );
}
