'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Camera, LogOut, Save, User } from 'lucide-react';
import { GlassButton } from '@/components/GlassButton';
import { GlassCard } from '@/components/GlassCard';
import { useGameStore } from '@/store/useGameStore';
import { db, logOut } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useGameStore();
  
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
    } else {
      router.push('/');
    }
  }, [user, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to base64 jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoURL(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: displayName.trim() || 'Player',
        photoURL: photoURL
      }, { merge: true });
      // The store will automatically update via the onSnapshot listener in FirebaseProvider
      router.push('/');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogOut = async () => {
    await logOut();
    router.push('/');
  };

  if (!user) return null;

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
        <h1 className="text-2xl font-serif font-bold tracking-wider">PROFILE</h1>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex-1 flex flex-col items-center max-w-md mx-auto w-full gap-8"
      >
        <GlassCard className="w-full p-8 flex flex-col items-center gap-6">
          {/* Avatar Section */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#FFC107] shadow-[0_0_20px_rgba(255,193,7,0.3)] bg-black/50 flex items-center justify-center">
              {photoURL ? (
                <Image src={photoURL} alt="Profile" width={128} height={128} className="object-cover w-full h-full" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-16 h-16 text-gray-500" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-3 bg-[#00FF9C] rounded-full text-black hover:bg-[#00cc7d] transition-colors shadow-lg"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* Name Edit Section */}
          <div className="w-full space-y-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00FF9C] transition-colors"
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>

          {/* Save Button */}
          <GlassButton 
            size="lg" 
            variant="primary" 
            onClick={handleSave} 
            className="w-full mt-4"
            disabled={isSaving}
          >
            {isSaving ? 'SAVING...' : <><Save className="w-5 h-5" /> SAVE CHANGES</>}
          </GlassButton>
        </GlassCard>

        {/* Logout Button */}
        <GlassButton 
          size="md" 
          variant="secondary" 
          onClick={handleLogOut} 
          className="w-full bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
        >
          <LogOut className="w-5 h-5" /> LOG OUT
        </GlassButton>
      </motion.div>
    </div>
  );
}
