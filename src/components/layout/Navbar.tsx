import { NavLink, Link } from 'react-router-dom';
import styles from './Navbar.module.css';

export function Navbar() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            ₹
          </span>
          <span className={styles.brandText}>Trip Splitter</span>
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          <ul className={styles.navList}>
            <li>
              <NavLink to="/" end className={styles.navLink}>
                Expenses
              </NavLink>
            </li>
            <li>
              <NavLink to="/expenses/new" className={styles.navLink}>
                Add expense
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
