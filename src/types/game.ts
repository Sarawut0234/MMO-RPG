export type CharacterClass = 'warrior' | 'mage' | 'archer' | 'healer';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ItemType = 'weapon' | 'armor' | 'helm' | 'boots' | 'accessory' | 'consumable' | 'material';

export interface ItemStats {
  attack?: number;
  defense?: number;
  maxHp?: number;
  maxMp?: number;
  critChance?: number;
  speed?: number;
}

export interface Item {
  id: string;
  name: string;
  thaiName?: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  stats?: ItemStats;
  effect?: {
    healHp?: number;
    restoreMp?: number;
    buffDuration?: number;
  };
  price: number;
  icon: string;
  stackable?: boolean;
  quantity?: number;
}

export interface PlayerStats {
  str: number;
  agi: number;
  int: number;
  vit: number;
  unallocatedPoints: number;
}

export interface Equipment {
  weapon?: Item;
  armor?: Item;
  helm?: Item;
  boots?: Item;
  accessory?: Item;
}

export interface Player {
  id: string;
  name: string;
  characterClass: CharacterClass;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Direction;
  level: number;
  xp: number;
  maxXp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stats: PlayerStats;
  gold: number;
  inventory: Item[];
  equipment: Equipment;
  activeQuestId: string | null;
  questProgress: Record<string, number>;
  completedQuests: string[];
  isAttacking: boolean;
  isSitting: boolean;
  lastAttackTime: number;
  lastSkillTime: Record<string, number>;
  color: string;
  title: string;
  kills: number;
  bossKills: number;
  chatBubble?: {
    text: string;
    timer: number;
  };
}

export type MonsterType = 'slime' | 'goblin' | 'skeleton' | 'fire_elemental' | 'drake_boss';

export interface Monster {
  id: string;
  name: string;
  thaiName: string;
  type: MonsterType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: Direction;
  hp: number;
  maxHp: number;
  level: number;
  attack: number;
  defense: number;
  speed: number;
  xpReward: number;
  goldReward: [number, number];
  dropTable: { itemId: string; rate: number }[];
  targetPlayerId: string | null;
  aggroRange: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  state: 'patrol' | 'chase' | 'attack' | 'dead';
  patrolOrigin: { x: number; y: number };
  isBoss?: boolean;
  bossSkillCooldown?: number;
  lastBossSkill?: number;
}

export interface LootDrop {
  id: string;
  x: number;
  y: number;
  item: Item;
  gold?: number;
  spawnTime: number;
  dropperName?: string;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  type: 'damage' | 'crit' | 'heal' | 'xp' | 'gold' | 'level_up' | 'info';
  createdAt: number;
  duration: number;
}

export interface SpellEffect {
  id: string;
  type: 'slash' | 'whirlwind' | 'fireball' | 'frost_nova' | 'arrow' | 'multishot' | 'smite' | 'holy_heal' | 'boss_breath' | 'teleport';
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  radius: number;
  duration: number;
  createdAt: number;
  color: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderClass?: CharacterClass;
  channel: 'all' | 'party' | 'system';
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface Quest {
  id: string;
  title: string;
  thaiTitle: string;
  description: string;
  targetMonsterType: MonsterType;
  targetCount: number;
  rewardXp: number;
  rewardGold: number;
  rewardItem?: Item;
}

export interface SkillDefinition {
  id: string;
  name: string;
  thaiName: string;
  description: string;
  characterClass: CharacterClass;
  cooldown: number; // in seconds
  mpCost: number;
  icon: string;
  key: string;
}

export interface WorldZone {
  name: string;
  thaiName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isSafeZone?: boolean;
  ambientColor: string;
}
