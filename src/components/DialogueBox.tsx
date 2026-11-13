/**
 * Retro RPG Dialogue Box for Crónicas Elementales del Sur
 * Inspired by Pokémon FireRed and classic JRPG dialogue presentations
 */

import React, { useEffect, useRef, useState } from 'react';
import { sound } from '../services/audioService';
import { drawEntitySprite } from '../utils/pixelRenderer';

interface DialogueBoxProps {
  speakerName: string;
  lines: string[];
  onComplete: () => void;
  portraitType?: string;
  portraitSprite?: string;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  speakerName,
  lines,
  onComplete,
  portraitType = 'npc',
  portraitSprite,
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const portraitCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentFullLine = lines[currentLineIndex] || '';

  // Typewriter effect
  useEffect(() => {
    setIsTyping(true);
    setDisplayedText('');
    let charIndex = 0;

    const interval = setInterval(() => {
      if (charIndex < currentFullLine.length) {
        setDisplayedText(currentFullLine.substring(0, charIndex + 1));
        if (charIndex % 3 === 0) {
          sound.playStep();
        }
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [currentLineIndex, currentFullLine]);

  // Animated Pixel Sprite Portrait (shows Don Manuel vendedor, NPCs, & Bosses)
  useEffect(() => {
    const lowerSpeaker = speakerName.toLowerCase();
    const resolvedSprite =
      portraitSprite ||
      (lowerSpeaker.includes('manuel') ||
      lowerSpeaker.includes('millaray') ||
      lowerSpeaker.includes('fresia') ||
      lowerSpeaker.includes('boticario')
        ? 'npc_shopkeeper'
        : lowerSpeaker.includes('maestro')
        ? 'npc_maestro_vinculo'
        : lowerSpeaker.includes('abuela') || lowerSpeaker.includes('mary')
        ? 'npc_abuela'
        : lowerSpeaker.includes('doctora')
        ? 'npc_doctora'
        : lowerSpeaker.includes('doctor')
        ? 'npc_doctor'
        : lowerSpeaker.includes('enfermo')
        ? 'npc_enfermo'
        : lowerSpeaker.includes('enfermera')
        ? 'npc_enfermera'
        : lowerSpeaker.includes('niño')
        ? 'npc_nino'
        : lowerSpeaker.includes('niña')
        ? 'npc_nina'
        : lowerSpeaker.includes('dueña')
        ? 'npc_duena_casa'
        : lowerSpeaker.includes('agricultora')
        ? 'npc_agricultora'
        : undefined);

    if (!resolvedSprite) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame += 0.2;
      const canvas = portraitCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const entityType = resolvedSprite.startsWith('boss_')
            ? 'boss'
            : resolvedSprite.startsWith('wild_')
            ? 'wild_encounter'
            : resolvedSprite.startsWith('deco_')
            ? 'decorative'
            : 'npc';
          drawEntitySprite(ctx, entityType, resolvedSprite, 6, 8, 52, false, frame, true);
        }
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [portraitSprite, speakerName]);

  // Handle advancing dialogue
  const handleAdvance = () => {
    if (isTyping) {
      setDisplayedText(currentFullLine);
      setIsTyping(false);
    } else {
      sound.playSelect();
      if (currentLineIndex < lines.length - 1) {
        setCurrentLineIndex(prev => prev + 1);
      } else {
        onComplete();
      }
    }
  };

  const lowerName = speakerName.toLowerCase();
  const hasSpritePortrait = Boolean(
    portraitSprite ||
      lowerName.includes('manuel') ||
      lowerName.includes('millaray') ||
      lowerName.includes('fresia') ||
      lowerName.includes('maestro') ||
      lowerName.includes('boticario') ||
      lowerName.includes('abuela') ||
      lowerName.includes('mary') ||
      lowerName.includes('doctor') ||
      lowerName.includes('enferm') ||
      lowerName.includes('niñ') ||
      lowerName.includes('dueña') ||
      lowerName.includes('agricultora') ||
      portraitType === 'shopkeeper'
  );

  const getPortrait = () => {
    if (lowerName.includes('elegid') || lowerName.includes('bárbara') || lowerName.includes('barbara')) return '🎒';
    if (lowerName.includes('costanera')) return '🏙️';
    if (lowerName.includes('araucaria')) return '🌲';
    if (lowerName.includes('torreón')) return '🏰';
    if (lowerName.includes('t-rex')) return '🦖';
    if (lowerName.includes('cai cai') || lowerName.includes('vilu')) return '🐉';
    if (lowerName.includes('ignacio')) return '📜';
    if (lowerName.includes('checho')) return '🪵';
    if (lowerName.includes('abuela') || lowerName.includes('mary')) return '🏡';
    return '💬';
  };

  return (
    <div className="fixed bottom-3 left-3 right-3 md:left-12 md:right-12 z-50 select-none">
      <div
        onClick={() => {
          sound.init();
          handleAdvance();
        }}
        className="bg-[#F4F4F2]/98 border-4 border-[#1E2022] rounded-xl p-3.5 sm:p-4 md:p-5 shadow-2xl flex items-start gap-3 sm:gap-4 cursor-pointer relative active:scale-[0.99] transition-transform text-[#1E2022]"
      >
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            sound.init();
            sound.playCancel();
            onComplete();
          }}
          className="absolute top-2 right-2 min-h-[36px] px-2.5 py-1.5 bg-[#E7E7E2] hover:bg-stone-300 border border-stone-400 rounded-lg text-[#1E2022] transition-colors cursor-pointer text-xs font-mono font-bold flex items-center gap-1 z-10"
          title="Cerrar Diálogo"
        >
          <span>Cerrar</span>
          <span>✕</span>
        </button>

        {/* Speaker Pixel Portrait Box */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl bg-zinc-900 border-2 border-stone-400 flex-shrink-0 flex items-center justify-center text-2xl sm:text-3xl shadow-inner overflow-hidden text-white">
          {hasSpritePortrait ? (
            <canvas
              ref={portraitCanvasRef}
              width={64}
              height={64}
              className="w-full h-full image-render-pixel object-contain"
            />
          ) : (
            getPortrait()
          )}
        </div>

        {/* Text Area */}
        <div className="flex-1 min-w-0 pr-16 sm:pr-20">
          <div className="inline-block px-2.5 py-0.5 bg-[#1E2022] text-[#F4F4F2] rounded font-silkscreen text-[10px] sm:text-[11px] font-bold mb-1.5 tracking-wide">
            {speakerName}
          </div>

          <div className="h-[60px] sm:h-[68px] overflow-hidden flex items-start">
            <p className="text-[#1E2022] font-retro text-base sm:text-lg md:text-xl leading-snug tracking-wide line-clamp-3">
              {displayedText}
            </p>
          </div>

          <div className="flex justify-between items-center mt-2 text-[10px] font-mono text-stone-600 tabular-nums">
            <span>Línea {currentLineIndex + 1} de {lines.length}</span>
            <span className="text-[#1E2022] font-bold animate-bounce font-silkscreen text-[9px] sm:text-[10px]">
              {isTyping ? '···' : '▼ Toca para continuar'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
