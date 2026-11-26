import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import styles from './PageLayout.module.css';

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className={styles.shell}>
      <a
        href="#main-content"
        className={[styles.skipLink, 'visually-hidden'].filter(Boolean).join(' ')}
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        {children}
      </main>
    </div>
  );
}
