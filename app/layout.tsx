import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { FirebaseProvider } from '@/components/FirebaseProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Chess Master Pro',
  description: 'A premium chess game with AI, local multiplayer, and coin challenges.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased min-h-screen bg-gradient-to-b from-black via-[#0A1128] to-[#001F3F] text-white overflow-x-hidden selection:bg-[#00FF9C]/30">
        <FirebaseProvider>
          {/* Abstract background texture/overlay */}
          <div className="fixed inset-0 pointer-events-none bg-[url('https://picsum.photos/seed/woodtexture/1920/1080?blur=10')] opacity-5 mix-blend-overlay" />
          <main className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto sm:max-w-xl md:max-w-2xl shadow-2xl bg-black/20 backdrop-blur-sm border-x border-white/5">
            {children}
          </main>
        </FirebaseProvider>
      </body>
    </html>
  );
}
