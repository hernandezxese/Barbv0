/**
 * Title Screen for Bárbara: Crónicas Elementales del Sur
 * Retro Game Shell with bespoke SVG title lockup, atmospheric Chilean mountain panoramas,
 * audio initialization, and control indicators.
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
  onResetGame,
  hasSave = false,
  isMuted,
  onToggleMute
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
    <div className="relative w-full min-h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col justify-between overflow-x-hidden overflow-y-auto select-none">
      {/* Monochrome Andean Mountain & Dusk Backdrop */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black">
        <svg
          className="absolute bottom-0 w-full h-80 opacity-60 pointer-events-none"
          viewBox="0 0 1200 400"
          preserveAspectRatio="none"
        >
          <polygon points="0,400 150,220 280,300 450,160 620,290 800,180 980,270 1200,190 1200,400" fill="#18181b" />
          <polygon points="400,400 520,130 640,400" fill="#27272a" />
          <circle cx="520" cy="130" r="14" fill="#d4d4d8" opacity="0.45" className="animate-pulse" />
          <polygon points="0,400 80,340 180,400 290,330 420,400 560,350 720,400 860,330 1020,390 1200,340 1200,400" fill="#09090b" opacity="0.9" />
        </svg>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(24)].map((_, i) => (
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
      <header className="relative z-10 w-full p-4 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur border border-zinc-700 px-3 py-1.5 rounded-full text-xs font-mono text-zinc-200">
          <Sparkles className="w-3.5 h-3.5 text-zinc-100" />
          <span>RPG TÁCTICO &middot; CHILE NATURE FANTASY</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playSelect();
              setShowLore(!showLore);
            }}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-zinc-300" />
            <span>{showLore ? 'Cerrar Lore' : 'Guía de Expedición'}</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 transition-colors cursor-pointer"
            title={isMuted ? 'Activar Sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-zinc-100" />}
          </button>
        </div>
      </header>

      {/* Main Center: Hero Title Lockup */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto py-4">
        {showLore ? (
          <div className="bg-zinc-900/95 border-2 border-zinc-400/70 p-5 md:p-7 rounded-2xl max-w-2xl text-left shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-pixel text-zinc-100 text-sm md:text-base mb-3 flex items-center gap-2">
              <Compass className="w-5 h-5 text-zinc-200" />
              CRÓNICAS ELEMENTALES DE CHILE
            </h3>
            <p className="text-zinc-300 text-xs md:text-sm leading-relaxed mb-4">
              Quienes portan la <span className="text-white font-semibold">Reliquia Pewén</span> parten desde su hogar (Escenario 0) recorriendo cinco regiones para purificar a los guardianes ancestrales.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 text-xs font-mono">
              <div className="p-2.5 bg-zinc-950/80 border border-zinc-700 rounded-lg">
                <span className="text-zinc-100 block font-bold">0. Casa &middot; 1. Metropolitana:</span>
                Hogar inicial y valles centrales con el Guardián Costanera.
              </div>
              <div className="p-2.5 bg-zinc-950/80 border border-zinc-700 rounded-lg">
                <span className="text-zinc-100 block font-bold">2. Región del Biobío:</span>
                Cielos nublados, enclaves prehistóricos y el T-Rex del Laja.
              </div>
              <div className="p-2.5 bg-zinc-950/80 border border-zinc-700 rounded-lg">
                <span className="text-zinc-100 block font-bold">3. La Araucanía:</span>
                Araucarias milenarias, mercado andino y la Araucaria Madre.
              </div>
              <div className="p-2.5 bg-zinc-950/80 border border-zinc-700 rounded-lg">
                <span className="text-zinc-100 block font-bold">4. Los Ríos &middot; 5. Los Lagos:</span>
                Torreón valdiviano, fiordos australes, Cai Cai y Vilu Vilu.
              </div>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed mb-4">
              En los caminos la probabilidad de encuentro salvaje es del <strong className="text-zinc-100">5%</strong>; fuera de los caminos asciende al <strong className="text-zinc-100">40%</strong>.
            </p>
            <button
              onClick={() => setShowLore(false)}
              className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg font-pixel text-xs tracking-wider font-bold cursor-pointer"
            >
              VOLVER A LA PANTALLA DE TÍTULO
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="p-2 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-200" title="Planta">
                <Droplets className="w-4 h-4 rotate-180" />
              </span>
              <span className="p-2 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-200" title="Fuego">
                <Flame className="w-4 h-4" />
              </span>
              <span className="p-2 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-200" title="Agua">
                <Droplets className="w-4 h-4" />
              </span>
              <span className="p-2 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-200" title="Viento">
                <Wind className="w-4 h-4" />
              </span>
              <span className="p-2 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-200" title="Tierra">
                <Mountain className="w-4 h-4" />
              </span>
            </div>

            <h1 className="font-silkscreen text-3xl sm:text-4xl md:text-5xl font-black text-zinc-100 drop-shadow-[0_4px_16px_rgba(255,255,255,0.2)] tracking-wide mb-2">
              BÁRBARA
            </h1>
            <h2 className="font-epic text-lg sm:text-2xl md:text-3xl font-bold text-zinc-200 tracking-wider uppercase mb-1">
              Crónicas Elementales del Sur
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono-stat tracking-wider mb-8">
              &mdash; El Despertar de los Espíritus Chilenos &mdash;
            </p>

            {/* Start / Continue Button Cluster */}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
              {hasSave ? (
                <>
                  <button
                    onClick={handleContinue}
                    className="group relative px-7 py-3.5 bg-zinc-100 hover:bg-white border-2 border-zinc-300 rounded-xl font-silkscreen text-xs sm:text-sm tracking-wider text-zinc-950 font-bold shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-zinc-900 animate-spin" style={{ animationDuration: '4s' }} />
                      <span>CONTINUAR PARTIDA</span>
                    </span>
                  </button>

                  <button
                    onClick={handleStart}
                    className="px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 border-2 border-zinc-700 hover:border-zinc-500 rounded-xl font-silkscreen text-xs tracking-wider text-zinc-200 hover:text-white transition-all cursor-pointer"
                  >
                    NUEVA EXPEDICIÓN
                  </button>
                </>
              ) : (
                <button
                  onClick={handleStart}
                  className="group relative px-8 py-4 bg-zinc-100 hover:bg-white border-2 border-zinc-300 rounded-xl font-silkscreen text-xs sm:text-sm tracking-wider text-zinc-950 font-bold shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-zinc-900 animate-spin" style={{ animationDuration: '4s' }} />
                    <span>INICIAR EXPEDICIÓN</span>
                  </span>
                </button>
              )}
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg text-[11px] font-mono text-zinc-300">
              <span className="px-2.5 py-1 bg-zinc-900/90 border border-zinc-700 rounded-md">
                Escenario 0 + 5 Regiones
              </span>
              <span className="px-2.5 py-1 bg-zinc-900/90 border border-zinc-700 rounded-md">
                Evolución de 3 Etapas
              </span>
              <span className="px-2.5 py-1 bg-zinc-900/90 border border-zinc-700 rounded-md">
                Maestros Vínculo &amp; Jefes
              </span>
              <span className="px-2.5 py-1 bg-zinc-900/90 border border-zinc-700 rounded-md">
                Sinergias Elementales
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Touch Hint Line (Mobile-First) */}
      <footer className="relative z-10 w-full py-3.5 px-4 border-t border-zinc-800 bg-zinc-950/95 text-center">
        <p className="font-silkscreen text-[10px] sm:text-xs text-zinc-400 tracking-wide">
          <span className="text-zinc-100">Cruceta Táctil</span> Explorar &middot; <span className="text-zinc-100">Botón ACCIÓN</span> Hablar / Interactuar &middot; <span className="text-zinc-100">Menú</span> Misiones y Guardado
        </p>
      </footer>
    </div>
  );
};
