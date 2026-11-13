/**
 * Deep Evolution Sanctuary for Bárbara: Crónicas Elementales del Sur
 * Features:
 * - 3-stage evolutionary trees for all Chilean nature spirits
 * - Elemental Essence catalyst requirements (Pewén resin, thermal drops, basalt, blue ice)
 * - Cinematic interactive evolution sequence with canvas particle spirals, stat upgrades, and signature moves
 */

import React, { useState, useEffect, useRef } from 'react';
import { SpiritCreature, InventoryItem } from '../types/game';
import { sound } from '../services/audioService';
import { drawCreatureSprite } from '../utils/pixelRenderer';
import { Sparkles, ArrowRight, Check, Lock, ChevronLeft } from 'lucide-react';

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
  onClose
}) => {
  const [selectedSpiritUid, setSelectedSpiritUid] = useState<string>(partySpirits[0]?.uid || '');
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionStep, setEvolutionStep] = useState<'idle' | 'channeling' | 'completed'>('idle');

  const selectedSpirit = partySpirits.find(s => s.uid === selectedSpiritUid) || partySpirits[0];
  const evolutionCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active stage and next stage
  const currentStageNum = selectedSpirit?.currentStage || 1;
  const nextStageNum = currentStageNum < 3 ? currentStageNum + 1 : null;
  const currentStageData = selectedSpirit?.evolutionLine[currentStageNum - 1];
  const nextStageData = nextStageNum ? selectedSpirit?.evolutionLine[nextStageNum - 1] : null;

  // Determine item requirement matching
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

  // Canvas particle animation during evolution
  useEffect(() => {
    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.04;
      if (evolutionCanvasRef.current && selectedSpirit) {
        const ctx = evolutionCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 300, 300);

          if (isEvolving) {
            // Radiant evolution aura & particle spiral
            const centerX = 150;
            const centerY = 150;
            for (let i = 0; i < 20; i++) {
              const angle = t * 2 + (i * Math.PI) / 10;
              const radius = 40 + Math.sin(t * 3 + i) * 35;
              const px = centerX + Math.cos(angle) * radius;
              const py = centerY + Math.sin(angle) * radius;

              ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#38bdf8';
              ctx.beginPath();
              ctx.arc(px, py, 3 + (i % 3), 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Draw the creature (or the evolved form once completed)
          const stageToDraw = evolutionStep === 'completed' && nextStageNum ? nextStageNum : currentStageNum;
          drawCreatureSprite(ctx, selectedSpirit.baseId, stageToDraw, 60, 60, 180, t, false);
        }
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [selectedSpirit, isEvolving, evolutionStep, currentStageNum, nextStageNum]);

  // Trigger Evolution Ceremony
  const handleStartEvolution = async () => {
    if (!canEvolve || !nextStageNum) return;

    setIsEvolving(true);
    setEvolutionStep('channeling');
    sound.playEvolutionSequence();

    // Cinematic delay
    setTimeout(() => {
      setEvolutionStep('completed');
      sound.playLevelUp();
      onEvolveSpirit(selectedSpirit.uid, nextStageNum, requiredItemKey);
      setIsEvolving(false);
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-3 sm:p-4 md:p-6 text-zinc-100">
      {/* Header */}
      <div className="max-w-5xl w-full mx-auto flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div>
            <h2 className="font-pixel text-xs sm:text-sm md:text-base text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-200 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
              <span>SANTUARIO DE EVOLUCIÓN</span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono hidden sm:block">Despierta el poder ancestral de los espíritus de la naturaleza chilena</p>
          </div>
        </div>
      </div>

      {/* Main Sanctuary Grid */}
      <div className="max-w-5xl w-full mx-auto my-4 grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 items-center">
        {/* Left Column: Party Spirits Selection */}
        <div className="md:col-span-4 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 flex flex-col gap-3">
          <span className="font-pixel text-[11px] text-zinc-400">ESPÍRITUS EN TU EQUIPO:</span>
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
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
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800 border-zinc-200 shadow-md'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{spirit.evolutionLine[spirit.currentStage - 1]?.icon || '🌱'}</span>
                    <div>
                      <span className="font-pixel text-xs text-zinc-100 block">{spirit.name}</span>
                      <span className="font-mono text-[11px] text-zinc-400">Nv. {spirit.level} &middot; Etapa {spirit.currentStage}/3</span>
                    </div>
                  </div>

                  {ready && (
                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-950 rounded text-[9px] font-bold animate-pulse font-mono">
                      ¡LISTO!
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center / Right Column: Evolution Altar & Tree */}
        <div className="md:col-span-8 bg-zinc-900 border border-zinc-700 rounded-2xl p-5 flex flex-col justify-between">
          {selectedSpirit && (
            <div>
              {/* Evolution Tree Stepper */}
              <div className="flex items-center justify-between gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-xl mb-4 text-xs font-mono">
                {selectedSpirit.evolutionLine.map((stage, idx) => {
                  const stageNum = idx + 1;
                  const isCurrent = stageNum === selectedSpirit.currentStage;
                  const isPast = stageNum < selectedSpirit.currentStage;

                  return (
                    <React.Fragment key={stage.stage}>
                      <div className={`flex flex-col items-center text-center p-2 rounded-lg flex-1 ${
                        isCurrent
                          ? 'bg-zinc-800 border border-zinc-300 text-zinc-100'
                          : isPast
                          ? 'bg-zinc-900 text-zinc-400'
                          : 'bg-zinc-950 text-zinc-500 border border-dashed border-zinc-800'
                      }`}>
                        <span className="text-xl mb-1">{stage.icon}</span>
                        <span className="font-pixel text-[10px] text-zinc-100 block truncate w-full">{stage.name}</span>
                        <span className="text-[9px]">
                          {isPast ? 'Completado' : isCurrent ? 'Forma Actual' : `Nv. ${stage.requiredLevel}`}
                        </span>
                      </div>
                      {idx < 2 && <ArrowRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Central Altar Display */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-zinc-950 border border-zinc-800 rounded-xl mb-4">
                <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex-shrink-0 flex items-center justify-center bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden">
                  <canvas ref={evolutionCanvasRef} width={300} height={300} className="w-full h-full object-contain image-render-pixel" />
                  {isEvolving && (
                    <div className="absolute inset-0 bg-white/25 animate-pulse pointer-events-none" />
                  )}
                </div>

                <div className="flex-1 text-xs">
                  <div className="mb-2">
                    <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold tracking-wider">
                      {currentStageData?.title}
                    </span>
                    <h3 className="font-pixel text-sm text-zinc-100 mb-1">
                      {evolutionStep === 'completed' && nextStageData ? nextStageData.name : selectedSpirit.name}
                    </h3>
                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                      {evolutionStep === 'completed' && nextStageData ? nextStageData.description : selectedSpirit.lore}
                    </p>
                  </div>

                  {nextStageData ? (
                    <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg font-mono text-[11px] space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Nivel Requerido:</span>
                        <span className={`font-bold flex items-center gap-1 ${meetsLevelReq ? 'text-zinc-100' : 'text-zinc-500'}`}>
                          {meetsLevelReq ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          Nv. {selectedSpirit.level} / {nextStageData.requiredLevel}
                        </span>
                      </div>

                      {nextStageData.requiredItem && (
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Catalizador Elemental:</span>
                          <span className={`font-bold flex items-center gap-1 ${hasRequiredItem ? 'text-zinc-100' : 'text-zinc-500'}`}>
                            {hasRequiredItem ? <Check className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            {nextStageData.requiredItem} {requiredItemKey ? `(${inventory[requiredItemKey]?.count || 0})` : ''}
                          </span>
                        </div>
                      )}

                      <div className="pt-1 border-t border-zinc-800 flex justify-between items-center">
                        <span className="text-zinc-400">Nueva Técnica Suprema:</span>
                        <span className="text-zinc-100 font-bold">{nextStageData.signatureSkill.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-200 text-center font-mono">
                      ¡Este espíritu ha alcanzado su evolución máxima como Titán Ancestral de Chile!
                    </div>
                  )}
                </div>
              </div>

              {nextStageData && (
                <button
                  disabled={!canEvolve}
                  onClick={handleStartEvolution}
                  className={`w-full py-3.5 rounded-xl font-pixel text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-2 ${
                    canEvolve
                      ? 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-xl cursor-pointer animate-pulse border border-zinc-300'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isEvolving ? 'CANALIZANDO ENERGÍA ANCESTRAL...' : canEvolve ? 'INICIAR CEREMONIA DE EVOLUCIÓN' : 'REQUISITOS INCOMPLETOS'}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto pt-3 border-t border-zinc-800 text-center text-[11px] font-mono text-zinc-500">
        Explora las 5 regiones para recolectar Resina de Pewén, Gotas Termales, Corazón de Basalto y Cristales de Hielo Azul.
      </div>
    </div>
  );
};
