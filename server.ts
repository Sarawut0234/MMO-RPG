import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { Player, Monster, LootDrop, FloatingText, SpellEffect, ChatMessage, CharacterClass, Item } from './src/types/game';
import { MONSTER_TEMPLATES, ITEMS, QUESTS, CLASS_SKILLS } from './src/data/gameData';
import { MAP_WIDTH, MAP_HEIGHT, WORLD_ZONES } from './src/game/mapData';

const PORT = 3000;
const app = express();
app.use(express.json());

// In-Memory Game World State
interface ConnectedClient {
  ws: WebSocket;
  playerId: string;
}

const clients: Map<string, ConnectedClient> = new Map();
const players: Map<string, Player> = new Map();
let monsters: Monster[] = [];
let loot: LootDrop[] = [];
let floatingTexts: FloatingText[] = [];
let spellEffects: SpellEffect[] = [];
let chatHistory: ChatMessage[] = [
  {
    id: 'sys-welcome',
    senderId: 'system',
    senderName: 'Eldoria Announcer',
    channel: 'system',
    message: '⚔️ Welcome to the Realm of Eldoria! Slay beasts, complete quests, defeat the World Boss, and explore together!',
    timestamp: Date.now(),
    isSystem: true,
  },
];

// Helper to spawn initial monsters
function initMonsters() {
  monsters = [];

  // Slimes in Forest (x: 1100 - 1600, y: 200 - 600)
  for (let i = 0; i < 7; i++) {
    const x = 1150 + Math.random() * 450;
    const y = 200 + Math.random() * 400;
    monsters.push({
      ...MONSTER_TEMPLATES.slime,
      id: `slime_${i}`,
      x,
      y,
      vx: 0,
      vy: 0,
      facing: 'down',
      targetPlayerId: null,
      lastAttackTime: 0,
      state: 'patrol',
      patrolOrigin: { x, y },
    });
  }

  // Goblins in Forest (x: 1700 - 2300, y: 250 - 800)
  for (let i = 0; i < 6; i++) {
    const x = 1750 + Math.random() * 450;
    const y = 250 + Math.random() * 450;
    monsters.push({
      ...MONSTER_TEMPLATES.goblin,
      id: `goblin_${i}`,
      x,
      y,
      vx: 0,
      vy: 0,
      facing: 'down',
      targetPlayerId: null,
      lastAttackTime: 0,
      state: 'patrol',
      patrolOrigin: { x, y },
    });
  }

  // Skeletons in Crypt (x: 200 - 800, y: 1100 - 1700)
  for (let i = 0; i < 6; i++) {
    const x = 250 + Math.random() * 550;
    const y = 1150 + Math.random() * 500;
    monsters.push({
      ...MONSTER_TEMPLATES.skeleton,
      id: `skeleton_${i}`,
      x,
      y,
      vx: 0,
      vy: 0,
      facing: 'down',
      targetPlayerId: null,
      lastAttackTime: 0,
      state: 'patrol',
      patrolOrigin: { x, y },
    });
  }

  // Magma Elementals in Caldera (x: 1200 - 2200, y: 1100 - 1700)
  for (let i = 0; i < 5; i++) {
    const x = 1250 + Math.random() * 700;
    const y = 1200 + Math.random() * 450;
    monsters.push({
      ...MONSTER_TEMPLATES.fire_elemental,
      id: `elemental_${i}`,
      x,
      y,
      vx: 0,
      vy: 0,
      facing: 'down',
      targetPlayerId: null,
      lastAttackTime: 0,
      state: 'patrol',
      patrolOrigin: { x, y },
    });
  }

  // World Boss Infernal Drake (Center of Caldera: x: 1800, y: 1450)
  monsters.push({
    ...MONSTER_TEMPLATES.drake_boss,
    id: 'infernal_drake_boss',
    x: 1800,
    y: 1450,
    vx: 0,
    vy: 0,
    facing: 'down',
    targetPlayerId: null,
    lastAttackTime: 0,
    lastBossSkill: 0,
    state: 'patrol',
    patrolOrigin: { x: 1800, y: 1450 },
  });
}

initMonsters();

