/**
 * Title Screen for Bárbara: Crónicas Elementales del Sur
 * Retro Game Shell tuned for compact mobile no-scroll fit.
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Compass, Flame, Droplets, Wind, Mountain } from 'lucide-react';
import { sound } from '../services/audioService';

interface TitleScreenProps {
  onStartGame: () => void;
  onContinueGame?: () => void;
  onResetGame?: () => void;
  hasSave?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onContinueGame,
  hasSave = false,
  isMuted,
  onToggleMute,
}) => {
  const [showLore, setShowLore] = useState(false);

  const handleStart = () => {
    sound.init();
    sound.playConfirm();
    onStartGame();
  };

  const handleContinue = () => {
    sound.init();
    sound.playConfirm();
    if (onContinueGame) onContinueGame();
    else onStartGame();
  };

  return (
    <div className="relative w-full h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col justify-between overflow-hidden select-none">
      {/* Monochrome Andean Mountain Backdrop */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black">
        <svg
          className="absolute bottom-0 w-full h-64 sm:h-80 opacity-60 pointer-events-none"
          viewBox="0 0 1200 400"
          preserveAspectRatio="none"
        >
          <polygon points="0,400 150,220 280,300 450,160 620,290 800,180 980,270 1200,190 1200,400" fill="#18181b" />
          <polygon points="400,400 520,130 640,400" fill="#27272a" />
          <circle cx="520" cy="130" r="14" fill="#d4d4d8" opacity="0.45" className="animate-pulse" />
          <polygon points="0,400 80,340 180,400 290,330 420,400 560,350 720,400 860,330 1020,390 1200,340 1200,400" fill="#09090b" opacity="0.9" />
        </svg>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                width: `${(i % 3) + 2}px`,
                height: `${(i % 3) + 2}px`,
                top: `${(i * 17) % 100}%`,
                left: `${(i * 23) % 100}%`,
                backgroundColor: i % 3 === 0 ? '#f4f4f5' : i % 3 === 1 ? '#a1a1aa' : '#52525b',
                opacity: 0.45,
                animationDuration: `${3 + (i % 4)}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full p-3 sm:p-4 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur border border-zinc-700 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-mono text-zinc-200">
          <Sparkles className="w-3 h-3 text-zinc-100" />
          <span>RPG TÁCTICO · CHILE</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              sound.playSelect();
              setShowLore(!showLore);
            }}
            className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-[11px] font-mono text-zinc-200 flex items-center gap-1 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-zinc-300" />
            <span>{showLore ? 'Volver' : 'Guía'}</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 cursor-pointer"
            title={isMuted ? 'Activar Sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-zinc-100" />}
          </button>
        </div>
      </header>

      {/* Main Center */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-3 max-w-3xl mx-auto">
        {showLore ? (
          <div className="bg-zinc-900/95 border-2 border-zinc-400/70 p-4 sm:p-6 rounded-2xl max-w-xl text-left shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-pixel text-zinc-100 text-xs sm:text-sm mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4 text-zinc-200" />
              CRÓNICAS ELEMENTALES DE CHILE
            </h3>
            <p className="text-zinc-300 text-xs leading-relaxed mb-3">
              Elige a Bárbara, Felipe o Isabella desde su Hogar (Escenario 0) y recorre 5 regiones chilenas para reunir las 5 Medallas de Guardianes.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-[11px] font-mono">
              <div className="p-2 bg-zinc-950/80 border border-zinc-700 rounded-lg">
                <span className="text-zinc-100 block font-bold">0. Casa · 1. RM · 2. Biobío</span>
                Hogar seguro, Botica, Hospital y claro fósil con dinosaurios.
              </div>
              <div className="p-2 bg-zinc-950/80 border border-zinc-700 rounded-lg">
                <span className="text-zinc-100 block font-bold">3. Araucanía · 4. Ríos · 5. Lagos</span>
                Bosques, lluvia valdiviana, tormentas y las Serpientes Australes.
              </div>
            </div>
            <p className="text-zinc-400 text-[11px] mb-3">
              Caminos: <strong className="text-zinc-100">0.5% - 1%</strong> salvajes · Fuera de camino: <strong className="text-zinc-100">1% - 3%</strong>.
            </p>
            <button
              onClick={() => setShowLore(false)}
              className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg font-pixel text-xs font-bold cursor-pointer"
            >
              VOLVER AL TÍTULO
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-2.5 mb-2.5">
              <span className="p-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-200"><Droplets className="w-3.5 h-3.5 rotate-180" /></span>
              <span className="p-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-200"><Flame className="w-3.5 h-3.5" /></span>
              <span className="p-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-200"><Droplets className="w-3.5 h-3.5" /></span>
              <span className="p-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-200"><Wind className="w-3.5 h-3.5" /></span>
              <span className="p-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-200"><Mountain className="w-3.5 h-3.5" /></span>
            </div>

            <h1 className="font-silkscreen text-3xl sm:text-5xl font-black text-zinc-100 drop-shadow-[0_4px_16px_rgba(255,255,255,0.2)] tracking-wide mb-1.5">
              BÁRBARA
            </h1>
            <h2 className="font-epic text-base sm:text-2xl font-bold text-zinc-200 tracking-wider uppercase mb-1">
              Crónicas Elementales del Sur
            </h2>
            <p className="text-[11px] sm:text-sm text-zinc-400 font-mono-stat tracking-wider mb-5 sm:mb-7">
              &mdash; El Despertar de los Espíritus Chilenos &mdash;
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 mb-4">
              {hasSave ? (
                <>
                  <button
                    onClick={handleContinue}
                    className="px-6 py-3 bg-zinc-100 hover:bg-white border-2 border-zinc-300 rounded-xl font-silkscreen text-xs sm:text-sm text-zinc-950 font-bold shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-zinc-900" />
                    <span>CONTINUAR PARTIDA</span>
                  </button>

                  <button
                    onClick={handleStart}
                    className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 rounded-xl font-silkscreen text-xs text-zinc-200 hover:text-white cursor-pointer"
                  >
                    NUEVA EXPEDICIÓN
                  </button>
                </>
              ) : (
                <button
                  onClick={handleStart}
                  className="px-7 py-3.5 bg-zinc-100 hover:bg-white border-2 border-zinc-300 rounded-xl font-silkscreen text-xs sm:text-sm text-zinc-950 font-bold shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-zinc-900" />
                  <span>INICIAR EXPEDICIÓN</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 max-w-md text-[10px] font-mono text-zinc-300">
              <span className="px-2 py-0.5 bg-zinc-900/90 border border-zinc-700 rounded-md">Casa + 5 Regiones</span>
              <span className="px-2 py-0.5 bg-zinc-900/90 border border-zinc-700 rounded-md">3 Protagonistas</span>
              <span className="px-2 py-0.5 bg-zinc-900/90 border border-zinc-700 rounded-md">5 Medallas</span>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 w-full py-2.5 px-3 border-t border-zinc-800 bg-zinc-950/95 text-center">
        <p className="font-silkscreen text-[9px] sm:text-xs text-zinc-400">
          <span className="text-zinc-100">Cruceta Táctil</span> Explorar &middot; <span className="text-zinc-100">ACCIÓN</span> Interactuar &middot; <span className="text-zinc-100">Menú</span> Guardado y Medallas
        </p>
      </footer>
    </div>
  );
};
