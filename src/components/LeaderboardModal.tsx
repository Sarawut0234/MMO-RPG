import React from 'react';
import { Player } from '../types/game';
import { X, Trophy, Crown, Flame } from 'lucide-react';

interface Props {
  players: Player[];
  localPlayer: Player | null;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<Props> = ({ players, localPlayer, onClose }) => {
  const all = [...players];
  if (localPlayer && !all.some((p) => p.id === localPlayer.id)) {
    all.push(localPlayer);
  }

  // Sort by Level DESC, then Boss Kills DESC, then Kills DESC
  all.sort((a, b) => b.level - a.level || b.bossKills - a.bossKills || b.kills - a.kills);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 relative max-h-[85vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif">หอเกียรติยศผู้กล้า (Hall of Fame)</h2>
            <p className="text-xs text-slate-400">
              อันดับผู้เล่นที่แข็งแกร่งที่สุดในดินแดนเอลโดเรีย
            </p>
          </div>
        </div>

        {/* Ranking List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {all.map((p, idx) => {
            const isLocal = localPlayer?.id === p.id;
            let rankBadge = (
              <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center font-mono">
                {idx + 1}
              </span>
            );
            if (idx === 0) {
              rankBadge = (
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center border border-amber-500/40">
                  🥇
                </span>
              );
            } else if (idx === 1) {
              rankBadge = (
                <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-200 text-xs font-bold flex items-center justify-center border border-slate-300/40">
                  🥈
                </span>
              );
            } else if (idx === 2) {
              rankBadge = (
                <span className="w-6 h-6 rounded-full bg-amber-800/20 text-amber-500 text-xs font-bold flex items-center justify-center border border-amber-700/40">
                  🥉
                </span>
              );
            }

            return (
              <div
                key={p.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition ${
                  isLocal
                    ? 'bg-sky-950/30 border-sky-500/50 ring-1 ring-sky-500/20'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {rankBadge}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-inner"
                    style={{ backgroundColor: p.color || '#38bdf8' }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-100">{p.name}</span>
                      {isLocal && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {p.characterClass} • &lt;{p.title}&gt;
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Level</span>
                    <span className="font-bold text-amber-400">Lv.{p.level}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Boss Kills</span>
                    <span className="font-bold text-rose-400 flex items-center gap-0.5 justify-end">
                      <Crown className="w-3 h-3 text-amber-400" />
                      {p.bossKills}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