// Helper to calculate total player combat stats
function getPlayerCombatStats(p: Player) {
  let attack = 10 + p.stats.str * 2;
  let defense = 4 + p.stats.vit * 1.5;
  let critChance = 5 + p.stats.agi * 0.5;
  let speed = 150 + p.stats.agi * 1.5;
  let maxHp = 180 + p.stats.vit * 15;
  let maxMp = 100 + p.stats.int * 12;

  // Class modifiers
  if (p.characterClass === 'warrior') {
    attack += p.stats.str * 1.5;
    defense += 8;
  } else if (p.characterClass === 'mage') {
    attack += p.stats.int * 2.2;
    maxMp += 80;
  } else if (p.characterClass === 'archer') {
    attack += p.stats.agi * 2;
    critChance += 8;
    speed += 20;
  } else if (p.characterClass === 'healer') {
    attack += p.stats.int * 1.5;
    maxHp += 50;
    maxMp += 50;
  }

  // Equipment stats
  const eq = p.equipment;
  [eq.weapon, eq.armor, eq.helm, eq.boots, eq.accessory].forEach((item) => {
    if (item?.stats) {
      if (item.stats.attack) attack += item.stats.attack;
      if (item.stats.defense) defense += item.stats.defense;
      if (item.stats.critChance) critChance += item.stats.critChance;
      if (item.stats.maxHp) maxHp += item.stats.maxHp;
      if (item.stats.maxMp) maxMp += item.stats.maxMp;
      if (item.stats.speed) speed *= item.stats.speed;
    }
  });

  return { attack: Math.round(attack), defense: Math.round(defense), critChance, speed, maxHp, maxMp };
}

// REST API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', onlinePlayers: players.size });
});

// REST API Server Status & Leaderboard
app.get('/api/leaderboard', (req, res) => {
  const list = Array.from(players.values())
    .sort((a, b) => b.level - a.level || b.xp - a.xp || b.bossKills - a.bossKills)
    .slice(0, 15)
    .map((p) => ({
      id: p.id,
      name: p.name,
      characterClass: p.characterClass,
      level: p.level,
      bossKills: p.bossKills,
      kills: p.kills,
    }));
  res.json({ leaderboard: list });
});

