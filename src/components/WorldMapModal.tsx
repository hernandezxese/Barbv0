/**
 * Chilean World Map & Fast Travel Modal
 * Layout:
 * - Stages 0 (Casa) & 1 (R. Metropolitana) grouped together at north hub
 * - Far south gap before Stage 2 (R. del Biobío)
 * - Stages 2..5 (Biobío, Araucanía, Los Ríos, Los Lagos) clustered close southward
 * - Topographical canvas mirrors Progressive Fog of War (revealedTiles) and Railway tracks (tile 11)
 */

import React, { useState } from 'react';
import { MAIN_REGION_IDS, RegionId } from '../types/game';
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
  revealedTiles?: Record<string, string[]>;
  onFastTravel: (targetRegionId: RegionId) => void;
  onClose: () => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  currentRegionId,
  unlockedRegions,
  playerPos,
  revealedTiles,
  onFastTravel,
  onClose,
}) => {
  const initialSelected: RegionId = MAIN_REGION_IDS.includes(currentRegionId) ? currentRegionId : 'santiago';
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId>(initialSelected);
  const regionsList: RegionId[] = MAIN_REGION_IDS;

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
    casa: { top: '13%', left: '50%', landmark: 'Hogar Familiar (Escenario 0)', climate: 'Interior (0%)', shortLabel: 'Casa' },
    santiago: { top: '13%', left: '50%', landmark: 'Cerro San Cristóbal, Río Mapocho y Urbe', climate: 'Soleado', shortLabel: 'R.M.' },
    biobio: { top: '53%', left: '50%', landmark: 'Volcán Antuco, Río, Vía Férrea y Ciudad', climate: 'Niebla/Lluvia', shortLabel: 'Biobío' },
    araucania: { top: '65%', left: '51%', landmark: 'Volcán Villarrica, Lago y Rucas Mapuches', climate: 'Lluvia Fija', shortLabel: 'Araucanía' },
    losrios: { top: '77%', left: '49%', landmark: 'Volcán Mocho-Choshuenco, 2 Ríos y Lago', climate: 'Lluvia+Viento', shortLabel: 'Los Ríos' },
    loslagos: { top: '89%', left: '48%', landmark: 'Volcán Osorno, Isla Chiloé y Palafitos', climate: 'Tormenta', shortLabel: 'Los Lagos' },
    hospital: { top: '53%', left: '72%', landmark: 'Hospital Regional (Interior)', climate: 'Seguro (0%)', shortLabel: 'Hospital' },
    santuario: { top: '77%', left: '72%', landmark: 'Santuario de Evolución', climate: 'Seguro (0%)', shortLabel: 'Santuario' },
    tienda: { top: '13%', left: '72%', landmark: 'Tienda Regional (Interior)', climate: 'Seguro (0%)', shortLabel: 'Tienda' },
  };

  const hasHospital = selectedRegion.entities.some(
    e => e.isHospital || e.destinationRegion === 'hospital'
  );
  const hasTienda = selectedRegion.entities.some(
    e => e.isShop || e.destinationRegion === 'tienda'
  );
  const hasSantuario = selectedRegion.entities.some(
    e => e.isEvolutionSanctuary || e.destinationRegion === 'santuario'
  );

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
    const isInterior = reg.id === 'casa' || reg.id === 'hospital' || reg.id === 'santuario' || reg.id === 'tienda';
    const revealedList = revealedTiles?.[reg.id];
    const revealedSet = new Set(revealedList || []);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * cellW;
        const py = y * cellH;
        const isRevealed = isInterior || (revealedList !== undefined && revealedSet.size > 0 ? revealedSet.has(`${x},${y}`) : false);

        if (!isRevealed) {
          ctx.fillStyle = '#09090b';
          ctx.fillRect(px, py, cellW, cellH);
          ctx.strokeStyle = 'rgba(39, 39, 42, 0.35)';
          ctx.strokeRect(px, py, cellW, cellH);
          continue;
        }

        const tile = reg.tiles[y]?.[x] ?? 0;

        if (tile === 0) {
          ctx.fillStyle =
            reg.id === 'casa' ? '#92400e' :
            reg.id === 'santiago' ? '#4ade80' :
            reg.id === 'biobio' ? '#4d7c0f' :
            reg.id === 'araucania' ? '#15803d' :
            reg.id === 'losrios' ? '#064e3b' : '#475569';
        } else if (tile === 1) {
          ctx.fillStyle =
            reg.id === 'casa' ? '#d4d4d8' :
            reg.id === 'santiago' ? '#cbd5e1' :
            reg.id === 'biobio' ? '#d6d3d1' :
            reg.id === 'araucania' ? '#78716c' :
            reg.id === 'losrios' ? '#451a03' : '#64748b';
        } else if (tile === 11) {
          ctx.fillStyle = '#44403c';
        } else if (tile === 2) {
          ctx.fillStyle =
            reg.id === 'santiago' ? '#0ea5e9' :
            reg.id === 'biobio' ? '#0284c7' :
            reg.id === 'losrios' ? '#1e3a8a' : '#0c4a6e';
        } else if (tile === 3) {
          ctx.fillStyle =
            reg.id === 'casa' ? '#27272a' :
            reg.id === 'santiago' ? (y <= 1 ? '#e2e8f0' : '#94a3b8') :
            reg.id === 'biobio' ? '#475569' :
            reg.id === 'araucania' ? '#292524' :
            reg.id === 'losrios' ? '#0f172a' : (y <= 2 ? '#bae6fd' : '#334155');
        } else if (tile === 4) {
          ctx.fillStyle =
            reg.id === 'santiago' ? '#15803d' :
            reg.id === 'biobio' ? '#365314' :
            reg.id === 'araucania' ? '#14532d' :
            reg.id === 'losrios' ? '#9a3412' : '#14532d';
        } else if (tile === 5) {
          ctx.fillStyle = '#ea580c';
        } else if (tile === 6) {
          ctx.fillStyle = '#f8fafc';
        } else if (tile === 7) {
          ctx.fillStyle =
            reg.id === 'santiago' ? '#facc15' :
            reg.id === 'biobio' ? '#84cc16' :
            reg.id === 'araucania' ? '#e11d48' :
            reg.id === 'losrios' ? '#a3e635' : '#bae6fd';
        } else if (tile === 8) {
          const chiloePalette = ['#dc2626', '#eab308', '#0284c7', '#16a34a'];
          ctx.fillStyle =
            reg.id === 'casa' ? '#57534e' :
            reg.id === 'santiago' ? '#c2410c' :
            reg.id === 'biobio' ? '#991b1b' :
            reg.id === 'araucania' ? '#9a3412' :
            reg.id === 'losrios' ? '#1e293b' : chiloePalette[x % 4];
        } else if (tile === 9) {
          ctx.fillStyle = '#a16207';
        } else if (tile === 10) {
          ctx.fillStyle = '#e7e5e4';
        } else {
          ctx.fillStyle = '#18181b';
        }

        ctx.fillRect(px, py, cellW, cellH);
        if (tile === 11) {
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(px, py + cellH * 0.28, cellW, cellH * 0.14);
          ctx.fillRect(px, py + cellH * 0.6, cellW, cellH * 0.14);
        } else if (tile === 8 && reg.id !== 'casa') {
          ctx.fillStyle = reg.id === 'loslagos' ? '#fbbf24' : reg.id === 'losrios' ? '#fde047' : '#fef3c7';
          ctx.fillRect(px + cellW * 0.3, py + cellH * 0.45, cellW * 0.4, cellH * 0.35);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.14)';
        ctx.strokeRect(px, py, cellW, cellH);
      }
    }

    reg.entities.forEach(ent => {
      if (ent.cleared && ent.type !== 'npc') return;
      const isEntRevealed = isInterior || (revealedList !== undefined && revealedSet.size > 0 && revealedSet.has(`${ent.x},${ent.y}`));
      if (!isEntRevealed) return;

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
        ctx.fillStyle = ent.isHospital ? '#f43f5e' : ent.isShop ? '#facc15' : '#fafafa';
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
        ctx.fillStyle = ent.id.includes('tienda') ? '#facc15' : ent.id.includes('hospital') ? '#f43f5e' : '#a1a1aa';
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
  }, [viewMode, selectedRegionId, selectedRegion, isSelectedCurrent, playerPos, revealedTiles]);

  const northHubRegions: RegionId[] = ['casa', 'santiago'];
  const southRegions: RegionId[] = ['biobio', 'araucania', 'losrios', 'loslagos'];

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-2.5 sm:p-4 text-zinc-100 font-ui">
      {/* Top Header */}
      <div className="max-w-6xl w-full mx-auto flex flex-wrap justify-between items-center gap-2 pb-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl text-zinc-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-silkscreen active:scale-95 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>VOLVER</span>
          </button>
          <div className="min-w-0">
            <h2 className="font-silkscreen text-xs sm:text-sm text-zinc-100 flex items-center gap-1.5 truncate">
              <Compass className="w-4 h-4 text-zinc-200 shrink-0" />
              <span className="truncate">MAPA DE EXPEDICIÓN</span>
            </h2>
            <p className="text-[10px] text-zinc-400 font-mono-stat hidden sm:block">
              Camino/Tren 0% · Fuera 1%-3% · Interior 0% · Se revela al avanzar
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playSelect();
            setViewMode(v => (v === 'cartography' ? 'stage_terrain' : 'cartography'));
          }}
          className="px-3 py-1.5 bg-zinc-100 hover:bg-white border border-zinc-300 rounded-xl text-[10px] sm:text-xs font-silkscreen font-bold text-zinc-950 flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{viewMode === 'cartography' ? 'VER TOPOGRAFÍA' : 'VER RUTA DE CHILE'}</span>
        </button>
      </div>

      {/* Main Map Visual & Regions */}
      <div className="max-w-6xl w-full mx-auto my-2.5 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-700 rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-between min-h-[290px] sm:min-h-[400px] relative overflow-hidden shadow-2xl">
          {viewMode === 'stage_terrain' ? (
            <div className="relative w-full h-full flex flex-col items-center justify-between z-10 gap-2">
              <div className="w-full flex justify-between items-center pb-1.5 border-b border-zinc-800 text-[10px] sm:text-xs font-silkscreen text-zinc-100">
                <span className="truncate pr-2">{selectedRegion.name.toUpperCase()}</span>
                <span className="text-[10px] text-zinc-400 font-mono-stat shrink-0">
                  {selectedRegion.width}&times;{selectedRegion.height}
                </span>
              </div>

              <div className="relative my-auto p-1.5 bg-zinc-950 border border-zinc-700 rounded-xl shadow-inner flex items-center justify-center w-full">
                <canvas
                  ref={stageCanvasRef}
                  width={624}
                  height={480}
                  className="w-full h-auto max-h-[340px] rounded-lg object-contain image-render-pixel border border-zinc-800"
                />
              </div>

              <div className="w-full grid grid-cols-3 sm:grid-cols-4 gap-1 text-[9px] font-mono-stat text-zinc-300 pt-1.5 border-t border-zinc-800">
                {isSelectedCurrent && playerPos && (
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white border border-zinc-900" /> Tú</span>
                )}
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 border border-white" /> Guardián</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" /> Criatura</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Tienda</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Hospital</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-xs" /> Cofre/Orbe</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-pink-500 rounded-xs" /> Misión</span>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full min-h-[290px]">
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 pointer-events-none" />
              {/* Vertical spine connecting North Hub (0+1) down to South Cluster (2..5) */}
              <div className="absolute top-[14%] bottom-[11%] left-1/2 -translate-x-1/2 w-0.5 border-l-2 border-dashed border-zinc-600 pointer-events-none" />

              {/* North Hub: Stage 0 (Casa) & Stage 1 (R. Metropolitana) sharing the exact same geographical coordinate */}
              <div
                style={{ top: '14%', left: '50%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 bg-zinc-950/90 border-2 border-zinc-500 p-1.5 rounded-2xl shadow-2xl"
              >
                {northHubRegions.map((id, idx) => {
                  const isCurrent = id === currentRegionId;
                  const isSelected = id === selectedRegionId;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        sound.playSelect();
                        setSelectedRegionId(id);
                      }}
                      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-white scale-105' : 'hover:scale-105'
                      } ${
                        isCurrent
                          ? 'bg-zinc-100 text-zinc-950 font-bold'
                          : 'bg-zinc-800 text-zinc-100 border border-zinc-600'
                      }`}
                    >
                      {isCurrent ? <MapPin className="w-3.5 h-3.5 animate-bounce text-zinc-950" /> : getRegionIcon(id)}
                      <span className="font-silkscreen text-[9px] whitespace-nowrap">
                        {idx}.{mapNodes[id].shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Long Distance Label between Center & South */}
              <div
                style={{ top: '34%', left: '50%' }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-[9px] font-mono text-zinc-400 whitespace-nowrap"
              >
                Ruta hacia el Sur
              </div>

              {/* South Cluster: Stages 2 (Biobío), 3 (Araucanía), 4 (Los Ríos), 5 (Los Lagos) grouped southward */}
              {southRegions.map((id, sIdx) => {
                const idx = sIdx + 2;
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
                        <MapPin className="w-4 h-4 animate-bounce text-zinc-950" />
                      ) : isUnlocked ? (
                        getRegionIcon(id)
                      ) : (
                        <Lock className="w-4 h-4 text-zinc-600" />
                      )}

                      <span
                        className={`absolute -top-2 -right-2 w-4 h-4 rounded-full flex items-center justify-center font-silkscreen text-[8px] font-bold ${
                          isCurrent ? 'bg-zinc-950 text-zinc-100 border border-zinc-300' : 'bg-zinc-900 border border-zinc-600 text-zinc-200'
                        }`}
                      >
                        {idx}
                      </span>
                    </div>

                    <div
                      className={`absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg whitespace-nowrap text-left border ${
                        isSelected
                          ? 'bg-zinc-100 border-zinc-300 text-zinc-950 shadow-lg'
                          : 'bg-zinc-900/95 border-zinc-700 text-zinc-200'
                      }`}
                    >
                      <div className="font-silkscreen text-[9px] font-bold">{reg.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Selected Region Info & Fast Travel */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-2.5">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-3 sm:p-4 flex flex-col gap-2.5 shadow-xl flex-1">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-2.5 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 bg-zinc-950 border border-zinc-700 rounded-xl shrink-0">
                  {getRegionIcon(selectedRegionId)}
                </span>
                <div className="min-w-0">
                  <h3 className="font-silkscreen text-xs sm:text-sm text-zinc-100 truncate">{selectedRegion.name}</h3>
                  <p className="text-[11px] text-zinc-400 font-mono-stat truncate">{selectedRegion.subtitle}</p>
                </div>
              </div>

              {isSelectedCurrent ? (
                <span className="px-2 py-0.5 bg-zinc-100 rounded-lg text-[9px] font-silkscreen text-zinc-950 font-bold shrink-0">
                  AQUÍ
                </span>
              ) : isSelectedUnlocked ? (
                <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-500 rounded-lg text-[9px] font-silkscreen text-zinc-100 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> LIBRE
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[9px] font-silkscreen text-zinc-500 flex items-center gap-1 shrink-0">
                  <Lock className="w-3 h-3" /> CERRADO
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono-stat">
              <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 block text-[9px]">Hito:</span>
                <span className="text-zinc-100 font-semibold">{mapNodes[selectedRegionId]?.landmark}</span>
              </div>
              <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="text-zinc-400 block text-[9px]">Encuentros:</span>
                <span className="text-zinc-100 font-semibold">
                  {selectedRegion.wildEncounterTable.length === 0 ? '0% (Hogar)' : 'Camino/Tren 0% · Fuera 1%-3%'}
                </span>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
              <div className="text-[9px] font-silkscreen text-zinc-400 mb-1.5 uppercase">
                Lugares y Servicios de la Región:
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono-stat">
                <div
                  className={`px-2 py-1.5 rounded-lg border text-center ${
                    hasHospital
                      ? 'bg-zinc-900 border-rose-500/70 text-zinc-100 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                  }`}
                >
                  <div>🏥 Hospital</div>
                  <div className="text-[9px]">{hasHospital ? 'Disponible' : 'No hay'}</div>
                </div>
                <div
                  className={`px-2 py-1.5 rounded-lg border text-center ${
                    hasTienda
                      ? 'bg-zinc-900 border-amber-400/70 text-zinc-100 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                  }`}
                >
                  <div>🛒 Tienda</div>
                  <div className="text-[9px]">{hasTienda ? 'Disponible' : 'No hay'}</div>
                </div>
                <div
                  className={`px-2 py-1.5 rounded-lg border text-center ${
                    hasSantuario
                      ? 'bg-zinc-900 border-emerald-400/70 text-zinc-100 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                  }`}
                >
                  <div>✨ Santuario</div>
                  <div className="text-[9px]">{hasSantuario ? 'Disponible' : 'No hay'}</div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2.5">
              <div className="text-[9px] font-silkscreen text-zinc-400 mb-1.5 uppercase">
                Criaturas Espirituales de la Zona:
              </div>
              {selectedRegion.wildEncounterTable.length === 0 ? (
                <div className="text-[10px] font-mono text-zinc-400">Zona pacífica sin combates.</div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectedRegion.wildEncounterTable.map(enc => (
                    <span key={enc.spiritId} className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-[9px] font-mono-stat text-zinc-200 capitalize">
                      {enc.spiritId.replace('_', ' ')} Nv.{enc.minLevel === enc.maxLevel ? enc.minLevel : `${enc.minLevel}-${enc.maxLevel}`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-auto">
              {isSelectedCurrent ? (
                <div className="w-full py-2.5 bg-zinc-800 border border-zinc-600 rounded-xl text-center text-[11px] font-silkscreen text-zinc-200">
                  Explorando esta región
                </div>
              ) : isSelectedUnlocked ? (
                <button
                  onClick={() => {
                    sound.playConfirm();
                    onFastTravel(selectedRegionId);
                  }}
                  className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-silkscreen font-bold text-[11px] rounded-xl cursor-pointer transition-all shadow-xl flex items-center justify-center gap-1.5 border border-zinc-300"
                >
                  <Navigation className="w-3.5 h-3.5 text-zinc-900" />
                  <span>VIAJAR A {selectedRegion.name.toUpperCase()}</span>
                </button>
              ) : (
                <div className="w-full py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-[11px] font-silkscreen text-zinc-500 flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>COMPLETA LA ETAPA ANTERIOR</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
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
                  className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-100 border-white text-zinc-950 font-bold shadow-md'
                      : isUnlocked
                      ? 'bg-zinc-900 border-zinc-700 hover:border-zinc-500 text-zinc-300'
                      : 'bg-zinc-950/60 border-zinc-900 opacity-50 text-zinc-600'
                  }`}
                >
                  <div className="font-silkscreen text-[9px] truncate">
                    {idx}.{mapNodes[id].shortLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
