/**
 * Character Creation Start Menu
 * Allows choosing Explorer Gender (Femenino / Masculino), Protagonist Passive, and custom Character Name
 */

import React, { useState, useEffect, useRef } from 'react';
import { HeroGender, HERO_PASSIVES } from '../types/game';
import { drawBarbaraSprite } from '../utils/pixelRenderer';
import { sound } from '../services/audioService';
import { Sparkles, User, ArrowRight, ChevronLeft } from 'lucide-react';

interface CharacterCreateModalProps {
  initialName?: string;
  initialGender?: HeroGender;
  onConfirm: (name: string, gender: HeroGender) => void;
  onCancel?: () => void;
}

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

  useEffect(() => {
    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.06;
      if (femaleCanvasRef.current) {
        const ctx = femaleCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 128, 128);
          drawBarbaraSprite(ctx, 16, 14, 96, 'down', t, gender === 'female', 'female');
        }
      }
      if (maleCanvasRef.current) {
        const ctx = maleCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 128, 128);
          drawBarbaraSprite(ctx, 16, 14, 96, 'down', t, gender === 'male', 'male');
        }
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [gender]);

  const handleSelectGender = (nextGender: HeroGender) => {
    sound.init();
    sound.playSelect();
    setGender(nextGender);
    if (!hasCustomName || name.trim() === '' || name === 'Bárbara' || name === 'Felipe') {
      setName(nextGender === 'female' ? 'Bárbara' : 'Felipe');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.init();
    sound.playConfirm();
    const cleanName = name.trim() || (gender === 'female' ? 'Bárbara' : 'Felipe');
    onConfirm(cleanName, gender);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 border-2 border-zinc-400/70 rounded-3xl max-w-lg w-full shadow-2xl p-4 sm:p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200 my-auto"
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
              className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-200 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8" />
          )}

          <div className="text-center flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-950 text-[10px] font-silkscreen font-bold mb-2">
              <Sparkles className="w-3 h-3" />
              <span>CREACIÓN DE PERSONAJE</span>
            </div>
            <h2 className="text-lg sm:text-xl font-silkscreen text-zinc-100">
              ¿Quién emprenderá el viaje?
            </h2>
            <p className="text-xs text-zinc-400 font-ui mt-1">
              Elige tu personaje, su pasiva innata y su nombre
            </p>
          </div>

          <div className="w-8" />
        </div>

        {/* Gender Selection Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSelectGender('female')}
            className={`p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer text-center ${
              gender === 'female'
                ? 'bg-zinc-800 border-zinc-100 shadow-lg scale-[1.02]'
                : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-600 opacity-80'
            }`}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-center overflow-hidden">
              <canvas ref={femaleCanvasRef} width={128} height={128} className="w-18 h-18 sm:w-20 sm:h-20 object-contain image-render-pixel" />
            </div>
            <div>
              <span className="font-silkscreen text-xs text-zinc-100 block">♀ FEMENINO</span>
              <span className="text-[10px] font-mono text-zinc-200 font-bold block mt-0.5">
                {HERO_PASSIVES.female.icon} {HERO_PASSIVES.female.name}
              </span>
              <span className="text-[9px] font-ui text-zinc-400 leading-tight block mt-1">
                {HERO_PASSIVES.female.description}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectGender('male')}
            className={`p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all cursor-pointer text-center ${
              gender === 'male'
                ? 'bg-zinc-800 border-zinc-100 shadow-lg scale-[1.02]'
                : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-600 opacity-80'
            }`}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-zinc-950 border border-zinc-700 flex items-center justify-center overflow-hidden">
              <canvas ref={maleCanvasRef} width={128} height={128} className="w-18 h-18 sm:w-20 sm:h-20 object-contain image-render-pixel" />
            </div>
            <div>
              <span className="font-silkscreen text-xs text-zinc-100 block">♂ MASCULINO</span>
              <span className="text-[10px] font-mono text-zinc-200 font-bold block mt-0.5">
                {HERO_PASSIVES.male.icon} {HERO_PASSIVES.male.name}
              </span>
              <span className="text-[9px] font-ui text-zinc-400 leading-tight block mt-1">
                {HERO_PASSIVES.male.description}
              </span>
            </div>
          </button>
        </div>

        {/* Name Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-silkscreen text-zinc-200 flex items-center gap-1.5">
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
            placeholder={gender === 'female' ? 'Bárbara' : 'Felipe'}
            className="w-full px-4 py-3 bg-zinc-950 border-2 border-zinc-700 focus:border-zinc-200 rounded-xl text-zinc-100 font-silkscreen text-sm outline-none transition-colors"
          />
          <p className="text-[10px] text-zinc-400 font-mono">
            Máximo 16 caracteres. Todos los habitantes de Chile te conocerán por este nombre.
          </p>
        </div>

        {/* Confirm Button */}
        <button
          type="submit"
          className="w-full py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 font-silkscreen text-xs sm:text-sm font-bold rounded-xl shadow-xl border border-zinc-300 cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span>CONTINUAR AL PRÓLOGO</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
