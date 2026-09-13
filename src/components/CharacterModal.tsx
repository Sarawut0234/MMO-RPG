import React from 'react';
import { Player } from '../types/game';
import { X, Shield, Plus, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  player: Player | null;
  onClose: () => void;
  onAllocateStat: (stat: 'str' | 'agi' | 'int' | 'vit') => void;
}

export const CharacterModal: React.FC<Props> = ({ player, onClose, onAllocateStat }) => {
  if (!player) return null;

  const handleStat = (stat: 'str' | 'agi' | 'int' | 'vit') => {
    sound.playLevelUp();
    onAllocateStat(stat);
  };

  const eq = player.equipment;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif">{player.name}</h2>
            <div className="text-xs text-sky-400 font-medium">
              Lv.{player.level} {player.characterClass.toUpperCase()} • &lt;{player.title}&gt;
            </div>
          </div>
        </div>

        {/* Unallocated stat points banner */}
        {player.stats.unallocatedPoints > 0 && (
          <div className="mb-4 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-4 h-4" />
              แต้มอัปสเตตัสคงเหลือ: {player.stats.unallocatedPoints} แต้ม
            </div>
            <span className="text-[10px] text-amber-300">คลิกเครื่องหมาย + เพื่อเพิ่มค่าพลัง</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* STR */}
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">STR (ความแข็งแกร่ง)</span>
              <span className="text-lg font-bold text-rose-400">{player.stats.str}</span>
              <span className="text-[10px] text-slate-500 block">เพิ่มพลังโจมตีกายภาพ</span>
            </div>
            {player.stats.unallocatedPoints > 0 && (
              <button
                onClick={() => handleStat('str')}
                className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* AGI */}
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">AGI (ความว่องไว)</span>
              <span className="text-lg font-bold text-emerald-400">{player.stats.agi}</span>
              <span className="text-[10px] text-slate-500 block">เพิ่มคริติคอล & ความเร็ว</span>
            </div>
            {player.stats.unallocatedPoints > 0 && (
              <button
                onClick={() => handleStat('agi')}
                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* INT */}
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">INT (สติปัญญา)</span>
              <span className="text-lg font-bold text-sky-400">{player.stats.int}</span>
              <span className="text-[10px] text-slate-500 block">เพิ่มพลังเวท & หลอดมานา</span>
            </div>
            {player.stats.unallocatedPoints > 0 && (
              <button
                onClick={() => handleStat('int')}
                className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* VIT */}
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">VIT (ความอึด)</span>
              <span className="text-lg font-bold text-amber-400">{player.stats.vit}</span>
              <span className="text-[10px] text-slate-500 block">เพิ่มพลังป้องกัน & หลอดเลือด</span>
            </div>
            {player.stats.unallocatedPoints > 0 && (
              <button
                onClick={() => handleStat('vit')}
                className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Equipped Gear Showcase */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            อุปกรณ์สวมใส่ปัจจุบัน (Equipped Gear)
          </h3>
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block mb-1">Weapon</span>
              <span className="text-xl block">{eq.weapon?.icon || '—'}</span>
              <span className="text-[10px] text-slate-300 font-medium truncate block">
                {eq.weapon?.name || 'None'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block mb-1">Armor</span>
              <span className="text-xl block">{eq.armor?.icon || '—'}</span>
              <span className="text-[10px] text-slate-300 font-medium truncate block">
                {eq.armor?.name || 'None'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block mb-1">Helm</span>
              <span className="text-xl block">{eq.helm?.icon || '—'}</span>
              <span className="text-[10px] text-slate-300 font-medium truncate block">
                {eq.helm?.name || 'None'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block mb-1">Boots</span>
              <span className="text-xl block">{eq.boots?.icon || '—'}</span>
              <span className="text-[10px] text-slate-300 font-medium truncate block">
                {eq.boots?.name || 'None'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block mb-1">Accessory</span>
              <span className="text-xl block">{eq.accessory?.icon || '—'}</span>
              <span className="text-[10px] text-slate-300 font-medium truncate block">
                {eq.accessory?.name || 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Combat Record Stats */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            <span>จำนวนมอนสเตอร์ที่กำจัด: </span>
            <span className="font-bold text-slate-200">{player.kills}</span>
          </div>
          <div>
            <span>บอสโลกที่พิชิตได้: </span>
            <span className="font-bold text-amber-400">{player.bossKills} 👑</span>
          </div>
        </div>
      </div>
    </div>
  );
};
