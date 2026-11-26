import { Button } from './Button';
import { cx } from './cx';
import styles from './AlertBanner.module.css';

interface AlertBannerProps {
  message: string;
  tone?: 'success' | 'info';
  onDismiss?: () => void;
}

export function AlertBanner({ message, tone = 'success', onDismiss }: AlertBannerProps) {
  return (
    <div role="status" className={cx(styles.banner, styles[tone])}>
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden="true">
          ✓
        </span>
        <p className={styles.message}>{message}</p>
      </div>
      {onDismiss ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Dismiss notification"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      ) : null}
    </div>
  );
}
