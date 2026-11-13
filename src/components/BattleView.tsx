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
} from 'lucide-react';

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

  const [actionCategory, setActionCategory] = useState<'main' | 'skills' | 'party_switch' | 'confirm_flee'>('main');
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

  const playerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const enemyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const introCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const actionAvatarCanvasRef = useRef<HTMLCanvasElement | null>(null);

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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showEncounterIntro && (e.code === 'Space' || e.code === 'Enter')) {
        sound.playConfirm();
        setShowEncounterIntro(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showEncounterIntro]);

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
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [playerSpirit, enemySpirit, showEncounterIntro]);

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

    const updatedBarbara: BarbaraHero = {
      ...barbara,
      gold: barbara.gold + (isBossBattle ? 250 : wasCaptured ? 45 : 60),
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

    playElementSfx(skill.element);
    triggerElementalVfx(skill.element, skill.category !== 'heal', skill.name);

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

    const summonDamage = 320;
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

  // Vincular (Capture) — Boss capture strictly 0.5x of common (2x harder)
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

    await wait(850);

    if (Math.random() < captureChance) {
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

      await wait(1400);
      onVictory(updatedSpirit, updatedBarbara, { ...enemySpirit, currentHp: enemySpirit.maxHp });
    } else {
      sound.playCancel();
      addLog(`💨 ${enemySpirit.name} resistió el Amuleto de Vínculo.`, 'info');
      addFloatingText(`¡RESISTIÓ!`, '#fbbf24', true);

      await wait(800);
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

    if (currEnemy.baseId === 'trex' || currEnemy.baseId === 'cuellilargo') {
      sound.playDinosaurRoar();
    } else {
      playElementSfx(skill.element as ElementType);
    }
    triggerElementalVfx(skill.element as ElementType, false, skill.name);

    await wait(360);

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
    const damage = Math.max(3, Math.round(baseDamage * (0.85 + Math.random() * 0.25)));

    setPlayerHitFlash(true);
    sound.playHit();

    addFloatingText(
      `-${damage}`,
      aff.multiplier >= 1.5 ? '#facc15' : '#ef4444',
      false,
      aff.multiplier !== 1.0 ? `x${aff.multiplier}` : undefined
    );
    if (aff.multiplier !== 1.0) {
      triggerAffinityBanner(skill.element as ElementType, currPlayer.primaryElement, aff.badgeLabel, aff.multiplier, aff.tier);
    }
    addLog(
      `💥 ${currEnemy.name}: ${skill.name} -> -${damage} PS${aff.multiplier !== 1.0 ? ` (${aff.badgeLabel})` : ''}`,
      'damage'
    );

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
        addLog(`⚠️ ¡${currPlayer.name} cayó! Selecciona otro espíritu.`, 'critical');
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
      fuego: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      agua: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
      planta: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      viento: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
      tierra: 'bg-amber-600/20 text-amber-400 border-amber-600/40',
      hielo: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      sagrado: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      normal: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[9px] font-silkscreen uppercase border ${colors[el] || 'bg-slate-700 text-white'}`}>
        {el}
      </span>
    );
  };

  const enemyWeaknesses = getWeaknessesForSpirit(enemySpirit.primaryElement, enemySpirit.secondaryElement);
  const lastTwoLogs = battleLog.slice(0, 2);

  return (
    <div className="relative w-full h-[100dvh] bg-zinc-950 flex flex-col justify-between overflow-hidden select-none">
      {/* Regional Battle Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        {regionId === 'araucania' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 via-green-950/90 to-zinc-950">
            <div className="absolute bottom-24 left-0 right-0 h-44 bg-[radial-gradient(ellipse_at_top,_#15803d_0%,_transparent_70%)] opacity-55 blur-md" />
          </div>
        ) : regionId === 'loslagos' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-sky-950 to-slate-900">
            <div className="absolute bottom-20 left-0 right-0 h-48 bg-[radial-gradient(ellipse_at_top,_#0c4a6e_0%,_transparent_70%)] opacity-60 blur-md" />
          </div>
        ) : regionId === 'losrios' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/80 to-emerald-950/95">
            <div className="absolute bottom-24 left-0 right-0 h-44 bg-[radial-gradient(ellipse_at_top,_#047857_0%,_transparent_70%)] opacity-55 blur-md" />
          </div>
        ) : regionId === 'biobio' ? (
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-600 via-zinc-700/85 to-stone-900">
            <div className="absolute top-6 left-10 w-44 h-16 rounded-full bg-zinc-300/20 blur-xl animate-pulse" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-sky-700/75 via-emerald-800/70 to-emerald-950" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-10" />
      </div>

      {/* Top Header & Invocación Gauge */}
      <div className="relative z-10 w-full px-3 py-1.5 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 flex justify-between items-center text-xs shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Swords className="w-3.5 h-3.5 text-zinc-200 shrink-0" />
          <span className="font-silkscreen text-[10px] sm:text-[11px] text-zinc-100 truncate">
            {isBossBattle ? 'JEFE REGIONAL' : 'COMBATE'}
          </span>
          <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-950 rounded text-[9px] font-mono font-bold shrink-0">
            ⚡ Daño +100%
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-silkscreen text-[9px] text-zinc-200">INVOC:</span>
          <div className="w-16 sm:w-28 h-2 bg-zinc-900 border border-zinc-600 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                barbara.limitGauge >= 100 ? 'bg-zinc-100 animate-pulse' : 'bg-zinc-400'
              }`}
              style={{ width: `${barbara.limitGauge}%` }}
            />
          </div>
          <span className="font-mono-stat text-[10px] text-zinc-100 tabular-nums font-bold">
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
                  ? 'bg-amber-950/95 border-amber-400 text-amber-300'
                  : affinityBanner.tier === 'stab'
                  ? 'bg-sky-950/95 border-sky-400 text-sky-300'
                  : 'bg-slate-900/95 border-slate-500 text-slate-300'
              }`}
            >
              <span>{ELEMENT_META[affinityBanner.attackElement]?.icon}</span>
              <span>&rarr;</span>
              <span>{ELEMENT_META[affinityBanner.targetElement]?.icon}</span>
              <span className="px-1 rounded bg-black/40 font-bold">{affinityBanner.badgeLabel}</span>
            </div>
          </div>
        )}

        {/* ENEMY ROW */}
        <div className="flex justify-between sm:justify-end items-center gap-2 sm:pr-6">
          <div className="bg-zinc-900/92 border border-zinc-600 p-2 rounded-xl shadow-xl flex-1 max-w-[220px] sm:max-w-[260px]">
            <div className="flex justify-between items-center mb-0.5">
              <span className="font-silkscreen text-[10px] sm:text-xs text-zinc-100 truncate max-w-[130px]">
                {enemySpirit.name}
              </span>
              <span className="font-mono-stat text-[10px] text-zinc-200 font-bold">Nv.{enemySpirit.level}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1 mb-1">
              {getElementBadge(enemySpirit.primaryElement)}
              {enemySpirit.secondaryElement && getElementBadge(enemySpirit.secondaryElement)}
            </div>
            {enemyWeaknesses.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mb-1 text-[9px] font-mono text-zinc-300">
                <span className="text-zinc-400">Débil:</span>
                {enemyWeaknesses.slice(0, 3).map(w => (
                  <span key={w} className="px-1 bg-zinc-950 border border-zinc-700 rounded text-[8px]">
                    {ELEMENT_META[w]?.icon} {ELEMENT_META[w]?.label}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1 text-[9px] font-mono-stat mb-0.5">
              <span className="text-red-400 font-bold">PS</span>
              <div className="flex-1 h-2 bg-zinc-950 border border-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    enemySpirit.currentHp / enemySpirit.maxHp < 0.25
                      ? 'bg-red-500'
                      : enemySpirit.currentHp / enemySpirit.maxHp < 0.5
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(enemySpirit.currentHp / enemySpirit.maxHp) * 100}%` }}
                />
              </div>
              <span className="text-zinc-300 tabular-nums">{enemySpirit.currentHp}/{enemySpirit.maxHp}</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono-stat">
              <span className="text-cyan-400 font-bold">PM</span>
              <div className="flex-1 h-1.5 bg-zinc-950 border border-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${(enemySpirit.currentMp / enemySpirit.maxMp) * 100}%` }}
                />
              </div>
              <span className="text-zinc-300 tabular-nums">{enemySpirit.currentMp}/{enemySpirit.maxMp}</span>
            </div>
          </div>

          <div className={`relative w-22 h-22 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center transition-all ${enemyHitFlash ? 'animate-spirit-shake brightness-200 contrast-200' : ''}`}>
            <canvas ref={enemyCanvasRef} width={140} height={140} className="w-full h-full object-contain image-render-pixel" />
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
          <div className={`relative w-24 h-24 sm:w-34 sm:h-34 shrink-0 flex items-center justify-center transition-all ${playerHitFlash ? 'animate-spirit-shake brightness-200 contrast-200' : ''}`}>
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

          <div className="bg-zinc-900/92 border border-zinc-300/75 p-2 rounded-xl shadow-xl flex-1 max-w-[220px] sm:max-w-[270px]">
            <div className="flex justify-between items-center mb-0.5">
              <span className="font-silkscreen text-[10px] sm:text-xs text-zinc-100 truncate max-w-[130px]">
                {playerSpirit.name}
              </span>
              <span className="font-mono-stat text-[10px] text-zinc-200 font-bold">Nv.{playerSpirit.level}</span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              {getElementBadge(playerSpirit.primaryElement)}
              {playerSpirit.secondaryElement && getElementBadge(playerSpirit.secondaryElement)}
            </div>

            <div className="flex items-center gap-1 text-[9px] font-mono-stat mb-0.5">
              <span className="text-red-400 font-bold">PS</span>
              <div className="flex-1 h-2 bg-zinc-950 border border-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    playerSpirit.currentHp / playerSpirit.maxHp < 0.25
                      ? 'bg-red-500'
                      : playerSpirit.currentHp / playerSpirit.maxHp < 0.5
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(playerSpirit.currentHp / playerSpirit.maxHp) * 100}%` }}
                />
              </div>
              <span className="text-zinc-300 tabular-nums">{playerSpirit.currentHp}/{playerSpirit.maxHp}</span>
            </div>

            <div className="flex items-center gap-1 text-[9px] font-mono-stat">
              <span className="text-cyan-400 font-bold">PM</span>
              <div className="flex-1 h-1.5 bg-zinc-950 border border-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${(playerSpirit.currentMp / playerSpirit.maxMp) * 100}%` }}
                />
              </div>
              <span className="text-zinc-300 tabular-nums">{playerSpirit.currentMp}/{playerSpirit.maxMp}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Minimalist 2-Line Combat Log + Compact Action Pad */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-2.5 sm:px-4 pb-2 sm:pb-3 flex flex-col gap-1.5 shrink-0">
        {/* Minimalist 2-Line Log */}
        <div
          aria-live="polite"
          className="bg-zinc-950/92 border border-zinc-700/90 rounded-xl px-2.5 py-1.5 font-ui text-[10px] sm:text-xs space-y-0.5 shadow-inner min-h-[2.6rem] flex flex-col justify-center"
        >
          {lastTwoLogs.map((log, idx) => (
            <div
              key={log.id}
              className={`leading-tight truncate ${idx === 1 ? 'opacity-65 text-[9px] sm:text-[10px]' : 'font-semibold text-zinc-100'}`}
            >
              {log.text}
            </div>
          ))}
        </div>

        {/* Action Menu Box */}
        <div className="w-full bg-zinc-900/95 border-2 border-zinc-600 rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between shadow-2xl">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-500 shrink-0 flex items-center justify-center overflow-hidden">
                <canvas ref={actionAvatarCanvasRef} width={44} height={44} className="w-full h-full object-contain image-render-pixel" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-silkscreen text-[10px] text-zinc-100 truncate max-w-[115px]">{playerSpirit.name}</span>
                  <span className="text-[9px] px-1 bg-zinc-100 text-zinc-950 rounded font-mono font-bold">
                    Nv.{playerSpirit.level}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-zinc-400">
                  {playerSpirit.currentHp} PS · {playerSpirit.currentMp} PM
                </div>
              </div>
            </div>

            <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-silkscreen uppercase shrink-0">
              {forcedSwitch
                ? 'RELEVO OBLIGATORIO'
                : actionCategory === 'main'
                ? 'ACCIONES'
                : actionCategory === 'skills'
                ? 'TÉCNICAS'
                : actionCategory === 'party_switch'
                ? 'EQUIPO'
                : 'HUIR'}
            </span>
          </div>

          {actionCategory === 'main' && !forcedSwitch && (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                disabled={isAnimating}
                onClick={() => {
                  sound.playSelect();
                  setActionCategory('skills');
                }}
                className="p-2 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 font-silkscreen text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 border border-zinc-300"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>LUCHAR</span>
              </button>

              <button
                disabled={isAnimating || (inventory.orbe_resonancia?.count || 0) <= 0}
                onClick={handleCapture}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 font-silkscreen text-[11px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 border border-zinc-600"
              >
                <Crosshair className="w-3.5 h-3.5 text-zinc-200" />
                <span>VINCULAR ({inventory.orbe_resonancia?.count || 0})</span>
              </button>

              <button
                disabled={isAnimating || battleParty.length <= 1}
                onClick={() => {
                  sound.playSelect();
                  setActionCategory('party_switch');
                }}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-100 font-silkscreen text-[11px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 border border-zinc-600"
              >
                <Users className="w-3.5 h-3.5 text-zinc-200" />
                <span>EQUIPO</span>
              </button>

              <button
                disabled={isAnimating}
                onClick={() => {
                  sound.playCancel();
                  setActionCategory('confirm_flee');
                }}
                className="p-2 bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-zinc-200 font-silkscreen text-[11px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 border border-zinc-700"
              >
                <span>🏃 HUIR</span>
              </button>

              {barbara.limitGauge >= 100 && (
                <button
                  disabled={isAnimating}
                  onClick={handleNatureSummon}
                  className="col-span-2 p-2 bg-zinc-100 hover:bg-white text-zinc-950 font-silkscreen text-[11px] font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl animate-pulse cursor-pointer border-2 border-zinc-300"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>¡INVOCACIÓN PRIMIGENIA! (1 USO)</span>
                </button>
              )}
            </div>
          )}

          {actionCategory === 'party_switch' && (
            <div className="flex flex-col space-y-1.5">
              <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                <div className="text-[10px] font-silkscreen text-zinc-300 flex items-center gap-1">
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
                          ? 'bg-zinc-100 border-zinc-300 text-zinc-950'
                          : isFainted
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed'
                          : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-100 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="font-silkscreen text-[10px] flex items-center gap-1.5">
                          <span>{spirit.name}</span>
                          <span className={`text-[9px] ${isActive ? 'text-zinc-700' : 'text-zinc-400'}`}>Nv.{spirit.level}</span>
                        </div>
                        <div className={`text-[9px] font-mono ${isActive ? 'text-zinc-700' : 'text-zinc-400'}`}>
                          PS {spirit.currentHp}/{spirit.maxHp} · PM {spirit.currentMp}/{spirit.maxMp} · {spirit.primaryElement}
                        </div>
                      </div>
                      <span className={`font-silkscreen text-[9px] ${isActive ? 'text-zinc-950' : 'text-zinc-200'}`}>
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
                  className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 text-[11px] font-silkscreen cursor-pointer flex items-center justify-center gap-1"
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
                      className={`p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 border rounded-xl text-left cursor-pointer transition-all flex flex-col justify-between active:scale-95 ${
                        preview && preview.elementalMultiplier > 1.0
                          ? 'border-zinc-200 bg-zinc-800'
                          : 'border-zinc-700'
                      }`}
                    >
                      <span className="font-silkscreen text-[10px] text-zinc-100 truncate block">
                        {ELEMENT_META[skill.element]?.icon} {skill.name}
                      </span>
                      <div className="flex justify-between items-center text-[9px] font-mono-stat mt-0.5 gap-1">
                        <span className="text-zinc-300">{skill.category === 'heal' ? 'Cura' : `Pot:${skill.power}`}</span>
                        {preview && (
                          <span
                            className={`px-1 rounded text-[8px] font-bold ${
                              preview.elementalMultiplier > 1.0
                                ? 'bg-zinc-100 text-zinc-950'
                                : preview.elementalMultiplier < 1.0
                                ? 'bg-zinc-950 text-zinc-400 border border-zinc-700'
                                : preview.hasStab
                                ? 'bg-zinc-700 text-zinc-100'
                                : 'text-zinc-400'
                            }`}
                          >
                            x{preview.multiplier}
                          </span>
                        )}
                        <span className="text-zinc-200 font-bold">{skill.mpCost} PM</span>
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
                className="w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 text-[11px] font-silkscreen cursor-pointer flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>VOLVER</span>
              </button>
            </div>
          )}

          {actionCategory === 'confirm_flee' && (
            <div className="flex flex-col p-1.5 text-center space-y-2">
              <div className="font-silkscreen text-[11px] text-zinc-100">¿RETIRARSE DEL COMBATE?</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActionCategory('main')}
                  className="flex-1 py-2 bg-zinc-100 hover:bg-white rounded-xl font-silkscreen text-[10px] text-zinc-950 font-bold cursor-pointer"
                >
                  CONTINUAR
                </button>
                <button
                  onClick={() => {
                    sound.playCancel();
                    onSyncBattleParty?.(battleParty, playerSpirit.uid);
                    onFlee();
                  }}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl font-silkscreen text-[10px] text-zinc-100 cursor-pointer"
                >
                  HUIR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ENCOUNTER INTRO OVERLAY */}
      {showEncounterIntro && (
        <div className="fixed inset-0 z-50 bg-zinc-950/92 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-zinc-900 border-2 border-zinc-400/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 max-w-md w-full shadow-2xl flex flex-col items-center text-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-950 text-[10px] font-silkscreen font-bold">
              {isBossBattle ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-zinc-950" />
                  <span>¡JEFE ANCESTRAL!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                  <span>ENCUENTRO SALVAJE</span>
                </>
              )}
            </div>

            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-zinc-950 border border-zinc-700 flex items-center justify-center p-2 shadow-inner">
              <canvas ref={introCanvasRef} width={160} height={160} className="w-full h-full object-contain image-render-pixel" />
            </div>

            <div>
              <h2 className="font-silkscreen text-base text-zinc-100 font-bold">{enemySpirit.name}</h2>
              <div className="flex items-center justify-center gap-2 text-xs font-mono-stat text-zinc-400 mt-1">
                <span className="text-zinc-200 font-bold">Nv.{enemySpirit.level}</span>
                <span>&middot;</span>
                {getElementBadge(enemySpirit.primaryElement)}
              </div>
            </div>

            <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3 text-xs font-ui text-zinc-300 leading-relaxed text-left w-full">
              <p className="italic text-zinc-300 line-clamp-3">
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
              className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-silkscreen text-xs font-bold rounded-xl shadow-xl cursor-pointer flex items-center justify-center gap-2 border border-zinc-300 active:scale-95 transition-transform"
            >
              <Swords className="w-4 h-4" />
              <span>¡ENTRAR AL COMBATE!</span>
            </button>
          </div>
        </div>
      )}

      {/* PRIMAL SUMMON CINEMATIC */}
      {activeSummonCinematic && (
        <div className="fixed inset-0 z-50 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
          <div className="relative flex flex-col items-center max-w-md w-full">
            <div className="absolute -inset-12 rounded-full bg-gradient-to-r from-zinc-200/20 via-zinc-500/20 to-zinc-300/20 animate-spin blur-2xl pointer-events-none" />
            <div className="relative z-10 w-20 h-20 rounded-full bg-zinc-900 border-2 border-zinc-200 flex items-center justify-center mb-4 animate-bounce">
              <Sparkles className="w-10 h-10 text-zinc-100 animate-spin" />
            </div>
            <h2 className="relative z-10 font-heading text-xl sm:text-2xl text-zinc-100 font-bold mb-2">
              {activeSummonCinematic.name.toUpperCase()}
            </h2>
            <p className="relative z-10 font-ui text-xs text-zinc-200 italic bg-zinc-900/80 p-3 rounded-xl border border-zinc-700">
              &ldquo;Los espíritus responden al llamado de {barbara.name}, canalizando energía primordial.&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const AttackVfx: React.FC<{ element: ElementType; skillName: string }> = ({ element, skillName }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-in zoom-in-75 duration-200">
      {element === 'fuego' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-orange-500/30 animate-ping" />
          <div className="absolute w-16 h-2 bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600 rotate-45 shadow-[0_0_12px_#f97316]" />
          <div className="absolute font-silkscreen text-[8px] text-orange-300 font-bold -top-3 bg-slate-950/90 px-1.5 py-0.5 rounded border border-orange-500/50">
            🔥 {skillName}
          </div>
        </div>
      )}
      {element === 'agua' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full border-4 border-sky-400 animate-ping opacity-75" />
          <div className="absolute font-silkscreen text-[8px] text-sky-300 font-bold -top-3 bg-slate-950/90 px-1.5 py-0.5 rounded border border-sky-500/50">
            💧 {skillName}
          </div>
        </div>
      )}
      {(element === 'planta' || element === 'tierra') && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-full bg-emerald-500/30 animate-ping" />
          <div className="absolute font-silkscreen text-[8px] text-emerald-300 font-bold -top-3 bg-slate-950/90 px-1.5 py-0.5 rounded border border-emerald-500/50">
            🌿 {skillName}
          </div>
        </div>
      )}
      {element === 'viento' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full border-2 border-teal-300/80 animate-spin" />
          <div className="absolute font-silkscreen text-[8px] text-teal-300 font-bold -top-3 bg-slate-950/90 px-1.5 py-0.5 rounded border border-teal-500/50">
            🌪️ {skillName}
          </div>
        </div>
      )}
      {element === 'hielo' && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-20 h-20 bg-cyan-200/20 rotate-45 border-2 border-cyan-300 animate-pulse" />
          <div className="absolute font-silkscreen text-[8px] text-cyan-200 font-bold -top-3 bg-slate-950/90 px-1.5 py-0.5 rounded border border-cyan-500/50">
            ❄️ {skillName}
          </div>
        </div>
      )}
      {(element === 'sagrado' || element === 'normal') && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full bg-amber-300/25 animate-ping" />
          <div className="absolute font-silkscreen text-[8px] text-zinc-100 font-bold -top-3 bg-slate-950/90 px-1.5 py-0.5 rounded border border-zinc-500">
            ⚔️ {skillName}
          </div>
        </div>
      )}
    </div>
  );
};
