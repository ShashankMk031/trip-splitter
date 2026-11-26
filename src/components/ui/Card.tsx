import type { ReactNode } from 'react';
import styles from './Card.module.css';
import { cx } from './cx';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return <div className={cx(styles.card, styles[padding], className)}>{children}</div>;
}
