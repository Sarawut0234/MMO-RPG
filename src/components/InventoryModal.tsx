import React, { useState } from 'react';
import { Player, Item } from '../types/game';
import { X, Backpack, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  player: Player | null;
  onClose: () => void;
  onUseItem: (itemId: string) => void;
}

export const InventoryModal: React.FC<Props> = ({ player, onClose, onUseItem }) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  if (!player) return null;

  const items = player.inventory;
  const currentSelected = selectedItem || items[0] || null;

  const handleUse = (it: Item) => {
    onUseItem(it.id);
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-amber-500/60 bg-amber-500/10 text-amber-400';
      case 'epic':
        return 'border-purple-500/60 bg-purple-500/10 text-purple-400';
      case 'rare':
        return 'border-sky-500/60 bg-sky-500/10 text-sky-400';
      case 'uncommon':
        return 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400';
      default:
        return 'border-slate-700 bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 relative flex flex-col md:flex-row gap-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Inventory Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Backpack className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold font-serif">กระเป๋าสัมภาระ (Inventory)</h2>
            </div>
            <span className="text-xs text-slate-400">
              {items.length} / 24 ช่อง
            </span>
          </div>

          {/* Grid Slots (4x4 or more) */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 bg-slate-950/60 border border-slate-800 p-3 rounded-xl min-h-[220px]">
            {items.map((item, idx) => {
              const isSelected = currentSelected?.id === item.id;
              return (
                <button
                  key={`${item.id}-${idx}`}
                  onClick={() => {
                    setSelectedItem(item);
                    sound.playSlash();
                  }}
                  className={`w-13 h-13 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition relative ${
                    isSelected
                      ? 'bg-slate-800 border-sky-400 ring-2 ring-sky-500/30'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  {(item.quantity || 1) > 1 && (
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-amber-300 font-mono">
                      x{item.quantity}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Empty slots placeholders */}
            {Array.from({ length: Math.max(0, 15 - items.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-13 h-13 rounded-xl border border-dashed border-slate-800/60 bg-slate-950/20"
              />
            ))}
          </div>

          {/* Gold Balance */}
          <div className="mt-3 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">เหรียญทองติดตัว:</span>
            <span className="font-bold text-amber-400 flex items-center gap-1">
              🪙 {player.gold} Gold
            </span>
          </div>
        </div>

        {/* Right: Selected Item Details Panel */}
        <div className="w-full md:w-56 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          {currentSelected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                  {currentSelected.icon}
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-100">{currentSelected.name}</div>
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border mt-0.5 ${getRarityBadge(
                      currentSelected.rarity
                    )}`}
                  >
                    {currentSelected.rarity}
                  </span>
                </div>
              </div>

              {currentSelected.thaiName && (
                <div className="text-xs text-sky-400 font-medium">{currentSelected.thaiName}</div>
              )}

              <p className="text-xs text-slate-400 leading-relaxed">
                {currentSelected.description}
              </p>

              {/* Stats Preview */}
              {currentSelected.stats && (
                <div className="space-y-1 bg-slate-900/90 border border-slate-800/80 p-2 rounded-lg text-[11px]">
                  {currentSelected.stats.attack && (
                    <div className="text-rose-400 font-semibold">
                      ⚔️ Attack: +{currentSelected.stats.attack}
                    </div>
                  )}
                  {currentSelected.stats.defense && (
                    <div className="text-amber-400 font-semibold">
                      🛡️ Defense: +{currentSelected.stats.defense}
                    </div>
                  )}
                  {currentSelected.stats.maxHp && (
                    <div className="text-emerald-400 font-semibold">
                      ❤️ Max HP: +{currentSelected.stats.maxHp}
                    </div>
                  )}
                  {currentSelected.stats.maxMp && (
                    <div className="text-sky-400 font-semibold">
                      💧 Max MP: +{currentSelected.stats.maxMp}
                    </div>
                  )}
                  {currentSelected.stats.critChance && (
                    <div className="text-amber-300 font-semibold">
                      💥 Crit Rate: +{currentSelected.stats.critChance}%
                    </div>
                  )}
                </div>
              )}

              {/* Effect Preview */}
              {currentSelected.effect && (
                <div className="bg-slate-900/90 border border-slate-800/80 p-2 rounded-lg text-[11px] space-y-1">
                  {currentSelected.effect.healHp && (
                    <div className="text-emerald-400 font-semibold">
                      ✨ ฟื้นฟูเลือด: +{currentSelected.effect.healHp} HP
                    </div>
                  )}
                  {currentSelected.effect.restoreMp && (
                    <div className="text-sky-400 font-semibold">
                      ✨ ฟื้นฟูมานา: +{currentSelected.effect.restoreMp} MP
                    </div>
                  )}
                </div>
              )}

              {/* Price */}
              <div className="text-[11px] text-slate-500">
                มูลค่าร้านค้า: <span className="text-amber-400 font-bold">{currentSelected.price} G</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              เลือกไอเทมเพื่อดูรายละเอียด
            </div>
          )}

          {/* Action Button */}
          {currentSelected && (
            <div className="pt-3">
              {currentSelected.type === 'consumable' ? (
                <button
                  onClick={() => handleUse(currentSelected)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                >
                  ดื่ม / ใช้งาน (Use Potion)
                </button>
              ) : (
                <button
                  onClick={() => handleUse(currentSelected)}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  สวมใส่อุปกรณ์ (Equip Item)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
