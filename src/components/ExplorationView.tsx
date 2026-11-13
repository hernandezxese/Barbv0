/**
 * 60fps Open-World Exploration View
 * Features:
 * - Tap/Click-to-Move BFS shortest-path navigation (no D-Pad arrows; silent keyboard accessibility fallback)
 * - Progressive Fog of War (tiles reveal radius 4 around player as they explore)
 * - Regional CSS + Canvas weather effects (Santiago pollen, Biobío mist + intermittent rain,
 *   Araucanía static rain, Los Ríos wind rain, Los Lagos storm rain + lightning)
 * - Biobío railway tracks (tile 11) + 0% encounter on paths/rails/interiors, 1%-3% off-path
 * - Top-left live Protagonist Avatar canvas + active Region Weather HUD
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapRegion, SpiritCreature, BarbaraHero, OverworldEntity, RegionId, ElementType } from '../types/game';
import { sound } from '../services/audioService';
import { drawBarbaraSprite, drawEntitySprite, drawCreatureSprite } from '../utils/pixelRenderer';
import { getCurrentQuest, isStageBossAwakened } from '../data/questData';
import { ELEMENT_META } from '../data/spiritsData';
import {
  Volume2,
  VolumeX,
  Backpack,
  MapPin,
  Swords,
  Target,
  Settings,
  Award,
  CloudRain,
  Sun,
  CloudFog,
  Wind,
  CloudLightning,
  Home,
} from 'lucide-react';

export type PostDialogueAction =
  | { type: 'shop'; vendorName?: string; regionSubtitle?: string }
  | { type: 'battle'; spiritId: string; isBoss: boolean; atPos: { x: number; y: number }; entityId?: string }
  | { type: 'portal'; dest: RegionId; x?: number; y?: number; portalEntity?: OverworldEntity }
  | { type: 'evolution' };

interface ExplorationViewProps {
  currentRegion: MapRegion;
  unlockedRegions: RegionId[];
  playerSpirit: SpiritCreature;
  partySpirits?: SpiritCreature[];
  barbara: BarbaraHero;
  isMuted: boolean;
  hasCompletedStory?: boolean;
  initialSpawnPos?: { x: number; y: number };
  revealedTiles?: Record<string, string[]>;
  importantMessage?: string | null;
  onRevealTiles?: (regionId: RegionId, newCoords: string[]) => void;
  onSightSpecies?: (speciesIds: string[]) => void;
  onSyncPosition?: (pos: { x: number; y: number }) => void;
  onHealAtHome?: () => void;
  onToggleMute: () => void;
  onOpenParty: () => void;
  onOpenInventory: () => void;
  onOpenMap: () => void;
  onOpenSystemMenu: () => void;
  onOpenProfile?: () => void;
  onOpenEvolution?: () => void;
  onTriggerDialogue: (speaker: string, lines: string[], afterAction?: PostDialogueAction, portraitSprite?: string) => void;
  onTriggerBattle: (enemySpiritId: string, isBoss: boolean, atPos?: { x: number; y: number }, entityId?: string) => void;
  onClearObstacle: (entityId: string, message: string) => void;
  onOpenChest: (entityId: string, itemReward?: { id: string; count: number }, gold?: number) => void;
  onTravelPortal: (destinationRegion: RegionId, destX?: number, destY?: number, portalEntity?: OverworldEntity) => void;
}

function pickWeightedEncounter(table: MapRegion['wildEncounterTable']) {
  const total = table.reduce((acc, item) => acc + Math.max(1, item.weight), 0);
  let roll = Math.random() * total;
  for (const entry of table) {
    roll -= Math.max(1, entry.weight);
    if (roll <= 0) return entry;
  }
  return table[0];
}

const POLLEN_PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7.3 + 4) % 96}%`,
  top: `${(i * 11.7 + 12) % 88}%`,
  size: `${3 + (i % 3)}px`,
  dur: `${4.2 + (i % 4) * 0.9}s`,
  delay: `${-(i * 0.7)}s`,
}));

const INTERMITTENT_RAIN_DROPS = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 5.7 + 2) % 98}%`,
  dur: `${2.2 + (i % 4) * 0.35}s`,
  delay: `${-(i * 0.45)}s`,
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

const WIND_STREAKS = Array.from({ length: 8 }, (_, i) => ({
  top: `${8 + i * 11}%`,
  width: `${90 + (i % 3) * 45}px`,
  dur: `${1.3 + (i % 3) * 0.4}s`,
  delay: `${-(i * 0.35)}s`,
}));

function getSpeciesMovementOffset(ent: OverworldEntity, currentTime: number, tileSize: number): { dx: number; dy: number } {
  const hash = ent.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const t = currentTime * 0.001 + hash * 0.37;
  const species = (ent.encounterSpiritId || ent.sprite.replace('wild_', '')).toLowerCase();

  if (species === 'puducito' || species === 'pudu') {
    return {
      dx: Math.sin(t * 1.45) * tileSize * 0.45,
      dy: -Math.abs(Math.sin(t * 4.4)) * 6,
    };
  }
  if (species === 'loica' || species === 'torcaza' || species === 'chucao' || species === 'hualita' || species === 'condor') {
    return {
      dx: Math.sin(t * 1.8) * tileSize * 0.85,
      dy: Math.sin(t * 3.6) * tileSize * 0.42 - 3,
    };
  }
  if (species === 'cuellilargo' || species === 'trex' || species === 'jabali') {
    return {
      dx: Math.sin(t * 0.65) * tileSize * 0.5,
      dy: Math.abs(Math.sin(t * 1.3)) * 2,
    };
  }
  if (species === 'pinguino') {
    return {
      dx: Math.sin(t * 2.2) * tileSize * 0.48,
      dy: Math.abs(Math.sin(t * 4.4)) * 3,
    };
  }
  if (species === 'hongo' || species === 'huevo_dino') {
    return {
      dx: Math.sin(t * 1.1) * 3,
      dy: Math.sin(t * 2.6) * 3.5,
    };
  }
  if (species === 'quiltro' || species === 'gato_chileno' || species === 'velociraptor') {
    return {
      dx: Math.sin(t * 2.5) * tileSize * 0.72,
      dy: Math.cos(t * 1.9) * tileSize * 0.42,
    };
  }
  if (species === 'pillancito') {
    return {
      dx: Math.sin(t * 3.1) * tileSize * 0.58,
      dy: Math.cos(t * 3.7) * tileSize * 0.5,
    };
  }
  return {
    dx: Math.cos(t * 1.2) * tileSize * 0.6,
    dy: Math.sin(t * 1.2) * tileSize * 0.35,
  };
}

function isInteriorRegion(id: RegionId): boolean {
  return id === 'casa' || id === 'hospital' || id === 'santuario' || id === 'tienda';
}

function getStageZoom(regionId: RegionId, width: number): number {
  const baseStageZoom = isInteriorRegion(regionId)
    ? 1.24
    : regionId === 'santiago'
    ? 1.0
    : regionId === 'biobio'
    ? 1.04
    : regionId === 'araucania'
    ? 1.08
    : regionId === 'losrios'
    ? 1.12
    : 1.16;
  const mobileZoomFactor = width < 640 ? 1.05 : 1.1;
  return baseStageZoom * mobileZoomFactor;
}

export const ExplorationView: React.FC<ExplorationViewProps> = ({
  currentRegion,
  unlockedRegions,
  playerSpirit,
  barbara,
  isMuted,
  hasCompletedStory = false,
  initialSpawnPos = { x: 5, y: 6 },
  revealedTiles,
  importantMessage,
  onRevealTiles,
  onSightSpecies,
  onSyncPosition,
  onHealAtHome,
  onToggleMute,
  onOpenParty,
  onOpenInventory,
  onOpenMap,
  onOpenSystemMenu,
  onOpenProfile,
  onOpenEvolution,
  onTriggerDialogue,
  onTriggerBattle,
  onClearObstacle,
  onOpenChest,
  onTravelPortal,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeAvatarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroAvatarCanvasRef = useRef<HTMLCanvasElement | null>(null);
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

  // Tap/Click-to-Move BFS path queue + pending interaction when clicking an entity
  const pathQueueRef = useRef<{ x: number; y: number }[]>([]);
  const tapMarkerRef = useRef<{ x: number; y: number; startedAt: number } | null>(null);
  const pendingInteractRef = useRef<{ entityId: string; faceDir: 'down' | 'up' | 'left' | 'right' } | null>(null);

  // Active-Spirit Obstacle Clearance Animation State
  const obstacleSkillAnimRef = useRef<{
    entityId: string;
    targetX: number;
    targetY: number;
    element: ElementType;
    startedAt: number;
    duration: number;
    msg: string;
  } | null>(null);

  // Fast local Fog of War set synced with prop
  const revealedSetRef = useRef<Set<string>>(new Set(revealedTiles?.[currentRegion.id] || []));

  useEffect(() => {
    revealedSetRef.current = new Set(revealedTiles?.[currentRegion.id] || []);
  }, [revealedTiles, currentRegion.id]);

  const revealAreaAround = useCallback(
    (cx: number, cy: number) => {
      if (isInteriorRegion(currentRegion.id) || !onRevealTiles) return;
      const radius = 4;
      const newlyRevealed: string[] = [];
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > 18) continue;
          const tx = cx + dx;
          const ty = cy + dy;
          if (tx < 0 || tx >= currentRegion.width || ty < 0 || ty >= currentRegion.height) continue;
          const key = `${tx},${ty}`;
          if (!revealedSetRef.current.has(key)) {
            revealedSetRef.current.add(key);
            newlyRevealed.push(key);
          }
        }
      }
      if (newlyRevealed.length > 0) {
        onRevealTiles(currentRegion.id, newlyRevealed);
        if (onSightSpecies) {
          const revealedSet = new Set(newlyRevealed);
          const sightedIds: string[] = [];
          currentRegion.entities.forEach(ent => {
            if (ent.cleared) return;
            if (ent.type !== 'wild_encounter' && ent.type !== 'boss') return;
            if (revealedSet.has(`${ent.x},${ent.y}`)) {
              const sid = ent.encounterSpiritId || ent.bossSpiritId || ent.sprite.replace('wild_', '');
              if (sid && !sightedIds.includes(sid)) sightedIds.push(sid);
            }
          });
          if (sightedIds.length > 0) {
            onSightSpecies(sightedIds);
          }
        }
      }
    },
    [currentRegion.id, currentRegion.width, currentRegion.height, currentRegion.entities, onRevealTiles, onSightSpecies]
  );

  // Reveal around spawn whenever entering region
  useEffect(() => {
    revealAreaAround(initialSpawnPos.x, initialSpawnPos.y);
  }, [currentRegion.id, initialSpawnPos.x, initialSpawnPos.y, revealAreaAround]);

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
    pathQueueRef.current = [];
    tapMarkerRef.current = null;
    pendingInteractRef.current = null;
    posRef.current = { x: initialSpawnPos.x, y: initialSpawnPos.y };
    targetPosRef.current = { x: initialSpawnPos.x, y: initialSpawnPos.y };
    const companionY = Math.max(1, initialSpawnPos.y - 1);
    companionPosRef.current = { x: initialSpawnPos.x, y: companionY };
    companionTargetRef.current = { x: initialSpawnPos.x, y: companionY };
    const facing = initialSpawnPos.y <= 3 ? 'down' : initialSpawnPos.y >= 14 ? 'up' : 'down';
    dirRef.current = facing;
    setPlayerDir(facing);
    setPlayerGridPos({ x: initialSpawnPos.x, y: initialSpawnPos.y });
    revealAreaAround(initialSpawnPos.x, initialSpawnPos.y);
  }, [initialSpawnPos.x, initialSpawnPos.y, currentRegion.id, revealAreaAround]);

  const isTileBlocked = useCallback(
    (x: number, y: number): boolean => {
      if (x < 0 || x >= currentRegion.width || y < 0 || y >= currentRegion.height) return true;
      const tileType = currentRegion.tiles[y]?.[x];
      // Blocked terrain: 2 water, 3 mountain/wall, 4 tree, 5 lava, 8 building exterior
      // Walkable: 0 grass, 1 trail/bridge, 6 snow, 7 flowers, 9 amber, 10 indoor, 11 railway
      if (tileType === 2 || tileType === 3 || tileType === 4 || tileType === 5 || tileType === 8) return true;

      const obstacle = currentRegion.entities.find(
        e => e.x === x && e.y === y && !e.cleared && e.type === 'obstacle'
      );
      if (obstacle) return true;

      return false;
    },
    [currentRegion]
  );

  // BFS Shortest Path Finder
  const findBfsPath = useCallback(
    (startX: number, startY: number, goalX: number, goalY: number): { x: number; y: number }[] => {
      if (startX === goalX && startY === goalY) return [];
      if (isTileBlocked(goalX, goalY)) return [];

      const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
      const visited = new Set<string>([`${startX},${startY}`]);
      const parent = new Map<string, string>();
      const dirs = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];

      while (queue.length > 0) {
        const cur = queue.shift()!;
        if (cur.x === goalX && cur.y === goalY) {
          const path: { x: number; y: number }[] = [];
          let key = `${goalX},${goalY}`;
          const startKey = `${startX},${startY}`;
          while (key !== startKey) {
            const [px, py] = key.split(',').map(Number);
            path.unshift({ x: px, y: py });
            const pKey = parent.get(key);
            if (!pKey) break;
            key = pKey;
          }
          return path;
        }

        for (const d of dirs) {
          const nx = cur.x + d.dx;
          const ny = cur.y + d.dy;
          const nKey = `${nx},${ny}`;
          if (!visited.has(nKey) && !isTileBlocked(nx, ny)) {
            visited.add(nKey);
            parent.set(nKey, `${cur.x},${cur.y}`);
            queue.push({ x: nx, y: ny });
          }
        }
      }
      return [];
    },
    [isTileBlocked]
  );

  const interactWithEntity = useCallback(
    (entity: OverworldEntity, currentX: number, currentY: number) => {
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
              'El altar del Guardián Regional está sellado por runas elementales.',
              'Completa los pasos previos y la misión elemental de esta etapa para despertar su presencia.',
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
        if (obstacleSkillAnimRef.current) return;
        const reqEl = entity.elementRequired || 'tierra';
        const isActiveMatch =
          playerSpirit.currentHp > 0 &&
          (playerSpirit.primaryElement === reqEl || playerSpirit.secondaryElement === reqEl);

        if (isActiveMatch) {
          if (reqEl === 'fuego') sound.playFireSpell();
          else if (reqEl === 'agua' || reqEl === 'hielo') sound.playWaterSpell();
          else if (reqEl === 'planta') sound.playHeal();
          else if (reqEl === 'viento') sound.playWindSpell();
          else sound.playEarthSpell();
          const elLabel = ELEMENT_META[reqEl]?.label || reqEl.toUpperCase();
          const msg = `${playerSpirit.name} (Líder) canalizó ${elLabel}: ${
            entity.obstacleClearMessage || '¡Obstáculo superado!'
          }`;
          heldKeysRef.current.clear();
          pathQueueRef.current = [];
          pendingInteractRef.current = null;
          tapMarkerRef.current = null;
          obstacleSkillAnimRef.current = {
            entityId: entity.id,
            targetX: entity.x,
            targetY: entity.y,
            element: reqEl,
            startedAt: performance.now(),
            duration: 1050,
            msg,
          };
        } else {
          sound.playCancel();
          const elLabel = ELEMENT_META[reqEl]?.label || reqEl.toUpperCase();
          onTriggerDialogue(
            'Habilidad del Espíritu Activo',
            [
              entity.dialog?.[0] ||
                `Asigna un espíritu sano de tipo ${elLabel} como tu Espíritu Activo (Líder en Equipo) para despejar este paso.`,
              `Tu líder actual (${playerSpirit.name}) no cuenta con el elemento ${elLabel} disponible.`,
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
            portalEntity: entity,
          });
        } else {
          onTravelPortal(entity.destinationRegion, entity.destinationX, entity.destinationY, entity);
        }
      }
    },
    [
      currentRegion,
      hasCompletedStory,
      playerSpirit,
      onHealAtHome,
      onTriggerDialogue,
      onOpenChest,
      onTravelPortal,
    ]
  );

  const handleInteract = useCallback(() => {
    if (obstacleSkillAnimRef.current) return;
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
    interactWithEntity(entity, currentX, currentY);
  }, [syncCurrentPos, currentRegion.entities, interactWithEntity]);

  // Tap/Click on Map Canvas -> Convert screen click to tile & initiate BFS walk
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (obstacleSkillAnimRef.current) return;
    sound.init();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(1, rect.width);
    const scaleY = canvas.height / Math.max(1, rect.height);
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const width = canvas.width;
    const height = canvas.height;
    const stageZoom = getStageZoom(currentRegion.id, width);
    const pos = posRef.current;
    const cameraX = Math.round(pos.x * TILE_SIZE - width / 2 + TILE_SIZE / 2);
    const cameraY = Math.round(pos.y * TILE_SIZE - height / 2 + TILE_SIZE / 2);

    const worldX = (clickX - width / 2) / stageZoom + width / 2 + cameraX;
    const worldY = (clickY - height / 2) / stageZoom + height / 2 + cameraY;

    const tileX = Math.floor(worldX / TILE_SIZE);
    const tileY = Math.floor(worldY / TILE_SIZE);

    if (tileX < 0 || tileX >= currentRegion.width || tileY < 0 || tileY >= currentRegion.height) return;

    const startX = targetPosRef.current.x;
    const startY = targetPosRef.current.y;

    // Check if user tapped directly on an entity
    const tappedEntity = currentRegion.entities.find(
      ent => ent.x === tileX && ent.y === tileY && (!ent.cleared || ent.type === 'npc')
    );

    // If user tapped right where they stand and an interactable is there, trigger it
    if (tileX === startX && tileY === startY) {
      if (tappedEntity) {
        interactWithEntity(tappedEntity, startX, startY);
      }
      return;
    }

    // If tapped on a solid tile or entity, find adjacent walkable stand tile if tappedEntity exists
    if (tappedEntity && (isTileBlocked(tileX, tileY) || tappedEntity.type === 'npc' || tappedEntity.type === 'boss' || tappedEntity.type === 'chest' || tappedEntity.type === 'decorative' || tappedEntity.type === 'obstacle')) {
      const neighbors = [
        { x: tileX, y: tileY + 1, face: 'up' as const },
        { x: tileX, y: tileY - 1, face: 'down' as const },
        { x: tileX - 1, y: tileY, face: 'right' as const },
        { x: tileX + 1, y: tileY, face: 'left' as const },
      ];

      // Already standing adjacent? Face & interact immediately!
      const alreadyAdj = neighbors.find(n => n.x === startX && n.y === startY);
      if (alreadyAdj) {
        dirRef.current = alreadyAdj.face;
        setPlayerDir(alreadyAdj.face);
        pathQueueRef.current = [];
        pendingInteractRef.current = null;
        interactWithEntity(tappedEntity, startX, startY);
        return;
      }

      let bestPath: { x: number; y: number }[] | null = null;
      let bestFace: 'down' | 'up' | 'left' | 'right' = 'down';
      for (const n of neighbors) {
        if (isTileBlocked(n.x, n.y)) continue;
        const p = findBfsPath(startX, startY, n.x, n.y);
        if (p.length > 0 && (!bestPath || p.length < bestPath.length)) {
          bestPath = p;
          bestFace = n.face;
        }
      }

      if (bestPath && bestPath.length > 0) {
        heldKeysRef.current.clear();
        pathQueueRef.current = bestPath;
        pendingInteractRef.current = { entityId: tappedEntity.id, faceDir: bestFace };
        const dest = bestPath[bestPath.length - 1];
        tapMarkerRef.current = { x: dest.x, y: dest.y, startedAt: performance.now() };
      }
      return;
    }

    // Otherwise try walking straight to tapped walkable tile
    let goalX = tileX;
    let goalY = tileY;
    let path = findBfsPath(startX, startY, goalX, goalY);

    // If clicked a blocked border/wall tile with no entity, try closest walkable neighbor to make touch forgiving
    if (path.length === 0 && isTileBlocked(goalX, goalY)) {
      const candidates = [
        { x: tileX, y: tileY + 1 },
        { x: tileX, y: tileY - 1 },
        { x: tileX - 1, y: tileY },
        { x: tileX + 1, y: tileY },
      ];
      for (const c of candidates) {
        if (!isTileBlocked(c.x, c.y)) {
          const alt = findBfsPath(startX, startY, c.x, c.y);
          if (alt.length > 0 && (path.length === 0 || alt.length < path.length)) {
            path = alt;
            goalX = c.x;
            goalY = c.y;
          }
        }
      }
    }

    if (path.length > 0) {
      heldKeysRef.current.clear();
      pendingInteractRef.current = tappedEntity
        ? { entityId: tappedEntity.id, faceDir: dirRef.current }
        : null;
      pathQueueRef.current = path;
      tapMarkerRef.current = { x: goalX, y: goalY, startedAt: performance.now() };
    }
  };

  // Silent fallback keyboard listeners for accessibility (no UI hints)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        pathQueueRef.current = [];
        pendingInteractRef.current = null;
        heldKeysRef.current.add('up');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        pathQueueRef.current = [];
        pendingInteractRef.current = null;
        heldKeysRef.current.add('down');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        pathQueueRef.current = [];
        pendingInteractRef.current = null;
        heldKeysRef.current.add('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        pathQueueRef.current = [];
        pendingInteractRef.current = null;
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
      pathQueueRef.current = [];
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
    const MOVE_SPEED = 4.5;

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const activeSkillAnim = obstacleSkillAnimRef.current;
      if (activeSkillAnim) {
        isMovingRef.current = false;
        if (currentTime - activeSkillAnim.startedAt >= activeSkillAnim.duration) {
          obstacleSkillAnimRef.current = null;
          sound.playConfirm();
          onClearObstacle(activeSkillAnim.entityId, activeSkillAnim.msg);
        }
      }

      const pos = posRef.current;
      const target = targetPosRef.current;

      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!obstacleSkillAnimRef.current && dist > 0.001) {
        isMovingRef.current = true;
        const step = MOVE_SPEED * dt;
        if (dist <= step) {
          pos.x = target.x;
          pos.y = target.y;
          setPlayerGridPos({ x: target.x, y: target.y });
          onSyncPosition?.({ x: target.x, y: target.y });
          revealAreaAround(target.x, target.y);
          footstepDistRef.current += dist;

          // Auto step-over doorways for Hospital, Santuario, Tienda interiors + exit doors
          const stepPortal = currentRegion.entities.find(
            e =>
              e.type === 'portal' &&
              e.x === target.x &&
              e.y === target.y &&
              (e.id.startsWith('portal_hospital') ||
                e.id.startsWith('portal_santuario') ||
                e.id.startsWith('portal_tienda') ||
                e.id.startsWith('portal_exit_')) &&
              e.destinationRegion
          );
          if (stepPortal && stepPortal.destinationRegion) {
            heldKeysRef.current.clear();
            pathQueueRef.current = [];
            pendingInteractRef.current = null;
            tapMarkerRef.current = null;
            isMovingRef.current = false;
            sound.playConfirm();
            onTravelPortal(stepPortal.destinationRegion, stepPortal.destinationX, stepPortal.destinationY, stepPortal);
            return;
          }

          // Auto-trigger quick heal inside Hospital or Evolution UI inside Santuario altar
          const stepShrine = currentRegion.entities.find(
            e => e.type === 'shrine' && e.x === target.x && e.y === target.y
          );
          if (stepShrine) {
            if (stepShrine.isHospital && stepShrine.id === 'shrine_cura_hospital') {
              heldKeysRef.current.clear();
              pathQueueRef.current = [];
              pendingInteractRef.current = null;
              tapMarkerRef.current = null;
              isMovingRef.current = false;
              sound.playHeal();
              onHealAtHome?.();
              return;
            }
            if (stepShrine.isEvolutionSanctuary && stepShrine.id === 'shrine_altar_evolucion') {
              heldKeysRef.current.clear();
              pathQueueRef.current = [];
              pendingInteractRef.current = null;
              tapMarkerRef.current = null;
              isMovingRef.current = false;
              sound.playConfirm();
              onOpenEvolution?.();
              return;
            }
          }

          // Contact with roaming wild spirits
          const roamingSpirit = currentRegion.entities.find(e => {
            if (e.cleared) return false;
            if (e.type !== 'wild_encounter' && !e.sprite.startsWith('wild_')) return false;
            return Math.abs(e.x - target.x) <= 0.6 && Math.abs(e.y - target.y) <= 0.6;
          });
          if (roamingSpirit) {
            heldKeysRef.current.clear();
            pathQueueRef.current = [];
            pendingInteractRef.current = null;
            tapMarkerRef.current = null;
            isMovingRef.current = false;
            sound.playEncounter();
            const spiritBaseId =
              roamingSpirit.encounterSpiritId || roamingSpirit.sprite.replace('wild_', '').replace('pudu', 'puducito');
            onTriggerBattle(spiritBaseId, false, { x: target.x, y: target.y }, roamingSpirit.id);
            return;
          }

          // Encounter rates: 0% on path (tile 1), railway tracks (tile 11), or interior (tile 10); 2.5% (1%-3%) off-path (0,6,7,9)
          const arrivedTile = currentRegion.tiles[target.y]?.[target.x];
          if (
            currentRegion.wildEncounterTable.length > 0 &&
            arrivedTile !== 1 &&
            arrivedTile !== 10 &&
            arrivedTile !== 11
          ) {
            const encounterProb =
              arrivedTile === 0 || arrivedTile === 6 || arrivedTile === 7 || arrivedTile === 9 ? 0.025 : 0;
            if (encounterProb > 0 && Math.random() < encounterProb) {
              heldKeysRef.current.clear();
              pathQueueRef.current = [];
              pendingInteractRef.current = null;
              tapMarkerRef.current = null;
              isMovingRef.current = false;
              const chosen = pickWeightedEncounter(currentRegion.wildEncounterTable);
              sound.playEncounter();
              onTriggerBattle(chosen.spiritId, false, { x: target.x, y: target.y });
              return;
            }
          }

          // Arrived at end of tap BFS path? Trigger pending interaction if queued
          if (pathQueueRef.current.length === 0) {
            tapMarkerRef.current = null;
            if (pendingInteractRef.current) {
              const pending = pendingInteractRef.current;
              pendingInteractRef.current = null;
              dirRef.current = pending.faceDir;
              setPlayerDir(pending.faceDir);
              const ent = currentRegion.entities.find(
                e => e.id === pending.entityId && (!e.cleared || e.type === 'npc')
              );
              if (ent) {
                interactWithEntity(ent, target.x, target.y);
                return;
              }
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
      } else if (!obstacleSkillAnimRef.current) {
        pos.x = target.x;
        pos.y = target.y;
        let nextDx = 0;
        let nextDy = 0;
        let newDir: 'down' | 'up' | 'left' | 'right' | null = null;

        if (heldKeysRef.current.has('up')) {
          nextDy = -1;
          newDir = 'up';
        } else if (heldKeysRef.current.has('down')) {
          nextDy = 1;
          newDir = 'down';
        } else if (heldKeysRef.current.has('left')) {
          nextDx = -1;
          newDir = 'left';
        } else if (heldKeysRef.current.has('right')) {
          nextDx = 1;
          newDir = 'right';
        } else if (pathQueueRef.current.length > 0) {
          const nextStep = pathQueueRef.current.shift()!;
          nextDx = nextStep.x - target.x;
          nextDy = nextStep.y - target.y;
          if (nextDy < 0) newDir = 'up';
          else if (nextDy > 0) newDir = 'down';
          else if (nextDx < 0) newDir = 'left';
          else if (nextDx > 0) newDir = 'right';
        }

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
            pathQueueRef.current = [];
            tapMarkerRef.current = null;
            pendingInteractRef.current = null;
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

          ctx.fillStyle = isInteriorRegion(currentRegion.id) ? '#18181b' : '#09090b';
          ctx.fillRect(0, 0, width, height);

          const stageZoom = getStageZoom(currentRegion.id, width);
          const cameraX = Math.round(pos.x * TILE_SIZE - width / 2 + TILE_SIZE / 2);
          const cameraY = Math.round(pos.y * TILE_SIZE - height / 2 + TILE_SIZE / 2);

          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.scale(stageZoom, stageZoom);
          ctx.translate(-width / 2 - cameraX, -height / 2 - cameraY);

          const interior = isInteriorRegion(currentRegion.id);
          const fogSet = revealedSetRef.current;

          // Surrounding Chilean geography outside map bounds: Pacific Ocean (West) & Andes Cordillera (East)
          if (!interior) {
            const padX = 8;
            const padY = 6;
            for (let oy = -padY; oy < currentRegion.height + padY; oy++) {
              for (let ox = -padX; ox < currentRegion.width + padX; ox++) {
                if (ox >= 0 && ox < currentRegion.width && oy >= 0 && oy < currentRegion.height) continue;
                const px = ox * TILE_SIZE;
                const py = oy * TILE_SIZE;
                if (ox <= 0) {
                  // Pacific Ocean horizon to the West
                  ctx.fillStyle = '#0c4a6e';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  const wave = Math.sin(currentTime * 0.0035 + ox + oy) * 3;
                  ctx.fillStyle = '#38bdf8';
                  ctx.fillRect(px + 4, py + 10 + wave, 14, 2.5);
                  ctx.fillStyle = '#bae6fd';
                  ctx.fillRect(px + 14, py + 22 - wave, 12, 2);
                } else if (ox >= currentRegion.width - 1) {
                  // Andes Cordillera snow-capped mountain range to the East
                  ctx.fillStyle = '#334155';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#475569';
                  ctx.fillRect(px + 3, py + 4, TILE_SIZE - 6, TILE_SIZE - 6);
                  ctx.fillStyle = '#f8fafc';
                  ctx.beginPath();
                  ctx.moveTo(px + 16, py + 2);
                  ctx.lineTo(px + TILE_SIZE - 3, py + 17);
                  ctx.lineTo(px + 3, py + 17);
                  ctx.closePath();
                  ctx.fill();
                } else {
                  // North / South cliff fringe
                  ctx.fillStyle = '#1e293b';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#334155';
                  ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                }
              }
            }
          }

          for (let y = 0; y < currentRegion.height; y++) {
            for (let x = 0; x < currentRegion.width; x++) {
              const tile = currentRegion.tiles[y]?.[x] ?? 0;
              const px = x * TILE_SIZE;
              const py = y * TILE_SIZE;
              const tileKey = `${x},${y}`;
              const isRevealed = interior || fogSet.size === 0 || fogSet.has(tileKey);

              if (!isRevealed) {
                // Dark unexplored fog-of-war shroud
                ctx.fillStyle = '#09090b';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = 'rgba(39, 39, 42, 0.35)';
                ctx.fillRect(px + 6, py + 6, 4, 4);
                ctx.fillRect(px + 20, py + 20, 4, 4);
                continue;
              }

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
                  ctx.fillRect(px + 4, py + 5, 4, 4);
                  ctx.fillRect(px + 20, py + 18, 4, 4);
                  if ((x + y) % 4 === 0) {
                    ctx.fillStyle = '#bbf7d0';
                    ctx.fillRect(px + 14, py + 9, 2, 2);
                  }
                } else if (currentRegion.id === 'biobio') {
                  ctx.fillStyle = '#4d7c0f';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#3f6212';
                  ctx.fillRect(px + 5, py + 6, 5, 4);
                  ctx.fillRect(px + 19, py + 20, 4, 4);
                } else if (currentRegion.id === 'araucania') {
                  ctx.fillStyle = '#15803d';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#22c55e';
                  ctx.fillRect(px + 5, py + 6, 4, 4);
                  ctx.fillStyle = '#14532d';
                  ctx.fillRect(px + 18, py + 18, 5, 4);
                } else if (currentRegion.id === 'losrios') {
                  ctx.fillStyle = '#064e3b';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#047857';
                  ctx.fillRect(px + 4, py + 6, 5, 5);
                  ctx.fillStyle = '#a3e635';
                  if ((x + y) % 5 === 0) ctx.fillRect(px + 20, py + 18, 3, 2);
                } else {
                  ctx.fillStyle = '#475569';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#64748b';
                  ctx.fillRect(px + 3, py + 5, 9, 6);
                  ctx.fillStyle = '#334155';
                  ctx.fillRect(px + 17, py + 18, 9, 6);
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
                  // Santiago stone cobble avenue + bridge over Río Mapocho (row 11)
                  const isMapochoBridge = y === 11;
                  ctx.fillStyle = isMapochoBridge ? '#78350f' : '#cbd5e1';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = isMapochoBridge ? '#a16207' : '#e2e8f0';
                  ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                  ctx.fillStyle = isMapochoBridge ? '#451a03' : '#94a3b8';
                  ctx.fillRect(px + 15, py + 4, 2, 24);
                  ctx.fillRect(px + 4, py + 15, 24, 2);
                } else if (currentRegion.id === 'biobio') {
                  // Biobío stone & gravel path (distinct from railway tracks tile 11)
                  ctx.fillStyle = '#d6d3d1';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#a8a29e';
                  ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                  ctx.fillStyle = '#78716c';
                  ctx.fillRect(px + 10, py + 10, 4, 4);
                  ctx.fillRect(px + 18, py + 18, 4, 4);
                } else if (currentRegion.id === 'araucania') {
                  ctx.fillStyle = '#78716c';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#a8a29e';
                  ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                } else if (currentRegion.id === 'losrios') {
                  ctx.fillStyle = '#1e293b';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#78350f';
                  ctx.fillRect(px + 2, py + 3, TILE_SIZE - 4, 6);
                  ctx.fillRect(px + 2, py + 13, TILE_SIZE - 4, 6);
                  ctx.fillRect(px + 2, py + 23, TILE_SIZE - 4, 6);
                } else {
                  ctx.fillStyle = '#64748b';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#94a3b8';
                  ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                }
              } else if (tile === 11) {
                // Railway Tracks / Línea de Tren (Biobío) - 0% encounter
                ctx.fillStyle = '#44403c';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#57534e';
                ctx.fillRect(px, py + 3, TILE_SIZE, TILE_SIZE - 6);
                // Timber railway crossties
                ctx.fillStyle = '#78350f';
                ctx.fillRect(px + 3, py + 3, 5, TILE_SIZE - 6);
                ctx.fillRect(px + 13, py + 3, 5, TILE_SIZE - 6);
                ctx.fillRect(px + 23, py + 3, 5, TILE_SIZE - 6);
                // Metallic twin steel rails
                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(px, py + 8, TILE_SIZE, 3);
                ctx.fillRect(px, py + 21, TILE_SIZE, 3);
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(px, py + 10, TILE_SIZE, 1);
                ctx.fillRect(px, py + 23, TILE_SIZE, 1);
              } else if (tile === 2) {
                const waterBase =
                  currentRegion.id === 'santiago'
                    ? '#0ea5e9'
                    : currentRegion.id === 'biobio'
                    ? '#0284c7'
                    : currentRegion.id === 'losrios'
                    ? '#1e3a8a'
                    : '#0c4a6e';
                const waterRipple =
                  currentRegion.id === 'santiago'
                    ? '#bae6fd'
                    : currentRegion.id === 'biobio'
                    ? '#f8fafc'
                    : currentRegion.id === 'losrios'
                    ? '#38bdf8'
                    : '#7dd3fc';
                ctx.fillStyle = waterBase;
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = waterRipple;
                const wave = Math.sin(currentTime * 0.004 + x + y) * 3;
                if (currentRegion.id === 'biobio') {
                  const fall = (currentTime * 0.03 + x * 7) % TILE_SIZE;
                  ctx.fillRect(px + 5, py + fall * 0.4, 4, 10);
                  ctx.fillRect(px + 18, py + ((fall + 12) % 20), 5, 10);
                } else {
                  ctx.fillRect(px + 4, py + 10 + wave, 12, 2.5);
                  ctx.fillRect(px + 16, py + 20 - wave, 10, 2.5);
                }
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
                if (currentRegion.id === 'santiago' && y <= 1) {
                  ctx.fillStyle = '#f8fafc';
                  ctx.beginPath();
                  ctx.moveTo(px + 16, py + 2);
                  ctx.lineTo(px + TILE_SIZE - 3, py + 18);
                  ctx.lineTo(px + 3, py + 18);
                  ctx.closePath();
                  ctx.fill();
                } else if (currentRegion.id === 'loslagos') {
                  ctx.fillStyle = y <= 2 ? '#e0f2fe' : '#f8fafc';
                  ctx.fillRect(px + 4, py + 2, TILE_SIZE - 8, 8);
                  ctx.fillStyle = '#38bdf8';
                  ctx.fillRect(px + 8, py + 10, TILE_SIZE - 16, 3);
                } else if (currentRegion.id === 'losrios') {
                  ctx.fillStyle = '#047857';
                  ctx.fillRect(px + 4, py + 4, 10, 5);
                } else if (currentRegion.id === 'araucania') {
                  ctx.fillStyle = '#7c2d12';
                  ctx.fillRect(px + 6, py + 8, 12, 4);
                }
              } else if (tile === 4) {
                const treeSway = Math.sin(currentTime * 0.002 + x + y) * 1.4;
                if (currentRegion.id === 'araucania') {
                  ctx.fillStyle = '#14532d';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#78350f';
                  ctx.fillRect(px + 14, py + 14, 4, 16);
                  ctx.fillStyle = '#166534';
                  ctx.fillRect(px + 3 + treeSway, py + 4, TILE_SIZE - 6, 6);
                  ctx.fillStyle = '#15803d';
                  ctx.fillRect(px + 6 + treeSway * 0.7, py + 10, TILE_SIZE - 12, 5);
                  ctx.fillStyle = '#22c55e';
                  ctx.fillRect(px + 10 + treeSway * 0.4, py + 2, 12, 3);
                } else if (currentRegion.id === 'losrios') {
                  ctx.fillStyle = '#022c22';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#ea580c';
                  ctx.fillRect(px + 13, py + 18, 6, 12);
                  ctx.fillStyle = '#047857';
                  ctx.beginPath();
                  ctx.arc(px + 16 + treeSway, py + 12, 11, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#10b981';
                  ctx.fillRect(px + 10 + treeSway, py + 6, 6, 4);
                } else {
                  ctx.fillStyle = currentRegion.id === 'biobio' ? '#365314' : '#064e3b';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#451a03';
                  ctx.fillRect(px + 13, py + 20, 6, 10);
                  ctx.fillStyle =
                    currentRegion.id === 'santiago'
                      ? '#16a34a'
                      : currentRegion.id === 'biobio'
                      ? '#4d7c0f'
                      : '#14532d';
                  ctx.beginPath();
                  ctx.moveTo(px + TILE_SIZE / 2 + treeSway, py + 2);
                  ctx.lineTo(px + TILE_SIZE - 3, py + 20);
                  ctx.lineTo(px + 3, py + 20);
                  ctx.closePath();
                  ctx.fill();
                }
              } else if (tile === 5) {
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
                ctx.fillStyle = '#bae6fd';
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
                  ctx.fillStyle = '#15803d';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#e11d48';
                  ctx.beginPath();
                  ctx.arc(px + 10 + fSway, py + 11, 4.5, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#fde047';
                  ctx.beginPath();
                  ctx.arc(px + 21 - fSway, py + 20, 4, 0, Math.PI * 2);
                  ctx.fill();
                } else if (currentRegion.id === 'losrios') {
                  ctx.fillStyle = '#064e3b';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#16a34a';
                  ctx.beginPath();
                  ctx.arc(px + 12 + fSway, py + 15, 8, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#a3e635';
                  ctx.fillRect(px + 18 - fSway, py + 10, 4, 4);
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
                if (currentRegion.id === 'hospital') {
                  ctx.fillStyle = '#e2e8f0';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#0ea5e9';
                  ctx.fillRect(px, py + TILE_SIZE - 6, TILE_SIZE, 6);
                  ctx.fillStyle = '#cbd5e1';
                  ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, 12);
                } else if (currentRegion.id === 'santuario') {
                  ctx.fillStyle = '#064e3b';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#0f172a';
                  ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                  ctx.fillStyle = '#10b981';
                  ctx.fillRect(px + 12, py + 10, 8, 10);
                } else if (currentRegion.id === 'tienda') {
                  ctx.fillStyle = '#78350f';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#b45309';
                  ctx.fillRect(px + 2, py + 4, TILE_SIZE - 4, TILE_SIZE - 6);
                  ctx.fillStyle = '#facc15';
                  ctx.fillRect(px + 8, py + 10, TILE_SIZE - 16, 4);
                } else if (currentRegion.id === 'casa') {
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
                } else if (currentRegion.id === 'loslagos') {
                  const palafitoWalls = ['#dc2626', '#eab308', '#0284c7', '#16a34a'];
                  ctx.fillStyle = '#0c4a6e';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = '#78350f';
                  ctx.fillRect(px + 6, py + 23, 3, 9);
                  ctx.fillRect(px + 23, py + 23, 3, 9);
                  ctx.fillStyle = palafitoWalls[x % 4];
                  ctx.fillRect(px + 3, py + 11, TILE_SIZE - 6, 13);
                  ctx.fillStyle = '#334155';
                  ctx.beginPath();
                  ctx.moveTo(px + 16, py + 1);
                  ctx.lineTo(px + TILE_SIZE - 1, py + 12);
                  ctx.lineTo(px + 1, py + 12);
                  ctx.closePath();
                  ctx.fill();
                  ctx.fillStyle = '#fde047';
                  ctx.fillRect(px + 8, py + 15, 5, 5);
                  ctx.fillRect(px + 19, py + 15, 5, 5);
                } else {
                  const roofColor =
                    currentRegion.id === 'santiago'
                      ? '#c2410c'
                      : currentRegion.id === 'biobio'
                      ? '#991b1b'
                      : currentRegion.id === 'araucania'
                      ? '#9a3412'
                      : '#0f172a';
                  const wallColor =
                    currentRegion.id === 'santiago'
                      ? '#fef3c7'
                      : currentRegion.id === 'biobio'
                      ? '#fca5a5'
                      : currentRegion.id === 'araucania'
                      ? '#78350f'
                      : '#1e293b';
                  const winColor = currentRegion.id === 'losrios' ? '#fde047' : '#bae6fd';

                  ctx.fillStyle =
                    currentRegion.id === 'santiago'
                      ? '#4ade80'
                      : currentRegion.id === 'biobio'
                      ? '#4d7c0f'
                      : currentRegion.id === 'araucania'
                      ? '#15803d'
                      : '#334155';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
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
                if (currentRegion.id === 'hospital') {
                  ctx.fillStyle = (x + y) % 2 === 0 ? '#f8fafc' : '#e2e8f0';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = 'rgba(14, 165, 233, 0.14)';
                  ctx.fillRect(px, py, TILE_SIZE, 1);
                  if ((x === 5 && Math.abs(y - 4) <= 1) || (y === 4 && Math.abs(x - 5) <= 1)) {
                    ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
                    ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                  }
                } else if (currentRegion.id === 'santuario') {
                  ctx.fillStyle = (x + y) % 2 === 0 ? '#1e293b' : '#0f172a';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
                  ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
                  ctx.lineWidth = 1;
                  ctx.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                  if (Math.abs(x - 5) <= 1 && Math.abs(y - 4) <= 1) {
                    const aura = 0.18 + Math.sin(currentTime * 0.005) * 0.08;
                    ctx.fillStyle = `rgba(16, 185, 129, ${aura})`;
                    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                  }
                } else if (currentRegion.id === 'tienda') {
                  // Cozy wooden checkered store floorboards
                  ctx.fillStyle = (x + y) % 2 === 0 ? '#fef3c7' : '#fde68a';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = 'rgba(146, 64, 14, 0.16)';
                  ctx.fillRect(px, py + TILE_SIZE - 2, TILE_SIZE, 2);
                } else {
                  ctx.fillStyle = (x + y) % 2 === 0 ? '#e7e5e4' : '#d6d3d1';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = 'rgba(24, 24, 27, 0.14)';
                  ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, 2);
                  ctx.fillRect(px + 1, py + 1, 2, TILE_SIZE - 2);
                }
              }

              ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
              ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            }
          }

          // Pulsing tap-to-move destination marker
          if (tapMarkerRef.current) {
            const tm = tapMarkerRef.current;
            const pulse = 6 + Math.sin(currentTime * 0.012) * 3;
            ctx.save();
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(tm.x * TILE_SIZE + TILE_SIZE / 2, tm.y * TILE_SIZE + TILE_SIZE / 2, pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
            ctx.fill();
            ctx.restore();
          }

          const stageBossAwakened = isStageBossAwakened(currentRegion, hasCompletedStory);

          currentRegion.entities.forEach(ent => {
            const entKey = `${ent.x},${ent.y}`;
            const isEntVisible = interior || fogSet.size === 0 || fogSet.has(entKey);
            if (!isEntVisible) return;

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

          // Draw Active Companion Creature trailing behind hero
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

          if (nearbyEntity && !obstacleSkillAnimRef.current) {
            ctx.fillStyle = '#f4f4f5';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('!', pos.x * TILE_SIZE + TILE_SIZE / 2 - 3, pos.y * TILE_SIZE - 6);
          }

          // Active Spirit Elemental Obstacle Clearance VFX
          if (obstacleSkillAnimRef.current) {
            const anim = obstacleSkillAnimRef.current;
            const p = Math.min(1, Math.max(0, (currentTime - anim.startedAt) / anim.duration));
            const sx = compX + TILE_SIZE / 2;
            const sy = compY + TILE_SIZE / 2;
            const tx = anim.targetX * TILE_SIZE + TILE_SIZE / 2;
            const ty = anim.targetY * TILE_SIZE + TILE_SIZE / 2;

            const vfxColors: Record<ElementType, { outer: string; inner: string }> = {
              fuego: { outer: '#f97316', inner: '#fef08a' },
              agua: { outer: '#0ea5e9', inner: '#e0f2fe' },
              planta: { outer: '#22c55e', inner: '#dcfce7' },
              tierra: { outer: '#d97706', inner: '#fef3c7' },
              hielo: { outer: '#38bdf8', inner: '#f0f9ff' },
              viento: { outer: '#a3e635', inner: '#ecfccb' },
              sagrado: { outer: '#facc15', inner: '#fef9c3' },
              normal: { outer: '#a1a1aa', inner: '#f4f4f5' },
            };
            const palette = vfxColors[anim.element] || vfxColors.tierra;

            ctx.save();
            // Companion charge aura
            ctx.strokeStyle = palette.outer;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(sx, sy, 14 + Math.sin(p * Math.PI * 6) * 4, 0, Math.PI * 2);
            ctx.stroke();

            // Beam from active spirit to obstacle
            const beamProgress = Math.min(1, p * 1.45);
            const curBx = sx + (tx - sx) * beamProgress;
            const curBy = sy + (ty - sy) * beamProgress;

            ctx.lineCap = 'round';
            ctx.strokeStyle = palette.outer;
            ctx.lineWidth = 9 - p * 3;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(curBx, curBy);
            ctx.stroke();

            ctx.strokeStyle = palette.inner;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(curBx, curBy);
            ctx.stroke();

            // Impact ring & particles on obstacle
            if (p > 0.35) {
              const impactP = (p - 0.35) / 0.65;
              ctx.strokeStyle = palette.inner;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(tx, ty, 8 + impactP * 22, 0, Math.PI * 2);
              ctx.stroke();

              for (let k = 0; k < 8; k++) {
                const ang = (k / 8) * Math.PI * 2 + p * 4;
                const rad = impactP * 24;
                ctx.fillStyle = k % 2 === 0 ? palette.inner : palette.outer;
                ctx.fillRect(tx + Math.cos(ang) * rad - 2, ty + Math.sin(ang) * rad - 2, 5, 5);
              }
            }
            ctx.restore();
          }

          ctx.restore();

          // Regional ambient tint
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

      if (heroAvatarCanvasRef.current) {
        const hCtx = heroAvatarCanvasRef.current.getContext('2d');
        if (hCtx) {
          hCtx.clearRect(0, 0, 44, 44);
          hCtx.imageSmoothingEnabled = false;
          drawBarbaraSprite(hCtx, 4, 4, 36, 'down', currentTime * 0.003, false, barbara.gender || 'female');
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
    interactWithEntity,
    onClearObstacle,
    onTriggerBattle,
    onSyncPosition,
    revealAreaAround,
    currentQuest,
    hasCompletedStory,
    barbara.gender,
    nearbyEntity,
    playerSpirit.baseId,
    playerSpirit.currentStage,
    onHealAtHome,
    onOpenEvolution,
    onTravelPortal,
  ]);

  const currentTileType = currentRegion.tiles[playerGridPos.y]?.[playerGridPos.x] ?? 0;
  const encounterRateLabel =
    currentRegion.wildEncounterTable.length === 0
      ? 'Hogar · 0%'
      : currentTileType === 10
      ? 'Interior · 0%'
      : currentTileType === 11
      ? 'Vía Férrea · 0%'
      : currentTileType === 1
      ? 'Camino · 0%'
      : 'Fuera · 1%-3%';

  const getWeatherBadge = () => {
    const w = currentRegion.weather;
    if (w === 'soleado') return { icon: <Sun className="w-3 h-3 text-amber-300 shrink-0" />, text: currentRegion.weatherLabel || 'Soleado' };
    if (w === 'lluvia_intermitente') return { icon: <CloudFog className="w-3 h-3 text-zinc-200 shrink-0" />, text: currentRegion.weatherLabel || 'Niebla y Lluvia' };
    if (w === 'lluvia_suave') return { icon: <CloudRain className="w-3 h-3 text-sky-300 shrink-0" />, text: currentRegion.weatherLabel || 'Lluvia Fija' };
    if (w === 'lluvia_viento') return { icon: <Wind className="w-3 h-3 text-lime-300 shrink-0" />, text: currentRegion.weatherLabel || 'Lluvia y Viento' };
    if (w === 'ventisca_austral') return { icon: <CloudLightning className="w-3 h-3 text-cyan-300 shrink-0" />, text: currentRegion.weatherLabel || 'Tormenta Austral' };
    return { icon: <Home className="w-3 h-3 text-zinc-200 shrink-0" />, text: currentRegion.weatherLabel || 'Interior' };
  };
  const weatherBadge = getWeatherBadge();

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] bg-zinc-950 flex flex-col justify-between overflow-hidden select-none touch-manipulation"
    >
      {/* 60fps Canvas Viewport (Tap anywhere to walk) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={viewportSize.width}
          height={viewportSize.height}
          onPointerDown={handleCanvasPointerDown}
          className="w-full h-full image-render-pixel cursor-pointer"
        />
      </div>

      {/* Multi-Layer CSS Regional Atmospheric Climate & Particle Effects */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden" aria-hidden="true">
        {currentRegion.id === 'santiago' && (
          <>
            <div className="env-sunbeams-shimmer" />
            <div className="env-cloud-layer-1" />
            {POLLEN_PARTICLES.map((p, idx) => (
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
          </>
        )}

        {currentRegion.id === 'biobio' && (
          <>
            <div className="env-cloud-layer-1" />
            <div className="env-cloud-layer-2" />
            <div className="env-fog-layer-1" />
            <div className="env-fog-layer-2" />
            {INTERMITTENT_RAIN_DROPS.map((d, idx) => (
              <div
                key={idx}
                className="env-rain-drop-intermittent"
                style={
                  {
                    left: d.left,
                    '--dur': d.dur,
                    '--delay': d.delay,
                  } as React.CSSProperties
                }
              />
            ))}
          </>
        )}

        {currentRegion.id === 'araucania' && (
          <>
            <div className="env-cloud-layer-1" />
            <div className="env-cloud-layer-2" />
            {STATIC_RAIN_DROPS.map((d, idx) => (
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
          </>
        )}

        {currentRegion.id === 'losrios' && (
          <>
            <div className="env-cloud-layer-1" />
            <div className="env-cloud-layer-2" />
            {WIND_STREAKS.map((w, idx) => (
              <div
                key={`wr-${idx}`}
                className="env-wind-streak"
                style={
                  {
                    top: w.top,
                    width: w.width,
                    '--dur': w.dur,
                    '--delay': w.delay,
                  } as React.CSSProperties
                }
              />
            ))}
            {WIND_RAIN_DROPS.map((d, idx) => (
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
          </>
        )}

        {currentRegion.id === 'loslagos' && (
          <>
            <div className="env-cloud-layer-1" />
            <div className="env-cloud-layer-2" />
            {WIND_STREAKS.map((w, idx) => (
              <div
                key={`wl-${idx}`}
                className="env-wind-streak"
                style={
                  {
                    top: w.top,
                    width: w.width,
                    '--dur': w.dur,
                    '--delay': w.delay,
                  } as React.CSSProperties
                }
              />
            ))}
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
          {/* Region, Protagonist Avatar & Profile Shortcut */}
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
            <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-400 flex items-center justify-center shrink-0 overflow-hidden">
              <canvas
                ref={heroAvatarCanvasRef}
                width={44}
                height={44}
                className="w-full h-full object-contain image-render-pixel"
              />
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

        {/* Mission Pill + Clima + Encounter Probability Pill */}
        <div className="flex flex-wrap items-center justify-between gap-1">
          <button
            onClick={() => {
              sound.init();
              sound.playSelect();
              syncCurrentPos();
              onOpenSystemMenu();
            }}
            className="pointer-events-auto max-w-full sm:max-w-[54%] px-2.5 py-0.5 bg-zinc-950/90 backdrop-blur border border-zinc-500/70 rounded-full text-[9px] sm:text-[10px] font-mono text-zinc-200 shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Target className="w-3 h-3 text-zinc-100 shrink-0" />
            <span className="text-zinc-100 font-bold shrink-0">
              Paso {currentQuest.stepNumber}/{currentQuest.totalSteps}:
            </span>
            <span className="truncate">{currentQuest.shortText}</span>
          </button>

          <div className="flex items-center gap-1 pointer-events-auto">
            <div className="px-2 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-600 text-[9px] sm:text-[10px] font-mono text-zinc-100 flex items-center gap-1 shadow-md">
              {weatherBadge.icon}
              <span className="truncate max-w-[115px]">{weatherBadge.text}</span>
            </div>

            <div
              className={`px-2 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-mono shadow-md ${
                currentTileType === 1 || currentTileType === 10 || currentTileType === 11 || currentRegion.wildEncounterTable.length === 0
                  ? 'bg-zinc-900/90 border-zinc-600 text-zinc-200'
                  : 'bg-zinc-200 border-zinc-400 text-zinc-950 font-bold'
              }`}
              title="Caminos/Vía Férrea/Interior: 0% · Fuera de camino: 1%-3%"
            >
              Enc: {encounterRateLabel}
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Left Active Spirit + ACCIÓN + Unified Important Message Panel on Right */}
      <footer className="relative z-20 w-full p-2 sm:p-4 flex items-end gap-2 sm:gap-3 max-w-5xl mx-auto pointer-events-none">
        {/* Bottom-Left: Active Spirit Card & ACCIÓN Button */}
        <div className="pointer-events-auto flex flex-col items-start gap-1.5 shrink-0">
          <div className="bg-zinc-900/95 backdrop-blur border border-zinc-600 p-1.5 sm:p-2 rounded-xl shadow-lg flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-zinc-950 border border-zinc-400/70 shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
              <canvas
                ref={activeAvatarCanvasRef}
                width={48}
                height={48}
                className="w-full h-full object-contain image-render-pixel"
              />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-pixel text-[9px] text-zinc-100 truncate max-w-[78px] sm:max-w-[100px]">
                  {playerSpirit.name}
                </span>
                <span className="font-mono text-[9px] text-zinc-300 font-bold">Nv.{playerSpirit.level}</span>
              </div>
              <div className="w-16 sm:w-20 h-1.5 bg-zinc-950 rounded-full overflow-hidden mt-1 border border-zinc-800">
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

        {/* Right Side of ACCIÓN: Unified Important Message Slot */}
        <div className="flex-1 min-w-0 flex items-end pb-1">
          {(importantMessage || interactPrompt) && (
            importantMessage ? (
              <div className="w-full max-w-md bg-zinc-900/95 border-2 border-zinc-300 text-zinc-100 rounded-2xl px-3 py-2.5 shadow-2xl font-mono text-[10px] sm:text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <span className="w-2 h-2 rounded-full bg-zinc-100 shrink-0" />
                <span className="leading-snug">{importantMessage}</span>
              </div>
            ) : (
              <button
                onClick={handleInteract}
                className="pointer-events-auto w-full max-w-md bg-zinc-900/95 hover:bg-zinc-800 border-2 border-zinc-300 text-zinc-100 rounded-2xl px-3 py-2.5 shadow-2xl font-mono text-[10px] sm:text-xs flex items-center gap-2 cursor-pointer active:scale-98 transition-transform text-left animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                <span className="w-2 h-2 rounded-full bg-zinc-100 animate-ping shrink-0" />
                <span className="leading-snug truncate">{interactPrompt}</span>
              </button>
            )
          )}
        </div>
      </footer>
    </div>
  );
};
