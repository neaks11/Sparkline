import './globals.css';
import type { Metadata } from 'next';
import { AppNav } from '@/components/app-nav';

export const metadata: Metadata = {
  title: 'Sparkline | Lead Generation MVP',
  description: 'Find better leads. Reach out smarter.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppNav />
        {children}
      </body>
    </html>
  );
}
