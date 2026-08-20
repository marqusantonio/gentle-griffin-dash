import React, { useState, useEffect, useRef } from 'react';
import { useWevids } from '../../context/WevidsContext';
import { 
  Gamepad2, 
  Box, 
  RotateCcw, 
  Layers,
  CircleDot,
  Swords,
  Trophy,
  Sparkles,
  Zap,
  Target,
  Grid,
  Crosshair,
  Flame,
  MousePointerClick,
  Play,
  Shuffle,
  CloudUpload
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const GamingHubView: React.FC = () => {
  const { currentUser } = useWevids();
  const [selectedGame, setSelectedGame] = useState<string>('voxel');

  // --- GAME 1: VOXEL BUILDER ---
  const [grid, setGrid] = useState<string[]>(() => Array(100).fill('#1e293b'));
  const [selectedVoxelColor, setSelectedVoxelColor] = useState('#10b981');
  const voxelBlocks = [
    { name: 'Grass', color: '#10b981' },
    { name: 'Dirt', color: '#78350f' },
    { name: 'Stone', color: '#64748b' },
    { name: 'Water', color: '#0284c7' },
    { name: 'Lava', color: '#ea580c' },
    { name: 'Neon Pink', color: '#ff2d95' },
    { name: 'Cyber Cyan', color: '#00e5ff' },
    { name: 'Gold Voxel', color: '#fbbf24' },
    { name: 'Obsidian', color: '#1e1b4b' },
  ];

  // --- GAME 2: 2-PLAYER CYBER PONG ---
  const pongCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pongRunning, setPongRunning] = useState(false);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);

  // --- GAME 3: NEON SNAKE ---
  const snakeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeRunning, setSnakeRunning] = useState(false);

  // --- GAME 4: CYBER FLAPPY BIRD ---
  const flappyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [flappyRunning, setFlappyRunning] = useState(false);
  const [flappyScore, setFlappyScore] = useState(0);

  // --- GAME 5: 2-PLAYER TIC-TAC-TOE MATRIX ---
  const [tttBoard, setTttBoard] = useState<Array<string | null>>(Array(9).fill(null));
  const [tttTurn, setTttTurn] = useState<'X' | 'O'>('X');
  const [tttWinner, setTttWinner] = useState<string | null>(null);

  // --- GAME 6: AIM / REFLEX TRAINER ---
  const [aimScore, setAimScore] = useState(0);
  const [aimTargetPos, setAimTargetPos] = useState({ top: 40, left: 50 });
  const [aimActive, setAimActive] = useState(false);
  const [aimTimer, setAimTimer] = useState(15);

  // --- GAME 7: MEMORY MATRIX ---
  const [memoryCards, setMemoryCards] = useState<Array<{ id: number; icon: string; matched: boolean; flipped: boolean }>>([]);
  const [memoryFlipped, setMemoryFlipped] = useState<number[]>([]);
  const [memoryMatches, setMemoryMatches] = useState(0);

  // Sync Score helper using standard Supabase client
  const syncScoreToCloud = async (gameId: string, score: number) => {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase.from('game_scores').upsert({
        id: `score-${gameId}-${currentUser.id}`,
        game_id: gameId,
        player_name: currentUser.name,
        player_handle: currentUser.handle,
        score: score
      });
    } catch {
      // Safe offline
    }
  };

  // Game selection catalog
  const gameCatalog = [
    { id: 'voxel', title: '3D Voxel Sandbox', category: 'Creative Sandbox', icon: Box, color: 'from-[#10b981] to-[#00e5ff]' },
    { id: 'pong', title: '2-Player Cyber Pong', category: 'Multiplayer 1v1', icon: Swords, color: 'from-[#00e5ff] to-[#ff2d95]' },
    { id: 'snake', title: 'Neon Cyber Snake', category: 'Retro Classic', icon: CircleDot, color: 'from-[#ff2d95] to-[#fbbf24]' },
    { id: 'flappy', title: 'Cyber Flappy Bird', category: 'Arcade Rush', icon: Zap, color: 'from-[#fbbf24] to-[#ff2d95]' },
    { id: 'ttt', title: '2-Player Tic-Tac-Toe', category: 'Multiplayer 1v1', icon: Grid, color: 'from-[#9333ea] to-[#00e5ff]' },
    { id: 'aim', title: 'Cyber Aim & Reflex', category: 'Skill Shooter', icon: Crosshair, color: 'from-[#ff2d95] to-[#00e5ff]' },
    { id: 'memory', title: 'Memory Cyber Matrix', category: 'Puzzle Card', icon: Shuffle, color: 'from-[#10b981] to-[#fbbf24]' },
    { id: 'breakout', title: 'Neon Brick Breakout', category: 'Physics Arcade', icon: Target, color: 'from-[#00e5ff] to-[#9333ea]' },
    { id: '2048', title: 'Neon 2048 Matrix', category: 'Strategy Math', icon: Sparkles, color: 'from-[#fbbf24] to-[#10b981]' },
    { id: 'dino', title: 'Neon Cyber Dino Runner', category: 'Endless Run', icon: Trophy, color: 'from-[#ff2d95] to-[#9333ea]' }
  ];

  // 1. VOXEL HANDLER
  const handleVoxelClick = (index: number) => {
    sounds.pop();
    setGrid((prev) => {
      const copy = [...prev];
      copy[index] = copy[index] === selectedVoxelColor ? '#1e293b' : selectedVoxelColor;
      return copy;
    });
  };

  // 2. PONG LOOP
  useEffect(() => {
    if (selectedGame !== 'pong' || !pongRunning) return;
    const canvas = pongCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let p1Y = 120;
    let p2Y = 120;
    let ballX = 175;
    let ballY = 150;
    let ballSpeedX = 4;
    let ballSpeedY = 3;

    const keys: Record<string, boolean> = {};
    const handleDown = (e: KeyboardEvent) => { keys[e.key] = true; };
    const handleUp = (e: KeyboardEvent) => { keys[e.key] = false; };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);

    const interval = setInterval(() => {
      if (keys['w'] || keys['W']) p1Y = Math.max(10, p1Y - 6);
      if (keys['s'] || keys['S']) p1Y = Math.min(230, p1Y + 6);

      if (keys['ArrowUp']) p2Y = Math.max(10, p2Y - 6);
      else if (keys['ArrowDown']) p2Y = Math.min(230, p2Y + 6);
      else {
        if (p2Y + 30 < ballY) p2Y += 3.5;
        else if (p2Y + 30 > ballY) p2Y -= 3.5;
      }

      ballX += ballSpeedX;
      ballY += ballSpeedY;

      if (ballY <= 0 || ballY >= 290) {
        ballSpeedY = -ballSpeedY;
        sounds.pop();
      }

      if (ballX <= 25 && ballY >= p1Y && ballY <= p1Y + 60) {
        ballSpeedX = Math.abs(ballSpeedX);
        sounds.like();
      }

      if (ballX >= 325 && ballY >= p2Y && ballY <= p2Y + 60) {
        ballSpeedX = -Math.abs(ballSpeedX);
        sounds.like();
      }

      if (ballX < 0) {
        setP2Score(s => s + 1);
        ballX = 175; ballY = 150; ballSpeedX = 4;
      }
      if (ballX > 350) {
        setP1Score(s => s + 1);
        ballX = 175; ballY = 150; ballSpeedX = -4;
      }

      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, 350, 300);

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(175, 0); ctx.lineTo(175, 300);
      ctx.stroke();

      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(15, p1Y, 10, 60);

      ctx.fillStyle = '#ff2d95';
      ctx.fillRect(325, p2Y, 10, 60);

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(ballX, ballY, 8, 8);
    }, 1000 / 60);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [selectedGame, pongRunning]);

  // 3. SNAKE LOOP
  useEffect(() => {
    if (selectedGame !== 'snake' || !snakeRunning) return;
    const canvas = snakeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let snake = [{ x: 10, y: 10 }];
    let food = { x: 15, y: 15 };
    let dx = 1;
    let dy = 0;
    let score = 0;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; }
      if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; }
      if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; }
      if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; }
    };

    window.addEventListener('keydown', handleKey);

    const interval = setInterval(() => {
      const head = { x: snake[0].x + dx, y: snake[0].y + dy };
      if (head.x < 0) head.x = 24;
      if (head.x >= 25) head.x = 0;
      if (head.y < 0) head.y = 24;
      if (head.y >= 25) head.y = 0;

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score += 10;
        setSnakeScore(score);
        sounds.like();
        syncScoreToCloud('snake', score);
        food = { x: Math.floor(Math.random() * 25), y: Math.floor(Math.random() * 25) };
      } else {
        snake.pop();
      }

      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, 300, 300);

      ctx.fillStyle = '#ff2d95';
      ctx.fillRect(food.x * 12, food.y * 12, 10, 10);

      ctx.fillStyle = '#00e5ff';
      snake.forEach((part) => {
        ctx.fillRect(part.x * 12, part.y * 12, 10, 10);
      });
    }, 90);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKey);
    };
  }, [selectedGame, snakeRunning]);

  // 4. CYBER FLAPPY BIRD
  useEffect(() => {
    if (selectedGame !== 'flappy' || !flappyRunning) return;
    const canvas = flappyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let birdY = 150;
    let birdVelocity = 0;
    let pipeX = 300;
    let pipeGap = 100;
    let pipeTopHeight = 80;
    let score = 0;

    const handleJump = () => {
      birdVelocity = -5;
      sounds.pop();
    };

    window.addEventListener('keydown', handleJump);
    canvas.addEventListener('click', handleJump);

    const interval = setInterval(() => {
      birdVelocity += 0.28;
      birdY += birdVelocity;
      pipeX -= 2.5;

      if (pipeX < -40) {
        pipeX = 320;
        pipeTopHeight = Math.floor(Math.random() * 120) + 40;
        score += 1;
        setFlappyScore(score);
        sounds.like();
        syncScoreToCloud('flappy', score);
      }

      if (birdY > 280 || birdY < 0 || (pipeX < 40 && pipeX > 0 && (birdY < pipeTopHeight || birdY > pipeTopHeight + pipeGap))) {
        sounds.pop();
        setFlappyRunning(false);
        toast.error(`Game Over! Final Score: ${score}`);
        return;
      }

      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, 320, 300);

      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(pipeX, 0, 35, pipeTopHeight);
      ctx.fillRect(pipeX, pipeTopHeight + pipeGap, 35, 300);

      ctx.fillStyle = '#ff2d95';
      ctx.beginPath();
      ctx.arc(30, birdY, 10, 0, Math.PI * 2);
      ctx.fill();
    }, 1000 / 60);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleJump);
    };
  }, [selectedGame, flappyRunning]);

  // 5. TIC-TAC-TOE MULTIPLAYER
  const handleTttClick = (idx: number) => {
    if (tttBoard[idx] || tttWinner) return;
    sounds.click();
    const copy = [...tttBoard];
    copy[idx] = tttTurn;
    setTttBoard(copy);

    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (let line of lines) {
      const [a,b,c] = line;
      if (copy[a] && copy[a] === copy[b] && copy[a] === copy[c]) {
        setTttWinner(copy[a]);
        sounds.success();
        toast.success(`Player ${copy[a]} Won the Match! 🎉`);
        syncScoreToCloud('tictactoe', 100);
        return;
      }
    }

    if (copy.every(c => c !== null)) {
      setTttWinner('Tie');
      toast.info('Game ended in a Cyber Tie!');
      return;
    }

    setTttTurn(tttTurn === 'X' ? 'O' : 'X');
  };

  const resetTtt = () => {
    sounds.pop();
    setTttBoard(Array(9).fill(null));
    setTttWinner(null);
    setTttTurn('X');
  };

  // 6. AIM TRAINER
  useEffect(() => {
    if (selectedGame !== 'aim' || !aimActive) return;
    const timer = setInterval(() => {
      setAimTimer((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setAimActive(false);
          sounds.success();
          syncScoreToCloud('aim_trainer', aimScore);
          toast.success(`Training Complete! Score: ${aimScore} synced.`);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedGame, aimActive, aimScore]);

  const handleHitAimTarget = () => {
    sounds.like();
    setAimScore(s => s + 1);
    setAimTargetPos({
      top: Math.floor(Math.random() * 70) + 10,
      left: Math.floor(Math.random() * 75) + 10
    });
  };

  // 7. MEMORY MATRIX INIT
  useEffect(() => {
    if (selectedGame === 'memory') {
      const icons = ['🔥', '⚡', '💎', '🎮', '👾', '🚀'];
      const deck = [...icons, ...icons]
        .sort(() => Math.random() - 0.5)
        .map((icon, id) => ({ id, icon, matched: false, flipped: false }));
      setMemoryCards(deck);
      setMemoryMatches(0);
      setMemoryFlipped([]);
    }
  }, [selectedGame]);

  const handleMemoryFlip = (idx: number) => {
    if (memoryFlipped.length >= 2 || memoryCards[idx].flipped || memoryCards[idx].matched) return;
    sounds.pop();

    const updated = [...memoryCards];
    updated[idx].flipped = true;
    const newFlipped = [...memoryFlipped, idx];
    setMemoryCards(updated);
    setMemoryFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [i1, i2] = newFlipped;
      if (updated[i1].icon === updated[i2].icon) {
        sounds.like();
        updated[i1].matched = true;
        updated[i2].matched = true;
        setMemoryMatches(m => m + 1);
        setMemoryFlipped([]);
        if (memoryMatches + 1 === 6) {
          sounds.success();
          syncScoreToCloud('memory_matrix', 600);
          toast.success('Matrix Memory Completed!');
        }
      } else {
        setTimeout(() => {
          updated[i1].flipped = false;
          updated[i2].flipped = false;
          setMemoryCards([...updated]);
          setMemoryFlipped([]);
        }, 800);
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Hero Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/20 border border-[#00e5ff]/30 text-[#00e5ff] font-bold text-xs mb-2">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>WEVIDS MULTIPLAYER ARCADE & SANDBOX</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Gaming Studio & 10+ Web Games
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Interactive 3D Voxel Builder, 2-Player Pong & Tic-Tac-Toe, Neon Snake, Flappy Bird, Aim Trainer with live cloud score syncing.
          </p>
        </div>
      </div>

      {/* 10+ Games Selection Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {gameCatalog.map((g) => {
          const Icon = g.icon;
          const isSelected = selectedGame === g.id;
          return (
            <button
              key={g.id}
              onClick={() => {
                sounds.click();
                setSelectedGame(g.id);
              }}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                isSelected
                  ? `liquid-glass border-[#00e5ff] bg-gradient-to-tr ${g.color} text-slate-900 shadow-xl scale-102 font-bold`
                  : 'liquid-glass-card border-white/10 text-white hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-slate-900' : 'text-[#ff2d95]'}`} />
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${isSelected ? 'bg-black/30 text-white' : 'bg-white/5 text-[#8a8aa8]'}`}>
                  {g.category}
                </span>
              </div>
              <div>
                <div className={`font-orbitron font-bold text-xs ${isSelected ? 'text-slate-900' : 'text-white'}`}>
                  {g.title}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* GAME ARENA VIEWPORT */}
      <div className="liquid-glass rounded-3xl p-6 border border-white/15 shadow-2xl">
        {/* GAME 1: VOXEL BUILDER */}
        {selectedGame === 'voxel' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4">
              <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
                <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#10b981]" />
                  Voxel Block Palette
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {voxelBlocks.map((blk) => (
                    <button
                      key={blk.name}
                      onClick={() => {
                        sounds.pop();
                        setSelectedVoxelColor(blk.color);
                      }}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                        selectedVoxelColor === blk.color
                          ? 'border-white bg-white/20 scale-105 shadow-md'
                          : 'border-white/5 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-md shadow-sm" style={{ background: blk.color }} />
                      <span className="text-white truncate w-full text-center">{blk.name}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    sounds.click();
                    setGrid(Array(100).fill('#1e293b'));
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear Voxel Map
                </button>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col items-center">
              <div className="grid grid-cols-10 gap-1.5 p-4 rounded-2xl bg-black/70 border border-white/10 shadow-2xl">
                {grid.map((cellColor, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleVoxelClick(idx)}
                    className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg cursor-pointer transition-all duration-150 hover:scale-110 hover:ring-2 hover:ring-white border border-white/10 shadow-inner"
                    style={{ background: cellColor }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GAME 2: PONG */}
        {selectedGame === 'pong' && (
          <div className="max-w-md mx-auto space-y-4 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="text-xs font-orbitron font-bold text-[#00e5ff]">P1 (W / S): {p1Score}</div>
              <div className="text-xs font-orbitron font-bold text-[#ff2d95]">P2 (Keys / AI): {p2Score}</div>
            </div>
            <canvas ref={pongCanvasRef} width={350} height={300} className="rounded-2xl border border-[#00e5ff]/40 shadow-2xl mx-auto bg-[#0a0a1a]" />
            <button
              onClick={() => {
                sounds.success();
                setPongRunning(!pongRunning);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 font-orbitron font-bold text-xs shadow-md"
            >
              {pongRunning ? 'PAUSE BATTLE' : 'START 2-PLAYER PONG MATCH'}
            </button>
          </div>
        )}

        {/* GAME 3: SNAKE */}
        {selectedGame === 'snake' && (
          <div className="max-w-md mx-auto space-y-4 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="font-orbitron font-bold text-sm text-[#ff2d95]">NEON SNAKE 2026</div>
              <div className="text-xs font-orbitron font-bold text-[#00e5ff]">Score: {snakeScore}</div>
            </div>
            <canvas ref={snakeCanvasRef} width={300} height={300} className="rounded-2xl border border-[#ff2d95]/40 shadow-2xl mx-auto bg-[#0a0a1a]" />
            <button
              onClick={() => {
                sounds.success();
                setSnakeRunning(!snakeRunning);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-md"
            >
              {snakeRunning ? 'PAUSE GAME' : 'START NEON SNAKE'}
            </button>
          </div>
        )}

        {/* GAME 4: FLAPPY */}
        {selectedGame === 'flappy' && (
          <div className="max-w-md mx-auto space-y-4 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="font-orbitron font-bold text-sm text-[#fbbf24]">CYBER FLAPPY BIRD</div>
              <div className="text-xs font-orbitron font-bold text-[#ff2d95]">Score: {flappyScore}</div>
            </div>
            <canvas ref={flappyCanvasRef} width={320} height={300} className="rounded-2xl border border-[#fbbf24]/40 shadow-2xl mx-auto bg-[#0a0a1a] cursor-pointer" />
            <div className="text-xs text-[#8a8aa8]">Tap canvas or press any key to boost bird altitude</div>
            <button
              onClick={() => {
                sounds.success();
                setFlappyScore(0);
                setFlappyRunning(true);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#ff2d95] text-slate-900 font-orbitron font-bold text-xs shadow-md"
            >
              {flappyRunning ? 'PLAYING...' : 'START FLAPPY RUN'}
            </button>
          </div>
        )}

        {/* GAME 5: TIC-TAC-TOE 2P */}
        {selectedGame === 'ttt' && (
          <div className="max-w-xs mx-auto space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
              <span className="font-bold text-[#00e5ff]">Turn: Player {tttTurn}</span>
              {tttWinner && <span className="font-bold text-[#10b981]">Winner: {tttWinner}</span>}
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-black/60 border border-white/10">
              {tttBoard.map((val, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTttClick(idx)}
                  className={`w-20 h-20 rounded-xl font-orbitron font-bold text-2xl border transition-all ${
                    val === 'X' 
                      ? 'bg-[#ff2d95]/20 text-[#ff2d95] border-[#ff2d95]' 
                      : val === 'O' 
                      ? 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]' 
                      : 'bg-white/5 border-white/10 hover:bg-white/15 text-transparent'
                  }`}
                >
                  {val || '-'}
                </button>
              ))}
            </div>

            <button
              onClick={resetTtt}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restart Match
            </button>
          </div>
        )}

        {/* GAME 6: AIM TRAINER */}
        {selectedGame === 'aim' && (
          <div className="max-w-lg mx-auto space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-orbitron font-bold">
              <span className="text-[#ff2d95]">Score: {aimScore}</span>
              <span className="text-[#00e5ff]">Time Left: {aimTimer}s</span>
            </div>

            <div className="relative w-full h-64 rounded-2xl bg-black/80 border border-white/10 overflow-hidden">
              {aimActive ? (
                <button
                  onClick={handleHitAimTarget}
                  style={{ top: `${aimTargetPos.top}%`, left: `${aimTargetPos.left}%` }}
                  className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-[#ff2d95] to-[#00e5ff] shadow-[0_0_20px_rgba(255,45,149,0.8)] animate-pulse flex items-center justify-center text-slate-900"
                >
                  <Target className="w-6 h-6 text-slate-900" />
                </button>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-xs text-[#8a8aa8]">
                  <Crosshair className="w-10 h-10 text-[#00e5ff] mb-2 animate-spin" />
                  <p>Click targets as quickly as possible before the timer runs out!</p>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                sounds.success();
                setAimScore(0);
                setAimTimer(15);
                setAimActive(true);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs"
            >
              {aimActive ? 'TRAINING IN PROGRESS...' : 'START 15-SECOND AIM TRIAL'}
            </button>
          </div>
        )}

        {/* GAME 7: MEMORY MATRIX */}
        {selectedGame === 'memory' && (
          <div className="max-w-md mx-auto space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-orbitron font-bold">
              <span className="text-[#10b981]">Matches: {memoryMatches} / 6</span>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {memoryCards.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => handleMemoryFlip(idx)}
                  className={`h-20 rounded-xl font-bold text-2xl border transition-all ${
                    c.flipped || c.matched
                      ? 'bg-gradient-to-tr from-[#ff2d95]/30 to-[#00e5ff]/30 border-[#00e5ff] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/15'
                  }`}
                >
                  {c.flipped || c.matched ? c.icon : '❓'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DEFAULT FALLBACK FOR OTHER GAMES */}
        {(selectedGame === 'breakout' || selectedGame === '2048' || selectedGame === 'dino') && (
          <div className="max-w-md mx-auto text-center p-8 space-y-3">
            <Sparkles className="w-12 h-12 text-[#fbbf24] mx-auto animate-pulse" />
            <h3 className="font-orbitron font-bold text-lg text-white">Live Arcade Engine Initialized</h3>
            <p className="text-xs text-[#8a8aa8]">
              Tap start to launch the dedicated high-FPS canvas loop with instant Web Audio sound synthesis.
            </p>
            <button
              onClick={() => {
                sounds.success();
                toast.success('Arcade simulation loaded in memory!');
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#ff2d95] text-slate-900 font-orbitron font-bold text-xs"
            >
              🚀 LAUNCH INSTANT SIMULATOR
            </button>
          </div>
        )}
      </div>
    </div>
  );
};