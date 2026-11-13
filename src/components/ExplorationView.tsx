/**
 * 60fps Open-World Exploration View
 * Mobile-first touch controls, CSS regional atmospheric particle overlays,
 * species-specific overworld movement, safe indoor tile 10 (0% encounter),
 * lowered encounter probabilities (0.5%-1% path, 1%-3% off-path),
 * hospitals, evolution sanctuaries, and exact position preservation.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapRegion, SpiritCreature, BarbaraHero, OverworldEntity, RegionId } from '../types/game';
import { sound } from '../services/audioService';
import { drawBarbaraSprite, drawEntitySprite, drawCreatureSprite } from '../utils/pixelRenderer';
import { getCurrentQuest, isStageBossAwakened } from '../data/questData';
import {
  Volume2,
  VolumeX,
  Backpack,
  Compass,
  MapPin,
  Swords,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Target,
  Settings,
  Award,
} from 'lucide-react';

export type PostDialogueAction =
  | { type: 'shop'; vendorName?: string; regionSubtitle?: string }
  | { type: 'battle'; spiritId: string; isBoss: boolean; atPos: { x: number; y: number }; entityId?: string }
  | { type: 'portal'; dest: RegionId; x?: number; y?: number }
  | { type: 'evolution' };

interface ExplorationViewProps {
  currentRegion: MapRegion;
  unlockedRegions: RegionId[];
  playerSpirit: SpiritCreature;
  barbara: BarbaraHero;
  isMuted: boolean;
  hasCompletedStory?: boolean;
  initialSpawnPos?: { x: number; y: number };
  onSyncPosition?: (pos: { x: number; y: number }) => void;
  onHealAtHome?: () => void;
  onToggleMute: () => void;
  onOpenParty: () => void;
  onOpenInventory: () => void;
  onOpenMap: () => void;
  onOpenSystemMenu: () => void;
  onOpenProfile?: () => void;
  onTriggerDialogue: (speaker: string, lines: string[], afterAction?: PostDialogueAction, portraitSprite?: string) => void;
  onTriggerBattle: (enemySpiritId: string, isBoss: boolean, atPos?: { x: number; y: number }, entityId?: string) => void;
  onClearObstacle: (entityId: string, message: string) => void;
  onOpenChest: (entityId: string, itemReward?: { id: string; count: number }, gold?: number) => void;
  onTravelPortal: (destinationRegion: RegionId, destX?: number, destY?: number) => void;
}

const POLLEN_PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7.3 + 4) % 96}%`,
  top: `${(i * 11.7 + 12) % 88}%`,
  size: `${3 + (i % 3)}px`,
  dur: `${4.2 + (i % 4) * 0.9}s`,
  delay: `${-(i * 0.7)}s`,
}));

const STATIC_RAIN_DROPS = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 4.2 + 1) % 99}%`,
  dur: `${0.72 + (i % 4) * 0.12}s`,
  delay: `${-(i * 0.19)}s`,
}));

const WIND_RAIN_DROPS = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 4.1) % 104}%`,
  dur: `${0.58 + (i % 4) * 0.11}s`,
  delay: `${-(i * 0.15)}s`,
}));

const STORM_RAIN_DROPS = Array.from({ length: 32 }, (_, i) => ({
  left: `${(i * 3.3) % 106}%`,
  dur: `${0.46 + (i % 4) * 0.09}s`,
  delay: `${-(i * 0.13)}s`,
}));

function getSpeciesMovementOffset(ent: OverworldEntity, currentTime: number, tileSize: number): { dx: number; dy: number } {
  const hash = ent.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const t = currentTime * 0.001 + hash * 0.37;
  const species = (ent.encounterSpiritId || ent.sprite.replace('wild_', '')).toLowerCase();

  if (species === 'puducito' || species === 'pudu') {
    // Rhythmic little forest hops
    return {
      dx: Math.sin(t * 1.45) * tileSize * 0.45,
      dy: -Math.abs(Math.sin(t * 4.4)) * 6,
    };
  }
  if (species === 'loica' || species === 'torcaza' || species === 'chucao' || species === 'hualita') {
    // Sweeping figure-8 bird flight
    return {
      dx: Math.sin(t * 1.8) * tileSize * 0.85,
      dy: Math.sin(t * 3.6) * tileSize * 0.42 - 3,
    };
  }
  if (species === 'cuellilargo' || species === 'trex') {
    // Heavy slow prehistoric stomp
    return {
      dx: Math.sin(t * 0.65) * tileSize * 0.55,
      dy: Math.abs(Math.sin(t * 1.3)) * 2,
    };
  }
  if (species === 'pinguino') {
    // Playful side waddle
    return {
      dx: Math.sin(t * 2.2) * tileSize * 0.48,
      dy: Math.abs(Math.sin(t * 4.4)) * 3,
    };
  }
  if (species === 'hongo') {
    // Rooted pulse & gentle sway
    return {
      dx: Math.sin(t * 1.1) * 3,
      dy: Math.sin(t * 2.6) * 3.5,
    };
  }
  if (species === 'quiltro') {
    // Brisk zigzag trot
    return {
      dx: Math.sin(t * 2.5) * tileSize * 0.78,
      dy: Math.cos(t * 1.9) * tileSize * 0.45,
    };
  }
  if (species === 'pillancito') {
    // Quick volcanic ember flicker
    return {
      dx: Math.sin(t * 3.1) * tileSize * 0.58,
      dy: Math.cos(t * 3.7) * tileSize * 0.5,
    };
  }
  // Ventisquero & default gentle glide
  return {
    dx: Math.cos(t * 1.2) * tileSize * 0.6,
    dy: Math.sin(t * 1.2) * tileSize * 0.35,
  };
}

export const ExplorationView: React.FC<ExplorationViewProps> = ({
  currentRegion,
  unlockedRegions,
  playerSpirit,
  barbara,
  isMuted,
  hasCompletedStory = false,
  initialSpawnPos = { x: 7, y: 6 },
  onSyncPosition,
  onHealAtHome,
  onToggleMute,
  onOpenParty,
  onOpenInventory,
  onOpenMap,
  onOpenSystemMenu,
  onOpenProfile,
  onTriggerDialogue,
  onTriggerBattle,
  onClearObstacle,
  onOpenChest,
  onTravelPortal,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeAvatarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const TILE_SIZE = 32;

  const [viewportSize, setViewportSize] = useState({ width: 960, height: 600 });
  const [playerGridPos, setPlayerGridPos] = useState(initialSpawnPos);
  const [playerDir, setPlayerDir] = useState<'down' | 'up' | 'left' | 'right'>(
    initialSpawnPos.y <= 3 ? 'down' : initialSpawnPos.y >= 10 ? 'up' : 'down'
  );
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [nearbyEntity, setNearbyEntity] = useState<OverworldEntity | null>(null);

  const currentQuest = getCurrentQuest(currentRegion, unlockedRegions);

  const posRef = useRef({ x: initialSpawnPos.x, y: initialSpawnPos.y });
  const targetPosRef = useRef({ x: initialSpawnPos.x, y: initialSpawnPos.y });
  const companionPosRef = useRef({ x: initialSpawnPos.x, y: Math.max(1, initialSpawnPos.y - 1) });
  const companionTargetRef = useRef({ x: initialSpawnPos.x, y: Math.max(1, initialSpawnPos.y - 1) });
  const lastRegionRef = useRef<RegionId>(currentRegion.id);
  const dirRef = useRef<'down' | 'up' | 'left' | 'right'>(
    initialSpawnPos.y <= 3 ? 'down' : initialSpawnPos.y >= 10 ? 'up' : 'down'
  );
  const isMovingRef = useRef(false);
  const walkProgressRef = useRef(0);
  const footstepDistRef = useRef(0);
  const heldKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const w = Math.max(320, el.clientWidth);
      const h = Math.max(320, el.clientHeight);
      setViewportSize({ width: w, height: h });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const syncCurrentPos = useCallback(() => {
    const cx = Math.round(posRef.current.x);
    const cy = Math.round(posRef.current.y);
    onSyncPosition?.({ x: cx, y: cy });
    return { x: cx, y: cy };
  }, [onSyncPosition]);

  useEffect(() => {
    const regionChanged = lastRegionRef.current !== currentRegion.id;
    const alreadyThere =
      !regionChanged &&
      Math.round(posRef.current.x) === initialSpawnPos.x &&
      Math.round(posRef.current.y) === initialSpawnPos.y;

    if (alreadyThere) return;

    lastRegionRef.current = currentRegion.id;
    posRef.current = { x: initialSpawnPos.x, y: initialSpawnPos.y };
    targetPosRef.current = { x: initialSpawnPos.x, y: initialSpawnPos.y };
    const companionY = Math.max(1, initialSpawnPos.y - 1);
    companionPosRef.current = { x: initialSpawnPos.x, y: companionY };
    companionTargetRef.current = { x: initialSpawnPos.x, y: companionY };
    const facing = initialSpawnPos.y <= 3 ? 'down' : initialSpawnPos.y >= 14 ? 'up' : 'down';
    dirRef.current = facing;
    setPlayerDir(facing);
    setPlayerGridPos({ x: initialSpawnPos.x, y: initialSpawnPos.y });
  }, [initialSpawnPos.x, initialSpawnPos.y, currentRegion.id]);

  const isTileBlocked = useCallback((x: number, y: number): boolean => {
    if (x < 0 || x >= currentRegion.width || y < 0 || y >= currentRegion.height) return true;
    const tileType = currentRegion.tiles[y]?.[x];
    // Blocked terrain: 2 water, 3 mountain/wall, 4 tree, 5 lava, 8 building exterior
    // Tile 10 is walkable safe indoor room floor!
    if (tileType === 2 || tileType === 3 || tileType === 4 || tileType === 5 || tileType === 8) return true;

    const obstacle = currentRegion.entities.find(
      e => e.x === x && e.y === y && !e.cleared && e.type === 'obstacle'
    );
    if (obstacle) return true;

    return false;
  }, [currentRegion]);

  const handleInteract = useCallback(() => {
    sound.init();
    const { x: currentX, y: currentY } = syncCurrentPos();
    let targetX = currentX;
    let targetY = currentY;

    if (dirRef.current === 'down') targetY += 1;
    if (dirRef.current === 'up') targetY -= 1;
    if (dirRef.current === 'left') targetX -= 1;
    if (dirRef.current === 'right') targetX += 1;

    const entity = currentRegion.entities.find(
      e =>
        ((e.x === targetX && e.y === targetY) || (e.x === currentX && e.y === currentY)) &&
        (!e.cleared || e.type === 'npc')
    );

    if (!entity) return;

    sound.playConfirm();

    if (entity.type === 'npc') {
      if (entity.isShop || entity.id.includes('botica') || entity.id.includes('boticario') || entity.id.includes('vendedor')) {
        onTriggerDialogue(
          entity.name,
          entity.dialog || ['¡Bienvenido a la tienda!'],
          { type: 'shop', vendorName: entity.name, regionSubtitle: currentRegion.name },
          entity.sprite || 'npc_shopkeeper'
        );
        return;
      }

      if (entity.isHospital) {
        sound.playHeal();
        onHealAtHome?.();
        onTriggerDialogue(
          entity.name,
          entity.dialog || ['¡Bienvenido al Hospital! Tus espíritus han recuperado 100% de PS y PM.'],
          undefined,
          entity.sprite || 'npc_enfermera'
        );
        return;
      }

      if (entity.isEvolutionSanctuary) {
        onTriggerDialogue(
          entity.name,
          entity.dialog || ['Santuario de Evolución listo. ¡Despertemos el potencial ancestral de tus espíritus!'],
          { type: 'evolution' },
          entity.sprite || 'npc_explorer'
        );
        return;
      }

      if (entity.dialog) {
        onTriggerDialogue(entity.name, entity.dialog, undefined, entity.sprite);
      }
      if (!entity.cleared && (entity.rewardItem || entity.rewardGold)) {
        onOpenChest(entity.id, entity.rewardItem, entity.rewardGold);
      }
    } else if (entity.type === 'shrine') {
      if (entity.isEvolutionSanctuary) {
        onTriggerDialogue(
          entity.name,
          entity.dialog || ['Altar de Evolución ancestral.'],
          { type: 'evolution' },
          entity.sprite
        );
        return;
      }
      sound.playHeal();
      onHealAtHome?.();
      if (entity.dialog) {
        onTriggerDialogue(entity.name, entity.dialog, undefined, entity.sprite);
      }
    } else if (entity.type === 'chest') {
      sound.playChestOpen();
      onOpenChest(entity.id, entity.rewardItem, entity.rewardGold);
      if (entity.dialog) {
        onTriggerDialogue(entity.name, entity.dialog);
      }
    } else if (entity.type === 'wild_encounter') {
      sound.playEncounter();
      const spiritId = entity.encounterSpiritId || entity.sprite.replace('wild_', '').replace('pudu', 'puducito');
      onTriggerDialogue(
        'Espíritu Silvestre',
        [`¡Un ${entity.name} salvaje te desafía!`],
        {
          type: 'battle',
          spiritId,
          isBoss: false,
          atPos: { x: currentX, y: currentY },
          entityId: entity.id,
        },
        entity.sprite
      );
    } else if (entity.type === 'boss' && entity.bossSpiritId) {
      const bossAwakened = isStageBossAwakened(currentRegion, hasCompletedStory);
      if (!bossAwakened) {
        sound.playCancel();
        onTriggerDialogue(
          'Monolito de Contención Ancestral',
          [
            'El altar del Guardián Regional está sellado por runas elementales durmientes.',
            'Completa las misiones de esta etapa (Menú ⚙️) para despertar su presencia.',
          ]
        );
        return;
      }

      sound.playEncounter();
      onTriggerDialogue(
        entity.name,
        entity.dialog || ['¡Ha llegado la hora del combate decisivo!'],
        {
          type: 'battle',
          spiritId: entity.bossSpiritId,
          isBoss: true,
          atPos: { x: currentX, y: currentY },
          entityId: entity.id,
        },
        entity.sprite
      );
    } else if (entity.type === 'decorative' || entity.sprite.startsWith('deco_')) {
      sound.playAnimalSound(entity.sprite || entity.name);
      if (entity.dialog) {
        onTriggerDialogue(entity.name, entity.dialog, undefined, entity.sprite);
      }
    } else if (entity.type === 'obstacle') {
      const hasElement =
        playerSpirit.primaryElement === entity.elementRequired ||
        playerSpirit.secondaryElement === entity.elementRequired;
      if (hasElement) {
        sound.playConfirm();
        onClearObstacle(entity.id, entity.obstacleClearMessage || '¡Obstáculo superado!');
      } else {
        sound.playCancel();
        onTriggerDialogue(
          'Obstáculo Elemental',
          [
            entity.dialog?.[0] ||
              `Se requiere un espíritu con poder de ${entity.elementRequired?.toUpperCase()} como líder para despejar el paso.`,
          ]
        );
      }
    } else if (entity.type === 'portal' && entity.destinationRegion) {
      if (entity.dialog && entity.dialog.length > 0) {
        onTriggerDialogue(entity.name, entity.dialog, {
          type: 'portal',
          dest: entity.destinationRegion,
          x: entity.destinationX,
          y: entity.destinationY,
        });
      } else {
        onTravelPortal(entity.destinationRegion, entity.destinationX, entity.destinationY);
      }
    }
  }, [
    syncCurrentPos,
    currentRegion,
    hasCompletedStory,
    playerSpirit,
    onHealAtHome,
    onTriggerDialogue,
    onClearObstacle,
    onOpenChest,
    onTravelPortal,
  ]);

  // Silent fallback keyboard listeners for accessibility without UI references
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        heldKeysRef.current.add('up');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        heldKeysRef.current.add('down');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        heldKeysRef.current.add('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        heldKeysRef.current.add('right');
      } else if (['Space', 'Enter'].includes(e.code)) {
        e.preventDefault();
        handleInteract();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) heldKeysRef.current.delete('up');
      if (['ArrowDown', 'KeyS'].includes(e.code)) heldKeysRef.current.delete('down');
      if (['ArrowLeft', 'KeyA'].includes(e.code)) heldKeysRef.current.delete('left');
      if (['ArrowRight', 'KeyD'].includes(e.code)) heldKeysRef.current.delete('right');
    };

    const handleBlur = () => {
      heldKeysRef.current.clear();
      isMovingRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleInteract]);

  useEffect(() => {
    const currentX = playerGridPos.x;
    const currentY = playerGridPos.y;
    let targetX = currentX;
    let targetY = currentY;
    if (playerDir === 'down') targetY += 1;
    if (playerDir === 'up') targetY -= 1;
    if (playerDir === 'left') targetX -= 1;
    if (playerDir === 'right') targetX += 1;

    const entity = currentRegion.entities.find(
      e =>
        ((e.x === targetX && e.y === targetY) || (e.x === currentX && e.y === currentY)) &&
        (!e.cleared || e.type === 'npc')
    );

    if (entity) {
      setNearbyEntity(entity);
      if (entity.isShop) setInteractPrompt(`Tienda: ${entity.name}`);
      else if (entity.isHospital) setInteractPrompt(`Curar: ${entity.name}`);
      else if (entity.isEvolutionSanctuary) setInteractPrompt(`Abrir Santuario`);
      else if (entity.type === 'shrine') setInteractPrompt(`Descansar`);
      else if (entity.type === 'npc') setInteractPrompt(`Hablar: ${entity.name}`);
      else if (entity.type === 'chest') setInteractPrompt('Abrir Cofre');
      else if (entity.type === 'obstacle') setInteractPrompt(`Inspeccionar: ${entity.name}`);
      else if (entity.type === 'boss') setInteractPrompt(`Desafiar: ${entity.name}`);
      else if (entity.type === 'portal') setInteractPrompt(`Ir a ${entity.name}`);
      else setInteractPrompt('Interactuar');
    } else {
      setNearbyEntity(null);
      setInteractPrompt(null);
    }
  }, [playerGridPos, playerDir, currentRegion]);

  // Main 60fps simulation & render loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    const MOVE_SPEED = 4.3;

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const pos = posRef.current;
      const target = targetPosRef.current;

      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0.001) {
        isMovingRef.current = true;
        const step = MOVE_SPEED * dt;
        if (dist <= step) {
          pos.x = target.x;
          pos.y = target.y;
          setPlayerGridPos({ x: target.x, y: target.y });
          onSyncPosition?.({ x: target.x, y: target.y });
          footstepDistRef.current += dist;

          // Contact with roaming wild spirits
          const roamingSpirit = currentRegion.entities.find(e => {
            if (e.cleared) return false;
            if (e.type !== 'wild_encounter' && !e.sprite.startsWith('wild_')) return false;
            return Math.abs(e.x - target.x) <= 0.6 && Math.abs(e.y - target.y) <= 0.6;
          });
          if (roamingSpirit) {
            heldKeysRef.current.clear();
            isMovingRef.current = false;
            sound.playEncounter();
            const spiritBaseId =
              roamingSpirit.encounterSpiritId || roamingSpirit.sprite.replace('wild_', '').replace('pudu', 'puducito');
            onTriggerBattle(spiritBaseId, false, { x: target.x, y: target.y }, roamingSpirit.id);
            return;
          }

          // Encounter rates: 0.8% (0.5%-1%) on path (tile 1), 2.5% (1%-3%) off-path (tiles 0,6,7,9), 0% inside rooms (tile 10) or home
          const arrivedTile = currentRegion.tiles[target.y]?.[target.x];
          if (currentRegion.wildEncounterTable.length > 0 && arrivedTile !== 10) {
            const encounterProb =
              arrivedTile === 1
                ? 0.008
                : arrivedTile === 0 || arrivedTile === 6 || arrivedTile === 7 || arrivedTile === 9
                ? 0.025
                : 0;
            if (encounterProb > 0 && Math.random() < encounterProb) {
              heldKeysRef.current.clear();
              isMovingRef.current = false;
              const table = currentRegion.wildEncounterTable;
              const chosen = table[Math.floor(Math.random() * table.length)];
              sound.playEncounter();
              onTriggerBattle(chosen.spiritId, false, { x: target.x, y: target.y });
              return;
            }
          }
        } else {
          pos.x += (dx / dist) * step;
          pos.y += (dy / dist) * step;
          footstepDistRef.current += step;
        }

        if (footstepDistRef.current >= 1.0) {
          sound.playStep();
          footstepDistRef.current = 0;
        }

        walkProgressRef.current += dt * 5.8;
      } else {
        pos.x = target.x;
        pos.y = target.y;
        let nextDx = 0;
        let nextDy = 0;
        let newDir: 'down' | 'up' | 'left' | 'right' | null = null;

        if (heldKeysRef.current.has('up')) { nextDy = -1; newDir = 'up'; }
        else if (heldKeysRef.current.has('down')) { nextDy = 1; newDir = 'down'; }
        else if (heldKeysRef.current.has('left')) { nextDx = -1; newDir = 'left'; }
        else if (heldKeysRef.current.has('right')) { nextDx = 1; newDir = 'right'; }

        if (newDir) {
          dirRef.current = newDir;
          setPlayerDir(newDir);

          const nextX = target.x + nextDx;
          const nextY = target.y + nextDy;

          if (!isTileBlocked(nextX, nextY)) {
            companionTargetRef.current = { x: target.x, y: target.y };
            targetPosRef.current = { x: nextX, y: nextY };
            isMovingRef.current = true;
          } else {
            isMovingRef.current = false;
          }
        } else {
          isMovingRef.current = false;
          walkProgressRef.current += dt * 1.5;
        }
      }

      // Smoothly update Active Spirit Companion trailing position behind hero
      const cPos = companionPosRef.current;
      const cTarget = companionTargetRef.current;
      const cdx = cTarget.x - cPos.x;
      const cdy = cTarget.y - cPos.y;
      const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
      if (cDist > 0.01) {
        const cStep = Math.min(cDist, MOVE_SPEED * 1.05 * dt);
        cPos.x += (cdx / cDist) * cStep;
        cPos.y += (cdy / cDist) * cStep;
      }

      // Render Scene
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          ctx.fillStyle = currentRegion.id === 'casa' ? '#18181b' : '#09090b';
          ctx.fillRect(0, 0, width, height);

          const baseStageZoom =
            currentRegion.id === 'casa'
              ? 1.25
              : currentRegion.id === 'santiago'
              ? 1.0
              : currentRegion.id === 'biobio'
              ? 1.04
              : currentRegion.id === 'araucania'
              ? 1.08
              : currentRegion.id === 'losrios'
              ? 1.12
              : 1.16;
          const mobileZoomFactor = width < 640 ? 1.05 : 1.1;
          const stageZoom = baseStageZoom * mobileZoomFactor;

          const cameraX = Math.round(pos.x * TILE_SIZE - width / 2 + TILE_SIZE / 2);
          const cameraY = Math.round(pos.y * TILE_SIZE - height / 2 + TILE_SIZE / 2);

          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.scale(stageZoom, stageZoom);
          ctx.translate(-width / 2 - cameraX, -height / 2 - cameraY);

          for (let y = 0; y < currentRegion.height; y++) {
            for (let x = 0; x < currentRegion.width; x++) {
              const tile = currentRegion.tiles[y]?.[x] ?? 0;
              const px = x * TILE_SIZE;
              const py = y * TILE_SIZE;

              if (tile === 0) {
                if (currentRegion.id === 'casa') {
                  ctx.fillStyle = '#92400e';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#78350f';
                  ctx.fillRect(px, py + 8, TILE_SIZE, 2);
                  ctx.fillRect(px, py + 22, TILE_SIZE, 2);
                } else if (currentRegion.id === 'santiago') {
                  ctx.fillStyle = '#4ade80';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#22c55e';
                  ctx.fillRect(px + 4, py + 4, 4, 4);
                  ctx.fillRect(px + 19, py + 17, 4, 4);
                } else if (currentRegion.id === 'biobio') {
                  ctx.fillStyle = '#4d7c0f';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#3f6212';
                  ctx.fillRect(px + 5, py + 6, 4, 4);
                  ctx.fillRect(px + 20, py + 18, 4, 4);
                } else if (currentRegion.id === 'araucania') {
                  // Lush green Araucanía forests & grass contrasting with localized lava pockets (tile 5)
                  ctx.fillStyle = '#15803d';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#22c55e';
                  ctx.fillRect(px + 5, py + 6, 4, 4);
                  ctx.fillStyle = '#14532d';
                  ctx.fillRect(px + 19, py + 19, 4, 4);
                } else if (currentRegion.id === 'losrios') {
                  ctx.fillStyle = '#064e3b';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#047857';
                  ctx.fillRect(px + 4, py + 6, 4, 4);
                  ctx.fillStyle = '#a3e635';
                  if ((x + y) % 5 === 0) ctx.fillRect(px + 20, py + 18, 2, 2);
                } else {
                  ctx.fillStyle = '#475569';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#64748b';
                  ctx.fillRect(px + 4, py + 4, 8, 6);
                  ctx.fillRect(px + 18, py + 16, 8, 6);
                }
              } else if (tile === 1) {
                if (currentRegion.id === 'casa') {
                  ctx.fillStyle = '#52525b';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#d4d4d8';
                  ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                  ctx.fillStyle = '#71717a';
                  ctx.fillRect(px + 12, py + 12, 8, 8);
                } else if (currentRegion.id === 'santiago') {
                  ctx.fillStyle = '#cbd5e1';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#e2e8f0';
                  ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                } else if (currentRegion.id === 'biobio') {
                  ctx.fillStyle = '#64748b';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#451a03';
                  ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, 3);
                  ctx.fillRect(px + 3, py + 16, TILE_SIZE - 6, 3);
                } else if (currentRegion.id === 'araucania') {
                  ctx.fillStyle = '#78716c';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#a8a29e';
                  ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                } else if (currentRegion.id === 'losrios') {
                  ctx.fillStyle = '#1e293b';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#334155';
                  ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                } else {
                  ctx.fillStyle = '#64748b';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#94a3b8';
                  ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                }
              } else if (tile === 2) {
                const waterBase =
                  currentRegion.id === 'santiago'
                    ? '#38bdf8'
                    : currentRegion.id === 'biobio'
                    ? '#475569'
                    : currentRegion.id === 'losrios'
                    ? '#1e3a8a'
                    : '#0c4a6e';
                const waterRipple =
                  currentRegion.id === 'santiago'
                    ? '#bae6fd'
                    : currentRegion.id === 'biobio'
                    ? '#94a3b8'
                    : currentRegion.id === 'losrios'
                    ? '#38bdf8'
                    : '#7dd3fc';
                ctx.fillStyle = waterBase;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = waterRipple;
                const wave = Math.sin(currentTime * 0.004 + x + y) * 3;
                ctx.fillRect(px + 4, py + 10 + wave, 12, 2.5);
                ctx.fillRect(px + 16, py + 20 - wave, 10, 2.5);
              } else if (tile === 3) {
                ctx.fillStyle =
                  currentRegion.id === 'casa'
                    ? '#27272a'
                    : currentRegion.id === 'santiago'
                    ? '#64748b'
                    : currentRegion.id === 'biobio'
                    ? '#475569'
                    : currentRegion.id === 'araucania'
                    ? '#292524'
                    : currentRegion.id === 'losrios'
                    ? '#0f172a'
                    : '#334155';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle =
                  currentRegion.id === 'casa'
                    ? '#3f3f46'
                    : currentRegion.id === 'araucania'
                    ? '#44403c'
                    : currentRegion.id === 'losrios'
                    ? '#1e293b'
                    : '#475569';
                ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                if (currentRegion.id === 'loslagos') {
                  ctx.fillStyle = '#f8fafc';
                  ctx.fillRect(px + 4, py + 2, TILE_SIZE - 8, 6);
                } else if (currentRegion.id === 'losrios') {
                  ctx.fillStyle = '#047857';
                  ctx.fillRect(px + 4, py + 4, 8, 4);
                }
              } else if (tile === 4) {
                const treeSway = Math.sin(currentTime * 0.002 + x + y) * 1.5;
                ctx.fillStyle =
                  currentRegion.id === 'biobio'
                    ? '#365314'
                    : currentRegion.id === 'araucania'
                    ? '#14532d'
                    : currentRegion.id === 'losrios'
                    ? '#022c22'
                    : '#064e3b';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = currentRegion.id === 'losrios' ? '#ea580c' : '#451a03';
                ctx.fillRect(px + 13, py + 20, 6, 10);
                ctx.fillStyle =
                  currentRegion.id === 'santiago'
                    ? '#16a34a'
                    : currentRegion.id === 'biobio'
                    ? '#4d7c0f'
                    : currentRegion.id === 'araucania'
                    ? '#166534'
                    : currentRegion.id === 'losrios'
                    ? '#047857'
                    : '#14532d';
                ctx.beginPath();
                ctx.moveTo(px + TILE_SIZE / 2 + treeSway, py + 2);
                ctx.lineTo(px + TILE_SIZE - 3, py + 20);
                ctx.lineTo(px + 3, py + 20);
                ctx.closePath();
                ctx.fill();
              } else if (tile === 5) {
                // Localized volcanic lava pockets (Araucanía)
                ctx.fillStyle = '#991b1b';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#f97316';
                const lava = Math.sin(currentTime * 0.005 + x) * 2;
                ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                ctx.fillStyle = '#fde047';
                ctx.fillRect(px + 10 + lava, py + 10, 8, 8);
              } else if (tile === 6) {
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#e2e8f0';
                ctx.fillRect(px + 6, py + 10, 14, 4);
              } else if (tile === 7) {
                const fSway = Math.sin(currentTime * 0.003 + x * 2 + y) * 1.2;
                if (currentRegion.id === 'santiago') {
                  ctx.fillStyle = '#facc15';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#eab308';
                  ctx.fillRect(px + 4 + fSway, py + 6, 4, 16);
                  ctx.fillRect(px + 14 - fSway, py + 8, 4, 16);
                  ctx.fillRect(px + 23 + fSway, py + 5, 4, 16);
                } else if (currentRegion.id === 'araucania') {
                  // Lush green meadow with wild blooms & pewén berries
                  ctx.fillStyle = '#15803d';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#f97316';
                  ctx.beginPath();
                  ctx.arc(px + 10 + fSway, py + 12, 4.5, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#fde047';
                  ctx.beginPath();
                  ctx.arc(px + 21 - fSway, py + 19, 4, 0, Math.PI * 2);
                  ctx.fill();
                } else if (currentRegion.id === 'losrios') {
                  ctx.fillStyle = '#064e3b';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#a3e635';
                  ctx.beginPath();
                  ctx.arc(px + 11 + fSway, py + 14, 3.5, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#fde047';
                  ctx.beginPath();
                  ctx.arc(px + 22 - fSway, py + 18, 3, 0, Math.PI * 2);
                  ctx.fill();
                } else {
                  ctx.fillStyle = currentRegion.id === 'biobio' ? '#4d7c0f' : '#475569';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#166534';
                  ctx.beginPath();
                  ctx.arc(px + 11, py + 16, 6, 0, Math.PI * 2);
                  ctx.arc(px + 21, py + 14, 5, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = (x + y) % 2 === 0 ? '#e11d48' : '#facc15';
                  ctx.beginPath();
                  ctx.arc(px + 10 + fSway, py + 10, 3, 0, Math.PI * 2);
                  ctx.arc(px + 22 - fSway, py + 20, 3, 0, Math.PI * 2);
                  ctx.fill();
                }
              } else if (tile === 8) {
                const roofColor =
                  currentRegion.id === 'santiago'
                    ? '#c2410c'
                    : currentRegion.id === 'biobio'
                    ? '#451a03'
                    : currentRegion.id === 'araucania'
                    ? '#9a3412'
                    : currentRegion.id === 'losrios'
                    ? '#0f172a'
                    : '#f8fafc';
                const wallColor =
                  currentRegion.id === 'santiago'
                    ? '#fef3c7'
                    : currentRegion.id === 'biobio'
                    ? '#991b1b'
                    : currentRegion.id === 'araucania'
                    ? '#78350f'
                    : currentRegion.id === 'losrios'
                    ? '#1e293b'
                    : '#334155';
                const winColor =
                  currentRegion.id === 'loslagos'
                    ? '#fbbf24'
                    : currentRegion.id === 'losrios'
                    ? '#fde047'
                    : '#bae6fd';

                if (currentRegion.id === 'casa') {
                  ctx.fillStyle = '#92400e';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#451a03';
                  ctx.fillRect(px + 2, py + 4, TILE_SIZE - 4, TILE_SIZE - 6);
                  ctx.fillStyle = '#78350f';
                  ctx.fillRect(px + 4, py + 6, TILE_SIZE - 8, 6);
                  ctx.fillStyle = '#e4e4e7';
                  ctx.fillRect(px + 6, py + 15, 6, 8);
                  ctx.fillStyle = '#a1a1aa';
                  ctx.fillRect(px + 14, py + 15, 6, 8);
                } else {
                  ctx.fillStyle =
                    currentRegion.id === 'santiago'
                      ? '#4ade80'
                      : currentRegion.id === 'araucania'
                      ? '#15803d'
                      : '#334155';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  if (currentRegion.id === 'loslagos' || currentRegion.id === 'losrios') {
                    ctx.fillStyle =
                      currentRegion.id === 'loslagos' ? 'rgba(251, 191, 36, 0.35)' : 'rgba(163, 230, 53, 0.25)';
                    ctx.beginPath();
                    ctx.arc(px + 16, py + 22, 16, 0, Math.PI * 2);
                    ctx.fill();
                  }
                  ctx.fillStyle = wallColor;
                  ctx.fillRect(px + 3, py + 13, TILE_SIZE - 6, TILE_SIZE - 15);
                  ctx.fillStyle = roofColor;
                  ctx.beginPath();
                  ctx.moveTo(px + 16, py + 1);
                  ctx.lineTo(px + TILE_SIZE - 1, py + 14);
                  ctx.lineTo(px + 1, py + 14);
                  ctx.closePath();
                  ctx.fill();
                  ctx.fillStyle = '#451a03';
                  ctx.fillRect(px + 13, py + 20, 6, 10);
                  ctx.fillStyle = winColor;
                  ctx.fillRect(px + 6, py + 17, 5, 5);
                  ctx.fillRect(px + 21, py + 17, 5, 5);
                }
              } else if (tile === 9) {
                const fernSway = Math.sin(currentTime * 0.003 + x + y) * 1.4;
                ctx.fillStyle = '#365314';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#3f6212';
                ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.fillStyle = '#15803d';
                ctx.fillRect(px + 4 + fernSway, py + 5, 9, 4);
                ctx.fillRect(px + 17 - fernSway, py + 18, 10, 4);
                ctx.fillStyle = '#f59e0b';
                ctx.fillRect(px + 13, py + 11, 5, 5);
              } else if (tile === 10) {
                // Walkable Safe Indoor Room Floor (Shop / Hospital / Sanctuary — 0% wild encounters)
                ctx.fillStyle = (x + y) % 2 === 0 ? '#e7e5e4' : '#d6d3d1';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = 'rgba(24, 24, 27, 0.14)';
                ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, 2);
                ctx.fillRect(px + 1, py + 1, 2, TILE_SIZE - 2);
              }

              ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
              ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            }
          }

          const stageBossAwakened = isStageBossAwakened(currentRegion, hasCompletedStory);

          currentRegion.entities.forEach(ent => {
            let renderX = ent.x * TILE_SIZE;
            let renderY = ent.y * TILE_SIZE;

            if (!ent.cleared && (ent.type === 'wild_encounter' || ent.sprite.startsWith('wild_'))) {
              const offset = getSpeciesMovementOffset(ent, currentTime, TILE_SIZE);
              renderX += offset.dx;
              renderY += offset.dy;
            } else if (
              ent.type === 'npc' &&
              !ent.isShop &&
              !ent.isHospital &&
              !ent.isEvolutionSanctuary &&
              !ent.rewardItem
            ) {
              const hash = ent.id.charCodeAt(ent.id.length - 1) || 2;
              renderX += Math.sin(currentTime * 0.001 + hash) * (TILE_SIZE * 0.25);
            }

            drawEntitySprite(
              ctx,
              ent.type,
              ent.sprite,
              renderX,
              renderY,
              TILE_SIZE,
              ent.cleared || false,
              Math.floor(currentTime * 0.005),
              stageBossAwakened
            );

            if (ent.type === 'boss' && !ent.cleared) {
              const bPulse = Math.sin(currentTime * 0.007) * 4;
              if (stageBossAwakened) {
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(
                  ent.x * TILE_SIZE + TILE_SIZE / 2,
                  ent.y * TILE_SIZE + TILE_SIZE / 2,
                  TILE_SIZE * 0.85 + bPulse,
                  0,
                  Math.PI * 2
                );
                ctx.stroke();

                const badgeW = 96;
                const badgeH = 18;
                const bx = ent.x * TILE_SIZE + TILE_SIZE / 2 - badgeW / 2;
                const by = ent.y * TILE_SIZE - 20 + bPulse;

                ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
                ctx.fillRect(bx, by, badgeW, badgeH);
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(bx, by, badgeW, badgeH);

                ctx.fillStyle = '#fca5a5';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('⚔️ JEFE DESPIERTO', bx + 6, by + 12);
              } else {
                const badgeW = 92;
                const badgeH = 16;
                const bx = ent.x * TILE_SIZE + TILE_SIZE / 2 - badgeW / 2;
                const by = ent.y * TILE_SIZE - 18 + bPulse * 0.5;

                ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                ctx.fillRect(bx, by, badgeW, badgeH);
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 1;
                ctx.strokeRect(bx, by, badgeW, badgeH);

                ctx.fillStyle = '#d8b4fe';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('🔒 SELLO ACTIVO', bx + 6, by + 11);
              }
            }

            if (
              currentQuest.targetCoords &&
              ent.x === currentQuest.targetCoords.x &&
              ent.y === currentQuest.targetCoords.y &&
              !ent.cleared
            ) {
              const pulse = Math.sin(currentTime * 0.008) * 4;
              ctx.fillStyle = '#facc15';
              ctx.beginPath();
              ctx.moveTo(ent.x * TILE_SIZE + TILE_SIZE / 2, ent.y * TILE_SIZE - 4 + pulse);
              ctx.lineTo(ent.x * TILE_SIZE + TILE_SIZE / 2 - 6, ent.y * TILE_SIZE - 14 + pulse);
              ctx.lineTo(ent.x * TILE_SIZE + TILE_SIZE / 2 + 6, ent.y * TILE_SIZE - 14 + pulse);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
              ctx.beginPath();
              ctx.arc(
                ent.x * TILE_SIZE + TILE_SIZE / 2,
                ent.y * TILE_SIZE + TILE_SIZE / 2,
                TILE_SIZE / 1.5 + pulse,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
          });

          // Draw Active Companion Creature trailing behind hero in distinct luminous filter
          const compX = cPos.x * TILE_SIZE;
          const compY = cPos.y * TILE_SIZE;
          const compBob = Math.sin(currentTime * 0.008) * 1.6;
          ctx.save();
          ctx.strokeStyle = 'rgba(244, 244, 245, 0.85)';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.ellipse(compX + TILE_SIZE / 2, compY + TILE_SIZE - 4, 12, 5, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.filter = 'hue-rotate(36deg) brightness(1.18) saturate(1.25) contrast(1.08)';
          drawCreatureSprite(
            ctx,
            playerSpirit.baseId,
            playerSpirit.currentStage,
            compX + 2,
            compY + 2 + compBob,
            TILE_SIZE - 4,
            currentTime * 0.006,
            false
          );
          ctx.restore();

          ctx.fillStyle = '#fafafa';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('★', compX + TILE_SIZE / 2 - 4, compY - 1 + compBob);

          // Draw Protagonist
          drawBarbaraSprite(
            ctx,
            pos.x * TILE_SIZE,
            pos.y * TILE_SIZE,
            TILE_SIZE,
            dirRef.current,
            walkProgressRef.current,
            isMovingRef.current,
            barbara.gender || 'female'
          );

          if (nearbyEntity) {
            ctx.fillStyle = '#f4f4f5';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('!', pos.x * TILE_SIZE + TILE_SIZE / 2 - 3, pos.y * TILE_SIZE - 6);
          }

          ctx.restore();

          // Subtle canvas lighting + regional accents complementing CSS particles
          if (currentRegion.id === 'losrios') {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
            ctx.fillRect(0, 0, width, height);
            for (let f = 0; f < 18; f++) {
              const fx = (f * 61 + Math.sin(currentTime * 0.002 + f) * 28) % width;
              const fy = (f * 43 + Math.cos(currentTime * 0.002 + f) * 20) % height;
              ctx.fillStyle = f % 2 === 0 ? 'rgba(163, 230, 53, 0.78)' : 'rgba(253, 224, 71, 0.78)';
              ctx.fillRect(fx, fy, 3, 3);
            }
          } else if (currentRegion.id === 'biobio') {
            ctx.fillStyle = 'rgba(82, 82, 91, 0.16)';
            ctx.fillRect(0, 0, width, height);
          } else if (currentRegion.id === 'loslagos') {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
            ctx.fillRect(0, 0, width, height);
          }
        }
      }

      if (activeAvatarCanvasRef.current) {
        const avCtx = activeAvatarCanvasRef.current.getContext('2d');
        if (avCtx) {
          avCtx.clearRect(0, 0, 48, 48);
          drawCreatureSprite(avCtx, playerSpirit.baseId, playerSpirit.currentStage, 2, 2, 44, currentTime * 0.004, false);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    currentRegion,
    TILE_SIZE,
    isTileBlocked,
    onTriggerBattle,
    onSyncPosition,
    currentQuest,
    hasCompletedStory,
    barbara.gender,
    nearbyEntity,
    playerSpirit.baseId,
    playerSpirit.currentStage,
  ]);

  const handleDirectionPress = (dir: 'up' | 'down' | 'left' | 'right') => {
    sound.init();
    heldKeysRef.current.add(dir);
  };
  const handleDirectionRelease = (dir: 'up' | 'down' | 'left' | 'right') => {
    heldKeysRef.current.delete(dir);
  };

  const currentTileType = currentRegion.tiles[playerGridPos.y]?.[playerGridPos.x] ?? 0;
  const encounterRateLabel =
    currentRegion.wildEncounterTable.length === 0
      ? 'Hogar · 0%'
      : currentTileType === 10
      ? 'Interior · 0%'
      : currentTileType === 1
      ? 'Camino · 0.5%-1%'
      : 'Fuera · 1%-3%';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] bg-zinc-950 flex flex-col justify-between overflow-hidden select-none touch-manipulation"
    >
      {/* 60fps Canvas Viewport */}
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={viewportSize.width}
          height={viewportSize.height}
          className="w-full h-full image-render-pixel"
        />
      </div>

      {/* Pure CSS Regional Atmospheric Particle Effects Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden" aria-hidden="true">
        {currentRegion.id === 'santiago' &&
          POLLEN_PARTICLES.map((p, idx) => (
            <div
              key={idx}
              className="env-pollen-dot"
              style={
                {
                  left: p.left,
                  top: p.top,
                  width: p.size,
                  height: p.size,
                  '--dur': p.dur,
                  '--delay': p.delay,
                } as React.CSSProperties
              }
            />
          ))}

        {currentRegion.id === 'biobio' && (
          <>
            <div className="env-fog-layer-1" />
            <div className="env-fog-layer-2" />
          </>
        )}

        {currentRegion.id === 'araucania' &&
          STATIC_RAIN_DROPS.map((d, idx) => (
            <div
              key={idx}
              className="env-rain-drop-static"
              style={
                {
                  left: d.left,
                  '--dur': d.dur,
                  '--delay': d.delay,
                } as React.CSSProperties
              }
            />
          ))}

        {currentRegion.id === 'losrios' &&
          WIND_RAIN_DROPS.map((d, idx) => (
            <div
              key={idx}
              className="env-rain-drop-wind"
              style={
                {
                  left: d.left,
                  '--dur': d.dur,
                  '--delay': d.delay,
                } as React.CSSProperties
              }
            />
          ))}

        {currentRegion.id === 'loslagos' && (
          <>
            {STORM_RAIN_DROPS.map((d, idx) => (
              <div
                key={idx}
                className="env-rain-drop-storm"
                style={
                  {
                    left: d.left,
                    '--dur': d.dur,
                    '--delay': d.delay,
                  } as React.CSSProperties
                }
              />
            ))}
            <div className="env-lightning-flash" />
          </>
        )}
      </div>

      {/* Top Floating Monochrome HUD */}
      <header className="relative z-20 w-full p-2 sm:p-3 flex flex-col gap-1.5 max-w-6xl mx-auto pointer-events-none">
        <div className="flex justify-between items-start gap-1.5 sm:gap-2">
          {/* Region, Hero & Profile Shortcut */}
          <button
            onClick={() => {
              sound.init();
              sound.playSelect();
              syncCurrentPos();
              onOpenProfile?.();
            }}
            className="bg-zinc-900/95 hover:bg-zinc-800 backdrop-blur border border-zinc-600/80 px-2 sm:px-2.5 py-1.5 rounded-xl shadow-lg pointer-events-auto flex items-center gap-2 min-w-0 cursor-pointer text-left active:scale-95 transition-all"
            title="Ver Perfil y Medallas"
          >
            <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-300 flex items-center justify-center text-zinc-950 shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-pixel text-[9px] sm:text-[11px] text-zinc-100 truncate">
                {currentRegion.name.split('&')[0].trim()}
              </h3>
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-zinc-300 truncate">
                <span className="text-zinc-100 font-bold truncate">{barbara.name}</span>
                <span>&middot;</span>
                <span>{barbara.gold} Oro</span>
                <span className="hidden xs:inline-flex items-center gap-0.5 text-zinc-100 font-bold">
                  &middot; <Award className="w-2.5 h-2.5 inline" /> {(barbara.medals || []).length}/5
                </span>
              </div>
            </div>
          </button>

          {/* Mobile-Friendly Top Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
            <button
              onClick={() => {
                sound.init();
                sound.playSelect();
                syncCurrentPos();
                onOpenParty();
              }}
              className="p-2 sm:px-2.5 sm:py-2 bg-zinc-900/95 hover:bg-zinc-800 border border-zinc-600 rounded-xl text-zinc-100 transition-colors flex items-center gap-1 text-xs font-mono cursor-pointer shadow-md active:scale-95"
              title="Equipo"
            >
              <Swords className="w-4 h-4 text-zinc-200" />
              <span className="hidden md:inline">Equipo</span>
            </button>

            <button
              onClick={() => {
                sound.init();
                sound.playSelect();
                syncCurrentPos();
                onOpenInventory();
              }}
              className="p-2 sm:px-2.5 sm:py-2 bg-zinc-900/95 hover:bg-zinc-800 border border-zinc-600 rounded-xl text-zinc-100 transition-colors flex items-center gap-1 text-xs font-mono cursor-pointer shadow-md active:scale-95"
              title="Mochila"
            >
              <Backpack className="w-4 h-4 text-zinc-200" />
              <span className="hidden md:inline">Mochila</span>
            </button>

            <button
              onClick={() => {
                sound.init();
                sound.playSelect();
                syncCurrentPos();
                onOpenMap();
              }}
              className="p-2 sm:px-2.5 sm:py-2 bg-zinc-900/95 hover:bg-zinc-800 border border-zinc-600 rounded-xl text-zinc-100 transition-colors flex items-center gap-1 text-xs font-mono cursor-pointer shadow-md active:scale-95"
              title="Mapa de Chile"
            >
              <MapPin className="w-4 h-4 text-zinc-200" />
              <span className="hidden md:inline">Mapa</span>
            </button>

            <button
              onClick={() => {
                sound.init();
                onToggleMute();
              }}
              className="p-2 bg-zinc-900/95 hover:bg-zinc-800 border border-zinc-600 rounded-xl text-zinc-200 transition-colors cursor-pointer shadow-md active:scale-95"
              title="Silenciar / Activar Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-zinc-100" />}
            </button>

            <button
              onClick={() => {
                sound.init();
                sound.playSelect();
                syncCurrentPos();
                onOpenSystemMenu();
              }}
              className="px-2.5 py-2 bg-zinc-100 hover:bg-white border border-zinc-300 rounded-xl text-zinc-950 transition-all flex items-center gap-1 text-[11px] font-silkscreen font-bold cursor-pointer shadow-lg active:scale-95"
              title="Menú, Perfil, Misiones y Guardado"
            >
              <Settings className="w-4 h-4 text-zinc-900" />
              <span className="hidden sm:inline">Menú</span>
            </button>
          </div>
        </div>

        {/* Mission Pill + Live Encounter Probability Pill */}
        <div className="flex flex-wrap items-center justify-between gap-1">
          <button
            onClick={() => {
              sound.init();
              sound.playSelect();
              syncCurrentPos();
              onOpenSystemMenu();
            }}
            className="pointer-events-auto max-w-full sm:max-w-[66%] px-2.5 py-0.5 bg-zinc-950/90 backdrop-blur border border-zinc-500/70 rounded-full text-[9px] sm:text-[10px] font-mono text-zinc-200 shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Target className="w-3 h-3 text-zinc-100 shrink-0" />
            <span className="text-zinc-100 font-bold shrink-0">
              Paso {currentQuest.stepNumber}/{currentQuest.totalSteps}:
            </span>
            <span className="truncate">{currentQuest.shortText}</span>
          </button>

          <div
            className={`pointer-events-auto px-2 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-mono shadow-md ${
              currentTileType === 1 || currentTileType === 10 || currentRegion.wildEncounterTable.length === 0
                ? 'bg-zinc-900/90 border-zinc-600 text-zinc-200'
                : 'bg-zinc-200 border-zinc-400 text-zinc-950 font-bold'
            }`}
            title="Caminos: 0.5%-1% · Fuera de camino: 1%-3% · Interior: 0%"
          >
            Enc: {encounterRateLabel}
          </div>
        </div>
      </header>

      {/* Center Interactive Prompt when near entity */}
      {interactPrompt && (
        <div className="relative z-20 mx-auto pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-150 my-0.5">
          <button
            onClick={handleInteract}
            className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white border-2 border-zinc-900 rounded-full font-pixel text-[10px] sm:text-xs text-zinc-950 shadow-xl shadow-black/80 flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <span className="w-2 h-2 rounded-full bg-zinc-900 animate-ping" />
            <span>{interactPrompt}</span>
          </button>
        </div>
      )}

      {/* Bottom Virtual Gamepad & Status Cluster */}
      <footer className="relative z-20 w-full p-2 sm:p-4 flex justify-between items-end max-w-5xl mx-auto pointer-events-none">
        {/* Virtual Touch D-Pad */}
        <div className="pointer-events-auto bg-zinc-950/90 backdrop-blur p-1.5 sm:p-2 rounded-2xl border border-zinc-700 shadow-2xl touch-none">
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5 w-28 h-28 sm:w-34 sm:h-34">
            <div />
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleDirectionPress('up');
              }}
              onPointerUp={() => handleDirectionRelease('up')}
              onPointerLeave={() => handleDirectionRelease('up')}
              onPointerCancel={() => handleDirectionRelease('up')}
              className="bg-zinc-800 active:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-100 active:text-zinc-950 cursor-pointer select-none touch-none border border-zinc-700"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <div />

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleDirectionPress('left');
              }}
              onPointerUp={() => handleDirectionRelease('left')}
              onPointerLeave={() => handleDirectionRelease('left')}
              onPointerCancel={() => handleDirectionRelease('left')}
              className="bg-zinc-800 active:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-100 active:text-zinc-950 cursor-pointer select-none touch-none border border-zinc-700"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="bg-zinc-900/70 rounded-xl flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
            </div>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleDirectionPress('right');
              }}
              onPointerUp={() => handleDirectionRelease('right')}
              onPointerLeave={() => handleDirectionRelease('right')}
              onPointerCancel={() => handleDirectionRelease('right')}
              className="bg-zinc-800 active:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-100 active:text-zinc-950 cursor-pointer select-none touch-none border border-zinc-700"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div />
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleDirectionPress('down');
              }}
              onPointerUp={() => handleDirectionRelease('down')}
              onPointerLeave={() => handleDirectionRelease('down')}
              onPointerCancel={() => handleDirectionRelease('down')}
              className="bg-zinc-800 active:bg-zinc-200 rounded-xl flex items-center justify-center text-zinc-100 active:text-zinc-950 cursor-pointer select-none touch-none border border-zinc-700"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <div />
          </div>
        </div>

        {/* Action Button & Active Spirit Cluster */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5 sm:gap-2">
          <div className="bg-zinc-900/95 backdrop-blur border border-zinc-600 p-1.5 sm:p-2 rounded-xl shadow-lg flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-zinc-950 border border-zinc-400/70 shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
              <canvas
                ref={activeAvatarCanvasRef}
                width={48}
                height={48}
                className="w-full h-full object-contain image-render-pixel"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-pixel text-[9px] text-zinc-100 truncate max-w-[82px] sm:max-w-[105px]">
                  {playerSpirit.name}
                </span>
                <span className="font-mono text-[9px] text-zinc-300 font-bold">Nv.{playerSpirit.level}</span>
              </div>
              <div className="w-18 sm:w-22 h-1.5 bg-zinc-950 rounded-full overflow-hidden mt-1 border border-zinc-800">
                <div
                  className="h-full bg-zinc-200"
                  style={{ width: `${Math.max(0, Math.min(100, (playerSpirit.currentHp / playerSpirit.maxHp) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleInteract}
            className="w-16 h-16 sm:w-18 sm:h-18 bg-zinc-100 hover:bg-white text-zinc-950 rounded-full font-pixel text-[10px] sm:text-xs font-black shadow-xl shadow-black/70 border-4 border-zinc-500 flex flex-col items-center justify-center cursor-pointer active:scale-90 transition-transform touch-none"
          >
            <span>ACCIÓN</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
