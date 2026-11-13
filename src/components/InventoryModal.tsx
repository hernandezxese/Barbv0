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

  const handleUseItemClick = () => {
    if (!selectedItem || selectedItem.count <= 0) return;
    if (selectedItem.category === 'curativo') {
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
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-3 sm:p-4 md:p-6 text-zinc-100">
      {/* Header */}
      <div className="max-w-4xl w-full mx-auto flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div>
            <h2 className="font-pixel text-xs sm:text-sm md:text-base text-zinc-100 flex items-center gap-2">
              <Backpack className="w-4 h-4 text-zinc-200 shrink-0" />
              <span>MOCHILA DE EXPEDICIÓN</span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono hidden sm:block">Remedios tradicionales chilenos, orbes y catalizadores de evolución</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl w-full mx-auto my-6 flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Items list */}
        <div className="md:col-span-7 flex flex-col gap-2">
          <span className="font-pixel text-[11px] text-zinc-400 mb-1">OBJETOS DISPONIBLES:</span>
          {itemsList.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 font-mono text-xs">
              Tu mochila está vacía. Abre cofres en las regiones o visita vendedores en Etapas 1, 3 y 5.
            </div>
          ) : (
            itemsList.map((item) => {
              const isSelected = item.id === selectedItem?.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sound.playSelect();
                    setSelectedItemId(item.id);
                    setShowTargetSelect(false);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800 border-zinc-200 shadow-md'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <span className="font-pixel text-xs text-zinc-100 block">{item.name}</span>
                      <span className="text-[11px] font-mono text-zinc-400 capitalize">{item.category}</span>
                    </div>
                  </div>

                  <span className="font-mono text-xs text-zinc-950 font-bold bg-zinc-100 px-2 py-1 rounded-md">
                    x{item.count}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Selected Item Details & Usage */}
        {selectedItem && (
          <div className="md:col-span-5 bg-zinc-900 border border-zinc-700 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="text-center p-4 bg-zinc-950 rounded-xl border border-zinc-800 mb-4">
                <span className="text-4xl block mb-2">{selectedItem.icon}</span>
                <h3 className="font-pixel text-sm text-zinc-100">{selectedItem.name}</h3>
                <span className="text-[11px] font-mono text-zinc-300 block mt-1">Cantidad: {selectedItem.count}</span>
              </div>

              <p className="text-xs text-zinc-300 font-mono leading-relaxed mb-4">
                {selectedItem.description}
              </p>

              {/* Target selection if using healing item */}
              {showTargetSelect ? (
                <div className="space-y-2 mb-4 animate-in fade-in duration-150">
                  <span className="font-pixel text-[10px] text-zinc-200 block mb-1">ELIGE A QUIÉN APLICAR:</span>
                  {partySpirits.map((spirit) => (
                    <button
                      key={spirit.uid}
                      onClick={() => handleApplyToSpirit(spirit.uid)}
                      className="w-full p-2.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-300 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-pixel text-[11px] text-zinc-100">{spirit.name}</span>
                      <span className="font-mono text-xs text-zinc-300">
                        {spirit.currentHp}/{spirit.maxHp} PS
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowTargetSelect(false)}
                    className="w-full py-1.5 text-zinc-400 hover:text-zinc-200 text-xs font-mono cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : selectedItem.category === 'curativo' ? (
                <button
                  onClick={handleUseItemClick}
                  className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl font-pixel text-xs font-bold tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  <Heart className="w-4 h-4 text-zinc-900" />
                  <span>USAR EN UN ESPÍRITU</span>
                </button>
              ) : selectedItem.category === 'esencia' ? (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-xs font-mono text-zinc-300">
                  Lleva este catalizador al <span className="font-bold text-white">Santuario de Evolución</span> para despertar a tus espíritus.
                </div>
              ) : (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-xs font-mono text-zinc-300">
                  Se usa directamente en combate mediante el comando <span className="font-bold text-white">Vincular</span>.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-4xl w-full mx-auto pt-3 border-t border-zinc-800 text-center text-[11px] font-mono text-zinc-500">
        Encuentra más remedios medicinales y esencias explorando las 5 regiones de Chile.
      </div>
    </div>
  );
};
