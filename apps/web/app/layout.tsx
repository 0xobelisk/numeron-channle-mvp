import { Geist, Geist_Mono } from 'next/font/google';

import '@workspace/ui/globals.css';
import { Providers } from '@/app/providers';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata = {
  title: 'Numeron',
  description: 'Catch, train, and battle with blockchain monsters!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased `} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
