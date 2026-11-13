/**
 * Protagonist Narrative Prologue Screen
 * Appears AFTER choosing character/name and BEFORE selecting the starter creature,
 * featuring a sequence of 3 distinct regional illustrations plus the animated protagonist sprite.
 */

import React, { useEffect, useRef, useState } from 'react';
import { HeroGender } from '../types/game';
import { drawBarbaraSprite } from '../utils/pixelRenderer';
import { sound } from '../services/audioService';
import { ChevronRight, Compass, FastForward, Sparkles } from 'lucide-react';
import introMundoImg from '../assets/images/intro_mundo_sur_1794548849765.jpg';
import introCompaImg from '../assets/images/intro_compa_vinculo_1794548849395.jpg';
import introTravesiaImg from '../assets/images/intro_travesia_patagonia_1794548849326.jpg';

interface PrologueModalProps {
  playerName: string;
  gender: HeroGender;
  onContinue: () => void;
}

const ROLE_BADGE: Record<HeroGender, string> = {
  female: '♀ La Elegida',
  male: '♂ El Elegido',
  isabella: '🌿 Joven Elegida',
};

export const PrologueModal: React.FC<PrologueModalProps> = ({
  playerName,
  gender,
  onContinue,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [displayedChars, setDisplayedChars] = useState(0);
  const frameRef = useRef(0);

  const dialogues = [
    {
      speaker: `${playerName} · La Amenaza en el Sur`,
      badge: 'CAPÍTULO I · EL LLAMADO',
      imageUrl: introMundoImg,
      imageAlt: 'Valle Central y Cordillera de los Andes al amanecer',
      fallbackGradient: 'from-sky-900 via-emerald-900 to-zinc-950',
      text: `Soy ${playerName}, el Elegido. Proyectos industriales sin resguardo ambiental buscan explotar los bosques, ríos y fiordos del sur de Chile, dejando heridas en el equilibrio natural.`,
    },
    {
      speaker: `${playerName} · Alianza Espiritual`,
      badge: 'CAPÍTULO II · EDUCAR Y SANAR',
      imageUrl: introCompaImg,
      imageAlt: 'Bosque de Araucarias y volcán con Criaturas Espirituales',
      fallbackGradient: 'from-emerald-950 via-amber-900/70 to-zinc-950',
      text: `No estoy solo: las Criaturas Espirituales están dispuestas a luchar a mi lado para defender su hogar. Juntos debemos limpiar cada región, educar a sus pueblos y sanar la tierra.`,
    },
    {
      speaker: `${playerName} · La Misión Austral`,
      badge: 'CAPÍTULO III · CINCO REGIONES',
      imageUrl: introTravesiaImg,
      imageAlt: 'Selva Valdiviana y fiordos australes nevados de la Patagonia',
      fallbackGradient: 'from-cyan-950 via-slate-800 to-zinc-950',
      text: `Hoy dejo atrás mi Casa para escalar cumbres, unir a las Criaturas Espirituales y conseguir los 5 Amuletos Espirituales que devolverán la vida limpia de la cordillera al mar.`,
    },
  ];

  const currentSlide = dialogues[stepIndex];
  const isLast = stepIndex === dialogues.length - 1;
  const fullText = currentSlide.text;
  const isTyping = displayedChars < fullText.length;

  useEffect(() => {
    setDisplayedChars(0);
    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      setDisplayedChars(idx);
      if (idx % 4 === 0) {
        sound.playStep();
      }
      if (idx >= fullText.length) {
        clearInterval(timer);
      }
    }, 18);

    return () => clearInterval(timer);
  }, [stepIndex, fullText]);

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
          ctx.ellipse(canvas.width / 2, canvas.height - 10, 26, 7, 0, 0, Math.PI * 2);
          ctx.fill();

          const bobOffset = Math.sin(frameRef.current * 0.08) * 2.5;
          drawBarbaraSprite(
            ctx,
            canvas.width / 2 - 34,
            6 + bobOffset,
            68,
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
    if (isTyping) {
      sound.playSelect();
      setDisplayedChars(fullText.length);
      return;
    }
    sound.playConfirm();
    if (!isLast) {
      setStepIndex(prev => prev + 1);
    } else {
      onContinue();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#E7E7E2]/98 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto select-none text-[#1E2022]">
      <div className="w-full max-w-xl bg-[#F4F4F2] border-2 border-zinc-400 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-2xl flex flex-col gap-2.5 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Saltar Prólogo */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-300 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Compass className="w-4 h-4 text-[#1E2022] shrink-0" />
            <span className="font-silkscreen text-[10px] sm:text-xs text-[#1E2022] font-bold truncate">
              PRÓLOGO · {stepIndex + 1}/{dialogues.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-[#1E2022] text-[#F4F4F2] font-silkscreen text-[9px] font-bold">
              {currentSlide.badge}
            </span>
            <button
              type="button"
              onClick={() => {
                sound.playSelect();
                onContinue();
              }}
              className="px-2.5 py-1.5 min-h-[36px] bg-stone-200 hover:bg-stone-300 border border-zinc-400 text-[#1E2022] rounded-lg font-silkscreen text-[9px] font-bold cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
            >
              <span>Saltar Prólogo</span>
              <FastForward className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Clean Immersive Visual Scene Banner */}
        <div className="relative w-full aspect-video max-h-[185px] sm:max-h-[225px] rounded-xl overflow-hidden border-2 border-zinc-400 bg-zinc-900 shadow-inner">
          {!failedImages[stepIndex] ? (
            <img
              key={currentSlide.imageUrl}
              src={currentSlide.imageUrl}
              alt={currentSlide.imageAlt}
              referrerPolicy="no-referrer"
              onError={() => setFailedImages(prev => ({ ...prev, [stepIndex]: true }))}
              className="w-full h-full object-cover object-center animate-prologue-pan"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${currentSlide.fallbackGradient} animate-prologue-pan`} />
          )}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div className="env-sunbeams-shimmer opacity-55" />
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="env-pollen-dot"
                style={
                  {
                    left: `${(i * 11 + 6) % 92}%`,
                    top: `${(i * 17 + 14) % 80}%`,
                    width: `${3 + (i % 3)}px`,
                    height: `${3 + (i % 3)}px`,
                    '--dur': `${3.6 + (i % 4) * 0.7}s`,
                    '--delay': `${-(i * 0.55)}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
            <span className="px-2 py-0.5 rounded bg-[#F4F4F2]/92 border border-zinc-400 text-[9px] font-mono font-bold text-[#1E2022] truncate">
              {currentSlide.imageAlt}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#1E2022]/90 text-[#F4F4F2] text-[9px] font-silkscreen font-bold shrink-0">
              {stepIndex + 1}/{dialogues.length}
            </span>
          </div>
        </div>

        {/* Protagonist Avatar + Fixed-Size Typewriter Narrative Card */}
        <div
          onClick={handleNext}
          className="flex items-center gap-3 bg-[#E7E7E2] border-2 border-zinc-400 rounded-2xl p-2.5 sm:p-3.5 cursor-pointer"
        >
          <div className="flex flex-col items-center shrink-0">
            <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-xl bg-zinc-900 border-2 border-zinc-500 flex items-center justify-center shadow-inner">
              <canvas
                ref={canvasRef}
                width={90}
                height={90}
                className="w-16 h-16 sm:w-20 sm:h-20 image-render-pixel"
              />
            </div>
            <div className="mt-1 text-center">
              <div className="font-silkscreen text-[10px] text-[#1E2022] font-bold leading-tight truncate max-w-[84px]">
                {playerName}
              </div>
              <div className="text-[9px] font-ui text-zinc-700 leading-tight">{ROLE_BADGE[gender]}</div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between gap-1.5 text-left min-w-0">
            <div className="font-silkscreen text-[10px] sm:text-[11px] text-[#1E2022] font-bold border-b border-zinc-300 pb-1 truncate">
              {currentSlide.speaker}
            </div>
            <div className="h-[84px] sm:h-[92px] overflow-hidden flex items-start">
              <p className="font-ui text-xs sm:text-[13px] text-[#1E2022] leading-snug sm:leading-relaxed line-clamp-4">
                &ldquo;{fullText.slice(0, displayedChars)}
                {isTyping && <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-[#1E2022] align-middle animate-pulse" />}
                {!isTyping && <>&rdquo;</>}
              </p>
            </div>
            {/* Progress Dots */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-1.5">
                {dialogues.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === stepIndex
                        ? 'w-7 bg-[#1E2022]'
                        : idx < stepIndex
                        ? 'w-3.5 bg-emerald-600'
                        : 'w-3.5 bg-zinc-400'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[9px] font-mono text-zinc-700">
                {isTyping ? 'Escribiendo...' : 'Toca para seguir'}
              </span>
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
              className="px-3.5 py-2.5 min-h-[42px] bg-stone-200 hover:bg-stone-300 text-[#1E2022] border border-zinc-400 rounded-xl font-silkscreen text-[10px] sm:text-[11px] font-bold cursor-pointer active:scale-95"
            >
              ATRÁS
            </button>
          ) : (
            <span className="text-[10px] font-ui text-zinc-700">
              Toca el diálogo para acelerar o avanzar.
            </span>
          )}

          <button
            onClick={handleNext}
            className="px-5 py-2.5 min-h-[42px] bg-[#1E2022] hover:bg-zinc-800 text-[#F4F4F2] font-silkscreen text-[11px] sm:text-xs font-bold rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5 border border-[#1E2022] active:scale-95 ml-auto"
          >
            {isTyping ? (
              <>
                <span>COMPLETAR TEXTO</span>
                <ChevronRight className="w-4 h-4" />
              </>
            ) : isLast ? (
              <>
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>ELEGIR MI CRIATURA</span>
              </>
            ) : (
              <>
                <span>CONTINUAR</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
