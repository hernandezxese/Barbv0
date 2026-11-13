/**
 * Party & Vínculo Ancestral Management Screen
 * Removes FF3 Job Classes & Protagonist Skills cleanly; shows Hero summary,
 * Party Spirits with pixel avatars, Leader switching, and Vínculo guide.
 */

import React, { useState, useRef, useEffect } from 'react';
import { SpiritCreature, BarbaraHero } from '../types/game';
import { sound } from '../services/audioService';
import { drawBarbaraSprite, drawCreatureSprite } from '../utils/pixelRenderer';
import { Swords, ChevronLeft, Crosshair, Award } from 'lucide-react';

interface PartyMenuProps {
  partySpirits: SpiritCreature[];
  barbara: BarbaraHero;
  onSetLeaderSpirit: (spiritUid: string) => void;
  onOpenProfile?: () => void;
  onClose: () => void;
}

const ROLE_LABELS: Record<BarbaraHero['gender'], string> = {
  female: 'Exploradora Elemental',
  male: 'Explorador Elemental',
  isabella: 'Joven Guía del Sur',
};

export const PartyMenu: React.FC<PartyMenuProps> = ({
  partySpirits,
  barbara,
  onSetLeaderSpirit,
  onOpenProfile,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'spirits' | 'recruitment'>('spirits');
  const [selectedSpiritUid, setSelectedSpiritUid] = useState<string>(partySpirits[0]?.uid || '');
  const avatarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spiritCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedSpirit = partySpirits.find(s => s.uid === selectedSpiritUid) || partySpirits[0];

  useEffect(() => {
    let animId: number;
    let t = 0;
    const render = () => {
      t += 0.04;
      if (avatarCanvasRef.current) {
        const ctx = avatarCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 100, 100);
          ctx.imageSmoothingEnabled = false;
          drawBarbaraSprite(ctx, 14, 10, 72, 'down', t, false, barbara.gender || 'female');
        }
      }
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
  }, [barbara.gender, selectedSpirit?.uid, selectedSpirit?.baseId, selectedSpirit?.currentStage]);

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
            <span className="truncate">EQUIPO ({partySpirits.length})</span>
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
            {/* PROTAGONIST SUMMARY CARD */}
            <div className="bg-zinc-900 border border-zinc-600 rounded-2xl p-2.5 sm:p-3.5 flex items-center gap-3 shadow-xl">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-950 border border-zinc-600 shrink-0 flex items-center justify-center overflow-hidden">
                <canvas ref={avatarCanvasRef} width={100} height={100} className="w-full h-full object-contain image-render-pixel" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                  <div>
                    <h3 className="font-pixel text-xs sm:text-sm text-zinc-100">{barbara.name}</h3>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {ROLE_LABELS[barbara.gender || 'female']} · Nv.{barbara.level}
                    </span>
                  </div>
                  {onOpenProfile && (
                    <button
                      onClick={() => {
                        sound.playSelect();
                        onOpenProfile();
                      }}
                      className="px-2.5 py-1 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg font-silkscreen text-[9px] font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Award className="w-3 h-3" />
                      <span>PERFIL ({(barbara.medals || []).length}/5)</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                  <div className="p-1.5 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                    <span className="text-zinc-400 text-[9px] block">Oro</span>
                    <span className="text-zinc-100 font-bold">{barbara.gold}</span>
                  </div>
                  <div className="p-1.5 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                    <span className="text-zinc-400 text-[9px] block">Amuletos</span>
                    <span className="text-zinc-100 font-bold">{barbara.resonanceOrbs}</span>
                  </div>
                  <div className="p-1.5 bg-zinc-950 rounded-lg border border-zinc-800 text-center">
                    <span className="text-zinc-400 text-[9px] block">Invocación</span>
                    <span className="text-zinc-100 font-bold">{Math.round(barbara.limitGauge)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SPIRITS LIST & DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 flex flex-col gap-1.5 max-h-56 md:max-h-80 overflow-y-auto pr-0.5">
                {partySpirits.map((spirit, idx) => {
                  const isSelected = spirit.uid === selectedSpirit?.uid;
                  const isLeader = idx === 0;

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
                          <div className="flex items-center gap-1.5">
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

                      <span className="text-[10px] uppercase font-mono text-zinc-300 font-bold shrink-0">
                        {spirit.primaryElement}
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
                        <span className="text-[9px] uppercase font-mono text-zinc-400 font-bold">
                          Etapa {selectedSpirit.currentStage}/3 · {selectedSpirit.rarity}
                        </span>
                        <h3 className="font-pixel text-xs sm:text-sm text-zinc-100 truncate">{selectedSpirit.name}</h3>
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
                            <span className="font-bold text-zinc-100 truncate">{skill.name}</span>
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
              VÍNCULO ANCESTRAL Y PROGRESIÓN
            </h3>
            <p className="text-[11px] text-zinc-300 font-mono leading-relaxed mb-3">
              Usa <strong className="text-white">Amuletos de Vínculo</strong> en batalla para reclutar criaturas. Si capturas una especie repetida, se convierte en <strong className="text-white">EXP extra</strong> para tu copia original.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-mono text-[11px]">
              <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-xl">
                <span className="text-zinc-100 font-bold font-pixel text-[10px] block mb-1">
                  1. VINCULAR &amp; EXP
                </span>
                <p className="text-zinc-300 text-[10px] leading-relaxed">
                  Al bajar la salud rival bajo 30% la captura supera el 90%. Los Jefes son el doble de difíciles de vincular.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-xl">
                <span className="text-zinc-100 font-bold font-pixel text-[10px] block mb-1">
                  2. LÍDER Y RELEVOS
                </span>
                <p className="text-zinc-300 text-[10px] leading-relaxed">
                  Si tu líder cae en batalla puedes relevar a otro espíritu sano de tu equipo sin perder el combate.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-xl">
                <span className="text-zinc-100 font-bold font-pixel text-[10px] block mb-1">
                  3. HOSPITALES Y SANTUARIO
                </span>
                <p className="text-zinc-300 text-[10px] leading-relaxed">
                  Cura en tu Casa o en los Hospitales (Stages 1 y 3). Evoluciona en los Santuarios de Biobío y Los Ríos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
