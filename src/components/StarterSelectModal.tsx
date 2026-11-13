/**
 * Starter Spirit Selection Screen for Crónicas Elementales del Sur
 * Compact mobile no-scroll layout for picking Brotín, Pillancito, or Hualita at Lv.3.
 */

import React, { useState, useEffect, useRef } from 'react';
import { SpiritCreature, ElementType } from '../types/game';
import { createSpiritInstance } from '../data/spiritsData';
import { sound } from '../services/audioService';
import { drawCreatureSprite } from '../utils/pixelRenderer';
import { Sparkles, Check, Volume2 } from 'lucide-react';

interface StarterSelectModalProps {
  heroName?: string;
  onSelectStarter: (chosenSpirit: SpiritCreature) => void;
}

interface StarterOption {
  id: 'brotin' | 'pillancito' | 'hualita';
  name: string;
  element: ElementType;
  title: string;
  accentColor: string;
  badgeBg: string;
  description: string;
  tacticalNote: string;
  signatureMove: { name: string; power: number };
  stats: { hp: number; atk: number; def: number; spd: number };
}

const STARTERS: StarterOption[] = [
  {
    id: 'brotin',
    name: 'Brotín',
    element: 'planta',
    title: 'Guardián del Espinal',
    accentColor: '#10b981',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Cubierto de hojas medicinales de peumo que sanan la fatiga del viaje.',
    tacticalNote: 'Alta defensa y resistencia. Fuerte vs Agua y Tierra.',
    signatureMove: { name: 'Espina Brotante', power: 28 },
    stats: { hp: 55, atk: 18, def: 24, spd: 14 },
  },
  {
    id: 'pillancito',
    name: 'Pillancito',
    element: 'fuego',
    title: 'Chispa del Ruka Pillán',
    accentColor: '#f97316',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    description: 'Nacido del magma vivo del Villarrica, ágil e impetuoso.',
    tacticalNote: 'Gran poder especial y velocidad. Fuerte vs Planta y Hielo.',
    signatureMove: { name: 'Chispa Volcánica', power: 32 },
    stats: { hp: 46, atk: 22, def: 15, spd: 22 },
  },
  {
    id: 'hualita',
    name: 'Hualita',
    element: 'agua',
    title: 'Garza del Trancura',
    accentColor: '#0ea5e9',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    description: 'Sus plumas turquesas canalizan torrentes puros y repelen ceniza.',
    tacticalNote: 'Gran equilibrio y rapidez. Fuerte vs Fuego y Tierra.',
    signatureMove: { name: 'Chorro del Trancura', power: 27 },
    stats: { hp: 50, atk: 19, def: 18, spd: 25 },
  },
];

