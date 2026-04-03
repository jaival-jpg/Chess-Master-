'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { useGameStore, BoardTheme, Difficulty } from '@/store/useGameStore';
import { ChevronLeft, Volume2, Vibrate, Globe, Palette, Brain, Ban, CheckCircle2, Loader2 } from 'lucide-react';

const Toggle = ({ label, icon: Icon, checked, onChange }: any) => (
  <div className="flex items-center justify-between py-4 border-b border-white/10 last:border-0">
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-[#00FF9C]" />
      <span className="font-medium">{label}</span>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${
        checked ? 'bg-[#00FF9C]' : 'bg-gray-600'
      }`}
    >
      <motion.div
        animate={{ x: checked ? 24 : 0 }}
        className="w-6 h-6 bg-white rounded-full shadow-md"
      />
    </button>
  </div>
);

const Select = ({ label, icon: Icon, value, options, onChange }: any) => (
  <div className="flex items-center justify-between py-4 border-b border-white/10 last:border-0">
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-[#FFC107]" />
      <span className="font-medium">{label}</span>
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-black/50 border border-white/20 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#00FF9C] text-white"
    >
      {options.map((opt: string) => (
        <option key={opt} value={opt} className="bg-[#0A1128]">
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default function Settings() {
  const router = useRouter();
  const { settings, updateSettings } = useGameStore();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const handlePurchase = () => {
    setIsPurchasing(true);
    // Simulate network request
    setTimeout(() => {
      setIsPurchasing(false);
      setPurchaseSuccess(true);
      updateSettings({ removeAds: true });
      
      // Hide success modal after 2 seconds
      setTimeout(() => {
        setPurchaseSuccess(false);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col p-6 relative">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.push('/')}
          className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold font-serif tracking-wide">SETTINGS</h1>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-1 flex flex-col gap-6"
      >
        <GlassCard className="p-4">
          <Toggle
            label="Sound"
            icon={Volume2}
            checked={settings.sound}
            onChange={(v: boolean) => updateSettings({ sound: v })}
          />
          <Toggle
            label="Vibration"
            icon={Vibrate}
            checked={settings.vibration}
            onChange={(v: boolean) => updateSettings({ vibration: v })}
          />
        </GlassCard>

        <GlassCard className="p-4">
          <Select
            label="Language"
            icon={Globe}
            value={settings.language}
            options={['English', 'Hindi', 'Spanish']}
            onChange={(v: string) => updateSettings({ language: v })}
          />
          <Select
            label="Board Theme"
            icon={Palette}
            value={settings.boardTheme}
            options={['Light', 'Dark', 'Wooden']}
            onChange={(v: BoardTheme) => updateSettings({ boardTheme: v })}
          />
          <Select
            label="Difficulty"
            icon={Brain}
            value={settings.difficulty}
            options={['Easy', 'Medium', 'Hard']}
            onChange={(v: Difficulty) => updateSettings({ difficulty: v })}
          />
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Ban className="w-5 h-5 text-[#FF4C4C]" />
              <div>
                <span className="font-medium block">Remove Ads</span>
                <span className="text-xs text-gray-400">One-time purchase</span>
              </div>
            </div>
            <GlassButton 
              size="sm" 
              variant="primary"
              onClick={handlePurchase}
              disabled={settings.removeAds || isPurchasing}
            >
              {isPurchasing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : settings.removeAds ? (
                'PURCHASED'
              ) : (
                '₹280'
              )}
            </GlassButton>
          </div>
        </GlassCard>
      </motion.div>

      {/* Purchase Success Modal */}
      <AnimatePresence>
        {purchaseSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <GlassCard className="w-full max-w-sm p-8 flex flex-col items-center text-center border-[#00FF9C]/50 shadow-[0_0_50px_rgba(0,255,156,0.2)]">
              <CheckCircle2 className="w-16 h-16 text-[#00FF9C] mb-4" />
              <h2 className="text-2xl font-bold mb-2">Purchase Successful!</h2>
              <p className="text-gray-300">Ads have been removed from your game.</p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
