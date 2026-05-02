import { useTranslation } from 'react-i18next';
import styles from './LeftPanel.module.css';

export function LeftPanel() {
  const { t } = useTranslation();

  return (
    <div className={styles.panel}>
      <div className={styles.logo}>
        <svg width="180" height="50" viewBox="0 0 480 120" fill="none">
          <circle cx="32" cy="40" r="9" fill="#1A56DB" fillOpacity="0.2" />
          <circle cx="32" cy="40" r="5" fill="#00C2FF" />
          <path d="M32 49 Q32 80 60 80 Q88 80 88 60" stroke="#00C2FF" strokeWidth="4" strokeLinecap="round" fill="none" strokeOpacity="0.5" />
          <circle cx="88" cy="48" r="13" fill="#1A56DB" />
          <circle cx="88" cy="48" r="6" fill="white" />
          <path d="M88 61 L82 78 Q88 84 94 78 Z" fill="#1A56DB" />
          <text x="110" y="64" fontFamily="Rajdhani, sans-serif" fontSize="52" fontWeight="700" fill="white" letterSpacing="-1">
            Track<tspan fill="#00C2FF">Flow</tspan>
          </text>
        </svg>
      </div>

      <div className={styles.headline}>
        <h1>
          {t('left.headline1')}<br />
          {t('left.headline2')}<br />
          <span>{t('left.headline3')}</span>
        </h1>
        <p>{t('left.description')}</p>
      </div>

      <div className={styles.stats}>
        <div>
          <div className={styles.statValue}>30<span>%</span></div>
          <div className={styles.statLabel}>{t('left.fuel')}</div>
        </div>
        <div>
          <div className={styles.statValue}>200<span>+</span></div>
          <div className={styles.statLabel}>{t('left.companies')}</div>
        </div>
        <div>
          <div className={styles.statValue}>24<span>/7</span></div>
          <div className={styles.statLabel}>{t('left.realtime')}</div>
        </div>
      </div>

      <div className={styles.vehicleStrip}>
        <div className={styles.chip}>
          <div className={styles.chipDot} style={{ background: '#00E5A0' }} />
          <span className={styles.chipText}>18 {t('left.active')}</span>
        </div>
        <div className={styles.chip}>
          <div className={styles.chipDot} style={{ background: '#8ba3c0' }} />
          <span className={styles.chipText}>4 {t('left.stopped')}</span>
        </div>
        <div className={styles.chip}>
          <div className={styles.chipDot} style={{ background: '#FFB800' }} />
          <span className={styles.chipText}>2 {t('left.warning')}</span>
        </div>
        <div className={styles.chip}>
          <div className={styles.chipDot} style={{ background: '#FF4560' }} />
          <span className={styles.chipText}>1 {t('left.repair')}</span>
        </div>
      </div>
    </div>
  );
}
