/**
 * Retro RPG Dialogue Box for Bárbara: Crónicas Elementales del Sur
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
    const resolvedSprite =
      portraitSprite ||
      (speakerName.toLowerCase().includes('manuel') ||
      speakerName.toLowerCase().includes('millaray') ||
      speakerName.toLowerCase().includes('fresia') ||
      speakerName.toLowerCase().includes('boticario')
        ? 'npc_shopkeeper'
        : speakerName.toLowerCase().includes('maestro')
        ? 'npc_maestro_vinculo'
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

  const hasSpritePortrait = Boolean(
    portraitSprite ||
      speakerName.toLowerCase().includes('manuel') ||
      speakerName.toLowerCase().includes('millaray') ||
      speakerName.toLowerCase().includes('fresia') ||
      speakerName.toLowerCase().includes('maestro') ||
      speakerName.toLowerCase().includes('boticario') ||
      portraitType === 'shopkeeper'
  );

  const getPortrait = () => {
    if (speakerName.toLowerCase().includes('bárbara') || speakerName.toLowerCase().includes('barbara')) return '🎒';
    if (speakerName.toLowerCase().includes('costanera')) return '🏙️';
    if (speakerName.toLowerCase().includes('araucaria')) return '🌲';
    if (speakerName.toLowerCase().includes('torreón')) return '🏰';
    if (speakerName.toLowerCase().includes('t-rex')) return '🦖';
    if (speakerName.toLowerCase().includes('cai cai') || speakerName.toLowerCase().includes('vilu')) return '🐉';
    if (speakerName.toLowerCase().includes('ignacio')) return '📜';
    if (speakerName.toLowerCase().includes('checho')) return '🪵';
    if (speakerName.toLowerCase().includes('mamá') || speakerName.toLowerCase().includes('elena')) return '🏡';
    return '💬';
  };

  return (
    <div className="fixed bottom-3 left-3 right-3 md:left-12 md:right-12 z-50 select-none">
      <div
        onClick={() => {
          sound.init();
          handleAdvance();
        }}
        className="bg-zinc-900/95 border-4 border-zinc-300/80 rounded-xl p-3.5 sm:p-4 md:p-5 shadow-2xl shadow-black/90 flex items-start gap-3 sm:gap-4 cursor-pointer relative active:scale-[0.99] transition-transform"
      >
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            sound.init();
            sound.playCancel();
            onComplete();
          }}
          className="absolute top-2 right-2 p-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs font-mono flex items-center gap-1 z-10"
          title="Cerrar Diálogo"
        >
          <span>Cerrar</span>
          <span>✕</span>
        </button>

        {/* Speaker Pixel Portrait Box */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl bg-zinc-950 border-2 border-zinc-500 flex-shrink-0 flex items-center justify-center text-2xl sm:text-3xl shadow-inner overflow-hidden">
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
        <div className="flex-1 min-w-0 pr-14 sm:pr-16">
          <div className="inline-block px-2.5 py-0.5 bg-zinc-100 text-zinc-950 rounded font-silkscreen text-[10px] sm:text-[11px] font-bold mb-1.5 tracking-wide">
            {speakerName}
          </div>

          <p className="text-zinc-100 font-retro text-base sm:text-lg md:text-xl leading-snug tracking-wide min-h-[44px]">
            {displayedText}
          </p>

          <div className="flex justify-between items-center mt-2 text-[10px] font-mono text-zinc-400">
            <span>Línea {currentLineIndex + 1} de {lines.length}</span>
            <span className="text-zinc-200 animate-bounce font-silkscreen text-[9px] sm:text-[10px]">
              {isTyping ? '···' : '▼ Toca para continuar'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
