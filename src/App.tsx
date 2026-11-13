/**
 * Bárbara: Crónicas Elementales del Sur
 * Inspired by Pokémon Rojo Fuego & Final Fantasy III
 * Main Game State Controller & Shell
 */

import React, { useState, useEffect } from 'react';
import {
  GameState,
  RegionId,
  SpiritCreature,
  BarbaraHero,
  InventoryItem,
  HeroGender,
  REGION_MEDALS,
  OverworldEntity,
  RARE_SUMMIT_CREATURE_BY_REGION,
} from './types/game';
import { REGIONS_DATA } from './data/regionsData';
import { createSpiritInstance, checkNewMovesToLearn, SPIRITS_REGISTRY, ELEMENT_META } from './data/spiritsData';
import { INITIAL_ITEMS } from './data/itemsData';
import { sound } from './services/audioService';
import { storageService } from './services/storageService';
import { drawCreatureSprite } from './utils/pixelRenderer';

import endingAmanecerImg from './assets/images/ending_amanecer_chile_1794579897966.jpg';
import endingGuardianesImg from './assets/images/ending_guardianes_unidos_1794579900820.jpg';
import endingTravesiaImg from './assets/images/ending_nueva_travesia_1794579899406.jpg';

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
import { ProfileModal } from './components/ProfileModal';
import { OnboardingModal } from './components/OnboardingModal';
import { Trophy, RotateCcw, CheckCircle2, AlertTriangle, Compass, Sparkles, BookMarked, Skull, FolderOpen } from 'lucide-react';

const SAFE_SPAWN_BY_REGION: Record<RegionId, { x: number; y: number }> = {
  casa: { x: 5, y: 6 },
  santiago: { x: 14, y: 3 },
  biobio: { x: 18, y: 2 },
  araucania: { x: 7, y: 2 },
  losrios: { x: 21, y: 2 },
  loslagos: { x: 11, y: 2 },
  hospital: { x: 5, y: 7 },
  santuario: { x: 5, y: 7 },
  tienda: { x: 5, y: 7 },
};

const INTERIOR_DOORSTEP_EXIT: Partial<Record<RegionId, { x: number; y: number }>> = {
  santiago: { x: 4, y: 11 },
  biobio: { x: 3, y: 6 },
  araucania: { x: 3, y: 6 },
  losrios: { x: 3, y: 6 },
  loslagos: { x: 22, y: 11 },
};

