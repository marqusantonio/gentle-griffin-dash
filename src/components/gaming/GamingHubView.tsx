import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, 
  Box, 
  Play, 
  RotateCcw, 
  Trophy, 
  Flame, 
  Sparkles, 
  Tv, 
  Layers,
  CircleDot
} from 'lucide-react';
import { sounds } from '../../lib/soundFx';

export const GamingHubView: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<'voxel' | 'snake'>('voxel');

  // Snake State
  const snakeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeRunning, setSnakeRunning] = useState(false);

  // Voxel Minecraft Mini-Simulator State
  const [grid, setGrid] = useState<string[]>(() => Array(100).fill('#1e293b'));
  const [selectedVoxelColor, setSelectedVoxelColor] = useState('#10b981'); // Grass default

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

  const handleResetVoxel = () => {
    sounds.click();
    setGrid(Array(100).fill('#1e293b'));
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

      // Wall wrap
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

      // Draw
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, 300, 300);

      // Food
      ctx.fillStyle = '#ff2d95';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff2d95';
      ctx.fillRect(food.x * 12, food.y * 12, 10, 10);

      // Snake
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

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="p-6 rounded-3xl liquid-glass border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/20 border border-[#00e5ff]/30 text-[#00e5ff] font-bold text-xs mb-2">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>PLAYABLE BROWSER ENGINES</span>
          </div>
          <h1 className="text-3xl font-bold font-orbitron neon-gradient-text tracking-wide">
            Gaming & Minecraft Sandbox
          </h1>
          <p className="text-xs text-[#8a8aa8]">
            Interactive voxel world builder, cyber mini-games, and live multiplayer streaming sandbox.
          </p>
        </div>

        {/* Game Switcher Tabs */}
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
            Voxel Sandbox
          </button>
          <button
            onClick={() => {
              sounds.click();
              setSelectedGame('snake');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-orbitron font-bold transition-all ${
              selectedGame === 'snake'
                ? 'bg-gradient-to-r from-[#ff2d95] to-[#00e5ff] text-slate-900 shadow-md'
                : 'text-[#8a8aa8] hover:text-white'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            Neon Snake
          </button>
        </div>
      </div>

      {/* GAME 1: MINECRAFT VOXEL SANDBOX */}
      {selectedGame === 'voxel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Palette Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="liquid-glass-card rounded-2xl p-5 border border-white/10 space-y-4">
              <h3 className="font-orbitron font-bold text-sm text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#10b981]" />
                Voxel Material Palette
              </h3>
              <p className="text-xs text-[#8a8aa8]">
                Select a block type and click any grid cell to build your custom Minecraft pixel structure.
              </p>

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

              <div className="pt-2 flex gap-2">
                <button
                  onClick={handleResetVoxel}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Grid
                </button>
              </div>
            </div>
          </div>

          {/* Voxel Grid Canvas */}
          <div className="lg:col-span-8">
            <div className="liquid-glass rounded-2xl p-6 border border-white/10 flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <span className="text-xs font-bold font-orbitron text-[#10b981]">
                  10x10 Mini Voxel Matrix
                </span>
                <span className="text-[11px] text-[#8a8aa8]">
                  Click to place / erase voxel blocks
                </span>
              </div>

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

      {/* GAME 2: NEON SNAKE */}
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

          <div className="text-center text-xs text-[#8a8aa8]">
            Use your keyboard <strong>Arrow Keys</strong> to direct the neon snake.
          </div>

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