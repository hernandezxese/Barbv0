/**
 * Visual Expedition Guide & Codex Modal for Crónicas Elementales del Sur
 * Includes pixel-art canvas previews, Lucide icons, 5% path vs 40% off-path encounter rule,
 * Stage 0..5 summary, evolution steps, and mobile touch controls in a monochrome light/black/gray UI.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Compass,
  Swords,
  Sparkles,
  ChevronLeft,
  Crosshair,
  Home,
  Footprints,
  Trees,
  Store,
  Shield,
  Users,
  Smartphone,
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
            drawBarbaraSprite(ctx, 8, 8, 48, 'down', Math.floor(tick / 12) % 4, false, 'female');
          } else if (kind === 'companion') {
            ctx.save();
            ctx.filter = 'hue-rotate(36deg) brightness(1.18) saturate(1.25)';
            drawCreatureSprite(ctx, 'brotin', 2, 6, 6, 52, tick * 0.05, false);
            ctx.restore();
          } else if (kind === 'trex') {
            drawCreatureSprite(ctx, 'trex', 2, 6, 6, 52, tick * 0.05, false);
          } else if (kind === 'cuellilargo') {
            drawCreatureSprite(ctx, 'cuellilargo', 2, 6, 6, 52, tick * 0.05, false);
          } else if (kind === 'shop') {
            drawEntitySprite(ctx, 'npc', 'npc_shopkeeper', 8, 10, 48, false, tick * 0.4, true);
          } else {
            drawEntitySprite(ctx, 'npc', 'npc_maestro_vinculo', 8, 10, 48, false, tick * 0.4, true);
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
      width={64}
      height={64}
      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-zinc-950 border border-zinc-700 image-render-pixel shrink-0"
    />
  );
};

export const AdventureGuideModal: React.FC<AdventureGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'quest' | 'combat' | 'evolution' | 'controls'>('quest');

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-3 sm:p-5 md:p-6 text-zinc-100">
      {/* Header */}
      <div className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-3 sm:pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-100 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div>
            <h2 className="font-pixel text-xs sm:text-sm md:text-base text-zinc-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-zinc-200 shrink-0" />
              <span>GUÍA DE EXPEDICIÓN</span>
            </h2>
            <p className="text-[11px] text-zinc-400 font-mono">Regiones, probabilidades de aparición, combate y controles</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 bg-zinc-900 border border-zinc-700 p-1 rounded-xl text-[11px] font-mono">
          <button
            onClick={() => { sound.playSelect(); setActiveTab('quest'); }}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'quest' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Etapas &amp; Rutas
          </button>
          <button
            onClick={() => { sound.playSelect(); setActiveTab('combat'); }}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'combat' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Combate
          </button>
          <button
            onClick={() => { sound.playSelect(); setActiveTab('evolution'); }}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'evolution' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Evolución
          </button>
          <button
            onClick={() => { sound.playSelect(); setActiveTab('controls'); }}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'controls' ? 'bg-zinc-100 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Táctil
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl w-full mx-auto my-4 flex-1">
        {activeTab === 'quest' && (
          <div className="space-y-4">
            {/* Encounter Rule Banner (5% on Path vs 40% Off-Path) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 bg-zinc-900 border border-zinc-600 rounded-2xl flex items-center gap-3">
                <PixelPreviewCanvas kind="hero" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-pixel text-[11px] text-zinc-100">
                    <Footprints className="w-3.5 h-3.5 text-zinc-200 shrink-0" />
                    <span>CAMINOS SEGUROS: 5%</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 font-mono leading-relaxed mt-1">
                    Al desplazarte sobre senderos de piedra, la probabilidad de aparición salvaje es solo del <strong className="text-white">5%</strong> por paso.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-zinc-200 text-zinc-950 border border-zinc-400 rounded-2xl flex items-center gap-3">
                <PixelPreviewCanvas kind="cuellilargo" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-pixel text-[11px] text-zinc-950">
                    <Trees className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                    <span>FUERA DE CAMINO: 40%</span>
                  </div>
                  <p className="text-[11px] text-zinc-800 font-mono leading-relaxed mt-1">
                    En prados, flores, nieve o zonas fósiles la probabilidad de combate sube al <strong className="text-black">40%</strong> por paso. ¡Ideal para entrenar!
                  </p>
                </div>
              </div>
            </div>

            {/* Illustrated Field Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center gap-3">
                <PixelPreviewCanvas kind="companion" />
                <div>
                  <div className="font-silkscreen text-[10px] text-zinc-100">★ COMPAÑERO ACTIVO</div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    Te sigue de cerca con un halo claro y tono luminoso distinto al salvaje.
                  </p>
                </div>
              </div>
              <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center gap-3">
                <PixelPreviewCanvas kind="shop" />
                <div>
                  <div className="font-silkscreen text-[10px] text-zinc-100 flex items-center gap-1">
                    <Store className="w-3 h-3" /> TIENDAS FÍSICAS
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    Visibles en Escenario 1 (RM), Escenario 3 (Araucanía) y Escenario 5 (Los Lagos).
                  </p>
                </div>
              </div>
              <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center gap-3">
                <PixelPreviewCanvas kind="maestro" />
                <div>
                  <div className="font-silkscreen text-[10px] text-zinc-100 flex items-center gap-1">
                    <Users className="w-3 h-3" /> MAESTROS VÍNCULO
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    Cada Jefe Regional pelea acompañado por su Maestro Vínculo humano.
                  </p>
                </div>
              </div>
            </div>

            {/* Stage 0..5 Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-zinc-900 border border-zinc-700 rounded-xl font-mono text-xs space-y-1">
                <div className="text-zinc-100 font-bold font-pixel text-[11px] flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" /> 0. CASA DEL PROTAGONISTA
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Escenario inicial (0% combates). Habla con Mamá Elena, descansa gratis en tu cama y sal hacia Santiago.
                </p>
              </div>

              <div className="p-3.5 bg-zinc-900 border border-zinc-700 rounded-xl font-mono text-xs space-y-1">
                <div className="text-zinc-100 font-bold font-pixel text-[11px]">
                  1. REGIÓN METROPOLITANA
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Visita la Botica de Don Manuel, habla con habitantes del valle, abre los cofres y desafía al Edificio Costanera Center (Nv.5).
                </p>
              </div>

              <div className="p-3.5 bg-zinc-900 border border-zinc-600 rounded-xl font-mono text-xs flex items-center gap-3">
                <PixelPreviewCanvas kind="trex" />
                <div className="space-y-1">
                  <div className="text-zinc-100 font-bold font-pixel text-[11px]">
                    2. BIOBÍO (NUBOSO &amp; PREHISTÓRICO)
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Cielos grises, claros fósiles con dinosaurios Cuellilargo y el T-Rex Tirano del Biobío (Nv.7).
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-900 border border-zinc-700 rounded-xl font-mono text-xs space-y-1">
                <div className="text-zinc-100 font-bold font-pixel text-[11px]">
                  3. LA ARAUCANÍA
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Incluye puesto mercader de Doña Millaray, obstáculos de magma (requiere AGUA) y la Araucaria Madre (Nv.9).
                </p>
              </div>

              <div className="p-3.5 bg-zinc-900 border border-zinc-700 rounded-xl font-mono text-xs space-y-1">
                <div className="text-zinc-100 font-bold font-pixel text-[11px]">
                  4. REGIÓN DE LOS RÍOS
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Selva valdiviana nocturna, Hongos neón, paso de río Calle-Calle y el Torreón (Nv.11).
                </p>
              </div>

              <div className="p-3.5 bg-zinc-900 border border-zinc-700 rounded-xl font-mono text-xs space-y-1">
                <div className="text-zinc-100 font-bold font-pixel text-[11px]">
                  5. REGIÓN DE LOS LAGOS
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Mercader Doña Fresia, Pingüinos Australes y el duelo doble contra Cai Cai Vilu (Nv.13) y Vilu Vilu (Nv.14).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'combat' && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-2xl space-y-3">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-950 flex items-center justify-center shrink-0">
                  <Swords className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-pixel text-xs text-zinc-100">
                    SISTEMA DE COMBATE &amp; AFINIDADES
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Combate por turnos con multiplicadores dinámicos (hasta x4.0) y pasiva del protagonista.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-700">
                  <span className="text-zinc-100 font-bold block">🔥 FUEGO:</span>
                  <span className="text-zinc-400">Fuerte vs Planta, Tierra, Hielo. Débil ante Agua.</span>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-700">
                  <span className="text-zinc-100 font-bold block">💧 AGUA:</span>
                  <span className="text-zinc-400">Fuerte vs Fuego y Tierra. Débil ante Planta.</span>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-700">
                  <span className="text-zinc-100 font-bold block">🌿 PLANTA:</span>
                  <span className="text-zinc-400">Fuerte vs Agua y Tierra. Débil ante Fuego/Viento.</span>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-700">
                  <span className="text-zinc-100 font-bold block">🌪️ VIENTO:</span>
                  <span className="text-zinc-400">Fuerte vs Planta y Agua. Veloz e impredecible.</span>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-700">
                  <span className="text-zinc-100 font-bold block">⛰️ TIERRA:</span>
                  <span className="text-zinc-400">Fuerte vs Viento y Hielo. Gran resistencia física.</span>
                </div>
                <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-700">
                  <span className="text-zinc-100 font-bold block">❄️ HIELO:</span>
                  <span className="text-zinc-400">Fuerte vs Viento y Planta. Débil ante Fuego.</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-600 rounded-xl font-mono text-xs space-y-1">
                <span className="text-zinc-100 font-bold flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5" /> ¿CÓMO VINCULAR (CAPTURAR) ESPÍRITUS?
                </span>
                <p className="text-zinc-300 text-[11px]">
                  Reduce sus PS y pulsa <strong className="text-white">VINCULAR</strong> para lanzar un Amuleto de Vínculo Pewén. Tu criatura activa gana experiencia tanto al vencer como al vincular.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evolution' && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-2xl font-mono text-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
                <PixelPreviewCanvas kind="companion" />
                <div>
                  <h3 className="font-pixel text-xs text-zinc-100 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-zinc-200" />
                    EVOLUCIÓN EN EL SANTUARIO (MENÚ)
                  </h3>
                  <p className="text-zinc-400 text-[11px] mt-0.5">
                    Cada especie posee 3 etapas evolutivas y aprende nuevos ataques al subir de nivel.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-xl flex items-center justify-between gap-2">
                  <div>
                    <span className="text-zinc-100 font-bold block">Etapa 1 ➔ Etapa 2 (Nivel 10):</span>
                    <span className="text-zinc-400 text-[11px]">Requiere Nivel 10 + catalizador elemental (Resina de Pewén, Corazón de Basalto, etc.).</span>
                  </div>
                  <span className="text-zinc-100 text-[11px] font-bold shrink-0">+Stats</span>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-700 rounded-xl flex items-center justify-between gap-2">
                  <div>
                    <span className="text-zinc-100 font-bold block">Etapa 2 ➔ Etapa 3 Titán (Nivel 22):</span>
                    <span className="text-zinc-400 text-[11px]">Desbloquea la forma ancestral definitiva de la criatura.</span>
                  </div>
                  <span className="text-zinc-100 text-[11px] font-bold shrink-0">Forma Máxima</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="p-4 sm:p-5 bg-zinc-900 border border-zinc-700 rounded-2xl font-mono text-xs space-y-4">
            <h3 className="font-pixel text-xs text-zinc-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-zinc-200" />
              <span>CONTROLES OPTIMIZADOS PARA MÓVIL</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-700 flex items-start gap-2.5">
                <Footprints className="w-4 h-4 text-zinc-200 shrink-0 mt-0.5" />
                <div>
                  <span className="text-zinc-100 font-bold block mb-1">Cruceta Táctil (D-Pad):</span>
                  <span className="text-zinc-400">Mantén presionadas las flechas inferiores izquierdas para caminar. Tu criatura activa caminará detrás de ti.</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-700 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-zinc-200 shrink-0 mt-0.5" />
                <div>
                  <span className="text-zinc-100 font-bold block mb-1">Botón ACCIÓN:</span>
                  <span className="text-zinc-400">Toca el botón circular claro <strong>ACCIÓN</strong> para conversar con NPCs, abrir cofres, entrar a tiendas o enfrentar Guardianes.</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-700 flex items-start gap-2.5">
                <Compass className="w-4 h-4 text-zinc-200 shrink-0 mt-0.5" />
                <div>
                  <span className="text-zinc-100 font-bold block mb-1">Menú, Misiones &amp; 3 Ranuras:</span>
                  <span className="text-zinc-400">Abre <strong>Menú</strong> para consultar tus misiones detalladas, Evolución, Bestiario y guardar en 3 ranuras.</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-700 flex items-start gap-2.5">
                <Store className="w-4 h-4 text-zinc-200 shrink-0 mt-0.5" />
                <div>
                  <span className="text-zinc-100 font-bold block mb-1">Tiendas Físicas &amp; Hogar:</span>
                  <span className="text-zinc-400">Descansa gratis en tu Casa (Escenario 0) o compra provisiones en Stages 1, 3 y 5.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-4xl w-full mx-auto pt-3 border-t border-zinc-800 text-center text-[11px] font-mono text-zinc-500">
        Guía ilustrada · Caminos: 5% aparición · Fuera de camino: 40% aparición.
      </div>
    </div>
  );
};
