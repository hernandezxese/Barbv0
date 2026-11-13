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
    <div className="fixed inset-0 z-50 bg-[#E7E7E2]/98 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-2.5 sm:p-4 text-[#1E2022]">
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto flex flex-wrap justify-between items-center gap-2 pb-2.5 border-b border-stone-300">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="min-h-[40px] px-3 py-1.5 bg-[#F4F4F2] hover:bg-white border border-stone-300 rounded-xl text-[#1E2022] transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono font-bold active:scale-95 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <h2 className="font-pixel text-[11px] sm:text-sm text-[#1E2022] flex items-center gap-1.5 truncate">
            <Swords className="w-4 h-4 text-[#1E2022] shrink-0" />
            <span className="truncate">CRIATURAS ESPIRITUALES ({partySpirits.length})</span>
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-[#F4F4F2] border border-stone-300 p-1 rounded-xl text-[10px] sm:text-[11px] font-mono">
          <button
            onClick={() => {
              sound.playSelect();
              setActiveTab('spirits');
            }}
            className={`min-h-[36px] px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'spirits' ? 'bg-[#1E2022] text-[#F4F4F2] font-bold shadow-sm' : 'text-stone-600 hover:text-[#1E2022]'
            }`}
          >
            Equipo
          </button>
          <button
            onClick={() => {
              sound.playSelect();
              setActiveTab('recruitment');
            }}
            className={`min-h-[36px] px-3 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'recruitment' ? 'bg-[#1E2022] text-[#F4F4F2] font-bold shadow-sm' : 'text-stone-600 hover:text-[#1E2022]'
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
              <div className="md:col-span-5 flex flex-col gap-1.5 max-h-56 md:max-h-96 overflow-y-auto pr-0.5">
                {partySpirits.map((spirit, idx) => {
                  const isSelected = spirit.uid === selectedSpirit?.uid;
                  const isLeader = idx === 0;
                  const primaryMeta = ELEMENT_META[spirit.primaryElement];
                  const secondaryMeta = spirit.secondaryElement ? ELEMENT_META[spirit.secondaryElement] : null;
                  const hpPct = spirit.maxHp > 0 ? spirit.currentHp / spirit.maxHp : 0;
                  const isFainted = spirit.currentHp <= 0;
                  const isLowHp = !isFainted && hpPct <= 0.25;

                  return (
                    <div
                      key={spirit.uid}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        sound.playSelect();
                        setSelectedSpiritUid(spirit.uid);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          sound.playSelect();
                          setSelectedSpiritUid(spirit.uid);
                        }
                      }}
                      className={`min-h-[56px] p-2.5 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-white border-[#1E2022] shadow-md'
                          : isFainted
                          ? 'bg-red-50/70 border-red-300 hover:border-red-400'
                          : 'bg-[#F4F4F2] border-stone-300 hover:border-stone-500'
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
                            <span className="font-pixel text-[11px] text-[#1E2022] truncate">{spirit.name}</span>
                            {isLeader && (
                              <span className="px-1.5 py-0.5 bg-emerald-700 text-white rounded text-[8px] font-mono font-bold shrink-0">
                                ★ COMPAÑERO
                              </span>
                            )}
                            {isFainted && (
                              <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[8px] font-mono font-bold shrink-0">
                                K.O.
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-stone-600 block truncate">
                            Nv.{spirit.level} ·{' '}
                            <span className={isFainted || isLowHp ? 'text-red-700 font-bold' : 'text-emerald-700 font-bold'}>
                              PS {spirit.currentHp}/{spirit.maxHp}
                            </span>{' '}
                            · PM {spirit.currentMp}/{spirit.maxMp}
                          </span>
                          <div className="mt-1 flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-stone-300 rounded-full overflow-hidden max-w-[110px]">
                              <div
                                className="h-full bg-[#1E2022] transition-all"
                                style={{ width: `${Math.min(100, Math.round((spirit.exp / Math.max(1, spirit.maxExp)) * 100))}%` }}
                              />
                            </div>
                            <span className="text-[8px] font-mono text-stone-600 shrink-0 tabular-nums">
                              EXP {spirit.exp}/{spirit.maxExp}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isLeader && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              sound.playConfirm();
                              setSelectedSpiritUid(spirit.uid);
                              onSetLeaderSpirit(spirit.uid);
                            }}
                            title="Asignar como Compañero Espiritual"
                            className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#1E2022] hover:bg-zinc-800 text-[#F4F4F2] font-pixel text-[8px] font-bold shadow cursor-pointer active:scale-95 transition-all"
                          >
                            ★ Compañero
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedSpirit && (() => {
                const selHpPct = selectedSpirit.maxHp > 0 ? selectedSpirit.currentHp / selectedSpirit.maxHp : 0;
                const selHpDanger = selHpPct <= 0.25;
                return (
                  <div className="md:col-span-7 bg-[#F4F4F2] border-2 border-stone-300 rounded-2xl p-3 sm:p-4 shadow-md">
                    <div className="flex justify-between items-start mb-2.5 pb-2 border-b border-stone-300 gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-16 h-16 rounded-xl bg-zinc-900 border-2 border-stone-400 shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
                          <canvas ref={spiritCanvasRef} width={96} height={96} className="w-full h-full object-contain image-render-pixel" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] uppercase font-mono text-stone-600 font-bold">
                              Etapa {selectedSpirit.currentStage}/{selectedSpirit.evolutionLine.length} · {selectedSpirit.rarity}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 ${ELEMENT_META[selectedSpirit.primaryElement].badgeClass}`}>
                              <span>{ELEMENT_META[selectedSpirit.primaryElement].icon}</span>
                              <span>{ELEMENT_META[selectedSpirit.primaryElement].label}</span>
                            </span>
                            {selectedSpirit.secondaryElement && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 ${ELEMENT_META[selectedSpirit.secondaryElement].badgeClass}`}>
                                <span>{ELEMENT_META[selectedSpirit.secondaryElement].icon}</span>
                                <span>{ELEMENT_META[selectedSpirit.secondaryElement].label}</span>
                              </span>
                            )}
                          </div>
                          <h3 className="font-pixel text-xs sm:text-sm text-[#1E2022] truncate flex items-center gap-1.5 mt-0.5">
                            <span>{ELEMENT_META[selectedSpirit.primaryElement].icon}</span>
                            <span className="truncate">{selectedSpirit.name}</span>
                          </h3>
                          <p className="text-stone-600 text-[10px] font-mono line-clamp-1">{selectedSpirit.lore}</p>
                        </div>
                      </div>

                      {partySpirits[0]?.uid !== selectedSpirit.uid && (
                        <button
                          onClick={() => {
                            sound.playConfirm();
                            onSetLeaderSpirit(selectedSpirit.uid);
                          }}
                          className="min-h-[40px] px-3 py-1.5 bg-[#1E2022] hover:bg-zinc-800 text-[#F4F4F2] font-bold rounded-xl font-pixel text-[9px] cursor-pointer shrink-0 active:scale-95 shadow-sm"
                        >
                          HACER COMPAÑERO
                        </button>
                      )}
                    </div>

                    {/* EXP Progress Bar */}
                    <div className="mb-2.5 p-2.5 bg-[#E7E7E2] border border-stone-300 rounded-xl">
                      <div className="flex justify-between items-center text-[9px] font-mono text-[#1E2022] mb-1">
                        <span className="font-bold">EXP DE NIVEL {selectedSpirit.level}</span>
                        <span className="tabular-nums font-bold">
                          {selectedSpirit.exp} / {selectedSpirit.maxExp} ({Math.min(100, Math.round((selectedSpirit.exp / Math.max(1, selectedSpirit.maxExp)) * 100))}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-300 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1E2022] transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.round((selectedSpirit.exp / Math.max(1, selectedSpirit.maxExp)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 mb-2.5 font-mono text-[10px]">
                      <div className={`p-2 rounded-lg border ${selHpDanger ? 'bg-red-50 border-red-300' : 'bg-emerald-50 border-emerald-300'}`}>
                        <span className="text-stone-600 block text-[9px]">PS</span>
                        <span className={`font-bold tabular-nums ${selHpDanger ? 'text-red-700' : 'text-emerald-800'}`}>
                          {selectedSpirit.currentHp}/{selectedSpirit.maxHp}
                        </span>
                      </div>
                      <div className="p-2 bg-[#E7E7E2] border border-stone-300 rounded-lg">
                        <span className="text-stone-600 block text-[9px]">PM</span>
                        <span className="text-[#1E2022] font-bold tabular-nums">{selectedSpirit.currentMp}/{selectedSpirit.maxMp}</span>
                      </div>
                      <div className="p-2 bg-[#E7E7E2] border border-stone-300 rounded-lg">
                        <span className="text-stone-600 block text-[9px]">VEL</span>
                        <span className="text-[#1E2022] font-bold tabular-nums">{selectedSpirit.speed}</span>
                      </div>
                      <div className="p-2 bg-[#E7E7E2] border border-stone-300 rounded-lg">
                        <span className="text-stone-600 block text-[9px]">ATQ</span>
                        <span className="text-[#1E2022] font-bold tabular-nums">{selectedSpirit.attack}</span>
                      </div>
                      <div className="p-2 bg-[#E7E7E2] border border-stone-300 rounded-lg">
                        <span className="text-stone-600 block text-[9px]">DEF</span>
                        <span className="text-[#1E2022] font-bold tabular-nums">{selectedSpirit.defense}</span>
                      </div>
                      <div className="p-2 bg-[#E7E7E2] border border-stone-300 rounded-lg">
                        <span className="text-stone-600 block text-[9px]">ATQ ESP</span>
                        <span className="text-[#1E2022] font-bold tabular-nums">{selectedSpirit.spAttack}</span>
                      </div>
                    </div>

                    <div>
                      <span className="font-pixel text-[10px] text-stone-600 mb-1.5 block">TÉCNICAS:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {selectedSpirit.skills.map(skill => (
                          <div key={skill.id} className="p-2 bg-[#E7E7E2] border border-stone-300 rounded-lg text-[10px]">
                            <div className="flex justify-between items-center gap-1">
                              <span className="font-bold text-[#1E2022] truncate flex items-center gap-1">
                                <span>{ELEMENT_META[skill.element]?.icon || '✨'}</span>
                                <span className="truncate">{skill.name}</span>
                              </span>
                              <span className="font-mono text-stone-700 font-bold shrink-0 tabular-nums">{skill.mpCost} PM</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 2: VÍNCULO ANCESTRAL */}
        {activeTab === 'recruitment' && (
          <div className="p-3.5 sm:p-5 bg-[#F4F4F2] border-2 border-stone-300 rounded-2xl shadow-md">
            <h3 className="font-pixel text-xs sm:text-sm text-[#1E2022] mb-2 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-[#1E2022]" />
              VÍNCULO ANCESTRAL Y COMPAÑERO ESPIRITUAL
            </h3>
            <p className="text-[11px] text-stone-700 font-mono leading-relaxed mb-3">
              Usa <strong className="text-[#1E2022]">Amuletos de Vínculo</strong> en batalla para reclutar criaturas. Si capturas una especie repetida, se convierte en <strong className="text-emerald-700">+200% EXP extra</strong> para tu copia original.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-mono text-[11px]">
              <div className="p-3 bg-[#E7E7E2] border border-stone-300 rounded-xl">
                <span className="text-[#1E2022] font-bold font-pixel text-[10px] block mb-1">
                  1. COMPAÑERO ESPIRITUAL EN MAPA
                </span>
                <p className="text-stone-700 text-[10px] leading-relaxed">
                  Tu <strong className="text-[#1E2022]">Compañero Espiritual activo</strong> (o la Habilidad del Elegido de un Amuleto de Jefe) despeja barreras elementales en el mapa.
                </p>
              </div>

              <div className="p-3 bg-[#E7E7E2] border border-stone-300 rounded-xl">
                <span className="text-[#1E2022] font-bold font-pixel text-[10px] block mb-1">
                  2. RELEVOS EN COMBATE
                </span>
                <p className="text-stone-700 text-[10px] leading-relaxed">
                  Si tu compañero cae en batalla puedes relevar a otra Criatura Espiritual sana de tu equipo sin perder el combate.
                </p>
              </div>

              <div className="p-3 bg-[#E7E7E2] border border-stone-300 rounded-xl">
                <span className="text-[#1E2022] font-bold font-pixel text-[10px] block mb-1">
                  3. HOSPITALES Y TEMPLOS
                </span>
                <p className="text-stone-700 text-[10px] leading-relaxed">
                  Cura gratis en tu Casa o en los Hospitales (Stages 2 y 4). Evoluciona <strong className="text-[#1E2022]">solo dentro de los Templos</strong> de Stages 2 y 4.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