async function start() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  function broadcast(data: object) {
    const str = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(str);
      }
    });
  }

  function broadcastChat(chat: ChatMessage) {
    chatHistory.push(chat);
    if (chatHistory.length > 50) chatHistory.shift();
    broadcast({ type: 'chat', chat });
  }

  // WebSocket Connection Handling
  wss.on('connection', (ws) => {
    let currentSessionPlayerId: string | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'join') {
          const { name, characterClass, color } = msg;
          const id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          currentSessionPlayerId = id;

          // Default equipment based on class
          let defaultWeapon = ITEMS.novice_sword;
          if (characterClass === 'mage') defaultWeapon = ITEMS.apprentice_staff;
          if (characterClass === 'archer') defaultWeapon = ITEMS.wooden_shortbow;
          if (characterClass === 'healer') defaultWeapon = ITEMS.novice_scepter;

          const newPlayer: Player = {
            id,
            name: (name || 'Hero').trim().substring(0, 14),
            characterClass: (characterClass as CharacterClass) || 'warrior',
            x: 520 + Math.random() * 60,
            y: 480 + Math.random() * 60,
            vx: 0,
            vy: 0,
            facing: 'down',
            level: 1,
            xp: 0,
            maxXp: 150,
            hp: 200,
            maxHp: 200,
            mp: 100,
            maxMp: 100,
            stats: {
              str: characterClass === 'warrior' ? 12 : 5,
              agi: characterClass === 'archer' ? 12 : 5,
              int: characterClass === 'mage' ? 12 : characterClass === 'healer' ? 10 : 5,
              vit: 8,
              unallocatedPoints: 0,
            },
            gold: 150,
            inventory: [
              { ...ITEMS.hp_potion_small, quantity: 5 },
              { ...ITEMS.mp_potion_small, quantity: 3 },
              ITEMS.leather_tunic,
            ],
            equipment: {
              weapon: defaultWeapon,
              armor: ITEMS.leather_tunic,
            },
            activeQuestId: 'quest_slime',
            questProgress: { quest_slime: 0 },
            completedQuests: [],
            isAttacking: false,
            isSitting: false,
            lastAttackTime: 0,
            lastSkillTime: {},
            color: color || '#38bdf8',
            title: 'Novice Adventurer',
            kills: 0,
            bossKills: 0,
          };

          const stats = getPlayerCombatStats(newPlayer);
          newPlayer.maxHp = stats.maxHp;
          newPlayer.maxMp = stats.maxMp;
          newPlayer.hp = stats.maxHp;
          newPlayer.mp = stats.maxMp;

          players.set(id, newPlayer);
          clients.set(id, { ws, playerId: id });

          // Send initialization data to the connecting client
          ws.send(
            JSON.stringify({
              type: 'init',
              playerId: id,
              player: newPlayer,
              players: Array.from(players.values()),
              monsters,
              loot,
              chatHistory,
              quests: QUESTS,
            })
          );

          // Broadcast to other clients that a player joined
          broadcast({
            type: 'player_joined',
            player: newPlayer,
          });

          broadcastChat({
            id: `sys-${Date.now()}`,
            senderId: 'system',
            senderName: 'System',
            channel: 'system',
            message: `✨ ${newPlayer.name} the ${newPlayer.characterClass} has entered Eldoria!`,
            timestamp: Date.now(),
            isSystem: true,
          });
        }

        if (!currentSessionPlayerId) return;
        const player = players.get(currentSessionPlayerId);
        if (!player) return;

        if (msg.type === 'move') {
          const { x, y, vx, vy, facing } = msg;
          player.x = Math.max(20, Math.min(MAP_WIDTH - 20, x));
          player.y = Math.max(20, Math.min(MAP_HEIGHT - 20, y));
          player.vx = vx;
          player.vy = vy;
          if (facing) player.facing = facing;
          if (player.isSitting && (vx !== 0 || vy !== 0)) {
            player.isSitting = false;
          }
        }

        if (msg.type === 'sit') {
          player.isSitting = !player.isSitting;
          player.vx = 0;
          player.vy = 0;
        }

        if (msg.type === 'chat') {
          const text = (msg.text || '').trim().substring(0, 100);
          if (text) {
            player.chatBubble = { text, timer: 4.5 };
            broadcastChat({
              id: `msg-${Date.now()}-${Math.random()}`,
              senderId: player.id,
              senderName: player.name,
              senderClass: player.characterClass,
              channel: msg.channel || 'all',
              message: text,
              timestamp: Date.now(),
            });
          }
        }

        if (msg.type === 'allocate_stat') {
          const stat = msg.stat as 'str' | 'agi' | 'int' | 'vit';
          if (player.stats.unallocatedPoints > 0 && player.stats[stat] !== undefined) {
            player.stats[stat] += 1;
            player.stats.unallocatedPoints -= 1;
            const cs = getPlayerCombatStats(player);
            player.maxHp = cs.maxHp;
            player.maxMp = cs.maxMp;
          }
        }

        if (msg.type === 'use_item') {
          const { itemId } = msg;
          const idx = player.inventory.findIndex((it) => it.id === itemId);
          if (idx !== -1) {
            const item = player.inventory[idx];
            if (item.type === 'consumable') {
              if (item.effect?.healHp) {
                player.hp = Math.min(player.maxHp, player.hp + item.effect.healHp);
                floatingTexts.push({
                  id: `ft-${Date.now()}`,
                  x: player.x,
                  y: player.y - 20,
                  text: `+${item.effect.healHp} HP`,
                  color: '#22c55e',
                  type: 'heal',
                  createdAt: Date.now(),
                  duration: 1200,
                });
              }
              if (item.effect?.restoreMp) {
                player.mp = Math.min(player.maxMp, player.mp + item.effect.restoreMp);
                floatingTexts.push({
                  id: `ft-${Date.now()}`,
                  x: player.x,
                  y: player.y - 20,
                  text: `+${item.effect.restoreMp} MP`,
                  color: '#38bdf8',
                  type: 'heal',
                  createdAt: Date.now(),
                  duration: 1200,
                });
              }
              if (item.quantity && item.quantity > 1) {
                item.quantity -= 1;
              } else {
                player.inventory.splice(idx, 1);
              }
            } else if (['weapon', 'armor', 'helm', 'boots', 'accessory'].includes(item.type)) {
              // Equip
              const slot = item.type as keyof typeof player.equipment;
              const currentEquipped = player.equipment[slot];
              player.equipment[slot] = item;
              player.inventory.splice(idx, 1);
              if (currentEquipped) {
                player.inventory.push(currentEquipped);
              }
              const cs = getPlayerCombatStats(player);
              player.maxHp = cs.maxHp;
              player.maxMp = cs.maxMp;
            }
          }
        }

        if (msg.type === 'pickup_loot') {
          const { lootId } = msg;
          const lootIdx = loot.findIndex((l) => l.id === lootId);
          if (lootIdx !== -1) {
            const l = loot[lootIdx];
            const dist = Math.hypot(player.x - l.x, player.y - l.y);
            if (dist < 80) {
              if (l.gold) {
                player.gold += l.gold;
                floatingTexts.push({
                  id: `ft-${Date.now()}`,
                  x: player.x,
                  y: player.y - 15,
                  text: `+${l.gold} Gold`,
                  color: '#facc15',
                  type: 'gold',
                  createdAt: Date.now(),
                  duration: 1000,
                });
              }
              if (l.item) {
                // Stack or add
                const existing = player.inventory.find((it) => it.id === l.item.id && it.stackable);
                if (existing) {
                  existing.quantity = (existing.quantity || 1) + (l.item.quantity || 1);
                } else {
                  player.inventory.push({ ...l.item, quantity: l.item.quantity || 1 });
                }
                floatingTexts.push({
                  id: `ft-${Date.now()}`,
                  x: player.x,
                  y: player.y - 30,
                  text: `+ ${l.item.name}`,
                  color: '#e2e8f0',
                  type: 'info',
                  createdAt: Date.now(),
                  duration: 1200,
                });
              }
              loot.splice(lootIdx, 1);
            }
          }
        }

        if (msg.type === 'shop_buy') {
          const { itemId } = msg;
          const item = Object.values(ITEMS).find((it) => it.id === itemId);
          if (item && player.gold >= item.price) {
            player.gold -= item.price;
            const existing = player.inventory.find((it) => it.id === item.id && it.stackable);
            if (existing) {
              existing.quantity = (existing.quantity || 1) + 1;
            } else {
              player.inventory.push({ ...item, quantity: 1 });
            }
            floatingTexts.push({
              id: `ft-${Date.now()}`,
              x: player.x,
              y: player.y - 15,
              text: `Bought ${item.name}`,
              color: '#38bdf8',
              type: 'info',
              createdAt: Date.now(),
              duration: 1000,
            });
          }
        }

        if (msg.type === 'revive') {
          if (player.hp <= 0) {
            player.x = 550;
            player.y = 520;
            player.hp = player.maxHp;
            player.mp = player.maxMp;
            floatingTexts.push({
              id: `ft-${Date.now()}`,
              x: player.x,
              y: player.y - 20,
              text: 'Revived at Fountain of Life',
              color: '#38bdf8',
              type: 'heal',
              createdAt: Date.now(),
              duration: 1500,
            });
          }
        }

        if (msg.type === 'accept_quest') {
          const quest = QUESTS.find((q) => q.id === msg.questId);
          if (quest) {
            player.activeQuestId = quest.id;
            if (player.questProgress[quest.id] === undefined) {
              player.questProgress[quest.id] = 0;
            }
          }
        }

        if (msg.type === 'claim_quest') {
          const quest = QUESTS.find((q) => q.id === msg.questId);
          if (quest && (player.questProgress[quest.id] || 0) >= quest.targetCount) {
            player.gold += quest.rewardGold;
            player.xp += quest.rewardXp;
            player.completedQuests.push(quest.id);
            if (quest.rewardItem) {
              player.inventory.push({ ...quest.rewardItem, quantity: 1 });
            }
            player.activeQuestId = null;

            floatingTexts.push({
              id: `ft-${Date.now()}`,
              x: player.x,
              y: player.y - 30,
              text: `Quest Complete! +${quest.rewardXp} XP, +${quest.rewardGold} G`,
              color: '#fbbf24',
              type: 'level_up',
              createdAt: Date.now(),
              duration: 2000,
            });

            checkLevelUp(player);
          }
        }

        if (msg.type === 'attack') {
          if (player.hp <= 0) return;
          const { skillKey, targetId, targetPos } = msg;
          const combatStats = getPlayerCombatStats(player);
          const now = Date.now();

          let skill = CLASS_SKILLS[player.characterClass]?.find((s) => s.key === skillKey);
          let isBasic = !skillKey || skillKey === 'space';

          if (isBasic) {
            // Basic Attack
            if (now - player.lastAttackTime < 600) return;
            player.lastAttackTime = now;

            // Attack animation visual
            spellEffects.push({
              id: `slash-${now}`,
              type: 'slash',
              x: player.x + (player.facing === 'right' ? 24 : player.facing === 'left' ? -24 : 0),
              y: player.y + (player.facing === 'down' ? 24 : player.facing === 'up' ? -24 : 0),
              radius: 35,
              duration: 200,
              createdAt: now,
              color: '#ffffff',
            });

            // Damage nearby monster
            let targetMonster: Monster | undefined;
            if (targetId) {
              targetMonster = monsters.find((m) => m.id === targetId && m.state !== 'dead');
            }
            if (!targetMonster) {
              // Target closest monster in range
              let minDist = 70;
              monsters.forEach((m) => {
                if (m.state === 'dead') return;
                const d = Math.hypot(m.x - player.x, m.y - player.y);
                if (d < minDist) {
                  minDist = d;
                  targetMonster = m;
                }
              });
            }

            if (targetMonster && Math.hypot(targetMonster.x - player.x, targetMonster.y - player.y) < 90) {
              const isCrit = Math.random() * 100 < combatStats.critChance;
              const rawDmg = combatStats.attack * (isCrit ? 1.8 : 1.0);
              const dmg = Math.max(5, Math.round(rawDmg - targetMonster.defense * 0.4));

              targetMonster.hp -= dmg;
              targetMonster.targetPlayerId = player.id;
              targetMonster.state = 'chase';

              floatingTexts.push({
                id: `ft-${now}-${Math.random()}`,
                x: targetMonster.x,
                y: targetMonster.y - 25,
                text: `${dmg}${isCrit ? ' CRIT!' : ''}`,
                color: isCrit ? '#f59e0b' : '#f87171',
                type: isCrit ? 'crit' : 'damage',
                createdAt: now,
                duration: 900,
              });

              if (targetMonster.hp <= 0) {
                handleMonsterKilled(targetMonster, player);
              }
            }
          } else if (skill) {
            // Class Skill
            const lastUsed = player.lastSkillTime[skill.id] || 0;
            if (now - lastUsed < skill.cooldown * 1000) return;
            if (player.mp < skill.mpCost) {
              floatingTexts.push({
                id: `ft-${now}`,
                x: player.x,
                y: player.y - 20,
                text: 'Not enough MP!',
                color: '#38bdf8',
                type: 'info',
                createdAt: now,
                duration: 900,
              });
              return;
            }

            player.mp -= skill.mpCost;
            player.lastSkillTime[skill.id] = now;

            // Execute specific skill
            if (skill.id === 'slash') {
              spellEffects.push({
                id: `slash-${now}`,
                type: 'slash',
                x: player.x,
                y: player.y,
                radius: 55,
                duration: 300,
                createdAt: now,
                color: '#ef4444',
              });
              // High damage to target
              damageNearbyMonsters(player, 80, combatStats.attack * 1.9, combatStats.critChance);
            } else if (skill.id === 'whirlwind') {
              spellEffects.push({
                id: `whirl-${now}`,
                type: 'whirlwind',
                x: player.x,
                y: player.y,
                radius: 110,
                duration: 500,
                createdAt: now,
                color: '#38bdf8',
              });
              damageNearbyMonsters(player, 110, combatStats.attack * 1.4, combatStats.critChance);
            } else if (skill.id === 'fireball') {
              const tx = targetPos?.x || player.x + (player.facing === 'right' ? 180 : player.facing === 'left' ? -180 : 0);
              const ty = targetPos?.y || player.y + (player.facing === 'down' ? 180 : player.facing === 'up' ? -180 : 0);
              spellEffects.push({
                id: `fire-${now}`,
                type: 'fireball',
                x: player.x,
                y: player.y,
                targetX: tx,
                targetY: ty,
                radius: 40,
                duration: 400,
                createdAt: now,
                color: '#f97316',
              });
              setTimeout(() => {
                damageMonstersAt(tx, ty, 75, combatStats.attack * 2.2, player, combatStats.critChance);
              }, 300);
            } else if (skill.id === 'frost_nova') {
              spellEffects.push({
                id: `frost-${now}`,
                type: 'frost_nova',
                x: player.x,
                y: player.y,
                radius: 130,
                duration: 600,
                createdAt: now,
                color: '#bae6fd',
              });
              damageNearbyMonsters(player, 130, combatStats.attack * 1.5, combatStats.critChance);
            } else if (skill.id === 'teleport') {
              const dist = 140;
              let nx = player.x;
              let ny = player.y;
              if (player.facing === 'right') nx += dist;
              if (player.facing === 'left') nx -= dist;
              if (player.facing === 'down') ny += dist;
              if (player.facing === 'up') ny -= dist;
              player.x = Math.max(30, Math.min(MAP_WIDTH - 30, nx));
              player.y = Math.max(30, Math.min(MAP_HEIGHT - 30, ny));
              spellEffects.push({
                id: `tp-${now}`,
                type: 'frost_nova',
                x: player.x,
                y: player.y,
                radius: 50,
                duration: 300,
                createdAt: now,
                color: '#a855f7',
              });
            } else if (skill.id === 'piercing_shot' || skill.id === 'multishot') {
              spellEffects.push({
                id: `arrow-${now}`,
                type: 'slash',
                x: player.x,
                y: player.y,
                radius: 160,
                duration: 300,
                createdAt: now,
                color: '#10b981',
              });
              damageNearbyMonsters(player, 160, combatStats.attack * (skill.id === 'piercing_shot' ? 2.0 : 1.5), combatStats.critChance);
            } else if (skill.id === 'smite') {
              let targetM = monsters.find((m) => m.id === targetId && m.state !== 'dead') || monsters[0];
              if (targetM) {
                spellEffects.push({
                  id: `smite-${now}`,
                  type: 'smite',
                  x: targetM.x,
                  y: targetM.y,
                  radius: 50,
                  duration: 400,
                  createdAt: now,
                  color: '#fef08a',
                });
                damageMonster(targetM, combatStats.attack * 2.1, player, true);
              }
            } else if (skill.id === 'holy_heal') {
              // Heal self and nearby players
              player.hp = Math.min(player.maxHp, player.hp + Math.round(combatStats.attack * 2.5));
              spellEffects.push({
                id: `heal-${now}`,
                type: 'holy_heal',
                x: player.x,
                y: player.y,
                radius: 100,
                duration: 500,
                createdAt: now,
                color: '#fef08a',
              });
              floatingTexts.push({
                id: `ft-${now}`,
                x: player.x,
                y: player.y - 25,
                text: `+${Math.round(combatStats.attack * 2.5)} HP`,
                color: '#22c55e',
                type: 'heal',
                createdAt: now,
                duration: 1200,
              });
            }
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      if (currentSessionPlayerId) {
        const leavingPlayer = players.get(currentSessionPlayerId);
        if (leavingPlayer) {
          broadcastChat({
            id: `sys-${Date.now()}`,
            senderId: 'system',
            senderName: 'System',
            channel: 'system',
            message: `👋 ${leavingPlayer.name} has left the world.`,
            timestamp: Date.now(),
            isSystem: true,
          });
        }
        players.delete(currentSessionPlayerId);
        clients.delete(currentSessionPlayerId);
        broadcast({
          type: 'player_left',
          playerId: currentSessionPlayerId,
        });
      }
    });
  });

  function damageNearbyMonsters(player: Player, radius: number, damage: number, critChance: number) {
    monsters.forEach((m) => {
      if (m.state === 'dead') return;
      if (Math.hypot(m.x - player.x, m.y - player.y) <= radius) {
        damageMonster(m, damage, player, Math.random() * 100 < critChance);
      }
    });
  }

  function damageMonstersAt(x: number, y: number, radius: number, damage: number, player: Player, critChance: number) {
    monsters.forEach((m) => {
      if (m.state === 'dead') return;
      if (Math.hypot(m.x - x, m.y - y) <= radius) {
        damageMonster(m, damage, player, Math.random() * 100 < critChance);
      }
    });
  }

  function damageMonster(m: Monster, rawDmg: number, player: Player, isCrit: boolean) {
    const dmg = Math.max(5, Math.round((rawDmg * (isCrit ? 1.7 : 1.0)) - m.defense * 0.3));
    m.hp -= dmg;
    m.targetPlayerId = player.id;
    m.state = 'chase';

    floatingTexts.push({
      id: `ft-${Date.now()}-${Math.random()}`,
      x: m.x,
      y: m.y - 25,
      text: `${dmg}${isCrit ? ' CRIT!' : ''}`,
      color: isCrit ? '#f59e0b' : '#ef4444',
      type: isCrit ? 'crit' : 'damage',
      createdAt: Date.now(),
      duration: 900,
    });

    if (m.hp <= 0) {
      handleMonsterKilled(m, player);
    }
  }

  function handleMonsterKilled(m: Monster, killer: Player) {
    m.state = 'dead';
    m.hp = 0;
    killer.kills += 1;
    if (m.isBoss) killer.bossKills += 1;

    // Grant XP
    killer.xp += m.xpReward;
    floatingTexts.push({
      id: `ft-${Date.now()}-${Math.random()}`,
      x: killer.x,
      y: killer.y - 35,
      text: `+${m.xpReward} XP`,
      color: '#38bdf8',
      type: 'xp',
      createdAt: Date.now(),
      duration: 1000,
    });

    // Spawn Gold Drop
    const goldAmount = Math.floor(m.goldReward[0] + Math.random() * (m.goldReward[1] - m.goldReward[0]));
    loot.push({
      id: `loot_${Date.now()}_gold`,
      x: m.x + (Math.random() * 20 - 10),
      y: m.y + (Math.random() * 20 - 10),
      item: ITEMS.hp_potion_small,
      gold: goldAmount,
      spawnTime: Date.now(),
    });

    // Check Drop Table
    m.dropTable.forEach((drop) => {
      if (Math.random() < drop.rate) {
        const itemTemplate = ITEMS[drop.itemId];
        if (itemTemplate) {
          loot.push({
            id: `loot_${Date.now()}_${drop.itemId}`,
            x: m.x + (Math.random() * 30 - 15),
            y: m.y + (Math.random() * 30 - 15),
            item: itemTemplate,
            spawnTime: Date.now(),
          });
        }
      }
    });

    // Quest progression
    if (killer.activeQuestId) {
      const activeQuest = QUESTS.find((q) => q.id === killer.activeQuestId);
      if (activeQuest && activeQuest.targetMonsterType === m.type) {
        const currentCount = (killer.questProgress[activeQuest.id] || 0) + 1;
        killer.questProgress[activeQuest.id] = currentCount;
        if (currentCount >= activeQuest.targetCount) {
          floatingTexts.push({
            id: `ft-${Date.now()}`,
            x: killer.x,
            y: killer.y - 45,
            text: `Quest Objective Complete! Return to Guild`,
            color: '#fbbf24',
            type: 'level_up',
            createdAt: Date.now(),
            duration: 2500,
          });
        }
      }
    }

    if (m.isBoss) {
      broadcastChat({
        id: `sys-boss-${Date.now()}`,
        senderId: 'system',
        senderName: 'World Boss Announcer',
        channel: 'system',
        message: `🔥 INFERNAL DRAKE HAS FALLEN! Slayed by hero ${killer.name}! Tremendous spoils have rained upon the Caldera!`,
        timestamp: Date.now(),
        isSystem: true,
      });
    }

    checkLevelUp(killer);

    // Schedule monster respawn
    const respawnDelay = m.isBoss ? 25000 : 9000;
    setTimeout(() => {
      m.state = 'patrol';
      m.hp = m.maxHp;
      m.x = m.patrolOrigin.x;
      m.y = m.patrolOrigin.y;
      m.targetPlayerId = null;
      if (m.isBoss) {
        broadcastChat({
          id: `sys-boss-respawn-${Date.now()}`,
          senderId: 'system',
          senderName: 'World Boss Announcer',
          channel: 'system',
          message: `🌋 The Infernal Drake has re-emerged in the Volcanic Caldera! Challengers beware!`,
          timestamp: Date.now(),
          isSystem: true,
        });
      }
    }, respawnDelay);
  }

  function checkLevelUp(p: Player) {
    if (p.xp >= p.maxXp) {
      p.level += 1;
      p.xp -= p.maxXp;
      p.maxXp = Math.round(p.maxXp * 1.45);
      p.stats.unallocatedPoints += 3;
      const cs = getPlayerCombatStats(p);
      p.maxHp = cs.maxHp;
      p.maxMp = cs.maxMp;
      p.hp = cs.maxHp;
      p.mp = cs.maxMp;

      floatingTexts.push({
        id: `ft-${Date.now()}`,
        x: p.x,
        y: p.y - 40,
        text: `★ LEVEL UP! (Lv.${p.level}) ★`,
        color: '#fbbf24',
        type: 'level_up',
        createdAt: Date.now(),
        duration: 2500,
      });

      broadcastChat({
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'System',
        channel: 'system',
        message: `🎉 Congratulations! ${p.name} reached Level ${p.level}!`,
        timestamp: Date.now(),
        isSystem: true,
      });
    }
  }

  // Authoritative Game Loop: 20 Ticks / sec
  setInterval(() => {
    const now = Date.now();

    // 1. Natural HP & MP Regeneration (faster in safe zone or while sitting)
    players.forEach((p) => {
      if (p.hp > 0) {
        const inSafeZone = p.x < 1000 && p.y < 900;
        const regenMult = inSafeZone || p.isSitting ? 3.0 : 1.0;
        p.hp = Math.min(p.maxHp, p.hp + 0.6 * regenMult);
        p.mp = Math.min(p.maxMp, p.mp + 0.8 * regenMult);
      }

      // Chat bubble countdown
      if (p.chatBubble) {
        p.chatBubble.timer -= 0.05;
        if (p.chatBubble.timer <= 0) {
          p.chatBubble = undefined;
        }
      }
    });

    // 2. Monster AI Simulation
    monsters.forEach((m) => {
      if (m.state === 'dead') return;

      let targetPlayer: Player | undefined;
      if (m.targetPlayerId) {
        targetPlayer = players.get(m.targetPlayerId);
        // If player dead or out of safe zone, lose aggro
        if (!targetPlayer || targetPlayer.hp <= 0 || (targetPlayer.x < 980 && targetPlayer.y < 880)) {
          m.targetPlayerId = null;
          m.state = 'patrol';
        }
      }

      if (!targetPlayer) {
        // Search for nearest player within aggro range
        let nearestDist = m.aggroRange;
        players.forEach((p) => {
          if (p.hp <= 0) return;
          if (p.x < 980 && p.y < 880) return; // In safe zone!
          const d = Math.hypot(p.x - m.x, p.y - m.y);
          if (d < nearestDist) {
            nearestDist = d;
            targetPlayer = p;
            m.targetPlayerId = p.id;
            m.state = 'chase';
          }
        });
      }

      if (targetPlayer) {
        const dist = Math.hypot(targetPlayer.x - m.x, targetPlayer.y - m.y);
        if (dist > m.attackRange) {
          // Move towards player
          const angle = Math.atan2(targetPlayer.y - m.y, targetPlayer.x - m.x);
          m.x += Math.cos(angle) * (m.speed * 0.05);
          m.y += Math.sin(angle) * (m.speed * 0.05);
          m.facing = Math.cos(angle) > 0 ? 'right' : 'left';
        } else {
          // Attack player
          if (now - m.lastAttackTime > m.attackCooldown * 1000) {
            m.lastAttackTime = now;
            const cs = getPlayerCombatStats(targetPlayer);
            const rawDamage = m.attack - cs.defense * 0.35;
            const dmg = Math.max(3, Math.round(rawDamage));

            targetPlayer.hp -= dmg;
            floatingTexts.push({
              id: `ft-${now}-${Math.random()}`,
              x: targetPlayer.x,
              y: targetPlayer.y - 20,
              text: `-${dmg}`,
              color: '#ef4444',
              type: 'damage',
              createdAt: now,
              duration: 800,
            });

            if (m.isBoss) {
              spellEffects.push({
                id: `boss-breath-${now}`,
                type: 'boss_breath',
                x: m.x,
                y: m.y,
                radius: 110,
                duration: 400,
                createdAt: now,
                color: '#ef4444',
              });
            }

            if (targetPlayer.hp <= 0) {
              targetPlayer.hp = 0;
              m.targetPlayerId = null;
              m.state = 'patrol';
              floatingTexts.push({
                id: `ft-${now}`,
                x: targetPlayer.x,
                y: targetPlayer.y - 30,
                text: `YOU DIED! Revive at Town Fountain`,
                color: '#ef4444',
                type: 'damage',
                createdAt: now,
                duration: 3000,
              });
            }
          }
        }
      } else {
        // Patrol near origin
        const distToOrigin = Math.hypot(m.patrolOrigin.x - m.x, m.patrolOrigin.y - m.y);
        if (distToOrigin > 140) {
          const angle = Math.atan2(m.patrolOrigin.y - m.y, m.patrolOrigin.x - m.x);
          m.x += Math.cos(angle) * (m.speed * 0.03);
          m.y += Math.sin(angle) * (m.speed * 0.03);
        } else if (Math.random() < 0.05) {
          const wanderAngle = Math.random() * Math.PI * 2;
          m.x += Math.cos(wanderAngle) * 10;
          m.y += Math.sin(wanderAngle) * 10;
        }
      }
    });

    // 3. Clean expired floating texts & spell effects
    floatingTexts = floatingTexts.filter((ft) => now - ft.createdAt < ft.duration);
    spellEffects = spellEffects.filter((sp) => now - sp.createdAt < sp.duration);
    // Loot stays on ground for 90 seconds
    loot = loot.filter((l) => now - l.spawnTime < 90000);

    // 4. Broadcast delta tick to all connected players
    if (clients.size > 0) {
      broadcast({
        type: 'tick',
        players: Array.from(players.values()),
        monsters: monsters.map((m) => ({
          id: m.id,
          x: Math.round(m.x),
          y: Math.round(m.y),
          hp: m.hp,
          maxHp: m.maxHp,
          facing: m.facing,
          state: m.state,
        })),
        loot,
        floatingTexts,
        spellEffects,
      });
    }
  }, 50); // 20 FPS network tick

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`⚔️ Eldoria MMORPG Server listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
