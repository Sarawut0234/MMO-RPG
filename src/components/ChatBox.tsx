import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/game';
import { MessageSquare, Send, ChevronDown, ChevronUp, Smile } from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  messages: ChatMessage[];
  onSendMessage: (text: string, channel: 'all' | 'party') => void;
}

export const ChatBox: React.FC<Props> = ({ messages, onSendMessage }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const [channel, setChannel] = useState<'all' | 'party'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), channel);
    setInputText('');
  };

  const sendEmote = (emote: string) => {
    onSendMessage(emote, channel);
  };

  return (
    <div className="pointer-events-auto fixed bottom-3 left-3 z-30 w-72 sm:w-80 md:w-96 select-none font-sans">
      <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-200">
        {/* Chat Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setChannel('all')}
                className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                  channel === 'all'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All (โลก)
              </button>
              <button
                type="button"
                onClick={() => setChannel('party')}
                className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                  channel === 'party'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Party (กลุ่ม)
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isOpen && (
          <>
            {/* Messages Scroll Area */}
            <div className="h-32 sm:h-40 overflow-y-auto p-2.5 space-y-1.5 text-xs">
              {messages.map((msg) => {
                const isSystem = msg.isSystem || msg.senderId === 'system';
                return (
                  <div key={msg.id} className="leading-relaxed">
                    {isSystem ? (
                      <span className="text-amber-300 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 inline-block text-[11px]">
                        {msg.message}
                      </span>
                    ) : (
                      <div className="flex items-start gap-1">
                        <span className="font-bold text-sky-400 hover:underline cursor-pointer">
                          [{msg.senderName}]:
                        </span>
                        <span className="text-slate-200 break-words">{msg.message}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Emote Reactions Bar */}
            <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-950/40 border-t border-slate-800/80 text-[10px] overflow-x-auto">
              <span className="text-slate-500 font-semibold flex items-center gap-0.5">
                <Smile className="w-3 h-3" />
              </span>
              <button
                type="button"
                onClick={() => sendEmote('สวัสดีผู้กล้าทุกคน! 👋')}
                className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer whitespace-nowrap"
              >
                👋 สวัสดี
              </button>
              <button
                type="button"
                onClick={() => sendEmote('บอสเกิดแล้ว มารวมตัวกันที่ภูเขาไฟ! 🌋')}
                className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer whitespace-nowrap"
              >
                🌋 รวมตีบอส
              </button>
              <button
                type="button"
                onClick={() => sendEmote('ยินดีด้วยนะ! 🎉')}
                className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer whitespace-nowrap"
              >
                🎉 ยินดีด้วย
              </button>
              <button
                type="button"
                onClick={() => sendEmote('ขอบคุณสำหรับความช่วยเหลือ! ⚔️')}
                className="px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 cursor-pointer whitespace-nowrap"
              >
                ⚔️ ขอบคุณ
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex items-center gap-1.5 p-2 bg-slate-950/70">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="กดเพื่อพิมพ์ข้อความ (Enter เพื่อส่ง)..."
                maxLength={90}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
