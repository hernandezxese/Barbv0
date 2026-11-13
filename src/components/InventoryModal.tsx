/**
 * Inventory Modal for Bárbara: Crónicas Elementales del Sur
 * Displays Chilean remedies, evolution catalysts, capture orbs, and allows item usage on party spirits
 */

import React, { useState } from 'react';
import { InventoryItem, SpiritCreature } from '../types/game';
import { sound } from '../services/audioService';
import { Backpack, ChevronLeft, Sparkles, Heart } from 'lucide-react';

interface InventoryModalProps {
  inventory: Record<string, InventoryItem>;
  partySpirits: SpiritCreature[];
  onUseItemOnSpirit: (itemId: string, spiritUid: string) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  partySpirits,
  onUseItemOnSpirit,
  onClose
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('matico');
  const [showTargetSelect, setShowTargetSelect] = useState(false);

  const itemsList = Object.values(inventory).filter(item => item.count > 0);
  const selectedItem = inventory[selectedItemId] || itemsList[0];

  const canApplyDirectToSpirit = Boolean(
    selectedItem && (selectedItem.category === 'curativo' || selectedItem.effectType === 'level_up')
  );

  const handleUseItemClick = () => {
    if (!selectedItem || selectedItem.count <= 0) return;
    if (canApplyDirectToSpirit) {
      sound.playSelect();
      setShowTargetSelect(true);
    } else {
      sound.playSelect();
    }
  };

