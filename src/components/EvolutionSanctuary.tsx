/**
 * Deep Evolution Sanctuary for Crónicas Elementales del Sur
 * Features:
 * - Overflow-safe 3-stage evolutionary tree (Stages 1, 2, 3 fit cleanly on mobile without clipping)
 * - Elemental Essence catalyst requirements (Pewén resin, thermal drops, basalt, blue ice)
 * - Interactive evolution ceremony with canvas particle spirals and stat upgrades
 */

import React, { useState, useEffect, useRef } from 'react';
import { SpiritCreature, InventoryItem } from '../types/game';
import { sound } from '../services/audioService';
import { drawCreatureSprite } from '../utils/pixelRenderer';
import { Sparkles, Check, Lock, ChevronLeft } from 'lucide-react';

interface EvolutionSanctuaryProps {
  partySpirits: SpiritCreature[];
  inventory: Record<string, InventoryItem>;
  onEvolveSpirit: (spiritUid: string, nextStageNumber: number, usedItemKey?: string) => void;
  onClose: () => void;
}

export const EvolutionSanctuary: React.FC<EvolutionSanctuaryProps> = ({
  partySpirits,
  inventory,
  onEvolveSpirit,
  onClose,
}) => {
  const [selectedSpiritUid, setSelectedSpiritUid] = useState<string>(partySpirits[0]?.uid || '');
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionStep, setEvolutionStep] = useState<'idle' | 'channeling' | 'completed'>('idle');

  const selectedSpirit = partySpirits.find(s => s.uid === selectedSpiritUid) || partySpirits[0];
  const evolutionCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentStageNum = selectedSpirit?.currentStage || 1;
  const nextStageNum = currentStageNum < 3 ? currentStageNum + 1 : null;
  const currentStageData = selectedSpirit?.evolutionLine[currentStageNum - 1];
  const nextStageData = nextStageNum ? selectedSpirit?.evolutionLine[nextStageNum - 1] : null;

  const getItemKeyForRequirement = (reqItemName?: string): string | undefined => {
    if (!reqItemName) return undefined;
    const lower = reqItemName.toLowerCase();
    if (lower.includes('pewén') || lower.includes('pewen')) return 'esencia_pewen';
    if (lower.includes('basalto') || lower.includes('fuego')) return 'corazon_basalto';
    if (lower.includes('termal') || lower.includes('pucón')) return 'gota_termal';
    if (lower.includes('hielo') || lower.includes('azul')) return 'cristal_hielo';
    return undefined;
  };

  const requiredItemKey = nextStageData ? getItemKeyForRequirement(nextStageData.requiredItem) : undefined;
  const hasRequiredItem = !requiredItemKey || (inventory[requiredItemKey]?.count || 0) > 0;
  const meetsLevelReq = nextStageData ? selectedSpirit?.level >= nextStageData.requiredLevel : false;
  const canEvolve = nextStageNum !== null && meetsLevelReq && hasRequiredItem && !isEvolving;

  useEffect(() => {
    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.04;
      if (evolutionCanvasRef.current && selectedSpirit) {
        const ctx = evolutionCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 260, 260);
          ctx.imageSmoothingEnabled = false;

          if (isEvolving) {
            const centerX = 130;
            const centerY = 130;
            for (let i = 0; i < 20; i++) {
              const angle = t * 2 + (i * Math.PI) / 10;
              const radius = 35 + Math.sin(t * 3 + i) * 30;
              const px = centerX + Math.cos(angle) * radius;
              const py = centerY + Math.sin(angle) * radius;

              ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#38bdf8';
              ctx.beginPath();
              ctx.arc(px, py, 3 + (i % 3), 0, Math.PI * 2);
              ctx.fill();
            }
          }

          const stageToDraw = evolutionStep === 'completed' && nextStageNum ? nextStageNum : currentStageNum;
          drawCreatureSprite(ctx, selectedSpirit.baseId, stageToDraw, 45, 45, 170, t, false);
        }
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [selectedSpirit, isEvolving, evolutionStep, currentStageNum, nextStageNum]);

  const handleStartEvolution = () => {
    if (!canEvolve || !nextStageNum) return;

    setIsEvolving(true);
    setEvolutionStep('channeling');
    sound.playEvolutionSequence();

    setTimeout(() => {
      setEvolutionStep('completed');
      sound.playLevelUp();
      onEvolveSpirit(selectedSpirit.uid, nextStageNum, requiredItemKey);
      setIsEvolving(false);
    }, 2600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-2.5 sm:p-4 text-zinc-100">
      {/* Header */}
      <div className="max-w-5xl w-full mx-auto flex justify-between items-center gap-2 pb-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono active:scale-95 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div className="min-w-0">
            <h2 className="font-pixel text-[11px] sm:text-sm text-zinc-100 flex items-center gap-1.5 truncate">
              <Sparkles className="w-4 h-4 text-zinc-200 shrink-0" />
              <span className="truncate">SANTUARIO DE EVOLUCIÓN</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Main Sanctuary Grid */}
      <div className="max-w-5xl w-full mx-auto my-2.5 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 flex-1 items-start md:items-center">
        {/* Left Column: Party Spirits Selection */}
        <div className="md:col-span-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-2.5 sm:p-3.5 flex flex-col gap-2">
          <span className="font-pixel text-[10px] text-zinc-400">ESPÍRITUS EN TU EQUIPO:</span>
          <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto md:max-h-72 pb-1 md:pb-0">
            {partySpirits.map((spirit) => {
              const isSelected = spirit.uid === selectedSpirit?.uid;
              const hasNext = spirit.currentStage < 3;
              const nextStage = hasNext ? spirit.evolutionLine[spirit.currentStage] : null;
              const ready = hasNext && nextStage && spirit.level >= nextStage.requiredLevel;

              return (
                <button
                  key={spirit.uid}
                  onClick={() => {
                    sound.playSelect();
                    setSelectedSpiritUid(spirit.uid);
                    setEvolutionStep('idle');
                  }}
                  className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer shrink-0 md:shrink min-w-[155px] md:min-w-0 ${
                    isSelected
                      ? 'bg-zinc-800 border-zinc-200 shadow-md'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg sm:text-xl shrink-0">
                      {spirit.evolutionLine[spirit.currentStage - 1]?.icon || '🌱'}
                    </span>
                    <div className="min-w-0">
                      <span className="font-pixel text-[10px] sm:text-[11px] text-zinc-100 block truncate">
                        {spirit.name}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400 block truncate">
                        Nv.{spirit.level} · Et.{spirit.currentStage}/3
                      </span>
                    </div>
                  </div>

                  {ready && (
                    <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-950 rounded text-[8px] font-bold animate-pulse font-mono shrink-0">
                      LISTO
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center / Right Column: Evolution Altar & Overflow-Safe 3-Stage Stepper */}
        <div className="md:col-span-8 bg-zinc-900 border border-zinc-700 rounded-2xl p-3 sm:p-4 flex flex-col justify-between overflow-hidden min-w-0">
          {selectedSpirit && (
            <div className="min-w-0">
              {/* 3-Column Overflow-Safe Evolution Tree Stepper */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded-xl mb-3 text-xs font-mono">
                {selectedSpirit.evolutionLine.map((stage, idx) => {
                  const stageNum = idx + 1;
                  const isCurrent = stageNum === selectedSpirit.currentStage;
                  const isPast = stageNum < selectedSpirit.currentStage;

                  return (
                    <div
                      key={stage.stage}
                      className={`flex flex-col items-center text-center p-1.5 sm:p-2 rounded-lg min-w-0 overflow-hidden ${
                        isCurrent
                          ? 'bg-zinc-800 border border-zinc-300 text-zinc-100 shadow-sm'
                          : isPast
                          ? 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                          : 'bg-zinc-950 text-zinc-500 border border-dashed border-zinc-800'
                      }`}
                    >
                      <span className="text-base sm:text-lg leading-none mb-1">{stage.icon}</span>
                      <span className="font-pixel text-[9px] sm:text-[10px] text-zinc-100 block truncate w-full">
                        {stage.name}
                      </span>
                      <span className="text-[8px] sm:text-[9px] mt-0.5 truncate w-full">
                        {isPast ? 'Listo' : isCurrent ? 'Actual' : `Nv.${stage.requiredLevel}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Central Altar Display */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 p-3 bg-zinc-950 border border-zinc-800 rounded-xl mb-3">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0 flex items-center justify-center bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden">
                  <canvas
                    ref={evolutionCanvasRef}
                    width={260}
                    height={260}
                    className="w-full h-full object-contain image-render-pixel"
                  />
                  {isEvolving && (
                    <div className="absolute inset-0 bg-white/25 animate-pulse pointer-events-none" />
                  )}
                </div>

                <div className="flex-1 text-xs min-w-0 w-full">
                  <div className="mb-2">
                    <span className="text-[9px] uppercase font-mono text-zinc-400 font-bold tracking-wider">
                      Etapa {currentStageNum}/3 · {currentStageData?.title}
                    </span>
                    <h3 className="font-pixel text-xs sm:text-sm text-zinc-100 mb-0.5 truncate">
                      {evolutionStep === 'completed' && nextStageData ? nextStageData.name : selectedSpirit.name}
                    </h3>
                    <p className="text-zinc-300 leading-snug text-[11px] line-clamp-2">
                      {evolutionStep === 'completed' && nextStageData ? nextStageData.description : selectedSpirit.lore}
                    </p>
                  </div>

                  {nextStageData ? (
                    <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-lg font-mono text-[10px] sm:text-[11px] space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-zinc-400">Nivel Req:</span>
                        <span className={`font-bold flex items-center gap-1 ${meetsLevelReq ? 'text-zinc-100' : 'text-zinc-500'}`}>
                          {meetsLevelReq ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          Nv.{selectedSpirit.level} / {nextStageData.requiredLevel}
                        </span>
                      </div>

                      {nextStageData.requiredItem && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-zinc-400 shrink-0">Esencia:</span>
                          <span className={`font-bold flex items-center gap-1 truncate ${hasRequiredItem ? 'text-zinc-100' : 'text-zinc-500'}`}>
                            {hasRequiredItem ? <Check className="w-3 h-3 shrink-0" /> : <Lock className="w-3 h-3 shrink-0" />}
                            <span className="truncate">
                              {nextStageData.requiredItem} {requiredItemKey ? `(${inventory[requiredItemKey]?.count || 0})` : ''}
                            </span>
                          </span>
                        </div>
                      )}

                      <div className="pt-1 border-t border-zinc-800 flex justify-between items-center gap-2">
                        <span className="text-zinc-400 shrink-0">Nueva Técnica:</span>
                        <span className="text-zinc-100 font-bold truncate">{nextStageData.signatureSkill.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-200 text-center font-mono text-[11px]">
                      ¡Este espíritu alcanzó su Etapa 3 máxima como Titán Ancestral!
                    </div>
                  )}
                </div>
              </div>

              {nextStageData && (
                <button
                  disabled={!canEvolve}
                  onClick={handleStartEvolution}
                  className={`w-full py-3 rounded-xl font-pixel text-[11px] sm:text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 ${
                    canEvolve
                      ? 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-xl cursor-pointer animate-pulse border border-zinc-300'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {isEvolving
                      ? 'CANALIZANDO ENERGÍA...'
                      : canEvolve
                      ? 'INICIAR EVOLUCIÓN'
                      : 'REQUISITOS INCOMPLETOS'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto pt-2 border-t border-zinc-800 text-center text-[10px] font-mono text-zinc-500">
        Recolecta esencias regionales en cofres para despertar las Etapas 2 y 3 de tus criaturas.
      </div>
    </div>
  );
};
