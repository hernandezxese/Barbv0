/**
 * System / Options Menu Modal
 * Features:
 * - Current Quest Step + Pending Missions Subsection for the Current Region (showing required Spirit Element)
 * - Profile/Medals, Locked Evolution Sanctuary notice (Temples only in Stages 2 & 4),
 *   Bestiary, Save/Load (3 slots), Guide, Audio, and Reset.
 */

import React from 'react';
import { sound } from '../services/audioService';
import { MapRegion, RegionId } from '../types/game';
import { getCurrentQuest, getRegionPendingMissions } from '../data/questData';
import { ELEMENT_META } from '../data/spiritsData';
import {
  FolderOpen,
  RotateCcw,
  BookOpen,
  Volume2,
  VolumeX,
  ShoppingBag,
  X,
  Target,
  Sparkles,
  BookMarked,
  Settings,
  Award,
  Lock,
  ListChecks,
} from 'lucide-react';

interface SystemMenuModalProps {
  currentRegion: MapRegion;
  unlockedRegions: RegionId[];
  isMuted: boolean;
  medalsCount?: number;
  onToggleMute: () => void;
  onOpenProfile: () => void;
  onOpenSaveLoad: () => void;
  onOpenBestiary: () => void;
  onRequestReset: () => void;
  onOpenGuide: () => void;
  onClose: () => void;
}

