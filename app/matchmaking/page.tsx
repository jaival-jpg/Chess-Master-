'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, setDoc, updateDoc, doc, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useGameStore } from '@/store/useGameStore';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { Loader2, ChevronLeft, AlertCircle } from 'lucide-react';

function MatchmakingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bet = parseInt(searchParams.get('bet') || '0', 10);
  const { user, isAuthReady } = useGameStore();
  const [status, setStatus] = useState<'connecting' | 'searching' | 'found' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState('');
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthReady || !user) return;

    let unsubscribe: () => void;
    let isCancelled = false;

    const findMatch = async () => {
      setStatus('searching');
      try {
        // 1. Look for a waiting game with the same bet
        const gamesRef = collection(db, 'games');
        const q = query(
          gamesRef,
          where('status', '==', 'waiting'),
          where('bet', '==', bet),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Join existing game
          const gameDoc = querySnapshot.docs[0];
          const gameData = gameDoc.data();
          
          if (gameData.players.white !== user.uid) {
            await updateDoc(doc(db, 'games', gameDoc.id), {
              'players.black': user.uid,
              status: 'playing',
              updatedAt: serverTimestamp()
            });
            
            if (!isCancelled) {
              setStatus('found');
              setGameId(gameDoc.id);
              setTimeout(() => {
                router.push(`/game?mode=online&gameId=${gameDoc.id}`);
              }, 1000);
            }
            return;
          }
        }

        // 2. Create a new game
        const newGameRef = doc(collection(db, 'games'));
        await setDoc(newGameRef, {
          id: newGameRef.id,
          status: 'waiting',
          players: {
            white: user.uid,
            black: null
          },
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          history: [],
          bet: bet,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        if (isCancelled) return;
        
        setGameId(newGameRef.id);

        let matchFound = false;

        // 3. Listen for opponent to join
        unsubscribe = onSnapshot(doc(db, 'games', newGameRef.id), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.status === 'playing' && data.players.black) {
              matchFound = true;
              setStatus('found');
              setTimeout(() => {
                router.push(`/game?mode=online&gameId=${newGameRef.id}`);
              }, 1000);
            }
          }
        }, (error) => {
           console.error("Error listening to matchmaking:", error);
           setStatus('error');
           setErrorMsg('Connection error during matchmaking.');
        });

        // 4. Timeout after 10 seconds to play against computer
        setTimeout(async () => {
          if (!isCancelled && !matchFound) {
            isCancelled = true;
            if (unsubscribe) unsubscribe();
            
            // Cancel the online game
            await updateDoc(doc(db, 'games', newGameRef.id), {
              status: 'cancelled',
              updatedAt: serverTimestamp()
            }).catch(console.error);
            
            // Redirect to challenge mode (vs computer)
            router.push(`/game?mode=challenge&bet=${bet}`);
          }
        }, 10000);

      } catch (error) {
        console.error("Matchmaking error:", error);
        if (!isCancelled) {
          setStatus('error');
          setErrorMsg('Failed to find a match. Please try again.');
        }
      }
    };

    findMatch();

    return () => {
      isCancelled = true;
      if (unsubscribe) unsubscribe();
      // Optionally, if we created a game and are still waiting, we could delete it or mark it cancelled
      // but for simplicity, we leave it or let a cloud function clean it up.
    };
  }, [user, isAuthReady, bet, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
      <button 
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <GlassCard className="w-full max-w-sm p-8 flex flex-col items-center text-center">
        {status === 'connecting' && (!isAuthReady || user) && (
          <>
            <Loader2 className="w-12 h-12 text-[#00FF9C] animate-spin mb-4" />
            <h2 className="text-xl font-bold font-serif">Connecting...</h2>
          </>
        )}

        {isAuthReady && !user && (
          <div className="flex flex-col items-center">
            <AlertCircle className="w-16 h-16 text-[#FF4C4C] mb-4" />
            <h2 className="text-xl font-bold font-serif text-[#FF4C4C] mb-2">Error</h2>
            <p className="text-gray-300 mb-6">You must be logged in to play online.</p>
            <GlassButton size="md" variant="primary" onClick={() => router.push('/')}>
              Go Back
            </GlassButton>
          </div>
        )}
        
        {status === 'searching' && (
          <>
            <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-[#00FF9C]/30 rounded-full animate-ping" />
              <div className="absolute inset-2 border-4 border-[#00FF9C]/60 rounded-full animate-pulse" />
              <Loader2 className="w-10 h-10 text-[#00FF9C] animate-spin" />
            </div>
            <h2 className="text-2xl font-bold font-serif mb-2">Finding Opponent</h2>
            <p className="text-gray-400 font-mono text-sm">Bet: ₹{bet}</p>
          </>
        )}

        {status === 'found' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-[#00FF9C]/20 rounded-full flex items-center justify-center mb-4 border-2 border-[#00FF9C]">
              <span className="text-3xl">⚔️</span>
            </div>
            <h2 className="text-2xl font-bold font-serif text-[#00FF9C] mb-2">Match Found!</h2>
            <p className="text-gray-300">Preparing game...</p>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <AlertCircle className="w-16 h-16 text-[#FF4C4C] mb-4" />
            <h2 className="text-xl font-bold font-serif text-[#FF4C4C] mb-2">Error</h2>
            <p className="text-gray-300 mb-6">{errorMsg}</p>
            <GlassButton size="md" variant="primary" onClick={() => router.push('/')}>
              Go Back
            </GlassButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function Matchmaking() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-[#00FF9C] animate-pulse">Loading Matchmaking...</div>}>
      <MatchmakingContent />
    </Suspense>
  );
}
