import { Player, Monster, LootDrop, FloatingText, SpellEffect, ChatMessage, CharacterClass, Item } from '../types/game';
import { sound } from '../utils/audio';
import { MONSTER_TEMPLATES, ITEMS, QUESTS } from '../data/gameData';
import { MAP_WIDTH, MAP_HEIGHT } from './mapData';

export type GameEventListener = () => void;

export class GameEngine {
  public ws: WebSocket | null = null;
  public isConnected: boolean = false;
  public localPlayerId: string | null = null;
  public localPlayer: Player | null = null;
  public otherPlayers: Map<string, Player> = new Map();
  public monsters: Monster[] = [];
  public loot: LootDrop[] = [];
  public floatingTexts: FloatingText[] = [];
  public spellEffects: SpellEffect[] = [];
  public chatHistory: ChatMessage[] = [];
  public targetEntityId: string | null = null;
  public activeZoneName: string = 'Sanctuary of Eldoria';

  // Input states
  public keys: Record<string, boolean> = {};
  public targetMovePos: { x: number; y: number } | null = null;

  // Listeners for UI updates
  private listeners: Set<GameEventListener> = new Set();
  private lastMoveSendTime: number = 0;

  constructor() {
    this.initMonstersOfflineFallback();
  }

  public subscribe(listener: GameEventListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public connect(characterName: string, characterClass: CharacterClass, color: string) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.ws?.send(
          JSON.stringify({
            type: 'join',
            name: characterName,
            characterClass,
            color,
          })
        );
        this.notify();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (err) {
          console.error('Error handling WS msg:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notify();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        // Fallback to local mode if WS fails in preview
        if (!this.localPlayer) {
          this.startOfflineMode(characterName, characterClass, color);
        }
      };
    } catch {
      this.startOfflineMode(characterName, characterClass, color);
    }
  }

  private startOfflineMode(name: string, characterClass: CharacterClass, color: string) {
    const id = `local_${Date.now()}`;
    this.localPlayerId = id;

    let defaultWeapon = ITEMS.novice_sword;
    if (characterClass === 'mage') defaultWeapon = ITEMS.apprentice_staff;
    if (characterClass === 'archer') defaultWeapon = ITEMS.wooden_shortbow;
    if (characterClass === 'healer') defaultWeapon = ITEMS.novice_scepter;

    this.localPlayer = {
      id,
      name: name || 'Valiant Hero',
      characterClass,
      x: 550,
      y: 530,
      vx: 0,
      vy: 0,
      facing: 'down',
      level: 1,
      xp: 0,
      maxXp: 150,
      hp: 220,
      maxHp: 220,
      mp: 120,
      maxMp: 120,
      stats: { str: 10, agi: 10, int: 10, vit: 10, unallocatedPoints: 0 },
      gold: 200,
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
      title: 'Solo Adventurer',
      kills: 0,
      bossKills: 0,
    };

    this.chatHistory.push({
      id: 'local-init',
      senderId: 'system',
      senderName: 'System',
      channel: 'system',
      message: '⚔️ Connected in Adventure Mode. Explore, slay monsters, and become a legend!',
      timestamp: Date.now(),
      isSystem: true,
    });

    this.notify();
  }

