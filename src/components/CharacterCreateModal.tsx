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
  female: 'Elegida',
  male: 'Elegido',
  isabella: 'Elegida',
};

const CHARACTER_OPTIONS: {
  id: HeroGender;
  badge: string;
  title: string;
  subtitle: string;
}[] = [
  { id: 'female', badge: '♀ LA ELEGIDA', title: 'Defensora Austral', subtitle: 'Poncho rojo del sur' },
  { id: 'male', badge: '♂ EL ELEGIDO', title: 'Defensor Austral', subtitle: 'Gorro andino azul' },
  { id: 'isabella', badge: '🌿 GUÍA JOVEN', title: 'Guardiana Joven', subtitle: 'Trenzas y poncho rosa' },
];

export const CharacterCreateModal: React.FC<CharacterCreateModalProps> = ({
  initialName = 'Elegido',
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto select-none">
      <form
        onSubmit={handleSubmit}
        className="bg-[#F4F4F2] border-2 border-stone-300 text-[#1E2022] rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl p-4 sm:p-6 flex flex-col gap-3.5 animate-in zoom-in-95 duration-200 my-auto"
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
              className="min-h-[40px] min-w-[40px] p-2 bg-[#E7E7E2] hover:bg-stone-300 border border-stone-300 rounded-xl text-[#1E2022] cursor-pointer shrink-0 flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-10 shrink-0" />
          )}

          <div className="text-center flex-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-0.5">
              Creación de Personaje
            </div>
            <h2 className="text-base sm:text-lg font-silkscreen text-[#1E2022]">
              Elige al Elegido del Sur
            </h2>
            <p className="text-xs text-stone-600 font-ui">
              Escoge tu apariencia para defender la naturaleza y personaliza tu nombre
            </p>
          </div>

          <div className="w-10 shrink-0" />
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
                    ? 'bg-white border-[#1E2022] shadow-md scale-[1.02]'
                    : 'bg-[#E7E7E2] border-stone-300 hover:border-stone-400 opacity-85'
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-900 border border-stone-400 flex items-center justify-center overflow-hidden">
                  <canvas
                    ref={getCanvasRef(opt.id)}
                    width={112}
                    height={112}
                    className="w-14 h-14 sm:w-18 sm:h-18 object-contain image-render-pixel"
                  />
                </div>
                <div className="min-w-0 w-full">
                  <span className="font-silkscreen text-[10px] sm:text-xs text-[#1E2022] block truncate font-bold">
                    {opt.badge}
                  </span>
                  <span className="text-[10px] font-mono text-stone-700 font-bold block truncate">
                    {opt.title}
                  </span>
                  <span className="text-[9px] font-ui text-stone-500 leading-tight hidden sm:block mt-0.5 truncate">
                    {opt.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-silkscreen text-[#1E2022] flex items-center gap-1.5">
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
            className="w-full min-h-[42px] px-3.5 py-2.5 bg-white border-2 border-stone-300 focus:border-[#1E2022] rounded-xl text-[#1E2022] font-silkscreen text-xs sm:text-sm outline-none transition-colors"
          />
        </div>

        {/* Confirm Button */}
        <button
          type="submit"
          className="w-full min-h-[44px] py-3 bg-[#1E2022] hover:bg-zinc-800 text-[#F4F4F2] font-silkscreen text-xs sm:text-sm font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>CONTINUAR AL PRÓLOGO</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
