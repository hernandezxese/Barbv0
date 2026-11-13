/**
 * Storage Service for Crónicas Elementales del Sur
 * Supports 3 distinct save slots (Slot 1, Slot 2, Slot 3) with timestamps,
 * party summary, region location, medals, and backwards-compatible migration.
 */

import { BarbaraHero, HeroGender, InventoryItem, MedalRecord, REGION_MEDALS, RegionId, SpiritCreature } from '../types/game';

export interface SavedGameData {
  version: number;
  slotId: number;
  savedAt: string;
  currentRegionId: RegionId;
  unlockedRegions: RegionId[];
  barbara: BarbaraHero;
  partySpirits: SpiritCreature[];
  inventory: Record<string, InventoryItem>;
  clearedEntityIds: string[];
  playerSpawnPos: { x: number; y: number };
  interiorReturnLocation?: {
    regionId: RegionId;
    x: number;
    y: number;
    shopVendorName?: string;
    shopSubtitle?: string;
  };
  revealedTiles?: Record<string, string[]>;
  hasCompletedStory?: boolean;
}

export interface SlotSummary {
  slotId: number;
  savedAt: string;
  regionId: RegionId;
  barbaraName: string;
  barbaraLevel: number;
  spiritCount: number;
  leaderSpiritName: string;
  leaderSpiritIcon: string;
  gold: number;
  medalsCount: number;
  hasCompletedStory?: boolean;
}

const SLOT_KEY_PREFIX = 'barbara_cronicas_slot_';
const LEGACY_KEY = 'barbara_cronicas_elementales_save_v1';

function migrateRegionId(id: string): RegionId {
  if (id === 'pucon') return 'araucania';
  if (id === 'villarrica') return 'losrios';
  if (id === 'hornopiren') return 'loslagos';
  if (
    id === 'casa' ||
    id === 'santiago' ||
    id === 'biobio' ||
    id === 'araucania' ||
    id === 'losrios' ||
    id === 'loslagos' ||
    id === 'hospital' ||
    id === 'santuario' ||
    id === 'tienda'
  ) {
    return id;
  }
  return 'santiago';
}

function normalizeGender(g?: string): HeroGender {
  if (g === 'male' || g === 'isabella') return g;
  return 'female';
}

function normalizeHero(raw: any): BarbaraHero {
  const medals: string[] = Array.isArray(raw?.medals) ? raw.medals : [];
  let medalRecords: MedalRecord[] = Array.isArray(raw?.medalRecords) ? raw.medalRecords : [];
  if (medals.length > 0 && medalRecords.length === 0) {
    medalRecords = medals.map((mId, idx) => {
      const info = REGION_MEDALS.find(m => m.id === mId);
      return {
        medalId: mId,
        bossName: info?.bossName || 'Guardián Regional',
        regionLabel: info?.regionLabel || 'Chile',
        order: idx + 1,
        earnedAt: new Date().toISOString(),
      };
    });
  }

  return {
    name: raw?.name || 'Bárbara',
    gender: normalizeGender(raw?.gender),
    level: raw?.level || 1,
    exp: raw?.exp || 0,
    maxExp: raw?.maxExp || 100,
    currentHp: raw?.currentHp ?? 120,
    maxHp: raw?.maxHp ?? 120,
    limitGauge: raw?.limitGauge ?? 100,
    resonanceOrbs: raw?.resonanceOrbs ?? 6,
    gold: raw?.gold ?? 250,
    activeSpiritUids: Array.isArray(raw?.activeSpiritUids) ? raw.activeSpiritUids : [],
    medals,
    medalRecords,
    bestiaryCompleted: Boolean(raw?.bestiaryCompleted),
    seenSpeciesIds: Array.isArray(raw?.seenSpeciesIds) ? Array.from(new Set(raw.seenSpeciesIds)) : [],
    registeredEvolutionKeys: Array.isArray(raw?.registeredEvolutionKeys) ? Array.from(new Set(raw.registeredEvolutionKeys)) : [],
    battlesWon: typeof raw?.battlesWon === 'number' ? raw.battlesWon : 0,
    spiritsCaptured: typeof raw?.spiritsCaptured === 'number' ? raw.spiritsCaptured : 0,
  };
}

