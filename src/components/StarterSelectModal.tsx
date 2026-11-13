/**
 * Starter Spirit Selection Screen for Bárbara: Crónicas Elementales del Sur
 * Inspired by classic Pokémon starter choice (Fire / Water / Grass)
 * Features:
 * - 3 Chilean native starters: Brotín (Planta), Pillancito (Fuego), Hualita (Agua)
 * - Animated pixel sprite preview
 * - Audio preview for elemental sound
 * - Tactical stats breakdown & lore
 */

import React, { useState, useEffect, useRef } from 'react';
import { SpiritCreature, ElementType } from '../types/game';
import { createSpiritInstance } from '../data/spiritsData';
import { sound } from '../services/audioService';
import { drawCreatureSprite } from '../utils/pixelRenderer';
import { Sparkles, Flame, Droplets, Leaf, Shield, Zap, Heart, Check, Volume2 } from 'lucide-react';

interface StarterSelectModalProps {
  heroName?: string;
  onSelectStarter: (chosenSpirit: SpiritCreature) => void;
}

interface StarterOption {
  id: 'brotin' | 'pillancito' | 'hualita';
  name: string;
  element: ElementType;
  title: string;
  role: string;
  accentColor: string;
  badgeBg: string;
  description: string;
  tacticalNote: string;
  signatureMove: { name: string; power: number; desc: string };
  stats: { hp: number; atk: number; def: number; spAtk: number; spd: number };
}

const STARTERS: StarterOption[] = [
  {
    id: 'brotin',
    name: 'Brotín',
    element: 'planta',
    title: 'Guardián del Espinal Central',
    role: 'Tanque Protector & Espinas',
    accentColor: '#10b981',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Nacido en los faldeos precordilleranos de Santiago. Su cuerpo está cubierto de hojas medicinales y espinas de peumo que sanan el cansancio.',
    tacticalNote: 'Excelente resiliencia, alta defensa y regeneración continua. Fuerte contra Agua y Tierra.',
    signatureMove: {
      name: 'Espina Brotante',
      power: 28,
      desc: 'Lanza espinas vegetales que reducen la defensa del objetivo.'
    },
    stats: { hp: 55, atk: 18, def: 24, spAtk: 16, spd: 14 }
  },
  {
    id: 'pillancito',
    name: 'Pillancito',
    element: 'fuego',
    title: 'Chispa del Ruka Pillán',
    role: 'Atacante Especial & Quemadura',
    accentColor: '#f97316',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    description: 'Una criatura ígnea surgida del magma vivo del Volcán Villarrica. Sus pequeñas llamas arden con pasión y orgullo ancestral.',
    tacticalNote: 'Altísimo poder destructivo y velocidad inicial. Fuerte contra Planta y Hielo.',
    signatureMove: {
      name: 'Chispa Volcánica',
      power: 32,
      desc: 'Dispara proyectiles incandescentes con probabilidad de quemar al rival.'
    },
    stats: { hp: 46, atk: 22, def: 15, spAtk: 26, spd: 22 }
  },
  {
    id: 'hualita',
    name: 'Hualita',
    element: 'agua',
    title: 'Garza de las Aguas Sagradas',
    role: 'Ágil Acuática & Vórtice',
    accentColor: '#0ea5e9',
    badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    description: 'Habita las riberas del lago Villarrica y los ríos de Pucón. Sus plumas turquesas repelen la ceniza y canalizan la pureza del agua.',
    tacticalNote: 'Equilibrio perfecto, movimientos veloces y resistencia térmica. Fuerte contra Fuego y Tierra.',
    signatureMove: {
      name: 'Chorro del Trancura',
      power: 27,
      desc: 'Un potente torrente de agua cristalina que desconcierta al oponente.'
    },
    stats: { hp: 50, atk: 19, def: 18, spAtk: 22, spd: 25 }
  }
];

