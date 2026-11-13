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
import {
  MapRegion,
  SpiritCreature,
  BarbaraHero,
  OverworldEntity,
  RegionId,
  ElementType,
  getEntityFootprintTiles,
  getHeroUnlockedElements,
} from '../types/game';
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
  X,
  HelpCircle,
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
  onDismissImportantMessage?: () => void;
  onRevealTiles?: (regionId: RegionId, newCoords: string[]) => void;
  onRevealRegionMap?: (regionId: RegionId) => void;
  onCollectPickup?: (entityId: string, healHpPercent?: number, healMpPercent?: number, label?: string) => void;
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
  onOpenGuide?: () => void;
  onTriggerDialogue: (speaker: string, lines: string[], afterAction?: PostDialogueAction, portraitSprite?: string) => void;
  onTriggerBattle: (
    enemySpiritId: string,
    isBoss: boolean,
    atPos?: { x: number; y: number },
    entityId?: string,
    overrideLevel?: number,
    overrideStage?: number
  ) => void;
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

function getSpeciesMovementOffset(
  ent: OverworldEntity,
  currentTime: number,
  tileSize: number
): { dx: number; dy: number; flip: boolean } {
  const hash = ent.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const t = currentTime * 0.001 + hash * 0.37;
  const species = (ent.encounterSpiritId || ent.sprite.replace('wild_', '')).toLowerCase();

  // Ciervos / Pudú: saltos ágiles en arco con trote breve
  if (species === 'puducito' || species === 'pudu' || species === 'culpeo') {
    const vx = Math.cos(t * 1.55);
    const hopCycle = Math.max(0, Math.sin(t * 4.2));
    return {
      dx: Math.sin(t * 1.55) * tileSize * 0.55,
      dy: -hopCycle * 7,
      flip: vx < 0,
    };
  }
  // Aves (Loica, Torcaza, Chucao, Hualita, Cóndor): planeo circular / ovalado con elevación de vuelo
  if (species === 'loica' || species === 'torcaza' || species === 'chucao' || species === 'hualita' || species === 'condor') {
    const speed = species === 'condor' ? 1.15 : 1.9;
    const radius = species === 'condor' ? tileSize * 1.05 : tileSize * 0.78;
    const vx = Math.cos(t * speed);
    return {
      dx: Math.sin(t * speed) * radius,
      dy: Math.sin(t * speed * 2) * tileSize * 0.35 - 5,
      flip: vx < 0,
    };
  }
  // Ranita de Darwin: saltos discretos con pausas entre brincos
  if (species === 'ranita') {
    const hopPhase = t * 2.1;
    const jump = Math.max(0, Math.sin(hopPhase));
    const vx = Math.cos(t * 0.9);
    return {
      dx: Math.sin(t * 0.9) * tileSize * 0.42,
      dy: -Math.pow(jump, 1.4) * 9,
      flip: vx < 0,
    };
  }
  // Dinosaurios grandes y Jabalí: paso lento y pesado con pisada firme
  if (species === 'cuellilargo' || species === 'trex' || species === 'jabali') {
    const vx = Math.cos(t * 0.7);
    return {
      dx: Math.sin(t * 0.7) * tileSize * 0.52,
      dy: Math.abs(Math.sin(t * 2.2)) * 2.5,
      flip: vx < 0,
    };
  }
  // Pingüino: bamboleo simpático en la orilla / nieve
  if (species === 'pinguino') {
    const vx = Math.cos(t * 2.1);
    return {
      dx: Math.sin(t * 2.1) * tileSize * 0.48,
      dy: Math.abs(Math.sin(t * 5.2)) * 3.5,
      flip: vx < 0,
    };
  }
  // Objetos / Hongos / Huevos / Flores: vibración o balanceo en su punto
  if (species === 'hongo' || species === 'huevo_dino' || species === 'copihue') {
    return {
      dx: Math.sin(t * 1.4) * 2.5,
      dy: Math.sin(t * 3.2) * 3.2,
      flip: false,
    };
  }
  // Perros (Quiltro) & Felinos (Gato Güiña) & Velociraptor: trote ágil exploratorio
  if (species === 'quiltro' || species === 'gato_chileno' || species === 'velociraptor') {
    const spd = species === 'gato_chileno' ? 2.65 : 2.35;
    const vx = Math.cos(t * spd);
    return {
      dx: Math.sin(t * spd) * tileSize * 0.72,
      dy: Math.cos(t * 1.8) * tileSize * 0.36 - Math.abs(Math.sin(t * 5)) * 2,
      flip: vx < 0,
    };
  }
  // Espíritu volcánico flotante
  if (species === 'pillancito' || species === 'ventisquero') {
    const vx = Math.cos(t * 2.7);
    return {
      dx: Math.sin(t * 2.7) * tileSize * 0.58,
      dy: Math.cos(t * 3.4) * tileSize * 0.45 - 4,
      flip: vx < 0,
    };
  }
  // Pez Puye Cristal: nado sinuoso lateral en las orillas
  if (species === 'puye') {
    const vx = Math.cos(t * 2.4);
    return {
      dx: Math.sin(t * 2.4) * tileSize * 0.65,
      dy: Math.sin(t * 5.2) * 3.5,
      flip: vx < 0,
    };
  }
  const vx = -Math.sin(t * 1.2);
  return {
    dx: Math.cos(t * 1.2) * tileSize * 0.58,
    dy: Math.sin(t * 1.2) * tileSize * 0.34,
    flip: vx < 0,
  };
}

function isInteriorRegion(id: RegionId): boolean {
  return id === 'casa' || id === 'hospital' || id === 'santuario' || id === 'tienda';
}

type Building2x2Kind = 'hospital' | 'santuario' | 'tienda' | 'casa_propia' | 'generic_2x2';

function classify2x2Building(region: MapRegion, tlX: number, tlY: number): Building2x2Kind {
  const nearbyPortal = region.entities.find(
    e =>
      e.type === 'portal' &&
      e.x >= tlX - 1 &&
      e.x <= tlX + 2 &&
      e.y >= tlY &&
      e.y <= tlY + 3
  );
  if (nearbyPortal?.id.startsWith('portal_hospital')) return 'hospital';
  if (nearbyPortal?.id.startsWith('portal_santuario')) return 'santuario';
  if (nearbyPortal?.id.startsWith('portal_tienda')) return 'tienda';
  if (nearbyPortal?.id.startsWith('portal_casa_propia')) return 'casa_propia';
  return 'generic_2x2';
}

