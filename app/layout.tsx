import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { getUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: 'WordCraft — Language Learning',
  description:
    'Import vocabulary and learn with AI-powered analysis, validation, and spaced repetition.',
};

export const viewport: Viewport = {
  maximumScale: 1,
};

const manrope = Manrope({ subsets: ['latin'] });

// eslint-disable-next-line import/no-default-export
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.className}>
      <body className="min-h-[100dvh] bg-background text-foreground">
        <SWRConfig
          value={{
            fallback: {
              '/api/user': getUser(),
            },
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
