'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { useGameStore } from '@/store/useGameStore';
import { ChevronLeft, Coins, MapPin } from 'lucide-react';

const CHALLENGES = [
  { id: 'tajmahal', name: 'Taj Mahal', entry: 100, win: 200, bgGradient: 'from-slate-300/20 to-slate-500/5', accent: 'text-slate-300' },
  { id: 'jaipur', name: 'Jaipur', entry: 200, win: 400, bgGradient: 'from-pink-500/20 to-rose-500/5', accent: 'text-pink-400' },
  { id: 'gujarat', name: 'Gujarat', entry: 500, win: 1000, bgGradient: 'from-orange-500/20 to-yellow-500/5', accent: 'text-orange-400' },
  { id: 'delhi', name: 'Delhi', entry: 1000, win: 2000, bgGradient: 'from-red-500/20 to-orange-500/5', accent: 'text-red-400' },
  { id: 'goa', name: 'Goa', entry: 2000, win: 4000, bgGradient: 'from-cyan-500/20 to-blue-500/5', accent: 'text-cyan-400' },
  { id: 'chennai', name: 'Chennai', entry: 5000, win: 10000, bgGradient: 'from-amber-500/20 to-red-500/5', accent: 'text-amber-400' },
  { id: 'mumbai', name: 'Mumbai', entry: 10000, win: 20000, bgGradient: 'from-indigo-500/20 to-purple-500/5', accent: 'text-indigo-400' },
];

export default function Challenge() {
  const router = useRouter();
  const coins = useGameStore((state) => state.coins);

  const handleChallenge = (entry: number) => {
    if (coins >= entry) {
      router.push(`/matchmaking?bet=${entry}`);
    } else {
      alert('Not enough coins! Play regular matches to earn more.');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold font-serif tracking-wide">ONLINE CHALLENGE</h1>
        </div>
        <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-2 border border-[#FFC107]/30">
          <Coins className="w-5 h-5 text-[#FFC107]" />
          <span className="font-bold text-[#FFC107]">₹{coins}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pb-8">
        {CHALLENGES.map((challenge, index) => (
          <motion.div
            key={challenge.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard className="p-0 flex flex-col text-center relative overflow-hidden group border-white/10 hover:border-white/30 transition-colors duration-300">
              {/* Background Gradient Design */}
              <div className={`absolute inset-0 bg-gradient-to-br ${challenge.bgGradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
              
              {/* Decorative abstract shapes */}
              <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${challenge.bgGradient} rounded-full blur-3xl opacity-40 group-hover:scale-150 transition-transform duration-700`} />
              <div className={`absolute -left-10 -bottom-10 w-32 h-32 bg-gradient-to-tr ${challenge.bgGradient} rounded-full blur-2xl opacity-30 group-hover:scale-150 transition-transform duration-700`} />
              
              <div className="relative z-10 p-6 flex flex-col items-center gap-3">
                <MapPin className={`w-8 h-8 ${challenge.accent} mb-1 drop-shadow-md`} />
                <h2 className="text-xl font-bold uppercase tracking-wider text-white drop-shadow-md">{challenge.name}</h2>
                
                <div className="flex items-center justify-center gap-6 w-full my-2 bg-black/40 rounded-xl py-3 backdrop-blur-sm border border-white/10">
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-300 uppercase">Entry</span>
                    <span className="font-mono font-bold text-white">₹{challenge.entry}</span>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-300 uppercase">Win</span>
                    <span className="font-mono font-bold text-[#FFC107]">₹{challenge.win}</span>
                  </div>
                </div>

                <GlassButton 
                  size="sm" 
                  variant={coins >= challenge.entry ? 'primary' : 'secondary'}
                  className="w-full mt-2 backdrop-blur-md"
                  onClick={() => handleChallenge(challenge.entry)}
                >
                  PLAY NOW
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
