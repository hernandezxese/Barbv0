/**
 * Bestiario / Pokédex de la Naturaleza de Chile
 * Registra todos los espíritus de la fauna y flora nativa, sus líneas evolutivas, elementos y hábitats.
 */

import React, { useState } from 'react';
import { SpiritCreature, ElementType } from '../types/game';
import { SPIRITS_REGISTRY, SpiritTemplate } from '../data/spiritsData';
import { drawCreatureSprite } from '../utils/pixelRenderer';
import { sound } from '../services/audioService';
import { 
  BookOpen, 
  ChevronLeft, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Droplets, 
  Mountain, 
  Wind, 
  Eye, 
  Lock 
} from 'lucide-react';

interface BestiaryModalProps {
  partySpirits: SpiritCreature[];
  onClose: () => void;
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({
  partySpirits,
  onClose,
}) => {
  const [selectedBaseId, setSelectedBaseId] = useState<string>('brotin');
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [filterElement, setFilterElement] = useState<ElementType | 'all'>('all');

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Set of baseIds ever encountered/owned by the player
  const capturedBaseIds = new Set(partySpirits.map(s => s.baseId));

  const allEntries: SpiritTemplate[] = Object.values(SPIRITS_REGISTRY);

  const filteredEntries = allEntries.filter(entry => {
    if (filterElement === 'all') return true;
    return entry.primaryElement === filterElement || entry.secondaryElement === filterElement;
  });

  const selectedTemplate = SPIRITS_REGISTRY[selectedBaseId] || allEntries[0];
  const isCaptured = capturedBaseIds.has(selectedBaseId);
  const currentStage = selectedTemplate.evolutionLine[selectedStageIndex] || selectedTemplate.evolutionLine[0];

  // Render animated sprite
  React.useEffect(() => {
    let animId: number;
    let t = 0;
    const render = () => {
      t += 0.05;
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 180, 180);
          drawCreatureSprite(
            ctx, 
            selectedTemplate.baseId, 
            currentStage.stage, 
            10, 
            10, 
            160, 
            t, 
            false
          );
        }
      }
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [selectedTemplate.baseId, currentStage.stage]);

