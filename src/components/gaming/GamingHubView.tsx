import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, 
  Box, 
  RotateCcw, 
  Layers,
  CircleDot,
  Swords,
  Trophy,
  Sparkles
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';

export const GamingHubView: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<'voxel' | 'snake' | 'pong'>('voxel');

  // Snake State
  const snakeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeRunning, setSnakeRunning] = useState(false);

  // Pong State
  const pongCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pongRunning, setPongRunning] = useState(false);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);

  // Voxel State
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
    { name: 'Obsidian', color: '#1e1b4b' },
  ];

  const handleVoxelClick = (index: number) => {
    sounds.pop();
    setGrid((prev) => {
      const copy = [...prev];
      copy[index] = copy[index] === selectedVoxelColor ? '#1e293b' : selectedVoxelColor;
      return copy;
    });
  };

  // Snake Game Loop
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
        food = {
          x: Math.floor(Math.random() * 25),
          y: Math.floor(Math.random() * 25)
        };
      } else {
        snake.pop();
      }

      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, 300, 300);

      ctx.fillStyle = '#ff2d95';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff2d95';
      ctx.fillRect(food.x * 12, food.y * 12, 10, 10);

      ctx.fillStyle = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00e5ff';
      snake.forEach((part) => {
        ctx.fillRect(part.x * 12, part.y * 12, 10, 10);
      });
      ctx.shadowBlur = 0;
    }, 90);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKey);
    };
  }, [selectedGame, snakeRunning]);

  // Pong 2-Player Loop
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
      // P1 controls (W/S)
      if (keys['w'] || keys['W']) p1Y = Math.max(10, p1Y - 6);
      if (keys['s'] || keys['S']) p1Y = Math.min(230, p1Y + 6);

      // P2 controls (ArrowUp/ArrowDown or AI bot)
      if (keys['ArrowUp']) p2Y = Math.max(10, p2Y - 6);
      else if (keys['ArrowDown']) p2Y = Math.min(230, p2Y + 6);
      else {
        // Simple AI tracker
        if (p2Y + 30 < ballY) p2Y += 3.5;
        else if (p2Y + 30 > ballY) p2Y -= 3.5;
      }

      ballX += ballSpeedX;
      ballY += ballSpeedY;

      // Top/bottom bounce
      if (ballY <= 0 || ballY >= 290) {
        ballSpeedY = -ballSpeedY;
        sounds.pop();
      }

      // Left paddle hit
      if (ballX <= 25 && ballY >= p1Y && ballY <= p1Y + 60) {
        ballSpeedX = Math.abs(ballSpeedX);
        sounds.like();
      }

      // Right paddle hit
      if (ballX >= 325 && ballY >= p2Y && ballY <= p2Y + 60) {
        ballSpeedX = -Math.abs(ballSpeedX);
        sounds.like();
      }

      // Score left
      if (ballX < 0) {
        setP2Score(s => s + 1);
        ballX = 175; ballY = 150; ballSpeedX = 4;
      }

      // Score right
      if (ballX > 350) {
        setP1Score(s => s + 1);
        ballX = 175; ballY = 150; ballSpeedX = -4;
      }

      // Draw
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, 350, 300);

      // Center divider
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(175, 0); ctx.lineTo(175, 300);
      ctx.stroke();

      // P1 Paddle (Cyan)
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(15, p1Y, 10, 60);

      // P2 Paddle (Pink)
      ctx.fillStyle = '#ff2d95';
      ctx.fillRect(325, p2Y, 10, 60);

      // Ball
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
      {/* Header */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/20 border border-[#00e5ff]/30 text-[#00e5ff] font-bold text-xs mb-2">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>PLAYABLE MULTIPLAYER SANDBOX ENGINES</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Arcade & Voxel Studio
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Interactive Minecraft voxel builder, 2-Player Cyber Pong, and neon retro arcade classics.
          </p>
        </div>

        {/* Switcher */}
        <div className="flex items-center p-1.5 rounded-2xl bg-white/5 border border-white/10">
          <button
            onClick={() => {
              sounds.click();
              setSelectedGame('voxel');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
              selectedGame === 'voxel'
                ? 'bg-gradient-to-r from-[#10b981] to-[#00e5ff] text-slate-900 shadow-md'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            Voxel Builder
          </button>
          <button
            onClick={() => {
              sounds.click();
              setSelectedGame('pong');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
              selectedGame === 'pong'
                ? 'bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 shadow-md'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            2-Player Pong
          </button>
          <button
            onClick={() => {
              sounds.click();
              setSelectedGame('snake');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
              selectedGame === 'snake'
                ? 'bg-gradient-to-r from-[#ff2d95] to-[#fbbf24] text-slate-900 shadow-md'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            Neon Snake
          </button>
        </div>
      </div>

      {/* GAME 1: VOXEL BUILDER */}
      {selectedGame === 'voxel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
              <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#10b981]" />
                Voxel Material Palette
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {voxelBlocks.map((blk) => (
                  <button
                    key={blk.name}
                    onClick={() => {
                      sounds.pop();
                      setSelectedVoxelColor(blk.color);
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      selectedVoxelColor === blk.color
                        ? 'border-white bg-white/15 scale-105 shadow-md'
                        : 'border-white/5 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-md shadow-sm border border-white/20"
                      style={{ background: blk.color }}
                    />
                    <span className="text-white">{blk.name}</span>
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
                <RotateCcw className="w-3.5 h-3.5" /> Clear Canvas
              </button>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col items-center">
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
        </div>
      )}

      {/* GAME 2: 2-PLAYER CYBER PONG */}
      {selectedGame === 'pong' && (
        <div className="liquid-glass rounded-3xl p-6 border border-white/10 flex flex-col items-center max-w-lg mx-auto space-y-4">
          <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
            <div className="text-xs font-orbitron font-bold text-[#00e5ff]">P1 (You - W/S): {p1Score}</div>
            <div className="text-xs font-orbitron font-bold text-[#ff2d95]">P2 (AI/Keys ↑↓): {p2Score}</div>
          </div>

          <canvas
            ref={pongCanvasRef}
            width={350}
            height={300}
            className="rounded-2xl border border-[#00e5ff]/40 shadow-[0_0_30px_rgba(0,229,255,0.25)] bg-[#0a0a1a]"
          />

          <div className="text-center text-xs text-[#8a8aa8]">
            Player 1 uses <strong>W / S</strong>. Player 2 uses <strong>Up / Down</strong> arrows (or plays against AI).
          </div>

          <button
            onClick={() => {
              sounds.success();
              setPongRunning(!pongRunning);
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#ff2d95] text-slate-900 font-orbitron font-bold text-xs shadow-md hover:scale-102 transition-transform"
          >
            {pongRunning ? 'PAUSE BATTLE' : 'START 2-PLAYER PONG'}
          </button>
        </div>
      )}

      {/* GAME 3: NEON SNAKE */}
      {selectedGame === 'snake' && (
        <div className="liquid-glass rounded-3xl p-6 border border-white/10 flex flex-col items-center max-w-lg mx-auto space-y-4">
          <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
            <div className="font-orbitron font-bold text-sm text-[#ff2d95]">NEON SNAKE 2026</div>
            <div className="text-xs font-orbitron font-bold text-[#00e5ff]">Score: {snakeScore}</div>
          </div>

          <canvas
            ref={snakeCanvasRef}
            width={300}
            height={300}
            className="rounded-2xl border border-[#ff2d95]/40 shadow-[0_0_30px_rgba(255,45,149,0.25)] bg-[#0a0a1a]"
          />

          <button
            onClick={() => {
              sounds.success();
              setSnakeRunning(!snakeRunning);
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 font-orbitron font-bold text-xs shadow-md hover:scale-102 transition-transform"
          >
            {snakeRunning ? 'PAUSE GAME' : 'START / RESTART GAME'}
          </button>
        </div>
      )}
    </div>
  );
};