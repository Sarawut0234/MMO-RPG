import React, { useState, useEffect } from 'react';
import { gameEngine } from './game/gameEngine';
import { sound } from './utils/audio';
import { CharacterClass, Player } from './types/game';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { CharacterSelect } from './components/CharacterSelect';
import { InventoryModal } from './components/InventoryModal';
import { CharacterModal } from './components/CharacterModal';
import { QuestLogModal } from './components/QuestLogModal';
import { ShopModal } from './components/ShopModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ChatBox } from './components/ChatBox';

export default function App() {
  const [hasSelectedCharacter, setHasSelectedCharacter] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active modals
  const [showInventory, setShowInventory] = useState(false);
  const [showCharacter, setShowCharacter] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Engine state mirror for React re-renders
  const [, setTick] = useState(0);
  const [activeZoneName, setActiveZoneName] = useState('Sanctuary of Eldoria');

  useEffect(() => {
    const unsubscribe = gameEngine.subscribe(() => {
      setTick((t) => t + 1);
    });
    return () => unsubscribe();
  }, []);

  const handleCharacterSelect = (name: string, characterClass: CharacterClass, color: string) => {
    setHasSelectedCharacter(true);
    gameEngine.connect(name, characterClass, color);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  const player = gameEngine.localPlayer;
  const targetMonster = gameEngine.monsters.find(
    (m) => m.id === gameEngine.targetEntityId && m.state !== 'dead'
  ) || null;
  const worldBoss = gameEngine.monsters.find((m) => m.isBoss) || null;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Character Creation Modal (First Screen) */}
      {!hasSelectedCharacter && (
        <CharacterSelect onSelect={handleCharacterSelect} />
      )}

      {/* 2. Main Game 2D Canvas Engine */}
      <GameCanvas
        onTargetSelect={(id) => {
          gameEngine.targetEntityId = id;
          setTick((t) => t + 1);
        }}
        onZoneChange={(name) => setActiveZoneName(name)}
        onOpenInventory={() => setShowInventory((v) => !v)}
        onOpenCharacter={() => setShowCharacter((v) => !v)}
        onOpenQuests={() => setShowQuests((v) => !v)}
        onOpenShop={() => setShowShop((v) => !v)}
      />

      {/* 3. In-Game RPG HUD */}
      {hasSelectedCharacter && (
        <>
          <HUD
            player={player}
            targetMonster={targetMonster}
            worldBoss={worldBoss}
            soundEnabled={soundEnabled}
            onToggleSound={toggleSound}
            onOpenInventory={() => setShowInventory(true)}
            onOpenCharacter={() => setShowCharacter(true)}
            onOpenQuests={() => setShowQuests(true)}
            onOpenShop={() => setShowShop(true)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onSkillClick={(key) => gameEngine.attack(key)}
            onUsePotion={(type) => {
              const pot = player?.inventory.find((i) =>
                i.id.startsWith(type === 'hp' ? 'hp_potion' : 'mp_potion')
              );
              if (pot) gameEngine.useItem(pot.id);
            }}
            onToggleSit={() => gameEngine.toggleSit()}
            onRevive={() => gameEngine.revive()}
            activeZoneName={activeZoneName}
          />

          {/* Live Chat System */}
          <ChatBox
            messages={gameEngine.chatHistory}
            onSendMessage={(text, channel) => gameEngine.sendChat(text, channel)}
          />
        </>
      )}

      {/* 4. Overlay Modals */}
      {showInventory && (
        <InventoryModal
          player={player}
          onClose={() => setShowInventory(false)}
          onUseItem={(itemId) => gameEngine.useItem(itemId)}
        />
      )}

      {showCharacter && (
        <CharacterModal
          player={player}
          onClose={() => setShowCharacter(false)}
          onAllocateStat={(stat) => gameEngine.allocateStat(stat)}
        />
      )}

      {showQuests && (
        <QuestLogModal
          player={player}
          onClose={() => setShowQuests(false)}
          onAcceptQuest={(id) => gameEngine.acceptQuest(id)}
          onClaimQuest={(id) => gameEngine.claimQuest(id)}
        />
      )}

      {showShop && (
        <ShopModal
          player={player}
          onClose={() => setShowShop(false)}
          onBuyItem={(id) => gameEngine.shopBuy(id)}
        />
      )}

      {showLeaderboard && (
        <LeaderboardModal
          players={Array.from(gameEngine.otherPlayers.values())}
          localPlayer={player}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </main>
  );
}
