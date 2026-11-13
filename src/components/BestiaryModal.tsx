/**
 * Bestiario / Pokédex de la Naturaleza de Chile
 * - Progressive Sighting & Capture Tracking:
 *   - NO VISTA (??? silhouette) until spotted on map or fought in battle
 *   - VISTA (unlocked entry + frequent Stage/Region, waiting for capture)
 *   - VINCULADA (captured + evolution stage checklist)
 * - Dual Progress Goals:
 *   - Bestiario Base (25 species)
 *   - Bestiario Maestro (all evolutionary forms across Chile)
 */

import React, { useState } from 'react';
import { SpiritCreature, ElementType } from '../types/game';
import { SPIRITS_REGISTRY, SpiritTemplate, ELEMENT_META } from '../data/spiritsData';
import { drawCreatureSprite } from '../utils/pixelRenderer';
import { sound } from '../services/audioService';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Award,
  X,
  Eye,
  Lock,
  MapPin,
} from 'lucide-react';

interface BestiaryModalProps {
  partySpirits: SpiritCreature[];
  seenSpeciesIds?: string[];
  registeredEvolutionKeys?: string[];
  onClose: () => void;
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({
  partySpirits,
  seenSpeciesIds = [],
  registeredEvolutionKeys = [],
  onClose,
}) => {
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [filterElement, setFilterElement] = useState<ElementType | 'all'>('all');

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const capturedBaseIds = new Set(partySpirits.map(s => s.baseId));
  const seenBaseIds = new Set([...seenSpeciesIds, ...capturedBaseIds]);
  const registeredEvoSet = new Set(registeredEvolutionKeys);
  partySpirits.forEach(s => {
    for (let st = 1; st <= (s.currentStage || 1); st++) {
      registeredEvoSet.add(`${s.baseId}:${st}`);
    }
  });

  const allEntries: SpiritTemplate[] = Object.values(SPIRITS_REGISTRY);
  const totalBaseCount = allEntries.length;
  const totalEvolutionForms = allEntries.reduce((acc, e) => acc + e.evolutionLine.length, 0);
  const isBaseComplete = capturedBaseIds.size >= totalBaseCount;
  const isMasterComplete = registeredEvoSet.size >= totalEvolutionForms;

  const filteredEntries = allEntries.filter(entry => {
    if (filterElement === 'all') return true;
    return entry.primaryElement === filterElement || entry.secondaryElement === filterElement;
  });

  const selectedTemplate = activeDetailId ? SPIRITS_REGISTRY[activeDetailId] : null;
  const selectedIsSeen = selectedTemplate ? seenBaseIds.has(selectedTemplate.baseId) : false;
  const selectedIsCaptured = selectedTemplate ? capturedBaseIds.has(selectedTemplate.baseId) : false;
  const currentStage = selectedTemplate
    ? selectedTemplate.evolutionLine[selectedStageIndex] || selectedTemplate.evolutionLine[0]
    : null;

  // Render animated sprite whenever an unlocked (seen/captured) detail overlay is open
  React.useEffect(() => {
    if (!selectedTemplate || !currentStage || !selectedIsSeen) return;
    let animId: number;
    let t = 0;
    const render = () => {
      t += 0.05;
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 180, 180);
          drawCreatureSprite(ctx, selectedTemplate.baseId, currentStage.stage, 10, 10, 160, t, false);
        }
      }
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [selectedTemplate, currentStage, selectedIsSeen]);