export const StarterSelectModal: React.FC<StarterSelectModalProps> = ({
  heroName = 'Bárbara',
  onSelectStarter,
}) => {
  const [selectedStarterId, setSelectedStarterId] = useState<'brotin' | 'pillancito' | 'hualita'>('brotin');
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  // Animate starters pixel canvas
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
            ctx.clearRect(0, 0, 130, 130);
            drawCreatureSprite(ctx, s.id, 1, 5, 5, 120, t + (s.id === 'pillancito' ? 1.5 : s.id === 'hualita' ? 3.0 : 0), false);
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
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto select-none">
      <div className="bg-zinc-900 border-2 border-zinc-400/70 rounded-3xl max-w-4xl w-full shadow-2xl p-4 sm:p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-950 text-[10px] sm:text-xs font-silkscreen font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>COMPAÑERO INICIAL</span>
          </div>
          <h2 className="text-base sm:text-2xl font-silkscreen text-zinc-100">
            Elige tu Primer Espíritu
          </h2>
          <p className="text-[11px] sm:text-sm text-zinc-300 font-ui max-w-2xl mx-auto leading-relaxed">
            <span className="text-white font-bold">Mamá Elena:</span> &ldquo;{heroName}, antes de salir de casa rumbo a Santiago y al sur de Chile, escoge al espíritu que caminará contigo.&rdquo;
          </p>
        </div>

        {/* Mobile Quick Starter Selector Tabs (< md) */}
        <div className="grid grid-cols-3 gap-2 md:hidden">
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
                className={`py-2 px-1.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-100 border-zinc-300 text-zinc-950 shadow-md font-bold'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="font-silkscreen text-[11px] truncate">{s.name}</div>
                <div className={`text-[9px] font-mono uppercase mt-0.5 ${isSelected ? 'text-zinc-700' : 'text-zinc-500'}`}>{s.element}</div>
              </button>
            );
          })}
        </div>

        {/* Starter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
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
                className={`relative rounded-2xl p-3.5 sm:p-4 cursor-pointer transition-all border-2 flex-col justify-between ${
                  isSelected
                    ? 'flex bg-zinc-800 border-zinc-100 shadow-xl md:scale-[1.02]'
                    : 'hidden md:flex bg-zinc-950/75 border-zinc-800 hover:border-zinc-600'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center shadow">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}

                <div>
                  {/* Sprite Box */}
                  <div className="relative w-full h-32 sm:aspect-square sm:max-h-36 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center p-2 mb-3 overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-15 pointer-events-none"
                      style={{ background: `radial-gradient(circle at center, ${s.accentColor}, transparent 70%)` }}
                    />
                    <canvas
                      ref={el => { canvasRefs.current[s.id] = el; }}
                      width={130}
                      height={130}
                      className="image-render-pixel w-24 h-24 sm:w-28 sm:h-28 object-contain relative z-10"
                    />

                    <button
                      type="button"
                      onClick={(e) => handlePreviewSound(s, e)}
                      title="Escuchar sonido elemental"
                      className="absolute bottom-2 right-2 p-2 rounded-lg bg-zinc-900/95 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 cursor-pointer z-20"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Element Badge */}
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-silkscreen text-base text-zinc-100 font-bold">{s.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-silkscreen bg-zinc-100 text-zinc-950 font-bold">
                        Nv.3
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-silkscreen border uppercase ${s.badgeBg}`}>
                        {s.element}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-300 font-mono-stat font-semibold mb-1.5">
                    {s.title}
                  </p>

                  <p className="text-xs text-zinc-300 font-ui leading-relaxed line-clamp-3 mb-2.5">
                    {s.description}
                  </p>
                </div>

                {/* Base Stat Mini Bars */}
                <div className="space-y-1.5 pt-2 border-t border-zinc-700/80 text-[10px] font-mono-stat">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>PS: {s.stats.hp}</span>
                    <span>ATQ: {s.stats.atk}</span>
                    <span>DEF: {s.stats.def}</span>
                    <span>VEL: {s.stats.spd}</span>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded p-1.5 text-[11px] text-zinc-200 font-mono-stat">
                    <span className="text-zinc-400">Técnica: </span>
                    <span className="font-bold">{s.signatureMove.name}</span> (Pot. {s.signatureMove.power})
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Starter Detailed Summary & Confirmation */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs text-zinc-400 font-ui">
              Seleccionado: <strong className="text-zinc-100 font-silkscreen">{activeStarter.name}</strong> ({activeStarter.element.toUpperCase()})
            </div>
            <div className="text-[11px] text-zinc-300 font-mono-stat">
              {activeStarter.tacticalNote}
            </div>
          </div>

          <button
            onClick={handleConfirmChoice}
            className="w-full sm:w-auto px-6 py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 font-silkscreen text-xs font-bold rounded-xl shadow-xl cursor-pointer flex items-center justify-center gap-2 border border-zinc-300 active:scale-95 transition-transform"
          >
            <Sparkles className="w-4 h-4 text-zinc-900" />
            <span>¡ELEGIR A {activeStarter.name.toUpperCase()}!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