  const getElementBadge = (el: ElementType) => {
    const colors: Record<ElementType, string> = {
      fuego: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      agua: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
      planta: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      viento: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
      tierra: 'bg-amber-600/20 text-amber-400 border-amber-600/40',
      hielo: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      sagrado: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      normal: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-silkscreen uppercase border ${colors[el] || 'bg-slate-700 text-white'}`}>
        {el}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-3 sm:p-4 md:p-6 text-zinc-100 font-ui animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="max-w-5xl w-full mx-auto flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-silkscreen active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>VOLVER</span>
          </button>
          <div>
            <h2 className="font-silkscreen text-xs sm:text-sm md:text-base text-zinc-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-zinc-200 shrink-0" />
              <span>BESTIARIO &amp; POKÉDEX NATURAL</span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono-stat hidden sm:block">Catálogo de especies elementales, fósiles vivos y evoluciones de Chile</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs font-mono-stat text-zinc-200 ml-auto">
          <CheckCircle2 className="w-4 h-4 text-zinc-100" />
          <span>Vinculados: <strong className="text-white">{capturedBaseIds.size} / {allEntries.length}</strong></span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl w-full mx-auto my-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Spirit Grid */}
        <div className="lg:col-span-5 bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-4 flex flex-col gap-3 shadow-2xl">
          {/* Element Filter Tags */}
          <div className="flex flex-wrap gap-1 pb-2 border-b border-zinc-800">
            {(['all', 'planta', 'fuego', 'agua', 'viento', 'tierra', 'hielo'] as const).map(el => (
              <button
                key={el}
                onClick={() => {
                  sound.playSelect();
                  setFilterElement(el);
                }}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-silkscreen uppercase transition-all cursor-pointer ${
                  filterElement === el
                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {el === 'all' ? 'Todos' : el}
              </button>
            ))}
          </div>

          {/* Spirit list */}
          <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredEntries.map((entry, idx) => {
              const isSelected = entry.baseId === selectedBaseId;
              const captured = capturedBaseIds.has(entry.baseId);

              return (
                <button
                  key={entry.baseId}
                  onClick={() => {
                    sound.playSelect();
                    setSelectedBaseId(entry.baseId);
                    setSelectedStageIndex(0);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800 border-zinc-200 shadow-lg ring-1 ring-zinc-300'
                      : 'bg-zinc-950/80 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-silkscreen text-xs text-zinc-500 w-6">#{String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-xl p-1.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                      {entry.evolutionLine[0]?.icon || '✨'}
                    </span>
                    <div>
                      <div className="font-silkscreen text-xs text-zinc-100 flex items-center gap-1.5 flex-wrap">
                        <span>{entry.defaultName}</span>
                        {entry.isBossSpecies && (
                          <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-950 font-bold text-[8px] rounded">JEFE</span>
                        )}
                        {captured && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-200" />}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono-stat mt-0.5">
                        {entry.habitatLabel} &middot; {entry.primaryElement}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[9px] px-2 py-0.5 rounded font-mono-stat uppercase border ${
                    captured ? 'bg-zinc-100 text-zinc-950 border-zinc-300 font-bold' : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  }`}>
                    {captured ? 'RECLUTADO' : 'AVISTADO'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Dex Entry */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-5 flex flex-col gap-4 shadow-xl flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-silkscreen text-base text-zinc-100 flex items-center gap-2">
                  <span>{currentStage.name}</span>
                  <span className="text-xs text-zinc-400 font-mono-stat">({currentStage.title})</span>
                </h3>
                {selectedTemplate.scientificName && (
                  <div className="text-xs font-mono italic text-zinc-300 mt-0.5">
                    {selectedTemplate.scientificName}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {getElementBadge(selectedTemplate.primaryElement)}
                  {selectedTemplate.secondaryElement && getElementBadge(selectedTemplate.secondaryElement)}
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono-stat bg-zinc-800 border border-zinc-700 text-zinc-200">
                    Zona: {selectedTemplate.habitatLabel}
                  </span>
                  <span className="text-[10px] font-mono-stat text-zinc-400 uppercase">
                    Rareza: <strong className="text-zinc-100">{selectedTemplate.rarity}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
                {selectedTemplate.evolutionLine.map((stage, idx) => (
                  <button
                    key={stage.stage}
                    onClick={() => {
                      sound.playSelect();
                      setSelectedStageIndex(idx);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-silkscreen transition-all cursor-pointer ${
                      selectedStageIndex === idx
                        ? 'bg-zinc-100 text-zinc-950 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Etapa {stage.stage}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-5 bg-zinc-950 border border-zinc-800 rounded-3xl p-3 flex flex-col items-center justify-center relative shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={180}
                  height={180}
                  className="w-36 h-36 object-contain image-render-pixel"
                />
                <span className="text-[10px] font-mono-stat text-zinc-400 mt-1">
                  Modelo Pixel-Art Etapa {currentStage.stage}
                </span>
              </div>

              <div className="sm:col-span-7 flex flex-col gap-2">
                <p className="text-xs text-zinc-200 leading-relaxed font-ui italic bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                  &ldquo;{currentStage.description || selectedTemplate.lore}&rdquo;
                </p>

                {selectedTemplate.naturalHistory && (
                  <div className="p-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-[11px] font-ui text-zinc-300 leading-relaxed">
                    <span className="font-silkscreen text-[9px] text-zinc-100 block mb-0.5 tracking-wider">
                      HISTORIA NATURAL &amp; HÁBITAT CHILENO:
                    </span>
                    {selectedTemplate.naturalHistory}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-stat">
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

                <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl">
                  <div className="text-[10px] font-silkscreen text-zinc-300 mb-1 flex items-center justify-between">
                    <span>TÉCNICA EMBLEMÁTICA:</span>
                    <span>{currentStage.signatureSkill.mpCost} PM</span>
                  </div>
                  <div className="text-xs font-semibold text-zinc-100">{currentStage.signatureSkill.name}</div>
                  <div className="text-[11px] text-zinc-400 font-ui mt-0.5">{currentStage.signatureSkill.description}</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-2xl text-xs font-mono-stat text-zinc-300 flex items-center justify-between">
              <span>Condición de evolución a Etapa {currentStage.stage}:</span>
              <strong className="text-zinc-100">
                {currentStage.stage === 1
                  ? 'Forma inicial'
                  : `Nivel ${currentStage.requiredLevel} + ${currentStage.requiredItem ? 'Objeto catalizador' : 'Entrenamiento'}`}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto pt-3 border-t border-zinc-800 text-center text-[11px] font-mono-stat text-zinc-500">
        Usa Amuletos de Vínculo Pewén en combate silvestre para vincular nuevas especies a tu equipo y completar el Bestiario.
      </div>
    </div>
  );
};
