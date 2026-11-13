/**
 * Visual Expedition Guide & Codex Modal for Crónicas Elementales del Sur
 * Includes pixel-art previews, 0.5%-1% path vs 1%-3% off-path encounter rule,
 * hospitals, evolution sanctuaries, duplicate capture EXP rule, and mobile touch controls.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Compass,
  Swords,
  Sparkles,
  ChevronLeft,
  Crosshair,
  Footprints,
  Trees,
  Store,
  Shield,
  Users,
  Smartphone,
  Award,
} from 'lucide-react';
import { sound } from '../services/audioService';
import { drawBarbaraSprite, drawCreatureSprite, drawEntitySprite } from '../utils/pixelRenderer';

interface AdventureGuideModalProps {
  onClose: () => void;
}

const PixelPreviewCanvas: React.FC<{
  kind: 'hero' | 'companion' | 'trex' | 'shop' | 'maestro' | 'cuellilargo';
}> = ({ kind }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    let tick = 0;
    const render = () => {
      tick += 1;
      const canvas = ref.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false;
          if (kind === 'hero') {
            drawBarbaraSprite(ctx, 8, 8, 44, 'down', Math.floor(tick / 12) % 4, false, 'female');
          } else if (kind === 'companion') {
            ctx.save();
            ctx.filter = 'hue-rotate(36deg) brightness(1.18) saturate(1.25)';
            drawCreatureSprite(ctx, 'brotin', 2, 6, 6, 48, tick * 0.05, false);
            ctx.restore();
          } else if (kind === 'trex') {
            drawCreatureSprite(ctx, 'trex', 2, 6, 6, 48, tick * 0.05, false);
          } else if (kind === 'cuellilargo') {
            drawCreatureSprite(ctx, 'cuellilargo', 2, 6, 6, 48, tick * 0.05, false);
          } else if (kind === 'shop') {
            drawEntitySprite(ctx, 'npc', 'npc_shopkeeper', 8, 10, 44, false, tick * 0.4, true);
          } else {
            drawEntitySprite(ctx, 'npc', 'npc_maestro_vinculo', 8, 10, 44, false, tick * 0.4, true);
          }
        }
      }
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [kind]);

  return (
    <canvas
      ref={ref}
      width={60}
      height={60}
      className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-zinc-950 border border-zinc-700 image-render-pixel shrink-0"
    />
  );
};

export const AdventureGuideModal: React.FC<AdventureGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'quest' | 'combat' | 'evolution' | 'controls'>('quest');

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-2.5 sm:p-4 text-zinc-100">
      {/* Header */}
      <div className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-2.5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-100 cursor-pointer flex items-center gap-1 text-xs font-mono active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div>
            <h2 className="font-pixel text-xs sm:text-sm text-zinc-100 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-zinc-200 shrink-0" />
              <span>GUÍA DE EXPEDICIÓN</span>
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 bg-zinc-900 border border-zinc-700 p-1 rounded-xl text-[10px] font-mono">
          <button
            onClick={() => { sound.playSelect(); setActiveTab('quest'); }}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'quest' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Rutas
          </button>
          <button
            onClick={() => { sound.playSelect(); setActiveTab('combat'); }}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'combat' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Combate
          </button>
          <button
            onClick={() => { sound.playSelect(); setActiveTab('evolution'); }}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'evolution' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Evolución
          </button>
          <button
            onClick={() => { sound.playSelect(); setActiveTab('controls'); }}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'controls' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Táctil
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl w-full mx-auto my-2.5 flex-1">
        {activeTab === 'quest' && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div className="p-3 bg-zinc-900 border border-zinc-600 rounded-xl flex items-center gap-2.5">
                <PixelPreviewCanvas kind="hero" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-pixel text-[10px] text-zinc-100">
                    <Footprints className="w-3.5 h-3.5 text-zinc-200 shrink-0" />
                    <span>CAMINOS Y VÍA FÉRREA: 0%</span>
                  </div>
                  <p className="text-[10px] text-zinc-300 font-mono leading-snug mt-0.5">
                    Caminar por senderos, puentes o vías férreas tiene <strong className="text-white">0% de encuentros</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-zinc-200 text-zinc-950 border border-zinc-400 rounded-xl flex items-center gap-2.5">
                <PixelPreviewCanvas kind="cuellilargo" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-pixel text-[10px] text-zinc-950">
                    <Trees className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                    <span>FUERA DE CAMINO: 1% - 3%</span>
                  </div>
                  <p className="text-[10px] text-zinc-800 font-mono leading-snug mt-0.5">
                    En pasto, flores, nieve o zonas fósiles sube a <strong className="text-black">1% - 3%</strong> por paso.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center gap-2.5">
                <PixelPreviewCanvas kind="companion" />
                <div>
                  <div className="font-silkscreen text-[10px] text-zinc-100">★ COMPAÑERO</div>
                  <p className="text-[10px] text-zinc-400 font-mono">Te sigue con halo luminoso distinto al salvaje.</p>
                </div>
              </div>
              <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center gap-2.5">
                <PixelPreviewCanvas kind="shop" />
                <div>
                  <div className="font-silkscreen text-[10px] text-zinc-100 flex items-center gap-1">
                    <Store className="w-3 h-3" /> SALAS &amp; TIENDAS
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono">Tiendas en Stages 1, 3 y 5. Hospitales en 2 y 4.</p>
                </div>
              </div>
              <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center gap-2.5">
                <PixelPreviewCanvas kind="maestro" />
                <div>
                  <div className="font-silkscreen text-[10px] text-zinc-100 flex items-center gap-1">
                    <Award className="w-3 h-3" /> 5 MEDALLAS
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono">Cada Jefe Regional otorga su Medalla de Guardián.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10px]">
              <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl">
                <span className="text-zinc-100 font-bold block">0. Casa &amp; 1. R. Metropolitana</span>
                <span className="text-zinc-400">Hogar seguro, Río Mapocho, Cerros, Tienda (Interior) y Torre Costanera (Nv.5).</span>
              </div>
              <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl">
                <span className="text-zinc-100 font-bold block">2. R. del Biobío &amp; 3. R. Araucanía</span>
                <span className="text-zinc-400">Biobío con vía férrea, Hospital y Santuario (T-Rex Nv.7); Araucanía con Tienda (Nv.9).</span>
              </div>
              <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl sm:col-span-2">
                <span className="text-zinc-100 font-bold block">4. R. de Los Ríos &amp; 5. R. de Los Lagos</span>
                <span className="text-zinc-400">Los Ríos con Hospital/Santuario y Torreón (Nv.11); Los Lagos con Tienda, Cai Cai (Nv.13) y Vilu Vilu (Nv.14).</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'combat' && (
          <div className="space-y-2.5">
            <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Swords className="w-4 h-4 text-zinc-100 shrink-0" />
                <h3 className="font-pixel text-[11px] text-zinc-100">AFINIDADES &amp; VÍNCULO</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[10px]">
                <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-700">
                  <span className="text-zinc-100 font-bold block">🔥 FUEGO</span>
                  <span className="text-zinc-400">Fuerte vs Planta/Tierra/Hielo. Débil vs Agua.</span>
                </div>
                <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-700">
                  <span className="text-zinc-100 font-bold block">💧 AGUA</span>
                  <span className="text-zinc-400">Fuerte vs Fuego/Tierra. Débil vs Planta.</span>
                </div>
                <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-700">
                  <span className="text-zinc-100 font-bold block">🌿 PLANTA</span>
                  <span className="text-zinc-400">Fuerte vs Agua/Tierra. Débil vs Fuego/Viento.</span>
                </div>
                <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-700">
                  <span className="text-zinc-100 font-bold block">🌪️ VIENTO</span>
                  <span className="text-zinc-400">Fuerte vs Planta/Agua.</span>
                </div>
                <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-700">
                  <span className="text-zinc-100 font-bold block">⛰️ TIERRA</span>
                  <span className="text-zinc-400">Fuerte vs Viento/Hielo.</span>
                </div>
                <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-700">
                  <span className="text-zinc-100 font-bold block">❄️ HIELO</span>
                  <span className="text-zinc-400">Fuerte vs Viento/Planta.</span>
                </div>
              </div>

              <div className="p-2.5 bg-zinc-950 border border-zinc-600 rounded-xl font-mono text-[10px] space-y-1">
                <span className="text-zinc-100 font-bold flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5" /> CAPTURA REPETIDA &amp; JEFES
                </span>
                <p className="text-zinc-300">
                  Capturar una especie repetida otorga <strong className="text-white">EXP bonus a tu copia original</strong>. Los Jefes son el doble de difíciles de capturar. Si cae tu criatura puedes relevar por un compañero sano.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evolution' && (
          <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl font-mono text-[11px] space-y-2.5">
            <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-2">
              <PixelPreviewCanvas kind="companion" />
              <div>
                <h3 className="font-pixel text-[11px] text-zinc-100 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> TEMPLOS DE EVOLUCIÓN (STAGES 2 Y 4)
                </h3>
                <p className="text-zinc-400 text-[10px]">Las especies tienen entre 1 y 3 etapas evolutivas y aprenden técnicas al subir de nivel.</p>
              </div>
            </div>
            <div className="p-2.5 bg-zinc-950 border border-zinc-700 rounded-lg">
              <span className="text-zinc-100 font-bold block">Solo dentro de los Santuarios físicos:</span>
              <span className="text-zinc-400 text-[10px]">La evolución no está disponible desde el menú. Entra a los Templos de Evolución en R. del Biobío (Stage 2) y R. de Los Ríos (Stage 4).</span>
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl font-mono text-[10px] space-y-2">
            <h3 className="font-pixel text-xs text-zinc-100 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> CONTROLES TÁCTILES MÓVILES
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-700">
                <span className="text-zinc-100 font-bold block">Tocar Mapa (Tap-to-Move)</span>
                <span className="text-zinc-400">Toca cualquier zona visible para caminar automáticamente entre el Pacífico (O) y los Andes (E).</span>
              </div>
              <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-700">
                <span className="text-zinc-100 font-bold block">Habilidades del Líder Activo</span>
                <span className="text-zinc-400">Equipa al espíritu del elemento necesario como Líder Activo en Equipo para liberar pasos bloqueados.</span>
              </div>
              <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-700">
                <span className="text-zinc-100 font-bold block">Niebla de Exploración</span>
                <span className="text-zinc-400">El mapa y topografía se revelan progresivamente a medida que avanzas.</span>
              </div>
              <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-700">
                <span className="text-zinc-100 font-bold block">Mensajes y ACCIÓN</span>
                <span className="text-zinc-400">Todos los avisos e interacciones importantes aparecen junto al botón ACCIÓN abajo a la derecha.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-4xl w-full mx-auto pt-2 border-t border-zinc-800 text-center text-[10px] font-mono text-zinc-500">
        Caminos / Vías / Interiores: 0% · Fuera de camino: 1%-3% · Toca el mapa para explorar
      </div>
    </div>
  );
};
