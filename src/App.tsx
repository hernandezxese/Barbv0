/**
 * Bárbara: Crónicas Elementales del Sur
 * Inspired by Pokémon Rojo Fuego & Final Fantasy III
 * Main Game State Controller & Shell
 */

import React, { useState } from 'react';
import {
  GameState,
  RegionId,
  SpiritCreature,
  BarbaraHero,
  InventoryItem,
  JobClass,
  HeroGender,
} from './types/game';
import { REGIONS_DATA } from './data/regionsData';
import { createSpiritInstance } from './data/spiritsData';
import { INITIAL_ITEMS, JOBS_CONFIG } from './data/itemsData';
import { sound } from './services/audioService';
import { storageService } from './services/storageService';

import { TitleScreen } from './components/TitleScreen';
import { ExplorationView, PostDialogueAction } from './components/ExplorationView';
import { BattleView } from './components/BattleView';
import { EvolutionSanctuary } from './components/EvolutionSanctuary';
import { PartyMenu } from './components/PartyMenu';
import { WorldMapModal } from './components/WorldMapModal';
import { InventoryModal } from './components/InventoryModal';
import { ShopModal } from './components/ShopModal';
import { BestiaryModal } from './components/BestiaryModal';
import { DialogueBox } from './components/DialogueBox';
import { StarterSelectModal } from './components/StarterSelectModal';
import { CharacterCreateModal } from './components/CharacterCreateModal';
import { PrologueModal } from './components/PrologueModal';
import { SystemMenuModal } from './components/SystemMenuModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import { AdventureGuideModal } from './components/AdventureGuideModal';
import { Trophy, RotateCcw, CheckCircle2, AlertTriangle, Compass } from 'lucide-react';

const SAFE_SPAWN_BY_REGION: Record<RegionId, { x: number; y: number }> = {
  casa: { x: 7, y: 6 },
  santiago: { x: 10, y: 6 },
  biobio: { x: 11, y: 7 },
  araucania: { x: 11, y: 7 },
  losrios: { x: 12, y: 6 },
  loslagos: { x: 11, y: 7 },
};