export const SystemMenuModal: React.FC<SystemMenuModalProps> = ({
  currentRegion,
  unlockedRegions,
  isMuted,
  medalsCount = 0,
  onToggleMute,
  onOpenProfile,
  onOpenSaveLoad,
  onOpenBestiary,
  onRequestReset,
  onOpenGuide,
  onClose,
}) => {
  const currentQuest = getCurrentQuest(currentRegion, unlockedRegions);
  const pendingMissions = getRegionPendingMissions(currentRegion);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/88 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-zinc-900 border-2 border-zinc-600 rounded-2xl p-3 sm:p-4 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 font-mono text-xs max-h-[96dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-silkscreen text-xs sm:text-sm text-zinc-100">MENÚ &amp; MISIONES</h2>
              <p className="text-[10px] text-zinc-400">Misiones, perfil, bestiario y partidas</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Misión Actual */}
        <div className="mb-2.5 p-2.5 bg-zinc-100 text-zinc-950 border border-zinc-300 rounded-xl space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 font-silkscreen text-[9px] sm:text-[10px] text-zinc-800 uppercase font-bold truncate">
              <Target className="w-3 h-3 text-zinc-900 shrink-0" />
              <span className="truncate">{currentRegion.name.split('&')[0].trim()}</span>
            </span>
            <span className="px-1.5 py-0.5 bg-zinc-950 text-zinc-100 rounded text-[9px] font-silkscreen font-bold shrink-0">
              PASO {currentQuest.stepNumber}/{currentQuest.totalSteps}
            </span>
          </div>
          <div className="font-silkscreen text-[11px] text-zinc-950 font-bold leading-tight">{currentQuest.title}</div>
          <p className="text-[10px] font-ui text-zinc-800 leading-snug">
            {currentQuest.instruction}
          </p>
        </div>

        {/* Subsección: Misiones Pendientes de la Región Actual */}
        <div className="mb-2.5 p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-silkscreen text-[10px] text-zinc-100">
              <ListChecks className="w-3.5 h-3.5 text-zinc-200 shrink-0" />
              <span>MISIONES PENDIENTES ({pendingMissions.length})</span>
            </span>
            <span className="text-[9px] text-zinc-400">Región actual</span>
          </div>

          {pendingMissions.length === 0 ? (
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-300">
              ¡Todas las misiones de esta región fueron completadas!
            </div>
          ) : (
            <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
              {pendingMissions.map(mission => {
                const elemMeta = mission.requiredElement ? ELEMENT_META[mission.requiredElement] : null;
                return (
                  <div
                    key={mission.id}
                    className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-silkscreen text-[9px] sm:text-[10px] text-zinc-100 truncate">
                        {mission.title}
                      </span>
                      {elemMeta && (
                        <span className="px-1.5 py-0.2 bg-zinc-100 text-zinc-950 rounded font-silkscreen text-[8px] font-bold shrink-0 flex items-center gap-1">
                          <span>{elemMeta.icon}</span>
                          <span>{elemMeta.label.toUpperCase()}</span>
                        </span>
                      )}
                      {!elemMeta && mission.isBossMission && (
                        <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-600 text-zinc-200 rounded font-silkscreen text-[8px] shrink-0">
                          ⚔️ GUARDIÁN
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-zinc-400 leading-snug">{mission.detail}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Menu Buttons Grid */}
        <div className="space-y-1.5">
          <button
            onClick={() => {
              sound.playSelect();
              onClose();
              onOpenProfile();
            }}
            className="w-full p-2 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-500 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="font-silkscreen text-[11px] text-zinc-100">
                  PERFIL Y MEDALLAS
                </div>
                <div className="text-[9px] text-zinc-400">
                  Estadísticas, Bestiario y {medalsCount}/5 Medallas
                </div>
              </div>
            </div>
            <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-950 rounded text-[9px] font-bold">
              {medalsCount}/5
            </span>
          </button>

          {/* Evolution Sanctuary: Strictly Disabled from Menu (Temples only in Stages 2 & 4) */}
          <button
            disabled
            className="w-full p-2 bg-zinc-950/90 border border-zinc-800 rounded-xl flex items-center justify-between text-left opacity-65 cursor-not-allowed"
            title="La evolución solo se puede activar en los Templos de Evolución (Stages 2 y 4)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="font-silkscreen text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <span className="truncate">SANTUARIO DE EVOLUCIÓN</span>
                </div>
                <div className="text-[9px] text-zinc-500 truncate">
                  Solo en Templos físicos (Stages 2 y 4)
                </div>
              </div>
            </div>
            <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[8px] font-silkscreen text-zinc-400 flex items-center gap-1 shrink-0">
              <Lock className="w-2.5 h-2.5" /> TEMPLO
            </span>
          </button>

          <button
            onClick={() => {
              sound.playSelect();
              onClose();
              onOpenBestiary();
            }}
            className="w-full p-2 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-600 flex items-center justify-center text-zinc-100 shrink-0">
                <BookMarked className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-silkscreen text-[11px] text-zinc-100">BESTIARIO (POKÉDEX)</div>
                <div className="text-[9px] text-zinc-400">Especies vistas, vinculadas y evoluciones</div>
              </div>
            </div>
            <span className="text-zinc-400">&rarr;</span>
          </button>

          <button
            onClick={() => {
              sound.playConfirm();
              onClose();
              onOpenSaveLoad();
            }}
            className="w-full p-2 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-600 flex items-center justify-center text-zinc-100 shrink-0">
                <FolderOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-silkscreen text-[11px] text-zinc-100">GUARDAR / CARGAR (3 RANURAS)</div>
                <div className="text-[9px] text-zinc-400">Guarda o carga tu progreso en memoria</div>
              </div>
            </div>
            <span className="text-zinc-400">&rarr;</span>
          </button>

          <button
            onClick={() => {
              sound.playSelect();
              onClose();
              onOpenGuide();
            }}
            className="w-full p-2 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-600 flex items-center justify-center text-zinc-100 shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="font-silkscreen text-[11px] text-zinc-100">GUÍA DE EXPEDICIÓN</div>
                <div className="text-[9px] text-zinc-400">Prob. 0% camino / 1%-3% fuera, mapa táctil</div>
              </div>
            </div>
            <span className="text-zinc-400">&rarr;</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              onClick={() => {
                sound.init();
                onToggleMute();
              }}
              className="p-2 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex items-center justify-between text-left cursor-pointer active:scale-[0.99]"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-zinc-100 shrink-0" />
                )}
                <span className="font-silkscreen text-[10px] text-zinc-100 truncate">
                  {isMuted ? 'MUTE' : 'SONIDO'}
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                sound.playCancel();
                onClose();
                onRequestReset();
              }}
              className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
              <span className="font-silkscreen text-[10px] text-zinc-200">REINICIAR</span>
            </button>
          </div>
        </div>

        {/* Physical Shops Note */}
        <div className="mt-2.5 p-2 bg-zinc-950 border border-zinc-800 rounded-xl text-[9px] text-zinc-300 flex items-start gap-2">
          <ShoppingBag className="w-3.5 h-3.5 text-zinc-200 shrink-0 mt-0.5" />
          <span>
            Tiendas en <strong className="text-zinc-100">Stages 1, 3 y 5</strong>. Hospitales y Templos de Evolución en <strong className="text-zinc-100">Stages 2 y 4</strong>.
          </span>
        </div>
      </div>
    </div>
  );
};
