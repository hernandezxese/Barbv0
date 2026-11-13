/**
 * Tactical Battle System: Pokémon FireRed + Final Fantasy III Hybrid
 * Features:
 * - Opening Encounter Intro with Enemy Sprite & Lore
 * - Dynamic Elemental Affinity Multipliers & Visual Effects
 * - Forced Team Replacement when active spirit faints while allies remain healthy
 * - Boss capture difficulty 2x harder than common spirits (0.36 vs 0.72)
 * - Duplicate capture EXP notice when capturing an already owned species
 * - Minimalist 2-line Combat Log & Mobile-first no-scroll 100dvh layout
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  SpiritCreature,
  BarbaraHero,
  ElementalSkill,
  InventoryItem,
  BattleLogEntry,
  ElementType,
} from '../types/game';
import { getElementalMultiplier, getWeaknessesForSpirit, checkNewMovesToLearn, ELEMENT_META } from '../data/spiritsData';
import { sound } from '../services/audioService';
import { drawCreatureSprite } from '../utils/pixelRenderer';
import {
  Sparkles,
  Swords,
  Crosshair,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Users,
  Backpack,
  Shield,
} from 'lucide-react';

const BATTLE_POLLEN = Array.from({ length: 12 }, (_, i) => ({
  left: `${(i * 8.1 + 5) % 94}%`,
  top: `${(i * 13.3 + 10) % 85}%`,
  size: `${3 + (i % 3)}px`,
  dur: `${4.0 + (i % 4) * 0.8}s`,
  delay: `${-(i * 0.6)}s`,
}));

const BATTLE_INTERMITTENT_RAIN = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 6.3 + 2) % 98}%`,
  dur: `${2.1 + (i % 4) * 0.35}s`,
  delay: `${-(i * 0.4)}s`,
}));

const BATTLE_STATIC_RAIN = Array.from({ length: 22 }, (_, i) => ({
  left: `${(i * 4.5 + 1) % 99}%`,
  dur: `${0.72 + (i % 4) * 0.12}s`,
  delay: `${-(i * 0.18)}s`,
}));

const BATTLE_WIND_RAIN = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 4.3) % 104}%`,
  dur: `${0.58 + (i % 4) * 0.1}s`,
  delay: `${-(i * 0.15)}s`,
}));

const BATTLE_STORM_RAIN = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 3.6) % 106}%`,
  dur: `${0.46 + (i % 4) * 0.09}s`,
  delay: `${-(i * 0.13)}s`,
}));

const BATTLE_WIND_STREAKS = Array.from({ length: 6 }, (_, i) => ({
  top: `${10 + i * 13}%`,
  width: `${85 + (i % 3) * 40}px`,
  dur: `${1.3 + (i % 3) * 0.35}s`,
  delay: `${-(i * 0.35)}s`,
}));

interface BattleViewProps {
  playerSpirit: SpiritCreature;
  partySpirits?: SpiritCreature[];
  existingBaseIds?: string[];
  barbara: BarbaraHero;
  enemySpirit: SpiritCreature;
  isBossBattle?: boolean;
  inventory: Record<string, InventoryItem>;
  regionThemeColor: string;
  regionId: string;
  onVictory: (updatedPlayerSpirit: SpiritCreature, updatedBarbara: BarbaraHero, capturedSpirit?: SpiritCreature) => void;
  onDefeat: () => void;
  onFlee: () => void;
  onUseItem: (itemId: string, targetUid: string) => void;
  onSwitchActiveSpirit?: (spiritUid: string) => void;
  onSyncBattleParty?: (updatedParty: SpiritCreature[], activeUid: string) => void;
}

export const BattleView: React.FC<BattleViewProps> = ({
  playerSpirit: initialPlayerSpirit,
  partySpirits = [],
  existingBaseIds = [],
  barbara: initialBarbara,
  enemySpirit: initialEnemySpirit,
  isBossBattle = false,
  inventory,
  regionId,
  onVictory,
  onDefeat,
  onFlee,
  onUseItem,
  onSwitchActiveSpirit,
  onSyncBattleParty,
}) => {
  const [battleParty, setBattleParty] = useState<SpiritCreature[]>(() =>
    partySpirits.length > 0 ? partySpirits : [initialPlayerSpirit]
  );
  const [playerSpirit, setPlayerSpirit] = useState<SpiritCreature>(initialPlayerSpirit);
  const [enemySpirit, setEnemySpirit] = useState<SpiritCreature>(initialEnemySpirit);
  const [barbara, setBarbara] = useState<BarbaraHero>(initialBarbara);
  const [forcedSwitch, setForcedSwitch] = useState(false);

  const [showEncounterIntro, setShowEncounterIntro] = useState(true);
  const [activeAttackEffect, setActiveAttackEffect] = useState<{
    element: ElementType;
    isTargetEnemy: boolean;
    skillName: string;
  } | null>(null);

  const [actionCategory, setActionCategory] = useState<'main' | 'skills' | 'items' | 'party_switch' | 'confirm_flee'>('main');
  const [selectedBattleItem, setSelectedBattleItem] = useState<InventoryItem | null>(null);
  const [activeSummonCinematic, setActiveSummonCinematic] = useState<{ name: string; element: string } | null>(null);
  const [battleLog, setBattleLog] = useState<BattleLogEntry[]>([
    {
      id: 'init_1',
      text: isBossBattle
        ? `⚔️ ¡Jefe ${initialEnemySpirit.name} (Nv.${initialEnemySpirit.level}) desafía a ${initialBarbara.name}!`
        : `⚡ ¡${initialEnemySpirit.name} (Nv.${initialEnemySpirit.level}) salvaje aparece!`,
      type: 'info',
    },
  ]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [playerHitFlash, setPlayerHitFlash] = useState(false);
  const [enemyHitFlash, setEnemyHitFlash] = useState(false);
  const [playerLunging, setPlayerLunging] = useState(false);
  const [enemyLunging, setEnemyLunging] = useState(false);
  const [captureAnimPhase, setCaptureAnimPhase] = useState<'idle' | 'throwing' | 'shaking' | 'success' | 'fail'>('idle');
  const [floatingTexts, setFloatingTexts] = useState<
    { id: string; text: string; subtext?: string; color: string; isEnemy: boolean }[]
  >([]);
  const [affinityBanner, setAffinityBanner] = useState<{
    id: string;
    attackElement: ElementType;
    targetElement: ElementType;
    badgeLabel: string;
    multiplier: number;
    tier: string;
  } | null>(null);

  const [dodgeChallenge, setDodgeChallenge] = useState<{
    attackerName: string;
    skillName: string;
    markerPos: number;
    active: boolean;
  } | null>(null);
  const dodgeMarkerRef = useRef<number>(0);
  const dodgeResolveRef = useRef<((result: { mult: number; verdict: 'perfect' | 'partial' | 'miss' }) => void) | null>(null);
  const dodgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const enemyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const introCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const actionAvatarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const summonCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const syncSpiritIntoParty = (updated: SpiritCreature): SpiritCreature[] => {
    const next = battleParty.map(s => (s.uid === updated.uid ? updated : s));
    setBattleParty(next);
    return next;
  };

  useEffect(() => {
    sound.playBgm('battle');
    if (enemySpirit.baseId === 'trex' || enemySpirit.baseId === 'cuellilargo') {
      sound.playDinosaurRoar();
    }
    return () => {
      sound.playBgm(regionId);
    };
  }, [regionId, enemySpirit.baseId]);

  const finalizeDodge = React.useCallback((pos: number, timedOut = false) => {
    if (dodgeTimeoutRef.current) {
      clearTimeout(dodgeTimeoutRef.current);
      dodgeTimeoutRef.current = null;
    }
    const resolver = dodgeResolveRef.current;
    dodgeResolveRef.current = null;
    setDodgeChallenge(null);
    if (!resolver) return;

    if (timedOut) {
      resolver({ mult: 1, verdict: 'miss' });
      return;
    }

    if (pos >= 38 && pos <= 62) {
      sound.playDodgeSuccess();
      resolver({ mult: 0, verdict: 'perfect' });
    } else if (pos >= 20 && pos <= 80) {
      sound.playDodgePartial();
      resolver({ mult: 0.5, verdict: 'partial' });
    } else {
      sound.playCancel();
      resolver({ mult: 1, verdict: 'miss' });
    }
  }, []);

  const triggerDodgeChallenge = React.useCallback(
    (attackerName: string, skillName: string) =>
      new Promise<{ mult: number; verdict: 'perfect' | 'partial' | 'miss' }>(resolve => {
        dodgeResolveRef.current = resolve;
        dodgeMarkerRef.current = 4;
        setDodgeChallenge({ attackerName, skillName, markerPos: 4, active: true });
        if (dodgeTimeoutRef.current) clearTimeout(dodgeTimeoutRef.current);
        dodgeTimeoutRef.current = setTimeout(() => {
          finalizeDodge(dodgeMarkerRef.current, true);
        }, 2100);
      }),
    [finalizeDodge]
  );

  useEffect(() => {
    if (!dodgeChallenge?.active) return;
    let rafId: number;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      // Smooth 0 -> 100 -> 0 sweep every 1150ms
      const phase = (elapsed % 1150) / 1150;
      const pos = phase <= 0.5 ? phase * 2 * 100 : (1 - (phase - 0.5) * 2) * 100;
      dodgeMarkerRef.current = pos;
      setDodgeChallenge(prev => (prev ? { ...prev, markerPos: pos } : null));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [dodgeChallenge?.active]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (dodgeChallenge?.active && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        finalizeDodge(dodgeMarkerRef.current, false);
        return;
      }
      if (showEncounterIntro && (e.code === 'Space' || e.code === 'Enter')) {
        sound.playConfirm();
        setShowEncounterIntro(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showEncounterIntro, dodgeChallenge?.active, finalizeDodge]);

  useEffect(() => {
    return () => {
      if (dodgeTimeoutRef.current) clearTimeout(dodgeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let animId: number;
    let t = 0;
    const render = () => {
      t += 0.05;
      if (playerCanvasRef.current) {
        const ctx = playerCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 140, 140);
          drawCreatureSprite(ctx, playerSpirit.baseId, playerSpirit.currentStage, 8, 8, 124, t, false);
        }
      }
      if (actionAvatarCanvasRef.current) {
        const ctx = actionAvatarCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 44, 44);
          drawCreatureSprite(ctx, playerSpirit.baseId, playerSpirit.currentStage, 2, 2, 40, t, false);
        }
      }
      if (enemyCanvasRef.current) {
        const ctx = enemyCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 140, 140);
          drawCreatureSprite(ctx, enemySpirit.baseId, enemySpirit.currentStage, 8, 8, 124, t + 1.5, true);
        }
      }
      if (introCanvasRef.current && showEncounterIntro) {
        const ctx = introCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 160, 160);
          drawCreatureSprite(ctx, enemySpirit.baseId, enemySpirit.currentStage, 10, 10, 140, t + 1.0, true);
        }
      }
      if (summonCanvasRef.current && activeSummonCinematic) {
        const ctx = summonCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 160, 160);
          ctx.imageSmoothingEnabled = false;
          // Pulsing elemental rays behind summoning spirit
          ctx.save();
          ctx.translate(80, 80);
          ctx.rotate(t * 0.9);
          for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = i % 2 === 0 ? 'rgba(250, 204, 21, 0.25)' : 'rgba(56, 189, 248, 0.22)';
            ctx.fillRect(-4, -74, 8, 48);
          }
          ctx.restore();
          drawCreatureSprite(ctx, playerSpirit.baseId, playerSpirit.currentStage, 14, 14, 132, t * 1.4, false);
        }
      }
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [playerSpirit, enemySpirit, showEncounterIntro, activeSummonCinematic]);

  const addLog = (text: string, type: BattleLogEntry['type']) => {
    setBattleLog(prev => [{ id: `log_${Date.now()}_${Math.random()}`, text, type }, ...prev.slice(0, 8)]);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const addFloatingText = (text: string, color: string, isEnemy: boolean, subtext?: string) => {
    const id = `fl_${Date.now()}_${Math.random()}`;
    setFloatingTexts(prev => [...prev, { id, text, subtext, color, isEnemy }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(item => item.id !== id));
    }, 1050);
  };

  const triggerAffinityBanner = (
    attackElement: ElementType,
    targetElement: ElementType,
    badgeLabel: string,
    multiplier: number,
    tier: string
  ) => {
    const id = `aff_${Date.now()}`;
    setAffinityBanner({ id, attackElement, targetElement, badgeLabel, multiplier, tier });
    setTimeout(() => {
      setAffinityBanner(prev => (prev?.id === id ? null : prev));
    }, 1200);
  };

  const playElementSfx = (element: ElementType) => {
    if (element === 'fuego') sound.playFireSpell();
    else if (element === 'agua') sound.playWaterSpell();
    else if (element === 'planta' || element === 'tierra') sound.playEarthSpell();
    else if (element === 'viento') sound.playWindSpell();
    else sound.playAttackSlash();
  };

  const triggerElementalVfx = (element: ElementType, isTargetEnemy: boolean, skillName: string) => {
    setActiveAttackEffect({ element, isTargetEnemy, skillName });
    setTimeout(() => {
      setActiveAttackEffect(null);
    }, 680);
  };

  // EXP & Level-up shared across combat victory and spirit linking (capture)
  const applyVictoryExperience = (
    victorSpirit: SpiritCreature,
    defeatedEnemy: SpiritCreature,
    wasCaptured: boolean
  ): { updatedSpirit: SpiritCreature; updatedBarbara: BarbaraHero } => {
    const TEST_EXP_MULTIPLIER = 3; // +200% EXP test boost
    const expGained = Math.round(
      defeatedEnemy.level * 48 * (isBossBattle ? 2.5 : 1) * (wasCaptured ? 1.15 : 1) * TEST_EXP_MULTIPLIER
    );
    let nextExp = victorSpirit.exp + expGained;
    let nextLevel = victorSpirit.level;
    let maxExp = victorSpirit.maxExp;
    let levelsGained = 0;
    const updatedSkills = [...victorSpirit.skills];

    while (nextExp >= maxExp) {
      nextExp -= maxExp;
      nextLevel += 1;
      maxExp = nextLevel * 65;
      levelsGained += 1;

      const newMoves = checkNewMovesToLearn(victorSpirit, nextLevel);
      newMoves.forEach(m => {
        if (!updatedSkills.some(s => s.id === m.id)) {
          updatedSkills.push(m);
          addLog(`✨ ¡${victorSpirit.name} aprendió ${m.name}!`, 'critical');
        }
      });
    }

    if (levelsGained > 0) {
      sound.playLevelUp();
      addFloatingText(`¡NIVEL ${nextLevel}!`, '#facc15', false);
      addLog(`🏆 ${victorSpirit.name} subió a Nv.${nextLevel} (+${expGained} EXP)!`, 'critical');
    } else {
      addLog(`⭐ ${victorSpirit.name} ganó +${expGained} EXP.`, 'info');
    }

    const hpGain = levelsGained * 12;
    const mpGain = levelsGained * 5;
    const updatedSpirit: SpiritCreature = {
      ...victorSpirit,
      level: nextLevel,
      exp: nextExp,
      maxExp,
      skills: updatedSkills,
      maxHp: victorSpirit.maxHp + hpGain,
      currentHp: Math.min(victorSpirit.maxHp + hpGain, victorSpirit.currentHp + hpGain),
      maxMp: victorSpirit.maxMp + mpGain,
      currentMp: Math.min(victorSpirit.maxMp + mpGain, victorSpirit.currentMp + mpGain),
      attack: victorSpirit.attack + levelsGained * 3,
      defense: victorSpirit.defense + levelsGained * 3,
      spAttack: victorSpirit.spAttack + levelsGained * 4,
      spDefense: victorSpirit.spDefense + levelsGained * 3,
      speed: victorSpirit.speed + levelsGained * 2,
    };

    const goldReward = isBossBattle
      ? 300 + defeatedEnemy.level * 25
      : wasCaptured
      ? 45
      : 60;
    if (isBossBattle) {
      addLog(`🪙 ¡Recompensa de Jefe: +${goldReward} Oro!`, 'critical');
    }

    const updatedBarbara: BarbaraHero = {
      ...barbara,
      gold: barbara.gold + goldReward,
    };

    return { updatedSpirit, updatedBarbara };
  };

  const handleVictorySequence = async (
    victorSpirit: SpiritCreature,
    defeatedEnemy: SpiritCreature,
    currentPartySnapshot: SpiritCreature[]
  ) => {
    sound.stopBgm();
    sound.playLevelUp();

    const { updatedSpirit, updatedBarbara } = applyVictoryExperience(victorSpirit, defeatedEnemy, false);
    const syncedParty = currentPartySnapshot.map(s => (s.uid === updatedSpirit.uid ? updatedSpirit : s));
    setPlayerSpirit(updatedSpirit);
    setBattleParty(syncedParty);
    onSyncBattleParty?.(syncedParty, updatedSpirit.uid);

    await wait(1600);
    onVictory(updatedSpirit, updatedBarbara);
  };

  // Player Spirit Move
  const handleSpiritSkill = async (skill: ElementalSkill) => {
    if (isAnimating || forcedSwitch) return;
    if (playerSpirit.currentMp < skill.mpCost) {
      sound.playCancel();
      addLog('⚠️ Sin PM suficientes para esa técnica.', 'info');
      return;
    }

    setIsAnimating(true);
    sound.playConfirm();

    const updatedPlayerAfterMp: SpiritCreature = {
      ...playerSpirit,
      currentMp: Math.max(0, playerSpirit.currentMp - skill.mpCost),
    };
    setPlayerSpirit(updatedPlayerAfterMp);
    let currentPartySnap = syncSpiritIntoParty(updatedPlayerAfterMp);

    setPlayerLunging(true);
    playElementSfx(skill.element);
    triggerElementalVfx(skill.element, skill.category !== 'heal', skill.name);
    setTimeout(() => setPlayerLunging(false), 320);

    if (skill.category === 'heal') {
      const healAmount = Math.round(updatedPlayerAfterMp.maxHp * 0.45);
      const newHp = Math.min(updatedPlayerAfterMp.maxHp, updatedPlayerAfterMp.currentHp + healAmount);
      const healedSpirit = { ...updatedPlayerAfterMp, currentHp: newHp };
      setPlayerSpirit(healedSpirit);
      currentPartySnap = syncSpiritIntoParty(healedSpirit);
      sound.playHeal();
      addFloatingText(`+${healAmount} PS`, '#4ade80', false);
      addLog(`💚 ${updatedPlayerAfterMp.name} usó ${skill.name} (+${healAmount} PS).`, 'heal');

      setBarbara(prev => ({
        ...prev,
        limitGauge: Math.min(100, prev.limitGauge + 15),
      }));

      await wait(800);
      enemyTurn(healedSpirit, enemySpirit, currentPartySnap);
      return;
    }

    const aff = getElementalMultiplier(
      skill.element,
      enemySpirit.primaryElement,
      enemySpirit.secondaryElement,
      updatedPlayerAfterMp.primaryElement,
      updatedPlayerAfterMp.secondaryElement
    );

    const TEST_DAMAGE_BONUS = 2.0; // +100% test damage bonus
    const baseDamage = Math.round(
      (((2 * updatedPlayerAfterMp.level / 5 + 2) *
        skill.power *
        (updatedPlayerAfterMp.spAttack / Math.max(1, enemySpirit.spDefense))) /
        48 +
        3) *
        aff.multiplier *
        TEST_DAMAGE_BONUS
    );
    const finalDamage = Math.max(8, Math.round(baseDamage * (0.92 + Math.random() * 0.16)));

    setEnemyHitFlash(true);
    if (aff.multiplier >= 1.5) sound.playCriticalHit();
    else sound.playHit();

    const dmgColor =
      aff.tier === 'ultra' || aff.tier === 'super'
        ? '#facc15'
        : aff.tier === 'stab'
        ? '#38bdf8'
        : aff.tier === 'resist' || aff.tier === 'double_resist'
        ? '#94a3b8'
        : '#f87171';

    addFloatingText(
      `-${finalDamage}`,
      dmgColor,
      true,
      aff.multiplier !== 1.0 ? `x${aff.multiplier}` : undefined
    );

    if (aff.multiplier !== 1.0) {
      triggerAffinityBanner(skill.element, enemySpirit.primaryElement, aff.badgeLabel, aff.multiplier, aff.tier);
    }

    addLog(
      `⚔️ ${updatedPlayerAfterMp.name}: ${skill.name} -> -${finalDamage} PS (${aff.badgeLabel})`,
      aff.multiplier >= 1.5 ? 'critical' : 'damage'
    );

    setBarbara(prev => ({
      ...prev,
      limitGauge: Math.min(100, prev.limitGauge + (aff.multiplier >= 1.5 ? 25 : 15)),
    }));

    const remainingEnemyHp = Math.max(0, enemySpirit.currentHp - finalDamage);
    const updatedEnemy = { ...enemySpirit, currentHp: remainingEnemyHp };
    setEnemySpirit(updatedEnemy);

    await wait(520);
    setEnemyHitFlash(false);

    if (remainingEnemyHp <= 0) {
      handleVictorySequence(updatedPlayerAfterMp, updatedEnemy, currentPartySnap);
      return;
    }

    await wait(600);
    enemyTurn(updatedPlayerAfterMp, updatedEnemy, currentPartySnap);
  };

  // Switch Active Spirit in Battle (supports both voluntary switch & forced faint replacement)
  const handleSwitchSpirit = async (newSpiritUid: string) => {
    if (isAnimating) return;
    const targetSpirit = battleParty.find(s => s.uid === newSpiritUid);
    if (!targetSpirit || targetSpirit.uid === playerSpirit.uid) return;

    if (targetSpirit.currentHp <= 0) {
      sound.playCancel();
      addLog(`⚠️ ${targetSpirit.name} está debilitado.`, 'info');
      return;
    }

    const wasForced = forcedSwitch;
    const currentSyncedParty = syncSpiritIntoParty(playerSpirit);
    const freshTarget = currentSyncedParty.find(s => s.uid === newSpiritUid) || targetSpirit;

    sound.playConfirm();
    onSwitchActiveSpirit?.(freshTarget.uid);
    onSyncBattleParty?.(currentSyncedParty, freshTarget.uid);
    setPlayerSpirit(freshTarget);
    setForcedSwitch(false);
    setActionCategory('main');

    if (wasForced) {
      addLog(`🔄 ¡${freshTarget.name} entra al relevo!`, 'status');
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    addLog(`🔄 ${barbara.name} envía a ${freshTarget.name} al combate.`, 'status');
    await wait(800);
    enemyTurn(freshTarget, enemySpirit, currentSyncedParty);
  };

  // Invocación Primigenia (1 use per 100% charge)
  const handleNatureSummon = async () => {
    if (barbara.limitGauge < 100 || isAnimating || forcedSwitch) return;
    setIsAnimating(true);
    sound.playCriticalHit();

    setBarbara(prev => ({ ...prev, limitGauge: 0 }));

    const summonNames: Record<string, string> = {
      casa: 'Aura del Hogar Inicial',
      santiago: 'Furia del Pewén Ancestral',
      biobio: 'Torrente Jurásico del Laja',
      araucania: 'Cataclismo del Ruka Pillán',
      losrios: 'Diluvio de la Selva Valdiviana',
      loslagos: 'Resplandor Glaciar del Alerce',
    };
    const summonName = summonNames[regionId] || 'Latido de la Tierra';
    const summonElement =
      regionId === 'araucania'
        ? 'fuego'
        : regionId === 'losrios'
        ? 'agua'
        : regionId === 'loslagos'
        ? 'hielo'
        : 'planta';

    setActiveSummonCinematic({ name: summonName, element: summonElement });
    addLog(`🔥 ${barbara.name}: ¡Invocación de ${summonName}!`, 'critical');

    await wait(2200);
    setActiveSummonCinematic(null);

    triggerElementalVfx('sagrado', true, summonName);

    const summonDamage = Math.max(
      55,
      Math.min(135, Math.round(playerSpirit.level * 8 + playerSpirit.spAttack * 0.75))
    );
    const remainingEnemyHp = Math.max(0, enemySpirit.currentHp - summonDamage);
    const healedPlayer = { ...playerSpirit, currentHp: playerSpirit.maxHp, currentMp: playerSpirit.maxMp };
    const updatedPartySnap = syncSpiritIntoParty(healedPlayer);

    setEnemySpirit(prev => ({ ...prev, currentHp: remainingEnemyHp }));
    setPlayerSpirit(healedPlayer);
    setEnemyHitFlash(true);
    addFloatingText(`-${summonDamage}`, '#f43f5e', true, 'PRIMIGENIO');
    addFloatingText(`+PS/PM MAX`, '#4ade80', false);

    await wait(850);
    setEnemyHitFlash(false);

    if (remainingEnemyHp <= 0) {
      handleVictorySequence(healedPlayer, { ...enemySpirit, currentHp: 0 }, updatedPartySnap);
      return;
    }

    await wait(700);
    enemyTurn(healedPlayer, { ...enemySpirit, currentHp: remainingEnemyHp }, updatedPartySnap);
  };

  // Use consumable item from Mochila during battle
  const handleUseBattleItemOnAlly = async (item: InventoryItem, targetSpirit: SpiritCreature) => {
    if (isAnimating || forcedSwitch) return;
    if (item.effectType === 'revive' && targetSpirit.currentHp > 0) {
      sound.playCancel();
      addLog(`⚠️ ${targetSpirit.name} no está debilitado.`, 'info');
      return;
    }
    if (item.effectType !== 'revive' && targetSpirit.currentHp <= 0) {
      sound.playCancel();
      addLog(`⚠️ ${targetSpirit.name} está debilitado (usa Lágrima de Cóndor).`, 'info');
      return;
    }

    setIsAnimating(true);
    setSelectedBattleItem(null);
    setActionCategory('main');
    sound.playHeal();
    onUseItem(item.id, targetSpirit.uid);

    let updatedTarget = { ...targetSpirit };
    let floatLabel = '+CURA';
    let floatColor = '#4ade80';

    if (item.effectType === 'heal_hp') {
      const amount = item.effectValue || 40;
      const prevHp = updatedTarget.currentHp;
      updatedTarget.currentHp = Math.min(updatedTarget.maxHp, updatedTarget.currentHp + amount);
      const diff = updatedTarget.currentHp - prevHp;
      floatLabel = `+${diff} PS`;
    } else if (item.effectType === 'heal_mp') {
      const amount = item.effectValue || 25;
      const prevMp = updatedTarget.currentMp;
      updatedTarget.currentMp = Math.min(updatedTarget.maxMp, updatedTarget.currentMp + amount);
      const diff = updatedTarget.currentMp - prevMp;
      floatLabel = `+${diff} PM`;
      floatColor = '#38bdf8';
    } else if (item.effectType === 'revive') {
      const pct = (item.effectValue || 50) / 100;
      updatedTarget.currentHp = Math.max(1, Math.round(updatedTarget.maxHp * pct));
      updatedTarget.currentMp = Math.min(updatedTarget.maxMp, Math.round(updatedTarget.maxMp * 0.5));
      floatLabel = `¡REVIVE!`;
      floatColor = '#fde047';
    } else if (item.effectType === 'cure_status') {
      updatedTarget.statusCondition = null;
      updatedTarget.currentHp = Math.min(updatedTarget.maxHp, updatedTarget.currentHp + 15);
      floatLabel = `+15 PS`;
    } else if (item.effectType === 'level_up') {
      const nextLevel = updatedTarget.level + 1;
      const newMoves = checkNewMovesToLearn(updatedTarget, nextLevel);
      const nextSkills = [...updatedTarget.skills];
      newMoves.forEach(m => {
        if (!nextSkills.some(s => s.id === m.id)) nextSkills.push(m);
      });
      updatedTarget = {
        ...updatedTarget,
        level: nextLevel,
        exp: 0,
        maxExp: nextLevel * 65,
        maxHp: updatedTarget.maxHp + 12,
        currentHp: updatedTarget.maxHp + 12,
        maxMp: updatedTarget.maxMp + 5,
        currentMp: updatedTarget.maxMp + 5,
        attack: updatedTarget.attack + 3,
        defense: updatedTarget.defense + 3,
        spAttack: updatedTarget.spAttack + 4,
        spDefense: updatedTarget.spDefense + 3,
        speed: updatedTarget.speed + 2,
        skills: nextSkills,
      };
      sound.playLevelUp();
      floatLabel = `¡NV.${nextLevel}!`;
      floatColor = '#facc15';
    }

    const nextParty = battleParty.map(s => (s.uid === updatedTarget.uid ? updatedTarget : s));
    setBattleParty(nextParty);
    const activeAfter = updatedTarget.uid === playerSpirit.uid ? updatedTarget : playerSpirit;
    if (updatedTarget.uid === playerSpirit.uid) {
      setPlayerSpirit(updatedTarget);
      addFloatingText(floatLabel, floatColor, false);
    } else {
      addFloatingText(`${targetSpirit.name.slice(0, 6)} ${floatLabel}`, floatColor, false);
    }
    onSyncBattleParty?.(nextParty, activeAfter.uid);
    addLog(`🧪 ${barbara.name} usó ${item.name} en ${targetSpirit.name} (${floatLabel}).`, 'heal');

    await wait(780);
    enemyTurn(activeAfter, enemySpirit, nextParty);
  };

  // Vincular (Capture) — Boss capture strictly 0.5x of common (2x harder), multi-phase animated sequence
  const handleCapture = async () => {
    if (isAnimating || forcedSwitch) return;
    const charms = inventory.orbe_resonancia?.count || 0;
    if (charms <= 0) {
      sound.playCancel();
      addLog('⚠️ Sin Amuletos de Vínculo disponibles.', 'info');
      return;
    }

    setIsAnimating(true);
    sound.playConfirm();
    onUseItem('orbe_resonancia', enemySpirit.uid);

    addLog(`🧿 ${barbara.name} lanzó un Amuleto hacia ${enemySpirit.name}.`, 'capture');

    const hpPercent = enemySpirit.currentHp / enemySpirit.maxHp;
    const baseCaptureRate = isBossBattle ? 0.36 : 0.72; // Boss is strictly 2x harder
    const captureChance = Math.min(0.95, baseCaptureRate * (1.6 - hpPercent));

    setCaptureAnimPhase('throwing');
    sound.playWindSpell();
    await wait(440);

    setCaptureAnimPhase('shaking');
    sound.playStep();
    await wait(460);
    sound.playStep();
    await wait(480);

    if (Math.random() < captureChance) {
      setCaptureAnimPhase('success');
      sound.stopBgm();
      sound.playCaptureSuccess();

      const isDuplicate = existingBaseIds.includes(enemySpirit.baseId);
      if (isDuplicate) {
        addLog(`✨ ¡${enemySpirit.name} repetido! Se transforma en EXP para tu original.`, 'critical');
      } else {
        addLog(`✨ ¡${enemySpirit.name} estableció un Vínculo contigo!`, 'status');
      }
      addFloatingText(isDuplicate ? `¡+EXP EXTRA!` : `¡VINCULADO!`, '#34d399', true);

      const { updatedSpirit, updatedBarbara } = applyVictoryExperience(playerSpirit, enemySpirit, true);
      const finalParty = syncSpiritIntoParty(updatedSpirit);
      setPlayerSpirit(updatedSpirit);
      onSyncBattleParty?.(finalParty, updatedSpirit.uid);

      await wait(1250);
      setCaptureAnimPhase('idle');
      onVictory(updatedSpirit, updatedBarbara, { ...enemySpirit, currentHp: enemySpirit.maxHp });
    } else {
      setCaptureAnimPhase('fail');
      sound.playCancel();
      addLog(`💨 ${enemySpirit.name} resistió el Amuleto de Vínculo.`, 'info');
      addFloatingText(`¡RESISTIÓ!`, '#fbbf24', true);

      await wait(560);
      setCaptureAnimPhase('idle');
      await wait(240);
      enemyTurn(playerSpirit, enemySpirit, battleParty);
    }
  };

  // Enemy Turn Action + Forced Team Replacement on Faint
  const enemyTurn = async (
    currPlayer: SpiritCreature,
    currEnemy: SpiritCreature,
    partySnapshot: SpiritCreature[]
  ) => {
    if (currEnemy.currentHp <= 0) return;

    const skill = currEnemy.skills[Math.floor(Math.random() * currEnemy.skills.length)] || {
      id: 'placaje',
      name: 'Placaje Físico',
      element: 'normal',
      power: 20,
      mpCost: 0,
    };

    setEnemyLunging(true);
    if (currEnemy.baseId === 'trex' || currEnemy.baseId === 'cuellilargo') {
      sound.playDinosaurRoar();
    } else {
      playElementSfx(skill.element as ElementType);
    }
    triggerElementalVfx(skill.element as ElementType, false, skill.name);

    await wait(240);
    setEnemyLunging(false);

    // Interactive Evasion Minigame before damage resolves
    const dodgeResult = await triggerDodgeChallenge(currEnemy.name, skill.name);

    const aff = getElementalMultiplier(
      skill.element as ElementType,
      currPlayer.primaryElement,
      currPlayer.secondaryElement,
      currEnemy.primaryElement,
      currEnemy.secondaryElement
    );

    const baseDamage = Math.round(
      (((2 * currEnemy.level / 5 + 2) * skill.power * (currEnemy.attack / Math.max(1, currPlayer.defense))) / 50 + 2) *
        aff.multiplier
    );
    const rawDamage = Math.max(3, Math.round(baseDamage * (0.85 + Math.random() * 0.25)));
    const damage =
      dodgeResult.mult === 0 ? 0 : Math.max(2, Math.round(rawDamage * dodgeResult.mult));

    if (damage === 0) {
      addFloatingText('¡ESQUIVA!', '#16a34a', false, '0 PS · PERFECTA');
      addLog(
        `🛡️ ¡Esquiva perfecta! ${currPlayer.name} evitó ${skill.name} de ${currEnemy.name} (0 daño).`,
        'status'
      );
    } else {
      setPlayerHitFlash(true);
      sound.playHit();
      addFloatingText(
        `-${damage}`,
        dodgeResult.verdict === 'partial'
          ? '#d97706'
          : aff.multiplier >= 1.5
          ? '#facc15'
          : '#dc2626',
        false,
        dodgeResult.verdict === 'partial'
          ? 'DESVÍO -50%'
          : aff.multiplier !== 1.0
          ? `x${aff.multiplier}`
          : undefined
      );
      if (aff.multiplier !== 1.0) {
        triggerAffinityBanner(skill.element as ElementType, currPlayer.primaryElement, aff.badgeLabel, aff.multiplier, aff.tier);
      }
      addLog(
        dodgeResult.verdict === 'partial'
          ? `🛡️ Desvío parcial (-50%): ${currEnemy.name} usó ${skill.name} -> -${damage} PS`
          : `💥 ${currEnemy.name}: ${skill.name} -> -${damage} PS${aff.multiplier !== 1.0 ? ` (${aff.badgeLabel})` : ''}`,
        'damage'
      );
    }

    const nextPlayerHp = Math.max(0, currPlayer.currentHp - damage);
    const updatedPlayer = { ...currPlayer, currentHp: nextPlayerHp };
    const updatedPartySnap = partySnapshot.map(s => (s.uid === updatedPlayer.uid ? updatedPlayer : s));
    setPlayerSpirit(updatedPlayer);
    setBattleParty(updatedPartySnap);
    onSyncBattleParty?.(updatedPartySnap, updatedPlayer.uid);

    await wait(500);
    setPlayerHitFlash(false);

    if (nextPlayerHp <= 0) {
      sound.playCancel();
      const aliveAllies = updatedPartySnap.filter(s => s.uid !== currPlayer.uid && s.currentHp > 0);
      if (aliveAllies.length > 0) {
        addLog(`⚠️ ¡${currPlayer.name} cayó! Selecciona otra Criatura Espiritual.`, 'critical');
        setForcedSwitch(true);
        setIsAnimating(false);
        setActionCategory('party_switch');
        return;
      }

      addLog(`⚠️ ¡Todo tu equipo cayó debilitado!`, 'critical');
      await wait(1000);
      onDefeat();
      return;
    }

    setIsAnimating(false);
    setActionCategory('main');
  };

  const getElementBadge = (el: ElementType) => {
    const colors: Record<ElementType, string> = {
      fuego: 'bg-orange-100 text-orange-800 border-orange-400',
      agua: 'bg-sky-100 text-sky-800 border-sky-400',
      planta: 'bg-emerald-100 text-emerald-800 border-emerald-500',
      viento: 'bg-teal-100 text-teal-800 border-teal-400',
      tierra: 'bg-amber-100 text-amber-800 border-amber-500',
      hielo: 'bg-cyan-100 text-cyan-800 border-cyan-400',
      sagrado: 'bg-yellow-100 text-yellow-800 border-yellow-500',
      normal: 'bg-stone-200 text-[#1E2022] border-zinc-400',
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-silkscreen uppercase border font-bold ${colors[el] || 'bg-stone-200 text-[#1E2022] border-zinc-400'}`}>
        {el}
      </span>
    );
  };

  const enemyWeaknesses = getWeaknessesForSpirit(enemySpirit.primaryElement, enemySpirit.secondaryElement);
  const lastTwoLogs = battleLog.slice(0, 2);
  const usableBattleItems = Object.values(inventory).filter(
    it =>
      it.count > 0 &&
      (it.effectType === 'heal_hp' ||
        it.effectType === 'heal_mp' ||
        it.effectType === 'revive' ||
        it.effectType === 'cure_status' ||
        it.effectType === 'level_up')
  );

  return (
    <div className="relative w-full h-[100dvh] bg-zinc-950 flex flex-col justify-between overflow-hidden select-none">
      {/* Zone-Variable Regional Battle Backdrop + Regional Climate Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {regionId === 'santiago' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-sky-500/80 via-sky-700/75 to-emerald-950">
            {/* Distant Andes Cordillera & Costanera silhouette */}
            <svg viewBox="0 0 800 220" preserveAspectRatio="none" className="absolute bottom-24 left-0 w-full h-44 opacity-45">
              <polygon points="0,220 90,95 190,175 290,65 405,180 510,55 620,165 730,85 800,145 800,220" fill="#1e293b" />
              <polygon points="290,65 262,102 318,102" fill="#f8fafc" opacity="0.85" />
              <polygon points="510,55 480,96 540,96" fill="#f8fafc" opacity="0.85" />
              <rect x="645" y="90" width="28" height="130" fill="#0f172a" />
              <polygon points="645,90 659,52 673,90" fill="#334155" />
            </svg>
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-emerald-950 via-emerald-900/70 to-transparent" />
            <div className="env-sunbeams-shimmer" />
            {BATTLE_POLLEN.map((p, idx) => (
              <div
                key={idx}
                className="env-pollen-dot"
                style={{ left: p.left, top: p.top, width: p.size, height: p.size, '--dur': p.dur, '--delay': p.delay } as React.CSSProperties}
              />
            ))}
          </div>
        ) : regionId === 'biobio' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-600 via-stone-700/90 to-stone-950">
            {/* Antuco volcanic ridge & misty prehistoric valley */}
            <svg viewBox="0 0 800 220" preserveAspectRatio="none" className="absolute bottom-24 left-0 w-full h-44 opacity-45">
              <polygon points="0,220 120,115 240,190 380,95 520,185 650,65 770,180 800,155 800,220" fill="#292524" />
              <polygon points="650,65 626,95 674,95" fill="#e2e8f0" opacity="0.65" />
            </svg>
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-stone-950 via-lime-950/60 to-transparent" />
            <div className="env-fog-layer-1 opacity-75" />
            <div className="env-fog-layer-2 opacity-65" />
            {BATTLE_INTERMITTENT_RAIN.map((d, idx) => (
              <div key={idx} className="env-rain-drop-intermittent" style={{ left: d.left, '--dur': d.dur, '--delay': d.delay } as React.CSSProperties} />
            ))}
          </div>
        ) : regionId === 'araucania' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-emerald-950 to-zinc-950">
            {/* Volcán Villarrica glow & Pewén canopy */}
            <svg viewBox="0 0 800 220" preserveAspectRatio="none" className="absolute bottom-24 left-0 w-full h-44 opacity-50">
              <polygon points="0,220 150,150 280,195 450,55 610,190 730,135 800,175 800,220" fill="#1c1917" />
              <polygon points="450,55 432,82 468,82" fill="#f97316" opacity="0.6" />
            </svg>
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-zinc-950 via-emerald-950/80 to-transparent" />
            {BATTLE_STATIC_RAIN.map((d, idx) => (
              <div key={idx} className="env-rain-drop-static" style={{ left: d.left, '--dur': d.dur, '--delay': d.delay } as React.CSSProperties} />
            ))}
          </div>
        ) : regionId === 'losrios' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-teal-950/85 to-emerald-950">
            {/* Selva Valdiviana & Mocho-Choshuenco ridge */}
            <svg viewBox="0 0 800 220" preserveAspectRatio="none" className="absolute bottom-24 left-0 w-full h-44 opacity-45">
              <polygon points="0,220 110,120 260,185 410,90 540,180 680,75 800,165 800,220" fill="#064e3b" />
              <polygon points="680,75 654,106 706,106" fill="#e0f2fe" opacity="0.7" />
            </svg>
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-emerald-950 via-cyan-950/60 to-transparent" />
            {BATTLE_WIND_STREAKS.map((w, idx) => (
              <div key={`bw-${idx}`} className="env-wind-streak" style={{ top: w.top, width: w.width, '--dur': w.dur, '--delay': w.delay } as React.CSSProperties} />
            ))}
            {BATTLE_WIND_RAIN.map((d, idx) => (
              <div key={idx} className="env-rain-drop-wind" style={{ left: d.left, '--dur': d.dur, '--delay': d.delay } as React.CSSProperties} />
            ))}
          </div>
        ) : regionId === 'loslagos' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-sky-950 to-slate-950">
            {/* Volcán Osorno cone & Austral fjord */}
            <svg viewBox="0 0 800 220" preserveAspectRatio="none" className="absolute bottom-24 left-0 w-full h-44 opacity-55">
              <polygon points="0,220 160,135 310,185 520,48 700,185 800,135 800,220" fill="#0f172a" />
              <polygon points="520,48 480,104 560,104" fill="#e0f2fe" opacity="0.88" />
            </svg>
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-slate-950 via-sky-950/75 to-transparent" />
            {BATTLE_WIND_STREAKS.map((w, idx) => (
              <div key={`bsw-${idx}`} className="env-wind-streak" style={{ top: w.top, width: w.width, '--dur': w.dur, '--delay': w.delay } as React.CSSProperties} />
            ))}
            {BATTLE_STORM_RAIN.map((d, idx) => (
              <div key={idx} className="env-rain-drop-storm" style={{ left: d.left, '--dur': d.dur, '--delay': d.delay } as React.CSSProperties} />
            ))}
            <div className="env-lightning-flash" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-amber-950/80 via-zinc-900 to-zinc-950" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-10" />
      </div>

      {/* Top Header & Invocación Gauge (Blanco Humo + Negro Grafito) */}
      <div className="relative z-10 w-full px-3 py-1.5 bg-[#F4F4F2]/95 backdrop-blur border-b border-zinc-400 flex justify-between items-center text-xs shrink-0 text-[#1E2022]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Swords className="w-3.5 h-3.5 text-[#1E2022] shrink-0" />
          <span className="font-silkscreen text-[10px] sm:text-[11px] text-[#1E2022] font-bold truncate">
            {isBossBattle ? 'JEFE REGIONAL' : 'COMBATE'}
          </span>
          <span className="px-1.5 py-0.5 bg-[#1E2022] text-[#F4F4F2] rounded text-[9px] font-mono font-bold shrink-0">
            ⚡ Daño +100%
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-silkscreen text-[9px] text-[#1E2022] font-bold">INVOC:</span>
          <div className="w-16 sm:w-28 h-2.5 bg-stone-300 border border-zinc-500 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                barbara.limitGauge >= 100 ? 'bg-emerald-600 animate-pulse' : 'bg-[#1E2022]'
              }`}
              style={{ width: `${barbara.limitGauge}%` }}
            />
          </div>
          <span className="font-mono-stat text-[10px] text-[#1E2022] tabular-nums font-bold">
            {Math.round(barbara.limitGauge)}%
          </span>
        </div>
      </div>

      {/* Battle Playfield Stage */}
      <div className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-2.5 sm:px-4 py-1 flex flex-col justify-evenly min-h-0">
        {affinityBanner && (
          <div
            key={affinityBanner.id}
            className="absolute top-1/2 left-1/2 z-40 pointer-events-none animate-affinity-burst"
          >
            <div
              className={`px-2.5 py-1 rounded-full border-2 shadow-2xl font-silkscreen text-[10px] whitespace-nowrap flex items-center gap-1 ${
                affinityBanner.tier === 'ultra' || affinityBanner.tier === 'super'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                  : affinityBanner.tier === 'stab'
                  ? 'bg-[#F4F4F2] border-zinc-600 text-[#1E2022]'
                  : 'bg-red-50 border-red-600 text-red-900'
              }`}
            >
              <span>{ELEMENT_META[affinityBanner.attackElement]?.icon}</span>
              <span>&rarr;</span>
              <span>{ELEMENT_META[affinityBanner.targetElement]?.icon}</span>
              <span className="px-1 rounded bg-[#1E2022] text-[#F4F4F2] font-bold">{affinityBanner.badgeLabel}</span>
            </div>
          </div>
        )}

        {/* ENEMY ROW */}
        <div className="flex justify-between sm:justify-end items-center gap-2 sm:pr-6">
          <div className="bg-[#F4F4F2]/95 border-2 border-zinc-400 p-2 rounded-xl shadow-xl flex-1 max-w-[225px] sm:max-w-[265px] text-[#1E2022]">
            <div className="flex justify-between items-center mb-0.5">
              <span className="font-silkscreen text-[10px] sm:text-xs text-[#1E2022] font-bold truncate max-w-[130px]">
                {enemySpirit.name}
              </span>
              <span className="font-mono-stat text-[10px] text-[#1E2022] font-bold">Nv.{enemySpirit.level}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1 mb-1">
              {getElementBadge(enemySpirit.primaryElement)}
              {enemySpirit.secondaryElement && getElementBadge(enemySpirit.secondaryElement)}
            </div>
            {enemyWeaknesses.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mb-1 text-[9px] font-mono text-zinc-700">
                <span className="text-zinc-600 font-bold">Débil:</span>
                {enemyWeaknesses.slice(0, 3).map(w => (
                  <span key={w} className="px-1 bg-stone-200 border border-zinc-400 rounded text-[8px] text-[#1E2022] font-bold">
                    {ELEMENT_META[w]?.icon} {ELEMENT_META[w]?.label}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1 text-[9px] font-mono-stat mb-0.5">
              <span className="text-red-700 font-bold">PS</span>
              <div className="flex-1 h-2 bg-stone-300 border border-zinc-500 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    enemySpirit.currentHp / enemySpirit.maxHp < 0.25
                      ? 'bg-red-600'
                      : enemySpirit.currentHp / enemySpirit.maxHp < 0.5
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${(enemySpirit.currentHp / enemySpirit.maxHp) * 100}%` }}
                />
              </div>
              <span className="text-[#1E2022] font-bold tabular-nums">{enemySpirit.currentHp}/{enemySpirit.maxHp}</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono-stat">
              <span className="text-sky-700 font-bold">PM</span>
              <div className="flex-1 h-1.5 bg-stone-300 border border-zinc-400 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 transition-all duration-300"
                  style={{ width: `${(enemySpirit.currentMp / enemySpirit.maxMp) * 100}%` }}
                />
              </div>
              <span className="text-zinc-700 font-bold tabular-nums">{enemySpirit.currentMp}/{enemySpirit.maxMp}</span>
            </div>
          </div>

          <div
            className={`relative w-22 h-22 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center transition-all duration-300 ${
              enemyHitFlash
                ? 'animate-spirit-shake brightness-200 contrast-200'
                : enemyLunging
                ? 'animate-lunge-left'
                : captureAnimPhase === 'shaking'
                ? 'animate-capture-wobble'
                : ''
            }`}
          >
            <canvas
              ref={enemyCanvasRef}
              width={140}
              height={140}
              className={`w-full h-full object-contain image-render-pixel transition-all duration-300 ${
                captureAnimPhase === 'shaking'
                  ? 'opacity-30 scale-50 brightness-150'
                  : captureAnimPhase === 'success'
                  ? 'opacity-0 scale-0'
                  : 'opacity-100 scale-100'
              }`}
            />
            {captureAnimPhase !== 'idle' && (
              <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
                {captureAnimPhase === 'throwing' && (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 via-emerald-300 to-sky-400 border-2 border-white shadow-[0_0_20px_rgba(52,211,153,0.9)] flex items-center justify-center text-xl animate-vincular-throw">
                    🧿
                  </div>
                )}
                {captureAnimPhase === 'shaking' && (
                  <div className="w-13 h-13 rounded-full bg-gradient-to-br from-amber-300 via-emerald-400 to-sky-500 border-2 border-white shadow-[0_0_24px_rgba(250,204,21,0.9)] flex items-center justify-center text-2xl animate-vincular-shake">
                    🧿
                  </div>
                )}
                {captureAnimPhase === 'success' && (
                  <div className="w-14 h-14 rounded-full bg-emerald-400/90 border-2 border-amber-200 shadow-[0_0_32px_rgba(16,185,129,0.95)] flex items-center justify-center text-2xl animate-vincular-burst">
                    ✨
                  </div>
                )}
                {captureAnimPhase === 'fail' && (
                  <div className="w-12 h-12 rounded-full bg-amber-500/80 border-2 border-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.85)] flex items-center justify-center text-xl animate-vincular-fail">
                    💥
                  </div>
                )}
              </div>
            )}
            {floatingTexts.filter(f => f.isEnemy).map(f => (
              <div
                key={f.id}
                className="absolute -top-2 left-1/2 z-40 pointer-events-none font-silkscreen text-base sm:text-xl font-black drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] whitespace-nowrap animate-damage-popup text-center"
                style={{ color: f.color }}
              >
                <div>{f.text}</div>
                {f.subtext && (
                  <div className="text-[9px] font-mono bg-zinc-950/90 px-1 rounded border border-current inline-block -mt-1">
                    {f.subtext}
                  </div>
                )}
              </div>
            ))}
            {activeAttackEffect && activeAttackEffect.isTargetEnemy && (
              <AttackVfx element={activeAttackEffect.element} skillName={activeAttackEffect.skillName} />
            )}
          </div>
        </div>

        {/* PLAYER ROW */}
        <div className="flex justify-between sm:justify-start items-center gap-2 sm:pl-6">
          <div
            className={`relative w-24 h-24 sm:w-34 sm:h-34 shrink-0 flex items-center justify-center transition-all ${
              playerHitFlash
                ? 'animate-spirit-shake brightness-200 contrast-200'
                : playerLunging
                ? 'animate-lunge-right'
                : ''
            }`}
          >
            <canvas ref={playerCanvasRef} width={140} height={140} className="w-full h-full object-contain image-render-pixel" />
            {floatingTexts.filter(f => !f.isEnemy).map(f => (
              <div
                key={f.id}
                className="absolute -top-2 left-1/2 z-40 pointer-events-none font-silkscreen text-base sm:text-xl font-black drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] whitespace-nowrap animate-damage-popup text-center"
                style={{ color: f.color }}
              >
                <div>{f.text}</div>
                {f.subtext && (
                  <div className="text-[9px] font-mono bg-zinc-950/90 px-1 rounded border border-current inline-block -mt-1">
                    {f.subtext}
                  </div>
                )}
              </div>
            ))}
            {activeAttackEffect && !activeAttackEffect.isTargetEnemy && (
              <AttackVfx element={activeAttackEffect.element} skillName={activeAttackEffect.skillName} />
            )}
          </div>

          <div className="bg-[#F4F4F2]/95 border-2 border-zinc-400 p-2 rounded-xl shadow-xl flex-1 max-w-[225px] sm:max-w-[270px] text-[#1E2022]">
            <div className="flex justify-between items-center mb-0.5">
              <span className="font-silkscreen text-[10px] sm:text-xs text-[#1E2022] font-bold truncate max-w-[130px]">
                {playerSpirit.name}
              </span>
              <span className="font-mono-stat text-[10px] text-[#1E2022] font-bold">Nv.{playerSpirit.level}</span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              {getElementBadge(playerSpirit.primaryElement)}
              {playerSpirit.secondaryElement && getElementBadge(playerSpirit.secondaryElement)}
            </div>

            <div className="flex items-center gap-1 text-[9px] font-mono-stat mb-0.5">
              <span className="text-red-700 font-bold">PS</span>
              <div className="flex-1 h-2 bg-stone-300 border border-zinc-500 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    playerSpirit.currentHp / playerSpirit.maxHp < 0.25
                      ? 'bg-red-600'
                      : playerSpirit.currentHp / playerSpirit.maxHp < 0.5
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${(playerSpirit.currentHp / playerSpirit.maxHp) * 100}%` }}
                />
              </div>
              <span className="text-[#1E2022] font-bold tabular-nums">{playerSpirit.currentHp}/{playerSpirit.maxHp}</span>
            </div>

            <div className="flex items-center gap-1 text-[9px] font-mono-stat mb-0.5">
              <span className="text-sky-700 font-bold">PM</span>
              <div className="flex-1 h-1.5 bg-stone-300 border border-zinc-400 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 transition-all duration-300"
                  style={{ width: `${(playerSpirit.currentMp / playerSpirit.maxMp) * 100}%` }}
                />
              </div>
              <span className="text-zinc-700 font-bold tabular-nums">{playerSpirit.currentMp}/{playerSpirit.maxMp}</span>
            </div>

            <div className="flex items-center gap-1 text-[8px] font-mono-stat">
              <span className="text-amber-700 font-bold">EXP</span>
              <div className="flex-1 h-1.5 bg-stone-300 border border-zinc-400 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round((playerSpirit.exp / Math.max(1, playerSpirit.maxExp)) * 100))}%` }}
                />
              </div>
              <span className="text-zinc-700 font-bold tabular-nums">
                {playerSpirit.exp}/{playerSpirit.maxExp}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Minimalist 2-Line Combat Log + Compact Action Pad (Blanco Humo + Negro Grafito) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-2.5 sm:px-4 pb-2 sm:pb-3 flex flex-col gap-1.5 shrink-0">
        {/* Minimalist 2-Line Log */}
        <div
          aria-live="polite"
          className="bg-[#F4F4F2]/95 border border-zinc-400 rounded-xl px-2.5 py-1.5 font-ui text-[10px] sm:text-xs space-y-0.5 shadow-inner min-h-[2.6rem] flex flex-col justify-center text-[#1E2022]"
        >
          {lastTwoLogs.map((log, idx) => (
            <div
              key={log.id}
              className={`leading-tight truncate ${
                idx === 1
                  ? 'text-zinc-600 text-[9px] sm:text-[10px]'
                  : log.type === 'heal'
                  ? 'font-bold text-emerald-800'
                  : log.type === 'damage'
                  ? 'font-bold text-red-800'
                  : 'font-bold text-[#1E2022]'
              }`}
            >
              {log.text}
            </div>
          ))}
        </div>

        {/* Action Menu Box */}
        <div className="w-full bg-[#F4F4F2]/98 border-2 border-zinc-500 rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between shadow-2xl text-[#1E2022]">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-300">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-500 shrink-0 flex items-center justify-center overflow-hidden">
                <canvas ref={actionAvatarCanvasRef} width={44} height={44} className="w-full h-full object-contain image-render-pixel" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-silkscreen text-[10px] text-[#1E2022] font-bold truncate max-w-[115px]">{playerSpirit.name}</span>
                  <span className="text-[9px] px-1 bg-[#1E2022] text-[#F4F4F2] rounded font-mono font-bold">
                    Nv.{playerSpirit.level}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-zinc-700 font-bold">
                  {playerSpirit.currentHp} PS · {playerSpirit.currentMp} PM
                </div>
              </div>
            </div>

            <span className="text-[9px] px-2 py-0.5 rounded bg-stone-200 border border-zinc-400 text-[#1E2022] font-silkscreen font-bold uppercase shrink-0">
              {forcedSwitch
                ? 'RELEVO OBLIGATORIO'
                : actionCategory === 'main'
                ? 'ACCIONES'
                : actionCategory === 'skills'
                ? 'TÉCNICAS'
                : actionCategory === 'items'
                ? 'ÍTEMS'
                : actionCategory === 'party_switch'
                ? 'EQUIPO'
                : 'HUIR'}
            </span>
          </div>

          {actionCategory === 'main' && !forcedSwitch && (
            <div className="grid grid-cols-6 gap-1.5">
              {/* Dominant Primary CTA: LUCHAR */}
              <button
                disabled={isAnimating}
                onClick={() => {
                  sound.playSelect();
                  setActionCategory('skills');
                }}
                className="col-span-4 py-3 px-3 min-h-[44px] bg-[#1E2022] hover:bg-zinc-800 disabled:opacity-50 text-[#F4F4F2] font-silkscreen text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-95 border-2 border-[#1E2022]"
              >
                <Swords className="w-4 h-4 shrink-0" />
                <span>LUCHAR</span>
              </button>

              {/* Compact Secondary CTA: VINC */}
              <button
                disabled={isAnimating || (inventory.orbe_resonancia?.count || 0) <= 0}
                onClick={handleCapture}
                className="col-span-2 py-2 px-1.5 min-h-[44px] bg-stone-200 hover:bg-stone-300 disabled:opacity-50 text-[#1E2022] font-silkscreen text-[9px] sm:text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 border border-zinc-400"
              >
                <Crosshair className="w-3.5 h-3.5 text-[#1E2022] shrink-0" />
                <span className="truncate">VINC ({inventory.orbe_resonancia?.count || 0})</span>
              </button>

              <button
                disabled={isAnimating}
                onClick={() => {
                  sound.playSelect();
                  setSelectedBattleItem(null);
                  setActionCategory('items');
                }}
                className="col-span-2 p-2 min-h-[40px] bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-900 font-silkscreen text-[10px] sm:text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 border border-emerald-500"
              >
                <Backpack className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>ÍTEMS</span>
              </button>

              <button
                disabled={isAnimating || battleParty.length <= 1}
                onClick={() => {
                  sound.playSelect();
                  setActionCategory('party_switch');
                }}
                className="col-span-2 p-2 min-h-[40px] bg-[#E7E7E2] hover:bg-stone-300 disabled:opacity-40 text-[#1E2022] font-silkscreen text-[10px] sm:text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 border border-zinc-400"
              >
                <Users className="w-3.5 h-3.5 text-[#1E2022]" />
                <span>EQUIPO</span>
              </button>

              <button
                disabled={isAnimating}
                onClick={() => {
                  sound.playCancel();
                  setActionCategory('confirm_flee');
                }}
                className="col-span-2 p-2 min-h-[40px] bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-800 font-silkscreen text-[10px] sm:text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 border border-red-400"
              >
                <span>🏃 HUIR</span>
              </button>

              {barbara.limitGauge >= 100 && (
                <button
                  disabled={isAnimating}
                  onClick={handleNatureSummon}
                  className="col-span-6 p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-silkscreen text-[11px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl animate-pulse cursor-pointer border-2 border-emerald-800"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>¡INVOCACIÓN PRIMIGENIA! (1 USO)</span>
                </button>
              )}
            </div>
          )}

          {actionCategory === 'items' && (
            <div className="flex flex-col space-y-1.5">
              {!selectedBattleItem ? (
                <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                  {usableBattleItems.length === 0 ? (
                    <div className="p-3 bg-[#E7E7E2] border border-zinc-400 rounded-xl text-center text-[10px] font-mono text-zinc-700">
                      No tienes ítems curativos o de apoyo en la mochila.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {usableBattleItems.map(item => (
                        <button
                          key={item.id}
                          disabled={isAnimating}
                          onClick={() => {
                            sound.playSelect();
                            setSelectedBattleItem(item);
                          }}
                          className="p-2 bg-[#E7E7E2] hover:bg-stone-300 border border-zinc-400 rounded-xl text-left flex items-center justify-between gap-2 cursor-pointer active:scale-95"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg shrink-0">{item.icon}</span>
                            <div className="min-w-0">
                              <div className="font-silkscreen text-[10px] text-[#1E2022] font-bold truncate">{item.name}</div>
                              <div className="text-[9px] font-mono text-zinc-700 truncate">{item.description}</div>
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-mono font-bold shrink-0">
                            x{item.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                  <div className="text-[10px] font-silkscreen text-emerald-800 font-bold flex items-center justify-between gap-2">
                    <span className="truncate">
                      Usar {selectedBattleItem.icon} {selectedBattleItem.name} en:
                    </span>
                    <button
                      onClick={() => {
                        sound.playCancel();
                        setSelectedBattleItem(null);
                      }}
                      className="text-[9px] font-mono text-zinc-700 hover:text-[#1E2022] underline shrink-0 cursor-pointer"
                    >
                      Cambiar ítem
                    </button>
                  </div>
                  {battleParty.map(spirit => {
                    const isFainted = spirit.currentHp <= 0;
                    const disabled =
                      isAnimating ||
                      (selectedBattleItem.effectType === 'revive' ? !isFainted : isFainted);
                    return (
                      <button
                        key={spirit.uid}
                        disabled={disabled}
                        onClick={() => handleUseBattleItemOnAlly(selectedBattleItem, spirit)}
                        className={`w-full p-1.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          disabled
                            ? 'bg-stone-200 border-zinc-300 text-zinc-500 opacity-60 cursor-not-allowed'
                            : 'bg-[#E7E7E2] hover:bg-stone-300 border-zinc-400 text-[#1E2022] cursor-pointer active:scale-98'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-silkscreen text-[10px] font-bold truncate">{spirit.name}</div>
                          <div className="text-[9px] font-mono text-zinc-700">
                            PS {spirit.currentHp}/{spirit.maxHp} · PM {spirit.currentMp}/{spirit.maxMp}
                          </div>
                        </div>
                        <span className={`font-silkscreen text-[9px] font-bold shrink-0 ${isFainted && selectedBattleItem.effectType !== 'revive' ? 'text-red-700' : 'text-emerald-700'}`}>
                          {isFainted && selectedBattleItem.effectType !== 'revive'
                            ? 'K.O.'
                            : !isFainted && selectedBattleItem.effectType === 'revive'
                            ? 'SANO'
                            : 'APLICAR ➔'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => {
                  sound.playCancel();
                  setSelectedBattleItem(null);
                  setActionCategory('main');
                }}
                className="w-full py-2 bg-stone-200 hover:bg-stone-300 border border-zinc-400 rounded-lg text-[#1E2022] text-[11px] font-silkscreen font-bold cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>VOLVER</span>
              </button>
            </div>
          )}

          {actionCategory === 'party_switch' && (
            <div className="flex flex-col space-y-1.5">
              <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                <div className="text-[10px] font-silkscreen text-[#1E2022] font-bold flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    {forcedSwitch
                      ? '¡Tu criatura cayó! Elige un compañero sano para continuar:'
                      : 'SELECCIONA RELEVO EN COMBATE:'}
                  </span>
                </div>
                {battleParty.map(spirit => {
                  const isActive = spirit.uid === playerSpirit.uid;
                  const isFainted = spirit.currentHp <= 0;
                  return (
                    <button
                      key={spirit.uid}
                      disabled={isActive || isFainted || isAnimating}
                      onClick={() => handleSwitchSpirit(spirit.uid)}
                      className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-[#1E2022] border-[#1E2022] text-[#F4F4F2]'
                          : isFainted
                          ? 'bg-red-50 border-red-300 text-red-800 opacity-75 cursor-not-allowed'
                          : 'bg-[#E7E7E2] hover:bg-stone-300 border-zinc-400 text-[#1E2022] cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="font-silkscreen text-[10px] font-bold flex items-center gap-1.5">
                          <span>{spirit.name}</span>
                          <span className={`text-[9px] ${isActive ? 'text-stone-300' : 'text-zinc-600'}`}>Nv.{spirit.level}</span>
                        </div>
                        <div className={`text-[9px] font-mono ${isActive ? 'text-stone-300' : 'text-zinc-700'}`}>
                          PS {spirit.currentHp}/{spirit.maxHp} · PM {spirit.currentMp}/{spirit.maxMp} · {spirit.primaryElement}
                        </div>
                      </div>
                      <span className={`font-silkscreen text-[9px] font-bold ${isActive ? 'text-emerald-300' : isFainted ? 'text-red-700' : 'text-[#1E2022]'}`}>
                        {isActive ? 'ACTUAL' : isFainted ? 'K.O.' : 'ENVIAR ➔'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!forcedSwitch && (
                <button
                  onClick={() => {
                    sound.playCancel();
                    setActionCategory('main');
                  }}
                  className="w-full py-2 bg-stone-200 hover:bg-stone-300 border border-zinc-400 rounded-lg text-[#1E2022] text-[11px] font-silkscreen font-bold cursor-pointer flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>VOLVER</span>
                </button>
              )}
            </div>
          )}

          {actionCategory === 'skills' && (
            <div className="flex flex-col space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                {playerSpirit.skills.slice(0, 4).map(skill => {
                  const preview =
                    skill.category === 'heal' || skill.category === 'support'
                      ? null
                      : getElementalMultiplier(
                          skill.element,
                          enemySpirit.primaryElement,
                          enemySpirit.secondaryElement,
                          playerSpirit.primaryElement,
                          playerSpirit.secondaryElement
                        );

                  return (
                    <button
                      key={skill.id}
                      disabled={isAnimating || playerSpirit.currentMp < skill.mpCost}
                      onClick={() => handleSpiritSkill(skill)}
                      className={`p-2 bg-[#E7E7E2] hover:bg-stone-300 disabled:opacity-40 border rounded-xl text-left cursor-pointer transition-all flex flex-col justify-between active:scale-95 ${
                        preview && preview.elementalMultiplier > 1.0
                          ? 'border-emerald-600 bg-emerald-50/90'
                          : 'border-zinc-400'
                      }`}
                    >
                      <span className="font-silkscreen text-[10px] text-[#1E2022] font-bold truncate block">
                        {ELEMENT_META[skill.element]?.icon} {skill.name}
                      </span>
                      <div className="flex justify-between items-center text-[9px] font-mono-stat mt-0.5 gap-1">
                        <span className="text-zinc-700 font-bold">{skill.category === 'heal' ? 'Cura' : `Pot:${skill.power}`}</span>
                        {preview && (
                          <span
                            className={`px-1 rounded text-[8px] font-bold ${
                              preview.elementalMultiplier > 1.0
                                ? 'bg-emerald-600 text-white'
                                : preview.elementalMultiplier < 1.0
                                ? 'bg-red-100 text-red-800 border border-red-400'
                                : preview.hasStab
                                ? 'bg-[#1E2022] text-[#F4F4F2]'
                                : 'text-zinc-700'
                            }`}
                          >
                            x{preview.multiplier}
                          </span>
                        )}
                        <span className="text-[#1E2022] font-bold">{skill.mpCost} PM</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  sound.playCancel();
                  setActionCategory('main');
                }}
                className="w-full py-2 bg-stone-200 hover:bg-stone-300 border border-zinc-400 rounded-lg text-[#1E2022] text-[11px] font-silkscreen font-bold cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>VOLVER</span>
              </button>
            </div>
          )}

          {actionCategory === 'confirm_flee' && (
            <div className="flex flex-col p-1.5 text-center space-y-2">
              <div className="font-silkscreen text-[11px] text-[#1E2022] font-bold">¿RETIRARSE DEL COMBATE?</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActionCategory('main')}
                  className="flex-1 py-2.5 bg-[#1E2022] hover:bg-zinc-800 rounded-xl font-silkscreen text-[10px] text-[#F4F4F2] font-bold cursor-pointer"
                >
                  CONTINUAR
                </button>
                <button
                  onClick={() => {
                    sound.playCancel();
                    onSyncBattleParty?.(battleParty, playerSpirit.uid);
                    onFlee();
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 border border-red-800 rounded-xl font-silkscreen text-[10px] text-white font-bold cursor-pointer"
                >
                  HUIR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INTERACTIVE EVASION MINIGAME OVERLAY */}
      {dodgeChallenge?.active && (
        <div className="fixed inset-0 z-50 bg-zinc-950/55 backdrop-blur-[2px] flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-[#F4F4F2] border-2 border-[#1E2022] rounded-2xl p-4 shadow-2xl text-[#1E2022] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-700" />
                <span className="font-silkscreen text-xs font-bold uppercase">¡ESQUIVA EL ATAQUE!</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-red-100 border border-red-400 text-red-800 font-mono text-[10px] font-bold truncate max-w-[160px]">
                {dodgeChallenge.skillName}
              </span>
            </div>

            <p className="text-[11px] font-mono text-zinc-700 leading-snug">
              <strong>{dodgeChallenge.attackerName}</strong> ataca. Presiona justo cuando el marcador cruce el centro verde: <strong className="text-emerald-700">Verde = 0 Daño</strong> · <strong className="text-amber-700">Ámbar = 50%</strong> · <strong className="text-red-700">Rojo = 100%</strong>.
            </p>

            {/* Timing Bar */}
            <div className="relative w-full h-9 rounded-xl border-2 border-[#1E2022] overflow-hidden flex shadow-inner">
              <div className="w-[20%] h-full bg-red-500/85 flex items-center justify-center text-[9px] font-silkscreen font-bold text-white">
                100%
              </div>
              <div className="w-[18%] h-full bg-amber-400/90 flex items-center justify-center text-[9px] font-silkscreen font-bold text-[#1E2022]">
                50%
              </div>
              <div className="w-[24%] h-full bg-emerald-500 flex items-center justify-center text-[9px] font-silkscreen font-bold text-white border-x-2 border-white">
                ESQUIVA 0%
              </div>
              <div className="w-[18%] h-full bg-amber-400/90 flex items-center justify-center text-[9px] font-silkscreen font-bold text-[#1E2022]">
                50%
              </div>
              <div className="w-[20%] h-full bg-red-500/85 flex items-center justify-center text-[9px] font-silkscreen font-bold text-white">
                100%
              </div>

              {/* Moving Marker */}
              <div
                className="absolute top-0 bottom-0 w-2 -translate-x-1/2 bg-[#1E2022] border-x border-white shadow-[0_0_10px_rgba(0,0,0,0.8)] pointer-events-none"
                style={{ left: `${dodgeChallenge.markerPos}%` }}
              />
            </div>

            <button
              type="button"
              onPointerDown={() => finalizeDodge(dodgeMarkerRef.current, false)}
              className="w-full min-h-[48px] py-3 bg-[#1E2022] hover:bg-zinc-800 text-[#F4F4F2] font-silkscreen text-xs sm:text-sm font-bold rounded-xl shadow-lg cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-2 border-2 border-[#1E2022]"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>¡ESQUIVAR AHORA! (ESPACIO / TOCA)</span>
            </button>
          </div>
        </div>
      )}

      {/* ENCOUNTER INTRO OVERLAY (Blanco Humo + Negro Grafito) */}
      {showEncounterIntro && (
        <div className="fixed inset-0 z-50 bg-zinc-950/75 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#F4F4F2] border-2 border-zinc-500 rounded-2xl sm:rounded-3xl p-4 sm:p-5 max-w-md w-full shadow-2xl flex flex-col items-center text-center gap-3 text-[#1E2022]">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-silkscreen font-bold border ${
                isBossBattle
                  ? 'bg-red-100 text-red-800 border-red-400'
                  : 'bg-[#1E2022] text-[#F4F4F2] border-[#1E2022]'
              }`}
            >
              {isBossBattle ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>¡JEFE ANCESTRAL!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ENCUENTRO SALVAJE</span>
                </>
              )}
            </div>

            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-zinc-900 border-2 border-zinc-400 flex items-center justify-center p-2 shadow-inner">
              <canvas ref={introCanvasRef} width={160} height={160} className="w-full h-full object-contain image-render-pixel" />
            </div>

            <div>
              <h2 className="font-silkscreen text-base text-[#1E2022] font-bold">{enemySpirit.name}</h2>
              <div className="flex items-center justify-center gap-2 text-xs font-mono-stat text-zinc-700 mt-1">
                <span className="text-[#1E2022] font-bold">Nv.{enemySpirit.level}</span>
                <span>&middot;</span>
                {getElementBadge(enemySpirit.primaryElement)}
              </div>
            </div>

            <div className="bg-[#E7E7E2] border border-zinc-400 rounded-xl p-3 text-xs font-ui text-[#1E2022] leading-relaxed text-left w-full">
              <p className="italic line-clamp-3">
                {isBossBattle
                  ? '"Las raíces y el pulso elemental de este santuario pondrán a prueba tu temple."'
                  : `"${enemySpirit.lore}"`}
              </p>
            </div>

            <button
              onClick={() => {
                sound.playConfirm();
                setShowEncounterIntro(false);
              }}
              className="w-full py-3 min-h-[46px] bg-[#1E2022] hover:bg-zinc-800 text-[#F4F4F2] font-silkscreen text-xs font-bold rounded-xl shadow-xl cursor-pointer flex items-center justify-center gap-2 border border-[#1E2022] active:scale-95 transition-transform"
            >
              <Swords className="w-4 h-4" />
              <span>¡ENTRAR AL COMBATE!</span>
            </button>
          </div>
        </div>
      )}

      {/* PRIMAL SUMMON CINEMATIC (Animated Spirit Sprite + Aura) */}
      {activeSummonCinematic && (
        <div className="fixed inset-0 z-50 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
          <div className="relative flex flex-col items-center max-w-md w-full">
            <div className="absolute -inset-12 rounded-full bg-gradient-to-r from-amber-300/25 via-sky-400/20 to-emerald-300/25 animate-spin blur-2xl pointer-events-none" />
            <div className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-zinc-900/90 border-2 border-amber-300/90 shadow-[0_0_40px_rgba(251,191,36,0.35)] flex items-center justify-center mb-4 animate-summon-sprite overflow-hidden">
              <canvas
                ref={summonCanvasRef}
                width={160}
                height={160}
                className="w-full h-full object-contain image-render-pixel"
              />
            </div>
            <h2 className="relative z-10 font-heading text-xl sm:text-2xl text-zinc-100 font-bold mb-2">
              {activeSummonCinematic.name.toUpperCase()}
            </h2>
            <p className="relative z-10 font-ui text-xs text-[#1E2022] font-bold italic bg-[#F4F4F2] p-3 rounded-xl border-2 border-zinc-400 shadow-lg">
              &ldquo;{playerSpirit.name} canaliza la energía primordial de la región junto a {barbara.name}.&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const AttackVfx: React.FC<{ element: ElementType; skillName: string }> = ({ element, skillName }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
      {element === 'fuego' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-orange-500/40 vfx-ring-expand" />
          <div className="absolute w-20 h-2 bg-gradient-to-r from-yellow-200 via-orange-500 to-red-600 vfx-slash-cut shadow-[0_0_14px_#f97316]" />
          <div className="absolute w-14 h-14 rounded-full bg-amber-300/45 animate-ping" />
          <div className="absolute font-silkscreen text-[8px] text-orange-100 font-bold -top-3 bg-orange-950/95 px-1.5 py-0.5 rounded border border-orange-400">
            🔥 {skillName}
          </div>
        </div>
      )}
      {element === 'agua' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full border-4 border-sky-300 vfx-ring-expand opacity-90" />
          <div className="absolute w-16 h-16 rounded-full border-2 border-cyan-200 animate-ping" />
          <div className="absolute font-silkscreen text-[8px] text-sky-100 font-bold -top-3 bg-sky-950/95 px-1.5 py-0.5 rounded border border-sky-400">
            💧 {skillName}
          </div>
        </div>
      )}
      {element === 'planta' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-22 h-22 rounded-full border-2 border-emerald-400 bg-emerald-500/25 vfx-ring-expand" />
          <div className="absolute w-2.5 h-12 bg-emerald-300 rounded-full rotate-45 vfx-shard-rise" />
          <div className="absolute w-2.5 h-12 bg-lime-300 rounded-full -rotate-45 vfx-shard-rise" />
          <div className="absolute font-silkscreen text-[8px] text-emerald-100 font-bold -top-3 bg-emerald-950/95 px-1.5 py-0.5 rounded border border-emerald-400">
            🌿 {skillName}
          </div>
        </div>
      )}
      {element === 'tierra' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-8 h-14 bg-amber-700 border-2 border-amber-300 vfx-shard-rise -translate-x-4" />
          <div className="absolute w-10 h-16 bg-stone-700 border-2 border-amber-400 vfx-shard-rise" />
          <div className="absolute w-8 h-12 bg-amber-800 border-2 border-amber-300 vfx-shard-rise translate-x-4" />
          <div className="absolute font-silkscreen text-[8px] text-amber-100 font-bold -top-3 bg-stone-950/95 px-1.5 py-0.5 rounded border border-amber-500">
            🪨 {skillName}
          </div>
        </div>
      )}
      {element === 'viento' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-teal-300 animate-spin" />
          <div className="absolute w-20 h-1 bg-teal-200 vfx-slash-cut shadow-[0_0_10px_#5eead4]" />
          <div className="absolute font-silkscreen text-[8px] text-teal-100 font-bold -top-3 bg-teal-950/95 px-1.5 py-0.5 rounded border border-teal-400">
            🌪️ {skillName}
          </div>
        </div>
      )}
      {element === 'hielo' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-16 h-16 bg-cyan-200/35 rotate-45 border-2 border-cyan-200 vfx-shard-rise shadow-[0_0_16px_#a5f3fc]" />
          <div className="absolute w-24 h-24 rounded-full border-2 border-cyan-300/75 vfx-ring-expand" />
          <div className="absolute font-silkscreen text-[8px] text-cyan-100 font-bold -top-3 bg-cyan-950/95 px-1.5 py-0.5 rounded border border-cyan-300">
            ❄️ {skillName}
          </div>
        </div>
      )}
      {element === 'sagrado' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-yellow-300/35 vfx-ring-expand" />
          <div className="absolute w-4 h-24 bg-gradient-to-t from-transparent via-amber-200 to-white vfx-shard-rise" />
          <div className="absolute w-24 h-4 bg-gradient-to-r from-transparent via-amber-200 to-white" />
          <div className="absolute font-silkscreen text-[8px] text-amber-100 font-bold -top-3 bg-amber-950/95 px-1.5 py-0.5 rounded border border-amber-300">
            ✨ {skillName}
          </div>
        </div>
      )}
      {element === 'normal' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-20 h-1.5 bg-white vfx-slash-cut shadow-[0_0_10px_#ffffff]" />
          <div className="absolute w-20 h-1.5 bg-zinc-200 -rotate-45 animate-ping" />
          <div className="absolute font-silkscreen text-[8px] text-[#F4F4F2] font-bold -top-3 bg-zinc-900/95 px-1.5 py-0.5 rounded border border-zinc-400">
            ⚔️ {skillName}
          </div>
        </div>
      )}
    </div>
  );
};
