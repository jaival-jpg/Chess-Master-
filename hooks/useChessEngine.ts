import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Move } from 'chess.js';

export function useChessEngine(
  difficulty: string = 'Medium',
  onMove?: (move: Move) => void
) {
  const [game, setGame] = useState(new Chess());
  const [engine, setEngine] = useState<Worker | null>(null);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [engineThinking, setEngineThinking] = useState(false);
  const evaluatingFenRef = useRef<string | null>(null);

  const makeEngineMove = useCallback((moveString: string) => {
    setGame((g) => {
      // Only apply the move if the current FEN matches the one we asked the engine to evaluate
      if (evaluatingFenRef.current !== null && g.fen() !== evaluatingFenRef.current) {
        return g; // Ignore stale move
      }
      
      const newGame = new Chess();
      newGame.loadPgn(g.pgn());
      try {
        const result = newGame.move({
          from: moveString.substring(0, 2),
          to: moveString.substring(2, 4),
          promotion: moveString.length > 4 ? moveString.substring(4, 5) : 'q',
        });
        if (result) {
          if (onMove) {
            setTimeout(() => onMove(result), 0);
          }
          return newGame;
        }
      } catch (e) {
        // Move was invalid (e.g. if the game state changed unexpectedly)
        // We don't need to log an error here, just ignore it
      }
      return g;
    });
    setEngineThinking(false);
    evaluatingFenRef.current = null;
  }, [onMove]);

  useEffect(() => {
    let worker: Worker | null = null;
    
    const initEngine = async () => {
      try {
        // Fetch stockfish.js from local API route to avoid CORS and offline issues
        const response = await fetch('/api/stockfish');
        const text = await response.text();
        const blob = new Blob([text], { type: 'application/javascript' });
        worker = new Worker(URL.createObjectURL(blob));
        
        worker.onmessage = (e) => {
          const msg = e.data;
          if (msg === 'uciok') {
            setIsEngineReady(true);
          } else if (msg.startsWith('bestmove')) {
            const move = msg.split(' ')[1];
            if (move) {
              makeEngineMove(move);
            }
          }
        };

        worker.postMessage('uci');
        setEngine(worker);
      } catch (error) {
        console.error('Failed to load Stockfish:', error);
      }
    };

    initEngine();

    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, [makeEngineMove]);

  const getBestMove = useCallback(() => {
    if (!engine || !isEngineReady) return;
    
    setEngineThinking(true);
    evaluatingFenRef.current = game.fen();
    engine.postMessage(`position fen ${game.fen()}`);
    
    // Adjust depth based on difficulty
    let depth = 10;
    if (difficulty === 'Easy') depth = 2; // Very easy
    if (difficulty === 'Hard') depth = 15;
    
    engine.postMessage(`go depth ${depth}`);
  }, [engine, isEngineReady, game, difficulty]);

  const makeMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
    try {
      const newGame = new Chess();
      newGame.loadPgn(game.pgn());
      const result = newGame.move(move);
      if (result) {
        setGame(newGame);
        return result;
      }
    } catch (e) {
      return null; // Invalid move
    }
    return null;
  }, [game]);

  const undo = useCallback(() => {
    setGame((g) => {
      const newGame = new Chess();
      newGame.loadPgn(g.pgn());
      newGame.undo();
      return newGame;
    });
  }, []);

  const reset = useCallback(() => {
    setGame(new Chess());
  }, []);

  const loadFen = useCallback((fen: string) => {
    setGame((g) => {
      if (g.fen() === fen) return g;
      try {
        return new Chess(fen);
      } catch (e) {
        console.error('Invalid FEN:', fen);
        return g;
      }
    });
  }, []);

  return {
    game,
    makeMove,
    undo,
    reset,
    loadFen,
    getBestMove,
    isEngineReady,
    engineThinking,
  };
}
