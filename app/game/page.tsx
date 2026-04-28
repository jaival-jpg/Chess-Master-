'use client';

import { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const Chessboard = dynamic(() => import('react-chessboard').then(mod => mod.Chessboard), { ssr: false });
import { Chess } from 'chess.js';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import Image from 'next/image';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { useGameStore } from '@/store/useGameStore';
import { ChevronLeft, RotateCcw, Undo2, Lightbulb, FlipVertical, MoreVertical, Trophy, Coins } from 'lucide-react';
import { SoundManager } from '@/lib/sounds';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { useChessEngine } from '@/hooks/useChessEngine';

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') || 'pvc'; // pvc, pvp, challenge, online
  const bet = parseInt(searchParams.get('bet') || '0', 10);
  const gameId = searchParams.get('gameId');
  
  const { user, settings, coins, addCoins, removeCoins } = useGameStore();
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  
  const handleEngineMove = useCallback((move: any) => {
    if (settings.sound) {
      if (move.flags.includes('c') || move.flags.includes('e')) {
        SoundManager.playCapture();
      } else {
        SoundManager.playMove();
      }
    }
  }, [settings.sound]);

  const { game, makeMove, undo, reset, loadFen, getBestMove, isEngineReady, engineThinking } = useChessEngine(
    mode === 'challenge' ? 'Easy' : settings.difficulty,
    handleEngineMove
  );
  
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [hintMove, setHintMove] = useState<{ from: string; to: string } | null>(null);
  const hasProcessedGameOver = useRef(false);

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<any[]>([]);

  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [challengeOpponent, setChallengeOpponent] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mode === 'challenge') {
      const timer = setTimeout(() => {
        const names = ['Rocky', 'Rahul', 'shakshi', 'dhurandar', 'Abhijeet', 'Riya', 'Rudra'];
        const randomName = names[Math.floor(Math.random() * names.length)];
        setChallengeOpponent(randomName);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  useEffect(() => {
    if (!isMounted || !containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    
    observer.observe(containerRef.current);
    
    // Initial check
    if (containerRef.current.offsetWidth > 0) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    
    return () => observer.disconnect();
  }, [isMounted]);

  // Online game sync
  useEffect(() => {
    if (mode !== 'online' || !gameId || !user) return;

    const unsubscribe = onSnapshot(doc(db, 'games', gameId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Determine player color
        if (data.players.white === user.uid) {
          setPlayerColor('w');
          setBoardOrientation('white');
        } else if (data.players.black === user.uid) {
          setPlayerColor('b');
          setBoardOrientation('black');
        }

        // Sync FEN
        if (data.fen && data.fen !== game.fen()) {
          loadFen(data.fen);
          if (settings.sound && data.status === 'playing') {
            SoundManager.playMove();
          }
        }
      }
    }, (error) => {
      console.error("Error syncing game:", error);
    });

    return () => unsubscribe();
  }, [mode, gameId, user, game, loadFen, settings.sound]);

  // Derived Game Over State
  const isGameOver = game.isGameOver();
  let reason = '';
  let winner = null;
  
  if (isGameOver) {
    if (game.isCheckmate()) {
      reason = 'Checkmate';
      winner = game.turn() === 'w' ? 'Black' : 'White';
    } else if (game.isDraw()) {
      reason = 'Draw';
    } else if (game.isStalemate()) {
      reason = 'Stalemate';
    } else if (game.isThreefoldRepetition()) {
      reason = 'Repetition';
    } else if (game.isInsufficientMaterial()) {
      reason = 'Insufficient Material';
    }
  }

  // Handle AI move
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if ((mode === 'pvc' || mode === 'challenge') && game.turn() !== playerColor && !isGameOver) {
      if (isEngineReady) {
        getBestMove();
      } else {
        // Fallback to random move if engine not ready
        const possibleMoves = game.moves({ verbose: true });
        if (possibleMoves.length > 0) {
          const randomIndex = Math.floor(Math.random() * possibleMoves.length);
          const move = possibleMoves[randomIndex];
          timeoutId = setTimeout(() => {
            makeMove({ from: move.from, to: move.to, promotion: 'q' });
          }, 1000);
        }
      }
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [game, mode, isEngineReady, getBestMove, makeMove, isGameOver, playerColor]);

  // Handle Game Over Side Effects
  useEffect(() => {
    if (isGameOver && !hasProcessedGameOver.current) {
      hasProcessedGameOver.current = true;

      const isWinner = (winner === 'White' && playerColor === 'w') || (winner === 'Black' && playerColor === 'b');
      const isLoser = (winner === 'White' && playerColor === 'b') || (winner === 'Black' && playerColor === 'w');

      if (mode === 'challenge') {
        if (isWinner) {
          if (settings.sound) SoundManager.playWin();
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          addCoins(bet);
        } else if (isLoser) {
          if (settings.sound) SoundManager.playLose();
          removeCoins(bet);
        }
      } else if (mode === 'online') {
        if (isWinner) {
          if (settings.sound) SoundManager.playWin();
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          addCoins(bet);
        } else if (isLoser) {
          if (settings.sound) SoundManager.playLose();
          removeCoins(bet);
        }
        
        if (gameId) {
          updateDoc(doc(db, 'games', gameId), {
            status: 'finished',
            winner: winner || 'draw',
            updatedAt: serverTimestamp()
          }).catch(console.error);
        }
      } else if (winner) {
        if (isWinner) {
          if (settings.sound) SoundManager.playWin();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else if (isLoser) {
          if (settings.sound) SoundManager.playLose();
        }
      }
    }
  }, [isGameOver, winner, mode, bet, addCoins, removeCoins, settings.sound, playerColor, gameId]);

  function onSquareClick({ square }: { piece: any, square: string }) {
    if (isGameOver) return;
    if ((mode === 'pvc' || mode === 'challenge') && game.turn() !== playerColor) return; // Wait for AI
    if (mode === 'online' && game.turn() !== playerColor) return; // Not your turn

    // Check if the clicked square is a valid move for the currently selected piece
    if (selectedSquare) {
      const move = validMoves.find((m) => m.to === square);
      if (move) {
        const moveResult = makeMove({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });

        if (moveResult) {
          setSelectedSquare(null);
          setValidMoves([]);
          setHintMove(null);
          
          if (settings.sound) {
            if (moveResult.flags.includes('c') || moveResult.flags.includes('e')) {
              SoundManager.playCapture();
            } else {
              SoundManager.playMove();
            }
          }
          if (settings.vibration && navigator.vibrate) {
            navigator.vibrate(50);
          }
          
          if (mode === 'online' && gameId) {
            updateDoc(doc(db, 'games', gameId), {
              fen: game.fen(),
              history: game.history(),
              updatedAt: serverTimestamp()
            }).catch(console.error);
          }
          return;
        }
      }
    }

    // If no valid move was made, check if the clicked square has a piece of the current player
    const piece = game.get(square as any);
    if (piece && piece.color === game.turn()) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        setSelectedSquare(square);
        const moves = game.moves({ square: square as any, verbose: true });
        setValidMoves(moves);
      }
    } else {
      // Clicked on an empty square or opponent's piece without a valid move
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }

  const handleUndo = () => {
    undo();
    if (mode === 'pvc' || mode === 'challenge') {
      setTimeout(() => undo(), 100); // Undo AI move as well
    }
    setSelectedSquare(null);
    setValidMoves([]);
    hasProcessedGameOver.current = false;
  };

  const handleRestart = () => {
    reset();
    hasProcessedGameOver.current = false;
  };

  const handleHint = () => {
    // Basic hint: show a random valid move
    const moves = game.moves({ verbose: true });
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      setHintMove({ from: randomMove.from, to: randomMove.to });
    }
  };

  // Custom board styles based on theme
  const customDarkSquareStyle = { backgroundColor: settings.boardTheme === 'Wooden' ? '#8B5A2B' : settings.boardTheme === 'Dark' ? '#4B5563' : '#779556' };
  const customLightSquareStyle = { backgroundColor: settings.boardTheme === 'Wooden' ? '#DEB887' : settings.boardTheme === 'Dark' ? '#9CA3AF' : '#EBECD0' };

  const customSquareStyles: Record<string, React.CSSProperties> = {};

  if (hintMove) {
    customSquareStyles[hintMove.from] = { backgroundColor: 'rgba(0, 255, 156, 0.4)' };
    customSquareStyles[hintMove.to] = { backgroundColor: 'rgba(0, 255, 156, 0.8)' };
  }

  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      ...customSquareStyles[selectedSquare],
      boxShadow: 'inset 0 0 0 2px #00FF9C, 0 0 15px rgba(0, 255, 156, 0.6)',
      backgroundColor: 'rgba(0, 255, 156, 0.2)',
    };
  }

  validMoves.forEach((move) => {
    const isCapture = move.flags.includes('c') || move.flags.includes('e');
    customSquareStyles[move.to] = {
      ...customSquareStyles[move.to],
      background: isCapture 
        ? 'radial-gradient(circle, transparent 55%, rgba(0,255,156,0.8) 60%, rgba(0,255,156,0.8) 65%, transparent 70%)'
        : 'radial-gradient(circle, rgba(0,255,156,0.8) 18%, transparent 22%)',
      boxShadow: 'inset 0 0 10px rgba(0,255,156,0.2)',
    };
  });

  const customPieces = useMemo(() => {
    const pieces = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];
    const pieceComponents: any = {};
    pieces.forEach((piece) => {
      pieceComponents[piece] = ({ squareWidth }: any) => (
        <div
          style={{
            width: squareWidth,
            height: squareWidth,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            filter: piece.startsWith('w') 
              ? 'drop-shadow(0px 4px 3px rgba(0,0,0,0.5))' 
              : 'drop-shadow(0px 4px 3px rgba(0,0,0,0.8)) brightness(1.15) contrast(1.2) saturate(1.1)',
          }}
        >
          <Image 
            src={`https://images.chesscomfiles.com/chess-themes/pieces/neo/150/${piece.toLowerCase()}.png`}
            alt={piece}
            width={150}
            height={150}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            referrerPolicy="no-referrer"
          />
        </div>
      );
    });
    return pieceComponents;
  }, []);

  const isPlayerWinner = winner ? ((winner === 'White' && playerColor === 'w') || (winner === 'Black' && playerColor === 'b')) : false;
  const isPlayerLoser = winner ? ((winner === 'White' && playerColor === 'b') || (winner === 'Black' && playerColor === 'w')) : false;

  let modalBorderColor = 'border-[#00FF9C]/50 shadow-[0_0_50px_rgba(0,255,156,0.2)]';
  if (winner) {
    if (isPlayerWinner) {
      modalBorderColor = 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.4)]';
    } else if (isPlayerLoser) {
      modalBorderColor = 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)]';
    }
  }

  return (
    <div className="flex-1 flex flex-col p-4 relative h-full">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0 opacity-20"
        style={{
          backgroundImage: 'url("https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjpYdcBqMiCvrs_bUrjQZQqd3_QnM3H1GC_g5C7kYs6cVv-l9NSYbK9M_LcB3cF-2RhObi15Q4Xg_3gbsBRM1RtqlxSSWLqhMx6DMseFZa8todGlcZXomqAz_-tXigVl53LKPJ_bzUwbmC1iZ__L_iPE3SB60yeyWOT5EdOsRsAW5BsFcha9JeIbUjiU7pZ/s741/46252.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Top Bar */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center justify-between mb-6 bg-black/40 p-3 rounded-2xl border border-white/10 backdrop-blur-md relative z-10"
      >
        <button onClick={() => router.push('/')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-bold font-serif uppercase tracking-wider text-[#00FF9C]">
            {mode === 'pvp' ? '2 PLAYERS' : mode === 'challenge' ? 'CHALLENGE' : mode === 'online' ? 'ONLINE MATCH' : 'VS COMPUTER'}
          </h1>
          {(mode === 'challenge' || mode === 'online') && bet > 0 && (
            <span className="text-xs font-mono text-[#FFC107] flex items-center gap-1">
              <Trophy className="w-3 h-3" /> WIN ₹{bet * 2}
            </span>
          )}
        </div>

        <button onClick={() => router.push('/settings')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <MoreVertical className="w-6 h-6" />
        </button>
      </motion.div>

      {/* Opponent Info */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="flex items-center justify-between mb-4 px-2 relative z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-black border-2 border-gray-500 flex items-center justify-center shadow-lg">
            {mode === 'pvp' ? <span className="font-bold text-sm">P2</span> : mode === 'online' ? <span className="font-bold text-sm">OPP</span> : mode === 'challenge' ? <span className="font-bold text-sm">{challengeOpponent ? challengeOpponent.charAt(0) : 'C'}</span> : <span className="font-bold text-sm">AI</span>}
          </div>
          <div>
            <p className="font-bold text-sm">{mode === 'pvp' ? 'Player 2' : mode === 'online' ? 'Opponent' : mode === 'challenge' ? challengeOpponent : `Computer (${settings.difficulty})`}</p>
            <p className="text-xs text-gray-400">
              {mode === 'online' 
                ? (game.turn() !== playerColor ? <span className="text-[#FFC107] animate-pulse">Thinking...</span> : 'Waiting')
                : (game.turn() !== playerColor ? <span className="text-[#FFC107] animate-pulse">{mode === 'challenge' ? 'Thinking...' : engineThinking ? 'Thinking...' : 'Waiting'}</span> : 'Waiting')}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Chess Board */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, rotateX: 10 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        transition={{ duration: 0.6, delay: 0.2, type: "spring", bounce: 0.4 }}
        style={{ perspective: 1000 }}
      >
      <GlassCard className="p-2 md:p-4 w-full aspect-square max-w-[500px] mx-auto shadow-[0_0_30px_rgba(0,0,0,0.5)] relative z-10">
        <div ref={containerRef} className="w-full h-full">
          {isMounted && containerWidth > 0 && (
            <Chessboard 
              options={{
                position: game.fen(),
                onSquareClick: onSquareClick,
                onPieceClick: (args: any) => onSquareClick({ piece: args.piece, square: args.square }),
                allowDragging: false,
                boardOrientation: boardOrientation,
                darkSquareStyle: customDarkSquareStyle,
                lightSquareStyle: customLightSquareStyle,
                squareStyles: customSquareStyles,
                animationDurationInMs: 300,
                pieces: customPieces,
                showNotation: false
              }}
            />
          )}
        </div>
      </GlassCard>
      </motion.div>

      {/* Player Info */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className="flex items-center justify-between mt-4 px-2 relative z-10"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-gray-300 border-2 border-white flex items-center justify-center shadow-lg">
            <span className="font-bold text-sm text-black">P1</span>
          </div>
          <div>
            <p className="font-bold text-sm">You</p>
            <p className="text-xs text-gray-400">
              {mode === 'online'
                ? (game.turn() === playerColor ? <span className="text-[#00FF9C] animate-pulse">Your Turn</span> : 'Waiting')
                : (game.turn() === playerColor ? <span className="text-[#00FF9C] animate-pulse">Your Turn</span> : 'Waiting')}
            </p>
          </div>
        </div>
        {(mode === 'challenge' || mode === 'online') && bet > 0 && (
          <div className="flex items-center gap-1 bg-black/50 px-3 py-1 rounded-full border border-[#FFC107]/30">
            <Coins className="w-4 h-4 text-[#FFC107]" />
            <span className="font-bold text-sm text-[#FFC107]">₹{coins}</span>
          </div>
        )}
      </motion.div>

      {/* Controls */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
        className="mt-auto pt-6 grid grid-cols-4 gap-2 relative z-10"
      >
        <GlassButton size="sm" variant="secondary" className="flex-col gap-1 py-3" onClick={handleRestart} disabled={mode === 'online'}>
          <RotateCcw className="w-5 h-5" />
          <span className="text-[10px]">Restart</span>
        </GlassButton>
        <GlassButton size="sm" variant="secondary" className="flex-col gap-1 py-3" onClick={handleUndo} disabled={game.history().length === 0 || mode === 'online'}>
          <Undo2 className="w-5 h-5" />
          <span className="text-[10px]">Undo</span>
        </GlassButton>
        <GlassButton size="sm" variant="primary" className="flex-col gap-1 py-3" onClick={handleHint}>
          <Lightbulb className="w-5 h-5" />
          <span className="text-[10px]">Hint</span>
        </GlassButton>
        <GlassButton size="sm" variant="secondary" className="flex-col gap-1 py-3" onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')}>
          <FlipVertical className="w-5 h-5" />
          <span className="text-[10px]">Flip</span>
        </GlassButton>
      </motion.div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          >
            <GlassCard className={`w-full max-w-sm p-8 flex flex-col items-center text-center ${modalBorderColor}`}>
              <h2 className="text-4xl font-black font-serif mb-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                {mode === 'online' 
                  ? (winner ? (isPlayerWinner ? 'You Win!' : 'You Lose!') : 'Game Drawn')
                  : mode === 'pvc' || mode === 'challenge'
                    ? (winner ? (isPlayerWinner ? 'you win this match' : 'You lost this match') : 'Game Drawn')
                    : (winner ? `${winner} Wins!` : 'Game Drawn')}
              </h2>
              <p className="text-[#00FF9C] font-mono mb-6 uppercase tracking-widest">{reason}</p>
              
              {((mode === 'challenge' || mode === 'online') && isPlayerWinner) && bet > 0 && (
                <div className="mb-6 text-[#FFC107] font-bold text-xl flex items-center gap-2">
                  + ₹{bet} <Coins className="w-6 h-6" />
                </div>
              )}
              {((mode === 'challenge' || mode === 'online') && isPlayerLoser) && bet > 0 && (
                <div className="mb-6 text-[#FF4C4C] font-bold text-xl flex items-center gap-2">
                  - ₹{bet} <Coins className="w-6 h-6" />
                </div>
              )}

              <div className="flex flex-col w-full gap-3">
                {mode !== 'online' && (
                  <GlassButton size="md" variant="primary" onClick={handleRestart}>
                    PLAY AGAIN
                  </GlassButton>
                )}
                <GlassButton size="md" variant="secondary" onClick={() => router.push('/')}>
                  MAIN MENU
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Game() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-[#00FF9C] animate-pulse">Loading Game...</div>}>
      <GameContent />
    </Suspense>
  );
}
