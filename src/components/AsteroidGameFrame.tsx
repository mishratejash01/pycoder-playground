import { useState, useEffect, useRef } from 'react';
import { Heart, Trophy } from 'lucide-react';
import { cn } from "@/lib/utils";

export const AsteroidGameFrame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Game State Refs (to avoid re-renders during loop)
  const gameState = useRef({
    player: { x: 0, y: 0, angle: 0, dx: 0, dy: 0, dead: false },
    bullets: [] as { x: number; y: number; dx: number; dy: number; life: number }[],
    asteroids: [] as { x: number; y: number; dx: number; dy: number; size: number }[],
    keys: { w: false, a: false, d: false, space: false },
    lastShot: 0
  });

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w') gameState.current.keys.w = true;
      if (key === 'a') gameState.current.keys.a = true;
      if (key === 'd') gameState.current.keys.d = true;
      if (e.code === 'Space') gameState.current.keys.space = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w') gameState.current.keys.w = false;
      if (key === 'a') gameState.current.keys.a = false;
      if (key === 'd') gameState.current.keys.d = false;
      if (e.code === 'Space') gameState.current.keys.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize
    gameState.current.player = { x: canvas.width / 2, y: canvas.height / 2, angle: 0, dx: 0, dy: 0, dead: false };
    gameState.current.asteroids = [];
    for (let i = 0; i < 8; i++) {
      gameState.current.asteroids.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        size: Math.random() * 20 + 15
      });
    }

    let animationId: number;

    const update = () => {
      if (!canvas) return;
      
      // Resize handling
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const state = gameState.current;
      const width = canvas.width;
      const height = canvas.height;

      // --- PHYSICS ---
      if (!state.player.dead) {
        // Rotation
        if (state.keys.a) state.player.angle -= 0.07;
        if (state.keys.d) state.player.angle += 0.07;

        // Thrust
        if (state.keys.w) {
          state.player.dx += Math.sin(state.player.angle) * 0.1;
          state.player.dy -= Math.cos(state.player.angle) * 0.1;
        }

        // Friction
        state.player.dx *= 0.99;
        state.player.dy *= 0.99;

        // Move
        state.player.x += state.player.dx;
        state.player.y += state.player.dy;

        // Screen Wrap
        if (state.player.x < 0) state.player.x = width;
        if (state.player.x > width) state.player.x = 0;
        if (state.player.y < 0) state.player.y = height;
        if (state.player.y > height) state.player.y = 0;

        // Shoot
        if (state.keys.space && Date.now() - state.lastShot > 250) {
          state.bullets.push({
            x: state.player.x + Math.sin(state.player.angle) * 10,
            y: state.player.y - Math.cos(state.player.angle) * 10,
            dx: Math.sin(state.player.angle) * 5 + state.player.dx,
            dy: -Math.cos(state.player.angle) * 5 + state.player.dy,
            life: 60
          });
          state.lastShot = Date.now();
        }
      }

      // Update Bullets
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.x += b.dx;
        b.y += b.dy;
        b.life--;
        if (b.life <= 0 || b.x < 0 || b.x > width || b.y < 0 || b.y > height) {
          state.bullets.splice(i, 1);
        }
      }

      // Update Asteroids & Collisions
      for (let i = state.asteroids.length - 1; i >= 0; i--) {
        const a = state.asteroids[i];
        a.x += a.dx;
        a.y += a.dy;

        // Wrap asteroid
        if (a.x < -a.size) a.x = width + a.size;
        if (a.x > width + a.size) a.x = -a.size;
        if (a.y < -a.size) a.y = height + a.size;
        if (a.y > height + a.size) a.y = -a.size;

        // Collision Player
        if (!state.player.dead) {
           const dx = state.player.x - a.x;
           const dy = state.player.y - a.y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           if (dist < a.size + 10) { // Simple radius collision
              // Game Over Logic would go here
              // For this demo we just push player slightly
              state.player.dx -= dx * 0.05;
              state.player.dy -= dy * 0.05;
           }
        }

        // Collision Bullet
        for (let j = state.bullets.length - 1; j >= 0; j--) {
          const b = state.bullets[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          if (Math.sqrt(dx*dx + dy*dy) < a.size) {
            // Hit!
            state.bullets.splice(j, 1);
            state.asteroids.splice(i, 1);
            setScore(s => s + 100);
            
            // Spawn smaller ones if big enough
            if (a.size > 15) {
              for(let k=0; k<2; k++) {
                state.asteroids.push({
                  x: a.x, y: a.y,
                  dx: (Math.random() - 0.5) * 3,
                  dy: (Math.random() - 0.5) * 3,
                  size: a.size / 2
                });
              }
            }
            break; 
          }
        }
      }
      
      // Respawn asteroids if empty
      if (state.asteroids.length === 0) {
         for (let i = 0; i < 5; i++) {
            state.asteroids.push({
              x: Math.random() * width,
              y: Math.random() * height,
              dx: (Math.random() - 0.5) * 2,
              dy: (Math.random() - 0.5) * 2,
              size: Math.random() * 20 + 15
            });
         }
      }

      // --- RENDER ---
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for(let x=0; x<width; x+=gridSize) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke(); }
      for(let y=0; y<height; y+=gridSize) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }

      // Draw Player
      ctx.save();
      ctx.translate(state.player.x, state.player.y);
      ctx.rotate(state.player.angle);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(-10, 10);
      ctx.lineTo(0, 5);
      ctx.lineTo(10, 10);
      ctx.closePath();
      ctx.stroke();
      // Thruster
      if (state.keys.w) {
         ctx.strokeStyle = '#f59e0b'; // Amber
         ctx.beginPath();
         ctx.moveTo(-5, 12);
         ctx.lineTo(0, 20 + Math.random() * 5);
         ctx.lineTo(5, 12);
         ctx.stroke();
      }
      ctx.restore();

      // Draw Bullets
      ctx.fillStyle = '#0ea5e9'; // Sky blue
      state.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Asteroids
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      state.asteroids.forEach(a => {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
        ctx.stroke();
        // Detail line
        ctx.beginPath();
        ctx.moveTo(a.x - a.size/2, a.y);
        ctx.lineTo(a.x + a.size/2, a.y + a.size/3);
        ctx.stroke();
      });

      animationId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="relative w-full aspect-video bg-black rounded-t-3xl border-t border-x border-white/10 overflow-hidden shadow-2xl group">
      
      {/* Screen Glare & Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] pointer-events-none z-20 opacity-20" />
      <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none z-10" />

      {/* HUD */}
      <div className="absolute top-6 left-8 z-30 flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
          <Heart className="w-4 h-4 text-red-500 fill-current" />
          <span className="text-xs font-mono text-white font-bold">100%</span>
        </div>
      </div>
      
      <div className="absolute top-6 right-8 z-30">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-mono text-white font-bold">{score.toString().padStart(6, '0')}</span>
        </div>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Bottom Bar with Controls Guide */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-black/90 backdrop-blur border-t border-white/10 flex items-center justify-between px-6 z-30">
         <div className="flex items-center gap-6">
            <div className="flex gap-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest items-center">
               <div className="flex gap-1">
                 <span className="border border-white/20 bg-white/5 px-2 py-1 rounded text-white">W</span>
               </div>
               <span>Thrust</span>
            </div>
            <div className="flex gap-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest items-center">
               <div className="flex gap-1">
                 <span className="border border-white/20 bg-white/5 px-2 py-1 rounded text-white">A</span>
                 <span className="border border-white/20 bg-white/5 px-2 py-1 rounded text-white">D</span>
               </div>
               <span>Rotate</span>
            </div>
            <div className="flex gap-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest items-center">
               <span className="border border-white/20 bg-white/5 px-4 py-1 rounded text-white">SPACE</span>
               <span>Fire</span>
            </div>
         </div>
         
         <div className="flex items-center gap-2 text-gray-500 text-xs">
           <span>Built by</span>
           <span className="text-white font-bold">Neural AI</span>
         </div>
      </div>
    </div>
  );
};