  const handleApplyToSpirit = (spiritUid: string) => {
    sound.playHeal();
    onUseItemOnSpirit(selectedItem.id, spiritUid);
    setShowTargetSelect(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#E7E7E2]/98 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-3 sm:p-4 md:p-6 text-[#1E2022]">
      {/* Header */}
      <div className="max-w-4xl w-full mx-auto flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-stone-300">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="min-h-[40px] px-3 py-2 bg-[#F4F4F2] hover:bg-white border border-stone-300 rounded-xl text-[#1E2022] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div>
            <h2 className="font-pixel text-xs sm:text-sm md:text-base text-[#1E2022] flex items-center gap-2">
              <Backpack className="w-4 h-4 text-[#1E2022] shrink-0" />
              <span>MOCHILA DE EXPEDICIÓN</span>
            </h2>
            <p className="text-[11px] text-stone-600 font-mono hidden sm:block">Remedios tradicionales chilenos, amuletos y catalizadores de evolución</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl w-full mx-auto my-6 flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Items list */}
        <div className="md:col-span-7 flex flex-col gap-2">
          <span className="font-pixel text-[11px] text-stone-600 mb-1">OBJETOS DISPONIBLES:</span>
          {itemsList.length === 0 ? (
            <div className="p-8 text-center bg-[#F4F4F2] border-2 border-stone-300 rounded-2xl text-stone-600 font-mono text-xs">
              Tu mochila está vacía. Abre cofres en las regiones o visita vendedores en Etapas 1, 3 y 5.
            </div>
          ) : (
            itemsList.map((item) => {
              const isSelected = item.id === selectedItem?.id;
              const isKeyItem = item.category === 'clave' || item.category === 'esencia' || item.effectType === 'resonance';
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playSelect();
                    setSelectedItemId(item.id);
                    setShowTargetSelect(false);
                  }}
                  className={`min-h-[56px] p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? isKeyItem
                        ? 'bg-amber-50 border-amber-500 shadow-md'
                        : 'bg-white border-[#1E2022] shadow-md'
                      : isKeyItem
                      ? 'bg-amber-50/70 border-amber-300 hover:border-amber-500'
                      : 'bg-[#F4F4F2] border-stone-300 hover:border-stone-500'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <span
                        className={`font-pixel text-xs block truncate ${
                          isKeyItem ? 'text-amber-900 font-bold' : 'text-[#1E2022]'
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className={`text-[11px] font-mono capitalize ${isKeyItem ? 'text-amber-800' : 'text-stone-600'}`}>
                        {isKeyItem ? `★ Clave · ${item.category}` : item.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md shrink-0 tabular-nums ${
                      isKeyItem ? 'bg-amber-200 text-amber-950 border border-amber-400' : 'text-[#F4F4F2] bg-[#1E2022]'
                    }`}
                  >
                    x{item.count}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Selected Item Details & Usage */}
        {selectedItem && (
          <div className="md:col-span-5 bg-[#F4F4F2] border-2 border-stone-300 rounded-2xl p-5 flex flex-col justify-between shadow-md">
            <div>
              <div className="text-center p-4 bg-[#E7E7E2] rounded-xl border border-stone-300 mb-4">
                <span className="text-4xl block mb-2">{selectedItem.icon}</span>
                <h3
                  className={`font-pixel text-sm ${
                    selectedItem.category === 'clave' || selectedItem.category === 'esencia' || selectedItem.effectType === 'resonance'
                      ? 'text-amber-900 font-bold'
                      : 'text-[#1E2022]'
                  }`}
                >
                  {selectedItem.name}
                </h3>
                <span className="text-[11px] font-mono text-stone-700 font-bold block mt-1">Cantidad: {selectedItem.count}</span>
              </div>

              <p className="text-xs text-stone-700 font-mono leading-relaxed mb-4">
                {selectedItem.description}
              </p>

              {/* Target selection if using healing or level-up item */}
              {showTargetSelect ? (
                <div className="space-y-2 mb-4 animate-in fade-in duration-150">
                  <span className="font-pixel text-[10px] text-[#1E2022] block mb-1">ELIGE A QUIÉN APLICAR:</span>
                  {partySpirits.map((spirit) => {
                    const lowHp = spirit.currentHp <= Math.round(spirit.maxHp * 0.25);
                    return (
                      <button
                        key={spirit.uid}
                        onClick={() => handleApplyToSpirit(spirit.uid)}
                        className="min-h-[44px] w-full p-2.5 bg-white hover:bg-emerald-50 border border-stone-300 hover:border-emerald-500 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="font-pixel text-[11px] text-[#1E2022] truncate pr-2">
                          {spirit.name} <span className="text-amber-800">Nv.{spirit.level}</span>
                        </span>
                        <span className={`font-mono text-xs font-bold shrink-0 tabular-nums ${lowHp ? 'text-red-700' : 'text-emerald-700'}`}>
                          {spirit.currentHp}/{spirit.maxHp} PS
                        </span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setShowTargetSelect(false)}
                    className="min-h-[40px] w-full py-1.5 text-stone-600 hover:text-[#1E2022] text-xs font-mono font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : canApplyDirectToSpirit ? (
                <button
                  onClick={handleUseItemClick}
                  className={`min-h-[44px] w-full py-3 rounded-xl font-pixel text-xs font-bold tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 ${
                    selectedItem.effectType === 'level_up'
                      ? 'bg-[#1E2022] hover:bg-zinc-800 text-[#F4F4F2]'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {selectedItem.effectType === 'level_up' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <Heart className="w-4 h-4" />
                  )}
                  <span>
                    {selectedItem.effectType === 'level_up'
                      ? `USAR (+${selectedItem.effectValue} NIVEL)`
                      : 'USAR EN CRIATURA ESPIRITUAL'}
                  </span>
                </button>
              ) : selectedItem.category === 'esencia' ? (
                <div className="p-3 bg-[#E7E7E2] border border-stone-300 rounded-xl text-center text-xs font-mono text-stone-700">
                  Lleva este catalizador a un <span className="font-bold text-[#1E2022]">Templo de Evolución</span> (Etapas 2 y 4) para despertar a tus Criaturas Espirituales.
                </div>
              ) : (
                <div className="p-3 bg-[#E7E7E2] border border-stone-300 rounded-xl text-center text-xs font-mono text-stone-700">
                  Se usa directamente en combate mediante el comando <span className="font-bold text-[#1E2022]">Vincular</span>.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-4xl w-full mx-auto pt-3 border-t border-stone-300 text-center text-[11px] font-mono text-stone-600">
        Encuentra más remedios medicinales y esencias explorando las 5 regiones de Chile.
      </div>
    </div>
  );
};
