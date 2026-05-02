import styles from './AnimatedBackground.module.css';

export function AnimatedBackground() {
  return (
    <div className={styles.scene}>
      <div className={styles.grid} />

      <div className={`${styles.road} ${styles.roadH}`} style={{ top: '38%' }} />
      <div className={`${styles.road} ${styles.roadH}`} style={{ top: '56%' }} />
      <div className={`${styles.road} ${styles.roadH}`} style={{ top: '24%' }} />
      <div className={`${styles.road} ${styles.roadH}`} style={{ top: '70%' }} />
      <div className={`${styles.road} ${styles.roadV}`} style={{ left: '22%' }} />
      <div className={`${styles.road} ${styles.roadV}`} style={{ left: '48%' }} />
      <div className={`${styles.road} ${styles.roadV}`} style={{ left: '72%' }} />

      <svg className={styles.routeSvg} viewBox="0 0 1440 900" preserveAspectRatio="none">
        <path
          d="M0 342 Q360 342 480 216 Q600 90 720 216 Q840 342 1440 342"
          stroke="rgba(26,86,219,0.15)" strokeWidth="2" fill="none"
          strokeDasharray="12 8"
          style={{ animation: 'dashMove 2s linear infinite' }}
        />
        <path
          d="M0 504 Q400 504 600 630 Q800 756 1440 504"
          stroke="rgba(0,194,255,0.1)" strokeWidth="2" fill="none"
          strokeDasharray="10 10"
          style={{ animation: 'dashMove 3s linear infinite reverse' }}
        />
        <circle cx="480" cy="216" r="6" fill="rgba(26,86,219,0.5)" />
        <circle cx="480" cy="216" r="12" fill="rgba(26,86,219,0.15)" />
        <circle cx="720" cy="216" r="6" fill="rgba(0,194,255,0.6)" />
        <circle cx="1100" cy="342" r="6" fill="rgba(0,229,160,0.5)" />
        <circle cx="600" cy="630" r="6" fill="rgba(255,184,0,0.5)" />
      </svg>

      <div className={`${styles.car} ${styles.car1}`}>
        <div className={styles.carDot} />
        <div className={styles.carLabel}>01 UZ-123</div>
      </div>
      <div className={`${styles.car} ${styles.car2}`}>
        <div className={styles.carDot} />
        <div className={styles.carLabel}>07 UZ-456</div>
      </div>
      <div className={`${styles.car} ${styles.car3}`}>
        <div className={styles.carDot} />
        <div className={styles.carLabel}>03 UZ-321</div>
      </div>
      <div className={`${styles.car} ${styles.car4}`}>
        <div className={styles.carDot} />
        <div className={styles.carLabel}>12 UZ-888</div>
      </div>

      <div className={`${styles.glow} ${styles.glow1}`} />
      <div className={`${styles.glow} ${styles.glow2}`} />
      <div className={`${styles.glow} ${styles.glow3}`} />
    </div>
  );
}
