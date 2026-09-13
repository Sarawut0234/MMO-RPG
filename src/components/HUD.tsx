import React, { useRef, useEffect } from 'react';
import { Player, Monster } from '../types/game';
import { CLASS_SKILLS, ITEMS } from '../data/gameData';
import { MAP_WIDTH, MAP_HEIGHT, WORLD_ZONES } from '../game/mapData';
import {
  Shield,
  Backpack,
  User,
  Scroll,
  Store,
  Trophy,
  Volume2,
  VolumeX,
  Compass,
  Zap,
  Coffee,
  Heart,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  player: Player | null;
  targetMonster: Monster | null;
  worldBoss: Monster | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenInventory: () => void;
  onOpenCharacter: () => void;
  onOpenQuests: () => void;
  onOpenShop: () => void;
  onOpenLeaderboard: () => void;
  onSkillClick: (key: string) => void;
  onUsePotion: (type: 'hp' | 'mp') => void;
  onToggleSit: () => void;
  onRevive: () => void;
  activeZoneName: string;
}

export const HUD: React.FC<Props> = ({
  player,
  targetMonster,
  worldBoss,
  soundEnabled,
  onToggleSound,
  onOpenInventory,
  onOpenCharacter,
  onOpenQuests,
  onOpenShop,
  onOpenLeaderboard,
  onSkillClick,
  onUsePotion,
  onToggleSit,
  onRevive,
  activeZoneName,
}) => {
  const miniMapRef = useRef<HTMLCanvasElement>(null);

  // Mini-map radar rendering
  useEffect(() => {
    const canvas = miniMapRef.current;
    if (!canvas || !player) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Map background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Zones preview
    WORLD_ZONES.forEach((z) => {
      const zx = (z.x / MAP_WIDTH) * w;
      const zy = (z.y / MAP_HEIGHT) * h;
      const zw = (z.width / MAP_WIDTH) * w;
      const zh = (z.height / MAP_HEIGHT) * h;

      if (z.isSafeZone) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
      } else if (z.name.includes('Crypt')) {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
      } else if (z.name.includes('Caldera')) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      } else {
        ctx.fillStyle = 'rgba(100, 116, 139, 0.15)';
      }
      ctx.fillRect(zx, zy, zw, zh);
    });

    // Town fountain dot (safe zone mark)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc((550 / MAP_WIDTH) * w, (500 / MAP_HEIGHT) * h, 3, 0, Math.PI * 2);
    ctx.fill();

    // World Boss icon (if alive)
    if (worldBoss && worldBoss.state !== 'dead') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc((worldBoss.x / MAP_WIDTH) * w, (worldBoss.y / MAP_HEIGHT) * h, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Local Player dot (flashing cyan/gold)
    const px = (player.x / MAP_WIDTH) * w;
    const py = (player.y / MAP_HEIGHT) * h;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Direction arrow
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.stroke();
  }, [player, worldBoss]);

  if (!player) return null;

  const skills = CLASS_SKILLS[player.characterClass] || [];
  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const mpPercent = Math.max(0, Math.min(100, (player.mp / player.maxMp) * 100));
  const xpPercent = Math.max(0, Math.min(100, (player.xp / player.maxXp) * 100));

  // Check potion counts in inventory
  const hpPotions = player.inventory.filter((i) => i.id.startsWith('hp_potion'));
  const totalHpPotions = hpPotions.reduce((acc, cur) => acc + (cur.quantity || 1), 0);

  const mpPotions = player.inventory.filter((i) => i.id.startsWith('mp_potion'));
  const totalMpPotions = mpPotions.reduce((acc, cur) => acc + (cur.quantity || 1), 0);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-3 select-none">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Player Status Frame (Top-Left) */}
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 shadow-xl backdrop-blur-md">
          {/* Avatar Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-inner relative"
            style={{ backgroundColor: player.color || '#0284c7' }}
          >
            {player.name.charAt(0).toUpperCase()}
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-slate-950 border border-slate-700 text-[10px] text-amber-400 font-bold">
              {player.level}
            </span>
          </div>

          {/* Bars & Name */}
          <div className="w-44 sm:w-56 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs sm:text-sm text-slate-100 truncate max-w-[120px]">
                {player.name}
              </span>
              <span className="text-[10px] font-semibold text-amber-400 capitalize">
                {player.characterClass}
              </span>
            </div>

            {/* HP Bar */}
            <div className="h-3 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-200"
                style={{ width: `${hpPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow">
                {Math.round(player.hp)} / {player.maxHp} HP
              </span>
            </div>

            {/* MP Bar */}
            <div className="h-2.5 w-full bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-sky-600 to-cyan-500 transition-all duration-200"
                style={{ width: `${mpPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow">
                {Math.round(player.mp)} / {player.maxMp} MP
              </span>
            </div>

            {/* XP & Gold row */}
            <div className="flex items-center justify-between pt-0.5 text-[10px]">
              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-amber-400 font-bold">XP:</span>
                <span>{Math.round(xpPercent)}%</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-amber-400">
                <span>🪙</span>
                <span>{player.gold} G</span>
              </div>
            </div>
          </div>
        </div>

        {/* World Boss Bar (Top Center - Shows if Boss is Alive) */}
        {worldBoss && worldBoss.state !== 'dead' && (
          <div className="pointer-events-auto hidden md:flex flex-col items-center bg-slate-950/80 border border-rose-900/60 rounded-xl px-5 py-2 shadow-2xl backdrop-blur-md max-w-md w-full">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-rose-500 font-serif font-bold text-xs tracking-wider">
                💀 WORLD BOSS: {worldBoss.name} (Lv.{worldBoss.level})
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-900 rounded-full border border-rose-950 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 transition-all duration-300"
                style={{ width: `${(worldBoss.hp / worldBoss.maxHp) * 100}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                {Math.round(worldBoss.hp)} / {worldBoss.maxHp} ({Math.round((worldBoss.hp / worldBoss.maxHp) * 100)}%)
              </span>
            </div>
          </div>
        )}

        {/* Top-Right: Mini-Map & Menu Icons */}
        <div className="flex flex-col items-end gap-2">
          {/* Mini-Map Canvas */}
          <div className="pointer-events-auto bg-slate-900/90 border border-slate-700/80 rounded-xl p-1.5 shadow-xl backdrop-blur-md flex flex-col items-center">
            <div className="flex items-center justify-between w-full px-1 mb-1 text-[10px] text-slate-400">
              <div className="flex items-center gap-1 font-medium truncate max-w-[90px]">
                <Compass className="w-3 h-3 text-sky-400" />
                <span className="truncate">{activeZoneName}</span>
              </div>
              <span className="text-emerald-400 font-bold">RADAR</span>
            </div>
            <canvas
              ref={miniMapRef}
              width={110}
              height={85}
              className="rounded-lg border border-slate-800 bg-slate-950"
            />
          </div>

          {/* Quick Menu Action Buttons */}
          <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 shadow-lg backdrop-blur-md">
            <button
              onClick={onOpenCharacter}
              title="Character Stats [C]"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer relative"
            >
              <User className="w-4 h-4" />
              {player.stats.unallocatedPoints > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={onOpenInventory}
              title="Inventory Bag [B]"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <Backpack className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenQuests}
              title="Quest Log [L]"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <Scroll className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenShop}
              title="Merchant Shop [P]"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <Store className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenLeaderboard}
              title="Leaderboard [Tab]"
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>
      </div>

      {/* Target Info Frame (Floating top center-left if target selected) */}
      {targetMonster && targetMonster.state !== 'dead' && (
        <div className="pointer-events-auto self-center bg-slate-900/90 border border-rose-600/50 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-lg bg-rose-950/80 border border-rose-700/60 flex items-center justify-center font-bold text-rose-300 text-xs">
            {targetMonster.isBoss ? '👑' : '👾'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-100">{targetMonster.name}</span>
              <span className="text-[10px] text-amber-400 font-semibold">Lv.{targetMonster.level}</span>
            </div>
            <div className="w-36 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mt-1">
              <div
                className="h-full bg-rose-500 transition-all duration-150"
                style={{ width: `${(targetMonster.hp / targetMonster.maxHp) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {Math.round(targetMonster.hp)}/{targetMonster.maxHp}
          </span>
        </div>
      )}

      {/* Bottom Row: Hotbar & Quick Controls */}
      <div className="flex flex-col items-center gap-2">
        {/* Hotbar Slots */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-md">
          {/* Basic Attack Slot */}
          <button
            onClick={() => onSkillClick('space')}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 flex flex-col items-center justify-center cursor-pointer transition active:scale-95 group relative"
          >
            <span className="text-xl">⚔️</span>
            <span className="absolute bottom-1 right-1 text-[9px] font-bold text-slate-400 font-mono">
              SPACE
            </span>
            <span className="text-[9px] text-slate-300 font-medium leading-none">Attack</span>
          </button>

          {/* Skill 1 */}
          {skills[0] && (
            <button
              onClick={() => onSkillClick('1')}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-800 hover:bg-slate-700 border border-sky-500/50 flex flex-col items-center justify-center cursor-pointer transition active:scale-95 group relative"
            >
              <span className="text-xl">{skills[0].icon}</span>
              <span className="absolute bottom-1 right-1 text-[9px] font-bold text-sky-400 font-mono">
                1
              </span>
              <span className="text-[8px] text-slate-300 font-medium truncate max-w-[44px] leading-none">
                {skills[0].name.split(' ')[0]}
              </span>
            </button>
          )}

          {/* Skill 2 */}
          {skills[1] && (
            <button
              onClick={() => onSkillClick('2')}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-800 hover:bg-slate-700 border border-indigo-500/50 flex flex-col items-center justify-center cursor-pointer transition active:scale-95 group relative"
            >
              <span className="text-xl">{skills[1].icon}</span>
              <span className="absolute bottom-1 right-1 text-[9px] font-bold text-indigo-400 font-mono">
                2
              </span>
              <span className="text-[8px] text-slate-300 font-medium truncate max-w-[44px] leading-none">
                {skills[1].name.split(' ')[0]}
              </span>
            </button>
          )}

          {/* Skill 3 */}
          {skills[2] && (
            <button
              onClick={() => onSkillClick('3')}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/50 flex flex-col items-center justify-center cursor-pointer transition active:scale-95 group relative"
            >
              <span className="text-xl">{skills[2].icon}</span>
              <span className="absolute bottom-1 right-1 text-[9px] font-bold text-amber-400 font-mono">
                3
              </span>
              <span className="text-[8px] text-slate-300 font-medium truncate max-w-[44px] leading-none">
                {skills[2].name.split(' ')[0]}
              </span>
            </button>
          )}

          <div className="w-[1px] h-8 bg-slate-700 mx-0.5" />

          {/* HP Potion Slot [Q] */}
          <button
            onClick={() => onUsePotion('hp')}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-700/60 flex flex-col items-center justify-center cursor-pointer transition active:scale-95 relative"
          >
            <span className="text-xl">🧪</span>
            <span className="absolute top-1 left-1 px-1 rounded bg-slate-900 text-[9px] font-bold text-rose-400 font-mono">
              Q
            </span>
            <span className="absolute bottom-1 right-1 px-1 rounded bg-rose-950 text-[9px] font-bold text-white">
              {totalHpPotions}
            </span>
          </button>

          {/* MP Potion Slot [E] */}
          <button
            onClick={() => onUsePotion('mp')}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-sky-950/40 hover:bg-sky-900/50 border border-sky-700/60 flex flex-col items-center justify-center cursor-pointer transition active:scale-95 relative"
          >
            <span className="text-xl">💧</span>
            <span className="absolute top-1 left-1 px-1 rounded bg-slate-900 text-[9px] font-bold text-sky-400 font-mono">
              E
            </span>
            <span className="absolute bottom-1 right-1 px-1 rounded bg-sky-950 text-[9px] font-bold text-white">
              {totalMpPotions}
            </span>
          </button>

          {/* Rest / Sit Slot [R] */}
          <button
            onClick={onToggleSit}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition active:scale-95 relative ${
              player.isSitting
                ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <Coffee className="w-5 h-5" />
            <span className="absolute bottom-1 right-1 text-[9px] font-bold font-mono">R</span>
            <span className="text-[8px] font-medium leading-none">{player.isSitting ? 'Resting' : 'Sit'}</span>
          </button>
        </div>
      </div>

      {/* Death Screen Overlay */}
      {player.hp <= 0 && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border border-rose-800/80 rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-700 text-rose-500 text-2xl flex items-center justify-center mx-auto">
              💀
            </div>
            <h2 className="text-2xl font-serif font-bold text-rose-400">YOU HAVE FALLEN</h2>
            <p className="text-slate-400 text-sm">
              ท่านได้พ่ายแพ้ในการต่อสู้ ร่างวิญญาณจะถูกนำกลับไปคืนชีพที่น้ำพุศักดิ์สิทธิ์ ณ เมืองเอลโดเรีย
            </p>
            <button
              onClick={onRevive}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 fill-current" />
              คืนชีพที่น้ำพุเมืองหลวง (Revive at Sanctuary)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