function draw2x2ExteriorBuilding(
  ctx: CanvasRenderingContext2D,
  kind: Building2x2Kind,
  px: number,
  py: number,
  tileSize: number,
  currentTime: number
) {
  const w = tileSize * 2;
  const h = tileSize * 2;

  if (kind === 'hospital') {
    // Ground shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(px + 2, py + h - 5, w - 4, 6);
    // Crisp white clinic walls
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(px + 4, py + 24, w - 8, h - 26);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(px + 4, py + 24, w - 8, 5);
    // Cyan medical trim stripe
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(px + 4, py + 38, w - 8, 4);
    // Sloped clinic roof
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(px + w / 2, py + 2);
    ctx.lineTo(px + w - 1, py + 25);
    ctx.lineTo(px + 1, py + 25);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(px + 6, py + 23, w - 12, 3);
    // Red Medical Cross sign on roof
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px + w / 2 - 8, py + 9, 16, 13);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(px + w / 2 - 2, py + 11, 4, 9);
    ctx.fillRect(px + w / 2 - 5, py + 13.5, 10, 4);
    // Glass automatic door + windows
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(px + w / 2 - 7, py + 45, 14, h - 47);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(px + w / 2 - 5, py + 47, 4, 12);
    ctx.fillRect(px + w / 2 + 1, py + 47, 4, 12);
    ctx.fillRect(px + 9, py + 29, 10, 7);
    ctx.fillRect(px + w - 19, py + 29, 10, 7);
  } else if (kind === 'santuario') {
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.fillRect(px + 2, py + h - 5, w - 4, 6);
    // Basalt sanctuary stone walls + mossy pillars
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(px + 5, py + 23, w - 10, h - 25);
    ctx.fillStyle = '#334155';
    ctx.fillRect(px + 7, py + 25, 8, h - 28);
    ctx.fillRect(px + w - 15, py + 25, 8, h - 28);
    // Golden & emerald temple roof
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.moveTo(px + w / 2, py + 2);
    ctx.lineTo(px + w - 1, py + 25);
    ctx.lineTo(px + 1, py + 25);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(px + 4, py + 23, w - 8, 3);
    // Pulsing emerald crystal centerpiece
    const glow = 0.65 + Math.sin(currentTime * 0.005) * 0.35;
    ctx.fillStyle = `rgba(16, 185, 129, ${glow})`;
    ctx.beginPath();
    ctx.arc(px + w / 2, py + 15, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a7f3d0';
    ctx.fillRect(px + w / 2 - 2, py + 13, 4, 4);
    // Sanctuary arched portal
    ctx.fillStyle = '#022c22';
    ctx.fillRect(px + w / 2 - 7, py + 42, 14, h - 44);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(px + w / 2 - 5, py + 44, 10, h - 47);
  } else if (kind === 'tienda') {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(px + 2, py + h - 5, w - 4, 6);
    // Warm timber walls
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(px + 4, py + 24, w - 8, h - 26);
    // Wood roof
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(px + w / 2, py + 3);
    ctx.lineTo(px + w - 1, py + 23);
    ctx.lineTo(px + 1, py + 23);
    ctx.closePath();
    ctx.fill();
    // Classic red & cream striped awning
    for (let s = 0; s < 7; s++) {
      ctx.fillStyle = s % 2 === 0 ? '#dc2626' : '#fef2f2';
      ctx.fillRect(px + 4 + s * 8, py + 23, 8, 9);
    }
    // Shop sign & windows + door
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + w / 2 - 14, py + 12, 28, 9);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(px + w / 2 - 12, py + 14, 24, 5);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(px + w / 2 - 6, py + 44, 12, h - 46);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(px + 9, py + 36, 12, 10);
    ctx.fillRect(px + w - 21, py + 36, 12, 10);
  } else if (kind === 'casa_propia') {
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.fillRect(px + 2, py + h - 5, w - 4, 6);
    // Chimney + gentle animated hearth smoke
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + w - 18, py + 2, 8, 16);
    const puff = Math.sin(currentTime * 0.004) * 2;
    ctx.fillStyle = 'rgba(244,244,245,0.65)';
    ctx.beginPath();
    ctx.arc(px + w - 14 + puff, py - 2, 3.5, 0, Math.PI * 2);
    ctx.arc(px + w - 10 - puff, py - 7, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Cozy cream stucco family house
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(px + 5, py + 25, w - 10, h - 27);
    // Warm terracotta gable roof
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.moveTo(px + w / 2, py + 3);
    ctx.lineTo(px + w - 1, py + 27);
    ctx.lineTo(px + 1, py + 27);
    ctx.closePath();
    ctx.fill();
    // Wooden door + glowing warm windows + flower boxes
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + w / 2 - 6, py + 44, 12, h - 46);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(px + 10, py + 34, 11, 10);
    ctx.fillRect(px + w - 21, py + 34, 11, 10);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(px + 9, py + 44, 13, 3);
    ctx.fillRect(px + w - 22, py + 44, 13, 3);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(px + 11, py + 43, 3, 2);
    ctx.fillRect(px + w - 18, py + 43, 3, 2);
  } else {
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(px + 5, py + 24, w - 10, h - 26);
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.moveTo(px + w / 2, py + 4);
    ctx.lineTo(px + w - 1, py + 26);
    ctx.lineTo(px + 1, py + 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(px + w / 2 - 6, py + 44, 12, h - 46);
  }
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
  partySpirits,
  barbara,
  isMuted,
  hasCompletedStory = false,
  initialSpawnPos = { x: 5, y: 6 },
  revealedTiles,
  importantMessage,
  onDismissImportantMessage,
  onRevealTiles,
  onRevealRegionMap,
  onCollectPickup,
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
  onOpenGuide,
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

  // Smooth climate cross-fade state when changing regions
  const prevWeatherRegionRef = useRef<RegionId>(currentRegion.id);
  const [fadingOutRegionId, setFadingOutRegionId] = useState<RegionId | null>(null);
  const [climateFadeActive, setClimateFadeActive] = useState(false);

  useEffect(() => {
    if (prevWeatherRegionRef.current !== currentRegion.id) {
      const oldId = prevWeatherRegionRef.current;
      prevWeatherRegionRef.current = currentRegion.id;
      setFadingOutRegionId(oldId);
      setClimateFadeActive(false);
      const raf = requestAnimationFrame(() => setClimateFadeActive(true));
      const timer = setTimeout(() => {
        setFadingOutRegionId(null);
        setClimateFadeActive(false);
      }, 720);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [currentRegion.id]);

  const currentQuest = getCurrentQuest(currentRegion, unlockedRegions, partySpirits, barbara.medals);

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

  // Active-Spirit / Hero Medal Obstacle Clearance Animation State
  const obstacleSkillAnimRef = useRef<{
    entityId: string;
    targetX: number;
    targetY: number;
    element: ElementType;
    startedAt: number;
    duration: number;
    msg: string;
  } | null>(null);

  // Summit Light-Wave Burst Animation when clearing regional Fog of War
  const summitRevealAnimRef = useRef<{
    x: number;
    y: number;
    startedAt: number;
    duration: number;
  } | null>(null);

  // Patrol coordinates ref for NPCs with looping patrolPath routes
  const patrolStateRef = useRef<Record<string, { x: number; y: number; segIdx: number; prog: number }>>({});

  useEffect(() => {
    const nextPatrols: Record<string, { x: number; y: number; segIdx: number; prog: number }> = {};
    currentRegion.entities.forEach(ent => {
      if (ent.patrolPath && ent.patrolPath.length > 1) {
        nextPatrols[ent.id] = {
          x: ent.patrolPath[0].x,
          y: ent.patrolPath[0].y,
          segIdx: 0,
          prog: 0,
        };
      }
    });
    patrolStateRef.current = nextPatrols;
  }, [currentRegion.id]);

  const getEntityLiveCoords = useCallback((ent: OverworldEntity): { x: number; y: number } => {
    const live = patrolStateRef.current[ent.id];
    return live ? { x: live.x, y: live.y } : { x: ent.x, y: ent.y };
  }, []);

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
            if (ent.cleared || (ent.requiresStoryCleared && !hasCompletedStory)) return;
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
    [currentRegion.id, currentRegion.width, currentRegion.height, currentRegion.entities, hasCompletedStory, onRevealTiles, onSightSpecies]
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
        e => e.x === x && e.y === y && !e.cleared && (!e.requiresStoryCleared || hasCompletedStory) && e.type === 'obstacle'
      );
      if (obstacle) return true;

      return false;
    },
    [currentRegion, hasCompletedStory]
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
        if (entity.healHpPercent || entity.healMpPercent) {
          sound.playHeal();
          onCollectPickup?.(entity.id, entity.healHpPercent, entity.healMpPercent, entity.name);
        } else {
          sound.playChestOpen();
          onOpenChest(entity.id, entity.rewardItem, entity.rewardGold);
          if (entity.dialog) {
            onTriggerDialogue(entity.name, entity.dialog);
          }
        }
      } else if (entity.type === 'wild_encounter') {
        sound.playEncounter();
        const spiritId = entity.encounterSpiritId || entity.sprite.replace('wild_', '').replace('pudu', 'puducito');
        onTriggerDialogue(
          'Criatura Espiritual Silvestre',
          [`¡Una ${entity.name} salvaje te desafía!`],
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
              'Completa los pasos previos (incluyendo el cerro/volcán y la barrera elemental) para despertar su presencia.',
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
        if (entity.revealsRegionMap) {
          sound.playSummitReveal();
          summitRevealAnimRef.current = {
            x: entity.x,
            y: entity.y,
            startedAt: performance.now(),
            duration: 1500,
          };
          onRevealRegionMap?.(currentRegion.id);
        } else {
          sound.playAnimalSound(entity.sprite || entity.name);
        }
        if (entity.dialog) {
          onTriggerDialogue(entity.name, entity.dialog, undefined, entity.sprite);
        }
      } else if (entity.type === 'obstacle') {
        if (obstacleSkillAnimRef.current) return;
        const reqEl = entity.elementRequired || 'tierra';
        const isCompanionMatch =
          playerSpirit.currentHp > 0 &&
          (playerSpirit.primaryElement === reqEl || playerSpirit.secondaryElement === reqEl);
        const heroUnlocked = getHeroUnlockedElements(barbara.medals);
        const isHeroSkillMatch = heroUnlocked.includes(reqEl);

        if (isCompanionMatch || isHeroSkillMatch) {
          if (reqEl === 'fuego') sound.playFireSpell();
          else if (reqEl === 'agua' || reqEl === 'hielo') sound.playWaterSpell();
          else if (reqEl === 'planta') sound.playHeal();
          else if (reqEl === 'viento') sound.playWindSpell();
          else sound.playEarthSpell();
          const elLabel = ELEMENT_META[reqEl]?.label || reqEl.toUpperCase();
          const actorLabel = isCompanionMatch
            ? `${playerSpirit.name} (Compañero Espiritual)`
            : `${barbara.name} (Habilidad de Amuleto)`;
          const msg = `${actorLabel} canalizó ${elLabel}: ${
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
            duration: 1150,
            msg,
          };
        } else {
          sound.playCancel();
          const elLabel = ELEMENT_META[reqEl]?.label || reqEl.toUpperCase();
          const matchingAlly = partySpirits?.find(
            s => s.currentHp > 0 && (s.primaryElement === reqEl || s.secondaryElement === reqEl)
          );
          onTriggerDialogue(
            `Barrera Elemental (${elLabel})`,
            [
              entity.dialog?.[0] ||
                `Necesitas una Criatura Espiritual de tipo ${elLabel} como Compañero Espiritual (o el Amuleto regional correspondiente) para despejar este paso.`,
              matchingAlly
                ? `Pasos para despejar: 1) Abre Equipo arriba. 2) Elige a ${matchingAlly.name} (${elLabel}). 3) Presiona "Hacer Compañero". 4) Toca de nuevo esta barrera.`
                : `Pasos para despejar: 1) Captura una Criatura Espiritual de tipo ${elLabel} en esta zona. 2) Abre Equipo arriba y selecciónala. 3) Presiona "Hacer Compañero". 4) Toca esta barrera.`,
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
      barbara.name,
      barbara.medals,
      playerSpirit,
      partySpirits,
      onHealAtHome,
      onCollectPickup,
      onRevealRegionMap,
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

    const entity = currentRegion.entities.find(e => {
      if (e.cleared && e.type !== 'npc') return false;
      if (e.requiresStoryCleared && !hasCompletedStory) return false;
      const live = getEntityLiveCoords(e);
      if (e.patrolPath) {
        const ex = Math.round(live.x);
        const ey = Math.round(live.y);
        return (ex === targetX && ey === targetY) || (ex === currentX && ey === currentY);
      }
      const footprint = getEntityFootprintTiles(e);
      return footprint.some(ft => (ft.x === targetX && ft.y === targetY) || (ft.x === currentX && ft.y === currentY));
    });

    if (!entity) return;
    interactWithEntity(entity, currentX, currentY);
  }, [syncCurrentPos, currentRegion.entities, hasCompletedStory, getEntityLiveCoords, interactWithEntity]);

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

    // Check if user tapped directly on an entity or any tile in its multi-tile footprint
    const tappedEntity = currentRegion.entities.find(ent => {
      if (ent.cleared && ent.type !== 'npc') return false;
      if (ent.requiresStoryCleared && !hasCompletedStory) return false;
      const live = getEntityLiveCoords(ent);
      if (ent.patrolPath) {
        const lx = Math.round(live.x);
        const ly = Math.round(live.y);
        return (lx === tileX && ly === tileY) || (Math.abs(live.x - tileX) <= 0.65 && Math.abs(live.y - tileY) <= 0.65);
      }
      const footprint = getEntityFootprintTiles(ent);
      return footprint.some(ft => ft.x === tileX && ft.y === tileY);
    });

    const tappedLive = tappedEntity ? getEntityLiveCoords(tappedEntity) : null;
    const entityTileX = tappedLive ? Math.round(tappedLive.x) : tileX;
    const entityTileY = tappedLive ? Math.round(tappedLive.y) : tileY;

    // If user tapped right where they stand and an interactable is there, trigger it
    if (tileX === startX && tileY === startY) {
      if (tappedEntity) {
        interactWithEntity(tappedEntity, startX, startY);
      }
      return;
    }

    // If tapped on a solid tile or entity, find adjacent walkable stand tile across entity's footprint
    if (
      tappedEntity &&
      (isTileBlocked(entityTileX, entityTileY) ||
        tappedEntity.type === 'npc' ||
        tappedEntity.type === 'boss' ||
        tappedEntity.type === 'chest' ||
        tappedEntity.type === 'decorative' ||
        tappedEntity.type === 'obstacle')
    ) {
      const targetFootprint = tappedEntity.patrolPath
        ? [{ x: entityTileX, y: entityTileY }]
        : getEntityFootprintTiles(tappedEntity);

      const neighbors: { x: number; y: number; face: 'down' | 'up' | 'left' | 'right' }[] = [];
      targetFootprint.forEach(ft => {
        neighbors.push(
          { x: ft.x, y: ft.y + 1, face: 'up' },
          { x: ft.x, y: ft.y - 1, face: 'down' },
          { x: ft.x - 1, y: ft.y, face: 'right' },
          { x: ft.x + 1, y: ft.y, face: 'left' }
        );
      });

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

    const entity = currentRegion.entities.find(e => {
      if (e.cleared && e.type !== 'npc') return false;
      if (e.requiresStoryCleared && !hasCompletedStory) return false;
      const live = getEntityLiveCoords(e);
      if (e.patrolPath) {
        const ex = Math.round(live.x);
        const ey = Math.round(live.y);
        return (ex === targetX && ey === targetY) || (ex === currentX && ey === currentY);
      }
      const footprint = getEntityFootprintTiles(e);
      return footprint.some(ft => (ft.x === targetX && ft.y === targetY) || (ft.x === currentX && ft.y === currentY));
    });

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
  }, [playerGridPos, playerDir, currentRegion, hasCompletedStory, getEntityLiveCoords]);

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
          sound.playLevelUp();
          onClearObstacle(activeSkillAnim.entityId, activeSkillAnim.msg);
        }
      }

      const pos = posRef.current;
      // Advance looping patrol NPCs (pauses gently if hero is right next to them)
      currentRegion.entities.forEach(ent => {
        if (!ent.patrolPath || ent.patrolPath.length < 2) return;
        const pState = patrolStateRef.current[ent.id];
        if (!pState) return;
        if (Math.hypot(pState.x - pos.x, pState.y - pos.y) <= 1.25) return;

        const fromPt = ent.patrolPath[pState.segIdx];
        const nextSegIdx = (pState.segIdx + 1) % ent.patrolPath.length;
        const toPt = ent.patrolPath[nextSegIdx];
        const segLen = Math.max(0.5, Math.hypot(toPt.x - fromPt.x, toPt.y - fromPt.y));
        pState.prog += (1.35 * dt) / segLen;
        if (pState.prog >= 1) {
          pState.prog = 0;
          pState.segIdx = nextSegIdx;
          pState.x = toPt.x;
          pState.y = toPt.y;
        } else {
          pState.x = fromPt.x + (toPt.x - fromPt.x) * pState.prog;
          pState.y = fromPt.y + (toPt.y - fromPt.y) * pState.prog;
        }
      });
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

          // Step-over HP & Mana pickups on map
          const stepPickup = currentRegion.entities.find(
            e =>
              !e.cleared &&
              e.x === target.x &&
              e.y === target.y &&
              (e.healHpPercent || e.healMpPercent)
          );
          if (stepPickup) {
            sound.playHeal();
            onCollectPickup?.(stepPickup.id, stepPickup.healHpPercent, stepPickup.healMpPercent, stepPickup.name);
          }

          // Contact with roaming wild spirits
          const roamingSpirit = currentRegion.entities.find(e => {
            if (e.cleared) return false;
            if (e.requiresStoryCleared && !hasCompletedStory) return false;
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

          // Encounter rates: 0% on path (tile 1), railway tracks (tile 11), or interior (tile 10);
          // 6%-12% (9% step roll) in Santiago/Biobío/Araucanía; 8%-16% (12% step roll) in Los Ríos/Los Lagos
          const arrivedTile = currentRegion.tiles[target.y]?.[target.x];
          if (
            currentRegion.wildEncounterTable.length > 0 &&
            arrivedTile !== 1 &&
            arrivedTile !== 10 &&
            arrivedTile !== 11
          ) {
            const baseOffPathRate =
              currentRegion.id === 'losrios' || currentRegion.id === 'loslagos' ? 0.12 : 0.09;
            const encounterProb =
              arrivedTile === 0 || arrivedTile === 6 || arrivedTile === 7 || arrivedTile === 9 ? baseOffPathRate : 0;
            if (encounterProb > 0 && Math.random() < encounterProb) {
              heldKeysRef.current.clear();
              pathQueueRef.current = [];
              pendingInteractRef.current = null;
              tapMarkerRef.current = null;
              isMovingRef.current = false;
              const chosen = pickWeightedEncounter(currentRegion.wildEncounterTable);
              const lvl =
                chosen.minLevel +
                Math.floor(Math.random() * Math.max(1, chosen.maxLevel - chosen.minLevel + 1));
              sound.playEncounter();
              onTriggerBattle(
                chosen.spiritId,
                false,
                { x: target.x, y: target.y },
                undefined,
                lvl,
                chosen.stage || 1
              );
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

          // Track 2x2 building blocks on outdoor maps so they draw as unified 64x64 structures
          const building2x2Map = new Set<string>();
          const buildingsToDraw: { x: number; y: number; kind: Building2x2Kind }[] = [];
          if (!interior) {
            for (let by = 0; by < currentRegion.height - 1; by++) {
              for (let bx = 0; bx < currentRegion.width - 1; bx++) {
                const k0 = `${bx},${by}`;
                if (building2x2Map.has(k0)) continue;
                const isBlock =
                  currentRegion.tiles[by]?.[bx] === 8 &&
                  currentRegion.tiles[by]?.[bx + 1] === 8 &&
                  currentRegion.tiles[by + 1]?.[bx] === 8 &&
                  currentRegion.tiles[by + 1]?.[bx + 1] === 8;
                if (isBlock) {
                  building2x2Map.add(k0);
                  building2x2Map.add(`${bx + 1},${by}`);
                  building2x2Map.add(`${bx},${by + 1}`);
                  building2x2Map.add(`${bx + 1},${by + 1}`);
                  const anyRevealed =
                    fogSet.size === 0 ||
                    fogSet.has(k0) ||
                    fogSet.has(`${bx + 1},${by}`) ||
                    fogSet.has(`${bx},${by + 1}`) ||
                    fogSet.has(`${bx + 1},${by + 1}`);
                  if (anyRevealed) {
                    buildingsToDraw.push({
                      x: bx,
                      y: by,
                      kind: classify2x2Building(currentRegion, bx, by),
                    });
                  }
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
                // Organic misty twilight Fog of War (softens near revealed neighbors with cloud wisps)
                const hasRevealedNeighbor =
                  fogSet.has(`${x - 1},${y}`) ||
                  fogSet.has(`${x + 1},${y}`) ||
                  fogSet.has(`${x},${y - 1}`) ||
                  fogSet.has(`${x},${y + 1}`);
                ctx.fillStyle = hasRevealedNeighbor ? '#1e293b' : '#0f172a';
                ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                const drift = Math.sin(currentTime * 0.0018 + x * 0.7 + y * 0.5) * 3;
                ctx.fillStyle = hasRevealedNeighbor ? 'rgba(226, 232, 240, 0.22)' : 'rgba(148, 163, 184, 0.14)';
                ctx.beginPath();
                ctx.arc(px + 10 + drift, py + 12, hasRevealedNeighbor ? 9 : 7, 0, Math.PI * 2);
                ctx.arc(px + 22 - drift, py + 21, hasRevealedNeighbor ? 8 : 6, 0, Math.PI * 2);
                ctx.fill();
                continue;
              }

              if (tile === 0 || (!interior && tile === 8 && building2x2Map.has(tileKey))) {
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
                  // Santiago stone cobble avenue + bridge over Río Mapocho (row 12)
                  const isMapochoBridge = y === 12;
                  ctx.fillStyle = isMapochoBridge ? '#78350f' : '#cbd5e1';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = isMapochoBridge ? '#a16207' : '#e2e8f0';
                  ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                  ctx.fillStyle = isMapochoBridge ? '#451a03' : '#94a3b8';
                  ctx.fillRect(px + 15, py + 4, 2, 24);
                  ctx.fillRect(px + 4, py + 15, 24, 2);
                } else if (currentRegion.id === 'biobio') {
                  // Biobío stone & gravel path + wooden river bridges on row 7
                  const isRiverBridge = y === 7;
                  ctx.fillStyle = isRiverBridge ? '#78350f' : '#d6d3d1';
                  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                  ctx.fillStyle = isRiverBridge ? '#a16207' : '#a8a29e';
                  ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                  ctx.fillStyle = isRiverBridge ? '#451a03' : '#78716c';
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

          // Render cohesive 2x2 (64x64px) buildings (Hospital, Santuario, Tienda, Casa)
          buildingsToDraw.forEach(b => {
            draw2x2ExteriorBuilding(ctx, b.kind, b.x * TILE_SIZE, b.y * TILE_SIZE, TILE_SIZE, currentTime);
          });

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
            if (ent.requiresStoryCleared && !hasCompletedStory) return;
            const live = patrolStateRef.current[ent.id];
            const footprint = ent.patrolPath ? [{ x: Math.round(live?.x ?? ent.x), y: Math.round(live?.y ?? ent.y) }] : getEntityFootprintTiles(ent);
            const isEntVisible =
              interior ||
              fogSet.size === 0 ||
              footprint.some(ft => fogSet.has(`${ft.x},${ft.y}`));
            if (!isEntVisible) return;

            const isMultiTileSummit = Boolean(ent.revealsRegionMap && ent.footprint && ent.footprint.length >= 4);
            const minFx = isMultiTileSummit ? Math.min(...footprint.map(t => t.x)) : live ? live.x : ent.x;
            const minFy = isMultiTileSummit ? Math.min(...footprint.map(t => t.y)) : live ? live.y : ent.y;
            const drawSize = isMultiTileSummit ? TILE_SIZE * 2 : TILE_SIZE;

            let renderX = minFx * TILE_SIZE;
            let renderY = minFy * TILE_SIZE;
            let spriteFlipped = false;

            if (!ent.cleared && (ent.type === 'wild_encounter' || ent.sprite.startsWith('wild_'))) {
              const offset = getSpeciesMovementOffset(ent, currentTime, TILE_SIZE);
              renderX += offset.dx;
              renderY += offset.dy;
              spriteFlipped = offset.flip;
            } else if (
              !ent.patrolPath &&
              ent.type === 'npc' &&
              !ent.isShop &&
              !ent.isHospital &&
              !ent.isEvolutionSanctuary &&
              !ent.rewardItem
            ) {
              const hash = ent.id.charCodeAt(ent.id.length - 1) || 2;
              renderX += Math.sin(currentTime * 0.001 + hash) * (TILE_SIZE * 0.22);
            }

            if (isMultiTileSummit) {
              // Subtle golden summit halo around 4-tile peak
              const haloPulse = 0.22 + Math.sin(currentTime * 0.004) * 0.1;
              ctx.fillStyle = ent.cleared ? 'rgba(56, 189, 248, 0.14)' : `rgba(250, 204, 21, ${haloPulse})`;
              ctx.beginPath();
              ctx.arc(renderX + drawSize / 2, renderY + drawSize / 2, drawSize * 0.56, 0, Math.PI * 2);
              ctx.fill();
            }

            drawEntitySprite(
              ctx,
              ent.type,
              ent.sprite,
              renderX,
              renderY,
              drawSize,
              ent.cleared || false,
              Math.floor(currentTime * 0.005),
              stageBossAwakened,
              spriteFlipped
            );

            if (ent.type === 'boss' && !ent.cleared) {
              const bPulse = Math.sin(currentTime * 0.007) * 4;
              if (stageBossAwakened) {
                ctx.strokeStyle = 'rgba(220, 38, 38, 0.85)';
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

                const badgeW = 98;
                const badgeH = 18;
                const bx = ent.x * TILE_SIZE + TILE_SIZE / 2 - badgeW / 2;
                const by = ent.y * TILE_SIZE - 20 + bPulse;

                ctx.fillStyle = 'rgba(244, 244, 242, 0.96)';
                ctx.fillRect(bx, by, badgeW, badgeH);
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(bx, by, badgeW, badgeH);

                ctx.fillStyle = '#b91c1c';
                ctx.font = 'bold 8px monospace';
                ctx.fillText('⚔️ JEFE DESPIERTO', bx + 6, by + 12);
              } else {
                const badgeW = 94;
                const badgeH = 16;
                const bx = ent.x * TILE_SIZE + TILE_SIZE / 2 - badgeW / 2;
                const by = ent.y * TILE_SIZE - 18 + bPulse * 0.5;

                ctx.fillStyle = 'rgba(244, 244, 242, 0.94)';
                ctx.fillRect(bx, by, badgeW, badgeH);
                ctx.strokeStyle = '#3f3f46';
                ctx.lineWidth = 1;
                ctx.strokeRect(bx, by, badgeW, badgeH);

                ctx.fillStyle = '#1e2022';
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
              const markerX = isMultiTileSummit ? renderX + drawSize / 2 : ent.x * TILE_SIZE + TILE_SIZE / 2;
              const markerY = isMultiTileSummit ? renderY : ent.y * TILE_SIZE;
              ctx.fillStyle = '#facc15';
              ctx.beginPath();
              ctx.moveTo(markerX, markerY - 4 + pulse);
              ctx.lineTo(markerX - 6, markerY - 14 + pulse);
              ctx.lineTo(markerX + 6, markerY - 14 + pulse);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
              ctx.beginPath();
              ctx.arc(
                markerX,
                markerY + drawSize / 2,
                drawSize * 0.58 + pulse,
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

          // 5 Bespoke Elemental Obstacle Clearance Animations (unique per element!)
          if (obstacleSkillAnimRef.current) {
            const anim = obstacleSkillAnimRef.current;
            const p = Math.min(1, Math.max(0, (currentTime - anim.startedAt) / anim.duration));
            const sx = compX + TILE_SIZE / 2;
            const sy = compY + TILE_SIZE / 2;
            const tx = anim.targetX * TILE_SIZE + TILE_SIZE / 2;
            const ty = anim.targetY * TILE_SIZE + TILE_SIZE / 2;

            ctx.save();
            if (anim.element === 'tierra') {
              // TIERRA: Seismic amber ground shockwaves + erupting stone pillars
              const shake = Math.sin(p * Math.PI * 16) * (1 - p) * 3;
              ctx.translate(shake, -shake * 0.6);
              for (let r = 0; r < 3; r++) {
                const rp = Math.max(0, p - r * 0.14);
                ctx.strokeStyle = r % 2 === 0 ? '#d97706' : '#fef3c7';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(sx + (tx - sx) * Math.min(1, rp * 1.3), sy + (ty - sy) * Math.min(1, rp * 1.3), 8 + rp * 20, 4 + rp * 11, 0, 0, Math.PI * 2);
                ctx.stroke();
              }
              if (p > 0.25) {
                const rise = Math.sin(((p - 0.25) / 0.75) * Math.PI);
                for (let k = -1; k <= 1; k++) {
                  const rx = tx + k * 9 - 3;
                  const rh = 18 * rise;
                  ctx.fillStyle = '#78350f';
                  ctx.fillRect(rx, ty + 8 - rh, 6, rh);
                  ctx.fillStyle = '#f59e0b';
                  ctx.fillRect(rx + 1, ty + 8 - rh, 4, 3);
                }
              }
            } else if (anim.element === 'fuego') {
              // FUEGO: Spiraling vortex of fireballs + scorching ground blaze & rising embers
              const steps = 6;
              for (let i = 0; i < steps; i++) {
                const fp = Math.max(0, Math.min(1, p * 1.45 - i * 0.08));
                const spiral = Math.sin(fp * Math.PI * 4 + i) * 9 * (1 - fp * 0.5);
                const fx = sx + (tx - sx) * fp + spiral;
                const fy = sy + (ty - sy) * fp - Math.cos(fp * Math.PI * 3 + i) * 5;
                ctx.fillStyle = i % 2 === 0 ? '#ea580c' : '#facc15';
                ctx.beginPath();
                ctx.arc(fx, fy, 6 - i * 0.5, 0, Math.PI * 2);
                ctx.fill();
              }
              if (p > 0.35) {
                const bp = (p - 0.35) / 0.65;
                ctx.fillStyle = 'rgba(234, 88, 12, 0.5)';
                ctx.beginPath();
                ctx.arc(tx, ty, 10 + bp * 16, 0, Math.PI * 2);
                ctx.fill();
                for (let e = 0; e < 8; e++) {
                  const ex = tx + Math.sin(e * 2.1 + p * 8) * (10 + bp * 14);
                  const ey = ty - bp * 26 + (e % 3) * 6;
                  ctx.fillStyle = '#fef08a';
                  ctx.fillRect(ex, ey, 3, 3);
                }
              }
            } else if (anim.element === 'agua') {
              // AGUA: High-crest arcing tidal wave crashing down + expanding seafoam mist
              const arcP = Math.min(1, p * 1.35);
              const arcX = sx + (tx - sx) * arcP;
              const arcY = sy + (ty - sy) * arcP - Math.sin(arcP * Math.PI) * 26;
              ctx.strokeStyle = '#0ea5e9';
              ctx.lineWidth = 8;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.quadraticCurveTo((sx + tx) / 2, Math.min(sy, ty) - 34, arcX, arcY);
              ctx.stroke();
              ctx.fillStyle = '#e0f2fe';
              ctx.beginPath();
              ctx.arc(arcX, arcY, 7, 0, Math.PI * 2);
              ctx.fill();
              if (p > 0.45) {
                const sp = (p - 0.45) / 0.55;
                for (let d = 0; d < 10; d++) {
                  const ang = (d / 10) * Math.PI * 2;
                  const rad = sp * 24;
                  ctx.fillStyle = d % 2 === 0 ? '#bae6fd' : '#0284c7';
                  ctx.beginPath();
                  ctx.arc(tx + Math.cos(ang) * rad, ty + Math.sin(ang) * rad, 3.5, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            } else if (anim.element === 'planta') {
              // PLANTA: Three sinuous emerald vines wrapping & blooming golden leaves on impact
              const vineP = Math.min(1, p * 1.4);
              for (let v = -1; v <= 1; v++) {
                ctx.strokeStyle = v === 0 ? '#22c55e' : '#15803d';
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                const midX = (sx + tx) / 2 + v * 16;
                const midY = (sy + ty) / 2 + Math.sin(p * Math.PI * 4 + v) * 14;
                ctx.quadraticCurveTo(midX, midY, sx + (tx - sx) * vineP, sy + (ty - sy) * vineP);
                ctx.stroke();
              }
              if (p > 0.35) {
                const lp = (p - 0.35) / 0.65;
                for (let l = 0; l < 6; l++) {
                  const ang = (l / 6) * Math.PI * 2 + p * 5;
                  const rad = 8 + lp * 16;
                  ctx.fillStyle = l % 2 === 0 ? '#84cc16' : '#fef08a';
                  ctx.beginPath();
                  ctx.ellipse(tx + Math.cos(ang) * rad, ty + Math.sin(ang) * rad, 4, 2, ang, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            } else {
              // HIELO: Sharp faceted glacial lance + rotating 6-point hexagonal frost crystal rings
              const lanceP = Math.min(1, p * 1.5);
              const lx = sx + (tx - sx) * lanceP;
              const ly = sy + (ty - sy) * lanceP;
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(lx, ly);
              ctx.stroke();
              ctx.fillStyle = '#f0f9ff';
              ctx.beginPath();
              ctx.arc(lx, ly, 5, 0, Math.PI * 2);
              ctx.fill();
              if (p > 0.3) {
                const ip = (p - 0.3) / 0.7;
                ctx.strokeStyle = '#bae6fd';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                for (let h = 0; h < 6; h++) {
                  const ang = (h / 6) * Math.PI * 2 + p * 3;
                  const rad = 6 + ip * 22;
                  const hx = tx + Math.cos(ang) * rad;
                  const hy = ty + Math.sin(ang) * rad;
                  if (h === 0) ctx.moveTo(hx, hy);
                  else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.stroke();
              }
            }
            ctx.restore();
          }

          // Summit Map-Reveal Expanding Golden / Sky Light Wave Burst
          if (summitRevealAnimRef.current) {
            const sAnim = summitRevealAnimRef.current;
            const elapsed = currentTime - sAnim.startedAt;
            if (elapsed >= sAnim.duration) {
              summitRevealAnimRef.current = null;
            } else {
              const p = elapsed / sAnim.duration;
              const cx = sAnim.x * TILE_SIZE + TILE_SIZE / 2;
              const cy = sAnim.y * TILE_SIZE + TILE_SIZE / 2;
              ctx.save();
              for (let r = 0; r < 3; r++) {
                const rp = Math.max(0, p - r * 0.14);
                const rad = rp * TILE_SIZE * 14;
                ctx.strokeStyle =
                  r % 2 === 0
                    ? `rgba(250, 204, 21, ${Math.max(0, 0.85 * (1 - rp))})`
                    : `rgba(56, 189, 248, ${Math.max(0, 0.75 * (1 - rp))})`;
                ctx.lineWidth = 4 - r;
                ctx.beginPath();
                ctx.arc(cx, cy, rad, 0, Math.PI * 2);
                ctx.stroke();
              }
              const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, p * TILE_SIZE * 10);
              grad.addColorStop(0, `rgba(254, 240, 138, ${0.45 * (1 - p)})`);
              grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(cx, cy, p * TILE_SIZE * 10, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
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
  const offPathRangeText =
    currentRegion.id === 'losrios' || currentRegion.id === 'loslagos' ? '8%-16%' : '6%-12%';
  const encounterRateLabel =
    currentRegion.wildEncounterTable.length === 0
      ? 'Hogar · 0%'
      : currentTileType === 10
      ? 'Interior · 0%'
      : currentTileType === 11
      ? 'Vía Férrea · 0%'
      : currentTileType === 1
      ? 'Camino · 0%'
      : `Fuera · ${offPathRangeText}`;

  const getWeatherBadge = () => {
    const w = currentRegion.weather;
    if (w === 'soleado') return { icon: <Sun className="w-3 h-3 text-amber-600 shrink-0" />, text: 'Soleado' };
    if (w === 'lluvia_intermitente') return { icon: <CloudFog className="w-3 h-3 text-zinc-600 shrink-0" />, text: 'Niebla/Lluvia' };
    if (w === 'lluvia_suave') return { icon: <CloudRain className="w-3 h-3 text-sky-600 shrink-0" />, text: 'Lluvia Fija' };
    if (w === 'lluvia_viento') return { icon: <Wind className="w-3 h-3 text-emerald-700 shrink-0" />, text: 'Lluvia/Viento' };
    if (w === 'ventisca_austral') return { icon: <CloudLightning className="w-3 h-3 text-cyan-700 shrink-0" />, text: 'Tormenta' };
    return { icon: <Home className="w-3 h-3 text-zinc-700 shrink-0" />, text: 'Interior' };
  };
  const weatherBadge = getWeatherBadge();

  const renderWeatherParticles = (rId: RegionId) => {
    if (rId === 'santiago') {
      return (
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
      );
    }
    if (rId === 'biobio') {
      return (
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
      );
    }
    if (rId === 'araucania') {
      return (
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
      );
    }
    if (rId === 'losrios') {
      return (
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
      );
    }
    if (rId === 'loslagos') {
      return (
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
      );
    }
    return null;
  };

  const isImportantKeyMsg = Boolean(
    importantMessage &&
      /(Amuleto|Fruto|Esencia|Orbe|Cima|Cristal|Corazón|Botín|despejad|evolución|Nv\.)/i.test(importantMessage)
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] bg-zinc-950 flex flex-col justify-between overflow-hidden select-none touch-manipulation"
    >
      {/* Subtle stage enter fade overlay */}
      <div key={currentRegion.id} className="pointer-events-none fixed inset-0 z-30 bg-zinc-950 animate-stage-enter" />

      {/* 60fps Canvas Viewport (Tap anywhere to walk & interact) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={viewportSize.width}
          height={viewportSize.height}
          onPointerDown={handleCanvasPointerDown}
          className="w-full h-full image-render-pixel cursor-pointer"
        />
      </div>

      {/* Outgoing Climate Cross-Fade Layer */}
      {fadingOutRegionId && (
        <div
          className={`absolute inset-0 z-10 pointer-events-none overflow-hidden transition-opacity duration-700 ease-out ${
            climateFadeActive ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        >
          {renderWeatherParticles(fadingOutRegionId)}
        </div>
      )}

      {/* Multi-Layer CSS Regional Atmospheric Climate & Particle Effects */}
      <div
        key={`weather-${currentRegion.id}`}
        className="absolute inset-0 z-10 pointer-events-none overflow-hidden animate-in fade-in duration-700"
        aria-hidden="true"
      >
        {renderWeatherParticles(currentRegion.id)}
      </div>

      {/* Top Floating Blanco Humo + Negro Grafito HUD */}
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
            className="bg-[#F4F4F2]/95 hover:bg-white backdrop-blur border border-zinc-400 px-2 sm:px-2.5 py-1.5 rounded-xl shadow-lg pointer-events-auto flex items-center gap-2 min-w-0 cursor-pointer text-left active:scale-95 transition-all"
            title="Ver Perfil y Amuletos Espirituales"
          >
            <div className="w-8 h-8 rounded-lg bg-[#E7E7E2] border border-zinc-400 flex items-center justify-center shrink-0 overflow-hidden">
              <canvas
                ref={heroAvatarCanvasRef}
                width={44}
                height={44}
                className="w-full h-full object-contain image-render-pixel"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-pixel text-[9px] sm:text-[11px] text-[#1E2022] truncate">
                {currentRegion.name.split('&')[0].trim()}
              </h3>
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono text-zinc-700 truncate">
                <span className="text-[#1E2022] font-bold truncate">{barbara.name}</span>
                <span>&middot;</span>
                <span>{barbara.gold} Oro</span>
                <span className="hidden xs:inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                  &middot; <Award className="w-2.5 h-2.5 inline" /> {(barbara.medals || []).length}/5
                </span>
              </div>
            </div>
          </button>

          {/* Mobile-Friendly Top Action Buttons (Blanco Humo + Negro Grafito + Guía) */}
          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
            <button
              onClick={() => {
                sound.init();
                sound.playSelect();
                syncCurrentPos();
                onOpenParty();
              }}
              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-[#1E2022] hover:bg-zinc-800 border border-zinc-700 rounded-xl text-[#F4F4F2] transition-all flex items-center gap-1 text-[10px] sm:text-xs font-silkscreen font-bold cursor-pointer shadow-lg active:scale-95"
              title="Equipo Espiritual"
            >
              <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F4F4F2] shrink-0" />
              <span>Equipo</span>
            </button>

            <button
              onClick={() => {
                sound.init();
                sound.playSelect();
                syncCurrentPos();
                onOpenInventory();
              }}
              className="p-1.5 sm:px-2.5 sm:py-2 bg-[#F4F4F2]/95 hover:bg-white border border-zinc-400 rounded-xl text-[#1E2022] transition-colors flex items-center gap-1 text-xs font-mono cursor-pointer shadow-md active:scale-95"
              title="Mochila"
            >
              <Backpack className="w-4 h-4 text-[#1E2022]" />
              <span className="hidden md:inline font-bold">Mochila</span>
            </button>

            <button
              onClick={() => {
                sound.init();
                sound.playSelect();
                syncCurrentPos();
                onOpenMap();
              }}
              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-700 hover:bg-emerald-800 border border-emerald-800 rounded-xl text-[#F4F4F2] transition-all flex items-center gap-1 text-[10px] sm:text-xs font-silkscreen font-bold cursor-pointer shadow-lg active:scale-95"
              title="Mapa de Chile"
            >
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F4F4F2] shrink-0" />
              <span>Mapa</span>
            </button>

            {onOpenGuide && (
              <button
                onClick={() => {
                  sound.init();
                  sound.playSelect();
                  syncCurrentPos();
                  onOpenGuide();
                }}
                className="p-1.5 sm:px-2.5 sm:py-2 bg-[#F4F4F2]/95 hover:bg-white border border-zinc-400 rounded-xl text-[#1E2022] transition-colors flex items-center gap-1 text-xs font-mono cursor-pointer shadow-md active:scale-95"
                title="Guía, Cómo Jugar y Objetivos"
                aria-label="Abrir Guía de Aventura"
              >
                <HelpCircle className="w-4 h-4 text-[#1E2022]" />
                <span className="hidden lg:inline font-bold">Guía</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.init();
                onToggleMute();
              }}
              className="p-1.5 sm:p-2 bg-[#F4F4F2]/95 hover:bg-white border border-zinc-400 rounded-xl text-[#1E2022] transition-colors cursor-pointer shadow-md active:scale-95"
              title="Silenciar / Activar Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4 text-[#1E2022]" />}
            </button>

            <button
              onClick={() => {
                sound.init();
                sound.playSelect();
                syncCurrentPos();
                onOpenSystemMenu();
              }}
              className="px-2 sm:px-2.5 py-1.5 sm:py-2 bg-[#E7E7E2] hover:bg-white border border-zinc-400 rounded-xl text-[#1E2022] transition-all flex items-center gap-1 text-[11px] font-silkscreen font-bold cursor-pointer shadow-lg active:scale-95"
              title="Menú, Perfil, Misiones y Guardado"
            >
              <Settings className="w-4 h-4 text-[#1E2022]" />
              <span className="hidden sm:inline">Menú</span>
            </button>
          </div>
        </div>

        {/* Mission Pill (Blanco Humo) + Region + Clima + Encounter */}
        <div className="flex flex-wrap items-center justify-between gap-1">
          <button
            onClick={() => {
              sound.init();
              sound.playSelect();
              syncCurrentPos();
              onOpenSystemMenu();
            }}
            className="pointer-events-auto h-7 sm:h-8 max-w-full sm:max-w-[58%] px-3 bg-[#F4F4F2]/95 hover:bg-white backdrop-blur border border-zinc-400 rounded-full text-[11px] sm:text-xs font-mono text-[#1E2022] shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 overflow-hidden"
          >
            <Target className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="text-[#1E2022] font-bold shrink-0">
              {currentQuest.totalSteps > 0 ? `Paso ${currentQuest.stepNumber}/${currentQuest.totalSteps}:` : 'Zona:'}
            </span>
            {currentQuest.requiredElement && (
              <span
                className={`px-1.5 py-0 rounded font-silkscreen text-[9px] font-bold shrink-0 ${ELEMENT_META[currentQuest.requiredElement].badgeClass}`}
              >
                {ELEMENT_META[currentQuest.requiredElement].icon} {ELEMENT_META[currentQuest.requiredElement].label.toUpperCase()}
              </span>
            )}
            <span className="truncate font-semibold text-zinc-800">{currentQuest.shortText}</span>
          </button>

          <div className="flex flex-wrap items-center gap-1 pointer-events-auto">
            <div className="px-2 py-0.5 rounded-full bg-[#F4F4F2]/92 border border-zinc-400 text-[9px] sm:text-[10px] font-silkscreen text-[#1E2022] flex items-center gap-1 shadow-sm whitespace-nowrap shrink-0">
              <MapPin className="w-3 h-3 text-zinc-600 shrink-0" />
              <span>{currentRegion.name.split('&')[0].trim()}</span>
            </div>

            <div className="px-2 py-0.5 rounded-full bg-[#F4F4F2]/92 border border-zinc-400 text-[9px] sm:text-[10px] font-mono text-[#1E2022] flex items-center gap-1 shadow-sm whitespace-nowrap shrink-0">
              {weatherBadge.icon}
              <span>{weatherBadge.text}</span>
            </div>

            <div
              className={`px-2 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-mono shadow-sm whitespace-nowrap shrink-0 font-bold ${
                currentTileType === 1 || currentTileType === 10 || currentTileType === 11 || currentRegion.wildEncounterTable.length === 0
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                  : 'bg-[#E7E7E2] border-zinc-500 text-[#1E2022]'
              }`}
              title={`Caminos/Vía Férrea/Interior: 0% · Fuera de camino: ${offPathRangeText}`}
            >
              Enc: {encounterRateLabel}
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Left Compañero Espiritual Card (Blanco Humo) & Right Unified Fixed-Height Alert/Prompt Slot */}
      <footer className="relative z-20 w-full p-2 sm:p-4 flex items-end justify-between gap-2 sm:gap-3 max-w-5xl mx-auto pointer-events-none">
        {/* Bottom-Left: Compañero Espiritual Mini-Card */}
        <button
          onClick={() => {
            sound.init();
            sound.playSelect();
            syncCurrentPos();
            onOpenParty();
          }}
          className="pointer-events-auto bg-[#F4F4F2]/95 hover:bg-white backdrop-blur border-2 border-zinc-400 p-1.5 sm:p-2 rounded-2xl shadow-xl flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 transition-all text-left"
          title="Cambiar Compañero Espiritual en Equipo"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#E7E7E2] border border-zinc-400 shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
            <canvas
              ref={activeAvatarCanvasRef}
              width={48}
              height={48}
              className="w-full h-full object-contain image-render-pixel"
            />
          </div>
          <div className="min-w-[82px] sm:min-w-[98px]">
            <div className="text-[7px] font-silkscreen text-emerald-700 font-bold uppercase leading-none mb-0.5">
              ★ Compañero
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="font-pixel text-[9px] text-[#1E2022] truncate max-w-[74px] sm:max-w-[92px]">
                {playerSpirit.name}
              </span>
              <span className="font-mono text-[9px] text-zinc-700 font-bold shrink-0">Nv.{playerSpirit.level}</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-300 rounded-full overflow-hidden mt-1 border border-zinc-400" title="Salud (PS)">
              <div
                className={`h-full transition-all duration-300 ${
                  playerSpirit.currentHp / Math.max(1, playerSpirit.maxHp) < 0.3
                    ? 'bg-red-600'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (playerSpirit.currentHp / Math.max(1, playerSpirit.maxHp)) * 100))}%` }}
              />
            </div>
            <div className="w-full h-1 bg-zinc-300 rounded-full overflow-hidden mt-0.5 border border-zinc-400/80" title={`EXP ${playerSpirit.exp}/${playerSpirit.maxExp}`}>
              <div
                className="h-full bg-[#1E2022] transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, (playerSpirit.exp / Math.max(1, playerSpirit.maxExp)) * 100))}%` }}
              />
            </div>
          </div>
        </button>

        {/* Bottom-Right: Fixed-Height Unified Important Message & Dismissible Alert / Tap Prompt Slot */}
        <div className="flex-1 min-w-0 flex items-end justify-end">
          {(importantMessage || interactPrompt) && (
            importantMessage ? (
              <div
                className={`pointer-events-auto w-full max-w-md h-[48px] sm:h-[52px] rounded-2xl px-3 py-1.5 shadow-2xl font-mono text-[10px] sm:text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 border-2 overflow-hidden ${
                  isImportantKeyMsg
                    ? 'bg-[#F4F4F2]/95 border-emerald-600 text-[#1E2022]'
                    : 'bg-[#F4F4F2]/95 border-zinc-500 text-[#1E2022]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isImportantKeyMsg ? 'bg-emerald-600' : 'bg-[#1E2022]'
                  }`}
                />
                <span className="leading-tight flex-1 min-w-0 line-clamp-2 overflow-hidden font-semibold">{importantMessage}</span>
                {onDismissImportantMessage && (
                  <button
                    onClick={() => {
                      sound.playCancel();
                      onDismissImportantMessage();
                    }}
                    aria-label="Cerrar aviso"
                    className="p-1 rounded-lg bg-[#E7E7E2] hover:bg-zinc-300 border border-zinc-400 text-[#1E2022] shrink-0 cursor-pointer active:scale-90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleInteract}
                className="pointer-events-auto w-full max-w-md h-[48px] sm:h-[52px] bg-[#F4F4F2]/95 hover:bg-white border-2 border-zinc-500 text-[#1E2022] rounded-2xl px-3 py-1.5 shadow-2xl font-mono text-[10px] sm:text-xs flex items-center gap-2 cursor-pointer active:scale-98 transition-transform text-left animate-in fade-in slide-in-from-bottom-2 duration-150 overflow-hidden font-semibold"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping shrink-0" />
                <span className="leading-snug truncate">{interactPrompt}</span>
                {nearbyEntity?.type === 'obstacle' && nearbyEntity.elementRequired && (
                  <span
                    className={`ml-auto px-1.5 py-0.5 rounded font-silkscreen text-[8px] font-bold shrink-0 ${ELEMENT_META[nearbyEntity.elementRequired].badgeClass}`}
                  >
                    {ELEMENT_META[nearbyEntity.elementRequired].icon} {ELEMENT_META[nearbyEntity.elementRequired].label.toUpperCase()}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      </footer>
    </div>
  );
};
