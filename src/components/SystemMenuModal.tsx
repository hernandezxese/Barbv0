/**
 * System / Options Menu Modal
 * Monochrome light/black/gray design consolidating Missions, Evolution Sanctuary, Bestiary, Save/Load (3 slots), Reset, Audio, and Guide.
 * Physical shops live inside Stage 1 (RM), Stage 3 (Araucanía), and Stage 5 (Los Lagos).
 */

import React from 'react';
import { sound } from '../services/audioService';
import { MapRegion, RegionId } from '../types/game';
import { getCurrentQuest } from '../data/questData';
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
} from 'lucide-react';

interface SystemMenuModalProps {
  currentRegion: MapRegion;
  unlockedRegions: RegionId[];
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSaveLoad: () => void;
  onOpenEvolution: () => void;
  onOpenBestiary: () => void;
  onRequestReset: () => void;
  onOpenGuide: () => void;
  onClose: () => void;
}

export const SystemMenuModal: React.FC<SystemMenuModalProps> = ({
  currentRegion,
  unlockedRegions,
  isMuted,
  onToggleMute,
  onOpenSaveLoad,
  onOpenEvolution,
  onOpenBestiary,
  onRequestReset,
  onOpenGuide,
  onClose,
}) => {
  const currentQuest = getCurrentQuest(currentRegion, unlockedRegions);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/88 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-zinc-900 border-2 border-zinc-600 rounded-2xl p-4 sm:p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150 font-mono text-xs max-h-[92dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-silkscreen text-sm text-zinc-100">MENÚ &amp; MISIONES</h2>
              <p className="text-[10px] text-zinc-400">Objetivos, santuario, partidas y ajustes</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Misión Actual */}
        <div className="mb-4 p-3.5 bg-zinc-100 text-zinc-950 border-2 border-zinc-300 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-silkscreen text-[10px] text-zinc-800 uppercase font-bold">
              <Target className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
              <span className="truncate">Misión ({currentRegion.name.split('&')[0].trim()})</span>
            </span>
            <span className="px-2 py-0.5 bg-zinc-950 text-zinc-100 rounded text-[9px] font-silkscreen font-bold shrink-0">
              PASO {currentQuest.stepNumber}/{currentQuest.totalSteps}
            </span>
          </div>
          <div className="font-silkscreen text-xs text-zinc-950 font-bold">{currentQuest.title}</div>
          <p className="text-[11px] font-ui text-zinc-800 leading-relaxed">
            {currentQuest.instruction}
          </p>
          <p className="text-[10px] text-zinc-700 pt-1 border-t border-zinc-300">
            Consejo: {currentQuest.hint}
          </p>
        </div>

        {/* Menu Buttons Grid */}
        <div className="space-y-2">
          <button
            onClick={() => {
              sound.playSelect();
              onClose();
              onOpenEvolution();
            }}
            className="w-full p-2.5 sm:p-3 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-600 flex items-center justify-center text-zinc-100 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-silkscreen text-[11px] sm:text-xs text-zinc-100">
                  SANTUARIO DE EVOLUCIÓN
                </div>
                <div className="text-[10px] text-zinc-400">
                  Evoluciona espíritus con esencias
                </div>
              </div>
            </div>
            <span className="text-zinc-400 group-hover:text-white">&rarr;</span>
          </button>

          <button
            onClick={() => {
              sound.playSelect();
              onClose();
              onOpenBestiary();
            }}
            className="w-full p-2.5 sm:p-3 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-600 flex items-center justify-center text-zinc-100 shrink-0">
                <BookMarked className="w-4 h-4" />
              </div>
              <div>
                <div className="font-silkscreen text-[11px] sm:text-xs text-zinc-100">
                  BESTIARIO (POKÉDEX)
                </div>
                <div className="text-[10px] text-zinc-400">
                  Especies nativas, dinosaurios y lore
                </div>
              </div>
            </div>
            <span className="text-zinc-400 group-hover:text-white">&rarr;</span>
          </button>

          <button
            onClick={() => {
              sound.playConfirm();
              onClose();
              onOpenSaveLoad();
            }}
            className="w-full p-2.5 sm:p-3 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-600 flex items-center justify-center text-zinc-100 shrink-0">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="font-silkscreen text-[11px] sm:text-xs text-zinc-100">
                  GUARDAR / CARGAR (3 RANURAS)
                </div>
                <div className="text-[10px] text-zinc-400">
                  Guarda o carga tu progreso en memoria
                </div>
              </div>
            </div>
            <span className="text-zinc-400 group-hover:text-white">&rarr;</span>
          </button>

          <button
            onClick={() => {
              sound.playSelect();
              onClose();
              onOpenGuide();
            }}
            className="w-full p-2.5 sm:p-3 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-600 flex items-center justify-center text-zinc-100 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="font-silkscreen text-[11px] sm:text-xs text-zinc-100">
                  GUÍA DE EXPEDICIÓN
                </div>
                <div className="text-[10px] text-zinc-400">
                  Reglas 5%/40%, elementos y controles móviles
                </div>
              </div>
            </div>
            <span className="text-zinc-400 group-hover:text-white">&rarr;</span>
          </button>

          <button
            onClick={() => {
              sound.init();
              onToggleMute();
            }}
            className="w-full p-2.5 sm:p-3 bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-600 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-600 flex items-center justify-center text-zinc-100 shrink-0">
                {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-zinc-100" />}
              </div>
              <div>
                <div className="font-silkscreen text-[11px] sm:text-xs text-zinc-100">
                  AUDIO Y SONIDOS
                </div>
                <div className="text-[10px] text-zinc-400">
                  {isMuted ? 'Sonido silenciado' : 'Sonido Chiptune activado'}
                </div>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isMuted ? 'bg-zinc-950 text-zinc-400 border border-zinc-700' : 'bg-zinc-100 text-zinc-950 border border-zinc-300'}`}>
              {isMuted ? 'MUTE' : 'ACTIVO'}
            </span>
          </button>

          <button
            onClick={() => {
              sound.playCancel();
              onClose();
              onRequestReset();
            }}
            className="w-full p-2.5 sm:p-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-between text-left cursor-pointer transition-all group active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <div className="font-silkscreen text-[11px] sm:text-xs text-zinc-200">
                  REINICIAR PARTIDA
                </div>
                <div className="text-[10px] text-zinc-500">
                  Restablecer todo y empezar desde cero
                </div>
              </div>
            </div>
            <span className="text-zinc-500">&rarr;</span>
          </button>
        </div>

        {/* Note on Physical Shops */}
        <div className="mt-3.5 p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] text-zinc-300 flex items-start gap-2.5">
          <ShoppingBag className="w-4 h-4 text-zinc-200 flex-shrink-0 mt-0.5" />
          <p>
            Las tiendas físicas se encuentran en <strong className="text-zinc-100">Stage 1 (RM · Don Manuel)</strong>, <strong className="text-zinc-100">Stage 3 (La Araucanía · Doña Millaray)</strong> y <strong className="text-zinc-100">Stage 5 (Los Lagos · Doña Fresia)</strong>.
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-zinc-100 hover:bg-white rounded-xl text-zinc-950 font-silkscreen font-bold text-xs cursor-pointer active:scale-95"
          >
            Volver al Juego
          </button>
        </div>
      </div>
    </div>
  );
};
