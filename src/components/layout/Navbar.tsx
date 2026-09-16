'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import styles from './Navbar.module.css';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/journeys', label: 'Journeys' },
  { href: '/#glimpses', label: 'Glimpses' },
  { href: '/#about', label: 'About' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle, mounted } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Hide on admin and gallery pages (gallery has its own dedicated top navigation)
  const isAdmin = pathname?.startsWith('/admin');
  const isGallery = pathname?.includes('/gallery');

  if (isAdmin || isGallery) return null;

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === '/') {
      if (pathname === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (href === '/journeys') {
      if (pathname === '/') {
        const el = document.getElementById('journeys');
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      if (pathname === '/') {
        const el = document.getElementById(targetId);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  const isDark = mounted ? theme === 'dark' : false;

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`} role="banner">
      <nav className={styles.navInner} aria-label="Primary navigation">
        {/* Logo */}
        <Link
          href="/"
          className={styles.logo}
          aria-label="Arnav Anand Presents — Home"
          onClick={(e) => handleNavClick(e, '/')}
        >
          <span className={styles.logoName}>Arnav Anand</span>
          <span className={styles.logoTagline}>Presents</span>
        </Link>

        {/* Desktop links */}
        <ul className={styles.navLinks} role="list">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.navLink} ${pathname === href ? styles.active : ''}`}
                onClick={(e) => handleNavClick(e, href)}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Controls */}
        <div className={styles.navControls}>
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggle}
            className={styles.themeToggle}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>

          {/* Hamburger */}
          <button
            type="button"
            className={`${styles.hamburger} ${mobileOpen ? styles.open : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        ref={mobileMenuRef}
        className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <ul className={styles.mobileLinks} role="list">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={styles.mobileLink}
                onClick={(e) => {
                  setMobileOpen(false);
                  handleNavClick(e, href);
                }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className={styles.mobileDivider} />
        <p className={styles.mobileTagline}>A collection of moments, places & memories.</p>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