  private handleServerMessage(msg: {
    type: string;
    playerId?: string;
    player?: Player;
    players?: Player[];
    monsters?: Partial<Monster>[];
    loot?: LootDrop[];
    floatingTexts?: FloatingText[];
    spellEffects?: SpellEffect[];
    chat?: ChatMessage;
    chatHistory?: ChatMessage[];
  }) {
    if (msg.type === 'init') {
      this.localPlayerId = msg.playerId || null;
      if (msg.player) this.localPlayer = msg.player;
      if (msg.players) {
        this.otherPlayers.clear();
        msg.players.forEach((p) => {
          if (p.id !== this.localPlayerId) this.otherPlayers.set(p.id, p);
        });
      }
      if (msg.monsters) this.monsters = msg.monsters as Monster[];
      if (msg.loot) this.loot = msg.loot;
      if (msg.chatHistory) this.chatHistory = msg.chatHistory;
      this.notify();
    } else if (msg.type === 'player_joined' && msg.player) {
      if (msg.player.id !== this.localPlayerId) {
        this.otherPlayers.set(msg.player.id, msg.player);
      }
    } else if (msg.type === 'player_left' && msg.playerId) {
      this.otherPlayers.delete(msg.playerId);
    } else if (msg.type === 'chat' && msg.chat) {
      this.chatHistory.push(msg.chat);
      if (this.chatHistory.length > 50) this.chatHistory.shift();
      this.notify();
    } else if (msg.type === 'tick') {
      // Sync other players and local player stats
      if (msg.players) {
        msg.players.forEach((p) => {
          if (p.id === this.localPlayerId) {
            // Reconcile non-positional authoritative state (HP, MP, Level, Inventory, Gold)
            if (this.localPlayer) {
              this.localPlayer.hp = p.hp;
              this.localPlayer.maxHp = p.maxHp;
              this.localPlayer.mp = p.mp;
              this.localPlayer.maxMp = p.maxMp;
              this.localPlayer.level = p.level;
              this.localPlayer.xp = p.xp;
              this.localPlayer.maxXp = p.maxXp;
              this.localPlayer.gold = p.gold;
              this.localPlayer.inventory = p.inventory;
              this.localPlayer.equipment = p.equipment;
              this.localPlayer.stats = p.stats;
              this.localPlayer.questProgress = p.questProgress;
              this.localPlayer.completedQuests = p.completedQuests;
              this.localPlayer.kills = p.kills;
              this.localPlayer.bossKills = p.bossKills;
              this.localPlayer.chatBubble = p.chatBubble;
            }
          } else {
            this.otherPlayers.set(p.id, p);
          }
        });
      }

      // Sync monsters
      if (msg.monsters) {
        msg.monsters.forEach((monDelta) => {
          const m = this.monsters.find((x) => x.id === monDelta.id);
          if (m) {
            if (monDelta.x !== undefined) m.x = monDelta.x;
            if (monDelta.y !== undefined) m.y = monDelta.y;
            if (monDelta.hp !== undefined) m.hp = monDelta.hp;
            if (monDelta.facing !== undefined) m.facing = monDelta.facing;
            if (monDelta.state !== undefined) m.state = monDelta.state;
          }
        });
      }

      if (msg.loot) this.loot = msg.loot;
      if (msg.floatingTexts) this.floatingTexts = msg.floatingTexts;
      if (msg.spellEffects) this.spellEffects = msg.spellEffects;

      this.notify();
    }
  }

