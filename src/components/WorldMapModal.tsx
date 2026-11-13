/**
 * Chilean World Map & Fast Travel Modal
 * 0: Hogar (Casa) -> 1: Región Metropolitana -> 2: Región del Biobío -> 3: Región de La Araucanía -> 4: Región de Los Ríos -> 5: Región de Los Lagos
 * Features an expanded Topographical view as default, 5% path vs 40% off-path legend, and monochrome light/black/gray palette.
 */

import React, { useState } from 'react';
import { RegionId } from '../types/game';
import { REGIONS_DATA } from '../data/regionsData';
import { sound } from '../services/audioService';
import {
  MapPin,
  Compass,
  ChevronLeft,
  CheckCircle2,
  Lock,
  Flame,
  Droplets,
  Mountain,
  Sparkles,
  Navigation,
  Layers,
  TreePine,
  Home,
} from 'lucide-react';

interface WorldMapModalProps {
  currentRegionId: RegionId;
  unlockedRegions: RegionId[];
  playerPos?: { x: number; y: number };
  onFastTravel: (targetRegionId: RegionId) => void;
  onClose: () => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  currentRegionId,
  unlockedRegions,
  playerPos,
  onFastTravel,
  onClose,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId>(currentRegionId);
  const regionsList: RegionId[] = ['casa', 'santiago', 'biobio', 'araucania', 'losrios', 'loslagos'];

  const getRegionIcon = (id: RegionId) => {
    if (id === 'casa') return <Home className="w-4 h-4 text-zinc-200" />;
    if (id === 'santiago') return <Mountain className="w-4 h-4 text-zinc-200" />;
    if (id === 'biobio') return <TreePine className="w-4 h-4 text-zinc-200" />;
    if (id === 'araucania') return <Flame className="w-4 h-4 text-zinc-200" />;
    if (id === 'losrios') return <Droplets className="w-4 h-4 text-zinc-200" />;
    return <Sparkles className="w-4 h-4 text-zinc-200" />;
  };

  const selectedRegion = REGIONS_DATA[selectedRegionId];
  const isSelectedUnlocked = unlockedRegions.includes(selectedRegionId);
  const isSelectedCurrent = selectedRegionId === currentRegionId;

  const mapNodes: Record<RegionId, { top: string; left: string; landmark: string; climate: string; shortLabel: string }> = {
    casa: { top: '8%', left: '34%', landmark: 'Hogar Familiar (Escenario 0)', climate: 'Refugio Seguro (0%)', shortLabel: 'Casa' },
    santiago: { top: '19%', left: '49%', landmark: 'Valle de Santiago & San Cristóbal', climate: 'Despejado', shortLabel: 'Metropolitana' },
    biobio: { top: '35%', left: '49%', landmark: 'Neblina, Laja & Zonas Prehistóricas', climate: 'Nuboso / Fósil', shortLabel: 'Biobío' },
    araucania: { top: '52%', left: '51%', landmark: 'Araucarias & Volcán Villarrica', climate: 'Volcánico', shortLabel: 'Araucanía' },
    losrios: { top: '70%', left: '48%', landmark: 'Selva Valdiviana & Calle-Calle', climate: 'Nocturno Lluvioso', shortLabel: 'Los Ríos' },
    loslagos: { top: '88%', left: '47%', landmark: 'Hornopirén, Fiordos & Ventisqueros', climate: 'Glaciar Austral', shortLabel: 'Los Lagos' },
  };

  const [viewMode, setViewMode] = useState<'cartography' | 'stage_terrain'>('stage_terrain');
  const stageCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (viewMode !== 'stage_terrain' || !stageCanvasRef.current) return;
    const canvas = stageCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reg = selectedRegion;
    const cols = reg.width;
    const rows = reg.height;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = reg.tiles[y]?.[x] ?? 0;
        const px = x * cellW;
        const py = y * cellH;

