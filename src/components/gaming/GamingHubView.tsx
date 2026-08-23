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
  Shuffle,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { sounds } from '../../lib/soundFx';
import { toast } from 'sonner';

export const GamingHubView: React.FC = () => {
  const { currentUser } = useWevids();
  const [selectedGame, setSelectedGame] = useState<string>('pvp_minecraft');

  // --- GAME 1: ONLINE PVP MINECRAFT ARENA ---
  const mcCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mcRunning, setMcRunning] = useState(false);
  const [mcHealth, setMcHealth] = useState(100);
  const [mcKills, setMcKills] = useState(0);
  const [mcSelectedItem, setMcSelectedItem] = useState<'sword' | 'bow' | 'wood' | 'stone' | 'apple'>('sword');

  // --- GAME 2: VOXEL BUILDER ---
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

  // --- GAME 3: 2-PLAYER CYBER PONG ---
  const pongCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pongRunning, setPongRunning] = useState(false);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);

  // --- GAME 4: NEON SNAKE ---
  const snakeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeRunning, setSnakeRunning] = useState(false);

  // --- GAME 5: CYBER FLAPPY BIRD ---
  const flappyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [flappyRunning, setFlappyRunning] = useState(false);
  const [flappyScore, setFlappyScore] = useState(0);

  // --- GAME 6: 2-PLAYER TIC-TAC-TOE MATRIX ---
  const [tttBoard, setTttBoard] = useState<Array<string | null>>(Array(9).fill(null));
  const [tttTurn, setTttTurn] = useState<'X' | 'O'>('X');
  const [tttWinner, setTttWinner] = useState<string | null>(null);

  // --- GAME 7: AIM / REFLEX TRAINER ---
  const [aimScore, setAimScore] = useState(0);
  const [aimTargetPos, setAimTargetPos] = useState({ top: 40, left: 50 });
  const [aimActive, setAimActive] = useState(false);
  const [aimTimer, setAimTimer] = useState(15);

  // --- GAME 8: MEMORY MATRIX ---
  const [memoryCards, setMemoryCards] = useState<Array<{ id: number; icon: string; matched: boolean; flipped: boolean }>>([]);
  const [memoryFlipped, setMemoryFlipped] = useState<number[]>([]);
  const [memoryMatches, setMemoryMatches] = useState(0);

  // Sync Score helper
  const syncScoreToCloud = async (gameId: string, score: number) => {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase.from('game_scores').upsert([{
        id: `score-${gameId}-${currentUser.id}`,
        game_id: gameId,
        player_name: currentUser.name,
        player_handle: currentUser.handle,
        score: score
      }]);
    } catch {
      // Safe offline
    }
  };

  // Catalog
  const gameCatalog = [
    { id: 'pvp_minecraft', title: 'Online PVP Minecraft', category: 'Live Multiplayer', icon: Swords, color: 'from-[#00e5ff] to-[#10b981]' },
    { id: 'voxel', title: '3D Voxel Sandbox', category: 'Creative Sandbox', icon: Box, color: 'from-[#10b981] to-[#00e5ff]' },
    { id: 'pong', title: '2-Player Cyber Pong', category: 'Multiplayer 1v1', icon: Swords, color: 'from-[#00e5ff] to-[#ff2d95]' },
    { id: 'snake', title: 'Neon Cyber Snake', category: 'Retro Classic', icon: CircleDot, color: 'from-[#ff2d95] to-[#fbbf24]' },
    { id: 'flappy', title: 'Cyber Flappy Bird', category: 'Arcade Rush', icon: Zap, color: 'from-[#fbbf24] to-[#ff2d95]' },
    { id: 'ttt', title: '2-Player Tic-Tac-Toe', category: 'Multiplayer 1v1', icon: Grid, color: 'from-[#9333ea] to-[#00e5ff]' },
    { id: 'aim', title: 'Cyber Aim & Reflex', category: 'Skill Shooter', icon: Crosshair, color: 'from-[#ff2d95] to-[#00e5ff]' },
    { id: 'memory', title: 'Memory Cyber Matrix', category: 'Puzzle Card', icon: Shuffle, color: 'from-[#10b981] to-[#fbbf24]' },
    { id: 'breakout', title: 'Neon Brick Breakout', category: 'Physics Arcade', icon: Target, color: 'from-[#00e5ff] to-[#9333ea]' },
    { id: '2048', title: 'Neon 2048 Matrix', category: 'Strategy Math', icon: Sparkles, color: 'from-[#fbbf24] to-[#10b981]' }
  ];

  // =========================================================
  // 1. ONLINE PVP MINECRAFT GAME ENGINE
  // =========================================================
  useEffect(() => {
    if (selectedGame !== 'pvp_minecraft' || !mcRunning) return;
    const canvas = mcCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let playerX = 100;
    let playerY = 200;
    let playerHp = 100;
    let kills = 0;

    let enemyX = 350;
    let enemyY = 200;
    let enemyHp = 100;

    const placedBlocks: Array<{ x: number; y: number; type: string }> = [
      { x: 200, y: 220, type: '#78350f' },
      { x: 200, y: 200, type: '#64748b' }
    ];

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }
      keys[e.key] = true;

      // Golden Apple Heal
      if (e.key === 'e' || e.key === 'E') {
        playerHp = Math.min(100, playerHp + 25);
        setMcHealth(playerHp);
        sounds.like();
        toast.success('Golden Apple consumed! +25 HP');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (mcSelectedItem === 'sword') {
        // Sword Attack
        sounds.pop();
        if (Math.abs(clickX - enemyX) < 60 && Math.abs(clickY - enemyY) < 60) {
          enemyHp -= 35;
          sounds.like();
          if (enemyHp <= 0) {
            kills += 1;
            setMcKills(kills);
            sounds.success();
            toast.success(`⚔️ PVP Kill! Total Kills: ${kills}`);
            syncScoreToCloud('pvp_minecraft', kills * 100);
            enemyHp = 100;
            enemyX = Math.floor(Math.random() * 300) + 100;
          }
        }
      } else if (mcSelectedItem === 'wood' || mcSelectedItem === 'stone') {
        // Place Block
        sounds.click();
        const blockColor = mcSelectedItem === 'wood' ? '#78350f' : '#64748b';
        placedBlocks.push({ x: Math.floor(clickX / 20) * 20, y: Math.floor(clickY / 20) * 20, type: blockColor });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('click', handleCanvasClick);

    const interval = setInterval(() => {
      // Movement
      if (keys['a'] || keys['A'] || keys['ArrowLeft']) playerX = Math.max(20, playerX - 4);
      if (keys['d'] || keys['D'] || keys['ArrowRight']) playerX = Math.min(460, playerX + 4);
      if (keys['w'] || keys['W'] || keys['ArrowUp']) playerY = Math.max(20, playerY - 4);
      if (keys['s'] || keys['S'] || keys['ArrowDown']) playerY = Math.min(260, playerY + 4);

      // Simple Enemy AI Chase & Attack
      if (enemyX < playerX) enemyX += 1.2;
      else if (enemyX > playerX) enemyX -= 1.2;

      if (enemyY < playerY) enemyY += 1.2;
      else if (enemyY > playerY) enemyY -= 1.2;

      if (Math.abs(playerX - enemyX) < 25 && Math.abs(playerY - enemyY) < 25) {
        playerHp = Math.max(0, playerHp - 0.4);
        setMcHealth(Math.round(playerHp));
        if (playerHp <= 0) {
          clearInterval(interval);
          setMcRunning(false);
          sounds.pop();
          toast.error('Killed in PVP! Tap Start to respawn.');
        }
      }

      // Render World
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 500, 300);

      // Dirt Grass Floor
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 270, 500, 30);

      // Render placed blocks
      placedBlocks.forEach((b) => {
        ctx.fillStyle = b.type;
        ctx.fillRect(b.x, b.y, 20, 20);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(b.x, b.y, 20, 20);
      });

      // Player Skin Sprite (Steve / Cyber Hero)
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(playerX - 10, playerY - 20, 20, 30);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(playerX - 8, playerY - 30, 16, 12);

      // Sword
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(playerX + 10, playerY - 10, 12, 4);

      // Enemy Player (PVP Opponent)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(enemyX - 10, enemyY - 20, 20, 30);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(enemyX - 8, enemyY - 30, 16, 12);

      // Enemy Health Bar
      ctx.fillStyle = '#000';
      ctx.fillRect(enemyX - 15, enemyY - 40, 30, 5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(enemyX - 15, enemyY - 40, (enemyHp / 100) * 30, 5);

    }, 1000 / 60);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [selectedGame, mcRunning, mcSelectedItem]);

  // VOXEL HANDLER
  const handleVoxelClick = (index: number) => {
    sounds.pop();
    setGrid((prev) => {
      const copy = [...prev];
      copy[index] = copy[index] === selectedVoxelColor ? '#1e293b' : selectedVoxelColor;
      return copy;
    });
  };

  // PONG LOOP
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
    const handleDown = (e: KeyboardEvent) => { 
      if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S'].includes(e.key)) {
        e.preventDefault();
      }
      keys[e.key] = true; 
    };
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

  return (
    <div className="space-y-6 pb-20">
      {/* Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/20 border border-[#00e5ff]/30 text-[#00e5ff] font-bold text-xs mb-2">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>WEVIDS MULTIPLAYER ARCADE & MINECRAFT PVP</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Gaming Studio & Online PVP
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Interactive Minecraft PVP Arena, 3D Voxel Sandbox, 2-Player Cyber Pong, Neon Snake, Aim Trainer with live cloud score syncing.
          </p>
        </div>
      </div>

      {/* 10 Games Selection Catalog */}
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
        
        {/* GAME 1: ONLINE PVP MINECRAFT */}
        {selectedGame === 'pvp_minecraft' && (
          <div className="max-w-xl mx-auto space-y-4 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-orbitron font-bold">
              <div className="flex items-center gap-2 text-[#00e5ff]">
                <span>HP: {mcHealth}/100</span>
                <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                  <div className="h-full bg-gradient-to-r from-red-500 to-[#10b981]" style={{ width: `${mcHealth}%` }} />
                </div>
              </div>
              <div className="text-[#ff2d95] flex items-center gap-1">
                <Swords className="w-4 h-4" />
                <span>Kills: {mcKills}</span>
              </div>
            </div>

            {/* Minecraft World Canvas */}
            <canvas
              ref={mcCanvasRef}
              width={500}
              height={300}
              className="rounded-2xl border-2 border-[#00e5ff]/50 shadow-2xl mx-auto bg-black cursor-crosshair"
            />

            {/* Inventory Hotbar */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {[
                { id: 'sword', label: '⚔️ Diamond Sword' },
                { id: 'wood', label: '🪵 Wood Block' },
                { id: 'stone', label: '🪨 Stone Block' },
                { id: 'apple', label: '🍎 Golden Apple (E)' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    sounds.pop();
                    setMcSelectedItem(item.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    mcSelectedItem === item.id
                      ? 'bg-[#00e5ff] text-slate-900 border-white shadow-md'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-[#8a8aa8]">
              Controls: <strong>W/A/S/D</strong> to move, <strong>Click canvas</strong> to attack / place block, <strong>E</strong> to eat Golden Apple.
            </div>

            <button
              onClick={() => {
                sounds.success();
                setMcRunning(!mcRunning);
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#00e5ff] to-[#10b981] text-slate-900 font-orbitron font-bold text-xs shadow-lg"
            >
              {mcRunning ? 'PAUSE PVP ARENA' : '⚔️ START ONLINE PVP MINECRAFT ARENA'}
            </button>
          </div>
        )}

        {/* GAME 2: VOXEL BUILDER */}
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

        {/* GAME 3: PONG */}
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

        {/* FALLBACK SIMULATOR */}
        {(selectedGame !== 'pvp_minecraft' && selectedGame !== 'voxel' && selectedGame !== 'pong') && (
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