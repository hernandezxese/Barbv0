/**
 * Character Creation Start Menu
 * Allows choosing between 3 Explorers (Femenino: Bárbara, Masculino: Felipe, Niña: Isabella)
 * and entering a custom character name in a compact no-scroll mobile layout.
 */

import React, { useState, useEffect, useRef } from 'react';
import { HeroGender } from '../types/game';
import { drawBarbaraSprite } from '../utils/pixelRenderer';
import { sound } from '../services/audioService';
import { Sparkles, User, ArrowRight, ChevronLeft } from 'lucide-react';

interface CharacterCreateModalProps {
  initialName?: string;
  initialGender?: HeroGender;
  onConfirm: (name: string, gender: HeroGender) => void;
  onCancel?: () => void;
}

const DEFAULT_NAMES: Record<HeroGender, string> = {
  female: 'Bárbara',
  male: 'Felipe',
  isabella: 'Isabella',
};

const CHARACTER_OPTIONS: {
  id: HeroGender;
  badge: string;
  title: string;
  subtitle: string;
}[] = [
  { id: 'female', badge: '♀ BÁRBARA', title: 'Exploradora', subtitle: 'Poncho rojo austral' },
  { id: 'male', badge: '♂ FELIPE', title: 'Explorador', subtitle: 'Gorro andino azul' },
  { id: 'isabella', badge: '👧 ISABELLA', title: 'Joven Guía', subtitle: 'Trenzas y poncho rosa' },
];

export const CharacterCreateModal: React.FC<CharacterCreateModalProps> = ({
  initialName = 'Bárbara',
  initialGender = 'female',
  onConfirm,
  onCancel,
}) => {
  const [gender, setGender] = useState<HeroGender>(initialGender);
  const [name, setName] = useState<string>(initialName);
  const [hasCustomName, setHasCustomName] = useState(false);

  const femaleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isabellaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.06;
      const refs: { ref: React.RefObject<HTMLCanvasElement | null>; g: HeroGender }[] = [
        { ref: femaleCanvasRef, g: 'female' },
        { ref: maleCanvasRef, g: 'male' },
        { ref: isabellaCanvasRef, g: 'isabella' },
      ];

      refs.forEach(({ ref, g }) => {
        if (ref.current) {
          const ctx = ref.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, 112, 112);
            ctx.imageSmoothingEnabled = false;
            drawBarbaraSprite(ctx, 14, 10, 84, 'down', t, gender === g, g);
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [gender]);

  const handleSelectGender = (nextGender: HeroGender) => {
    sound.init();
    sound.playSelect();
    setGender(nextGender);
    const trimmed = name.trim();
    if (!hasCustomName || trimmed === '' || Object.values(DEFAULT_NAMES).includes(trimmed)) {
      setName(DEFAULT_NAMES[nextGender]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.init();
    sound.playConfirm();
    const cleanName = name.trim() || DEFAULT_NAMES[gender];
    onConfirm(cleanName, gender);
  };

  const getCanvasRef = (id: HeroGender) => {
    if (id === 'female') return femaleCanvasRef;
    if (id === 'male') return maleCanvasRef;
    return isabellaCanvasRef;
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto select-none">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border-2 border-zinc-400/70 rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl p-3.5 sm:p-5 flex flex-col gap-3 animate-in zoom-in-95 duration-200 my-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          {onCancel ? (
            <button
              type="button"
              onClick={() => {
                sound.playCancel();
                onCancel();
              }}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-200 cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8 shrink-0" />
          )}

          <div className="text-center flex-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-950 text-[9px] font-silkscreen font-bold mb-1">
              <Sparkles className="w-3 h-3" />
              <span>CREACIÓN DE PERSONAJE</span>
            </div>
            <h2 className="text-base sm:text-lg font-silkscreen text-zinc-100">
              ¿Quién emprenderá el viaje?
            </h2>
            <p className="text-[11px] text-zinc-400 font-ui">
              Elige entre Bárbara, Felipe o Isabella y personaliza su nombre
            </p>
          </div>

          <div className="w-8 shrink-0" />
        </div>

        {/* 3 Explorer Selection Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {CHARACTER_OPTIONS.map((opt) => {
            const isSelected = gender === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectGender(opt.id)}
                className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-zinc-800 border-zinc-100 shadow-lg scale-[1.02]'
                    : 'bg-zinc-950/75 border-zinc-800 hover:border-zinc-600 opacity-80'
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-center overflow-hidden">
                  <canvas
                    ref={getCanvasRef(opt.id)}
                    width={112}
                    height={112}
                    className="w-14 h-14 sm:w-18 sm:h-18 object-contain image-render-pixel"
                  />
                </div>
                <div className="min-w-0 w-full">
                  <span className="font-silkscreen text-[10px] sm:text-xs text-zinc-100 block truncate">
                    {opt.badge}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-300 font-bold block truncate">
                    {opt.title}
                  </span>
                  <span className="text-[9px] font-ui text-zinc-400 leading-tight hidden sm:block mt-0.5 truncate">
                    {opt.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Name Input */}
        <div className="space-y-1">
          <label className="text-[10px] sm:text-[11px] font-silkscreen text-zinc-200 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>NOMBRE DEL PERSONAJE:</span>
          </label>
          <input
            type="text"
            maxLength={16}
            value={name}
            onChange={(e) => {
              setHasCustomName(true);
              setName(e.target.value);
            }}
            placeholder={DEFAULT_NAMES[gender]}
            className="w-full px-3.5 py-2.5 bg-zinc-950 border-2 border-zinc-700 focus:border-zinc-200 rounded-xl text-zinc-100 font-silkscreen text-xs sm:text-sm outline-none transition-colors"
          />
        </div>

        {/* Confirm Button */}
        <button
          type="submit"
          className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-silkscreen text-xs sm:text-sm font-bold rounded-xl shadow-xl border border-zinc-300 cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span>CONTINUAR AL PRÓLOGO</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
