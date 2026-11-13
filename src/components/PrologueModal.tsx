/**
 * Protagonist Narrative Prologue Screen
 * Appears AFTER choosing gender/name and BEFORE selecting the starter creature,
 * displaying the animated sprite of the chosen protagonist with contextual RPG dialogue.
 */

import React, { useEffect, useRef, useState } from 'react';
import { HeroGender, HERO_PASSIVES } from '../types/game';
import { drawBarbaraSprite } from '../utils/pixelRenderer';
import { sound } from '../services/audioService';
import { ChevronRight, Compass, Sparkles } from 'lucide-react';

interface PrologueModalProps {
  playerName: string;
  gender: HeroGender;
  onContinue: () => void;
}

export const PrologueModal: React.FC<PrologueModalProps> = ({
  playerName,
  gender,
  onContinue,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const frameRef = useRef(0);

  const passive = HERO_PASSIVES[gender];

  const dialogues = [
    {
      speaker: `${playerName} · Diario del Hogar`,
      badge: 'EL MUNDO DEL SUR',
      text: `Soy ${playerName}. Vivo en un país largo y vivo donde cada región —desde Santiago y los valles prehistóricos del Biobío hasta La Araucanía, Los Ríos y Los Lagos— late al ritmo de antiguos espíritus elementales.`,
    },
    {
      speaker: `${playerName} · El Desequilibrio`,
      badge: 'POR QUÉ ELEGIR UN COMPAÑERO',
      text: `Últimamente, la neblina umbría ha despertado a poderosos Guardianes Regionales y Maestros Vínculo. Ningún viajero puede recorrer estos senderos en solitario: necesito vincular mi destino al de un primer espíritu compañero.`,
    },
    {
      speaker: `${playerName} · Tu Misión`,
      badge: 'OBJETIVO DEL JUEGO',
      text: `Debo escoger a mi criatura inicial, partir desde mi Casa (Escenario 0), explorar caminos y zonas salvajes, fortalecer mi equipo mediante combates y evoluciones, y restaurar la armonía derrotando a los 5 Guardianes de Chile.`,
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
          // Subtle monochrome floor shadow
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath();
          ctx.ellipse(canvas.width / 2, canvas.height - 16, 36, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          const bobOffset = Math.sin(frameRef.current * 0.08) * 3;
          drawBarbaraSprite(
            ctx,
            canvas.width / 2 - 42,
            10 + bobOffset,
            84,
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
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-2xl bg-zinc-900 border-2 border-zinc-400/70 rounded-3xl p-4 sm:p-7 shadow-2xl flex flex-col gap-4 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-zinc-200 shrink-0" />
            <span className="font-silkscreen text-[11px] sm:text-xs text-zinc-100 tracking-wide">
              PRÓLOGO DEL VIAJERO · CAPÍTULO {stepIndex + 1}/{dialogues.length}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-950 font-silkscreen text-[9px] font-bold">
            {currentSlide.badge}
          </span>
        </div>

        {/* Protagonist Showcase + Narrative Card */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-zinc-950/85 border border-zinc-800 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 border-2 border-zinc-500/60 flex items-center justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                width={112}
                height={112}
                className="w-24 h-24 sm:w-28 sm:h-28 image-render-pixel"
              />
            </div>
            <div className="mt-2 text-center">
              <div className="font-silkscreen text-xs text-zinc-100 font-bold">{playerName}</div>
              <div className="text-[10px] font-ui text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                <span>{passive.icon}</span>
                <span>{passive.name}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between gap-3 text-left w-full">
            <div className="font-silkscreen text-xs text-zinc-300 border-b border-zinc-800 pb-1.5">
              {currentSlide.speaker}
            </div>
            <p className="font-ui text-sm sm:text-base text-zinc-100 leading-relaxed min-h-[5.5rem]">
              &ldquo;{currentSlide.text}&rdquo;
            </p>
            {/* Progress Dots */}
            <div className="flex items-center gap-2 pt-1">
              {dialogues.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === stepIndex
                      ? 'w-8 bg-zinc-100'
                      : idx < stepIndex
                      ? 'w-4 bg-zinc-500'
                      : 'w-4 bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-1">
          {stepIndex > 0 ? (
            <button
              onClick={() => {
                sound.playSelect();
                setStepIndex(prev => prev - 1);
              }}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 rounded-xl font-silkscreen text-[11px] cursor-pointer active:scale-95 transition-transform"
            >
              ATRÁS
            </button>
          ) : (
            <div className="text-[11px] font-ui text-zinc-400">
              Escucha el contexto antes de elegir tu espíritu.
            </div>
          )}

          <button
            onClick={handleNext}
            className="px-6 py-3 bg-zinc-100 hover:bg-white text-zinc-950 font-silkscreen text-xs font-bold rounded-xl shadow-lg cursor-pointer flex items-center gap-2 border border-zinc-300 active:scale-95 transition-transform ml-auto"
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
