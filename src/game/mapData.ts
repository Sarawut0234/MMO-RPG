import { WorldZone } from '../types/game';

export const MAP_WIDTH = 2600;
export const MAP_HEIGHT = 2000;

export const WORLD_ZONES: WorldZone[] = [
  {
    name: 'Sanctuary of Eldoria',
    thaiName: 'เมืองศักดิ์สิทธิ์เอลโดเรีย (เขตปลอดภัย)',
    x: 100,
    y: 100,
    width: 900,
    height: 800,
    isSafeZone: true,
    ambientColor: 'rgba(255, 245, 220, 0.05)',
  },
  {
    name: 'Whispering Wildwood',
    thaiName: 'ป่าพงไพรกระซิบ (Lv. 1 - 7)',
    x: 1050,
    y: 100,
    width: 1450,
    height: 900,
    ambientColor: 'rgba(100, 220, 120, 0.04)',
  },
  {
    name: 'Crypt of Forgotten Kings',
    thaiName: 'สุสานกษัตริย์นิรนาม (Lv. 8 - 14)',
    x: 100,
    y: 950,
    width: 950,
    height: 950,
    ambientColor: 'rgba(120, 90, 200, 0.08)',
  },
  {
    name: "Infernal Drake's Caldera",
    thaiName: 'แอ่งภูเขาไฟมังกรเพลิง (Lv. 15+ World Boss)',
    x: 1100,
    y: 1050,
    width: 1400,
    height: 850,
    ambientColor: 'rgba(255, 80, 20, 0.1)',
  },
];

export interface MapDecoration {
  type: 'tree' | 'fountain' | 'rock' | 'column' | 'tent' | 'dummy' | 'lantern' | 'lava_pool' | 'portal';
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  interactable?: boolean;
}

export const MAP_DECORATIONS: MapDecoration[] = [
  // Town Fountain
  { type: 'fountain', x: 550, y: 500, width: 90, height: 90, label: 'Fountain of Life', interactable: true },
  // Town NPCs
  { type: 'tent', x: 320, y: 350, width: 80, height: 70, label: 'Alchemist & Blacksmith Store', interactable: true },
  { type: 'tent', x: 750, y: 350, width: 80, height: 70, label: 'Adventurers Guild (Quests)', interactable: true },
  // Training Dummies
  { type: 'dummy', x: 380, y: 650, width: 32, height: 44, label: 'Training Dummy' },
  { type: 'dummy', x: 440, y: 650, width: 32, height: 44, label: 'Training Dummy' },
  { type: 'dummy', x: 500, y: 650, width: 32, height: 44, label: 'Training Dummy' },

  // Town Lanterns
  { type: 'lantern', x: 260, y: 240, width: 24, height: 36 },
  { type: 'lantern', x: 840, y: 240, width: 24, height: 36 },
  { type: 'lantern', x: 260, y: 760, width: 24, height: 36 },
  { type: 'lantern', x: 840, y: 760, width: 24, height: 36 },

  // Forest Trees (sample scatter)
  { type: 'tree', x: 1150, y: 200, width: 64, height: 80 },
  { type: 'tree', x: 1300, y: 180, width: 70, height: 85 },
  { type: 'tree', x: 1550, y: 230, width: 64, height: 80 },
  { type: 'tree', x: 1800, y: 200, width: 70, height: 85 },
  { type: 'tree', x: 2100, y: 250, width: 64, height: 80 },
  { type: 'tree', x: 1250, y: 400, width: 64, height: 80 },
  { type: 'tree', x: 1650, y: 450, width: 70, height: 85 },
  { type: 'tree', x: 1950, y: 380, width: 64, height: 80 },
  { type: 'tree', x: 2250, y: 500, width: 70, height: 85 },
  { type: 'tree', x: 1400, y: 650, width: 64, height: 80 },
  { type: 'tree', x: 1750, y: 700, width: 70, height: 85 },

  // Crypt Pillars and Ruins
  { type: 'column', x: 280, y: 1150, width: 36, height: 60 },
  { type: 'column', x: 620, y: 1150, width: 36, height: 60 },
  { type: 'column', x: 280, y: 1450, width: 36, height: 60 },
  { type: 'column', x: 620, y: 1450, width: 36, height: 60 },
  { type: 'column', x: 450, y: 1300, width: 44, height: 70, label: 'Cursed Crypt Altar' },

  // Caldera Lava Pools & Dragon Bones
  { type: 'lava_pool', x: 1350, y: 1250, width: 130, height: 90 },
  { type: 'lava_pool', x: 2100, y: 1300, width: 140, height: 100 },
  { type: 'lava_pool', x: 1700, y: 1650, width: 180, height: 110 },
  { type: 'column', x: 1550, y: 1250, width: 40, height: 75 },
  { type: 'column', x: 1950, y: 1250, width: 40, height: 75 },
];

export function getZoneAt(x: number, y: number): WorldZone {
  for (const zone of WORLD_ZONES) {
    if (
      x >= zone.x &&
      x <= zone.x + zone.width &&
      y >= zone.y &&
      y <= zone.y + zone.height
    ) {
      return zone;
    }
  }
  return WORLD_ZONES[0];
}