        if (tile === 0) {
          ctx.fillStyle =
            reg.id === 'casa' ? '#92400e' :
            reg.id === 'santiago' ? '#4ade80' :
            reg.id === 'biobio' ? '#4d7c0f' :
            reg.id === 'araucania' ? '#78716c' :
            reg.id === 'losrios' ? '#064e3b' : '#475569';
        } else if (tile === 1) {
          ctx.fillStyle =
            reg.id === 'casa' ? '#d4d4d8' :
            reg.id === 'santiago' ? '#cbd5e1' :
            reg.id === 'biobio' ? '#64748b' :
            reg.id === 'araucania' ? '#57534e' :
            reg.id === 'losrios' ? '#1e293b' : '#64748b';
        } else if (tile === 2) {
          ctx.fillStyle =
            reg.id === 'santiago' ? '#38bdf8' :
            reg.id === 'biobio' ? '#475569' :
            reg.id === 'losrios' ? '#1e3a8a' : '#0c4a6e';
        } else if (tile === 3) {
          ctx.fillStyle =
            reg.id === 'casa' ? '#27272a' :
            reg.id === 'santiago' ? '#94a3b8' :
            reg.id === 'biobio' ? '#451a03' :
            reg.id === 'araucania' ? '#44403c' :
            reg.id === 'losrios' ? '#0f172a' : '#334155';
        } else if (tile === 4) {
          ctx.fillStyle =
            reg.id === 'santiago' ? '#15803d' :
            reg.id === 'biobio' ? '#365314' :
            reg.id === 'araucania' ? '#c2410c' :
            reg.id === 'losrios' ? '#022c22' : '#14532d';
        } else if (tile === 5) {
          ctx.fillStyle = '#dc2626';
        } else if (tile === 6) {
          ctx.fillStyle = '#f8fafc';
        } else if (tile === 7) {
          ctx.fillStyle =
            reg.id === 'santiago' ? '#facc15' :
            reg.id === 'biobio' ? '#84cc16' :
            reg.id === 'araucania' ? '#f97316' :
            reg.id === 'losrios' ? '#a3e635' : '#bae6fd';
        } else if (tile === 8) {
          ctx.fillStyle =
            reg.id === 'casa' ? '#57534e' :
            reg.id === 'santiago' ? '#c2410c' :
            reg.id === 'biobio' ? '#991b1b' :
            reg.id === 'araucania' ? '#9a3412' :
            reg.id === 'losrios' ? '#1e293b' : '#475569';
        } else if (tile === 9) {
          ctx.fillStyle = '#854d0e'; // Prehistoric clearing
        } else {
          ctx.fillStyle = '#18181b';
        }

