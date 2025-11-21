import { ReactNode } from 'react';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Viewport } from 'next';
import { getSEOTags } from '@/libs/seo';
import ClientLayout from '@/components/LayoutClient';
import config from '@/config';
import './globals.css';

const font = Plus_Jakarta_Sans({ subsets: ['latin'] });

export const viewport: Viewport = {
  // Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
  themeColor: config.colors.main,
  width: 'device-width',
  initialScale: 1,
  // PWA viewport settings
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme={config.colors.theme} className={font.className}>
      <head>
        {/* PWA meta tags */}
        <meta name="application-name" content="Rituals Quest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Rituals Quest" />
        <meta name="description" content="Create, track, and perfect your daily routines" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Manifest and icons */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Apple touch icons */}
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />

        {/* Microsoft tiles */}
        <meta name="msapplication-square70x70logo" content="/icon.png" />
        <meta name="msapplication-square150x150logo" content="/icon.png" />
        <meta name="msapplication-square310x310logo" content="/icon.png" />
        <meta name="msapplication-wide310x150logo" content="/icon.png" />
      </head>
      <body suppressHydrationWarning={true}>
        {/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
