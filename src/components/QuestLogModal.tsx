import React from 'react';
import { Player, Quest } from '../types/game';
import { QUESTS } from '../data/gameData';
import { X, Scroll, CheckCircle2, Gift } from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  player: Player | null;
  onClose: () => void;
  onAcceptQuest: (questId: string) => void;
  onClaimQuest: (questId: string) => void;
}

export const QuestLogModal: React.FC<Props> = ({
  player,
  onClose,
  onAcceptQuest,
  onClaimQuest,
}) => {
  if (!player) return null;

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
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Scroll className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif">บันทึกภารกิจกิลด์ (Quest Log)</h2>
            <p className="text-xs text-slate-400">
              รับภารกิจปราบมอนสเตอร์และบอสโลกเพื่อรับค่าประสบการณ์ ทองคำ และอุปกรณ์ระดับสูง
            </p>
          </div>
        </div>

        {/* Quest List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {QUESTS.map((quest) => {
            const isCompleted = player.completedQuests.includes(quest.id);
            const isActive = player.activeQuestId === quest.id;
            const currentCount = player.questProgress[quest.id] || 0;
            const isReadyToClaim = isActive && currentCount >= quest.targetCount;
            const percent = Math.min(100, Math.round((currentCount / quest.targetCount) * 100));

            return (
              <div
                key={quest.id}
                className={`p-4 rounded-xl border transition-all ${
                  isReadyToClaim
                    ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/30'
                    : isActive
                    ? 'bg-slate-950/80 border-sky-500/40'
                    : isCompleted
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-70'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">{quest.title}</span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> สำเร็จแล้ว
                        </span>
                      )}
                      {isActive && !isReadyToClaim && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20">
                          กำลังทำ
                        </span>
                      )}
                      {isReadyToClaim && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 animate-pulse">
                          ★ พร้อมรับรางวัล
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-sky-400 mt-0.5">{quest.thaiTitle}</div>
                  </div>

                  {/* Actions */}
                  <div>
                    {isReadyToClaim ? (
                      <button
                        onClick={() => {
                          sound.playLevelUp();
                          onClaimQuest(quest.id);
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        รับรางวัลเควส (Claim)
                      </button>
                    ) : !isActive && !isCompleted ? (
                      <button
                        onClick={() => {
                          sound.playSlash();
                          onAcceptQuest(quest.id);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition cursor-pointer"
                      >
                        รับภารกิจ (Accept)
                      </button>
                    ) : null}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {quest.description}
                </p>

                {/* Progress Bar (if active) */}
                {isActive && (
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">ความคืบหน้าการกำจัด:</span>
                      <span className="font-bold text-slate-200">
                        {currentCount} / {quest.targetCount} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Rewards Showcase */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-500 font-semibold">รางวัล:</span>
                  <span className="text-sky-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    +{quest.rewardXp} XP
                  </span>
                  <span className="text-amber-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    🪙 {quest.rewardGold} G
                  </span>
                  {quest.rewardItem && (
                    <span className="text-emerald-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                      <span>{quest.rewardItem.icon}</span>
                      <span>{quest.rewardItem.name}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
