/**
 * Title Screen for Crónicas Elementales del Sur (La Travesía del Elegido)
 * Displays animated descriptive game artwork banner, monochrome palette, and compact mobile fit.
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Compass } from 'lucide-react';
import { sound } from '../services/audioService';
import titleBannerImg from '../assets/images/title_chile_banner_1794582894549.jpg';

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
    <div className="relative w-full h-[100dvh] bg-[#E7E7E2] text-[#1E2022] flex flex-col justify-between overflow-hidden select-none">
      {/* Subtle Paper Grain / Minimal Horizon Backdrop */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#F4F4F2] via-[#EAEAE4] to-[#DCDCD4] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-3 py-2.5 sm:p-4 flex justify-between items-center max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-mono text-stone-600">
          <span className="font-bold text-[#1E2022] whitespace-nowrap">RPG ELEMENTAL · CHILE</span>
          <span aria-hidden="true">·</span>
          <span className="text-stone-500 whitespace-nowrap">Barb 1.0</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playSelect();
              setShowLore(!showLore);
            }}
            className="min-h-[40px] px-3 py-2 bg-[#F4F4F2] hover:bg-white border border-stone-300 rounded-lg text-xs font-mono text-[#1E2022] flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-[#1E2022]" />
            <span>{showLore ? 'Volver' : 'Guía'}</span>
          </button>

          <button
            onClick={onToggleMute}
            className="min-h-[40px] min-w-[40px] p-2 bg-[#F4F4F2] hover:bg-white border border-stone-300 rounded-lg text-[#1E2022] cursor-pointer flex items-center justify-center shadow-sm transition-colors"
            title={isMuted ? 'Activar Sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4 text-[#1E2022]" />}
          </button>
        </div>
      </header>

      {/* Main Center */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-3 max-w-2xl mx-auto w-full">
        {showLore ? (
          <div className="bg-[#F4F4F2] border-2 border-stone-300 p-4 sm:p-6 rounded-2xl max-w-xl text-left shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-pixel text-[#1E2022] text-xs sm:text-sm mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-700" />
              CRÓNICAS ELEMENTALES DE CHILE
            </h3>
            <p className="text-stone-700 text-xs leading-relaxed mb-3">
              Encarna al Elegido desde tu Hogar y recorre 5 regiones chilenas para limpiar, educar y sanar el sur de Chile frente a proyectos industriales sin resguardo ambiental, junto a Criaturas Espirituales dispuestas a proteger la naturaleza.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-[11px] font-mono">
              <div className="p-2.5 bg-[#E7E7E2] border border-stone-300 rounded-xl text-[#1E2022]">
                <span className="font-bold block mb-0.5">0. Casa · 1. RM · 2. Biobío</span>
                <span className="text-stone-600">Hogar seguro, Botica, Hospital, Santuario y fósiles jurásicos.</span>
              </div>
              <div className="p-2.5 bg-[#E7E7E2] border border-stone-300 rounded-xl text-[#1E2022]">
                <span className="font-bold block mb-0.5">3. Araucanía · 4. Ríos · 5. Lagos</span>
                <span className="text-stone-600">Bosques, lluvia valdiviana, tormentas y las Serpientes Australes.</span>
              </div>
            </div>
            <p className="text-stone-600 text-[11px] mb-3 font-mono">
              Caminos y vías: <strong className="text-emerald-700">0%</strong> encuentros · Fuera de camino: <strong className="text-[#1E2022]">6% - 16%</strong> según región.
            </p>
            <button
              onClick={() => setShowLore(false)}
              className="w-full min-h-[40px] py-2.5 bg-[#1E2022] hover:bg-zinc-800 text-[#F4F4F2] rounded-xl font-pixel text-xs font-bold cursor-pointer transition-colors"
            >
              VOLVER AL TÍTULO
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full gap-2.5 sm:gap-3.5">
            <div className="space-y-1 text-center">
              <h1 className="font-silkscreen text-xl sm:text-3xl font-black text-[#1E2022] tracking-wide">
                EL ELEGIDO DEL SUR
              </h1>
              <h2 className="font-epic text-xs sm:text-lg font-bold text-stone-600 tracking-[0.16em] uppercase">
                Crónicas Elementales de Chile
              </h2>
            </div>

            {/* Redesigned Hero Artwork Card */}
            <div className="relative w-full max-w-md rounded-2xl overflow-hidden border-2 border-stone-300 shadow-lg bg-[#F4F4F2]">
              <div className="relative aspect-[16/9] overflow-hidden bg-zinc-900">
                <img
                  src={titleBannerImg}
                  alt="El Elegido y tres Criaturas Espirituales contemplando el sur de Chile"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover animate-banner-float image-render-pixel"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
              </div>
              <div className="px-3.5 py-2.5 bg-[#F4F4F2] border-t border-stone-300 flex items-center justify-between text-[11px] font-mono text-stone-700">
                <span className="text-[#1E2022] font-bold">5 Regiones Chilenas</span>
                <span className="text-stone-600">27 Especies · Defensa Natural</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-md justify-center pt-0.5">
              {hasSave ? (
                <>
                  <button
                    onClick={handleContinue}
                    className="w-full sm:flex-1 min-h-[44px] px-6 py-3 bg-[#1E2022] hover:bg-zinc-800 border-2 border-[#1E2022] rounded-xl font-silkscreen text-xs sm:text-sm text-[#F4F4F2] font-bold shadow-md transition-all hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>CONTINUAR PARTIDA</span>
                  </button>

                  <button
                    onClick={handleStart}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-3 bg-[#F4F4F2] hover:bg-white border-2 border-stone-400 rounded-xl font-silkscreen text-xs text-[#1E2022] font-bold cursor-pointer active:scale-95 transition-colors"
                  >
                    NUEVA EXPEDICIÓN
                  </button>
                </>
              ) : (
                <button
                  onClick={handleStart}
                  className="w-full sm:w-auto min-h-[44px] px-8 py-3.5 bg-[#1E2022] hover:bg-zinc-800 border-2 border-[#1E2022] rounded-xl font-silkscreen text-xs sm:text-sm text-[#F4F4F2] font-bold shadow-md transition-all hover:scale-[1.01] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>INICIAR EXPEDICIÓN</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 w-full py-2.5 px-3 border-t border-stone-300 bg-[#F4F4F2]/95 text-center">
        <p className="font-silkscreen text-[9px] sm:text-xs text-stone-600">
          <span className="text-[#1E2022] font-bold">Tocar Mapa</span> Caminar · <span className="text-[#1E2022] font-bold">Tocar Objeto/NPC</span> Interactuar · <span className="text-[#1E2022] font-bold">Menú</span> Misiones y Guardado
        </p>
      </footer>
    </div>
  );
};