        ctx.fillRect(px, py, cellW, cellH);
        if (tile === 8 && reg.id !== 'casa') {
          ctx.fillStyle = reg.id === 'loslagos' ? '#fbbf24' : reg.id === 'losrios' ? '#fde047' : '#fef3c7';
          ctx.fillRect(px + cellW * 0.3, py + cellH * 0.45, cellW * 0.4, cellH * 0.35);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.14)';
        ctx.strokeRect(px, py, cellW, cellH);
      }
    }

    reg.entities.forEach(ent => {
      if (ent.cleared && ent.type !== 'npc') return;
      const ex = ent.x * cellW + cellW / 2;
      const ey = ent.y * cellH + cellH / 2;

      if (ent.type === 'boss') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(ex, ey, Math.max(7, cellW * 0.72), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fafafa';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (ent.type === 'wild_encounter') {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(ex, ey, Math.max(4.5, cellW * 0.45), 0, Math.PI * 2);
        ctx.fill();
      } else if (ent.type === 'npc') {
        ctx.fillStyle = '#fafafa';
        ctx.beginPath();
        ctx.arc(ex, ey, Math.max(5, cellW * 0.52), 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (ent.type === 'chest') {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(ex - cellW * 0.35, ey - cellH * 0.35, cellW * 0.7, cellH * 0.7);
      } else if (ent.type === 'obstacle') {
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(ex - cellW * 0.38, ey - cellH * 0.38, cellW * 0.76, cellH * 0.76);
      } else if (ent.type === 'portal' || ent.type === 'shrine') {
        ctx.fillStyle = '#a1a1aa';
        ctx.fillRect(ex - cellW * 0.45, ey - cellH * 0.45, cellW * 0.9, cellH * 0.9);
      }
    });

    if (isSelectedCurrent && playerPos) {
      const px = playerPos.x * cellW + cellW / 2;
      const py = playerPos.y * cellH + cellH / 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, Math.max(7, cellW * 0.65), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }, [viewMode, selectedRegionId, selectedRegion, isSelectedCurrent, playerPos]);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-3 sm:p-4 md:p-6 text-zinc-100 font-ui">
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto flex flex-wrap justify-between items-center gap-3 pb-3 sm:pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl text-zinc-100 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-silkscreen active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>VOLVER</span>
          </button>
          <div>
            <h2 className="font-silkscreen text-xs sm:text-sm md:text-base text-zinc-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-zinc-200 shrink-0" />
              <span>MAPA DE EXPEDICIÓN</span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono-stat hidden sm:block">
              Escenario 0 (Casa) y 5 Regiones · Camino 5% / Fuera de camino 40%
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playSelect();
            setViewMode(v => (v === 'cartography' ? 'stage_terrain' : 'cartography'));
          }}
          className="px-3 py-2 bg-zinc-100 hover:bg-white border border-zinc-300 rounded-xl text-[11px] sm:text-xs font-silkscreen font-bold text-zinc-950 flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{viewMode === 'cartography' ? 'VER TOPOGRAFÍA' : 'VER RUTA DE CHILE'}</span>
        </button>
      </div>

      {/* Main Map Visual & Regions */}
      <div className="max-w-6xl w-full mx-auto my-3 sm:my-4 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Left: Expanded Topography View OR Chile Route Map */}
        <div className="lg:col-span-7 bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-3 sm:p-5 flex flex-col items-center justify-between min-h-[360px] sm:min-h-[480px] relative overflow-hidden shadow-2xl">
          {viewMode === 'stage_terrain' ? (
            <div className="relative w-full h-full flex flex-col items-center justify-between z-10 gap-3">
              <div className="w-full flex justify-between items-center pb-2 border-b border-zinc-800 text-[11px] sm:text-xs font-silkscreen text-zinc-100">
                <span className="truncate pr-2">TOPOGRAFÍA: {selectedRegion.name.toUpperCase()}</span>
                <span className="text-[10px] text-zinc-400 font-mono-stat shrink-0">
                  {selectedRegion.width}&times;{selectedRegion.height}
                </span>
              </div>

              <div className="relative my-auto p-2 bg-zinc-950 border border-zinc-700 rounded-2xl shadow-inner flex items-center justify-center w-full">
                <canvas
                  ref={stageCanvasRef}
                  width={624}
                  height={480}
                  className="w-full h-auto max-h-[420px] rounded-xl object-contain image-render-pixel border border-zinc-800"
                />
              </div>

              <div className="w-full grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-[10px] font-mono-stat text-zinc-300 pt-2 border-t border-zinc-800">
                {isSelectedCurrent && playerPos && (
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-white border border-zinc-900" /> Tú</span>
                )}
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white" /> Guardián</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Espíritu</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-zinc-100 border border-zinc-900" /> NPC</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-xs" /> Cofre</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-yellow-700 rounded-xs" /> Fósil</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-zinc-400 rounded-xs" /> Portal</span>
              </div>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 pointer-events-none" />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] tracking-widest font-silkscreen text-zinc-600 uppercase pointer-events-none">
                Océano Pacífico
              </div>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-[10px] tracking-widest font-silkscreen text-zinc-600 uppercase pointer-events-none">
                Cordillera de los Andes
              </div>
              <div className="absolute top-[10%] bottom-[12%] left-1/2 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-zinc-600 pointer-events-none" />

              {regionsList.map((id, idx) => {
                const reg = REGIONS_DATA[id];
                const node = mapNodes[id];
                const isCurrent = id === currentRegionId;
                const isUnlocked = unlockedRegions.includes(id);
                const isSelected = id === selectedRegionId;

                return (
                  <div
                    key={id}
                    style={{ top: node.top, left: node.left }}
                    onClick={() => {
                      sound.playSelect();
                      setSelectedRegionId(id);
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-all duration-200"
                  >
                    <div
                      className={`relative flex items-center justify-center rounded-2xl p-2 transition-all ${
                        isSelected ? 'scale-110 shadow-2xl ring-2 ring-zinc-100' : 'hover:scale-105'
                      } ${
                        isCurrent
                          ? 'bg-zinc-100 border-2 border-zinc-950 text-zinc-950'
                          : isUnlocked
                          ? 'bg-zinc-800 border-2 border-zinc-400 text-zinc-100'
                          : 'bg-zinc-950 border-2 border-zinc-800 text-zinc-600'
                      }`}
                    >
                      {isCurrent ? (
                        <MapPin className="w-5 h-5 animate-bounce text-zinc-950" />
                      ) : isUnlocked ? (
                        getRegionIcon(id)
                      ) : (
                        <Lock className="w-4 h-4 text-zinc-600" />
                      )}

                      <span
                        className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center font-silkscreen text-[9px] font-bold ${
                          isCurrent ? 'bg-zinc-950 text-zinc-100 border border-zinc-300' : 'bg-zinc-900 border border-zinc-600 text-zinc-200'
                        }`}
                      >
                        {idx}
                      </span>
                    </div>

                    <div
                      className={`hidden sm:block absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl whitespace-nowrap text-left border ${
                        isSelected
                          ? 'bg-zinc-100 border-zinc-300 text-zinc-950 shadow-lg'
                          : 'bg-zinc-900/95 border-zinc-700 text-zinc-200'
                      }`}
                    >
                      <div className="font-silkscreen text-[10px] font-bold">
                        {reg.name}
                      </div>
                      <div className={`text-[9px] font-mono-stat ${isSelected ? 'text-zinc-700' : 'text-zinc-400'}`}>{node.climate}</div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Right: Selected Region Info & Fast Travel */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5 shadow-xl flex-1">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3.5 gap-2">
              <div className="flex items-center gap-3">
                <span className="p-3 bg-zinc-950 border border-zinc-700 rounded-2xl shadow-inner shrink-0">
                  {getRegionIcon(selectedRegionId)}
                </span>
                <div>
                  <h3 className="font-silkscreen text-sm sm:text-base text-zinc-100">{selectedRegion.name}</h3>
                  <p className="text-xs text-zinc-400 font-mono-stat">{selectedRegion.subtitle}</p>
                </div>
              </div>

              {isSelectedCurrent ? (
                <span className="px-2.5 py-1 bg-zinc-100 border border-zinc-300 rounded-xl text-[10px] font-silkscreen text-zinc-950 font-bold flex items-center gap-1 shrink-0">
                  <MapPin className="w-3.5 h-3.5" /> AQUÍ
                </span>
              ) : isSelectedUnlocked ? (
                <span className="px-2.5 py-1 bg-zinc-800 border border-zinc-500 rounded-xl text-[10px] font-silkscreen text-zinc-100 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ACCESIBLE
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-silkscreen text-zinc-500 flex items-center gap-1 shrink-0">
                  <Lock className="w-3.5 h-3.5" /> CERRADO
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-zinc-300">
              <p className="italic font-ui">&ldquo;{selectedRegion.lore}&rdquo;</p>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-stat pt-2 border-t border-zinc-800">
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px]">Hito / Etapa:</span>
                  <span className="text-zinc-100 font-semibold">{mapNodes[selectedRegionId].landmark}</span>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400 block text-[10px]">Tasa de Encuentro:</span>
                  <span className="text-zinc-100 font-semibold">
                    {selectedRegion.wildEncounterTable.length === 0 ? '0% (Hogar)' : 'Camino 5% · Fuera 40%'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3">
              <div className="text-[10px] font-silkscreen text-zinc-400 mb-2 uppercase flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-zinc-300" />
                <span>Espíritus Silvestres de la Zona:</span>
              </div>
              {selectedRegion.wildEncounterTable.length === 0 ? (
                <div className="text-[11px] font-mono text-zinc-400">
                  Zona pacífica libre de apariciones salvajes.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedRegion.wildEncounterTable.map(enc => (
                    <span key={enc.spiritId} className="px-2 py-0.5 bg-zinc-800 border border-zinc-600 rounded-lg text-[10px] font-mono-stat text-zinc-200 capitalize">
                      {enc.spiritId} (Nv.{enc.minLevel === enc.maxLevel ? enc.minLevel : `${enc.minLevel}-${enc.maxLevel}`})
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-auto pt-2">
              {isSelectedCurrent ? (
                <div className="w-full py-3 bg-zinc-800 border border-zinc-600 rounded-2xl text-center text-xs font-silkscreen text-zinc-200">
                  Explorando actualmente esta zona
                </div>
              ) : isSelectedUnlocked ? (
                <button
                  onClick={() => {
                    sound.playConfirm();
                    onFastTravel(selectedRegionId);
                  }}
                  className="w-full py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 font-silkscreen font-bold text-xs rounded-2xl cursor-pointer transition-all shadow-xl flex items-center justify-center gap-2 border border-zinc-300"
                >
                  <Navigation className="w-4 h-4 text-zinc-900" />
                  <span>VIAJAR A {selectedRegion.name.toUpperCase()}</span>
                </button>
              ) : (
                <div className="w-full py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-center text-xs font-silkscreen text-zinc-500 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>COMPLETA LA ETAPA ANTERIOR</span>
                </div>
              )}
            </div>
          </div>

          {/* 6-Stage Quick Region Selector (0 = Casa .. 5 = Los Lagos) */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {regionsList.map((id, idx) => {
              const isSelected = id === selectedRegionId;
              const isUnlocked = unlockedRegions.includes(id);

              return (
                <button
                  key={id}
                  onClick={() => {
                    sound.playSelect();
                    setSelectedRegionId(id);
                  }}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-100 border-white text-zinc-950 font-bold shadow-md'
                      : isUnlocked
                      ? 'bg-zinc-900 border-zinc-700 hover:border-zinc-500 text-zinc-300'
                      : 'bg-zinc-950/60 border-zinc-900 opacity-50 text-zinc-600'
                  }`}
                >
                  <div className="font-silkscreen text-[9px] truncate">
                    {idx}. {mapNodes[id].shortLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto pt-3 border-t border-zinc-800 text-center text-[11px] font-mono-stat text-zinc-500">
        Toca cualquier etapa desbloqueada para consultar su topografía o viajar de inmediato.
      </div>
    </div>
  );
};
