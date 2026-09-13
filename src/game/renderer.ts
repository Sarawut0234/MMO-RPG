import { Player, Monster, LootDrop, FloatingText, SpellEffect } from '../types/game';
import { MAP_WIDTH, MAP_HEIGHT, WORLD_ZONES, MAP_DECORATIONS } from './mapData';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public render(
    localPlayer: Player | null,
    players: Player[],
    monsters: Monster[],
    loot: LootDrop[],
    floatingTexts: FloatingText[],
    spellEffects: SpellEffect[],
    targetEntityId: string | null,
    cameraX: number,
    cameraY: number
  ) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.animTime = performance.now() * 0.001;

    // Clear Screen
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    // Center camera on target
    ctx.translate(Math.floor(width / 2 - cameraX), Math.floor(height / 2 - cameraY));

    // 1. Draw World Tiles & Boundaries
    this.drawWorldTerrain(ctx, cameraX, cameraY, width, height);

    // 2. Draw Map Decorations & Buildings
    this.drawDecorations(ctx);

    // 3. Draw Ground Loot
    this.drawLoot(ctx, loot);

    // 4. Draw Monsters
    this.drawMonsters(ctx, monsters, targetEntityId);

    // 5. Draw Other Players & Local Player
    this.drawPlayers(ctx, players, localPlayer, targetEntityId);

    // 6. Draw Spell & Projectile Effects
    this.drawSpellEffects(ctx, spellEffects);

    // 7. Draw Floating Combat Text
    this.drawFloatingTexts(ctx, floatingTexts);

    ctx.restore();
  }

  private drawWorldTerrain(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number
  ) {
    // Map Outer Border
    ctx.fillStyle = '#05070c';
    ctx.fillRect(-200, -200, MAP_WIDTH + 400, MAP_HEIGHT + 400);

    // Base background
    ctx.fillStyle = '#162319';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Draw Zones
    WORLD_ZONES.forEach((zone) => {
      if (zone.isSafeZone) {
        // Town Cobblestone & Manicured Lawn
        ctx.fillStyle = '#1c2826';
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

        // Cobblestone Main Plaza
        ctx.fillStyle = '#2f3b39';
        ctx.fillRect(zone.x + 80, zone.y + 80, zone.width - 160, zone.height - 160);

        // Stone pathway patterns
        ctx.strokeStyle = '#3e4d4a';
        ctx.lineWidth = 1;
        const step = 40;
        for (let x = zone.x + 80; x < zone.x + zone.width - 80; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, zone.y + 80);
          ctx.lineTo(x, zone.y + zone.height - 80);
          ctx.stroke();
        }
        for (let y = zone.y + 80; y < zone.y + zone.height - 80; y += step) {
          ctx.beginPath();
          ctx.moveTo(zone.x + 80, y);
          ctx.lineTo(zone.x + zone.width - 80, y);
          ctx.stroke();
        }

        // Town Stone Wall Border
        ctx.strokeStyle = '#5a6b68';
        ctx.lineWidth = 6;
        ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
      } else if (zone.name.includes('Crypt')) {
        // Crypt Dark Stone Tiles
        ctx.fillStyle = '#15131f';
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

        // Crypt Floor Grid
        ctx.strokeStyle = '#232033';
        ctx.lineWidth = 2;
        const step = 60;
        for (let x = zone.x; x < zone.x + zone.width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, zone.y);
          ctx.lineTo(x, zone.y + zone.height);
          ctx.stroke();
        }
        for (let y = zone.y; y < zone.y + zone.height; y += step) {
          ctx.beginPath();
          ctx.moveTo(zone.x, y);
          ctx.lineTo(zone.x + zone.width, y);
          ctx.stroke();
        }

        // Cursed Rune Circles
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(zone.x + zone.width / 2, zone.y + zone.height / 2, 120, 0, Math.PI * 2);
        ctx.stroke();
      } else if (zone.name.includes('Caldera')) {
        // Volcanic Basalt Ground
        ctx.fillStyle = '#1e1112';
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

        // Lava Cracks / Ambient Glow
        ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

        // Molten Boss Ring
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(zone.x + zone.width / 2, zone.y + zone.height / 2, 220, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Forest Zone Grass & Paths
        ctx.fillStyle = '#1b2d1c';
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

        // Subtle dirt paths
        ctx.fillStyle = '#2d271a';
        ctx.fillRect(zone.x, zone.y + 400, zone.width, 70);
        ctx.fillRect(zone.x + 600, zone.y, 70, zone.height);
      }

      // Zone Boundary Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 2;
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
    });

    // Outer Boundary Wall
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  }

  private drawDecorations(ctx: CanvasRenderingContext2D) {
    const t = this.animTime;

    MAP_DECORATIONS.forEach((dec) => {
      ctx.save();
      if (dec.type === 'fountain') {
        // Circular Marble Fountain
        const cx = dec.x + dec.width / 2;
        const cy = dec.y + dec.height / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 8, dec.width / 2 + 6, dec.height / 2 + 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Basin Stone
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(cx, cy, dec.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Water with ripples
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(cx, cy, dec.width / 2 - 8, 0, Math.PI * 2);
        ctx.fill();

        // Animated Water Ripples
        const ripple = (t * 2) % 1;
        ctx.strokeStyle = `rgba(186, 230, 253, ${1 - ripple})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, (dec.width / 2 - 10) * ripple, 0, Math.PI * 2);
        ctx.stroke();

        // Center Pillar
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();

        // Water Sprinkles
        ctx.fillStyle = '#e0f2fe';
        for (let i = 0; i < 4; i++) {
          const ang = t * 3 + (i * Math.PI) / 2;
          const dist = 16 + Math.sin(t * 5 + i) * 6;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Label
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💧 Fountain of Life (HP/MP Regen)', cx, cy - dec.height / 2 - 12);
      } else if (dec.type === 'tent') {
        // Merchant Stall
        const cx = dec.x + dec.width / 2;
        const cy = dec.y + dec.height / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(dec.x - 4, dec.y + dec.height - 10, dec.width + 8, 14);

        // Counter Desk
        ctx.fillStyle = '#78350f';
        ctx.fillRect(dec.x, dec.y + 20, dec.width, dec.height - 20);

        // Striped Awning Roof
        const isShop = dec.label?.includes('Store');
        const roofColor1 = isShop ? '#f59e0b' : '#3b82f6';
        const roofColor2 = '#f8fafc';
        const stripes = 5;
        const stripeW = dec.width / stripes;
        for (let s = 0; s < stripes; s++) {
          ctx.fillStyle = s % 2 === 0 ? roofColor1 : roofColor2;
          ctx.fillRect(dec.x + s * stripeW, dec.y, stripeW, 25);
        }

        // Signboard Label
        ctx.fillStyle = isShop ? '#fbbf24' : '#60a5fa';
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(dec.label || '', cx, dec.y - 8);
      } else if (dec.type === 'dummy') {
        // Wooden Practice Dummy
        const cx = dec.x + dec.width / 2;
        const cy = dec.y + dec.height / 2;
        // Post
        ctx.fillStyle = '#92400e';
        ctx.fillRect(cx - 4, cy - 14, 8, 30);
        // Straw body
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(cx, cy - 4, 12, 0, Math.PI * 2);
        ctx.fill();
        // Arms
        ctx.fillRect(cx - 16, cy - 8, 32, 6);
      } else if (dec.type === 'tree') {
        // Forest Tree
        const cx = dec.x + dec.width / 2;
        const cy = dec.y + dec.height - 15;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(cx + 4, cy + 6, dec.width / 2, dec.height / 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        ctx.fillStyle = '#543d2b';
        ctx.fillRect(cx - 6, cy - 20, 12, 22);

        // Canopy Layer 1 (Dark)
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(cx, cy - 35, dec.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Canopy Layer 2 (Light)
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(cx - 4, cy - 40, dec.width / 2 - 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (dec.type === 'column') {
        // Ancient Stone Pillar
        const cx = dec.x + dec.width / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(dec.x, dec.y + dec.height - 8, dec.width, 12);

        ctx.fillStyle = '#475569';
        ctx.fillRect(dec.x, dec.y, dec.width, dec.height);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(dec.x + 4, dec.y + 4, dec.width - 8, 10);
        ctx.fillRect(dec.x + 4, dec.y + dec.height - 14, dec.width - 8, 10);

        if (dec.label) {
          ctx.fillStyle = '#c084fc';
          ctx.font = '11px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(dec.label, cx, dec.y - 8);
        }
      } else if (dec.type === 'lava_pool') {
        // Molten Lava
        const cx = dec.x + dec.width / 2;
        const cy = dec.y + dec.height / 2;
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.ellipse(cx, cy, dec.width / 2, dec.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glowing core
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(cx, cy, dec.width / 2 - 12, dec.height / 2 - 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Lava bubbles
        ctx.fillStyle = '#fef08a';
        const bubbleR = 4 + Math.sin(t * 4 + dec.x) * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(t * 2) * 18, cy + Math.sin(t * 3) * 12, Math.max(1, bubbleR), 0, Math.PI * 2);
        ctx.fill();
      } else if (dec.type === 'lantern') {
        // Town Post Lantern
        const cx = dec.x + dec.width / 2;
        const cy = dec.y + dec.height / 2;
        ctx.fillStyle = '#334155';
        ctx.fillRect(cx - 3, cy - 16, 6, 32);

        // Lantern Glass
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(cx, cy - 16, 6, 0, Math.PI * 2);
        ctx.fill();

        // Warm radial light glow
        const glow = ctx.createRadialGradient(cx, cy - 16, 2, cx, cy - 16, 45);
        glow.addColorStop(0, 'rgba(254, 240, 138, 0.25)');
        glow.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy - 16, 45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  private drawLoot(ctx: CanvasRenderingContext2D, lootList: LootDrop[]) {
    const t = this.animTime;
    lootList.forEach((loot) => {
      ctx.save();
      const bounce = Math.sin(t * 5 + loot.x) * 4;
      const x = loot.x;
      const y = loot.y + bounce;

      // Glow aura by rarity
      let glowColor = 'rgba(255, 255, 255, 0.4)';
      if (loot.item.rarity === 'rare') glowColor = 'rgba(59, 130, 246, 0.6)';
      if (loot.item.rarity === 'epic') glowColor = 'rgba(168, 85, 247, 0.7)';
      if (loot.item.rarity === 'legendary') glowColor = 'rgba(245, 158, 11, 0.8)';
      if (loot.gold) glowColor = 'rgba(234, 179, 8, 0.7)';

      const grad = ctx.createRadialGradient(x, y, 2, x, y, 20);
      grad.addColorStop(0, glowColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();

      // Item Icon / Coin
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(loot.gold ? '🪙' : loot.item.icon, x, y);

      // Label
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = loot.gold ? '#facc15' : '#e2e8f0';
      ctx.fillText(loot.gold ? `${loot.gold} Gold` : loot.item.name, x, y + 16);

      ctx.restore();
    });
  }

  private drawMonsters(
    ctx: CanvasRenderingContext2D,
    monsters: Monster[],
    targetEntityId: string | null
  ) {
    const t = this.animTime;

    monsters.forEach((mon) => {
      if (mon.state === 'dead') return;
      ctx.save();

      const x = mon.x;
      const y = mon.y;
      const isTargeted = targetEntityId === mon.id;

      // Target Reticle
      if (isTargeted) {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        const reticleR = mon.isBoss ? 48 : 26;
        ctx.beginPath();
        ctx.arc(x, y, reticleR + Math.sin(t * 8) * 3, 0, Math.PI * 2);
        ctx.stroke();

        // Rotating targeting pointers
        ctx.translate(x, y);
        ctx.rotate(t * 3);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-reticleR - 6, -2, 6, 4);
        ctx.fillRect(reticleR, -2, 6, 4);
        ctx.fillRect(-2, -reticleR - 6, 4, 6);
        ctx.fillRect(-2, reticleR, 4, 6);
        ctx.restore();
      }

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      const shadowR = mon.isBoss ? 36 : 14;
      ctx.ellipse(x, y + (mon.isBoss ? 28 : 12), shadowR, shadowR * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Render Monster Avatar according to Type
      if (mon.type === 'slime') {
        const bounce = Math.abs(Math.sin(t * 5 + mon.x)) * 6;
        const stretch = 1 + Math.sin(t * 5 + mon.x) * 0.15;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(x, y - bounce, 16 * stretch, 13 / stretch, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - 5, y - 3 - bounce, 3.5, 0, Math.PI * 2);
        ctx.arc(x + 5, y - 3 - bounce, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(x - 4, y - 3 - bounce, 1.8, 0, Math.PI * 2);
        ctx.arc(x + 6, y - 3 - bounce, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (mon.type === 'goblin') {
        // Goblin Body
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.arc(x, y - 8, 14, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.fillStyle = '#65a30d';
        ctx.beginPath();
        ctx.moveTo(x - 14, y - 8);
        ctx.lineTo(x - 22, y - 14);
        ctx.lineTo(x - 10, y - 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 14, y - 8);
        ctx.lineTo(x + 22, y - 14);
        ctx.lineTo(x + 10, y - 2);
        ctx.fill();
        // Red eyes
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x - 6, y - 10, 3, 3);
        ctx.fillRect(x + 3, y - 10, 3, 3);
        // Club / Dagger
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + 12, y - 6, 4, 14);
      } else if (mon.type === 'skeleton') {
        // Skeleton Bones
        ctx.fillStyle = '#e2e8f0';
        // Skull
        ctx.beginPath();
        ctx.arc(x, y - 14, 10, 0, Math.PI * 2);
        ctx.fill();
        // Ribs
        ctx.fillRect(x - 6, y - 4, 12, 12);
        // Blue fire eyes
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x - 4, y - 16, 3, 3);
        ctx.fillRect(x + 1, y - 16, 3, 3);
        // Rusty sword
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x + 10, y - 14, 3, 20);
      } else if (mon.type === 'fire_elemental') {
        // Magma Fiend Core
        const pulse = 1 + Math.sin(t * 6) * 0.15;
        const grad = ctx.createRadialGradient(x, y - 10, 4, x, y - 10, 24);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.5, '#ea580c');
        grad.addColorStop(1, 'rgba(185, 28, 28, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y - 10, 22 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting Obsidian rocks
        ctx.fillStyle = '#1c1917';
        for (let i = 0; i < 3; i++) {
          const ang = t * 4 + (i * Math.PI * 2) / 3;
          ctx.fillRect(x + Math.cos(ang) * 24 - 4, y - 10 + Math.sin(ang) * 16 - 4, 8, 8);
        }
      } else if (mon.type === 'drake_boss') {
        // Infernal Drake World Boss
        const wingFlap = Math.sin(t * 4) * 14;

        // Big Red Dragon Wings
        ctx.fillStyle = '#991b1b';
        // Left Wing
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 10);
        ctx.lineTo(x - 55, y - 35 + wingFlap);
        ctx.lineTo(x - 30, y + 10);
        ctx.fill();
        // Right Wing
        ctx.beginPath();
        ctx.moveTo(x + 10, y - 10);
        ctx.lineTo(x + 55, y - 35 + wingFlap);
        ctx.lineTo(x + 30, y + 10);
        ctx.fill();

        // Main Dragon Body
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(x, y, 28, 0, Math.PI * 2);
        ctx.fill();

        // Dragon Head & Horns
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.arc(x, y - 22, 18, 0, Math.PI * 2);
        ctx.fill();

        // Horns
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 32);
        ctx.lineTo(x - 22, y - 48);
        ctx.lineTo(x - 4, y - 36);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 10, y - 32);
        ctx.lineTo(x + 22, y - 48);
        ctx.lineTo(x + 4, y - 36);
        ctx.fill();

        // Glowing Golden Eyes
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x - 8, y - 25, 4, 4);
        ctx.fillRect(x + 4, y - 25, 4, 4);

        // Fire embers trailing
        ctx.fillStyle = '#f97316';
        for (let i = 0; i < 4; i++) {
          const sparkX = x + Math.cos(t * 5 + i) * 25;
          const sparkY = y - 10 + Math.sin(t * 3 + i) * 15;
          ctx.fillRect(sparkX, sparkY, 3, 3);
        }
      }

      // Overhead HP Bar & Name
      const barW = mon.isBoss ? 70 : 34;
      const barH = mon.isBoss ? 7 : 4;
      const barY = mon.isBoss ? y - 56 : y - 28;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);

      const hpRatio = Math.max(0, Math.min(1, mon.hp / mon.maxHp));
      ctx.fillStyle = mon.isBoss ? '#ef4444' : '#22c55e';
      ctx.fillRect(x - barW / 2, barY, barW * hpRatio, barH);

      // Name & Level
      ctx.font = mon.isBoss ? 'bold 12px "Cinzel", serif' : '10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = mon.isBoss ? '#fca5a5' : '#f1f5f9';
      ctx.textAlign = 'center';
      ctx.fillText(`Lv.${mon.level} ${mon.name}`, x, barY - 4);

      ctx.restore();
    });
  }

  private drawPlayers(
    ctx: CanvasRenderingContext2D,
    players: Player[],
    localPlayer: Player | null,
    targetEntityId: string | null
  ) {
    const t = this.animTime;

    const allPlayers = [...players];
    if (localPlayer && !allPlayers.some((p) => p.id === localPlayer.id)) {
      allPlayers.push(localPlayer);
    }

    allPlayers.forEach((player) => {
      ctx.save();
      const x = player.x;
      const y = player.y;
      const isLocal = localPlayer?.id === player.id;
      const isTargeted = targetEntityId === player.id;

      // Selection ring
      if (isTargeted) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 22 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Local player indicator aura
      if (isLocal) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y + 8, 16, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x, y + 10, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Walk cycle bounce
      const isMoving = Math.abs(player.vx) > 1 || Math.abs(player.vy) > 1;
      const walkBob = isMoving ? Math.sin(t * 12) * 2.5 : 0;
      const drawY = player.isSitting ? y + 4 : y + walkBob;

      // Body / Robe / Armor
      let classColor = '#3b82f6'; // warrior blue
      if (player.characterClass === 'mage') classColor = '#8b5cf6'; // mage purple
      if (player.characterClass === 'archer') classColor = '#10b981'; // archer emerald
      if (player.characterClass === 'healer') classColor = '#f59e0b'; // priest amber

      // Sitting pose
      if (player.isSitting) {
        ctx.fillStyle = classColor;
        ctx.beginPath();
        ctx.arc(x, drawY, 11, 0, Math.PI * 2);
        ctx.fill();

        // Rest icon
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('💤', x + 10, drawY - 14);
      } else {
        // Torso
        ctx.fillStyle = player.color || classColor;
        ctx.beginPath();
        ctx.arc(x, drawY - 2, 10, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        const legOffset = isMoving ? Math.sin(t * 12) * 4 : 0;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x - 6, drawY + 6, 4, 7 + legOffset);
        ctx.fillRect(x + 2, drawY + 6, 4, 7 - legOffset);
      }

      // Head / Skin
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(x, drawY - 14, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Hair / Helmet by class
      if (player.characterClass === 'warrior') {
        // Steel Visor
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x - 8, drawY - 20, 16, 6);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x - 5, drawY - 15, 10, 2);
      } else if (player.characterClass === 'mage') {
        // Wizard Pointed Hat
        ctx.fillStyle = '#6d28d9';
        ctx.beginPath();
        ctx.moveTo(x - 10, drawY - 16);
        ctx.lineTo(x + 10, drawY - 16);
        ctx.lineTo(x, drawY - 28);
        ctx.fill();
      } else if (player.characterClass === 'archer') {
        // Green Ranger Hood
        ctx.fillStyle = '#065f46';
        ctx.beginPath();
        ctx.arc(x, drawY - 16, 9, Math.PI, 0);
        ctx.fill();
      } else if (player.characterClass === 'healer') {
        // Golden Priest Circlet
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x, drawY - 16, 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Weapon / Equipment in Hand
      ctx.save();
      if (player.characterClass === 'warrior') {
        // Broadsword
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x + 9, drawY - 12, 3, 16);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(x + 7, drawY + 2, 7, 3);
      } else if (player.characterClass === 'mage') {
        // Crystal Staff
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + 8, drawY - 16, 2.5, 22);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(x + 9, drawY - 18, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (player.characterClass === 'archer') {
        // Wooden Bow
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + 10, drawY - 3, 9, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      } else if (player.characterClass === 'healer') {
        // Golden Scepter
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x + 8, drawY - 14, 2.5, 18);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(x + 9, drawY - 16, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Overhead HP Bar
      const barW = 30;
      const barH = 3.5;
      const barY = drawY - 29;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x - barW / 2 - 1, barY - 1, barW + 2, barH + 2);

      const hpRatio = Math.max(0, Math.min(1, player.hp / player.maxHp));
      ctx.fillStyle = isLocal ? '#38bdf8' : '#22c55e';
      ctx.fillRect(x - barW / 2, barY, barW * hpRatio, barH);

      // Name & Title
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = isLocal ? '#38bdf8' : '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(`${player.name} (Lv.${player.level})`, x, barY - 4);

      if (player.title) {
        ctx.font = '9px "Cinzel", serif';
        ctx.fillStyle = '#f59e0b';
        ctx.fillText(`<${player.title}>`, x, barY - 16);
      }

      // Chat Bubble if active
      if (player.chatBubble && player.chatBubble.timer > 0) {
        const text = player.chatBubble.text;
        ctx.font = '11px "Plus Jakarta Sans", sans-serif';
        const textWidth = ctx.measureText(text).width;
        const bubbleW = textWidth + 16;
        const bubbleH = 22;
        const bubbleY = barY - 32;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;

        // Rounded bubble
        ctx.beginPath();
        ctx.roundRect(x - bubbleW / 2, bubbleY - bubbleH, bubbleW, bubbleH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.fillText(text, x, bubbleY - 7);
      }

      ctx.restore();
    });
  }

  private drawSpellEffects(ctx: CanvasRenderingContext2D, spellEffects: SpellEffect[]) {
    const t = this.animTime;

    spellEffects.forEach((spell) => {
      ctx.save();
      const age = performance.now() - spell.createdAt;
      const progress = Math.min(1, age / spell.duration);

      if (spell.type === 'whirlwind') {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(spell.x, spell.y, spell.radius * (0.4 + progress * 0.6), 0, Math.PI * 2);
        ctx.stroke();
      } else if (spell.type === 'slash') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(spell.x, spell.y, spell.radius, -Math.PI / 4, Math.PI / 4);
        ctx.stroke();
      } else if (spell.type === 'fireball') {
        const curX = spell.x + ((spell.targetX || spell.x) - spell.x) * progress;
        const curY = spell.y + ((spell.targetY || spell.y) - spell.y) * progress;

        const grad = ctx.createRadialGradient(curX, curY, 2, curX, curY, spell.radius);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.5, '#ea580c');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(curX, curY, spell.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (spell.type === 'frost_nova') {
        ctx.strokeStyle = `rgba(186, 230, 253, ${1 - progress})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(spell.x, spell.y, spell.radius * progress, 0, Math.PI * 2);
        ctx.stroke();
      } else if (spell.type === 'holy_heal') {
        ctx.strokeStyle = `rgba(253, 224, 71, ${1 - progress})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(spell.x, spell.y, spell.radius * progress, 0, Math.PI * 2);
        ctx.stroke();
      } else if (spell.type === 'smite') {
        // Divine Lightning Beam
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 6 * (1 - progress);
        ctx.beginPath();
        ctx.moveTo(spell.x, spell.y - 120);
        ctx.lineTo(spell.x, spell.y);
        ctx.stroke();
      } else if (spell.type === 'boss_breath') {
        // Cone of Flame
        ctx.fillStyle = `rgba(239, 68, 68, ${0.8 * (1 - progress)})`;
        ctx.beginPath();
        ctx.arc(spell.x, spell.y, spell.radius, -Math.PI / 3, Math.PI / 3);
        ctx.lineTo(spell.x, spell.y);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D, list: FloatingText[]) {
    const now = performance.now();
    list.forEach((ft) => {
      ctx.save();
      const age = now - ft.createdAt;
      const progress = Math.min(1, age / ft.duration);
      const floatY = ft.y - progress * 32;
      const alpha = 1 - progress;

      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';

      if (ft.type === 'crit') {
        ctx.font = 'bold 16px "Cinzel", serif';
      } else if (ft.type === 'level_up') {
        ctx.font = 'bold 18px "Cinzel", serif';
      } else {
        ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      }

      ctx.fillText(ft.text, ft.x, floatY);
      ctx.restore();
    });
  }
}
