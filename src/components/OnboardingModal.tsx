/**
 * Post-Starter Onboarding Modal
 * Displays Main Objective, Secondary Objectives (Base & Master Bestiary),
 * and Clear Mobile Touch Controls right after choosing the starter creature.
 */

import React, { useState } from 'react';
import { Award, BookMarked, Compass, Footprints, Hand, Sparkles, Target } from 'lucide-react';
import { sound } from '../services/audioService';

interface OnboardingModalProps {
  heroName: string;
  starterName: string;
  totalBaseSpecies: number;
  totalEvolutionForms: number;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  heroName,
  starterName,
  totalBaseSpecies,
  totalEvolutionForms,
  onComplete,
}) => {
  const [step, setStep] = useState<0 | 1>(0);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/94 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 select-none text-zinc-100 font-ui">
      <div className="max-w-lg w-full bg-zinc-900 border-2 border-zinc-400 rounded-3xl p-4 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-3 max-h-[94dvh] overflow-y-auto">
        {/* Progress Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center">
              {step === 0 ? <Target className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
            </span>
            <div>
              <h2 className="font-silkscreen text-xs sm:text-sm text-zinc-100">
                {step === 0 ? 'OBJETIVOS DE LA EXPEDICIÓN' : 'CÓMO JUGAR'}
              </h2>
              <p className="text-[10px] font-mono text-zinc-400">
                {heroName} y {starterName} · Paso {step + 1}/2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-full ${step === 0 ? 'bg-zinc-100' : 'bg-zinc-700'}`} />
            <span className={`w-2.5 h-2.5 rounded-full ${step === 1 ? 'bg-zinc-100' : 'bg-zinc-700'}`} />
          </div>
        </div>

        {step === 0 ? (
          <div className="space-y-2.5">
            {/* Main Objective */}
            <div className="p-3 bg-zinc-100 text-zinc-950 rounded-2xl border border-zinc-300 shadow">
              <div className="flex items-center gap-1.5 font-silkscreen text-[10px] uppercase font-bold mb-1 text-zinc-800">
                <Award className="w-3.5 h-3.5" />
                <span>Objetivo Principal</span>
              </div>
              <p className="text-xs font-mono font-bold leading-snug">
                Recorre las 5 Regiones de Chile (desde R. Metropolitana hasta Los Lagos), vence a los Guardianes Regionales y reúne las 5 Medallas para restaurar la armonía.
              </p>
            </div>

            {/* Secondary Objectives */}
            <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 font-silkscreen text-[10px] uppercase text-zinc-200">
                <BookMarked className="w-3.5 h-3.5" />
                <span>Objetivos Secundarios</span>
              </div>

              <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="font-silkscreen text-[10px] text-zinc-100">
                  1. Bestiario Base ({totalBaseSpecies} especies)
                </div>
                <p className="text-[11px] font-mono text-zinc-400 mt-0.5 leading-snug">
                  Avista y vincula a las {totalBaseSpecies} criaturas nativas, prehistóricas y legendarias de cada stage.
                </p>
              </div>

              <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                <div className="font-silkscreen text-[10px] text-zinc-100">
                  2. Bestiario Maestro ({totalEvolutionForms} formas evolutivas)
                </div>
                <p className="text-[11px] font-mono text-zinc-400 mt-0.5 leading-snug">
                  Evoluciona tus espíritus en los <strong className="text-zinc-200">Templos de Evolución (Stages 2 y 4)</strong> para registrar todas las especies y evoluciones posibles.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-[11px] font-mono">
            <div className="p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl flex items-start gap-2.5">
              <Footprints className="w-4 h-4 text-zinc-100 shrink-0 mt-0.5" />
              <div>
                <div className="font-silkscreen text-[10px] text-zinc-100 mb-0.5">
                  Tocar el Mapa para Moverse
                </div>
                <p className="text-zinc-300 leading-snug">
                  Toca cualquier punto visible del mapa para caminar automáticamente. Los caminos y vías férreas tienen <strong className="text-white">0% encuentros</strong>; fuera de camino <strong className="text-white">1%-3%</strong>.
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl flex items-start gap-2.5">
              <Hand className="w-4 h-4 text-zinc-100 shrink-0 mt-0.5" />
              <div>
                <div className="font-silkscreen text-[10px] text-zinc-100 mb-0.5">
                  Botón ACCIÓN &amp; Auto-Interactuar
                </div>
                <p className="text-zinc-300 leading-snug">
                  Toca directamente a personas, cofres, puertas o espíritus, o acércate y presiona <strong className="text-white">ACCIÓN</strong>. Los mensajes importantes aparecerán a su derecha.
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-zinc-100 shrink-0 mt-0.5" />
              <div>
                <div className="font-silkscreen text-[10px] text-zinc-100 mb-0.5">
                  Espíritu Líder Activo y Templos
                </div>
                <p className="text-zinc-300 leading-snug">
                  Para abrir barreras elementales (Tierra, Fuego, Agua, Planta, Hielo) debes equipar en <strong className="text-white">Equipo</strong> como <strong className="text-white">Líder Activo</strong> a un espíritu de ese elemento. Las evoluciones solo se realizan dentro de los Templos físicos (Stages 2 y 4).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="flex gap-2 pt-1">
          {step === 1 && (
            <button
              onClick={() => {
                sound.playSelect();
                setStep(0);
              }}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl font-silkscreen text-[11px] text-zinc-200 cursor-pointer"
            >
              &larr; Atrás
            </button>
          )}
          <button
            onClick={() => {
              sound.playConfirm();
              if (step === 0) setStep(1);
              else onComplete();
            }}
            className="flex-1 py-2.5 bg-zinc-100 hover:bg-white border border-zinc-300 text-zinc-950 rounded-xl font-silkscreen text-xs font-bold cursor-pointer active:scale-95 transition-all"
          >
            {step === 0 ? 'VER CÓMO JUGAR →' : '¡COMENZAR AVENTURA!'}
          </button>
        </div>
      </div>
    </div>
  );
};
