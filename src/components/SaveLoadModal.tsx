/**
 * Save & Load Modal with 3 Slots
 * Bárbara: Crónicas Elementales del Sur
 */

import React, { useState, useEffect } from 'react';
import { storageService, SlotSummary } from '../services/storageService';
import { sound } from '../services/audioService';
import { RegionId } from '../types/game';
import { Save, FolderOpen, Trash2, X, CheckCircle2, Compass } from 'lucide-react';

interface SaveLoadModalProps {
  mode: 'save' | 'load' | 'manage';
  onSaveSlot: (slotId: number) => void;
  onLoadSlot: (slotId: number) => void;
  onClose: () => void;
}

const REGION_NAMES: Record<RegionId, string> = {
  casa: 'Casa del Guardián (Escenario 0)',
  santiago: 'Región Metropolitana (Etapa 1)',
  biobio: 'Región del Biobío (Etapa 2)',
  araucania: 'Región de La Araucanía (Etapa 3)',
  losrios: 'Región de Los Ríos (Etapa 4)',
  loslagos: 'Región de Los Lagos (Etapa 5)',
};

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  mode,
  onSaveSlot,
  onLoadSlot,
  onClose,
}) => {
  const [slots, setSlots] = useState<(SlotSummary | null)[]>([]);
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState<number | null>(null);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const refreshSlots = () => {
    setSlots(storageService.getAllSlots());
  };

  useEffect(() => {
    refreshSlots();
  }, []);

  const handleSave = (slotId: number) => {
    sound.playConfirm();
    onSaveSlot(slotId);
    refreshSlots();
    setActiveMessage(`¡Partida guardada exitosamente en la Ranura ${slotId}!`);
    setTimeout(() => setActiveMessage(null), 3000);
  };

  const handleLoad = (slotId: number) => {
    sound.playConfirm();
    onLoadSlot(slotId);
  };

  const handleDelete = (slotId: number) => {
    sound.playCancel();
    storageService.deleteSlot(slotId);
    setConfirmDeleteSlot(null);
    refreshSlots();
    setActiveMessage(`Ranura ${slotId} eliminada.`);
    setTimeout(() => setActiveMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/88 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-zinc-900 border-2 border-zinc-400/70 rounded-2xl p-4 sm:p-6 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-300 flex items-center justify-center text-zinc-950 shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-silkscreen text-xs sm:text-base text-zinc-100 truncate">
                {mode === 'load' ? 'CARGAR PARTIDA (3 RANURAS)' : 'GUARDAR / CARGAR (3 RANURAS)'}
              </h2>
              <p className="text-[10px] sm:text-[11px] font-mono text-zinc-400 truncate">
                {mode === 'load'
                  ? 'Elige una ranura guardada para continuar tu viaje'
                  : 'Guarda, carga o administra tus archivos de aventura'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg cursor-pointer transition-colors shrink-0 active:scale-95 border border-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback message banner */}
        {activeMessage && (
          <div className="mb-3 p-2.5 bg-zinc-800 border border-zinc-400 rounded-xl text-zinc-100 font-mono text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-zinc-200 flex-shrink-0" />
            <span>{activeMessage}</span>
          </div>
        )}

        {/* 3 Slots List */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {[1, 2, 3].map(slotId => {
            const slot = slots[slotId - 1];
            const isFilled = slot !== null;

            return (
              <div
                key={slotId}
                className={`p-3 sm:p-3.5 rounded-xl border-2 transition-all ${
                  isFilled
                    ? 'bg-zinc-950/80 border-zinc-700 hover:border-zinc-400'
                    : 'bg-zinc-950/40 border-dashed border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Slot Header info */}
                  <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-zinc-200 border border-zinc-400 flex items-center justify-center font-silkscreen text-xs text-zinc-950 font-bold flex-shrink-0">
                      #{slotId}
                    </div>

                    <div className="min-w-0">
                      {isFilled ? (
                        <>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="font-silkscreen text-xs text-zinc-100 truncate">
                              {slot.barbaraName} &middot; {slot.leaderSpiritIcon} {slot.leaderSpiritName}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-zinc-800 text-zinc-200 rounded border border-zinc-600">
                              Nv. {slot.barbaraLevel}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-300">
                              💰 {slot.gold}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-300 mt-0.5 flex items-center gap-1">
                            <Compass className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span className="truncate">{REGION_NAMES[slot.regionId] || slot.regionId}</span>
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 mt-1">
                            {new Date(slot.savedAt).toLocaleString()} &middot; {slot.spiritCount} espíritus
                          </div>
                        </>
                      ) : (
                        <div className="py-1">
                          <span className="font-silkscreen text-xs text-zinc-500 italic">
                            [ Ranura {slotId} Vacía ]
                          </span>
                          <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                            {mode === 'load' ? 'Sin datos guardados.' : 'Disponible para guardar tu aventura actual.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for this slot */}
                  <div className="flex items-center gap-2 justify-end shrink-0">
                    {mode !== 'load' && (
                      <button
                        onClick={() => handleSave(slotId)}
                        className="px-3 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors active:scale-95"
                        title={`Guardar partida actual en Ranura ${slotId}`}
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar</span>
                      </button>
                    )}

                    {isFilled && (
                      <button
                        onClick={() => handleLoad(slotId)}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-600 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors active:scale-95"
                        title={`Cargar datos de Ranura ${slotId}`}
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Cargar</span>
                      </button>
                    )}

                    {isFilled && (
                      <>
                        {confirmDeleteSlot === slotId ? (
                          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-400">
                            <button
                              onClick={() => handleDelete(slotId)}
                              className="px-2 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded font-mono text-[10px] font-bold cursor-pointer"
                            >
                              Borrar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteSlot(null)}
                              className="px-1.5 py-1.5 text-zinc-400 hover:text-white font-mono text-[10px] cursor-pointer"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteSlot(slotId)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 rounded-lg cursor-pointer transition-colors border border-zinc-700"
                            title="Borrar ranura"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-200 font-mono text-xs font-bold cursor-pointer active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
