/**
 * System / Options Menu Modal
 * Features:
 * - Current Quest Step + Pending Missions Subsection for the Current Region (showing required Spirit Element)
 * - Profile/Medals, Locked Evolution Sanctuary notice (Temples only in Stages 2 & 4),
 *   Bestiary, Save/Load (3 slots), Guide, Audio, and Reset.
 */

import React from 'react';
import { sound } from '../services/audioService';
import { MapRegion, RegionId, SpiritCreature } from '../types/game';
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
  BookMarked,
  Settings,
  Award,
  ListChecks,
} from 'lucide-react';

interface SystemMenuModalProps {
  currentRegion: MapRegion;
  unlockedRegions: RegionId[];
  partySpirits?: SpiritCreature[];
  medals?: string[];
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
  partySpirits = [],
  medals = [],
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
  const currentQuest = getCurrentQuest(currentRegion, unlockedRegions, partySpirits, medals);
  const pendingMissions = getRegionPendingMissions(currentRegion, partySpirits, medals);

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-[#F4F4F2] border-2 border-stone-300 text-[#1E2022] rounded-2xl p-3.5 sm:p-4 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 font-mono text-xs max-h-[96dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-300 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1E2022] text-[#F4F4F2] flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-silkscreen text-xs sm:text-sm text-[#1E2022]">MENÚ &amp; MISIONES</h2>
              <p className="text-[10px] text-stone-600">Misiones, perfil, bestiario y partidas</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="min-h-[40px] min-w-[40px] p-1.5 bg-[#E7E7E2] hover:bg-stone-300 text-[#1E2022] border border-stone-300 rounded-xl cursor-pointer active:scale-95 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Misión Actual (Destacada) */}
        <div className="mb-3 p-3 bg-amber-50 text-[#1E2022] border-2 border-amber-400 rounded-xl space-y-1 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1E2022] text-amber-300 font-silkscreen text-[8px] sm:text-[9px] uppercase font-bold truncate">
              <Target className="w-3 h-3 shrink-0" />
              <span className="truncate">OBJETIVO ACTUAL · {currentRegion.name.split('&')[0].trim()}</span>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {currentQuest.requiredElement && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-silkscreen font-bold flex items-center gap-1 ${ELEMENT_META[currentQuest.requiredElement].badgeClass}`}
                >
                  <span>{ELEMENT_META[currentQuest.requiredElement].icon}</span>
                  <span>REQ: {ELEMENT_META[currentQuest.requiredElement].label.toUpperCase()}</span>
                </span>
              )}
              {currentQuest.totalSteps > 0 && (
                <span className="px-1.5 py-0.5 bg-[#1E2022] text-[#F4F4F2] rounded text-[9px] font-silkscreen font-bold shrink-0 tabular-nums">
                  PASO {currentQuest.stepNumber}/{currentQuest.totalSteps}
                </span>
              )}
            </div>
          </div>
          <div className="font-silkscreen text-[11px] text-[#1E2022] font-bold leading-tight">{currentQuest.title}</div>
          <p className="text-[10px] font-ui font-medium text-stone-700 leading-snug">
            {currentQuest.instruction}
          </p>
        </div>

        {/* Subsección: Misiones Pendientes de la Región Actual */}
        <div className="mb-3 p-2.5 bg-[#E7E7E2] border border-stone-300 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-silkscreen text-[10px] text-[#1E2022] font-bold">
              <ListChecks className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>MISIONES PENDIENTES ({pendingMissions.length})</span>
            </span>
            <span className="text-[9px] text-stone-600">Región actual</span>
          </div>

          {pendingMissions.length === 0 ? (
            <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-[10px] text-emerald-800 font-bold">
              ¡Todas las misiones de esta región fueron completadas!
            </div>
          ) : (
            <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
              {pendingMissions.map(mission => {
                const elemMeta = mission.requiredElement ? ELEMENT_META[mission.requiredElement] : null;
                return (
                  <div
                    key={mission.id}
                    className="p-2 bg-[#F4F4F2] border border-stone-300 rounded-lg flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-silkscreen text-[9px] sm:text-[10px] text-[#1E2022] font-bold truncate">
                        {mission.title}
                      </span>
                      {elemMeta && (
                        <span
                          className={`px-1.5 py-0.5 rounded font-silkscreen text-[8px] font-bold shrink-0 flex items-center gap-1 ${elemMeta.badgeClass}`}
                        >
                          <span>{elemMeta.icon}</span>
                          <span>{elemMeta.label.toUpperCase()}</span>
                        </span>
                      )}
                      {!elemMeta && mission.isBossMission && (
                        <span className="px-1.5 py-0.5 bg-[#1E2022] text-[#F4F4F2] rounded font-silkscreen text-[8px] shrink-0">
                          ⚔️ GUARDIÁN
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-stone-600 leading-snug">{mission.detail}</p>
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
            className="w-full min-h-[44px] p-2.5 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-[0.99] shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1E2022] text-[#F4F4F2] flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="font-silkscreen text-[11px] text-[#1E2022] font-bold">
                  PERFIL Y AMULETOS
                </div>
                <div className="text-[9px] text-stone-600">
                  Tiempo jugado, escenarios, habilidades y {medalsCount}/5 Amuletos
                </div>
              </div>
            </div>
            <span className="px-1.5 py-0.5 bg-emerald-700 text-white rounded text-[9px] font-bold tabular-nums">
              {medalsCount}/5
            </span>
          </button>

          <button
            onClick={() => {
              sound.playSelect();
              onClose();
              onOpenBestiary();
            }}
            className="w-full min-h-[44px] p-2.5 bg-[#E7E7E2] hover:bg-stone-200 border border-stone-300 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F4F4F2] border border-stone-300 flex items-center justify-center text-[#1E2022] shrink-0">
                <BookMarked className="w-4 h-4" />
              </div>
              <div>
                <div className="font-silkscreen text-[11px] text-[#1E2022] font-bold">BESTIARIO</div>
                <div className="text-[9px] text-stone-600">Especies vistas, vinculadas y evoluciones</div>
              </div>
            </div>
            <span className="text-stone-600 font-bold">&rarr;</span>
          </button>

          <button
            onClick={() => {
              sound.playConfirm();
              onClose();
              onOpenSaveLoad();
            }}
            className="w-full min-h-[44px] p-2.5 bg-[#E7E7E2] hover:bg-stone-200 border border-stone-300 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F4F4F2] border border-stone-300 flex items-center justify-center text-[#1E2022] shrink-0">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="font-silkscreen text-[11px] text-[#1E2022] font-bold">GUARDAR / CARGAR (3 RANURAS)</div>
                <div className="text-[9px] text-stone-600">Guarda o carga tu progreso en memoria</div>
              </div>
            </div>
            <span className="text-stone-600 font-bold">&rarr;</span>
          </button>

          <button
            onClick={() => {
              sound.playSelect();
              onClose();
              onOpenGuide();
            }}
            className="w-full min-h-[44px] p-2.5 bg-[#E7E7E2] hover:bg-stone-200 border border-stone-300 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F4F4F2] border border-stone-300 flex items-center justify-center text-[#1E2022] shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="font-silkscreen text-[11px] text-[#1E2022] font-bold">GUÍA, OBJETIVOS Y CÓMO JUGAR</div>
                <div className="text-[9px] text-stone-600">0% camino / 6%-16% fuera, habilidades y evasión</div>
              </div>
            </div>
            <span className="text-stone-600 font-bold">&rarr;</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              onClick={() => {
                sound.init();
                onToggleMute();
              }}
              className="min-h-[40px] p-2 bg-[#E7E7E2] hover:bg-stone-200 border border-stone-300 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-red-600 shrink-0" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              )}
              <span className="font-silkscreen text-[10px] text-[#1E2022] font-bold truncate">
                {isMuted ? 'MUTE' : 'SONIDO'}
              </span>
            </button>

            <button
              onClick={() => {
                sound.playCancel();
                onClose();
                onRequestReset();
              }}
              className="min-h-[40px] p-2 bg-red-50 hover:bg-red-100 border border-red-300 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-700 shrink-0" />
              <span className="font-silkscreen text-[10px] text-red-700 font-bold">REINICIAR</span>
            </button>
          </div>
        </div>

        {/* Physical Shops & Hospitals Note */}
        <div className="mt-3 p-2.5 bg-[#E7E7E2] border border-stone-300 rounded-xl text-[9px] text-stone-700 flex items-start gap-2">
          <ShoppingBag className="w-3.5 h-3.5 text-[#1E2022] shrink-0 mt-0.5" />
          <span>
            Tiendas en <strong className="text-[#1E2022]">Stages 1, 3 y 5</strong>. Hospitales y Santuarios en <strong className="text-[#1E2022]">Stages 2 y 4</strong>.
          </span>
        </div>
      </div>
    </div>
  );
};
