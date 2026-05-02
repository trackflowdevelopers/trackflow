import { AnimatedBackground } from '../components/AnimatedBackground';
import { LeftPanel } from '../components/LeftPanel';
import { LoginForm } from '../components/LoginForm';
import styles from './login.page.module.css';

export function LoginPage() {
  return (
    <>
      <AnimatedBackground />
      <div className={styles.layout}>
        <LeftPanel />
        <LoginForm />
      </div>
    </>
  );
}
