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
  Crown,
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
      <span className={`px-2 py-0.5 rounded text-[10px] font-silkscreen uppercase border flex items-center gap-1 ${meta?.badgeClass || 'bg-[#E7E7E2] text-[#1E2022] border-stone-300'}`}>
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
    <div className="fixed inset-0 z-50 bg-[#E7E7E2]/98 backdrop-blur-md flex flex-col justify-between overflow-hidden select-none p-2.5 sm:p-4 md:p-6 text-[#1E2022] font-ui animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto flex flex-wrap justify-between items-center gap-2 pb-2.5 border-b border-stone-300">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="min-h-[40px] px-3 py-2 bg-[#F4F4F2] hover:bg-white border border-stone-300 rounded-xl text-[#1E2022] transition-colors cursor-pointer flex items-center gap-1 text-xs font-silkscreen font-bold active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>VOLVER</span>
          </button>
          <div>
            <h2 className="font-silkscreen text-xs sm:text-sm md:text-base text-[#1E2022] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#1E2022] shrink-0" />
              <span>BESTIARIO ({totalBaseCount})</span>
            </h2>
            <p className="text-[10px] text-stone-600 font-mono-stat hidden sm:block">
              Se desbloquean al avistar en mapa/combate · Captura y evoluciona para completar al 100%
            </p>
          </div>
        </div>

        {/* Dual Progress Indicators */}
        <div className="flex flex-wrap items-center gap-1.5 ml-auto text-[10px] font-mono-stat">
          {isMasterComplete && (
            <div className="px-2.5 py-1 bg-amber-100 text-amber-900 border-2 border-amber-400 rounded-xl font-silkscreen flex items-center gap-1 bestiary-master-glow font-bold">
              <Award className="w-3.5 h-3.5 text-amber-700" />
              <span>MAESTRO 100%</span>
            </div>
          )}
          <div className="px-2.5 py-1 bg-[#F4F4F2] border border-stone-300 rounded-xl text-stone-700 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-stone-700" />
            <span>
              Vistas: <strong className="text-[#1E2022] tabular-nums">{seenBaseIds.size}/{totalBaseCount}</strong>
            </span>
          </div>
          <div className={`px-2.5 py-1 border rounded-xl flex items-center gap-1 ${isBaseComplete ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-[#F4F4F2] border-stone-300 text-stone-700'}`}>
            <CheckCircle2 className={`w-3.5 h-3.5 ${isBaseComplete ? 'text-emerald-700' : 'text-[#1E2022]'}`} />
            <span>
              Base: <strong className="tabular-nums">{capturedBaseIds.size}/{totalBaseCount}</strong>
            </span>
          </div>
          <div className="px-2.5 py-1 bg-[#F4F4F2] border border-stone-300 rounded-xl text-stone-700">
            <span>
              Evoluciones: <strong className="text-[#1E2022] tabular-nums">{registeredEvoSet.size}/{totalEvolutionForms}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Catalog Grid */}
      <div className="max-w-5xl w-full mx-auto my-2.5 flex-1 bg-[#F4F4F2] border-2 border-stone-300 rounded-3xl p-3 sm:p-4 flex flex-col gap-2.5 shadow-md overflow-hidden">
        {/* Element Filter Tags */}
        <div className="flex flex-wrap gap-1 pb-2 border-b border-stone-300 shrink-0">
          {(['all', 'planta', 'fuego', 'agua', 'viento', 'tierra', 'hielo'] as const).map(el => (
            <button
              key={el}
              onClick={() => {
                sound.playSelect();
                setFilterElement(el);
              }}
              className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-silkscreen uppercase transition-all cursor-pointer flex items-center gap-1 ${
                filterElement === el
                  ? 'bg-[#1E2022] text-[#F4F4F2] font-bold shadow'
                  : 'bg-[#E7E7E2] text-stone-700 hover:text-[#1E2022] border border-stone-300'
              }`}
            >
              {el !== 'all' && <span>{ELEMENT_META[el]?.icon}</span>}
              <span>{el === 'all' ? 'Todos' : el}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Entry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto pr-1 flex-1 content-start">
          {filteredEntries.map(entry => {
            const globalIndex = allEntries.findIndex(e => e.baseId === entry.baseId) + 1;
            const captured = capturedBaseIds.has(entry.baseId);
            const seen = seenBaseIds.has(entry.baseId);
            const totalStages = entry.evolutionLine.length;
            const completedStages = entry.evolutionLine.filter(st =>
              registeredEvoSet.has(`${entry.baseId}:${st.stage}`)
            ).length;
            const isThreeStageMaster = totalStages >= 3 && completedStages >= totalStages;
            const isLineComplete = completedStages >= totalStages && totalStages > 0;

            return (
              <button
                key={entry.baseId}
                onClick={() => {
                  sound.playSelect();
                  setActiveDetailId(entry.baseId);
                  setSelectedStageIndex(0);
                }}
                className={`min-h-[64px] p-2.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer active:scale-[0.98] ${
                  isThreeStageMaster
                    ? 'bg-gradient-to-br from-amber-50 via-white to-amber-100/70 border-amber-400 text-[#1E2022] bestiary-master-glow'
                    : captured
                    ? 'bg-white hover:bg-emerald-50/40 border-[#1E2022] text-[#1E2022] shadow-sm'
                    : seen
                    ? 'bg-[#E7E7E2] hover:bg-white border-stone-300 text-[#1E2022]'
                    : 'bg-[#E7E7E2]/60 hover:bg-[#E7E7E2] border-stone-300/70 text-stone-500'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-silkscreen text-[10px] text-stone-500 w-6 shrink-0 tabular-nums">
                    #{String(globalIndex).padStart(2, '0')}
                  </span>
                  <div className="relative shrink-0">
                    <span
                      className={`text-xl p-1.5 bg-white border rounded-xl block ${
                        isThreeStageMaster ? 'border-amber-400' : 'border-stone-300'
                      } ${!seen ? 'grayscale opacity-40' : ''}`}
                    >
                      {seen ? entry.evolutionLine[0]?.icon || '✨' : '❓'}
                    </span>
                    {isThreeStageMaster && (
                      <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-300 absolute -top-1.5 -right-1.5 drop-shadow" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-silkscreen text-[11px] flex items-center gap-1 flex-wrap">
                      <span className={`truncate ${isThreeStageMaster ? 'text-amber-900 font-bold' : seen ? 'text-[#1E2022] font-bold' : 'text-stone-500'}`}>
                        {seen ? entry.defaultName : 'Criatura ???'}
                      </span>
                      {seen && entry.isBossSpecies && (
                        <span className="px-1 py-0.2 bg-[#1E2022] text-[#F4F4F2] font-bold text-[8px] rounded">JEFE</span>
                      )}
                      {seen && isLineComplete && !isThreeStageMaster && totalStages > 1 && (
                        <span className="px-1 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-400 text-[8px] rounded font-bold tabular-nums">
                          {completedStages}/{totalStages}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-600 font-mono-stat mt-0.5 truncate flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 shrink-0 text-stone-500" />
                      <span className="truncate">
                        {seen ? entry.habitatLabel : 'Avista esta especie para desbloquear'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clear State Badge: MAESTRA vs VINCULADA vs VISTA vs OCULTA */}
                <span
                  className={`text-[8px] px-1.5 py-0.5 rounded font-silkscreen uppercase border shrink-0 ml-1 flex items-center gap-0.5 ${
                    isThreeStageMaster
                      ? 'bg-amber-300 text-amber-950 border-amber-500 font-bold shadow-sm'
                      : captured
                      ? 'bg-emerald-700 text-white border-emerald-800 font-bold'
                      : seen
                      ? 'bg-white text-[#1E2022] border-stone-400 font-bold'
                      : 'bg-stone-200 text-stone-500 border-stone-300'
                  }`}
                >
                  {isThreeStageMaster ? (
                    <>
                      <Crown className="w-2.5 h-2.5" />
                      <span>MAESTRA</span>
                    </>
                  ) : captured ? (
                    'VINCULADA'
                  ) : seen ? (
                    'VISTA'
                  ) : (
                    'OCULTA'
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto pt-1.5 border-t border-stone-300 text-center text-[10px] font-mono-stat text-stone-600">
        {isBaseComplete
          ? `¡Bestiario Base ${totalBaseCount}/${totalBaseCount} completo! Evoluciona todas las líneas en Templos para completar el Bestiario Maestro.`
          : `Toca cualquier criatura para abrir su ficha · Registra las ${totalBaseCount} especies base y sus 3 evoluciones Maestras.`}
      </div>

      {/* TAP-TO-VIEW CREATURE DETAIL OVERLAY MODAL */}
      {selectedTemplate && currentStage && (
        <div
          className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in zoom-in-95 duration-150"
          onClick={() => {
            sound.playCancel();
            setActiveDetailId(null);
          }}
        >
          <div
            className="bg-[#F4F4F2] border-2 border-stone-400 text-[#1E2022] rounded-3xl p-4 sm:p-5 max-w-2xl w-full shadow-2xl flex flex-col gap-3 max-h-[92dvh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Detail Header */}
            <div className="flex items-start justify-between gap-2 border-b border-stone-300 pb-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-[#1E2022] text-[#F4F4F2] rounded font-silkscreen text-[10px] font-bold tabular-nums">
                    #{String(activeOrderIndex + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-silkscreen text-sm sm:text-base text-[#1E2022] truncate">
                    {selectedIsSeen ? currentStage.name : 'Especie No Avistada'}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-silkscreen border font-bold ${
                      selectedIsCaptured
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : selectedIsSeen
                        ? 'bg-[#E7E7E2] text-[#1E2022] border-stone-400'
                        : 'bg-stone-200 text-stone-600 border-stone-300'
                    }`}
                  >
                    {selectedIsCaptured ? '✓ VINCULADA' : selectedIsSeen ? '👁️ SOLO VISTA' : '🔒 NO VISTA'}
                  </span>
                </div>
                {selectedIsSeen && selectedTemplate.scientificName && (
                  <div className="text-[11px] font-mono italic text-stone-600 mt-0.5">
                    {selectedTemplate.scientificName}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  sound.playCancel();
                  setActiveDetailId(null);
                }}
                className="min-h-[40px] min-w-[40px] p-2 bg-[#E7E7E2] hover:bg-stone-300 border border-stone-300 rounded-xl text-[#1E2022] cursor-pointer shrink-0 active:scale-95 flex items-center justify-center"
                title="Cerrar ficha"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!selectedIsSeen ? (
              <div className="p-6 bg-[#E7E7E2] border border-stone-300 rounded-2xl text-center space-y-2">
                <Lock className="w-8 h-8 text-stone-500 mx-auto" />
                <div className="font-silkscreen text-xs text-[#1E2022]">REGISTRO BLOQUEADO</div>
                <p className="text-xs font-mono text-stone-600 max-w-md mx-auto">
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
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono-stat bg-[#E7E7E2] border border-stone-300 text-[#1E2022] font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>Hábitat: {selectedTemplate.habitatLabel}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-[#E7E7E2] border border-stone-300 rounded-xl">
                    {selectedTemplate.evolutionLine.map((stage, idx) => {
                      const evoRegistered = registeredEvoSet.has(`${selectedTemplate.baseId}:${stage.stage}`);
                      return (
                        <button
                          key={stage.stage}
                          onClick={() => {
                            sound.playSelect();
                            setSelectedStageIndex(idx);
                          }}
                          className={`min-h-[32px] px-2 py-1 rounded-lg text-[10px] font-silkscreen transition-all cursor-pointer flex items-center gap-1 ${
                            selectedStageIndex === idx
                              ? 'bg-[#1E2022] text-[#F4F4F2] font-bold shadow-sm'
                              : 'text-stone-600 hover:text-[#1E2022]'
                          }`}
                        >
                          <span>Et.{stage.stage}</span>
                          {evoRegistered && <span className="text-[8px] text-emerald-500">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sprite & Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-5 bg-zinc-900 border-2 border-stone-400 rounded-2xl p-3 flex flex-col items-center justify-center shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={180}
                      height={180}
                      className="w-32 h-32 sm:w-36 sm:h-36 object-contain image-render-pixel"
                    />
                    <span className="text-[10px] font-mono-stat text-zinc-300 mt-1">
                      Etapa {currentStage.stage}/{selectedTemplate.evolutionLine.length} · {currentStage.title}
                    </span>
                  </div>

                  <div className="sm:col-span-7 flex flex-col gap-2">
                    <p className="text-xs text-[#1E2022] leading-relaxed font-ui italic bg-[#E7E7E2] p-2.5 rounded-2xl border border-stone-300">
                      &ldquo;{currentStage.description || selectedTemplate.lore}&rdquo;
                    </p>

                    {selectedTemplate.naturalHistory && (
                      <div className="p-2.5 bg-[#E7E7E2] border border-stone-300 rounded-xl text-[11px] font-ui text-stone-700 leading-relaxed">
                        <span className="font-silkscreen text-[9px] text-[#1E2022] block mb-0.5 tracking-wider font-bold">
                          HISTORIA NATURAL:
                        </span>
                        {selectedTemplate.naturalHistory}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono-stat">
                      <div className="p-2 bg-[#E7E7E2] rounded-xl border border-stone-300 flex justify-between">
                        <span className="text-stone-600">PS Base:</span>
                        <span className="text-[#1E2022] font-bold tabular-nums">{currentStage.baseHp}</span>
                      </div>
                      <div className="p-2 bg-[#E7E7E2] rounded-xl border border-stone-300 flex justify-between">
                        <span className="text-stone-600">PM Base:</span>
                        <span className="text-[#1E2022] font-bold tabular-nums">{currentStage.baseMp}</span>
                      </div>
                      <div className="p-2 bg-[#E7E7E2] rounded-xl border border-stone-300 flex justify-between">
                        <span className="text-stone-600">Ataque:</span>
                        <span className="text-[#1E2022] font-bold tabular-nums">{currentStage.baseAttack}</span>
                      </div>
                      <div className="p-2 bg-[#E7E7E2] rounded-xl border border-stone-300 flex justify-between">
                        <span className="text-stone-600">Defensa:</span>
                        <span className="text-[#1E2022] font-bold tabular-nums">{currentStage.baseDefense}</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#E7E7E2] border border-stone-300 rounded-xl">
                      <div className="text-[10px] font-silkscreen text-stone-600 mb-0.5 flex items-center justify-between">
                        <span>TÉCNICA:</span>
                        <span className="text-[#1E2022] font-bold">{currentStage.signatureSkill.mpCost} PM</span>
                      </div>
                      <div className="text-xs font-semibold text-[#1E2022]">{currentStage.signatureSkill.name}</div>
                      <div className="text-[10px] text-stone-600 font-ui mt-0.5">{currentStage.signatureSkill.description}</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Evolution condition + Prev/Next navigation */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-300">
              <div className="text-[10px] font-mono-stat text-stone-600">
                <span>Evolución: </span>
                <strong className="text-[#1E2022]">
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
                  className="min-h-[40px] px-3 py-1.5 bg-[#E7E7E2] hover:bg-stone-300 border border-stone-300 rounded-xl text-xs font-silkscreen text-[#1E2022] font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Ant</span>
                </button>
                <button
                  onClick={() => navigateDetail(1)}
                  className="min-h-[40px] px-3 py-1.5 bg-[#E7E7E2] hover:bg-stone-300 border border-stone-300 rounded-xl text-xs font-silkscreen text-[#1E2022] font-bold flex items-center gap-1 cursor-pointer active:scale-95"
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