export const storageService = {
  getSlotKey(slotId: number): string {
    return `${SLOT_KEY_PREFIX}${slotId}`;
  },

  saveGame(slotId: number, data: Omit<SavedGameData, 'version' | 'savedAt' | 'slotId'>): boolean {
    try {
      const payload: SavedGameData = {
        ...data,
        barbara: normalizeHero(data.barbara),
        revealedTiles: data.revealedTiles || {},
        slotId,
        version: 7,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(this.getSlotKey(slotId), JSON.stringify(payload));
      return true;
    } catch (e) {
      console.error(`Error saving game in slot ${slotId}:`, e);
      return false;
    }
  },

  loadGame(slotId: number): SavedGameData | null {
    try {
      let parsed: SavedGameData | null = null;
      const raw = localStorage.getItem(this.getSlotKey(slotId));
      if (raw) {
        parsed = JSON.parse(raw) as SavedGameData;
      } else if (slotId === 1) {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          parsed = JSON.parse(legacy) as SavedGameData;
          parsed.slotId = 1;
        }
      }
      if (!parsed) return null;

      parsed.currentRegionId = migrateRegionId(parsed.currentRegionId);
      parsed.unlockedRegions = Array.from(
        new Set((parsed.unlockedRegions || ['casa', 'santiago']).map(migrateRegionId))
      );
      if (parsed.interiorReturnLocation) {
        parsed.interiorReturnLocation = {
          ...parsed.interiorReturnLocation,
          regionId: migrateRegionId(parsed.interiorReturnLocation.regionId),
        };
      }
      if (!parsed.revealedTiles || typeof parsed.revealedTiles !== 'object') {
        parsed.revealedTiles = {};
      }
      parsed.barbara = normalizeHero(parsed.barbara);
      // Backfill seen & registered evolution keys from owned partySpirits for legacy saves
      const ownedParty = Array.isArray(parsed.partySpirits) ? parsed.partySpirits : [];
      const seenSet = new Set<string>(parsed.barbara.seenSpeciesIds || []);
      const evoSet = new Set<string>(parsed.barbara.registeredEvolutionKeys || []);
      ownedParty.forEach(s => {
        if (s?.baseId) {
          seenSet.add(s.baseId);
          for (let st = 1; st <= (s.currentStage || 1); st++) {
            evoSet.add(`${s.baseId}:${st}`);
          }
        }
      });
      parsed.barbara.seenSpeciesIds = Array.from(seenSet);
      parsed.barbara.registeredEvolutionKeys = Array.from(evoSet);
      return parsed;
    } catch (e) {
      console.error(`Error loading game from slot ${slotId}:`, e);
      return null;
    }
  },

  deleteSlot(slotId: number): boolean {
    try {
      localStorage.removeItem(this.getSlotKey(slotId));
      if (slotId === 1) {
        localStorage.removeItem(LEGACY_KEY);
      }
      return true;
    } catch (e) {
      console.error(`Error deleting slot ${slotId}:`, e);
      return false;
    }
  },

  getSlotSummary(slotId: number): SlotSummary | null {
    const data = this.loadGame(slotId);
    if (!data) return null;
    const leader = data.partySpirits?.[0];
    const leaderIcon = leader?.evolutionLine?.[leader.currentStage - 1]?.icon || '🌱';
    return {
      slotId,
      savedAt: data.savedAt,
      regionId: data.currentRegionId,
      barbaraName: data.barbara?.name || 'Bárbara',
      barbaraLevel: data.barbara?.level || 1,
      spiritCount: data.partySpirits?.length || 0,
      leaderSpiritName: leader?.name || 'Compañero',
      leaderSpiritIcon: leaderIcon,
      gold: data.barbara?.gold || 0,
      medalsCount: data.barbara?.medals?.length || 0,
      hasCompletedStory: Boolean(data.hasCompletedStory),
    };
  },

  getAllSlots(): (SlotSummary | null)[] {
    return [1, 2, 3].map(id => this.getSlotSummary(id));
  },

  hasSavedGame(): boolean {
    return [1, 2, 3].some(id => localStorage.getItem(this.getSlotKey(id)) !== null) ||
           localStorage.getItem(LEGACY_KEY) !== null;
  },

  resetAll(): boolean {
    try {
      [1, 2, 3].forEach(id => localStorage.removeItem(this.getSlotKey(id)));
      localStorage.removeItem(LEGACY_KEY);
      return true;
    } catch (e) {
      console.error('Error resetting all games:', e);
      return false;
    }
  }
};
