import type { ReactNode } from 'react';
import styles from './Badge.module.css';
import { cx } from './cx';

export type BadgeTone = 'neutral' | 'positive' | 'negative' | 'accent';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return <span className={cx(styles.badge, styles[tone], className)}>{children}</span>;
}
