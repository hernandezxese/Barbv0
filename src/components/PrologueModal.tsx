/**
 * Protagonist Narrative Prologue Screen
 * Appears AFTER choosing character/name and BEFORE selecting the starter creature,
 * displaying the animated sprite of the chosen protagonist (Bárbara, Felipe, or Isabella).
 */

import React, { useEffect, useRef, useState } from 'react';
import { HeroGender } from '../types/game';
import { drawBarbaraSprite } from '../utils/pixelRenderer';
import { sound } from '../services/audioService';
import { ChevronRight, Compass, Sparkles } from 'lucide-react';

interface PrologueModalProps {
  playerName: string;
  gender: HeroGender;
  onContinue: () => void;
}

const ROLE_BADGE: Record<HeroGender, string> = {
  female: '♀ Exploradora',
  male: '♂ Explorador',
  isabella: '👧 Joven Guía',
};

export const PrologueModal: React.FC<PrologueModalProps> = ({
  playerName,
  gender,
  onContinue,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const frameRef = useRef(0);

  const dialogues = [
    {
      speaker: `${playerName} · Diario del Hogar`,
      badge: 'EL MUNDO DEL SUR',
      text: `Soy ${playerName}. Vivo en un país largo donde cada región —Santiago, los valles prehistóricos del Biobío, Araucanía, Los Ríos y Los Lagos— late al ritmo de antiguos espíritus elementales.`,
    },
    {
      speaker: `${playerName} · El Desequilibrio`,
      badge: 'TU COMPAÑERO',
      text: `La neblina umbría despertó a los Guardianes Regionales y Maestros Vínculo. Ningún viajero camina solo: necesito vincular mi destino a un primer espíritu compañero.`,
    },
    {
      speaker: `${playerName} · La Travesía`,
      badge: 'OBJETIVO',
      text: `Partiré desde mi Casa (Escenario 0), exploraré senderos y zonas salvajes, entrenaré y evolucinaré mi equipo, y reuniré las 5 Medallas de los Guardianes de Chile.`,
    },
  ];

  const currentSlide = dialogues[stepIndex];
  const isLast = stepIndex === dialogues.length - 1;

  useEffect(() => {
    let animId: number;
    const renderLoop = () => {
      frameRef.current += 1;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath();
          ctx.ellipse(canvas.width / 2, canvas.height - 14, 34, 9, 0, 0, Math.PI * 2);
          ctx.fill();

          const bobOffset = Math.sin(frameRef.current * 0.08) * 3;
          drawBarbaraSprite(
            ctx,
            canvas.width / 2 - 40,
            8 + bobOffset,
            80,
            'down',
            frameRef.current * 0.06,
            false,
            gender
          );
        }
      }
      animId = requestAnimationFrame(renderLoop);
    };
    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [gender]);

  const handleNext = () => {
    sound.playConfirm();
    if (!isLast) {
      setStepIndex(prev => prev + 1);
    } else {
      onContinue();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto select-none">
      <div className="w-full max-w-xl bg-zinc-900 border-2 border-zinc-400/70 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl flex flex-col gap-3 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Compass className="w-4 h-4 text-zinc-200 shrink-0" />
            <span className="font-silkscreen text-[10px] sm:text-xs text-zinc-100 truncate">
              PRÓLOGO · CAPÍTULO {stepIndex + 1}/{dialogues.length}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-950 font-silkscreen text-[9px] font-bold shrink-0">
            {currentSlide.badge}
          </span>
        </div>

        {/* Protagonist Showcase + Narrative Card */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 bg-zinc-950/85 border border-zinc-800 rounded-2xl p-3 sm:p-4">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 border-2 border-zinc-500/60 flex items-center justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                width={108}
                height={108}
                className="w-22 h-22 sm:w-24 sm:h-24 image-render-pixel"
              />
            </div>
            <div className="mt-1.5 text-center">
              <div className="font-silkscreen text-xs text-zinc-100 font-bold">{playerName}</div>
              <div className="text-[10px] font-ui text-zinc-400">{ROLE_BADGE[gender]}</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between gap-2 text-left w-full">
            <div className="font-silkscreen text-[11px] text-zinc-300 border-b border-zinc-800 pb-1">
              {currentSlide.speaker}
            </div>
            <p className="font-ui text-xs sm:text-sm text-zinc-100 leading-relaxed min-h-[4.2rem]">
              &ldquo;{currentSlide.text}&rdquo;
            </p>
            {/* Progress Dots */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {dialogues.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === stepIndex
                      ? 'w-7 bg-zinc-100'
                      : idx < stepIndex
                      ? 'w-3.5 bg-zinc-500'
                      : 'w-3.5 bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2">
          {stepIndex > 0 ? (
            <button
              onClick={() => {
                sound.playSelect();
                setStepIndex(prev => prev - 1);
              }}
              className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 rounded-xl font-silkscreen text-[10px] sm:text-[11px] cursor-pointer active:scale-95"
            >
              ATRÁS
            </button>
          ) : (
            <span className="text-[10px] font-ui text-zinc-400">
              Conoce tu viaje antes de empezar.
            </span>
          )}

          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-silkscreen text-[11px] sm:text-xs font-bold rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5 border border-zinc-300 active:scale-95 ml-auto"
          >
            {isLast ? (
              <>
                <Sparkles className="w-4 h-4 text-zinc-900" />
                <span>ELEGIR MI CRIATURA</span>
              </>
            ) : (
              <>
                <span>CONTINUAR</span>
                <ChevronRight className="w-4 h-4 text-zinc-900" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
