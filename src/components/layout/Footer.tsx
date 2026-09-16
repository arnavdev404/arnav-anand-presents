'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';

export function Footer() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  // Hide on admin and gallery routes (gallery provides its own dedicated layout)
  if (pathname?.startsWith('/admin') || pathname?.includes('/gallery')) {
    return null;
  }
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.name}>Arnav Anand</span>
          <span className={styles.tagline}>A collection of moments, places & memories.</span>
        </div>

        <nav className={styles.links} aria-label="Footer navigation">
          <Link href="/journeys" className={styles.link}>Journeys</Link>
          <Link href="/#glimpses" className={styles.link}>Glimpses</Link>
          <Link href="/#about" className={styles.link}>About</Link>
        </nav>
      </div>
      <div className={styles.bottom}>
        <p className={styles.copy}>© {year} Arnav Anand. All rights reserved.</p>
        <p className={styles.made}>Personal travel memories.</p>
      </div>
    </footer>
  );
}