export default function App() {
  // Game Flow State
  const [gameState, setGameState] = useState<GameState>('title');
  const [currentRegionId, setCurrentRegionId] = useState<RegionId>('casa');
  const [unlockedRegions, setUnlockedRegions] = useState<RegionId[]>(['casa', 'santiago']);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [hasSave, setHasSave] = useState<boolean>(storageService.hasSavedGame());
  const [hasCompletedStory, setHasCompletedStory] = useState<boolean>(false);

  // Position & Fog-of-War state preserved across battles, menus, and saves
  const [playerSpawnPos, setPlayerSpawnPos] = useState<{ x: number; y: number }>({ x: 5, y: 6 });
  const [interiorReturnLocation, setInteriorReturnLocation] = useState<{
    regionId: RegionId;
    x: number;
    y: number;
    shopVendorName?: string;
    shopSubtitle?: string;
  } | null>(null);
  const [revealedTiles, setRevealedTiles] = useState<Record<string, string[]>>({});

  // Sub-modals & celebration overlays
  const [showCharacterCreate, setShowCharacterCreate] = useState(false);
  const [showPrologue, setShowPrologue] = useState(false);
  const [showStarterSelect, setShowStarterSelect] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [chosenStarterName, setChosenStarterName] = useState('Brotín');
  const [showSystemMenu, setShowSystemMenu] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load' | 'manage' | null>(null);
  const [activeShopMeta, setActiveShopMeta] = useState<{ vendorName?: string; regionSubtitle?: string } | null>(null);
  const [bossVictoryOverlay, setBossVictoryOverlay] = useState<{
    bossName: string;
    regionName: string;
    medalName?: string;
    rewardItemText?: string;
    goldEarned?: number;
    pendingDialogue?: { speaker: string; lines: string[]; portraitSprite?: string };
    triggersEnding?: boolean;
  } | null>(null);
  const [bestiaryCompleteOverlay, setBestiaryCompleteOverlay] = useState(false);
  const [newBestiaryPopup, setNewBestiaryPopup] = useState<{
    baseId: string;
    stage: number;
    name: string;
    lore: string;
    primaryElement: SpiritCreature['primaryElement'];
    secondaryElement?: SpiritCreature['secondaryElement'];
    dexIndex: number;
    totalSpecies: number;
    ownedCount: number;
  } | null>(null);
  const [pendingBestiaryPopup, setPendingBestiaryPopup] = useState<{
    baseId: string;
    stage: number;
    name: string;
    lore: string;
    primaryElement: SpiritCreature['primaryElement'];
    secondaryElement?: SpiritCreature['secondaryElement'];
    dexIndex: number;
    totalSpecies: number;
    ownedCount: number;
  } | null>(null);

  // Notification Toast & Reset Confirmation
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSummitRareBattleRef = React.useRef<{ spiritId: string; level: number; label: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Protagonist State
  const [barbara, setBarbara] = useState<BarbaraHero>({
    name: 'Elegido',
    gender: 'female',
    level: 1,
    exp: 0,
    maxExp: 100,
    currentHp: 120,
    maxHp: 120,
    limitGauge: 20,
    resonanceOrbs: 8,
    gold: 200,
    activeSpiritUids: [],
    medals: [],
    medalRecords: [],
    seenSpeciesIds: ['brotin'],
    registeredEvolutionKeys: ['brotin:1'],
    bestiaryCompleted: false,
    battlesWon: 0,
    spiritsCaptured: 0,
    playTimeSeconds: 0,
  });

  // Party Spirits
  const [partySpirits, setPartySpirits] = useState<SpiritCreature[]>([
    createSpiritInstance('brotin', 3, 1),
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

  // Regional atmospheric ambient audio sync
  useEffect(() => {
    if (gameState === 'exploration') {
      sound.startAmbient(currentRegionId);
    } else {
      sound.stopAmbient();
    }
  }, [gameState, currentRegionId]);

  // Cumulative Play Time Tracker (seconds spent exploring or battling)
  useEffect(() => {
    if (gameState !== 'exploration' && gameState !== 'battle') return;
    const timer = setInterval(() => {
      setBarbara(prev => ({
        ...prev,
        playTimeSeconds: (prev.playTimeSeconds ?? 0) + 1,
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const handleDismissBossVictory = React.useCallback(
    (nextAction: 'continue' | 'profile' = 'continue') => {
      setBossVictoryOverlay(prev => {
        if (!prev) return null;
        if (nextAction === 'profile') {
          setGameState('profile');
          return null;
        }
        if (prev.triggersEnding) {
          setHasCompletedStory(true);
          setGameState('victory');
          sound.playBgm('victory');
        } else if (prev.pendingDialogue) {
          setActiveDialogue(prev.pendingDialogue);
        }
        return null;
      });
      if (nextAction === 'continue') {
        setPendingBestiaryPopup(queued => {
          if (queued) setNewBestiaryPopup(queued);
          return null;
        });
      }
    },
    []
  );

  const handleRevealTiles = React.useCallback((regionId: RegionId, newCoords: string[]) => {
    if (newCoords.length === 0) return;
    setRevealedTiles(prev => {
      const existing = prev[regionId] || [];
      const set = new Set(existing);
      let added = false;
      for (const c of newCoords) {
        if (!set.has(c)) {
          set.add(c);
          added = true;
        }
      }
      if (!added) return prev;
      return { ...prev, [regionId]: Array.from(set) };
    });
  }, []);

  const showToast = React.useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const handleSightSpecies = React.useCallback((speciesIds: string[]) => {
    if (speciesIds.length === 0) return;
    setBarbara(prev => {
      const existing = new Set(prev.seenSpeciesIds || []);
      let added = false;
      speciesIds.forEach(id => {
        if (id && !existing.has(id)) {
          existing.add(id);
          added = true;
        }
      });
      if (!added) return prev;
      return { ...prev, seenSpeciesIds: Array.from(existing) };
    });
  }, []);

  const handleRevealRegionMap = React.useCallback(
    (regionId: RegionId) => {
      const reg = REGIONS_DATA[regionId];
      if (!reg) return;
      const hadUnvisitedSummit = reg.entities.some(ent => ent.revealsRegionMap && !ent.cleared);
      reg.entities.forEach(ent => {
        if (ent.revealsRegionMap) ent.cleared = true;
      });
      const allCoords: string[] = [];
      for (let y = 0; y < reg.height; y++) {
        for (let x = 0; x < reg.width; x++) {
          allCoords.push(`${x},${y}`);
        }
      }
      setRevealedTiles(prev => ({ ...prev, [regionId]: allCoords }));

      const speciesToSight: string[] = [];
      reg.entities.forEach(ent => {
        if (ent.encounterSpiritId) speciesToSight.push(ent.encounterSpiritId);
        if (ent.bossSpiritId) speciesToSight.push(ent.bossSpiritId);
      });
      handleSightSpecies(speciesToSight);

      const rareCfg = RARE_SUMMIT_CREATURE_BY_REGION[regionId];
      if (hadUnvisitedSummit && rareCfg) {
        pendingSummitRareBattleRef.current = rareCfg;
      }

      showToast('🗺️ ¡Cima explorada! Sombra del mapa despejada en toda la región.');
    },
    [handleSightSpecies, showToast]
  );

  const handleCollectPickup = React.useCallback(
    (entityId: string, healHpPercent?: number, healMpPercent?: number, label?: string) => {
      const reg = REGIONS_DATA[currentRegionId];
      const ent = reg?.entities.find(e => e.id === entityId);
      if (ent) ent.cleared = true;

      const hpPct = healHpPercent ?? 0;
      const mpPct = healMpPercent ?? 0;

      setPartySpirits(prev =>
        prev.map(s => {
          const addedHp = hpPct > 0 ? Math.max(1, Math.round((s.maxHp * hpPct) / 100)) : 0;
          const addedMp = mpPct > 0 ? Math.max(1, Math.round((s.maxMp * mpPct) / 100)) : 0;
          return {
            ...s,
            currentHp: Math.min(s.maxHp, s.currentHp + addedHp),
            currentMp: Math.min(s.maxMp, s.currentMp + addedMp),
          };
        })
      );

      if (hpPct > 0) {
        setBarbara(prev => ({
          ...prev,
          currentHp: Math.min(prev.maxHp, prev.currentHp + Math.max(1, Math.round((prev.maxHp * hpPct) / 100))),
        }));
      }

      if (hpPct > 0 && mpPct > 0) {
        showToast(`✨ ¡${label || 'Recurso'} recogido! +${hpPct}% PS y +${mpPct}% PM al equipo.`);
      } else if (hpPct > 0) {
        showToast(`💚 ¡${label || 'Hierba de Salud'} recogida! +${hpPct}% PS a tus Criaturas Espirituales.`);
      } else if (mpPct > 0) {
        showToast(`💧 ¡${label || 'Esencia de Maná'} recogida! +${mpPct}% PM a tus Criaturas Espirituales.`);
      }
    },
    [currentRegionId, showToast]
  );

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

  // Starter Choice -> Post-starter Objectives & Controls Onboarding -> Exploration in Stage 0
  const handleSelectStarter = (chosenSpirit: SpiritCreature) => {
    sound.init();
    setPartySpirits([chosenSpirit]);
    setBarbara(prev => ({
      ...prev,
      seenSpeciesIds: Array.from(new Set([...(prev.seenSpeciesIds || []), chosenSpirit.baseId])),
      registeredEvolutionKeys: Array.from(
        new Set([
          ...(prev.registeredEvolutionKeys || []),
          `${chosenSpirit.baseId}:${chosenSpirit.currentStage}`,
        ])
      ),
    }));
    setChosenStarterName(chosenSpirit.name);
    setShowStarterSelect(false);
    setShowOnboarding(true);
    setCurrentRegionId('casa');
    setUnlockedRegions(['casa', 'santiago']);
    setPlayerSpawnPos(SAFE_SPAWN_BY_REGION.casa);
    setInteriorReturnLocation(null);
    setRevealedTiles({});
    setGameState('exploration');
    sound.playBgm('casa');
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
      interiorReturnLocation: interiorReturnLocation || undefined,
      revealedTiles,
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

    const partySeen = data.partySpirits.map(s => s.baseId);
    const partyEvoKeys = data.partySpirits.flatMap(s =>
      Array.from({ length: s.currentStage || 1 }, (_, i) => `${s.baseId}:${i + 1}`)
    );

    setCurrentRegionId(data.currentRegionId);
    setUnlockedRegions(data.unlockedRegions);
    setBarbara({
      ...data.barbara,
      gender: data.barbara.gender || 'female',
      seenSpeciesIds: Array.from(new Set([...(data.barbara.seenSpeciesIds || []), ...partySeen])),
      registeredEvolutionKeys: Array.from(
        new Set([...(data.barbara.registeredEvolutionKeys || []), ...partyEvoKeys])
      ),
    });
    setPartySpirits(data.partySpirits);
    setInventory(data.inventory);
    setHasCompletedStory(Boolean(data.hasCompletedStory));
    setInteriorReturnLocation(data.interiorReturnLocation || null);
    setRevealedTiles(data.revealedTiles || {});
    if (data.playerSpawnPos) setPlayerSpawnPos(data.playerSpawnPos);

    // Clear all flags first, then restore saved cleared flags
    Object.values(REGIONS_DATA).forEach(reg => {
      reg.entities.forEach(ent => {
        ent.cleared = data.clearedEntityIds.includes(ent.id);
      });
    });

    setSaveLoadMode(null);
    setShowSystemMenu(false);
    setShowOnboarding(false);
    setBossVictoryOverlay(null);
    setBestiaryCompleteOverlay(false);
    setNewBestiaryPopup(null);
    setPendingBestiaryPopup(null);
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
    setShowOnboarding(false);
    setSaveLoadMode(null);
    setBossVictoryOverlay(null);
    setBestiaryCompleteOverlay(false);
    setNewBestiaryPopup(null);
    setPendingBestiaryPopup(null);

    setBarbara({
      name: 'Elegido',
      gender: 'female',
      level: 1,
      exp: 0,
      maxExp: 100,
      currentHp: 120,
      maxHp: 120,
      limitGauge: 20,
      resonanceOrbs: 8,
      gold: 200,
      activeSpiritUids: [],
      medals: [],
      medalRecords: [],
      seenSpeciesIds: ['brotin'],
      registeredEvolutionKeys: ['brotin:1'],
      bestiaryCompleted: false,
      battlesWon: 0,
      spiritsCaptured: 0,
      playTimeSeconds: 0,
    });

    setPartySpirits([createSpiritInstance('brotin', 3, 1)]);
    setInventory(INITIAL_ITEMS);
    setCurrentRegionId('casa');
    setUnlockedRegions(['casa', 'santiago']);
    setPlayerSpawnPos(SAFE_SPAWN_BY_REGION.casa);
    setInteriorReturnLocation(null);
    setRevealedTiles({});
    setShowPrologue(false);
    setShowStarterSelect(false);
    setShowCharacterCreate(false);

    Object.values(REGIONS_DATA).forEach(reg => {
      reg.entities.forEach(ent => {
        ent.cleared = false;
      });
    });

    setGameState('title');
    sound.playBgm('title');
    showToast('🔄 ¡Aventura reiniciada! Regresaste a la pantalla de título.');
  };

  // Trigger Battle preserving exact map position & progressive regional level curve
  const handleTriggerBattle = (
    enemySpiritId: string,
    isBoss: boolean,
    atPos?: { x: number; y: number },
    entityId?: string,
    overrideLevel?: number,
    overrideStage?: number
  ) => {
    if (atPos) {
      setPlayerSpawnPos(atPos);
    }
    setActiveEncounterEntityId(entityId || null);
    handleSightSpecies([enemySpiritId]);

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

    const enemyLevel = overrideLevel ?? matchedEnt?.customLevel ?? (isBoss ? fallbackBossLevel : fallbackWildLevel);
    const enemyStage = overrideStage ?? matchedEnt?.customStage ?? (isBoss ? 2 : 1);

    const enemy = createSpiritInstance(enemySpiritId, enemyLevel, enemyStage);
    if (!isBoss) {
      enemy.maxHp = Math.round(enemy.maxHp * 0.85);
      enemy.currentHp = enemy.maxHp;
    }

    setActiveEnemySpirit(enemy);
    setIsBossBattle(isBoss);
    setGameState('battle');
  };

  // Victory in Battle (with Duplicate Capture EXP conversion & Boss Guardian Medals)
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

    let duplicateBonusMsg: string | null = null;

    setPartySpirits(prev => {
      const next = prev.map(s => (s.uid === updatedPlayerSpirit.uid ? updatedPlayerSpirit : s));
      if (capturedSpirit) {
        const existingIdx = next.findIndex(s => s.baseId === capturedSpirit.baseId);
        if (existingIdx !== -1) {
          const orig = next[existingIdx];
          const bonusExp = capturedSpirit.level * 55 * 3;
          let expAcc = orig.exp + bonusExp;
          let lvl = orig.level;
          let maxExp = orig.maxExp;
          let gainedLevels = 0;
          const skills = [...orig.skills];

          while (expAcc >= maxExp) {
            expAcc -= maxExp;
            lvl += 1;
            maxExp = lvl * 65;
            gainedLevels += 1;
            const learned = checkNewMovesToLearn(orig, lvl);
            learned.forEach(m => {
              if (!skills.some(s => s.id === m.id)) skills.push(m);
            });
          }

          const hpGain = gainedLevels * 12;
          const mpGain = gainedLevels * 5;
          next[existingIdx] = {
            ...orig,
            level: lvl,
            exp: expAcc,
            maxExp,
            skills,
            maxHp: orig.maxHp + hpGain,
            currentHp: Math.min(orig.maxHp + hpGain, orig.currentHp + hpGain),
            maxMp: orig.maxMp + mpGain,
            currentMp: Math.min(orig.maxMp + mpGain, orig.currentMp + mpGain),
            attack: orig.attack + gainedLevels * 3,
            defense: orig.defense + gainedLevels * 3,
            spAttack: orig.spAttack + gainedLevels * 4,
            spDefense: orig.spDefense + gainedLevels * 3,
            speed: orig.speed + gainedLevels * 2,
          };

          duplicateBonusMsg =
            gainedLevels > 0
              ? `✨ ¡${capturedSpirit.name} repetido dio +${bonusExp} EXP (+200%) y subió a ${orig.name} a Nv.${lvl}!`
              : `✨ ¡${capturedSpirit.name} repetido otorgó +${bonusExp} EXP (+200%) a tu ${orig.name}!`;
        } else {
          next.push(capturedSpirit);
        }
      }
      return next;
    });

    if (duplicateBonusMsg) {
      showToast(duplicateBonusMsg);
    }

    // Check Bestiary 25/25 mastery upon capture + register seen & evolution forms
    const seenAfter = Array.from(
      new Set([
        ...(updatedBarbara.seenSpeciesIds || []),
        ...partySpirits.map(s => s.baseId),
        ...(activeEnemySpirit ? [activeEnemySpirit.baseId] : []),
        ...(capturedSpirit ? [capturedSpirit.baseId] : []),
      ])
    );
    const evoKeysAfterSet = new Set(updatedBarbara.registeredEvolutionKeys || []);
    partySpirits.forEach(s => {
      for (let st = 1; st <= (s.currentStage || 1); st++) evoKeysAfterSet.add(`${s.baseId}:${st}`);
    });
    if (capturedSpirit) {
      for (let st = 1; st <= (capturedSpirit.currentStage || 1); st++) {
        evoKeysAfterSet.add(`${capturedSpirit.baseId}:${st}`);
      }
    }

    const uniqueOwnedAfter = new Set([
      ...partySpirits.map(s => s.baseId),
      ...(capturedSpirit ? [capturedSpirit.baseId] : []),
    ]).size;
    const totalRegistryCount = Object.keys(SPIRITS_REGISTRY).length;
    const justCompletedBestiary =
      uniqueOwnedAfter >= totalRegistryCount && !updatedBarbara.bestiaryCompleted;

    // Track victory counters & check Boss Guardian Medal eligibility + chronological record
    const nextHeroState: BarbaraHero = {
      ...updatedBarbara,
      medals: [...(updatedBarbara.medals || [])],
      medalRecords: [...(updatedBarbara.medalRecords || [])],
      seenSpeciesIds: seenAfter,
      registeredEvolutionKeys: Array.from(evoKeysAfterSet),
      bestiaryCompleted: Boolean(updatedBarbara.bestiaryCompleted) || uniqueOwnedAfter >= totalRegistryCount,
      battlesWon: (updatedBarbara.battlesWon ?? 0) + 1,
      spiritsCaptured: (updatedBarbara.spiritsCaptured ?? 0) + (capturedSpirit ? 1 : 0),
    };

    let awardedMedalName: string | undefined;
    let awardedBossItemsText: string | undefined;

    if (isBossBattle) {
      let medalToGrant: string | null = null;
      if (currentRegionId === 'santiago') medalToGrant = 'medalla_rm';
      else if (currentRegionId === 'biobio') medalToGrant = 'medalla_biobio';
      else if (currentRegionId === 'araucania') medalToGrant = 'medalla_araucania';
      else if (currentRegionId === 'losrios') medalToGrant = 'medalla_losrios';
      else if (currentRegionId === 'loslagos') {
        const regEntities = REGIONS_DATA.loslagos.entities;
        const caiCai = regEntities.find(e => e.id === 'boss_loslagos_caicai');
        const viluVilu = regEntities.find(e => e.id === 'boss_loslagos_viluvilu');
        if (caiCai?.cleared && viluVilu?.cleared) {
          medalToGrant = 'medalla_loslagos';
        }
      }

      // Grant key level-up fruit (+1 Nivel) on every boss defeat, plus +10 Nivel Esencia Milenaria on final twin bosses
      const isFinalTwinClear = medalToGrant === 'medalla_loslagos';
      setInventory(prev => ({
        ...prev,
        fruto_alerce: {
          ...(prev.fruto_alerce || INITIAL_ITEMS.fruto_alerce),
          count: (prev.fruto_alerce?.count || 0) + 1,
        },
        ...(isFinalTwinClear
          ? {
              esencia_milenaria: {
                ...(prev.esencia_milenaria || INITIAL_ITEMS.esencia_milenaria),
                count: (prev.esencia_milenaria?.count || 0) + 1,
              },
            }
          : {}),
      }));
      awardedBossItemsText = isFinalTwinClear
        ? '1× Fruto de Alerce (+1 Nv.) y 1× Esencia Milenaria (+10 Nv.)'
        : '1× Fruto de Alerce (+1 Nv.)';

      if (medalToGrant) {
        const medalMeta = REGION_MEDALS.find(m => m.id === medalToGrant);
        awardedMedalName = medalMeta?.name;

        if (!nextHeroState.medals.includes(medalToGrant)) {
          nextHeroState.medals.push(medalToGrant);
          const existingRecords = nextHeroState.medalRecords || [];
          if (!existingRecords.some(r => r.medalId === medalToGrant)) {
            existingRecords.push({
              medalId: medalToGrant,
              bossName: medalMeta?.bossName || activeEnemySpirit?.name || 'Guardián Regional',
              regionLabel: medalMeta?.regionLabel || currentRegion.name,
              order: existingRecords.length + 1,
              earnedAt: new Date().toISOString(),
            });
            nextHeroState.medalRecords = existingRecords;
          }
          if (medalMeta) {
            showToast(`🏅 ¡Obtuviste el ${medalMeta.name} y objeto clave ${awardedBossItemsText}!`);
          }
        }
      }
    }

    const goldEarned = Math.max(0, updatedBarbara.gold - barbara.gold);

    // Detect brand-new Bestiary registration (species not owned OR new evolution stage unlocked via capture)
    const prevOwnedIds = partySpirits.map(s => s.baseId);
    const prevEvoKeys = barbara.registeredEvolutionKeys || [];
    const capturedEvoKey = capturedSpirit ? `${capturedSpirit.baseId}:${capturedSpirit.currentStage || 1}` : null;
    const isNewBestiaryRegistration = Boolean(
      capturedSpirit &&
        (!prevOwnedIds.includes(capturedSpirit.baseId) ||
          (capturedEvoKey && !prevEvoKeys.includes(capturedEvoKey)))
    );
    const registryKeys = Object.keys(SPIRITS_REGISTRY);
    const bestiaryUnlockPayload =
      isNewBestiaryRegistration && capturedSpirit
        ? {
            baseId: capturedSpirit.baseId,
            stage: capturedSpirit.currentStage || 1,
            name: capturedSpirit.name,
            lore: capturedSpirit.lore,
            primaryElement: capturedSpirit.primaryElement,
            secondaryElement: capturedSpirit.secondaryElement,
            dexIndex: Math.max(1, registryKeys.indexOf(capturedSpirit.baseId) + 1),
            totalSpecies: registryKeys.length,
            ownedCount: uniqueOwnedAfter,
          }
        : null;

    setBarbara(nextHeroState);
    if (justCompletedBestiary) {
      setBestiaryCompleteOverlay(true);
    }

    if (isBossBattle) {
      let pendingDialogue: { speaker: string; lines: string[]; portraitSprite?: string } | undefined;
      let triggersEnding = false;

      if (currentRegionId === 'santiago') {
        if (!unlockedRegions.includes('biobio')) {
          setUnlockedRegions(prev => [...prev, 'biobio']);
        }
        pendingDialogue = {
          speaker: 'Maestro Vínculo Rodrigo',
          lines: [
            `¡Extraordinario combate, ${nextHeroState.name}! Te entrego el Amuleto Espiritual Valle Central de la R. Metropolitana.`,
            'El sendero nuboso hacia la R. del Biobío y su antigua vía férrea han sido despejados.',
          ],
          portraitSprite: 'npc_maestro_vinculo',
        };
      } else if (currentRegionId === 'biobio') {
        if (!unlockedRegions.includes('araucania')) {
          setUnlockedRegions(prev => [...prev, 'araucania']);
        }
        pendingDialogue = {
          speaker: 'Maestro Vínculo Lautaro',
          lines: [
            '¡El Rex Fósil del Biobío reconoce tu fuerza! Recibes el Amuleto Espiritual Jurásico Biobío.',
            'Ahora puedes cruzar al sur hacia los bosques de pewén en la R. de La Araucanía.',
          ],
          portraitSprite: 'npc_maestro_vinculo',
        };
      } else if (currentRegionId === 'araucania') {
        if (!unlockedRegions.includes('losrios')) {
          setUnlockedRegions(prev => [...prev, 'losrios']);
        }
        pendingDialogue = {
          speaker: 'Maestro Vínculo Kallfü',
          lines: [
            '¡La Araucaria Madre ha vuelto a florecer en equilibrio! Aquí tienes el Amuleto Espiritual Pewén Araucanía.',
            'Tu siguiente destino es la R. de Los Ríos y su selva valdiviana.',
          ],
          portraitSprite: 'npc_maestro_vinculo',
        };
      } else if (currentRegionId === 'losrios') {
        if (!unlockedRegions.includes('loslagos')) {
          setUnlockedRegions(prev => [...prev, 'loslagos']);
        }
        pendingDialogue = {
          speaker: 'Maestra Vínculo Antonia',
          lines: [
            '¡Las aguas del Calle-Calle brillan limpias! Recibes el Amuleto Espiritual Selva Valdiviana.',
            'El desafío final te espera en la R. de Los Lagos frente a Cai Cai y Vilu Vilu.',
          ],
          portraitSprite: 'npc_maestro_vinculo',
        };
      } else if (currentRegionId === 'loslagos') {
        const regEntities = REGIONS_DATA.loslagos.entities;
        const caiCai = regEntities.find(e => e.id === 'boss_loslagos_caicai');
        const viluVilu = regEntities.find(e => e.id === 'boss_loslagos_viluvilu');
        if (caiCai?.cleared && viluVilu?.cleared) {
          triggersEnding = true;
        } else {
          pendingDialogue = {
            speaker: 'Maestros Kalfú y Llankal',
            lines: [
              !caiCai?.cleared
                ? '¡Gran triunfo ante Vilu Vilu! Ahora derrota a Cai Cai Vilu para ganar el Amuleto Espiritual Serpientes Australes.'
                : '¡Gran triunfo ante Cai Cai Vilu! Ahora derrota a Vilu Vilu para ganar el Amuleto Espiritual Serpientes Australes.',
            ],
            portraitSprite: 'npc_maestro_vinculo',
          };
        }
      }

      sound.playLevelUp();
      setGameState('exploration');
      if (bestiaryUnlockPayload) {
        setPendingBestiaryPopup(bestiaryUnlockPayload);
      }
      setBossVictoryOverlay({
        bossName: activeEnemySpirit?.name || 'Guardián Regional',
        regionName: currentRegion.name,
        medalName: awardedMedalName,
        rewardItemText: awardedBossItemsText,
        goldEarned,
        pendingDialogue,
        triggersEnding,
      });
      return;
    }

    setGameState('exploration');
    if (bestiaryUnlockPayload) {
      sound.playLevelUp();
      setNewBestiaryPopup(bestiaryUnlockPayload);
    }
  };

  // Defeat in Battle -> Dedicated Game Over Screen
  const handleBattleDefeat = () => {
    sound.stopBgm();
    sound.playCancel();
    setActiveEncounterEntityId(null);
    setGameState('gameover');
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
    showToast('🌿 ¡Criaturas Espirituales y guardianes han reaparecido en todas las etapas!');
  };

  // Evolution Trigger (Temples only in Stages 2 & 4)
  const handleEvolveSpirit = (spiritUid: string, nextStageNumber: number, usedItemKey?: string) => {
    const targetSpirit = partySpirits.find(s => s.uid === spiritUid);
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

    if (targetSpirit) {
      setBarbara(prev => {
        const keys = new Set(prev.registeredEvolutionKeys || []);
        for (let st = 1; st <= nextStageNumber; st++) {
          keys.add(`${targetSpirit.baseId}:${st}`);
        }
        return {
          ...prev,
          seenSpeciesIds: Array.from(new Set([...(prev.seenSpeciesIds || []), targetSpirit.baseId])),
          registeredEvolutionKeys: Array.from(keys),
        };
      });
    }

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

  // Sync Battle Party (persists HP/MP & leader order across team switches)
  const handleSyncBattleParty = (updatedParty: SpiritCreature[], activeUid: string) => {
    const idx = updatedParty.findIndex(s => s.uid === activeUid);
    if (idx > 0) {
      const reordered = [...updatedParty];
      const [active] = reordered.splice(idx, 1);
      reordered.unshift(active);
      setPartySpirits(reordered);
    } else {
      setPartySpirits(updatedParty);
    }
  };

  // Set Party Companion (Compañero Espiritual)
  const handleSetLeaderSpirit = (spiritUid: string) => {
    setPartySpirits(prev => {
      const idx = prev.findIndex(s => s.uid === spiritUid);
      if (idx <= 0) return prev;
      const clone = [...prev];
      const [item] = clone.splice(idx, 1);
      clone.unshift(item);
      return clone;
    });
    showToast('👑 ¡Nuevo Compañero Espiritual asignado al combate y exploración!');
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

  // Clear Obstacle (awards EXP to active Compañero Espiritual + bonus obstacle gives random item & +25% rare battle)
  const handleClearObstacle = (entityId: string, message: string) => {
    const reg = REGIONS_DATA[currentRegionId];
    const ent = reg?.entities.find(e => e.id === entityId);
    if (ent) ent.cleared = true;

    // Award EXP to active Compañero Espiritual for performing elemental field skill
    const leader = partySpirits[0];
    let expNotice = '';
    if (leader) {
      const obstacleExp = 50 + Math.max(1, leader.level) * 14;
      let nextExp = leader.exp + obstacleExp;
      let nextLvl = leader.level;
      let maxExp = leader.maxExp;
      let levelsGained = 0;
      const skills = [...leader.skills];

      while (nextExp >= maxExp) {
        nextExp -= maxExp;
        nextLvl += 1;
        maxExp = nextLvl * 65;
        levelsGained += 1;
        const learned = checkNewMovesToLearn(leader, nextLvl);
        learned.forEach(m => {
          if (!skills.some(s => s.id === m.id)) skills.push(m);
        });
      }

      const hpGain = levelsGained * 12;
      const mpGain = levelsGained * 5;
      setPartySpirits(prev =>
        prev.map((s, idx) =>
          idx !== 0
            ? s
            : {
                ...s,
                level: nextLvl,
                exp: nextExp,
                maxExp,
                skills,
                maxHp: s.maxHp + hpGain,
                currentHp: Math.min(s.maxHp + hpGain, s.currentHp + hpGain),
                maxMp: s.maxMp + mpGain,
                currentMp: Math.min(s.maxMp + mpGain, s.currentMp + mpGain),
                attack: s.attack + levelsGained * 3,
                defense: s.defense + levelsGained * 3,
                spAttack: s.spAttack + levelsGained * 4,
                spDefense: s.spDefense + levelsGained * 3,
                speed: s.speed + levelsGained * 2,
              }
        )
      );
      if (levelsGained > 0) {
        sound.playLevelUp();
        expNotice = ` (+${obstacleExp} EXP · ¡${leader.name} subió a Nv.${nextLvl}!)`;
      } else {
        expNotice = ` (+${obstacleExp} EXP)`;
      }
    }

    if (ent?.isBonusObstacle) {
      const poolIds = [
        'matico',
        'gota_termal',
        'empanada',
        'infusion_calafate',
        'orbe_resonancia',
        'esencia_pewen',
        'corazon_basalto',
        'cristal_hielo',
        'fruto_alerce',
      ];
      const pickedItemId = poolIds[Math.floor(Math.random() * poolIds.length)];
      const itemTemplate = INITIAL_ITEMS[pickedItemId];
      if (itemTemplate) {
        setInventory(prev => ({
          ...prev,
          [pickedItemId]: {
            ...(prev[pickedItemId] || itemTemplate),
            count: (prev[pickedItemId]?.count || 0) + 1,
          },
        }));
      }
      showToast(`${message}${expNotice} 🎁 Botín extra: 1× ${itemTemplate?.name || pickedItemId}.`);

      const table = reg?.wildEncounterTable || [];
      if (table.length > 0) {
        const isRareEntry = (entry: (typeof table)[number]) => {
          const tpl = SPIRITS_REGISTRY[entry.spiritId];
          return (
            (entry.stage && entry.stage > 1) ||
            tpl?.rarity === 'raro' ||
            tpl?.rarity === 'místico' ||
            tpl?.rarity === 'legendario'
          );
        };
        const boostedTable = table.map(entry => ({
          ...entry,
          weight: isRareEntry(entry) ? Math.max(1, entry.weight) * 1.25 + 10 : Math.max(1, entry.weight),
        }));
        const total = boostedTable.reduce((acc, e) => acc + e.weight, 0);
        let roll = Math.random() * total;
        let chosen = boostedTable[0];
        for (const entry of boostedTable) {
          roll -= entry.weight;
          if (roll <= 0) {
            chosen = entry;
            break;
          }
        }
        const lvl =
          chosen.minLevel +
          Math.floor(Math.random() * Math.max(1, chosen.maxLevel - chosen.minLevel + 1));
        setTimeout(() => {
          sound.playEncounter();
          handleTriggerBattle(chosen.spiritId, false, undefined, undefined, lvl, chosen.stage || 1);
        }, 420);
      }
      return;
    }

    showToast(`${message}${expNotice}`);
  };

  // Use item from bag on spirit (includes Fruto de Alerce +1 Nv. & Esencia Milenaria +10 Nv.)
  const handleUseItemOnSpirit = (itemId: string, targetUid: string) => {
    const item = inventory[itemId];
    if (!item || item.count <= 0) return;

    const targetSpirit = partySpirits.find(s => s.uid === targetUid);
    if (!targetSpirit) return;

    if (item.effectType === 'level_up') {
      sound.playLevelUp();
      const levelsToAdd = Math.max(1, item.effectValue);
      let nextLevel = targetSpirit.level;
      let maxExp = targetSpirit.maxExp;
      const updatedSkills = [...targetSpirit.skills];
      for (let i = 0; i < levelsToAdd; i++) {
        nextLevel += 1;
        maxExp = nextLevel * 65;
        const learned = checkNewMovesToLearn(targetSpirit, nextLevel);
        learned.forEach(m => {
          if (!updatedSkills.some(sk => sk.id === m.id)) updatedSkills.push(m);
        });
      }
      const hpGain = levelsToAdd * 12;
      const mpGain = levelsToAdd * 5;
      setPartySpirits(prev =>
        prev.map(s =>
          s.uid !== targetUid
            ? s
            : {
                ...s,
                level: nextLevel,
                exp: 0,
                maxExp,
                skills: updatedSkills,
                maxHp: s.maxHp + hpGain,
                currentHp: s.maxHp + hpGain,
                maxMp: s.maxMp + mpGain,
                currentMp: s.maxMp + mpGain,
                attack: s.attack + levelsToAdd * 3,
                defense: s.defense + levelsToAdd * 3,
                spAttack: s.spAttack + levelsToAdd * 4,
                spDefense: s.spDefense + levelsToAdd * 3,
                speed: s.speed + levelsToAdd * 2,
              }
        )
      );
      setInventory(prev => ({
        ...prev,
        [itemId]: { ...item, count: item.count - 1 },
      }));
      showToast(`⭐ ¡Objeto clave ${item.name}! ${targetSpirit.name} subió +${levelsToAdd} Nv. (Nv.${nextLevel}).`);
      return;
    }

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

    showToast('🍃 Objeto utilizado con éxito en tu Criatura Espiritual.');
  };

  // Respawn wild spirits when switching outdoor stage (Bosses remain cleared until full game victory)
  const respawnStageWildCreatures = (stageId: RegionId) => {
    const reg = REGIONS_DATA[stageId];
    if (!reg) return;
    reg.entities.forEach(ent => {
      if (ent.type === 'wild_encounter' || ent.sprite.startsWith('wild_')) {
        ent.cleared = false;
      }
    });
  };

  // Linear & Interior Stage Movement (preserves exact outdoor doorstep & vendor metadata when returning from Hospital / Santuario / Tienda)
  const handleTravelPortal = (
    destRegion: RegionId,
    destX?: number,
    destY?: number,
    portalEntity?: OverworldEntity
  ) => {
    const isEnteringInterior =
      destRegion === 'hospital' || destRegion === 'santuario' || destRegion === 'tienda';
    const isExitingInterior =
      currentRegionId === 'hospital' || currentRegionId === 'santuario' || currentRegionId === 'tienda';

    if (isEnteringInterior) {
      const originReg = REGIONS_DATA[currentRegionId];
      const doorstep = portalEntity
        ? {
            x: portalEntity.x,
            y: Math.min((originReg?.height || 14) - 2, portalEntity.y + 1),
          }
        : INTERIOR_DOORSTEP_EXIT[currentRegionId] || playerSpawnPos;
      setInteriorReturnLocation({
        regionId: currentRegionId,
        x: doorstep.x,
        y: doorstep.y,
        shopVendorName: portalEntity?.shopVendorName,
        shopSubtitle: portalEntity?.shopSubtitle,
      });
      const insideSpawn = SAFE_SPAWN_BY_REGION[destRegion] || { x: destX ?? 5, y: destY ?? 7 };
      setPlayerSpawnPos(insideSpawn);
      setCurrentRegionId(destRegion);
      setGameState('exploration');
      sound.playBgm(destRegion);
      return;
    }

    if (isExitingInterior && interiorReturnLocation) {
      const targetReturn = interiorReturnLocation;
      setInteriorReturnLocation(null);
      setPlayerSpawnPos({ x: targetReturn.x, y: targetReturn.y });
      setCurrentRegionId(targetReturn.regionId);
      setGameState('exploration');
      sound.playBgm(targetReturn.regionId);
      return;
    }

    if (destRegion !== currentRegionId) {
      respawnStageWildCreatures(destRegion);
    }

    setInteriorReturnLocation(null);
    const spawnX = destX ?? SAFE_SPAWN_BY_REGION[destRegion]?.x ?? 14;
    const spawnY = destY ?? SAFE_SPAWN_BY_REGION[destRegion]?.y ?? 2;
    setPlayerSpawnPos({ x: spawnX, y: spawnY });
    setCurrentRegionId(destRegion);
    setGameState('exploration');
    sound.playBgm(destRegion);
  };

  // Fast travel from World Map
  const handleFastTravel = (targetRegion: RegionId) => {
    if (targetRegion !== currentRegionId) {
      respawnStageWildCreatures(targetRegion);
    }
    setInteriorReturnLocation(null);
    setPlayerSpawnPos(SAFE_SPAWN_BY_REGION[targetRegion] || { x: 14, y: 3 });
    setCurrentRegionId(targetRegion);
    setGameState('exploration');
    sound.playBgm(targetRegion);
  };

  // Dynamic Interior NPC injection (Tienda, Hospital, Santuarios adapt to the origin region)
  const currentRegion = React.useMemo(() => {
    const base = REGIONS_DATA[currentRegionId];
    const originId = interiorReturnLocation?.regionId;

    if (currentRegionId === 'tienda') {
      const extraTiendaNpcs: OverworldEntity[] =
        originId === 'loslagos'
          ? [
              {
                id: 'npc_tienda_lagos_pescador',
                type: 'npc',
                x: 2,
                y: 6,
                name: 'Pescador del Seno Reloncaví',
                sprite: 'npc_pescador',
                dialog: [
                  '¡Los cardúmenes de Puye Cristal están huyendo por los vertidos industriales sin control en las bahías!',
                  'En nuestras costas encontrarás al Puye cerca de los muellecitos. ¡Cuida los fiordos, Elegido!',
                ],
              },
              {
                id: 'npc_tienda_lagos_agricultora',
                type: 'npc',
                x: 8,
                y: 6,
                name: 'Agricultora de Chiloé',
                sprite: 'npc_agricultora',
                dialog: [
                  'Cultivamos papas nativas limpiando la tierra junto a las Criaturas Espirituales.',
                  'Lleva provisiones antes de cruzar el puente hacia la isla de los Jefes.',
                ],
              },
              {
                id: 'npc_tienda_lagos_nina',
                type: 'npc',
                x: 2,
                y: 3,
                name: 'Niña de Puerto Varas',
                sprite: 'npc_nina',
                dialog: [
                  '¡Vi volar a un Pingüino Austral y al Puye Cristal brillando bajo la lluvia!',
                ],
              },
            ]
          : originId === 'araucania'
          ? [
              {
                id: 'npc_tienda_araucania_pescador',
                type: 'npc',
                x: 2,
                y: 6,
                name: 'Pescador del Toltén',
                sprite: 'npc_pescador',
                dialog: [
                  'Algunas faenas forestales desreguladas intentaron represar el río, pero las criaturas de agua y fuego los frenaron.',
                  'Equipa bien a tu Compañero Espiritual antes de subir hacia el Volcán Villarrica.',
                ],
              },
              {
                id: 'npc_tienda_araucania_duena',
                type: 'npc',
                x: 8,
                y: 6,
                name: 'Dueña de Casa de Temuco',
                sprite: 'npc_duena_casa',
                dialog: [
                  '¡Qué alegría verte, Elegido! En nuestro barrio enseñamos a los niños a reciclar y proteger el pewén.',
                ],
              },
            ]
          : [
              {
                id: 'npc_tienda_rm_obrero',
                type: 'npc',
                x: 2,
                y: 6,
                name: 'Obrero Comprometido',
                sprite: 'npc_obrero',
                dialog: [
                  'Antes trabajaba en proyectos industriales sin resguardo cerca del Mapocho... hasta que escuché al Elegido y elegí cuidar el río.',
                  'Ahora reparamos senderos limpios para que vuelvan las loicas y torcazas.',
                ],
              },
              {
                id: 'npc_tienda_rm_nino',
                type: 'npc',
                x: 8,
                y: 6,
                name: 'Niño Explorador de Santiago',
                sprite: 'npc_nino',
                dialog: [
                  '¡Mi abuela dice que tú eres el Elegido! Toma muchos Amuletos de Vínculo y limpia la ciudad.',
                ],
              },
            ];

      return {
        ...base,
        subtitle: interiorReturnLocation?.shopSubtitle || base.subtitle,
        entities: [
          ...base.entities.map(ent =>
            ent.id === 'npc_vendedor_tienda' && interiorReturnLocation?.shopVendorName
              ? {
                  ...ent,
                  name: interiorReturnLocation.shopVendorName,
                  shopVendorName: interiorReturnLocation.shopVendorName,
                  shopSubtitle: interiorReturnLocation.shopSubtitle,
                }
              : ent
          ),
          ...extraTiendaNpcs,
        ],
      };
    }

    if (currentRegionId === 'hospital') {
      const extraHospitalNpcs: OverworldEntity[] =
        originId === 'biobio'
          ? [
              {
                id: 'npc_hosp_biobio_enfermo',
                type: 'npc',
                x: 2,
                y: 5,
                name: 'Paciente del Biobío',
                sprite: 'npc_enfermo',
                dialog: [
                  'Respiré el humo denso de las faenas industriales desreguladas cerca de la vía férrea.',
                  'Por suerte aquí nos atienden gratis y las criaturas nos ayudan a sanar el valle.',
                ],
              },
              {
                id: 'npc_hosp_biobio_doctor',
                type: 'npc',
                x: 8,
                y: 5,
                name: 'Doctor Andrés (Biobío)',
                sprite: 'npc_doctor',
                dialog: [
                  'Pisa la Cruz Central del salón cuando quieras curar al 100% a todo tu equipo sin costo.',
                  'Recuerda evolucionar a tus criaturas en el Santuario del este antes de enfrentar al Rex Fósil.',
                ],
              },
            ]
          : [
              {
                id: 'npc_hosp_rios_doctora',
                type: 'npc',
                x: 2,
                y: 5,
                name: 'Doctora Valeria (Los Ríos)',
                sprite: 'npc_doctora',
                dialog: [
                  'En Valdivia atendemos tanto a viajeros como a Criaturas Espirituales heridas por la lluvia ácida industrial.',
                  'La Cruz Central restaura todo su vigor al instante.',
                ],
              },
              {
                id: 'npc_hosp_rios_enfermera',
                type: 'npc',
                x: 8,
                y: 5,
                name: 'Enfermera Javiera',
                sprite: 'npc_enfermera',
                dialog: [
                  '¡Ánimo, Elegido! Si tienes Esencias guardadas, revisa el Santuario de Los Ríos después de curarte.',
                ],
              },
            ];
      return {
        ...base,
        entities: [...base.entities, ...extraHospitalNpcs],
      };
    }

    if (currentRegionId === 'santuario') {
      const extraSanctuaryNpc: OverworldEntity =
        originId === 'losrios'
          ? {
              id: 'npc_sant_losrios_celebrante',
              type: 'npc',
              x: 3,
              y: 5,
              name: 'Entrenadora Camila (Los Ríos)',
              sprite: 'npc_villager_f',
              dialog: [
                '¡No lo vas a creer! ¡Acabo de evolucionar a mi Criatura Espiritual en este Altar de Los Ríos!',
                'Con su nueva técnica elemental por fin podremos frenar la contaminación del Calle-Calle.',
              ],
            }
          : {
              id: 'npc_sant_biobio_celebrante',
              type: 'npc',
              x: 3,
              y: 5,
              name: 'Entrenador Mateo (Biobío)',
              sprite: 'npc_explorer',
              dialog: [
                '¡Por fin lo logré! ¡Mi Criatura Espiritual acaba de evolucionar aquí en el Santuario del Biobío!',
                'Si tus criaturas brillan en verde en la lista del Altar, ¡ya cumplen el nivel y la esencia para evolucionar!',
              ],
            };
      return {
        ...base,
        entities: [...base.entities, extraSanctuaryNpc],
      };
    }

    return base;
  }, [currentRegionId, interiorReturnLocation]);

  const activeSpirit = partySpirits[0];

  return (
    <div className="relative w-full h-full min-h-[100dvh] bg-zinc-950 font-sans antialiased text-zinc-100 overflow-hidden">
      {/* Subtle CRT scanline overlay */}
      <div className="scanlines absolute inset-0 z-40 pointer-events-none opacity-30" />

      {/* Floating Toast Notification (Blanco Humo + Negro Grafito outside exploration) */}
      {toastMessage && gameState !== 'exploration' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#F4F4F2]/95 border-2 border-zinc-500 text-[#1E2022] px-4 py-2 rounded-xl shadow-2xl font-mono text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200 max-w-[90vw]">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="truncate font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Reset Game Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-zinc-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F4F4F2] border-2 border-red-500 rounded-2xl p-6 max-w-md w-full shadow-2xl font-mono text-xs animate-in zoom-in-95 duration-150 text-[#1E2022]">
            <div className="flex items-center gap-2.5 text-red-700 font-pixel text-sm mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>¿REINICIAR TODA LA AVENTURA?</span>
            </div>
            <p className="text-zinc-700 leading-relaxed mb-4">
              Esta acción restablecerá todo tu progreso, partidas guardadas, Criaturas Espirituales e inventario. Regresarás a la pantalla de título para iniciar una nueva aventura.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 border border-zinc-400 rounded-xl text-[#1E2022] font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold cursor-pointer shadow-lg"
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

      {/* POST-STARTER ONBOARDING MODAL (Objectives & Touch Controls) */}
      {showOnboarding && gameState === 'exploration' && (
        <OnboardingModal
          heroName={barbara.name}
          starterName={chosenStarterName}
          heroGender={barbara.gender}
          starterId={activeSpirit?.baseId}
          totalBaseSpecies={Object.keys(SPIRITS_REGISTRY).length}
          totalEvolutionForms={Object.values(SPIRITS_REGISTRY).reduce(
            (acc, sp) => acc + sp.evolutionLine.length,
            0
          )}
          onComplete={() => {
            setShowOnboarding(false);
            showToast(`✨ ¡${chosenStarterName} acompaña a ${barbara.name} desde casa!`);
          }}
        />
      )}

      {/* SYSTEM MENU & MISSIONS MODAL */}
      {showSystemMenu && (
        <SystemMenuModal
          currentRegion={currentRegion}
          unlockedRegions={unlockedRegions}
          partySpirits={partySpirits}
          medals={barbara.medals || []}
          isMuted={isMuted}
          medalsCount={(barbara.medals || []).length}
          onToggleMute={handleToggleMute}
          onOpenProfile={() => setGameState('profile')}
          onOpenSaveLoad={() => setSaveLoadMode('manage')}
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

      {/* ADVENTURE GUIDE MODAL (Cómo Jugar, Objetivos, Habilidades y Combate) */}
      {showGuideModal && (
        <AdventureGuideModal
          currentRegion={currentRegion}
          unlockedRegions={unlockedRegions}
          partySpirits={partySpirits}
          barbara={barbara}
          seenSpeciesCount={(barbara.seenSpeciesIds || []).length}
          evoCount={(barbara.registeredEvolutionKeys || []).length}
          onClose={() => setShowGuideModal(false)}
        />
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
          partySpirits={partySpirits}
          barbara={barbara}
          isMuted={isMuted}
          hasCompletedStory={hasCompletedStory}
          initialSpawnPos={playerSpawnPos}
          revealedTiles={revealedTiles}
          importantMessage={toastMessage}
          onDismissImportantMessage={() => setToastMessage(null)}
          onRevealTiles={handleRevealTiles}
          onRevealRegionMap={handleRevealRegionMap}
          onCollectPickup={handleCollectPickup}
          onSightSpecies={handleSightSpecies}
          onSyncPosition={setPlayerSpawnPos}
          onHealAtHome={handleHealAtHome}
          onToggleMute={handleToggleMute}
          onOpenParty={() => setGameState('party')}
          onOpenInventory={() => setGameState('inventory')}
          onOpenMap={() => setGameState('map')}
          onOpenGuide={() => setShowGuideModal(true)}
          onOpenSystemMenu={() => setShowSystemMenu(true)}
          onOpenProfile={() => setGameState('profile')}
          onOpenEvolution={() => setGameState('evolution')}
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
          existingBaseIds={partySpirits.map(s => s.baseId)}
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
          onSyncBattleParty={handleSyncBattleParty}
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

      {/* 5. PARTY MENU */}
      {gameState === 'party' && (
        <PartyMenu
          partySpirits={partySpirits}
          onSetLeaderSpirit={handleSetLeaderSpirit}
          onClose={() => setGameState('exploration')}
        />
      )}

      {/* 5B. PROTAGONIST PROFILE & BOSS MEDALS */}
      {gameState === 'profile' && (
        <ProfileModal
          barbara={barbara}
          partySpirits={partySpirits}
          unlockedRegions={unlockedRegions}
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
          seenSpeciesIds={barbara.seenSpeciesIds || []}
          registeredEvolutionKeys={barbara.registeredEvolutionKeys || []}
          onClose={() => setGameState('exploration')}
        />
      )}

      {/* 9. WORLD MAP MODAL (Defaults to Stage Topography first) */}
      {gameState === 'map' && (
        <WorldMapModal
          currentRegionId={currentRegionId}
          unlockedRegions={unlockedRegions}
          playerPos={playerSpawnPos}
          revealedTiles={revealedTiles}
          hasCompletedStory={hasCompletedStory}
          onFastTravel={handleFastTravel}
          onClose={() => setGameState('exploration')}
        />
      )}

      {/* 10. BOSS VICTORY ANIMATION OVERLAY (Blanco Humo + Negro Grafito) */}
      {bossVictoryOverlay && gameState === 'exploration' && (
        <div className="fixed inset-0 z-50 bg-zinc-950/75 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="max-w-md w-full bg-[#F4F4F2] border-2 border-emerald-600 rounded-3xl p-5 sm:p-6 text-center shadow-2xl animate-victory-burst text-[#1E2022]">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600 text-white border-2 border-emerald-200 flex items-center justify-center mb-3 shadow-lg">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-500 text-emerald-900 font-silkscreen text-[10px] font-bold mb-2">
              ¡VICTORIA ANTE EL GUARDIÁN!
            </span>
            <h2 className="font-pixel text-base sm:text-lg text-[#1E2022] leading-snug mb-1">
              {bossVictoryOverlay.bossName}
            </h2>
            <p className="text-[11px] font-mono text-zinc-700 mb-3">
              {bossVictoryOverlay.regionName} ha recuperado su equilibrio elemental.
            </p>
            {bossVictoryOverlay.medalName && (
              <div className="p-2.5 bg-[#1E2022] text-[#F4F4F2] rounded-xl font-silkscreen text-xs font-bold mb-2 flex items-center justify-center gap-2 border border-zinc-700">
                <span>🏅</span>
                <span>{bossVictoryOverlay.medalName}</span>
              </div>
            )}
            {typeof bossVictoryOverlay.goldEarned === 'number' && bossVictoryOverlay.goldEarned > 0 && (
              <div className="p-2 bg-emerald-100 text-emerald-900 border border-emerald-500 rounded-xl font-mono text-[11px] font-bold mb-2">
                🪙 Recompensa del Guardián: +{bossVictoryOverlay.goldEarned} Oro
              </div>
            )}
            {bossVictoryOverlay.rewardItemText && (
              <div className="p-2 bg-[#E7E7E2] text-[#1E2022] border border-zinc-400 rounded-xl font-mono text-[11px] font-bold mb-4">
                🎁 Objeto Clave: {bossVictoryOverlay.rewardItemText}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  sound.playConfirm();
                  handleDismissBossVictory('continue');
                }}
                className="w-full py-2.5 min-h-[44px] bg-[#1E2022] hover:bg-zinc-800 text-[#F4F4F2] rounded-xl font-silkscreen text-xs font-bold cursor-pointer active:scale-95 transition-all"
              >
                {bossVictoryOverlay.triggersEnding ? 'VER FINAL DE LA CRÓNICA →' : 'CONTINUAR AVENTURA →'}
              </button>
              {!bossVictoryOverlay.triggersEnding && (
                <button
                  onClick={() => {
                    sound.playSelect();
                    handleDismissBossVictory('profile');
                  }}
                  className="w-full py-2.5 min-h-[42px] bg-stone-200 hover:bg-stone-300 border border-zinc-400 text-[#1E2022] rounded-xl font-silkscreen text-[11px] font-bold cursor-pointer active:scale-95 transition-all"
                >
                  VER PERFIL Y AMULETOS
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 10B. NEW BESTIARY ENTRY CAPTURE POPUP */}
      {newBestiaryPopup && !bossVictoryOverlay && gameState === 'exploration' && (
        <NewBestiaryEntryModal
          entry={newBestiaryPopup}
          onViewBestiary={() => {
            sound.playSelect();
            setNewBestiaryPopup(null);
            setGameState('bestiary');
          }}
          onContinue={() => {
            sound.playConfirm();
            setNewBestiaryPopup(null);
          }}
        />
      )}

      {/* 11. BESTIARY COMPLETION CELEBRATION OVERLAY */}
      {bestiaryCompleteOverlay && !bossVictoryOverlay && !newBestiaryPopup && gameState === 'exploration' && (
        <div className="fixed inset-0 z-50 bg-zinc-950/75 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="max-w-md w-full bg-[#F4F4F2] border-2 border-emerald-600 rounded-3xl p-5 sm:p-6 text-center shadow-2xl bestiary-master-glow animate-victory-burst text-[#1E2022]">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1E2022] text-emerald-400 border-2 border-emerald-500 flex items-center justify-center mb-3 shadow-lg">
              <BookMarked className="w-8 h-8" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-silkscreen text-[10px] font-bold mb-2">
              <Sparkles className="w-3 h-3" /> BESTIARIO 100% COMPLETADO
            </span>
            <h2 className="font-pixel text-base sm:text-lg text-[#1E2022] mb-1.5">
              ¡MAESTRO NATURALISTA!
            </h2>
            <p className="text-xs font-mono text-zinc-700 leading-relaxed mb-4">
              ¡Felicidades, {barbara.name}! Has registrado las <strong className="text-[#1E2022]">{Object.keys(SPIRITS_REGISTRY).length} especies</strong> de Chile desde la R. Metropolitana hasta los fiordos de Los Lagos. Tu logro ya brilla en tu Perfil.
            </p>
            <button
              onClick={() => {
                sound.playConfirm();
                setBestiaryCompleteOverlay(false);
              }}
              className="w-full py-2.5 min-h-[44px] bg-[#1E2022] hover:bg-zinc-800 text-[#F4F4F2] rounded-xl font-silkscreen text-xs font-bold cursor-pointer active:scale-95 transition-all"
            >
              ¡SEGUIR AVENTURA!
            </button>
          </div>
        </div>
      )}

      {/* 11B. GAME OVER SCREEN (Blanco Humo + Red semantic danger) */}
      {gameState === 'gameover' && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-[#F4F4F2] border-2 border-red-600 rounded-3xl p-5 sm:p-6 text-center shadow-2xl text-[#1E2022]">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 text-red-700 border-2 border-red-500 flex items-center justify-center mb-3 shadow-lg">
              <Skull className="w-8 h-8" />
            </div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-100 border border-red-400 text-red-800 font-silkscreen text-[10px] font-bold mb-2">
              FIN DE LA TRAVESÍA
            </span>
            <h2 className="font-pixel text-lg sm:text-xl text-[#1E2022] mb-2">
              GAME OVER
            </h2>
            <p className="text-xs font-mono text-zinc-700 leading-relaxed mb-5">
              Todas las Criaturas Espirituales de <strong className="text-[#1E2022] font-bold">{barbara.name}</strong> cayeron debilitadas. Los proyectos industriales sin resguardo ambiental siguen avanzando sobre el sur... ¡Carga una partida guardada o reinicia la expedición!
            </p>
            <div className="flex flex-col gap-2">
              {hasSave && (
                <button
                  onClick={() => {
                    sound.playConfirm();
                    setSaveLoadMode('load');
                  }}
                  className="w-full py-3 min-h-[44px] bg-[#1E2022] hover:bg-zinc-800 text-[#F4F4F2] rounded-xl font-silkscreen text-xs font-bold cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>CARGAR PARTIDA</span>
                </button>
              )}
              <button
                onClick={() => {
                  sound.playConfirm();
                  handleConfirmReset();
                }}
                className="w-full py-3 min-h-[44px] bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-xl font-silkscreen text-xs font-bold cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>REINICIAR AVENTURA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. GRAND VICTORY MODAL (Blanco Humo + Negro Grafito) */}
      {gameState === 'victory' && (
        <div className="fixed inset-0 z-50 bg-[#E7E7E2]/98 text-[#1E2022] flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 text-center select-none overflow-y-auto animate-in fade-in zoom-in-95 duration-500">
          <div className="max-w-3xl w-full flex flex-col items-center my-auto py-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-600 text-white border-2 border-emerald-200 flex items-center justify-center mb-3 shadow-2xl shrink-0">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 animate-bounce" />
            </div>

            <h1 className="font-pixel text-base sm:text-xl md:text-2xl text-[#1E2022] mb-1">
              ¡LA ARMONÍA DEL SUR HA SIDO RESTAURADA!
            </h1>
            <h2 className="font-cinzel text-xs sm:text-base text-zinc-700 font-bold mb-3 sm:mb-4">
              {barbara.name} &middot; {barbara.gender === 'male' ? 'El Elegido' : 'La Elegida'} de las Criaturas Espirituales de Chile
            </h2>

            {/* 3-Panel Generated Visual Story Sequence */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4 text-left">
              <div className="bg-[#F4F4F2] border-2 border-zinc-400 rounded-2xl overflow-hidden flex flex-col shadow-lg">
                <div className="aspect-video w-full bg-zinc-900 overflow-hidden">
                  <img
                    src={endingAmanecerImg}
                    alt="Amanecer de armonía en la cordillera chilena"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2.5">
                  <div className="font-silkscreen text-[10px] text-emerald-800 font-bold mb-0.5">1. TIERRAS SANADAS</div>
                  <p className="text-[10px] font-mono text-zinc-700 leading-snug">
                    Las faenas sin control son reemplazadas por educación ambiental y el agua y bosques sanan desde Santiago hasta Los Lagos.
                  </p>
                </div>
              </div>

              <div className="bg-[#F4F4F2] border-2 border-zinc-400 rounded-2xl overflow-hidden flex flex-col shadow-lg">
                <div className="aspect-video w-full bg-zinc-900 overflow-hidden">
                  <img
                    src={endingGuardianesImg}
                    alt="Criaturas Espirituales y guardianes elementales unidos"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2.5">
                  <div className="font-silkscreen text-[10px] text-emerald-800 font-bold mb-0.5">2. GUARDIANES UNIDOS</div>
                  <p className="text-[10px] font-mono text-zinc-700 leading-snug">
                    Los Maestros Vínculo y las 5 regiones celebran los Amuletos Espirituales obtenidos en equipo.
                  </p>
                </div>
              </div>

              <div className="bg-[#F4F4F2] border-2 border-zinc-400 rounded-2xl overflow-hidden flex flex-col shadow-lg">
                <div className="aspect-video w-full bg-zinc-900 overflow-hidden">
                  <img
                    src={endingTravesiaImg}
                    alt="Nueva travesía junto a tu compañero elemental"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2.5">
                  <div className="font-silkscreen text-[10px] text-emerald-800 font-bold mb-0.5">3. NUEVA TRAVESÍA</div>
                  <p className="text-[10px] font-mono text-zinc-700 leading-snug">
                    {barbara.name} y sus Criaturas Espirituales siguen educando y explorando para completar el Bestiario.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full bg-[#F4F4F2] border border-zinc-400 rounded-2xl p-3 sm:p-4 text-[11px] sm:text-xs text-zinc-700 font-mono leading-relaxed mb-4 text-left">
              <p className="text-[#1E2022]">
                R. Metropolitana, R. del Biobío, R. de La Araucanía, R. de Los Ríos y R. de Los Lagos brillan libres. Al cerrar esta crónica podrás continuar explorando todas las regiones, con tus Amuletos Espirituales intactos y Criaturas Espirituales listas para nuevas batallas.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
              <button
                onClick={handleContinueAfterVictory}
                className="w-full sm:flex-1 px-5 py-3 min-h-[46px] bg-[#1E2022] hover:bg-zinc-800 rounded-xl font-pixel text-xs text-[#F4F4F2] font-bold shadow-xl cursor-pointer flex items-center justify-center gap-2 border border-[#1E2022] active:scale-95"
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
                className="w-full sm:w-auto px-5 py-3 min-h-[46px] bg-stone-200 hover:bg-stone-300 rounded-xl font-pixel text-xs text-[#1E2022] font-bold border border-zinc-400 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>MENÚ INICIO</span>
              </button>
            </div>
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
            } else if (action?.type === 'evolution') {
              setGameState('evolution');
            } else if (action?.type === 'battle') {
              handleTriggerBattle(action.spiritId, action.isBoss, action.atPos, action.entityId);
            } else if (action?.type === 'portal') {
              handleTravelPortal(action.dest, action.x, action.y, action.portalEntity);
            } else if (pendingSummitRareBattleRef.current) {
              const pendingRare = pendingSummitRareBattleRef.current;
              pendingSummitRareBattleRef.current = null;
              setTimeout(() => {
                sound.playEncounter();
                showToast(`⚡ ¡Un ${pendingRare.label} apareció en la cumbre!`);
                handleTriggerBattle(pendingRare.spiritId, false, undefined, undefined, pendingRare.level, 1);
              }, 220);
            }
          }}
        />
      )}
    </div>
  );
}

const NewBestiaryEntryModal: React.FC<{
  entry: {
    baseId: string;
    stage: number;
    name: string;
    lore: string;
    primaryElement: SpiritCreature['primaryElement'];
    secondaryElement?: SpiritCreature['secondaryElement'];
    dexIndex: number;
    totalSpecies: number;
    ownedCount: number;
  };
  onViewBestiary: () => void;
  onContinue: () => void;
}> = ({ entry, onViewBestiary, onContinue }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    let t = 0;
    const render = () => {
      t += 0.05;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 128, 128);
        ctx.imageSmoothingEnabled = false;
        drawCreatureSprite(ctx, entry.baseId, entry.stage, 12, 12, 104, t, false);
      }
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [entry.baseId, entry.stage]);

  const primaryMeta = ELEMENT_META[entry.primaryElement];
  const secondaryMeta = entry.secondaryElement ? ELEMENT_META[entry.secondaryElement] : null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/75 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="max-w-sm w-full bg-[#F4F4F2] border-2 border-emerald-600 rounded-3xl p-5 text-center shadow-2xl animate-victory-burst text-[#1E2022]">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-silkscreen text-[10px] font-bold mb-2.5">
          <BookMarked className="w-3 h-3" /> ¡NUEVO REGISTRO EN BESTIARIO!
        </span>

        <div className="w-28 h-28 mx-auto rounded-2xl bg-zinc-900 border-2 border-emerald-500 flex items-center justify-center mb-3 shadow-inner overflow-hidden">
          <canvas ref={canvasRef} width={128} height={128} className="w-full h-full object-contain image-render-pixel" />
        </div>

        <div className="text-[10px] font-mono text-emerald-800 font-bold mb-0.5">
          #{String(entry.dexIndex).padStart(2, '0')} · Etapa {entry.stage} · {entry.ownedCount}/{entry.totalSpecies} Especies
        </div>
        <h3 className="font-pixel text-base text-[#1E2022] mb-1.5">{entry.name}</h3>

        <div className="flex items-center justify-center gap-1.5 mb-2.5">
          <span className={`px-2 py-0.5 rounded font-silkscreen text-[9px] font-bold ${primaryMeta.badgeClass}`}>
            {primaryMeta.icon} {primaryMeta.label.toUpperCase()}
          </span>
          {secondaryMeta && (
            <span className={`px-2 py-0.5 rounded font-silkscreen text-[9px] font-bold ${secondaryMeta.badgeClass}`}>
              {secondaryMeta.icon} {secondaryMeta.label.toUpperCase()}
            </span>
          )}
        </div>

        <div className="h-[52px] overflow-hidden bg-[#E7E7E2] border border-zinc-400 rounded-xl p-2 text-[11px] font-mono text-zinc-800 leading-snug mb-4 flex items-center justify-center">
          <span className="line-clamp-2">{entry.lore}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onViewBestiary}
            className="flex-1 py-2.5 min-h-[42px] bg-stone-200 hover:bg-stone-300 border border-zinc-400 text-[#1E2022] rounded-xl font-silkscreen text-[10px] font-bold cursor-pointer active:scale-95 transition-all"
          >
            VER BESTIARIO
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-2.5 min-h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-silkscreen text-[10px] font-bold cursor-pointer active:scale-95 transition-all"
          >
            CONTINUAR →
          </button>
        </div>
      </div>
    </div>
  );
};

