'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { GlassButton } from '@/components/GlassButton';
import { useGameStore } from '@/store/useGameStore';
import { Settings, Users, Cpu, Trophy, Crown, LogIn, LogOut, User } from 'lucide-react';
import Image from 'next/image';
import { signInWithGoogle, logOut } from '@/lib/firebase';
import { CoinIcon } from '@/components/CoinIcon';

export default function Home() {
  const router = useRouter();
  const { coins, user, isAuthReady } = useGameStore();

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 pb-12 relative overflow-hidden">
      {/* Top Bar */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full flex justify-between items-center py-4"
      >
        {user ? (
          <div 
            className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-2 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => router.push('/profile')}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#FFC107]">
              <Image src={user.photoURL || "https://picsum.photos/seed/avatar/100/100"} alt="Avatar" width={32} height={32} referrerPolicy="no-referrer" />
            </div>
            <span className="font-bold text-sm truncate max-w-[100px]">{user.displayName || 'Player'}</span>
            <User className="w-4 h-4 ml-2 text-gray-400" />
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-2 border border-white/10">
            <span className="font-bold text-sm">GUEST</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-2 border border-[#FFC107]/30 shadow-[0_0_10px_rgba(255,193,7,0.2)]">
          <CoinIcon className="w-6 h-6" />
          <span className="font-bold text-[#FFC107]">₹{coins}</span>
        </div>
      </motion.div>

      {/* Center Logo/Art */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="flex-1 flex flex-col items-center justify-center w-full relative"
      >
        <div className="relative w-48 h-48 mb-6">
          <div className="absolute inset-0 bg-[#00FF9C] blur-[60px] opacity-20 rounded-full" />
          <Image 
            src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjPqD2LSEGxrds1mZpjxSl4aH8JDPcgF72qMBbDdU3qW-glTTTzUr8X_QEo_7gw0j-CJUmKRoa496Pa7T3YZ3KKtxOkXtraD7akMgudNi5tgBkDt46jkAVeDuMVBPASQtzQVEuj2Mk9qQy8QHzDt90KYAAQr6aIOVLAPm3N4kSnZAVk4BTb7zYi-J7ZVsFQ/s626/46216.jpg" 
            alt="Chess King" 
            fill 
            className="object-contain drop-shadow-2xl rounded-full"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="text-5xl font-serif font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-lg text-center leading-tight">
          CHESS<br />MASTER
        </h1>
        <p className="text-[#00FF9C] font-mono mt-2 tracking-widest text-sm font-bold">PRO EDITION</p>
      </motion.div>

      {/* Bottom Buttons */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full flex flex-col gap-4 mt-8"
      >
        {!user && isAuthReady && (
           <GlassButton size="lg" variant="secondary" onClick={signInWithGoogle} className="bg-white/5 border-white/20 text-white hover:bg-white/10">
            <LogIn className="w-6 h-6" /> SIGN IN WITH GOOGLE
          </GlassButton>
        )}

        <GlassButton size="lg" variant="primary" onClick={() => router.push('/challenge')}>
          <Trophy className="w-6 h-6" /> ONLINE CHALLENGE
        </GlassButton>
        
        <GlassButton size="lg" variant="primary" onClick={() => router.push('/game?mode=pvc')}>
          <Cpu className="w-6 h-6" /> PLAY VS COMPUTER
        </GlassButton>
        
        <GlassButton size="lg" variant="secondary" onClick={() => router.push('/game?mode=pvp')}>
          <Users className="w-6 h-6" /> 2 PLAYERS
        </GlassButton>
        
        <GlassButton size="lg" variant="secondary" onClick={() => router.push('/settings')}>
          <Settings className="w-6 h-6" /> SETTINGS
        </GlassButton>
      </motion.div>
    </div>
  );
}
