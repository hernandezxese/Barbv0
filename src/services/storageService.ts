/**
 * Storage Service for Crónicas Elementales del Sur
 * Supports 3 distinct save slots (Slot 1, Slot 2, Slot 3) with timestamps,
 * party summary, region location, and backwards-compatible migration across all 5 regions.
 */

import { BarbaraHero, SpiritCreature, InventoryItem, RegionId } from '../types/game';

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
  hasCompletedStory?: boolean;
}

const SLOT_KEY_PREFIX = 'barbara_cronicas_slot_';
const LEGACY_KEY = 'barbara_cronicas_elementales_save_v1';

function migrateRegionId(id: string): RegionId {
  if (id === 'pucon') return 'araucania';
  if (id === 'villarrica') return 'losrios';
  if (id === 'hornopiren') return 'loslagos';
  if (id === 'casa' || id === 'santiago' || id === 'biobio' || id === 'araucania' || id === 'losrios' || id === 'loslagos') {
    return id;
  }
  return 'santiago';
}

export const storageService = {
  getSlotKey(slotId: number): string {
    return `${SLOT_KEY_PREFIX}${slotId}`;
  },

  saveGame(slotId: number, data: Omit<SavedGameData, 'version' | 'savedAt' | 'slotId'>): boolean {
    try {
      const payload: SavedGameData = {
        ...data,
        slotId,
        version: 4,
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
        new Set((parsed.unlockedRegions || ['santiago']).map(migrateRegionId))
      );
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