export const StarterSelectModal: React.FC<StarterSelectModalProps> = ({
  heroName = 'Bárbara',
  onSelectStarter,
}) => {
  const [selectedStarterId, setSelectedStarterId] = useState<'brotin' | 'pillancito' | 'hualita'>('brotin');
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.05;
      STARTERS.forEach(s => {
        const canvas = canvasRefs.current[s.id];
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, 112, 112);
            drawCreatureSprite(
              ctx,
              s.id,
              1,
              6,
              6,
              100,
              t + (s.id === 'pillancito' ? 1.5 : s.id === 'hualita' ? 3.0 : 0),
              false
            );
          }
        }
      });
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePreviewSound = (s: StarterOption, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.init();
    if (s.element === 'fuego') sound.playFireSpell();
    else if (s.element === 'agua') sound.playWaterSpell();
    else sound.playEarthSpell();
  };

  const handleConfirmChoice = () => {
    sound.init();
    sound.playEvolutionSequence();
    const starterSpirit = createSpiritInstance(selectedStarterId, 3, 1);
    onSelectStarter(starterSpirit);
  };

  const activeStarter = STARTERS.find(s => s.id === selectedStarterId)!;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto select-none">
      <div className="bg-zinc-900 border-2 border-zinc-400/70 rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl p-3 sm:p-5 flex flex-col gap-2.5 sm:gap-3.5 animate-in zoom-in-95 duration-200 my-auto">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-950 text-[9px] sm:text-[10px] font-silkscreen font-bold">
            <Sparkles className="w-3 h-3" />
            <span>COMPAÑERO INICIAL</span>
          </div>
          <h2 className="text-sm sm:text-xl font-silkscreen text-zinc-100">
            Elige tu Primer Espíritu
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-300 font-ui max-w-2xl mx-auto">
            <strong className="text-white">Mamá Elena:</strong> &ldquo;{heroName}, escoge al espíritu que partirá contigo.&rdquo;
          </p>
        </div>

        {/* Mobile Quick Tabs */}
        <div className="grid grid-cols-3 gap-1.5 md:hidden">
          {STARTERS.map(s => {
            const isSelected = selectedStarterId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  sound.init();
                  sound.playSelect();
                  setSelectedStarterId(s.id);
                }}
                className={`py-1.5 px-1.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-100 border-zinc-300 text-zinc-950 shadow-md font-bold'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="font-silkscreen text-[10px] truncate">{s.name}</div>
                <div className={`text-[9px] font-mono uppercase ${isSelected ? 'text-zinc-700' : 'text-zinc-500'}`}>
                  {s.element}
                </div>
              </button>
            );
          })}
        </div>

        {/* Starter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STARTERS.map(s => {
            const isSelected = selectedStarterId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => {
                  sound.init();
                  sound.playSelect();
                  setSelectedStarterId(s.id);
                }}
                className={`relative rounded-2xl p-3 cursor-pointer transition-all border-2 flex-col justify-between ${
                  isSelected
                    ? 'flex bg-zinc-800 border-zinc-100 shadow-xl'
                    : 'hidden md:flex bg-zinc-950/75 border-zinc-800 hover:border-zinc-600'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div>
                  <div className="relative w-full h-24 sm:h-28 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center p-1 mb-2 overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-15 pointer-events-none"
                      style={{ background: `radial-gradient(circle at center, ${s.accentColor}, transparent 70%)` }}
                    />
                    <canvas
                      ref={el => { canvasRefs.current[s.id] = el; }}
                      width={112}
                      height={112}
                      className="image-render-pixel w-20 h-20 sm:w-24 sm:h-24 object-contain relative z-10"
                    />
                    <button
                      type="button"
                      onClick={(e) => handlePreviewSound(s, e)}
                      title="Escuchar sonido elemental"
                      className="absolute bottom-1.5 right-1.5 p-1.5 rounded-lg bg-zinc-900/95 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 cursor-pointer z-20"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-silkscreen text-sm text-zinc-100 font-bold">{s.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-silkscreen bg-zinc-100 text-zinc-950 font-bold">
                        Nv.3
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-silkscreen border uppercase ${s.badgeBg}`}>
                        {s.element}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-300 font-ui leading-snug mb-2">{s.description}</p>
                </div>

                <div className="space-y-1 pt-1.5 border-t border-zinc-700/80 text-[10px] font-mono-stat">
                  <div className="flex justify-between text-zinc-300">
                    <span>PS:{s.stats.hp}</span>
                    <span>ATQ:{s.stats.atk}</span>
                    <span>DEF:{s.stats.def}</span>
                    <span>VEL:{s.stats.spd}</span>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded p-1 text-[10px] text-zinc-200 truncate">
                    Técnica: <strong>{s.signatureMove.name}</strong> ({s.signatureMove.power})
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm Footer */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-center sm:text-left">
            <div className="text-[11px] text-zinc-200 font-ui">
              Seleccionado: <strong className="font-silkscreen">{activeStarter.name}</strong> · {activeStarter.tacticalNote}
            </div>
          </div>

          <button
            onClick={handleConfirmChoice}
            className="w-full sm:w-auto px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-silkscreen text-xs font-bold rounded-xl shadow-xl cursor-pointer flex items-center justify-center gap-1.5 border border-zinc-300 active:scale-95 transition-transform shrink-0"
          >
            <Sparkles className="w-4 h-4 text-zinc-900" />
            <span>¡ELEGIR A {activeStarter.name.toUpperCase()}!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
