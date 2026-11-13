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
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
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
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
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
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
    description: 'Sus plumas turquesas canalizan torrentes puros y repelen ceniza.',
    tacticalNote: 'Gran equilibrio y rapidez. Fuerte vs Fuego y Tierra.',
    signatureMove: { name: 'Chorro del Trancura', power: 27 },
    stats: { hp: 50, atk: 19, def: 18, spd: 25 },
  },
];

export const StarterSelectModal: React.FC<StarterSelectModalProps> = ({
  heroName = 'Elegido',
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto select-none">
      <div className="bg-[#F4F4F2] border-2 border-stone-300 text-[#1E2022] rounded-2xl sm:rounded-3xl max-w-4xl w-full shadow-2xl p-3.5 sm:p-5 flex flex-col gap-3 animate-in zoom-in-95 duration-200 my-auto">
        <div className="text-center space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
            Compañero Inicial
          </div>
          <h2 className="text-sm sm:text-xl font-silkscreen text-[#1E2022]">
            Elige tu Primera Criatura Espiritual
          </h2>
          <div className="bg-[#E7E7E2] border border-stone-300 rounded-xl px-3.5 py-2 max-w-2xl mx-auto min-h-[54px] flex items-center justify-center">
            <p className="text-[11px] sm:text-xs text-stone-700 font-ui leading-snug">
              <strong className="text-[#1E2022]">Abuela Mary:</strong> &ldquo;{heroName}, las Criaturas Espirituales protegen nuestros ríos y bosques frente a las faenas industriales sin resguardo ambiental. Elige a tu primer compañero: cada elemento (Planta, Fuego o Agua) te ayudará a limpiar, educar y sanar el sur.&rdquo;
            </p>
          </div>
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
                className={`min-h-[42px] py-2 px-1.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1E2022] border-[#1E2022] text-[#F4F4F2] shadow-md font-bold'
                    : 'bg-[#E7E7E2] border-stone-300 text-stone-700'
                }`}
              >
                <div className="font-silkscreen text-[10px] truncate">{s.name}</div>
                <div className={`text-[9px] font-mono uppercase ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
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
                    ? 'flex bg-white border-[#1E2022] shadow-lg'
                    : 'hidden md:flex bg-[#E7E7E2] border-stone-300 hover:border-stone-400'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                <div>
                  <div className="relative w-full h-24 sm:h-28 rounded-xl bg-zinc-900 border border-stone-400 flex items-center justify-center p-1 mb-2 overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none"
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
                      className="absolute bottom-1.5 right-1.5 min-w-[34px] min-h-[34px] p-1.5 rounded-lg bg-[#F4F4F2]/95 hover:bg-white text-[#1E2022] border border-stone-300 cursor-pointer z-20 flex items-center justify-center"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-silkscreen text-sm text-[#1E2022] font-bold">{s.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-silkscreen bg-[#1E2022] text-[#F4F4F2] font-bold">
                        Nv.3
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-silkscreen border uppercase ${s.badgeBg}`}>
                        {s.element}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-700 font-ui leading-snug mb-2 h-[34px] overflow-hidden line-clamp-2">{s.description}</p>
                </div>

                <div className="space-y-1 pt-1.5 border-t border-stone-300 text-[10px] font-mono-stat tabular-nums">
                  <div className="flex justify-between text-stone-700 font-bold">
                    <span>PS:{s.stats.hp}</span>
                    <span>ATQ:{s.stats.atk}</span>
                    <span>DEF:{s.stats.def}</span>
                    <span>VEL:{s.stats.spd}</span>
                  </div>
                  <div className="bg-[#E7E7E2] border border-stone-300 rounded px-2 py-1 text-[10px] text-[#1E2022] truncate">
                    Técnica: <strong>{s.signatureMove.name}</strong> ({s.signatureMove.power})
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm Footer */}
        <div className="bg-[#E7E7E2] border border-stone-300 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-center sm:text-left">
            <div className="text-[11px] text-[#1E2022] font-ui">
              Seleccionado: <strong className="font-silkscreen">{activeStarter.name}</strong> · <span className="text-stone-700">{activeStarter.tacticalNote}</span>
            </div>
          </div>

          <button
            onClick={handleConfirmChoice}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-silkscreen text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-800 active:scale-95 transition-transform shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>¡ELEGIR A {activeStarter.name.toUpperCase()}!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
