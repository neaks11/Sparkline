import './globals.css';
import type { Metadata } from 'next';

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
      <body>{children}</body>
    </html>
  );
}
