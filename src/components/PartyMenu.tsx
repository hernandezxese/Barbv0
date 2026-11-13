/**
 * Party & Final Fantasy III Job Class Management Screen
 * Displays Hero Avatar Card with innate Protagonist Passive (no Hero MP),
 * Party Spirits with pixel avatars, Job classes, and Vínculo Ancestral guide.
 */

import React, { useState, useRef, useEffect } from 'react';
import { SpiritCreature, BarbaraHero, JobClass, HERO_PASSIVES } from '../types/game';
import { JOBS_CONFIG } from '../data/itemsData';
import { sound } from '../services/audioService';
import { drawBarbaraSprite, drawCreatureSprite } from '../utils/pixelRenderer';
import { Swords, ChevronLeft, Check, Crosshair } from 'lucide-react';

interface PartyMenuProps {
  partySpirits: SpiritCreature[];
  barbara: BarbaraHero;
  onChangeJob: (newJob: JobClass) => void;
  onSetLeaderSpirit: (spiritUid: string) => void;
  onClose: () => void;
}

export const PartyMenu: React.FC<PartyMenuProps> = ({
  partySpirits,
  barbara,
  onChangeJob,
  onSetLeaderSpirit,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'spirits' | 'jobs' | 'recruitment'>('spirits');
  const [selectedSpiritUid, setSelectedSpiritUid] = useState<string>(partySpirits[0]?.uid || '');
  const avatarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spiritCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedSpirit = partySpirits.find(s => s.uid === selectedSpiritUid) || partySpirits[0];
  const passive = HERO_PASSIVES[barbara.gender || 'female'];

  useEffect(() => {
    let animId: number;
    let t = 0;
    const render = () => {
      t += 0.04;
      if (avatarCanvasRef.current) {
        const ctx = avatarCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 120, 120);
          drawBarbaraSprite(ctx, 20, 15, 80, 'down', t, false, barbara.gender || 'female');
        }
      }
      if (spiritCanvasRef.current && selectedSpirit) {
        const ctx = spiritCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 100, 100);
          drawCreatureSprite(ctx, selectedSpirit.baseId, selectedSpirit.currentStage, 5, 5, 90, t, false);
        }
      }
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [barbara.job, barbara.gender, selectedSpirit?.uid, selectedSpirit?.baseId, selectedSpirit?.currentStage]);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-3 sm:p-4 md:p-6 text-zinc-100">
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-4 border-b border-zinc-800">
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
              <Swords className="w-4 h-4 text-zinc-200 shrink-0" />
              <span>EQUIPO DE {barbara.name.toUpperCase()}</span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono hidden sm:block">
              Protagonista, espíritus vinculados y trabajos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-zinc-900 border border-zinc-700 p-1 rounded-xl text-[11px] font-mono">
          <button
            onClick={() => {
              sound.playSelect();
              setActiveTab('spirits');
            }}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'spirits' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {barbara.name} &amp; Equipo ({partySpirits.length})
          </button>
          <button
            onClick={() => {
              sound.playSelect();
              setActiveTab('jobs');
            }}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'jobs' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Trabajos FF3
          </button>
          <button
            onClick={() => {
              sound.playSelect();
              setActiveTab('recruitment');
            }}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'recruitment' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Vínculo
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl w-full mx-auto my-4 flex-1">
        {activeTab === 'spirits' && (
          <div className="space-y-4">
            {/* PROTAGONIST CARD */}
            <div className="bg-zinc-900 border-2 border-zinc-500/70 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 shadow-xl">
              <div className="w-24 h-24 rounded-2xl bg-zinc-950 border-2 border-zinc-600 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner relative">
                <canvas ref={avatarCanvasRef} width={120} height={120} className="w-full h-full object-contain image-render-pixel" />
                <div className="absolute top-1 left-1 px-1.5 py-0.2 bg-zinc-100 text-zinc-950 font-bold text-[8px] font-pixel rounded">
                  GUÍA
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="font-pixel text-sm text-zinc-100">{barbara.name}</h3>
                  <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-[10px] font-mono text-zinc-200 font-bold">
                    {JOBS_CONFIG[barbara.job]?.name} ({JOBS_CONFIG[barbara.job]?.icon})
                  </span>
                  <span className="text-zinc-300 font-mono text-xs font-bold">
                    Nv. {barbara.level} &middot; 💰 {barbara.gold} Oro
                  </span>
                </div>

                {/* Innate Gender Passive Highlight */}
                <div className="p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl mb-2 text-xs font-mono">
                  <div className="text-zinc-100 font-bold">
                    {passive.icon} Pasiva Innata: {passive.name}
                  </div>
                  <div className="text-zinc-300 text-[11px]">{passive.description}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  <div className="p-1.5 bg-zinc-950 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400 text-[9px] block">Resistencia</span>
                    <span className="text-zinc-100 font-bold">{barbara.currentHp}/{barbara.maxHp} PS</span>
                  </div>
                  <div className="p-1.5 bg-zinc-950 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400 text-[9px] block">Amuletos Vínculo</span>
                    <span className="text-zinc-100 font-bold">{barbara.resonanceOrbs} Disp.</span>
                  </div>
                  <div className="p-1.5 bg-zinc-950 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400 text-[9px] block">Invocación</span>
                    <span className="text-zinc-100 font-bold">{Math.round(barbara.limitGauge)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SPIRITS LIST & DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 flex flex-col gap-2">
                <span className="font-pixel text-[11px] text-zinc-400 mb-1">ESPÍRITUS EN TU EQUIPO:</span>
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
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800 border-zinc-200 shadow-md'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{spirit.evolutionLine[spirit.currentStage - 1]?.icon || '🌱'}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-pixel text-xs text-zinc-100">{spirit.name}</span>
                            {isLeader && (
                              <span className="px-1.5 py-0.2 bg-zinc-100 text-zinc-950 rounded text-[9px] font-mono font-bold">
                                1° LÍDER
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-zinc-400">
                            Nv.{spirit.level} &middot; PS: {spirit.currentHp}/{spirit.maxHp} &middot; PM: {spirit.currentMp}/{spirit.maxMp}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs uppercase font-mono text-zinc-300 font-bold">
                        {spirit.primaryElement}
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedSpirit && (
                <div className="md:col-span-7 bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-4 pb-3 border-b border-zinc-800 gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-zinc-950 border border-zinc-600 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner relative">
                        <canvas ref={spiritCanvasRef} width={100} height={100} className="w-full h-full object-contain image-render-pixel" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold tracking-wider">
                          Etapa {selectedSpirit.currentStage} de 3 &middot; {selectedSpirit.rarity}
                        </span>
                        <h3 className="font-pixel text-base text-zinc-100">{selectedSpirit.name}</h3>
                        <p className="text-zinc-400 text-xs font-mono">{selectedSpirit.lore}</p>
                      </div>
                    </div>

                    {partySpirits[0]?.uid !== selectedSpirit.uid && (
                      <button
                        onClick={() => {
                          sound.playConfirm();
                          onSetLeaderSpirit(selectedSpirit.uid);
                        }}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-lg font-pixel text-[10px] cursor-pointer shrink-0"
                      >
                        HACER LÍDER
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 font-mono text-xs">
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-400 block text-[10px]">Puntos de Salud (PS)</span>
                      <span className="text-zinc-100 font-bold text-sm">{selectedSpirit.currentHp} / {selectedSpirit.maxHp}</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-400 block text-[10px]">Maná Técnicas (PM)</span>
                      <span className="text-zinc-100 font-bold text-sm">{selectedSpirit.currentMp} / {selectedSpirit.maxMp}</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-400 block text-[10px]">Ataque Físico</span>
                      <span className="text-zinc-100 font-bold text-sm">{selectedSpirit.attack}</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-400 block text-[10px]">Defensa Física</span>
                      <span className="text-zinc-100 font-bold text-sm">{selectedSpirit.defense}</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-400 block text-[10px]">Ataque Especial</span>
                      <span className="text-zinc-100 font-bold text-sm">{selectedSpirit.spAttack}</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                      <span className="text-zinc-400 block text-[10px]">Velocidad</span>
                      <span className="text-zinc-100 font-bold text-sm">{selectedSpirit.speed}</span>
                    </div>
                  </div>

                  <div>
                    <span className="font-pixel text-[11px] text-zinc-400 mb-2 block">TÉCNICAS ELEMENTALES:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedSpirit.skills.map(skill => (
                        <div key={skill.id} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-zinc-100">{skill.name}</span>
                            <span className="font-mono text-zinc-300 text-[11px]">{skill.mpCost} PM</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 line-clamp-1">{skill.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: JOBS FF3 */}
        {activeTab === 'jobs' && (
          <div>
            <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-2xl mb-6">
              <span className="font-pixel text-xs text-zinc-100 block mb-1">
                ARQUETIPO DE EXPLORACIÓN DE {barbara.name.toUpperCase()}
              </span>
              <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                Cada trabajo refuerza las estadísticas base y se complementa con tu pasiva innata ({passive.name}) para guiar a tus espíritus por Chile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(JOBS_CONFIG) as JobClass[]).map(jobKey => {
                const job = JOBS_CONFIG[jobKey];
                const isCurrent = barbara.job === jobKey;

                return (
                  <div
                    key={jobKey}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-zinc-800 border-zinc-200 shadow-xl'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{job.icon}</span>
                        <div>
                          <h4 className="font-pixel text-sm text-zinc-100">{job.name}</h4>
                          <span className="text-xs text-zinc-300 font-mono">{job.title}</span>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="px-2.5 py-1 bg-zinc-100 rounded-lg text-xs font-mono text-zinc-950 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> ACTIVO
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            sound.playConfirm();
                            onChangeJob(jobKey);
                          }}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 border border-zinc-600 rounded-lg text-xs font-mono text-zinc-100 font-bold transition-colors cursor-pointer"
                        >
                          CAMBIAR
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-zinc-300 mb-3 leading-relaxed">{job.description}</p>

                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono mb-2">
                      <span className="text-zinc-200 font-bold block mb-0.5">Rasgo de Explorador:</span>
                      <span className="text-zinc-400">{job.specialty}</span>
                    </div>

                    <div className="flex gap-2 text-[11px] font-mono text-zinc-400">
                      <span>PS +{job.statBonus.hp}</span> &middot;
                      <span>ATQ +{job.statBonus.attack}</span> &middot;
                      <span>DEF +{job.statBonus.defense}</span> &middot;
                      <span>VEL +{job.statBonus.speed}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: VÍNCULO ANCESTRAL */}
        {activeTab === 'recruitment' && (
          <div className="space-y-4">
            <div className="p-5 bg-zinc-900 border-2 border-zinc-500/70 rounded-2xl">
              <h3 className="font-pixel text-sm text-zinc-100 mb-2 flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-zinc-200" />
                SISTEMA DE RECLUTAMIENTO &amp; VÍNCULO ANCESTRAL
              </h3>
              <p className="text-xs text-zinc-300 font-mono leading-relaxed mb-4">
                {barbara.name} canaliza los <strong className="text-white">Amuletos de Vínculo Pewén</strong> para forjar lazos con espíritus y fauna silvestre de Chile, integrándolos al equipo sin perder experiencia de combate.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3.5 bg-zinc-950 border border-zinc-700 rounded-xl">
                  <span className="text-zinc-100 font-bold font-pixel text-[10px] block mb-1">
                    1. VINCULAR EN COMBATE
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    Usa la opción <strong>VINCULAR</strong> en batalla. ¡Al forjar el vínculo con éxito, tu espíritu activo también gana experiencia y sube de nivel!
                  </p>
                  <div className="mt-2 text-[10px] text-zinc-200 bg-zinc-900 border border-zinc-800 p-1.5 rounded">
                    ⚡ Salud rival &lt; 30%: <strong>hasta 90%+ de probabilidad de vínculo</strong>.
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-950 border border-zinc-700 rounded-xl">
                  <span className="text-zinc-100 font-bold font-pixel text-[10px] block mb-1">
                    2. LÍDER &amp; RELEVOS
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    El primer espíritu es el <strong>Líder</strong> que abre combate, te sigue de cerca con tono luminoso ★ y despeja obstáculos del mapa.
                  </p>
                  <div className="mt-2 text-[10px] text-zinc-200 bg-zinc-900 border border-zinc-800 p-1.5 rounded">
                    🔄 Releva compañeros en cualquier turno o cambia líder aquí.
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-950 border border-zinc-700 rounded-xl">
                  <span className="text-zinc-100 font-bold font-pixel text-[10px] block mb-1">
                    3. EVOLUCIÓN ANCESTRAL
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    Al subir de nivel y usar esencias regionales en el Santuario del Menú, tus espíritus evolucionan hasta Etapa 3.
                  </p>
                  <div className="mt-2 text-[10px] text-zinc-200 bg-zinc-900 border border-zinc-800 p-1.5 rounded">
                    🌱 Cada evolución aprende nuevas técnicas elementales.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-5xl w-full mx-auto pt-3 border-t border-zinc-800 text-center text-[11px] font-mono text-zinc-500">
        {barbara.name} y sus espíritus crecen juntos con cada vínculo, victoria y descubrimiento en Chile.
      </div>
    </div>
  );
};
