import { useState, useEffect, useRef } from 'react';
import { Heart, Trophy, MousePointer2 } from 'lucide-react';
import { cn } from "@/lib/utils";

export const AsteroidGameFrame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  
  // Inactivity state
  const [inactive, setInactive] = useState(false);
  const lastActivity = useRef(Date.now());

  // Game State
  const gameState = useRef({
    player: { x: 0, y: 0, angle: 0 },
    bullets: [] as { x: number; y: number; dx: number; dy: number; life: number }[],
    asteroids: [] as { x: number; y: number; dx: number; dy: number; size: number }[],
    keys: { a: false, d: false },
    particles: [] as { x: number; y: number; dx: number; dy: number; life: number; color: string }[]
  });

  // Helper: Fire Bullet
  const fireBullet = () => {
    const state = gameState.current;
    // Fire from the tip of the ship
    state.bullets.push({
      x: state.player.x + Math.sin(state.player.angle) * 15,
      y: state.player.y - Math.cos(state.player.angle) * 15,
      dx: Math.sin(state.player.angle) * 7,
      dy: -Math.cos(state.player.angle) * 7,
      life: 100
    });
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') gameState.current.keys.a = true;
      if (key === 'd' || key === 'arrowright') gameState.current.keys.d = true;
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
        fireBullet();
      }
      
      // Reset inactivity
      lastActivity.current = Date.now();
      setInactive(false);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') gameState.current.keys.a = false;
      if (key === 'd' || key === 'arrowright') gameState.current.keys.d = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Only fire if clicking within the game area/canvas
      if (canvasRef.current && canvasRef.current.contains(e.target as Node)) {
        fireBullet();
        lastActivity.current = Date.now();
        setInactive(false);
      }
    };

    const handleMouseMove = () => {
      if (inactive) {
        lastActivity.current = Date.now();
        setInactive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [inactive]);

  // Inactivity Timer
  useEffect(() => {
    const checkActivity = setInterval(() => {
      if (Date.now() - lastActivity.current > 40000) { // 40 seconds
        setInactive(true);
      }
    }, 1000);
    return () => clearInterval(checkActivity);
  }, []);

  // Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    // --- INITIALIZE ASTEROIDS AT EDGES ---
    // This prevents the player (who is fixed at center) from being hit instantly
    const spawnAsteroid = (canvasW: number, canvasH: number) => {
      const edge = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
      let startX = 0, startY = 0;
      
      switch(edge) {
        case 0: startX = Math.random() * canvasW; startY = -30; break;
        case 1: startX = canvasW + 30; startY = Math.random() * canvasH; break;
        case 2: startX = Math.random() * canvasW; startY = canvasH + 30; break;
        case 3: startX = -30; startY = Math.random() * canvasH; break;
      }

      return {
        x: startX,
        y: startY,
        dx: (Math.random() - 0.5) * 1.5, // Slower, smoother movement
        dy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 15 + 10
      };
    };

    // Init
    for (let i = 0; i < 6; i++) {
      gameState.current.asteroids.push(spawnAsteroid(canvas.width, canvas.height));
    }

    const update = () => {
      if (!canvas) return;
      
      // Resize Logic
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      const state = gameState.current;

      // --- UPDATE STATE ---

      // 1. Player (FIXED CENTER)
      state.player.x = width / 2;
      state.player.y = height / 2;
      if (state.keys.a) state.player.angle -= 0.08;
      if (state.keys.d) state.player.angle += 0.08;

      // 2. Bullets
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.x += b.dx;
        b.y += b.dy;
        b.life--;
        
        // Add trail particle
        if (Math.random() > 0.5) {
          state.particles.push({ x: b.x, y: b.y, dx: 0, dy: 0, life: 10, color: '#0ea5e9' });
        }

        if (b.life <= 0 || b.x < -50 || b.x > width + 50 || b.y < -50 || b.y > height + 50) {
          state.bullets.splice(i, 1);
        }
      }

      // 3. Asteroids (Bubbles)
      for (let i = state.asteroids.length - 1; i >= 0; i--) {
        const a = state.asteroids[i];
        a.x += a.dx;
        a.y += a.dy;

        // Wrap around screen with buffer
        if (a.x < -50) a.x = width + 50;
        if (a.x > width + 50) a.x = -50;
        if (a.y < -50) a.y = height + 50;
        if (a.y > height + 50) a.y = -50;

        // Collision: Bullet -> Asteroid
        let hit = false;
        for (let j = state.bullets.length - 1; j >= 0; j--) {
          const b = state.bullets[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          if (dist < a.size + 2) { // +2 for bullet radius
            // Explosion particles
            for (let k = 0; k < 6; k++) {
               state.particles.push({
                 x: a.x, y: a.y,
                 dx: (Math.random() - 0.5) * 3,
                 dy: (Math.random() - 0.5) * 3,
                 life: 20,
                 color: '#ffffff'
               });
            }
            
            state.bullets.splice(j, 1);
            state.asteroids.splice(i, 1);
            setScore(s => s + 100);
            hit = true;
            
            // Respawn
            state.asteroids.push(spawnAsteroid(width, height));
            break; 
          }
        }
      }

      // 4. Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      // --- RENDER ---
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Subtle Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      const offsetX = Math.floor(width/2) % gridSize;
      const offsetY = Math.floor(height/2) % gridSize;
      for(let x = offsetX; x < width; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
      for(let y = offsetY; y < height; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

      // Draw Particles
      state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Asteroids (Clean Bubbles)
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      state.asteroids.forEach(a => {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Add "Bubble" highlight (small arc)
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.size - 4, Math.PI * 1.1, Math.PI * 1.4);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; // Reset
      });

      // Draw Bullets
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#0ea5e9';
      ctx.fillStyle = '#0ea5e9';
      state.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw Player (Triangle)
      ctx.save();
      ctx.translate(state.player.x, state.player.y);
      ctx.rotate(state.player.angle);
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#000';
      
      ctx.beginPath();
      ctx.moveTo(0, -15); // Tip
      ctx.lineTo(10, 15); // Bottom Right
      ctx.lineTo(0, 10);  // Center Notch
      ctx.lineTo(-10, 15); // Bottom Left
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      animationId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className={cn(
      "relative w-full aspect-video bg-black rounded-t-3xl border-t border-x border-white/10 overflow-hidden shadow-2xl group select-none",
      inactive && "border-red-500/50 shadow-[0_0_50px_rgba(220,38,38,0.2)]"
    )}>
      
      {/* HUD */}
      <div className="absolute top-6 left-8 z-30 flex items-center gap-4 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
          <Heart className="w-4 h-4 text-red-500 fill-current" />
          <span className="text-xs font-mono text-white font-bold">100%</span>
        </div>
      </div>
      
      <div className="absolute top-6 right-8 z-30 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-xs font-mono text-white font-bold">{score.toString().padStart(6, '0')}</span>
        </div>
      </div>

      {/* Inactivity Warning */}
      {inactive && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-red-950/20 backdrop-blur-[1px] pointer-events-none">
          <div className="bg-black/90 border border-red-500 px-8 py-4 rounded text-red-500 font-mono text-lg animate-bounce shadow-[0_0_30px_rgba(220,38,38,0.5)]">
            SYSTEM_IDLE // WAKE_UP_PILOT
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block cursor-crosshair" 
      />

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-black/90 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-6 z-30 pointer-events-none">
         <div className="flex items-center gap-6">
            <div className="flex gap-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest items-center">
               <div className="flex gap-1">
                 <span className="border border-white/20 bg-white/5 px-2 py-1 rounded text-white shadow-sm">A</span>
                 <span className="border border-white/20 bg-white/5 px-2 py-1 rounded text-white shadow-sm">D</span>
               </div>
               <span>Rotate</span>
            </div>
            <div className="flex gap-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest items-center">
               <div className="flex items-center gap-1 border border-white/20 bg-white/5 px-3 py-1 rounded text-white shadow-sm">
                 <MousePointer2 className="w-3 h-3" /> <span>Click</span>
               </div>
               <span>/ Space to Fire</span>
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
