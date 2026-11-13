/**
 * Deep Evolution Sanctuary for Crónicas Elementales del Sur
 * Supports 1-stage, 2-stage, and 3-stage evolutionary lines dynamically.
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

  const maxStages = selectedSpirit?.evolutionLine.length || 1;
  const currentStageNum = selectedSpirit?.currentStage || 1;
  const nextStageNum = currentStageNum < maxStages ? currentStageNum + 1 : null;
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

  const gridColsClass =
    maxStages === 1 ? 'grid-cols-1' : maxStages === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="fixed inset-0 z-50 bg-[#E7E7E2]/98 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-2.5 sm:p-4 text-[#1E2022]">
      {/* Header */}
      <div className="max-w-5xl w-full mx-auto flex justify-between items-center gap-2 pb-2.5 border-b border-stone-300">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="min-h-[40px] px-3 py-1.5 bg-[#F4F4F2] hover:bg-white border border-stone-300 rounded-xl text-[#1E2022] transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono font-bold active:scale-95 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div className="min-w-0">
            <h2 className="font-pixel text-[11px] sm:text-sm text-[#1E2022] flex items-center gap-1.5 truncate">
              <Sparkles className="w-4 h-4 text-[#1E2022] shrink-0" />
              <span className="truncate">SANTUARIO DE EVOLUCIÓN</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Main Sanctuary Grid */}
      <div className="max-w-5xl w-full mx-auto my-2.5 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 flex-1 items-start md:items-center">
        {/* Left Column: Party Spirits Selection */}
        <div className="md:col-span-4 bg-[#F4F4F2] border-2 border-stone-300 rounded-2xl p-2.5 sm:p-3.5 flex flex-col gap-2 shadow-md">
          <span className="font-pixel text-[10px] text-stone-600">ESPÍRITUS EN TU EQUIPO:</span>
          <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto md:max-h-72 pb-1 md:pb-0">
            {partySpirits.map(spirit => {
              const totalStages = spirit.evolutionLine.length;
              const isSelected = spirit.uid === selectedSpirit?.uid;
              const hasNext = spirit.currentStage < totalStages;
              const nextStage = hasNext ? spirit.evolutionLine[spirit.currentStage] : null;
              const reqKey = nextStage?.requiredItem ? getItemKeyForRequirement(nextStage.requiredItem) : undefined;
              const hasItem = !reqKey || (inventory[reqKey]?.count || 0) > 0;
              const ready = Boolean(hasNext && nextStage && spirit.level >= nextStage.requiredLevel && hasItem);

              return (
                <button
                  key={spirit.uid}
                  onClick={() => {
                    sound.playSelect();
                    setSelectedSpiritUid(spirit.uid);
                    setEvolutionStep('idle');
                  }}
                  className={`min-h-[54px] p-2 sm:p-2.5 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-2 cursor-pointer shrink-0 md:shrink min-w-[175px] md:min-w-0 ${
                    ready && isSelected
                      ? 'bg-emerald-50 border-emerald-600 shadow-[0_0_16px_rgba(5,150,105,0.28)]'
                      : ready
                      ? 'bg-emerald-50/70 border-emerald-500 hover:border-emerald-600 shadow-sm'
                      : isSelected
                      ? 'bg-white border-[#1E2022] shadow-md'
                      : 'bg-[#E7E7E2] border-stone-300 hover:border-stone-500'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg sm:text-xl shrink-0">
                      {spirit.evolutionLine[spirit.currentStage - 1]?.icon || '🌱'}
                    </span>
                    <div className="min-w-0">
                      <span className="font-pixel text-[10px] sm:text-[11px] text-[#1E2022] block truncate font-bold">
                        {spirit.name}
                      </span>
                      <span className="font-mono text-[10px] text-stone-600 block truncate">
                        Nv.{spirit.level} · Et.{spirit.currentStage}/{totalStages}
                      </span>
                    </div>
                  </div>

                  {ready && (
                    <span className="px-1.5 py-0.5 bg-emerald-700 text-white rounded text-[8px] font-bold animate-pulse font-mono shrink-0 shadow">
                      ¡EVOLUCIONA!
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center / Right Column: Evolution Altar & Dynamic Stepper */}
        <div className="md:col-span-8 bg-[#F4F4F2] border-2 border-stone-300 rounded-2xl p-3 sm:p-4 flex flex-col justify-between overflow-hidden min-w-0 shadow-md">
          {selectedSpirit && (
            <div className="min-w-0">
              <div className={`grid ${gridColsClass} gap-1.5 sm:gap-2 p-2 bg-[#E7E7E2] border border-stone-300 rounded-xl mb-3 text-xs font-mono`}>
                {selectedSpirit.evolutionLine.map((stage, idx) => {
                  const stageNum = idx + 1;
                  const isCurrent = stageNum === selectedSpirit.currentStage;
                  const isPast = stageNum < selectedSpirit.currentStage;

                  return (
                    <div
                      key={stage.stage}
                      className={`flex flex-col items-center text-center p-1.5 sm:p-2 rounded-lg min-w-0 overflow-hidden ${
                        isCurrent
                          ? 'bg-white border-2 border-[#1E2022] text-[#1E2022] shadow-sm'
                          : isPast
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-400'
                          : 'bg-[#F4F4F2] text-stone-500 border border-dashed border-stone-400'
                      }`}
                    >
                      <span className="text-base sm:text-lg leading-none mb-1">{stage.icon}</span>
                      <span className="font-pixel text-[9px] sm:text-[10px] text-[#1E2022] block truncate w-full font-bold">
                        {stage.name}
                      </span>
                      <span className="text-[8px] sm:text-[9px] mt-0.5 truncate w-full font-bold">
                        {isPast ? '✓ Listo' : isCurrent ? 'Actual' : `Nv.${stage.requiredLevel}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Central Altar Display */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 p-3 bg-[#E7E7E2] border border-stone-300 rounded-xl mb-3">
                <div
                  className={`relative w-32 h-32 sm:w-40 sm:h-40 shrink-0 flex items-center justify-center bg-zinc-900 rounded-xl border-2 overflow-hidden transition-all ${
                    canEvolve
                      ? 'border-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.45)]'
                      : 'border-stone-400'
                  }`}
                >
                  <canvas
                    ref={evolutionCanvasRef}
                    width={260}
                    height={260}
                    className="w-full h-full object-contain image-render-pixel"
                  />
                  {canEvolve && !isEvolving && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-600 text-white font-pixel text-[7px] font-bold shadow">
                      LISTA
                    </span>
                  )}
                  {isEvolving && (
                    <div className="absolute inset-0 bg-white/25 animate-pulse pointer-events-none" />
                  )}
                </div>

                <div className="flex-1 text-xs min-w-0 w-full">
                  <div className="mb-2">
                    <span className="text-[9px] uppercase font-mono text-stone-600 font-bold tracking-wider">
                      Etapa {currentStageNum}/{maxStages} · {currentStageData?.title}
                    </span>
                    <h3 className="font-pixel text-xs sm:text-sm text-[#1E2022] mb-0.5 truncate">
                      {evolutionStep === 'completed' && nextStageData ? nextStageData.name : selectedSpirit.name}
                    </h3>
                    <p className="text-stone-700 leading-snug text-[11px] line-clamp-2">
                      {evolutionStep === 'completed' && nextStageData ? nextStageData.description : selectedSpirit.lore}
                    </p>
                  </div>

                  {nextStageData ? (
                    <div className="p-2.5 bg-[#F4F4F2] border border-stone-300 rounded-lg font-mono text-[10px] sm:text-[11px] space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-stone-600">Nivel Req:</span>
                        <span className={`font-bold flex items-center gap-1 tabular-nums ${meetsLevelReq ? 'text-emerald-700' : 'text-red-700'}`}>
                          {meetsLevelReq ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          Nv.{selectedSpirit.level} / {nextStageData.requiredLevel}
                        </span>
                      </div>

                      {nextStageData.requiredItem && (
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-stone-600 shrink-0">Esencia:</span>
                          <span className={`font-bold flex items-center gap-1 truncate ${hasRequiredItem ? 'text-emerald-700' : 'text-red-700'}`}>
                            {hasRequiredItem ? <Check className="w-3 h-3 shrink-0" /> : <Lock className="w-3 h-3 shrink-0" />}
                            <span className="truncate">
                              {nextStageData.requiredItem} {requiredItemKey ? `(${inventory[requiredItemKey]?.count || 0})` : ''}
                            </span>
                          </span>
                        </div>
                      )}

                      <div className="pt-1 border-t border-stone-300 flex justify-between items-center gap-2">
                        <span className="text-stone-600 shrink-0">Nueva Técnica:</span>
                        <span className="text-[#1E2022] font-bold truncate">{nextStageData.signatureSkill.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-[#F4F4F2] border border-stone-300 rounded-lg text-[#1E2022] text-center font-mono text-[11px]">
                      {maxStages === 1
                        ? 'Esta especie no posee evoluciones adicionales (Etapa Única).'
                        : `¡Esta Criatura Espiritual alcanzó su Etapa ${maxStages} máxima como Titán Ancestral!`}
                    </div>
                  )}
                </div>
              </div>

              {nextStageData && (
                <button
                  disabled={!canEvolve}
                  onClick={handleStartEvolution}
                  className={`min-h-[48px] w-full py-3 rounded-xl font-pixel text-[11px] sm:text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 ${
                    canEvolve
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg cursor-pointer animate-pulse border border-emerald-600'
                      : 'bg-stone-300 border border-stone-400 text-stone-600 cursor-not-allowed'
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
      <div className="max-w-5xl w-full mx-auto pt-2 border-t border-stone-300 text-center text-[10px] font-mono text-stone-600">
        Recolecta esencias regionales en cofres o tiendas para despertar las evoluciones de tus criaturas.
      </div>
    </div>
  );
};