  const getElementBadge = (el: ElementType) => {
    const meta = ELEMENT_META[el];
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-silkscreen uppercase border bg-zinc-800 text-zinc-100 border-zinc-600 flex items-center gap-1">
        <span>{meta?.icon || '✨'}</span>
        <span>{el}</span>
      </span>
    );
  };

  const activeOrderIndex = selectedTemplate
    ? allEntries.findIndex(e => e.baseId === selectedTemplate.baseId)
    : -1;

  const navigateDetail = (dir: -1 | 1) => {
    if (activeOrderIndex < 0) return;
    sound.playSelect();
    const nextIdx = (activeOrderIndex + dir + allEntries.length) % allEntries.length;
    setActiveDetailId(allEntries[nextIdx].baseId);
    setSelectedStageIndex(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-hidden select-none p-2.5 sm:p-4 md:p-6 text-zinc-100 font-ui animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto flex flex-wrap justify-between items-center gap-2 pb-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-silkscreen active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>VOLVER</span>
          </button>
          <div>
            <h2 className="font-silkscreen text-xs sm:text-sm md:text-base text-zinc-100 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-zinc-200 shrink-0" />
              <span>BESTIARIO ({totalBaseCount})</span>
            </h2>
            <p className="text-[10px] text-zinc-400 font-mono-stat hidden sm:block">
              Se desbloquean al avistar en mapa/combate · Captura y evoluciona para completar al 100%
            </p>
          </div>
        </div>

        {/* Dual Progress Indicators */}
        <div className="flex flex-wrap items-center gap-1.5 ml-auto text-[10px] font-mono-stat">
          {isMasterComplete && (
            <div className="px-2 py-1 bg-zinc-100 text-zinc-950 border border-amber-300 rounded-xl font-silkscreen flex items-center gap-1 bestiary-master-glow">
              <Award className="w-3.5 h-3.5" />
              <span>MAESTRO 100%</span>
            </div>
          )}
          <div className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-200 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-zinc-300" />
            <span>
              Vistas: <strong className="text-white">{seenBaseIds.size}/{totalBaseCount}</strong>
            </span>
          </div>
          <div className="px-2.5 py-1 bg-zinc-900 border border-zinc-500 rounded-xl text-zinc-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-100" />
            <span>
              Base: <strong className="text-white">{capturedBaseIds.size}/{totalBaseCount}</strong>
            </span>
          </div>
          <div className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-200">
            <span>
              Evoluciones: <strong className="text-white">{registeredEvoSet.size}/{totalEvolutionForms}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Catalog Grid */}
      <div className="max-w-5xl w-full mx-auto my-2.5 flex-1 bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-3 sm:p-4 flex flex-col gap-2.5 shadow-2xl overflow-hidden">
        {/* Element Filter Tags */}
        <div className="flex flex-wrap gap-1 pb-2 border-b border-zinc-800 shrink-0">
          {(['all', 'planta', 'fuego', 'agua', 'viento', 'tierra', 'hielo'] as const).map(el => (
            <button
              key={el}
              onClick={() => {
                sound.playSelect();
                setFilterElement(el);
              }}
              className={`px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-silkscreen uppercase transition-all cursor-pointer flex items-center gap-1 ${
                filterElement === el
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {el !== 'all' && <span>{ELEMENT_META[el]?.icon}</span>}
              <span>{el === 'all' ? 'Todos' : el}</span>
            </button>
          ))}
        </div>

        {/* Scrollable 25-Entry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto pr-1 flex-1 content-start">
          {filteredEntries.map(entry => {
            const globalIndex = allEntries.findIndex(e => e.baseId === entry.baseId) + 1;
            const captured = capturedBaseIds.has(entry.baseId);
            const seen = seenBaseIds.has(entry.baseId);

            return (
              <button
                key={entry.baseId}
                onClick={() => {
                  sound.playSelect();
                  setActiveDetailId(entry.baseId);
                  setSelectedStageIndex(0);
                }}
                className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                  captured
                    ? 'bg-zinc-950 hover:bg-zinc-800 border-zinc-400 text-zinc-100'
                    : seen
                    ? 'bg-zinc-950/80 hover:bg-zinc-800/80 border-zinc-700 text-zinc-200'
                    : 'bg-zinc-950/40 hover:bg-zinc-900/70 border-zinc-800/80 text-zinc-500'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-silkscreen text-[10px] text-zinc-500 w-6 shrink-0">
                    #{String(globalIndex).padStart(2, '0')}
                  </span>
                  <span
                    className={`text-xl p-1.5 bg-zinc-900 border border-zinc-800 rounded-xl shrink-0 ${
                      !seen ? 'grayscale opacity-35' : ''
                    }`}
                  >
                    {seen ? entry.evolutionLine[0]?.icon || '✨' : '❓'}
                  </span>
                  <div className="min-w-0">
                    <div className="font-silkscreen text-[11px] flex items-center gap-1 flex-wrap">
                      <span className={`truncate ${seen ? 'text-zinc-100' : 'text-zinc-500'}`}>
                        {seen ? entry.defaultName : 'Criatura ???'}
                      </span>
                      {seen && entry.isBossSpecies && (
                        <span className="px-1 py-0.2 bg-zinc-100 text-zinc-950 font-bold text-[8px] rounded">JEFE</span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono-stat mt-0.5 truncate flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 shrink-0 text-zinc-500" />
                      <span className="truncate">
                        {seen ? entry.habitatLabel : 'Avista esta especie para desbloquear'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clear State Badge: VINCULADA vs VISTA vs NO VISTA */}
                <span
                  className={`text-[8px] px-1.5 py-0.5 rounded font-silkscreen uppercase border shrink-0 ml-1 ${
                    captured
                      ? 'bg-zinc-100 text-zinc-950 border-zinc-200 font-bold'
                      : seen
                      ? 'bg-zinc-800 text-zinc-200 border-zinc-600'
                      : 'bg-zinc-950 text-zinc-600 border-zinc-800'
                  }`}
                >
                  {captured ? 'VINCULADA' : seen ? 'VISTA' : 'OCULTA'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto pt-1.5 border-t border-zinc-800 text-center text-[10px] font-mono-stat text-zinc-500">
        {isBaseComplete
          ? '¡Bestiario Base 25/25 completo! Evoluciona todas las líneas en Templos para completar el Bestiario Maestro.'
          : 'Toca cualquier criatura para abrir su ficha · Registra las 25 especies base y todas sus evoluciones.'}
      </div>

      {/* TAP-TO-VIEW CREATURE DETAIL OVERLAY MODAL */}
      {selectedTemplate && currentStage && (
        <div
          className="fixed inset-0 z-[60] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in zoom-in-95 duration-150"
          onClick={() => {
            sound.playCancel();
            setActiveDetailId(null);
          }}
        >
          <div
            className="bg-zinc-900 border-2 border-zinc-400 rounded-3xl p-4 sm:p-5 max-w-2xl w-full shadow-2xl flex flex-col gap-3 max-h-[92dvh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Detail Header */}
            <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-zinc-100 text-zinc-950 rounded font-silkscreen text-[10px] font-bold">
                    #{String(activeOrderIndex + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-silkscreen text-sm sm:text-base text-zinc-100 truncate">
                    {selectedIsSeen ? currentStage.name : 'Especie No Avistada'}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-silkscreen border ${
                      selectedIsCaptured
                        ? 'bg-zinc-100 text-zinc-950 border-zinc-300 font-bold'
                        : selectedIsSeen
                        ? 'bg-zinc-800 text-zinc-200 border-zinc-600'
                        : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    {selectedIsCaptured ? '✓ VINCULADA' : selectedIsSeen ? '👁️ SOLO VISTA' : '🔒 NO VISTA'}
                  </span>
                </div>
                {selectedIsSeen && selectedTemplate.scientificName && (
                  <div className="text-[11px] font-mono italic text-zinc-300 mt-0.5">
                    {selectedTemplate.scientificName}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  sound.playCancel();
                  setActiveDetailId(null);
                }}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl text-zinc-100 cursor-pointer shrink-0 active:scale-95"
                title="Cerrar ficha"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!selectedIsSeen ? (
              <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl text-center space-y-2">
                <Lock className="w-8 h-8 text-zinc-500 mx-auto" />
                <div className="font-silkscreen text-xs text-zinc-200">REGISTRO BLOQUEADO</div>
                <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto">
                  Aún no te has encontrado con esta especie. Explora el mapa de Chile y entra en combate para desbloquear su ficha, etapa evolutiva y hábitat frecuente.
                </p>
              </div>
            ) : (
              <>
                {/* Frequent Stage Habitat + Elements & Stage Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getElementBadge(selectedTemplate.primaryElement)}
                    {selectedTemplate.secondaryElement && getElementBadge(selectedTemplate.secondaryElement)}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono-stat bg-zinc-100 text-zinc-950 font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>Hábitat frecuente: {selectedTemplate.habitatLabel}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
                    {selectedTemplate.evolutionLine.map((stage, idx) => {
                      const evoRegistered = registeredEvoSet.has(`${selectedTemplate.baseId}:${stage.stage}`);
                      return (
                        <button
                          key={stage.stage}
                          onClick={() => {
                            sound.playSelect();
                            setSelectedStageIndex(idx);
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-silkscreen transition-all cursor-pointer flex items-center gap-1 ${
                            selectedStageIndex === idx
                              ? 'bg-zinc-100 text-zinc-950 font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <span>Et.{stage.stage}</span>
                          {evoRegistered && <span className="text-[8px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sprite & Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-5 bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex flex-col items-center justify-center shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={180}
                      height={180}
                      className="w-32 h-32 sm:w-36 sm:h-36 object-contain image-render-pixel"
                    />
                    <span className="text-[10px] font-mono-stat text-zinc-400 mt-1">
                      Etapa {currentStage.stage}/{selectedTemplate.evolutionLine.length} · {currentStage.title}
                    </span>
                  </div>

                  <div className="sm:col-span-7 flex flex-col gap-2">
                    <p className="text-xs text-zinc-200 leading-relaxed font-ui italic bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800">
                      &ldquo;{currentStage.description || selectedTemplate.lore}&rdquo;
                    </p>

                    {selectedTemplate.naturalHistory && (
                      <div className="p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-[11px] font-ui text-zinc-300 leading-relaxed">
                        <span className="font-silkscreen text-[9px] text-zinc-100 block mb-0.5 tracking-wider">
                          HISTORIA NATURAL:
                        </span>
                        {selectedTemplate.naturalHistory}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono-stat">
                      <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between">
                        <span className="text-zinc-400">PS Base:</span>
                        <span className="text-zinc-100 font-bold">{currentStage.baseHp}</span>
                      </div>
                      <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between">
                        <span className="text-zinc-400">PM Base:</span>
                        <span className="text-zinc-100 font-bold">{currentStage.baseMp}</span>
                      </div>
                      <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between">
                        <span className="text-zinc-400">Ataque:</span>
                        <span className="text-zinc-100 font-bold">{currentStage.baseAttack}</span>
                      </div>
                      <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800 flex justify-between">
                        <span className="text-zinc-400">Defensa:</span>
                        <span className="text-zinc-100 font-bold">{currentStage.baseDefense}</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <div className="text-[10px] font-silkscreen text-zinc-300 mb-0.5 flex items-center justify-between">
                        <span>TÉCNICA:</span>
                        <span>{currentStage.signatureSkill.mpCost} PM</span>
                      </div>
                      <div className="text-xs font-semibold text-zinc-100">{currentStage.signatureSkill.name}</div>
                      <div className="text-[10px] text-zinc-400 font-ui mt-0.5">{currentStage.signatureSkill.description}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Evolution condition + Prev/Next navigation */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800">
              <div className="text-[10px] font-mono-stat text-zinc-300">
                <span className="text-zinc-400">Evolución: </span>
                <strong className="text-zinc-100">
                  {selectedTemplate.evolutionLine.length === 1
                    ? 'Especie única (1 etapa)'
                    : currentStage.stage === 1
                    ? `Forma inicial (${selectedTemplate.evolutionLine.length} etapas)`
                    : `Nivel ${currentStage.requiredLevel}${currentStage.requiredItem ? ' + Catalizador' : ''}`}
                </strong>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  onClick={() => navigateDetail(-1)}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-silkscreen text-zinc-100 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Ant</span>
                </button>
                <button
                  onClick={() => navigateDetail(1)}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-silkscreen text-zinc-100 flex items-center gap-1 cursor-pointer"
                >
                  <span>Sig</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
