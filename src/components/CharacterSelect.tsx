import React, { useState } from 'react';
import { CharacterClass } from '../types/game';
import { Shield, Flame, Target, Sparkles, Sword, Play } from 'lucide-react';
import { sound } from '../utils/audio';

interface Props {
  onSelect: (name: string, characterClass: CharacterClass, color: string) => void;
}

interface ClassOption {
  id: CharacterClass;
  name: string;
  thaiName: string;
  role: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  stats: { hp: string; atk: string; spd: string; range: string };
  skills: string[];
}

const CLASSES: ClassOption[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    thaiName: 'อัศวินดาบเหล็ก',
    role: 'Melee / Tank',
    description: 'Master of heavy plate and crushing broadswords. High durability and devastating spin attacks.',
    icon: <Shield className="w-6 h-6 text-sky-400" />,
    color: '#38bdf8',
    stats: { hp: '★★★★★', atk: '★★★★☆', spd: '★★★☆☆', range: '★☆☆☆☆' },
    skills: ['Power Strike', 'Whirlwind Slash', 'Iron Guard'],
  },
  {
    id: 'mage',
    name: 'Mage',
    thaiName: 'จอมเวทเพลิงน้ำแข็ง',
    role: 'Ranged / AoE DPS',
    description: 'Commands explosive fireballs and arctic novas to obliterate monster hordes from afar.',
    icon: <Flame className="w-6 h-6 text-amber-400" />,
    color: '#f59e0b',
    stats: { hp: '★★☆☆☆', atk: '★★★★★', spd: '★★★☆☆', range: '★★★★★' },
    skills: ['Pyro Fireball', 'Frost Nova', 'Blink Leap'],
  },
  {
    id: 'archer',
    name: 'Archer',
    thaiName: 'นักธนูพรานป่า',
    role: 'Ranged / Agility',
    description: 'Unmatched precision and evasion. Fires piercing arrows and rapid volleys with high critical chance.',
    icon: <Target className="w-6 h-6 text-emerald-400" />,
    color: '#10b981',
    stats: { hp: '★★★☆☆', atk: '★★★★☆', spd: '★★★★★', range: '★★★★☆' },
    skills: ['Piercing Arrow', 'Arrow Volley', 'Acrobatic Leap'],
  },
  {
    id: 'healer',
    name: 'Priest',
    thaiName: 'นักบวชศักดิ์สิทธิ์',
    role: 'Support / Holy Magic',
    description: 'Channels divine radiance to smite wicked beasts and heal wounds of nearby allies in battle.',
    icon: <Sparkles className="w-6 h-6 text-purple-400" />,
    color: '#c084fc',
    stats: { hp: '★★★★☆', atk: '★★★☆☆', spd: '★★★☆☆', range: '★★★★☆' },
    skills: ['Holy Smite', 'Radiant Sanctuary', 'Guardian Blessing'],
  },
];

const COLORS = [
  '#38bdf8', // Sky Blue
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#ef4444', // Red
  '#ec4899', // Pink
];

export const CharacterSelect: React.FC<Props> = ({ onSelect }) => {
  const [name, setName] = useState('Arthur');
  const [selectedClass, setSelectedClass] = useState<CharacterClass>('warrior');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    sound.playLevelUp();
    onSelect(name.trim(), selectedClass, selectedColor);
  };

  const currentClass = CLASSES.find((c) => c.id === selectedClass)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 md:p-8 my-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sword className="w-3.5 h-3.5" />
            2D Online MMORPG
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-slate-100 tracking-wide">
            REALM OF ELDORIA
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            สร้างตัวละครของคุณเพื่อเข้าสู่โลกมอนสเตอร์และสงครามล่าบอสแบบเรียลไทม์
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Class Selection Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              1. เลือกอาชีพตัวละคร (Select Class)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CLASSES.map((cls) => {
                const active = selectedClass === cls.id;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      setSelectedClass(cls.id);
                      sound.playSlash();
                    }}
                    className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-slate-800 border-sky-500 shadow-lg shadow-sky-500/10 ring-2 ring-sky-500/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                        {cls.icon}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                        {cls.role}
                      </span>
                    </div>
                    <div className="font-bold text-slate-100 text-base">{cls.name}</div>
                    <div className="text-xs text-sky-400 font-medium mb-2">{cls.thaiName}</div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {cls.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Class Details & Skills */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-400 uppercase font-semibold">สกิลประจำอาชีพ (Class Skills)</div>
              <div className="flex flex-wrap gap-2">
                {currentClass.skills.map((skill, idx) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-xs text-slate-200"
                  >
                    <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs w-full md:w-auto">
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">HP:</span>
                <span className="text-emerald-400 font-bold">{currentClass.stats.hp}</span>
              </div>
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">ATK:</span>
                <span className="text-rose-400 font-bold">{currentClass.stats.atk}</span>
              </div>
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">SPD:</span>
                <span className="text-amber-400 font-bold">{currentClass.stats.spd}</span>
              </div>
              <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 block">RANGE:</span>
                <span className="text-sky-400 font-bold">{currentClass.stats.range}</span>
              </div>
            </div>
          </div>

          {/* Name & Customization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                2. ชื่อผู้กล้า (Character Name)
              </label>
              <input
                type="text"
                maxLength={14}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อตัวละครของคุณ..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-medium text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                3. สีชุดเกราะประจำตัว (Aura / Cape Color)
              </label>
              <div className="flex items-center gap-3 pt-1">
                {COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`w-9 h-9 rounded-full cursor-pointer transition-transform duration-150 ${
                      selectedColor === col
                        ? 'ring-4 ring-offset-2 ring-offset-slate-900 ring-white scale-110'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-600 hover:from-sky-500 hover:via-indigo-500 hover:to-sky-500 text-white font-bold text-base shadow-xl shadow-sky-600/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <Play className="w-5 h-5 fill-current" />
            เข้าสู่ดินแดนเอลโดเรีย (ENTER ELDORIA)
          </button>
        </form>
      </div>
    </div>
  );
};
