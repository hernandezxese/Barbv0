/**
 * Party & Vínculo Ancestral Management Screen
 * Displays elemental icons beside every spirit's name for quick visual identification.
 */

import React, { useState, useRef, useEffect } from 'react';
import { SpiritCreature } from '../types/game';
import { ELEMENT_META } from '../data/spiritsData';
import { sound } from '../services/audioService';
import { drawCreatureSprite } from '../utils/pixelRenderer';
import { Swords, ChevronLeft, Crosshair } from 'lucide-react';

interface PartyMenuProps {
  partySpirits: SpiritCreature[];
  onSetLeaderSpirit: (spiritUid: string) => void;
  onClose: () => void;
}

export const PartyMenu: React.FC<PartyMenuProps> = ({
  partySpirits,
  onSetLeaderSpirit,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'spirits' | 'recruitment'>('spirits');
  const [selectedSpiritUid, setSelectedSpiritUid] = useState<string>(partySpirits[0]?.uid || '');
  const spiritCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedSpirit = partySpirits.find(s => s.uid === selectedSpiritUid) || partySpirits[0];

  useEffect(() => {
    let animId: number;
    let t = 0;
    const render = () => {
      t += 0.04;
      if (spiritCanvasRef.current && selectedSpirit) {
        const ctx = spiritCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 96, 96);
          ctx.imageSmoothingEnabled = false;
          drawCreatureSprite(ctx, selectedSpirit.baseId, selectedSpirit.currentStage, 6, 6, 84, t, false);
        }
      }
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [selectedSpirit?.uid, selectedSpirit?.baseId, selectedSpirit?.currentStage]);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-2.5 sm:p-4 text-zinc-100">
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto flex flex-wrap justify-between items-center gap-2 pb-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono active:scale-95 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <h2 className="font-pixel text-[11px] sm:text-sm text-zinc-100 flex items-center gap-1.5 truncate">
            <Swords className="w-4 h-4 text-zinc-200 shrink-0" />
            <span className="truncate">CRIATURAS ESPIRITUALES ({partySpirits.length})</span>
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 p-1 rounded-xl text-[10px] sm:text-[11px] font-mono">
          <button
            onClick={() => {
              sound.playSelect();
              setActiveTab('spirits');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'spirits' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Equipo
          </button>
          <button
            onClick={() => {
              sound.playSelect();
              setActiveTab('recruitment');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'recruitment' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Vínculo
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl w-full mx-auto my-2.5 flex-1">
        {activeTab === 'spirits' && (
          <div className="space-y-3">
            {/* SPIRITS LIST & DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 flex flex-col gap-1.5 max-h-56 md:max-h-80 overflow-y-auto pr-0.5">
                {partySpirits.map((spirit, idx) => {
                  const isSelected = spirit.uid === selectedSpirit?.uid;
                  const isLeader = idx === 0;
                  const primaryMeta = ELEMENT_META[spirit.primaryElement];
                  const secondaryMeta = spirit.secondaryElement ? ELEMENT_META[spirit.secondaryElement] : null;

                  return (
                    <button
                      key={spirit.uid}
                      onClick={() => {
                        sound.playSelect();
                        setSelectedSpiritUid(spirit.uid);
                      }}
                      className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800 border-zinc-200 shadow-md'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{spirit.evolutionLine[spirit.currentStage - 1]?.icon || '🌱'}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="text-xs shrink-0"
                              title={`Elemento ${primaryMeta.label}`}
                            >
                              {primaryMeta.icon}
                            </span>
                            {secondaryMeta && (
                              <span
                                className="text-[11px] shrink-0 -ml-1"
                                title={`Elemento secundario ${secondaryMeta.label}`}
                              >
                                {secondaryMeta.icon}
                              </span>
                            )}
                            <span className="font-pixel text-[11px] text-zinc-100 truncate">{spirit.name}</span>
                            {isLeader && (
                              <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-950 rounded text-[8px] font-mono font-bold shrink-0">
                                LÍDER
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-zinc-400 block truncate">
                            Nv.{spirit.level} · PS {spirit.currentHp}/{spirit.maxHp} · PM {spirit.currentMp}/{spirit.maxMp}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] uppercase font-mono text-zinc-300 font-bold shrink-0 flex items-center gap-1">
                        <span>{primaryMeta.icon}</span>
                        <span className="hidden sm:inline">{spirit.primaryElement}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedSpirit && (
                <div className="md:col-span-7 bg-zinc-900 border border-zinc-700 rounded-2xl p-3 sm:p-4">
                  <div className="flex justify-between items-start mb-2.5 pb-2 border-b border-zinc-800 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-600 shrink-0 flex items-center justify-center overflow-hidden">
                        <canvas ref={spiritCanvasRef} width={96} height={96} className="w-full h-full object-contain image-render-pixel" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] uppercase font-mono text-zinc-400 font-bold">
                            Etapa {selectedSpirit.currentStage}/{selectedSpirit.evolutionLine.length} · {selectedSpirit.rarity}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-600 text-[9px] font-mono text-zinc-200 flex items-center gap-1">
                            <span>{ELEMENT_META[selectedSpirit.primaryElement].icon}</span>
                            <span>{ELEMENT_META[selectedSpirit.primaryElement].label}</span>
                          </span>
                          {selectedSpirit.secondaryElement && (
                            <span className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-[9px] font-mono text-zinc-300 flex items-center gap-1">
                              <span>{ELEMENT_META[selectedSpirit.secondaryElement].icon}</span>
                              <span>{ELEMENT_META[selectedSpirit.secondaryElement].label}</span>
                            </span>
                          )}
                        </div>
                        <h3 className="font-pixel text-xs sm:text-sm text-zinc-100 truncate flex items-center gap-1.5 mt-0.5">
                          <span>{ELEMENT_META[selectedSpirit.primaryElement].icon}</span>
                          <span className="truncate">{selectedSpirit.name}</span>
                        </h3>
                        <p className="text-zinc-400 text-[10px] font-mono line-clamp-1">{selectedSpirit.lore}</p>
                      </div>
                    </div>

                    {partySpirits[0]?.uid !== selectedSpirit.uid && (
                      <button
                        onClick={() => {
                          sound.playConfirm();
                          onSetLeaderSpirit(selectedSpirit.uid);
                        }}
                        className="px-2.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-lg font-pixel text-[9px] cursor-pointer shrink-0 active:scale-95"
                      >
                        HACER LÍDER
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 mb-2.5 font-mono text-[10px]">
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-400 block text-[9px]">PS</span>
                      <span className="text-zinc-100 font-bold">{selectedSpirit.currentHp}/{selectedSpirit.maxHp}</span>
                    </div>
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-400 block text-[9px]">PM</span>
                      <span className="text-zinc-100 font-bold">{selectedSpirit.currentMp}/{selectedSpirit.maxMp}</span>
                    </div>
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-400 block text-[9px]">VEL</span>
                      <span className="text-zinc-100 font-bold">{selectedSpirit.speed}</span>
                    </div>
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-400 block text-[9px]">ATQ</span>
                      <span className="text-zinc-100 font-bold">{selectedSpirit.attack}</span>
                    </div>
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-400 block text-[9px]">DEF</span>
                      <span className="text-zinc-100 font-bold">{selectedSpirit.defense}</span>
                    </div>
                    <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-400 block text-[9px]">ATQ ESP</span>
                      <span className="text-zinc-100 font-bold">{selectedSpirit.spAttack}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-pixel text-[10px] text-zinc-400 mb-1.5 block">TÉCNICAS:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {selectedSpirit.skills.map(skill => (
                        <div key={skill.id} className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px]">
                          <div className="flex justify-between items-center gap-1">
                            <span className="font-bold text-zinc-100 truncate flex items-center gap-1">
                              <span>{ELEMENT_META[skill.element]?.icon || '✨'}</span>
                              <span className="truncate">{skill.name}</span>
                            </span>
                            <span className="font-mono text-zinc-300 shrink-0">{skill.mpCost} PM</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VÍNCULO ANCESTRAL */}
        {activeTab === 'recruitment' && (
          <div className="p-3.5 sm:p-5 bg-zinc-900 border border-zinc-600 rounded-2xl">
            <h3 className="font-pixel text-xs sm:text-sm text-zinc-100 mb-2 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-zinc-200" />
              VÍNCULO ANCESTRAL Y LÍDER ACTIVO
            </h3>
            <p className="text-[11px] text-zinc-300 font-mono leading-relaxed mb-3">
              Usa <strong className="text-white">Amuletos de Vínculo</strong> en batalla para reclutar criaturas. Si capturas una especie repetida, se convierte en <strong className="text-white">EXP extra</strong> para tu copia original.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-mono text-[11px]">
              <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-xl">
                <span className="text-zinc-100 font-bold font-pixel text-[10px] block mb-1">
                  1. LÍDER ACTIVO EN MAPA
                </span>
                <p className="text-zinc-300 text-[10px] leading-relaxed">
                  Solo tu <strong className="text-white">Criatura Espiritual Líder Activa</strong> puede usar su técnica elemental para despejar barreras bloqueadas en el mapa.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-xl">
                <span className="text-zinc-100 font-bold font-pixel text-[10px] block mb-1">
                  2. RELEVOS EN COMBATE
                </span>
                <p className="text-zinc-300 text-[10px] leading-relaxed">
                  Si tu líder cae en batalla puedes relevar a otra Criatura Espiritual sana de tu equipo sin perder el combate.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-xl">
                <span className="text-zinc-100 font-bold font-pixel text-[10px] block mb-1">
                  3. HOSPITALES Y TEMPLOS
                </span>
                <p className="text-zinc-300 text-[10px] leading-relaxed">
                  Cura gratis en tu Casa o en los Hospitales (Stages 2 y 4). Evoluciona <strong className="text-white">solo dentro de los Templos</strong> de Stages 2 y 4.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