  // Client tick loop (60 FPS local prediction & input movement)
  public update(dt: number) {
    if (!this.localPlayer) return;
    const player = this.localPlayer;
    if (player.hp <= 0) return;

    // Movement calculation
    let vx = 0;
    let vy = 0;
    const speed = player.isSitting ? 0 : 180;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) vy -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) vy += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) vx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) vx += 1;

    // Click to move handling
    if (this.targetMovePos && vx === 0 && vy === 0) {
      const dx = this.targetMovePos.x - player.x;
      const dy = this.targetMovePos.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) {
        vx = dx / dist;
        vy = dy / dist;
      } else {
        this.targetMovePos = null;
      }
    }

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * speed;
      vy = (vy / len) * speed;

      player.x = Math.max(25, Math.min(MAP_WIDTH - 25, player.x + vx * dt));
      player.y = Math.max(25, Math.min(MAP_HEIGHT - 25, player.y + vy * dt));

      if (Math.abs(vx) > Math.abs(vy)) {
        player.facing = vx > 0 ? 'right' : 'left';
      } else {
        player.facing = vy > 0 ? 'down' : 'up';
      }

      if (player.isSitting) player.isSitting = false;
    }

    player.vx = vx;
    player.vy = vy;

    // Send position to server at ~20hz
    const now = performance.now();
    if (now - this.lastMoveSendTime > 45 && this.ws?.readyState === WebSocket.OPEN) {
      this.lastMoveSendTime = now;
      this.ws.send(
        JSON.stringify({
          type: 'move',
          x: Math.round(player.x),
          y: Math.round(player.y),
          vx: Math.round(vx),
          vy: Math.round(vy),
          facing: player.facing,
        })
      );
    }

    // Auto-pickup loot within radius
    this.loot.forEach((l) => {
      if (Math.hypot(player.x - l.x, player.y - l.y) < 45) {
        this.pickupLoot(l.id);
      }
    });
  }

  public attack(skillKey?: string) {
    if (!this.localPlayer || this.localPlayer.hp <= 0) return;

    if (!skillKey || skillKey === 'space') {
      sound.playSlash();
    } else if (skillKey === '1') {
      if (this.localPlayer.characterClass === 'mage') sound.playFireball();
      else if (this.localPlayer.characterClass === 'healer') sound.playHoly();
      else sound.playSlash();
    } else if (skillKey === '2') {
      if (this.localPlayer.characterClass === 'mage') sound.playIce();
      else if (this.localPlayer.characterClass === 'healer') sound.playHoly();
      else sound.playSlash();
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'attack',
          skillKey,
          targetId: this.targetEntityId,
        })
      );
    }
  }

  public useItem(itemId: string) {
    sound.playPotion();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'use_item', itemId }));
    } else if (this.localPlayer) {
      // Local fallback
      const idx = this.localPlayer.inventory.findIndex((i) => i.id === itemId);
      if (idx !== -1) {
        const it = this.localPlayer.inventory[idx];
        if (it.effect?.healHp) {
          this.localPlayer.hp = Math.min(this.localPlayer.maxHp, this.localPlayer.hp + it.effect.healHp);
        }
        if (it.effect?.restoreMp) {
          this.localPlayer.mp = Math.min(this.localPlayer.maxMp, this.localPlayer.mp + it.effect.restoreMp);
        }
        if (it.quantity && it.quantity > 1) it.quantity -= 1;
        else this.localPlayer.inventory.splice(idx, 1);
        this.notify();
      }
    }
  }

  public pickupLoot(lootId: string) {
    sound.playCoin();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'pickup_loot', lootId }));
    }
  }

  public shopBuy(itemId: string) {
    sound.playCoin();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'shop_buy', itemId }));
    }
  }

  public allocateStat(stat: 'str' | 'agi' | 'int' | 'vit') {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'allocate_stat', stat }));
    }
  }

  public acceptQuest(questId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'accept_quest', questId }));
    }
  }

  public claimQuest(questId: string) {
    sound.playLevelUp();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'claim_quest', questId }));
    }
  }

  public sendChat(text: string, channel: 'all' | 'party' = 'all') {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'chat', text, channel }));
    } else if (this.localPlayer) {
      this.chatHistory.push({
        id: `chat-${Date.now()}`,
        senderId: this.localPlayer.id,
        senderName: this.localPlayer.name,
        channel,
        message: text,
        timestamp: Date.now(),
      });
      this.notify();
    }
  }

  public toggleSit() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'sit' }));
    } else if (this.localPlayer) {
      this.localPlayer.isSitting = !this.localPlayer.isSitting;
      this.notify();
    }
  }

  public revive() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'revive' }));
    } else if (this.localPlayer) {
      this.localPlayer.x = 550;
      this.localPlayer.y = 520;
      this.localPlayer.hp = this.localPlayer.maxHp;
      this.localPlayer.mp = this.localPlayer.maxMp;
      this.notify();
    }
  }

  private initMonstersOfflineFallback() {
    this.monsters = [
      {
        ...MONSTER_TEMPLATES.slime,
        id: 'offline_slime_1',
        x: 1200,
        y: 400,
        vx: 0,
        vy: 0,
        facing: 'down',
        targetPlayerId: null,
        lastAttackTime: 0,
        state: 'patrol',
        patrolOrigin: { x: 1200, y: 400 },
      },
      {
        ...MONSTER_TEMPLATES.drake_boss,
        id: 'offline_drake_boss',
        x: 1800,
        y: 1450,
        vx: 0,
        vy: 0,
        facing: 'down',
        targetPlayerId: null,
        lastAttackTime: 0,
        state: 'patrol',
        patrolOrigin: { x: 1800, y: 1450 },
      },
    ];
  }
}

export const gameEngine = new GameEngine();
