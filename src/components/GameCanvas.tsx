import React, { useRef, useEffect } from 'react';
import { GameRenderer } from '../game/renderer';
import { gameEngine } from '../game/gameEngine';
import { getZoneAt } from '../game/mapData';

interface Props {
  onTargetSelect: (entityId: string | null) => void;
  onZoneChange: (zoneName: string) => void;
  onOpenInventory: () => void;
  onOpenCharacter: () => void;
  onOpenQuests: () => void;
  onOpenShop: () => void;
}

export const GameCanvas: React.FC<Props> = ({
  onTargetSelect,
  onZoneChange,
  onOpenInventory,
  onOpenCharacter,
  onOpenQuests,
  onOpenShop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const cameraPosRef = useRef({ x: 550, y: 530 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new GameRenderer(canvas);
    rendererRef.current = renderer;

    const handleResize = () => {
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.resize(w, h);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Keyboard listener
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture inputs if typing in chat
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      gameEngine.keys[e.code] = true;

      // Hotkeys
      if (e.code === 'Space') {
        e.preventDefault();
        gameEngine.attack('space');
      } else if (e.code === 'Digit1') {
        e.preventDefault();
        gameEngine.attack('1');
      } else if (e.code === 'Digit2') {
        e.preventDefault();
        gameEngine.attack('2');
      } else if (e.code === 'Digit3') {
        e.preventDefault();
        gameEngine.attack('3');
      } else if (e.code === 'KeyQ') {
        e.preventDefault();
        const hpPot = gameEngine.localPlayer?.inventory.find((i) => i.id.startsWith('hp_potion'));
        if (hpPot) gameEngine.useItem(hpPot.id);
      } else if (e.code === 'KeyE') {
        e.preventDefault();
        const mpPot = gameEngine.localPlayer?.inventory.find((i) => i.id.startsWith('mp_potion'));
        if (mpPot) gameEngine.useItem(mpPot.id);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        gameEngine.toggleSit();
      } else if (e.code === 'KeyB' || e.code === 'KeyI') {
        e.preventDefault();
        onOpenInventory();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        onOpenCharacter();
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        onOpenQuests();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        onOpenShop();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameEngine.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse click handling: target selection or click-to-move
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clickScreenX = e.clientX - rect.left;
      const clickScreenY = e.clientY - rect.top;

      // Translate screen coordinates to world coordinates
      const cam = cameraPosRef.current;
      const worldX = clickScreenX - canvas.width / 2 + cam.x;
      const worldY = clickScreenY - canvas.height / 2 + cam.y;

      // Check if clicked an interactive town tent (Merchant / Guild)
      if (Math.hypot(worldX - 360, worldY - 380) < 60) {
        onOpenShop();
        return;
      }
      if (Math.hypot(worldX - 790, worldY - 380) < 60) {
        onOpenQuests();
        return;
      }

      // Check if clicked a monster
      let clickedMonsterId: string | null = null;
      gameEngine.monsters.forEach((m) => {
        if (m.state === 'dead') return;
        const radius = m.isBoss ? 40 : 25;
        if (Math.hypot(m.x - worldX, m.y - worldY) < radius) {
          clickedMonsterId = m.id;
        }
      });

      if (clickedMonsterId) {
        gameEngine.targetEntityId = clickedMonsterId;
        onTargetSelect(clickedMonsterId);
      } else {
        // Clicked ground: Click-to-move
        gameEngine.targetMovePos = { x: worldX, y: worldY };
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);

    // Main 60 FPS Game Loop
    let lastTime = performance.now();
    let animationFrameId: number;

    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000);
      lastTime = time;

      // 1. Update Game Engine (local movement, physics)
      gameEngine.update(dt);

      // 2. Smooth Camera Lerp
      if (gameEngine.localPlayer) {
        const lp = gameEngine.localPlayer;
        cameraPosRef.current.x += (lp.x - cameraPosRef.current.x) * 0.12;
        cameraPosRef.current.y += (lp.y - cameraPosRef.current.y) * 0.12;

        // Check Zone
        const currentZone = getZoneAt(lp.x, lp.y);
        onZoneChange(currentZone.name);
      }

      // 3. Render World
      renderer.render(
        gameEngine.localPlayer,
        Array.from(gameEngine.otherPlayers.values()),
        gameEngine.monsters,
        gameEngine.loot,
        gameEngine.floatingTexts,
        gameEngine.spellEffects,
        gameEngine.targetEntityId,
        cameraPosRef.current.x,
        cameraPosRef.current.y
      );

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair select-none"
      />
    </div>
  );
};
