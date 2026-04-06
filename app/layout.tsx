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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const theme = localStorage.getItem('sparkline_theme');
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch {}
            })();`,
          }}
        />
      </head>
      <body>
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 md:grid md:grid-cols-[260px_1fr]">
          <aside className="hidden border-r border-slate-800 md:block">
            <AppNav />
          </aside>
          <div className="md:hidden">
            <div className="border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <AppNav mode="topbar" />
            </div>
          </div>
          <div className="min-w-0">{children}</div>
        </div>
      </body>
    </html>
  );
}
