import type { Metadata, Viewport } from 'next';
import './globals.css';
import '@/styles/animations.css';
import { ThemeScript } from '@/components/layout/ThemeScript';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    default: 'Arnav Anand Presents',
    template: '%s — Arnav Anand Presents',
  },
  description: 'A collection of moments, places & memories.',
  keywords: ['travel', 'photography', 'memories', 'journeys', 'Arnav Anand'],
  authors: [{ name: 'Arnav Anand' }],
  creator: 'Arnav Anand',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Arnav Anand Presents',
    description: 'A collection of moments, places & memories.',
    type: 'website',
    siteName: 'Arnav Anand Presents',
  },
  robots: {
    index: false, // Private photography site — don't index
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFE7E3' },
    { media: '(prefers-color-scheme: dark)',  color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
