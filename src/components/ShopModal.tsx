import React from 'react';
import { Player, Item } from '../types/game';
import { SHOP_ITEMS } from '../data/gameData';
import { X, Store, ShoppingCart } from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  player: Player | null;
  onClose: () => void;
  onBuyItem: (itemId: string) => void;
}

export const ShopModal: React.FC<Props> = ({ player, onClose, onBuyItem }) => {
  if (!player) return null;

  const handleBuy = (item: Item) => {
    if (player.gold < item.price) return;
    sound.playCoin();
    onBuyItem(item.id);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 relative max-h-[85vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pr-8">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif">ร้านค้าเอลโดเรีย (Royal Merchant)</h2>
              <p className="text-xs text-slate-400">
                จำหน่ายน้ำยาฟื้นฟู อาวุธเหล็กกล้า และเครื่องประดับเวทมนตร์
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <span>🪙</span>
            <span>{player.gold} Gold</span>
          </div>
        </div>

        {/* Store Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
          {SHOP_ITEMS.map((item) => {
            const canAfford = player.gold >= item.price;
            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-100">{item.name}</div>
                    <div className="text-[11px] text-sky-400">{item.thaiName}</div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-xs font-bold text-amber-400">🪙 {item.price} G</span>
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      canAfford
                        ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                    }`}
                  >
                    <ShoppingCart className="w-3 h-3" />
                    ซื้อ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
