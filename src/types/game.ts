/**
 * Core Game Types for Crónicas Elementales del Sur
 */

export type ElementType = 'fuego' | 'agua' | 'planta' | 'viento' | 'tierra' | 'hielo' | 'sagrado' | 'normal';

export type RegionId = 'casa' | 'santiago' | 'biobio' | 'araucania' | 'losrios' | 'loslagos' | 'hospital' | 'santuario' | 'tienda';

export const MAIN_REGION_IDS: RegionId[] = ['casa', 'santiago', 'biobio', 'araucania', 'losrios', 'loslagos'];

export type GameState =
  | 'title'
  | 'intro'
  | 'exploration'
  | 'battle'
  | 'evolution'
  | 'party'
  | 'inventory'
  | 'shop'
  | 'bestiary'
  | 'map'
  | 'profile'
  | 'victory'
  | 'gameover';

export interface ElementalSkill {
  id: string;
  name: string;
  element: ElementType;
  power: number;
  mpCost: number;
  accuracy: number;
  category: 'physical' | 'elemental' | 'support' | 'heal';
  target: 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies' | 'self';
  description: string;
  effectType?: 'burn' | 'freeze' | 'poison' | 'paralyze' | 'attack_buff' | 'defense_buff' | 'heal' | 'speed_buff';
  effectChance?: number;
  animationColor: string;
}

export interface EvolutionStage {
  stage: number; // 1, 2, 3
  name: string;
  title: string;
  description: string;
  spriteKey: string;
  icon: string;
  baseHp: number;
  baseMp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpAttack: number;
  baseSpDefense: number;
  baseSpeed: number;
  requiredLevel: number;
  requiredItem?: string;
  signatureSkill: ElementalSkill;
}

export interface SpiritCreature {
  uid: string;
  baseId: string;
  nickname?: string;
  name: string;
  primaryElement: ElementType;
  secondaryElement?: ElementType;
  level: number;
  exp: number;
  maxExp: number;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
  currentStage: number; // 1, 2, 3
  evolutionLine: EvolutionStage[];
  skills: ElementalSkill[];
  statusCondition?: 'burn' | 'freeze' | 'paralyze' | 'faint' | null;
  statusDuration?: number;
  lore: string;
  rarity: 'común' | 'raro' | 'místico' | 'legendario';
}

export type HeroGender = 'female' | 'male' | 'isabella';

export interface RegionMedalInfo {
  id: string;
  regionId: Exclude<RegionId, 'casa' | 'hospital' | 'santuario' | 'tienda'>;
  name: string;
  regionLabel: string;
  guardianName: string;
  bossName: string;
  icon: string;
}

export interface MedalRecord {
  medalId: string;
  bossName: string;
  regionLabel: string;
  order: number;
  earnedAt: string;
}

export const REGION_MEDALS: RegionMedalInfo[] = [
  {
    id: 'medalla_rm',
    regionId: 'santiago',
    name: 'Medalla Valle Central',
    regionLabel: 'R. Metropolitana',
    guardianName: 'Maestro Vínculo Rodrigo',
    bossName: 'Espíritu Gran Torre Costanera',
    icon: '🏅',
  },
  {
    id: 'medalla_biobio',
    regionId: 'biobio',
    name: 'Medalla Jurásica Biobío',
    regionLabel: 'R. del Biobío',
    guardianName: 'Maestro Vínculo Lautaro',
    bossName: 'Rex Fósil del Biobío',
    icon: '🦖',
  },
  {
    id: 'medalla_araucania',
    regionId: 'araucania',
    name: 'Medalla Pewén Araucanía',
    regionLabel: 'R. de La Araucanía',
    guardianName: 'Maestro Vínculo Kallfü',
    bossName: 'Araucaria Madre',
    icon: '🌲',
  },
  {
    id: 'medalla_losrios',
    regionId: 'losrios',
    name: 'Medalla Selva Valdiviana',
    regionLabel: 'R. de Los Ríos',
    guardianName: 'Maestra Vínculo Antonia',
    bossName: 'Guardián del Torreón',
    icon: '🏰',
  },
  {
    id: 'medalla_loslagos',
    regionId: 'loslagos',
    name: 'Medalla Serpientes Australes',
    regionLabel: 'R. de Los Lagos',
    guardianName: 'Maestros Kalfú y Llankal',
    bossName: 'Cai Cai y Vilu Vilu',
    icon: '🐍',
  },
];

export interface BarbaraHero {
  name: string;
  gender: HeroGender;
  level: number;
  exp: number;
  maxExp: number;
  currentHp: number;
  maxHp: number;
  limitGauge: number; // 0..100% (Invocación Primigenia)
  resonanceOrbs: number; // Amuletos de Vínculo
  gold: number;
  activeSpiritUids: string[];
  medals: string[];
  medalRecords?: MedalRecord[];
  bestiaryCompleted?: boolean;
  seenSpeciesIds?: string[];
  registeredEvolutionKeys?: string[];
  battlesWon: number;
  spiritsCaptured: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'curativo' | 'esencia' | 'captura' | 'clave';
  description: string;
  count: number;
  icon: string;
  effectType: 'heal_hp' | 'heal_mp' | 'revive' | 'evolution' | 'resonance' | 'cure_status';
  effectValue: number;
  price?: number;
  targetRequiredItemName?: string;
}

export interface OverworldEntity {
  id: string;
  x: number;
  y: number;
  type: 'npc' | 'chest' | 'wild_encounter' | 'boss' | 'obstacle' | 'portal' | 'shrine' | 'decorative';
  name: string;
  sprite: string;
  direction?: 'down' | 'up' | 'left' | 'right';
  dialog?: string[];
  rewardItem?: { id: string; count: number };
  rewardGold?: number;
  elementRequired?: ElementType;
  obstacleClearMessage?: string;
  bossSpiritId?: string;
  encounterSpiritId?: string;
  customLevel?: number;
  customStage?: number;
  requiresMissionsCleared?: boolean;
  cleared?: boolean;
  destinationRegion?: RegionId;
  destinationX?: number;
  destinationY?: number;
  shopVendorName?: string;
  shopSubtitle?: string;
  isShop?: boolean;
  isHospital?: boolean;
  isEvolutionSanctuary?: boolean;
}

export interface MapRegion {
  id: RegionId;
  name: string;
  subtitle: string;
  lore: string;
  width: number;
  height: number;
  // 0: grass, 1: path/bridge (0%), 2: water, 3: mountain/rock, 4: forest/tree, 5: lava/wall, 6: snow/ice, 7: flowers/crops, 8: house/wall/furniture, 9: prehistoric amber, 10: indoor safe floor (0%), 11: railway tracks (0%)
  tiles: number[][];
  ambientColor: string;
  themeColor: string;
  weather: 'soleado' | 'otonal' | 'lluvia_intermitente' | 'lluvia_suave' | 'lluvia_viento' | 'ceniza_volcanica' | 'ventisca_austral' | 'interior';
  weatherLabel?: string;
  bgmId: RegionId;
  entities: OverworldEntity[];
  wildEncounterTable: { spiritId: string; minLevel: number; maxLevel: number; weight: number }[];
  isUnlocked: boolean;
}

export interface BattleTurnAction {
  actorId: string;
  isPlayer: boolean;
  isHero?: boolean;
  actionType: 'skill' | 'item' | 'capture' | 'switch' | 'limit';
  skill?: ElementalSkill;
  targetId: string;
  itemId?: string;
}

export interface BattleLogEntry {
  id: string;
  text: string;
  type: 'damage' | 'heal' | 'status' | 'combo' | 'capture' | 'info' | 'critical';
}