export default function App() {
  // Game Flow State
  const [gameState, setGameState] = useState<GameState>('title');
  const [currentRegionId, setCurrentRegionId] = useState<RegionId>('casa');
  const [unlockedRegions, setUnlockedRegions] = useState<RegionId[]>(['casa', 'santiago']);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [hasSave, setHasSave] = useState<boolean>(storageService.hasSavedGame());
  const [hasCompletedStory, setHasCompletedStory] = useState<boolean>(false);

  // Position state preserved across battles, menus, and dialogues
  const [playerSpawnPos, setPlayerSpawnPos] = useState<{ x: number; y: number }>({ x: 7, y: 6 });

  // Sub-modals
  const [showCharacterCreate, setShowCharacterCreate] = useState(false);
  const [showPrologue, setShowPrologue] = useState(false);
  const [showStarterSelect, setShowStarterSelect] = useState(false);
  const [showSystemMenu, setShowSystemMenu] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load' | 'manage' | null>(null);
  const [activeShopMeta, setActiveShopMeta] = useState<{ vendorName?: string; regionSubtitle?: string } | null>(null);

  // Notification Toast & Reset Confirmation
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Protagonist State (passive-only hero, no hero MP)
  const [barbara, setBarbara] = useState<BarbaraHero>({
    name: 'Bárbara',
    gender: 'female',
    level: 1,
    exp: 0,
    maxExp: 100,
    currentHp: 120,
    maxHp: 120,
    job: 'naturalista',
    jobMastery: { naturalista: 1, chaman: 1, guardaparque: 1, mistica: 1 },
    limitGauge: 20,
    resonanceOrbs: 8,
    gold: 200,
    activeSpiritUids: [],
  });

  // Party Spirits
  const [partySpirits, setPartySpirits] = useState<SpiritCreature[]>([
    createSpiritInstance('brotin', 3, 1),
    createSpiritInstance('chucao', 2, 1),
  ]);

  // Inventory
  const [inventory, setInventory] = useState<Record<string, InventoryItem>>(INITIAL_ITEMS);

  // Active Battle Encounter State
  const [activeEnemySpirit, setActiveEnemySpirit] = useState<SpiritCreature | null>(null);
  const [isBossBattle, setIsBossBattle] = useState(false);
  const [activeEncounterEntityId, setActiveEncounterEntityId] = useState<string | null>(null);

  // Active Dialogue State
  const [activeDialogue, setActiveDialogue] = useState<{
    speaker: string;
    lines: string[];
    afterAction?: PostDialogueAction;
    portraitSprite?: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleMute = () => {
    sound.init();
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  // Title -> Character Creation
  const handleStartGame = () => {
    sound.init();
    setShowCharacterCreate(true);
  };

  // Character Creation -> Protagonist Narrative Prologue
  const handleConfirmCharacter = (name: string, gender: HeroGender) => {
    setBarbara(prev => ({
      ...prev,
      name,
      gender,
    }));
    setShowCharacterCreate(false);
    setShowPrologue(true);
  };

  // Narrative Prologue -> Starter Selection
  const handleContinueFromPrologue = () => {
    setShowPrologue(false);
    setShowStarterSelect(true);
  };

  // Starter Choice -> Exploration in Stage 0 (Casa del Guardián)
  const handleSelectStarter = (chosenSpirit: SpiritCreature) => {
    sound.init();
    setPartySpirits([
      chosenSpirit,
      createSpiritInstance(chosenSpirit.baseId === 'chucao' ? 'brotin' : 'chucao', 2, 1),
    ]);
    setShowStarterSelect(false);
    setCurrentRegionId('casa');
    setUnlockedRegions(['casa', 'santiago']);
    setPlayerSpawnPos(SAFE_SPAWN_BY_REGION.casa);
    setGameState('exploration');
    sound.playBgm('casa');
    showToast(`✨ ¡${chosenSpirit.name} acompaña a ${barbara.name} desde casa!`);
  };

  // Rest at home bed (Stage 0 free full heal)
  const handleHealAtHome = () => {
    sound.playHeal();
    setPartySpirits(prev =>
      prev.map(s => ({
        ...s,
        currentHp: s.maxHp,
        currentMp: s.maxMp,
      }))
    );
    setBarbara(prev => ({
      ...prev,
      currentHp: prev.maxHp,
    }));
    showToast('🛏️ ¡Descanso reparador! Tu equipo recuperó 100% de PS y PM.');
  };

  // Save to specific slot (1..3)
  const handleSaveToSlot = (slotId: number) => {
    const clearedIds: string[] = [];
    Object.values(REGIONS_DATA).forEach(reg => {
      reg.entities.forEach(ent => {
        if (ent.cleared) clearedIds.push(ent.id);
      });
    });

    const success = storageService.saveGame(slotId, {
      currentRegionId,
      unlockedRegions,
      barbara,
      partySpirits,
      inventory,
      clearedEntityIds: clearedIds,
      playerSpawnPos,
      hasCompletedStory,
    });

    if (success) {
      setHasSave(true);
      showToast(`💾 ¡Partida guardada en la Ranura #${slotId}!`);
    }
  };

  // Load from specific slot (1..3)
  const handleLoadFromSlot = (slotId: number) => {
    const data = storageService.loadGame(slotId);
    if (!data) return;

    setCurrentRegionId(data.currentRegionId);
    setUnlockedRegions(data.unlockedRegions);
    setBarbara({
      ...data.barbara,
      gender: data.barbara.gender || 'female',
    });
    setPartySpirits(data.partySpirits);
    setInventory(data.inventory);
    setHasCompletedStory(Boolean(data.hasCompletedStory));
    if (data.playerSpawnPos) setPlayerSpawnPos(data.playerSpawnPos);

    // Clear all flags first, then restore saved cleared flags
    Object.values(REGIONS_DATA).forEach(reg => {
      reg.entities.forEach(ent => {
        ent.cleared = data.clearedEntityIds.includes(ent.id);
      });
    });

    setSaveLoadMode(null);
    setShowSystemMenu(false);
    setGameState('exploration');
    sound.init();
    sound.playBgm(data.currentRegionId);
    showToast(`📂 ¡Partida #${slotId} cargada exitosamente!`);
  };

  // Reset Game completely
  const handleConfirmReset = () => {
    storageService.resetAll();
    setHasSave(false);
    setHasCompletedStory(false);
    setShowResetConfirm(false);
    setShowSystemMenu(false);
    setSaveLoadMode(null);

    setBarbara({
      name: 'Bárbara',
      gender: 'female',
      level: 1,
      exp: 0,
      maxExp: 100,
      currentHp: 120,
      maxHp: 120,
      job: 'naturalista',
      jobMastery: { naturalista: 1, chaman: 1, guardaparque: 1, mistica: 1 },
      limitGauge: 20,
      resonanceOrbs: 8,
      gold: 200,
      activeSpiritUids: [],
    });

    setInventory(INITIAL_ITEMS);
    setCurrentRegionId('casa');
    setUnlockedRegions(['casa', 'santiago']);
    setPlayerSpawnPos(SAFE_SPAWN_BY_REGION.casa);
    setShowPrologue(false);
    setShowStarterSelect(false);

    Object.values(REGIONS_DATA).forEach(reg => {
      reg.entities.forEach(ent => {
        ent.cleared = false;
      });
    });

    setShowCharacterCreate(true);
    showToast('🔄 ¡Partida reiniciada! Personaliza tu personaje.');
  };

  // Trigger Battle preserving exact map position & progressive regional level curve
  const handleTriggerBattle = (
    enemySpiritId: string,
    isBoss: boolean,
    atPos?: { x: number; y: number },
    entityId?: string
  ) => {
    if (atPos) {
      setPlayerSpawnPos(atPos);
    }
    setActiveEncounterEntityId(entityId || null);

    const matchedEnt = entityId
      ? REGIONS_DATA[currentRegionId]?.entities.find(e => e.id === entityId)
      : undefined;

    const fallbackBossLevel =
      currentRegionId === 'santiago'
        ? 5
        : currentRegionId === 'biobio'
        ? 7
        : currentRegionId === 'araucania'
        ? 9
        : currentRegionId === 'losrios'
        ? 11
        : 13;

    const fallbackWildLevel =
      currentRegionId === 'santiago'
        ? Math.random() < 0.5 ? 2 : 3
        : currentRegionId === 'biobio'
        ? Math.random() < 0.5 ? 4 : 5
        : currentRegionId === 'araucania'
        ? Math.random() < 0.5 ? 6 : 7
        : currentRegionId === 'losrios'
        ? Math.random() < 0.5 ? 8 : 9
        : 10 + Math.floor(Math.random() * 3);

    const enemyLevel = matchedEnt?.customLevel ?? (isBoss ? fallbackBossLevel : fallbackWildLevel);
    const enemyStage = matchedEnt?.customStage ?? (isBoss ? 2 : 1);

    const enemy = createSpiritInstance(enemySpiritId, enemyLevel, enemyStage);
    if (!isBoss) {
      enemy.maxHp = Math.round(enemy.maxHp * 0.85);
      enemy.currentHp = enemy.maxHp;
    }

    setActiveEnemySpirit(enemy);
    setIsBossBattle(isBoss);
    setGameState('battle');
  };

  // Victory in Battle
  const handleBattleVictory = (
    updatedPlayerSpirit: SpiritCreature,
    updatedBarbara: BarbaraHero,
    capturedSpirit?: SpiritCreature
  ) => {
    if (activeEncounterEntityId) {
      const reg = REGIONS_DATA[currentRegionId];
      if (reg) {
        const ent = reg.entities.find(e => e.id === activeEncounterEntityId);
        if (ent) {
          ent.cleared = true;
        }
      }
      setActiveEncounterEntityId(null);
    }

    setPartySpirits(prev => {
      const next = prev.map(s => (s.uid === updatedPlayerSpirit.uid ? updatedPlayerSpirit : s));
      if (capturedSpirit) {
        next.push(capturedSpirit);
      }
      return next;
    });

    setBarbara(updatedBarbara);

    if (isBossBattle) {
      if (currentRegionId === 'santiago') {
        if (!unlockedRegions.includes('biobio')) {
          setUnlockedRegions(prev => [...prev, 'biobio']);
          setActiveDialogue({
            speaker: 'Don Ignacio',
            lines: [
              `¡Extraordinario trabajo, ${updatedBarbara.name}! Has purificado la energía de la Región Metropolitana.`,
              'El sendero otoñal hacia la Región del Biobío y los Saltos del Laja ha sido despejado.',
              '¡Cruza el portal sur o abre el Mapa de Chile para continuar tu travesía!',
            ],
          });
        }
      } else if (currentRegionId === 'biobio') {
        if (!unlockedRegions.includes('araucania')) {
          setUnlockedRegions(prev => [...prev, 'araucania']);
          setActiveDialogue({
            speaker: 'Pascual (Guardaparques del Laja)',
            lines: [
              '¡El Guardián del Biobío vuelve a fluir en armonía con el río y el otoño!',
              'Ahora debes internarte en la Región de La Araucanía, entre araucarias milenarias y las faldas del Volcán Villarrica.',
              'Cruza el portal sur para continuar hacia el territorio pewén.',
            ],
          });
        }
      } else if (currentRegionId === 'araucania') {
        if (!unlockedRegions.includes('losrios')) {
          setUnlockedRegions(prev => [...prev, 'losrios']);
          setActiveDialogue({
            speaker: 'Nahuel (Herrero Volcánico)',
            lines: [
              '¡Has dominado la furia del Pillán en La Araucanía! Su fuego ahora arde en equilibrio.',
              'Tu siguiente destino es la Región de Los Ríos: bosques de arrayanes, nalcas gigantes y ríos cristalinos.',
              '¡Cruza el portal sur para adentrarte en la selva valdiviana!',
            ],
          });
        }
      } else if (currentRegionId === 'losrios') {
        if (!unlockedRegions.includes('loslagos')) {
          setUnlockedRegions(prev => [...prev, 'loslagos']);
          setActiveDialogue({
            speaker: 'Rayén (Botánica de Los Ríos)',
            lines: [
              '¡Las aguas de Los Ríos han recuperado su pureza cristalina!',
              'El destino final te aguarda en la Región de Los Lagos: los fiordos, alerces milenarios y ventisqueros de Hornopirén.',
              '¡Allí salvaremos el corazón austral de la naturaleza de Chile!',
            ],
          });
        }
      } else if (currentRegionId === 'loslagos') {
        const regEntities = REGIONS_DATA.loslagos.entities;
        const caiCai = regEntities.find(e => e.id === 'boss_loslagos_caicai');
        const viluVilu = regEntities.find(e => e.id === 'boss_loslagos_viluvilu');
        if (caiCai?.cleared && viluVilu?.cleared) {
          setHasCompletedStory(true);
          setGameState('victory');
          sound.playBgm('victory');
          return;
        } else {
          setActiveDialogue({
            speaker: 'Don Checho (Guardián del Alerce)',
            lines: [
              !caiCai?.cleared
                ? '¡Gran victoria sobre Vilu Vilu! Aún resta purificar a Cai Cai Vilu en el flanco oeste del Santuario.'
                : '¡Gran victoria sobre Cai Cai Vilu! Aún resta purificar a Vilu Vilu en el flanco este del Santuario.',
            ],
            portraitSprite: 'npc_explorer',
          });
        }
      }
    }

    setGameState('exploration');
  };

  // Defeat in Battle (stays on exact tile)
  const handleBattleDefeat = () => {
    setPartySpirits(prev =>
      prev.map(s => ({
        ...s,
        currentHp: Math.max(1, Math.round(s.maxHp * 0.5)),
        currentMp: Math.max(1, Math.round(s.maxMp * 0.5)),
      }))
    );

    setActiveDialogue({
      speaker: barbara.name,
      lines: [
        'Uff... La fuerza elemental fue intensa.',
        'Recuperamos el aliento aquí mismo. ¡Aprovecha las debilidades elementales del rival!',
      ],
    });

    setGameState('exploration');
  };

  // Close Endgame Victory Modal -> Respawn wild spirits & bosses across all 5 stages while keeping all progress
  const handleContinueAfterVictory = () => {
    sound.init();
    sound.playConfirm();

    Object.values(REGIONS_DATA).forEach(reg => {
      reg.entities.forEach(ent => {
        if (
          ent.type === 'wild_encounter' ||
          ent.type === 'boss' ||
          ent.sprite.startsWith('wild_')
        ) {
          ent.cleared = false;
        }
      });
    });

    setHasCompletedStory(true);
    setGameState('exploration');
    sound.playBgm(currentRegionId);
    showToast('🌿 ¡Espíritus y guardianes han reaparecido en todas las etapas!');
  };

  // Evolution Trigger
  const handleEvolveSpirit = (spiritUid: string, nextStageNumber: number, usedItemKey?: string) => {
    setPartySpirits(prev =>
      prev.map(s => {
        if (s.uid !== spiritUid) return s;
        const nextStageData = s.evolutionLine[nextStageNumber - 1];
        if (!nextStageData) return s;

        const newSkills = [...s.skills];
        if (!newSkills.some(sk => sk.id === nextStageData.signatureSkill.id)) {
          newSkills.unshift(nextStageData.signatureSkill);
        }

        return {
          ...s,
          currentStage: nextStageNumber,
          name: nextStageData.name,
          lore: nextStageData.description,
          maxHp: s.maxHp + 45,
          currentHp: s.maxHp + 45,
          maxMp: s.maxMp + 25,
          currentMp: s.maxMp + 25,
          attack: s.attack + 18,
          defense: s.defense + 18,
          spAttack: s.spAttack + 22,
          spDefense: s.spDefense + 18,
          speed: s.speed + 12,
          skills: newSkills,
        };
      })
    );

    if (usedItemKey) {
      setInventory(prev => ({
        ...prev,
        [usedItemKey]: {
          ...prev[usedItemKey],
          count: Math.max(0, prev[usedItemKey].count - 1),
        },
      }));
    }

    showToast('✨ ¡Evolución ancestral completada con éxito!');
  };

  // Change Hero's Job Class (Final Fantasy III)
  const handleChangeJob = (newJob: JobClass) => {
    setBarbara(prev => ({
      ...prev,
      job: newJob,
    }));
    showToast(`🛡️ ¡${barbara.name} cambió de clase a ${JOBS_CONFIG[newJob]?.name}!`);
  };

  // Set Party Leader
  const handleSetLeaderSpirit = (spiritUid: string) => {
    setPartySpirits(prev => {
      const idx = prev.findIndex(s => s.uid === spiritUid);
      if (idx <= 0) return prev;
      const clone = [...prev];
      const [item] = clone.splice(idx, 1);
      clone.unshift(item);
      return clone;
    });
    showToast('👑 ¡Nuevo espíritu líder asignado al combate!');
  };

  // Open Chest / Get reward
  const handleOpenChest = (entityId: string, itemReward?: { id: string; count: number }, gold?: number) => {
    const reg = REGIONS_DATA[currentRegionId];
    const ent = reg.entities.find(e => e.id === entityId);
    if (ent) ent.cleared = true;

    if (itemReward && inventory[itemReward.id]) {
      setInventory(prev => ({
        ...prev,
        [itemReward.id]: {
          ...prev[itemReward.id],
          count: prev[itemReward.id].count + itemReward.count,
        },
      }));
    }

    if (gold) {
      setBarbara(prev => ({ ...prev, gold: prev.gold + gold }));
    }
  };

  // Clear Obstacle
  const handleClearObstacle = (entityId: string, message: string) => {
    const reg = REGIONS_DATA[currentRegionId];
    const ent = reg.entities.find(e => e.id === entityId);
    if (ent) ent.cleared = true;

    setActiveDialogue({
      speaker: 'Poder Elemental de la Naturaleza',
      lines: [message],
    });
  };

  // Use item from bag on spirit
  const handleUseItemOnSpirit = (itemId: string, targetUid: string) => {
    const item = inventory[itemId];
    if (!item || item.count <= 0) return;

    setPartySpirits(prev =>
      prev.map(s => {
        if (s.uid !== targetUid) return s;
        if (item.effectType === 'heal_hp') {
          return { ...s, currentHp: Math.min(s.maxHp, s.currentHp + item.effectValue) };
        }
        if (item.effectType === 'heal_mp') {
          return { ...s, currentMp: Math.min(s.maxMp, s.currentMp + item.effectValue) };
        }
        if (item.effectType === 'revive') {
          return { ...s, currentHp: Math.max(s.currentHp, Math.round(s.maxHp * 0.5)) };
        }
        return s;
      })
    );

    setInventory(prev => ({
      ...prev,
      [itemId]: { ...item, count: item.count - 1 },
    }));

    showToast('🍃 Objeto utilizado con éxito en tu espíritu.');
  };

  // Linear Stage Movement
  const handleTravelPortal = (destRegion: RegionId, destX?: number, destY?: number) => {
    const spawnX = destX ?? 11;
    const spawnY = destY ?? 1;
    setPlayerSpawnPos({ x: spawnX, y: spawnY });
    setCurrentRegionId(destRegion);
    setGameState('exploration');
    sound.playBgm(destRegion);
  };

  // Fast travel from World Map
  const handleFastTravel = (targetRegion: RegionId) => {
    setPlayerSpawnPos(SAFE_SPAWN_BY_REGION[targetRegion] || { x: 11, y: 7 });
    setCurrentRegionId(targetRegion);
    setGameState('exploration');
    sound.playBgm(targetRegion);
  };

  const currentRegion = REGIONS_DATA[currentRegionId];
  const activeSpirit = partySpirits[0];

  return (
    <div className="relative w-full h-full min-h-[100dvh] bg-zinc-950 font-sans antialiased text-zinc-100 overflow-hidden">
      {/* Subtle CRT scanline overlay */}
      <div className="scanlines absolute inset-0 z-40 pointer-events-none opacity-30" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/95 border-2 border-zinc-300 text-zinc-100 px-4 py-2 rounded-xl shadow-2xl font-mono text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 max-w-[90vw]">
          <CheckCircle2 className="w-4 h-4 text-zinc-100 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Reset Game Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border-2 border-zinc-400 rounded-2xl p-6 max-w-md w-full shadow-2xl font-mono text-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-zinc-100 font-pixel text-sm mb-3">
              <AlertTriangle className="w-5 h-5 text-zinc-200" />
              <span>¿REINICIAR TODA LA AVENTURA?</span>
            </div>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Esta acción restablecerá todo tu progreso, partidas guardadas, espíritus e inventario. Volverás al inicio en tu Casa (Escenario 0).
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-200 font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl font-bold cursor-pointer shadow-lg"
              >
                Sí, Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHARACTER CREATION MODAL */}
      {showCharacterCreate && (
        <CharacterCreateModal
          initialName={barbara.name}
          initialGender={barbara.gender || 'female'}
          onConfirm={handleConfirmCharacter}
          onCancel={() => setShowCharacterCreate(false)}
        />
      )}

      {/* PROTAGONIST NARRATIVE PROLOGUE (Before Starter Selection) */}
      {showPrologue && (
        <PrologueModal
          playerName={barbara.name}
          gender={barbara.gender || 'female'}
          onContinue={handleContinueFromPrologue}
        />
      )}

      {/* STARTER SELECTION MODAL */}
      {showStarterSelect && (
        <StarterSelectModal heroName={barbara.name} onSelectStarter={handleSelectStarter} />
      )}

      {/* SYSTEM MENU & MISSIONS MODAL */}
      {showSystemMenu && (
        <SystemMenuModal
          currentRegion={currentRegion}
          unlockedRegions={unlockedRegions}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenSaveLoad={() => setSaveLoadMode('manage')}
          onOpenEvolution={() => setGameState('evolution')}
          onOpenBestiary={() => setGameState('bestiary')}
          onOpenGuide={() => setShowGuideModal(true)}
          onRequestReset={() => setShowResetConfirm(true)}
          onClose={() => setShowSystemMenu(false)}
        />
      )}

      {/* 3-SLOT SAVE & LOAD MODAL */}
      {saveLoadMode && (
        <SaveLoadModal
          mode={saveLoadMode}
          onSaveSlot={handleSaveToSlot}
          onLoadSlot={handleLoadFromSlot}
          onClose={() => setSaveLoadMode(null)}
        />
      )}

      {/* ADVENTURE GUIDE MODAL */}
      {showGuideModal && (
        <AdventureGuideModal onClose={() => setShowGuideModal(false)} />
      )}

      {/* 1. TITLE SCREEN */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onContinueGame={() => setSaveLoadMode('load')}
          onResetGame={() => setShowResetConfirm(true)}
          hasSave={hasSave}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 2. EXPLORATION VIEW */}
      {gameState === 'exploration' && (
        <ExplorationView
          currentRegion={currentRegion}
          unlockedRegions={unlockedRegions}
          playerSpirit={activeSpirit}
          barbara={barbara}
          isMuted={isMuted}
          hasCompletedStory={hasCompletedStory}
          initialSpawnPos={playerSpawnPos}
          onSyncPosition={setPlayerSpawnPos}
          onHealAtHome={handleHealAtHome}
          onToggleMute={handleToggleMute}
          onOpenParty={() => setGameState('party')}
          onOpenInventory={() => setGameState('inventory')}
          onOpenMap={() => setGameState('map')}
          onOpenSystemMenu={() => setShowSystemMenu(true)}
          onTriggerDialogue={(speaker, lines, afterAction, portraitSprite) =>
            setActiveDialogue({ speaker, lines, afterAction, portraitSprite })
          }
          onTriggerBattle={handleTriggerBattle}
          onClearObstacle={handleClearObstacle}
          onOpenChest={handleOpenChest}
          onTravelPortal={handleTravelPortal}
        />
      )}

      {/* 3. TACTICAL BATTLE VIEW */}
      {gameState === 'battle' && activeEnemySpirit && (
        <BattleView
          playerSpirit={activeSpirit}
          partySpirits={partySpirits}
          barbara={barbara}
          enemySpirit={activeEnemySpirit}
          isBossBattle={isBossBattle}
          inventory={inventory}
          regionThemeColor={currentRegion.themeColor}
          regionId={currentRegion.id}
          onVictory={handleBattleVictory}
          onDefeat={handleBattleDefeat}
          onFlee={() => setGameState('exploration')}
          onSwitchActiveSpirit={(newUid) => handleSetLeaderSpirit(newUid)}
          onUseItem={(itemId) => {
            if (inventory[itemId]) {
              setInventory(prev => ({
                ...prev,
                [itemId]: { ...prev[itemId], count: Math.max(0, prev[itemId].count - 1) },
              }));
            }
          }}
        />
      )}

      {/* 4. EVOLUTION SANCTUARY */}
      {gameState === 'evolution' && (
        <EvolutionSanctuary
          partySpirits={partySpirits}
          inventory={inventory}
          onEvolveSpirit={handleEvolveSpirit}
          onClose={() => setGameState('exploration')}
        />
      )}

      {/* 5. PARTY & JOB CLASS MENU (FF3) */}
      {gameState === 'party' && (
        <PartyMenu
          partySpirits={partySpirits}
          barbara={barbara}
          onChangeJob={handleChangeJob}
          onSetLeaderSpirit={handleSetLeaderSpirit}
          onClose={() => setGameState('exploration')}
        />
      )}

      {/* 6. INVENTORY MODAL */}
      {gameState === 'inventory' && (
        <InventoryModal
          inventory={inventory}
          partySpirits={partySpirits}
          onUseItemOnSpirit={handleUseItemOnSpirit}
          onClose={() => setGameState('exploration')}
        />
      )}

      {/* 7. BOTICA & PROVISIONES PHYSICAL SHOP (Stages 1, 3 & 5) */}
      {gameState === 'shop' && (
        <ShopModal
          barbara={barbara}
          inventory={inventory}
          vendorName={activeShopMeta?.vendorName}
          regionLabel={activeShopMeta?.regionSubtitle}
          onBuyItem={(itemId, quantity, totalCost) => {
            setBarbara(prev => ({ ...prev, gold: Math.max(0, prev.gold - totalCost) }));
            setInventory(prev => ({
              ...prev,
              [itemId]: {
                ...(prev[itemId] || INITIAL_ITEMS[itemId]),
                count: (prev[itemId]?.count || 0) + quantity,
              },
            }));
            showToast(`✨ Adquiriste ${quantity}x ${INITIAL_ITEMS[itemId]?.name || itemId}`);
          }}
          onSellItem={(itemId, quantity, earnedGold) => {
            setBarbara(prev => ({ ...prev, gold: prev.gold + earnedGold }));
            setInventory(prev => ({
              ...prev,
              [itemId]: {
                ...(prev[itemId] || INITIAL_ITEMS[itemId]),
                count: Math.max(0, (prev[itemId]?.count || 0) - quantity),
              },
            }));
            showToast(`💰 Vendiste ${quantity}x ${INITIAL_ITEMS[itemId]?.name || itemId} (+${earnedGold} Oro)`);
          }}
          onClose={() => {
            setActiveShopMeta(null);
            setGameState('exploration');
          }}
        />
      )}

      {/* 8. BESTIARIO / POKÉDEX MODAL */}
      {gameState === 'bestiary' && (
        <BestiaryModal
          partySpirits={partySpirits}
          onClose={() => setGameState('exploration')}
        />
      )}

      {/* 9. WORLD MAP MODAL (Defaults to Stage Topography first) */}
      {gameState === 'map' && (
        <WorldMapModal
          currentRegionId={currentRegionId}
          unlockedRegions={unlockedRegions}
          playerPos={playerSpawnPos}
          onFastTravel={handleFastTravel}
          onClose={() => setGameState('exploration')}
        />
      )}

      {/* 10. GRAND VICTORY MODAL (Endgame with Continue + Respawn option) */}
      {gameState === 'victory' && (
        <div className="fixed inset-0 z-50 bg-zinc-950/95 flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none overflow-y-auto animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-zinc-100 border-2 border-zinc-300 flex items-center justify-center mb-4 sm:mb-6 shadow-2xl shrink-0">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-950 animate-bounce" />
          </div>

          <h1 className="font-pixel text-lg sm:text-2xl md:text-3xl text-zinc-100 mb-2 sm:mb-3">
            ¡LA ARMONÍA DE CHILE HA SIDO RESTAURADA!
          </h1>
          <h2 className="font-cinzel text-sm sm:text-lg text-zinc-300 font-bold mb-4">
            {barbara.name} &middot; Maestría de los Espíritus Elementales del Sur
          </h2>

          <div className="max-w-xl bg-zinc-900 border border-zinc-700 rounded-2xl p-4 sm:p-6 text-xs sm:text-sm text-zinc-300 font-mono leading-relaxed mb-6 text-left">
            <p className="mb-3">
              Gracias a tu valentía y maestría táctica en combate, la Ceniza Umbría ha sido disipada de las cinco regiones sagradas:
            </p>
            <ul className="space-y-1.5 text-zinc-100 mb-4 pl-4 list-disc">
              <li>La Región Metropolitana y el Cerro San Cristóbal florecen en paz.</li>
              <li>La Región del Biobío y sus senderos prehistóricos cantan junto al Laja.</li>
              <li>La Región de La Araucanía equilibra sus pewén y el fuego del Villarrica.</li>
              <li>La Región de Los Ríos resguarda arrayanes, nalcas y aguas cristalinas.</li>
              <li>La Región de Los Lagos y los fiordos de Hornopirén custodian el latido eterno del sur.</li>
            </ul>
            <p className="text-zinc-400">
              {barbara.name} sonríe mirando la cordillera nevada. Puedes cerrar este mensaje para seguir explorando Chile con todo tu progreso, reapareciendo los espíritus y guardianes de cada etapa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xl">
            <button
              onClick={handleContinueAfterVictory}
              className="w-full sm:flex-1 px-6 py-3.5 bg-zinc-100 hover:bg-white rounded-xl font-pixel text-xs text-zinc-950 font-bold shadow-xl cursor-pointer flex items-center justify-center gap-2 border border-zinc-300 active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>CERRAR Y SEGUIR EXPLORANDO</span>
            </button>

            <button
              onClick={() => {
                sound.playSelect();
                setGameState('title');
                sound.playBgm('title');
              }}
              className="w-full sm:w-auto px-5 py-3.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-pixel text-xs text-zinc-200 border border-zinc-700 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>MENÚ INICIO</span>
            </button>
          </div>
        </div>
      )}

      {/* OVERWORLD / SYSTEM DIALOGUE BOX */}
      {activeDialogue && (
        <DialogueBox
          speakerName={activeDialogue.speaker}
          lines={activeDialogue.lines}
          portraitSprite={activeDialogue.portraitSprite}
          onComplete={() => {
            const action = activeDialogue.afterAction;
            setActiveDialogue(null);
            if (action?.type === 'shop') {
              setActiveShopMeta({
                vendorName: action.vendorName,
                regionSubtitle: action.regionSubtitle,
              });
              setGameState('shop');
            } else if (action?.type === 'battle') {
              handleTriggerBattle(action.spiritId, action.isBoss, action.atPos, action.entityId);
            } else if (action?.type === 'portal') {
              handleTravelPortal(action.dest, action.x, action.y);
            }
          }}
        />
      )}
    </div>
  );
}

