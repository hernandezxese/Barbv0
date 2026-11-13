/**
 * Post-Prologue Persistent Adventure Guide Modal
 * Accessible anytime from the HUD (?) button or System Menu.
 * Displays live Main & Secondary Objectives, practical interactive "Cómo Jugar" demos,
 * Habilidades Visuales / Amuletos, and Combat / Evasion rules in Blanco Humo + Negro Grafito.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  BookMarked,
  CheckCircle2,
  ChevronLeft,
  Compass,
  Crosshair,
  Flame,
  Footprints,
  Hand,
  HeartPulse,
  Lock,
  Mountain,
  Shield,
  Sparkles,
  Swords,
  Target,
} from 'lucide-react';
import { sound } from '../services/audioService';
import {
  BarbaraHero,
  HERO_MEDAL_SKILLS,
  MapRegion,
  REGION_MEDALS,
  RegionId,
  SpiritCreature,
} from '../types/game';
import { ELEMENT_META, SPIRITS_REGISTRY } from '../data/spiritsData';
import { getCurrentQuest } from '../data/questData';
import { drawBarbaraSprite, drawCreatureSprite, drawEntitySprite } from '../utils/pixelRenderer';

interface AdventureGuideModalProps {
  currentRegion?: MapRegion;
  unlockedRegions?: RegionId[];
  partySpirits?: SpiritCreature[];
  barbara?: BarbaraHero;
  seenSpeciesCount?: number;
  evoCount?: number;
  onClose: () => void;
}

export const AdventureGuideModal: React.FC<AdventureGuideModalProps> = ({
  currentRegion,
  unlockedRegions = ['casa', 'santiago'],
  partySpirits = [],
  barbara,
  seenSpeciesCount,
  evoCount,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'objetivos' | 'howto' | 'skills' | 'combat'>('objetivos');
  const [demoMode, setDemoMode] = useState<'walk' | 'landmark' | 'skill'>('walk');
  const [walkTarget, setWalkTarget] = useState<{ x: number; y: number }>({ x: 5, y: 1 });
  const walkPosRef = useRef<{ x: number; y: number }>({ x: 1, y: 1 });
  const [landmarkRevealed, setLandmarkRevealed] = useState(false);
  const [skillBurstTick, setSkillBurstTick] = useState<number>(0);

  const demoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroGender = barbara?.gender || 'female';
  const starterId = partySpirits[0]?.baseId || 'brotin';
  const medals = barbara?.medals || [];
  const allRegistry = Object.values(SPIRITS_REGISTRY);
  const totalBaseSpecies = allRegistry.length;
  const totalEvolutionForms = allRegistry.reduce((acc, s) => acc + s.evolutionLine.length, 0);
  const capturedSpeciesCount = new Set(partySpirits.map(s => s.baseId)).size;
  const displaySeenCount = Math.max(seenSpeciesCount ?? 0, capturedSpeciesCount);
  const registeredEvoSet = new Set(barbara?.registeredEvolutionKeys || []);
  partySpirits.forEach(s => {
    for (let st = 1; st <= (s.currentStage || 1); st++) {
      registeredEvoSet.add(`${s.baseId}:${st}`);
    }
  });
  const displayEvoCount = Math.max(evoCount ?? 0, registeredEvoSet.size);
  const currentQuest = currentRegion
    ? getCurrentQuest(currentRegion, unlockedRegions, partySpirits, medals)
    : null;

  // Interactive Practical Demo canvas inside "Cómo Jugar"
  useEffect(() => {
    if (activeTab !== 'howto') return;
    let rafId: number;
    let last = performance.now();

    const renderDemo = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;

      const canvas = demoCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          const W = canvas.width;
          const H = canvas.height;
          const cols = 7;
          const rows = 3;
          const tw = Math.floor(W / cols);
          const th = Math.floor(H / rows);
          ctx.clearRect(0, 0, W, H);

          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              const px = x * tw;
              const py = y * th;
              const isPath = y === 1 || (demoMode === 'landmark' && x === 3 && y === 2);
              const isFog = demoMode === 'landmark' && !landmarkRevealed && x >= 4;

              if (isFog) {
                ctx.fillStyle = '#18181b';
                ctx.fillRect(px, py, tw, th);
                ctx.fillStyle = '#3f3f46';
                ctx.fillRect(px + 6, py + 6, tw - 12, th - 12);
              } else {
                ctx.fillStyle = isPath ? '#78716c' : (x + y) % 2 === 0 ? '#15803d' : '#166534';
                ctx.fillRect(px, py, tw, th);
              }
              ctx.strokeStyle = 'rgba(0,0,0,0.2)';
              ctx.strokeRect(px, py, tw, th);
            }
          }

          if (demoMode === 'walk') {
            const cur = walkPosRef.current;
            const dx = walkTarget.x - cur.x;
            const dy = walkTarget.y - cur.y;
            const dist = Math.hypot(dx, dy);
            const moving = dist > 0.04;
            if (moving) {
              const spd = Math.min(dist, dt * 3.2);
              cur.x += (dx / dist) * spd;
              cur.y += (dy / dist) * spd;
            }
            const dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'down' : 'up';

            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(walkTarget.x * tw + tw / 2, walkTarget.y * th + th / 2, 7 + Math.sin(t * 0.01) * 2, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(24,24,27,0.88)';
            ctx.fillRect(6, 4, 96, 14);
            ctx.fillStyle = '#86efac';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('Pasto: 6%-16%', 10, 14);
            ctx.fillStyle = 'rgba(24,24,27,0.88)';
            ctx.fillRect(W - 92, th + 4, 86, 14);
            ctx.fillStyle = '#f4f4f2';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('Camino: 0%', W - 86, th + 14);

            drawCreatureSprite(ctx, starterId, 1, Math.max(0, cur.x - 0.8) * tw + 4, cur.y * th + 4, tw - 8, t * 0.005, false);
            drawBarbaraSprite(ctx, cur.x * tw + 2, cur.y * th + 2, tw - 4, dir, t * 0.008, moving, heroGender);
          } else if (demoMode === 'landmark') {
            drawBarbaraSprite(ctx, 2 * tw + 2, 1 * th + 2, tw - 4, 'right', t * 0.004, false, heroGender);
            drawEntitySprite(ctx, 'decorative', 'deco_volcan', 3 * tw + 2, 1 * th + 2, tw - 4, false, Math.floor(t * 0.008), true);
            if (landmarkRevealed) {
              drawEntitySprite(ctx, 'chest', 'item_hp', 5 * tw + 4, 0 * th + 4, tw - 8, false, Math.floor(t * 0.008), true);
              drawEntitySprite(ctx, 'chest', 'item_mana', 5 * tw + 4, 2 * th + 4, tw - 8, false, Math.floor(t * 0.008), true);
            }
          } else {
            drawBarbaraSprite(ctx, 1 * tw + 2, 1 * th + 2, tw - 4, 'right', t * 0.004, false, heroGender);
            const sx = 2 * tw + tw / 2;
            const sy = 1 * th + th / 2;
            const tx = 4 * tw + tw / 2;
            const ty = 1 * th + th / 2;
            drawCreatureSprite(ctx, starterId, 1, 2 * tw + 2, 1 * th + 2, tw - 4, t * 0.007, false);

            const elapsed = t - skillBurstTick;
            const activeAnim = skillBurstTick > 0 && elapsed < 1200;
            if (!activeAnim) {
              drawEntitySprite(ctx, 'obstacle', 'obstacle_vines', 4 * tw + 2, 1 * th + 2, tw - 4, false, Math.floor(t * 0.008), true);
            } else {
              const p = elapsed / 1200;
              ctx.strokeStyle = '#f97316';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(sx + (tx - sx) * Math.min(1, p * 1.4), sy);
              ctx.stroke();
              for (let i = 0; i < 6; i++) {
                const ang = (i / 6) * Math.PI * 2 + p * 6;
                ctx.fillStyle = i % 2 === 0 ? '#facc15' : '#ea580c';
                ctx.fillRect(tx + Math.cos(ang) * p * 18, ty + Math.sin(ang) * p * 18, 4, 4);
              }
            }
          }
        }
      }
      rafId = requestAnimationFrame(renderDemo);
    };

    rafId = requestAnimationFrame(renderDemo);
    return () => cancelAnimationFrame(rafId);
  }, [activeTab, demoMode, walkTarget, landmarkRevealed, skillBurstTick, heroGender, starterId]);

  const handleDemoCanvasClick = (e: React.PointerEvent<HTMLCanvasElement>) => {
    sound.playSelect();
    if (demoMode === 'walk') {
      const canvas = demoCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const col = Math.max(0, Math.min(6, Math.floor(((e.clientX - rect.left) / rect.width) * 7)));
      const row = Math.max(0, Math.min(2, Math.floor(((e.clientY - rect.top) / rect.height) * 3)));
      setWalkTarget({ x: col, y: row });
    } else if (demoMode === 'landmark') {
      setLandmarkRevealed(r => !r);
    } else {
      sound.playFireSpell();
      setSkillBurstTick(performance.now());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#E7E7E2]/98 backdrop-blur-md flex flex-col justify-between overflow-y-auto select-none p-2.5 sm:p-4 text-[#1E2022]">
      {/* Header */}
      <div className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-2.5 border-b border-stone-300">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="min-h-[40px] px-3 py-1.5 bg-[#F4F4F2] hover:bg-white border border-stone-300 rounded-xl text-[#1E2022] cursor-pointer flex items-center gap-1 text-xs font-mono font-bold active:scale-95 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <div>
            <h2 className="font-silkscreen text-xs sm:text-sm text-[#1E2022] flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>GUÍA Y OBJETIVOS</span>
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 bg-[#F4F4F2] border border-stone-300 p-1 rounded-xl text-[10px] font-mono">
          <button
            onClick={() => { sound.playSelect(); setActiveTab('objetivos'); }}
            className={`min-h-[36px] px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              activeTab === 'objetivos' ? 'bg-[#1E2022] text-[#F4F4F2]' : 'text-stone-600 hover:text-[#1E2022]'
            }`}
          >
            Objetivos
          </button>
          <button
            onClick={() => { sound.playSelect(); setActiveTab('howto'); }}
            className={`min-h-[36px] px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              activeTab === 'howto' ? 'bg-[#1E2022] text-[#F4F4F2]' : 'text-stone-600 hover:text-[#1E2022]'
            }`}
          >
            Cómo Jugar
          </button>
          <button
            onClick={() => { sound.playSelect(); setActiveTab('skills'); }}
            className={`min-h-[36px] px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              activeTab === 'skills' ? 'bg-[#1E2022] text-[#F4F4F2]' : 'text-stone-600 hover:text-[#1E2022]'
            }`}
          >
            Habilidades
          </button>
          <button
            onClick={() => { sound.playSelect(); setActiveTab('combat'); }}
            className={`min-h-[36px] px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              activeTab === 'combat' ? 'bg-[#1E2022] text-[#F4F4F2]' : 'text-stone-600 hover:text-[#1E2022]'
            }`}
          >
            Combate
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl w-full mx-auto my-3 flex-1">
        {activeTab === 'objetivos' && (
          <div className="space-y-3">
            {/* Active Regional Mission */}
            {currentQuest && (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-400 rounded-2xl shadow-sm space-y-1">
                <div className="flex items-center justify-between gap-2 text-[10px] font-silkscreen">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1E2022] text-amber-300 font-bold">
                    <Target className="w-3.5 h-3.5" />
                    <span>MISIÓN ACTUAL · {currentRegion?.name}</span>
                  </span>
                  {currentQuest.totalSteps > 0 && (
                    <span className="font-mono font-bold text-amber-900 tabular-nums">
                      Paso {currentQuest.stepNumber}/{currentQuest.totalSteps}
                    </span>
                  )}
                </div>
                <div className="font-silkscreen text-xs text-[#1E2022] font-bold">{currentQuest.title}</div>
                <p className="text-[11px] font-mono text-stone-700 leading-snug">{currentQuest.instruction}</p>
              </div>
            )}

            {/* Main Objective */}
            <div className="p-3.5 bg-[#F4F4F2] border border-stone-300 rounded-2xl shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-silkscreen text-xs text-[#1E2022] flex items-center gap-1.5 font-bold">
                  <Award className="w-4 h-4 text-emerald-700" />
                  <span>OBJETIVO PRINCIPAL: 5 AMULETOS ESPIRITUALES</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-[#1E2022] text-[#F4F4F2] font-mono text-[10px] font-bold tabular-nums">
                  {medals.length}/5
                </span>
              </div>
              <p className="text-[11px] font-mono text-stone-700">
                Recorre las 5 Regiones de Chile, educa y limpia el sur frente a faenas industriales sin resguardo ambiental, sube a cada Cerro o Volcán (4 cuadros) y obtén los 5 Amuletos Espirituales.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5">
                {REGION_MEDALS.map(m => {
                  const earned = medals.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      className={`p-2 rounded-xl border text-[10px] font-mono flex items-center gap-1.5 ${
                        earned
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                          : 'bg-[#E7E7E2] border-stone-300 text-stone-600'
                      }`}
                    >
                      <span className="text-base">{m.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold">{m.regionLabel}</div>
                        <div className="text-[9px] truncate flex items-center gap-0.5">
                          {earned ? (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span>Obtenido</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-2.5 h-2.5 text-stone-400 shrink-0" />
                              <span>Pendiente</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Secondary Objectives */}
            <div className="p-3.5 bg-[#F4F4F2] border border-stone-300 rounded-2xl shadow-sm space-y-2">
              <div className="font-silkscreen text-xs text-[#1E2022] flex items-center gap-1.5 font-bold">
                <BookMarked className="w-4 h-4 text-[#1E2022]" />
                <span>OBJETIVOS SECUNDARIOS DE COLECCIÓN</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2.5 bg-[#E7E7E2] border border-stone-300 rounded-xl flex items-center justify-between gap-2">
                  <div>
                    <div className="font-silkscreen text-[10px] text-[#1E2022] font-bold">
                      1. Bestiario Base ({totalBaseSpecies} especies)
                    </div>
                    <p className="text-[10px] text-stone-600 mt-0.5">
                      Avistadas: <strong className="text-[#1E2022]">{displaySeenCount}/{totalBaseSpecies}</strong> · Vinculadas: <strong className="text-emerald-700">{capturedSpeciesCount}/{totalBaseSpecies}</strong>
                    </p>
                  </div>
                </div>
                <div className="p-2.5 bg-[#E7E7E2] border border-stone-300 rounded-xl flex items-center justify-between gap-2">
                  <div>
                    <div className="font-silkscreen text-[10px] text-[#1E2022] font-bold">
                      2. Bestiario Maestro ({totalEvolutionForms} formas)
                    </div>
                    <p className="text-[10px] text-stone-600 mt-0.5">
                      Evoluciona en los <strong>Santuarios (Stages 2 y 4)</strong> · Progreso: <strong className="text-emerald-700">{displayEvoCount}/{totalEvolutionForms}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'howto' && (
          <div className="space-y-3 font-mono text-[11px]">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => { sound.playSelect(); setDemoMode('walk'); }}
                className={`min-h-[40px] py-2 px-2 rounded-xl border text-[10px] font-silkscreen flex items-center justify-center gap-1.5 cursor-pointer ${
                  demoMode === 'walk'
                    ? 'bg-[#1E2022] text-[#F4F4F2] border-[#1E2022] font-bold'
                    : 'bg-[#F4F4F2] text-stone-700 border-stone-300'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Caminar</span>
              </button>
              <button
                onClick={() => { sound.playSelect(); setDemoMode('landmark'); }}
                className={`min-h-[40px] py-2 px-2 rounded-xl border text-[10px] font-silkscreen flex items-center justify-center gap-1.5 cursor-pointer ${
                  demoMode === 'landmark'
                    ? 'bg-[#1E2022] text-[#F4F4F2] border-[#1E2022] font-bold'
                    : 'bg-[#F4F4F2] text-stone-700 border-stone-300'
                }`}
              >
                <Mountain className="w-3.5 h-3.5" />
                <span>Volcán</span>
              </button>
              <button
                onClick={() => { sound.playSelect(); setDemoMode('skill'); }}
                className={`min-h-[40px] py-2 px-2 rounded-xl border text-[10px] font-silkscreen flex items-center justify-center gap-1.5 cursor-pointer ${
                  demoMode === 'skill'
                    ? 'bg-[#1E2022] text-[#F4F4F2] border-[#1E2022] font-bold'
                    : 'bg-[#F4F4F2] text-stone-700 border-stone-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Barrera</span>
              </button>
            </div>

            <div className="bg-[#F4F4F2] border border-stone-300 rounded-2xl p-3 flex flex-col items-center gap-2 shadow-sm">
              <canvas
                ref={demoCanvasRef}
                width={266}
                height={114}
                onPointerDown={handleDemoCanvasClick}
                className="w-full max-w-[340px] h-32 rounded-xl border border-stone-400 image-render-pixel cursor-pointer bg-zinc-900"
              />
              <div className="text-[11px] text-[#1E2022] text-center font-bold">
                {demoMode === 'walk' && '👆 Toca cualquier cuadro para caminar · Caminos/Vías: 0% · Pasto: 6%-16% según región'}
                {demoMode === 'landmark' && (
                  <button
                    onClick={() => { sound.playConfirm(); setLandmarkRevealed(r => !r); }}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#1E2022] text-[#F4F4F2] font-silkscreen text-[10px] cursor-pointer"
                  >
                    {landmarkRevealed ? '↻ Reiniciar Sombra' : '✨ Toca para Inspeccionar Cumbre (4 cuadros) y Quitar Sombra'}
                  </button>
                )}
                {demoMode === 'skill' && (
                  <button
                    onClick={() => { sound.playFireSpell(); setSkillBurstTick(performance.now()); }}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#1E2022] text-[#F4F4F2] font-silkscreen text-[10px] cursor-pointer"
                  >
                    ⚡ Toca para probar Técnica Visual del Compañero / Elegido
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              <div className="p-3 bg-[#F4F4F2] border border-stone-300 rounded-xl flex items-start gap-2">
                <Hand className="w-4 h-4 text-[#1E2022] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#1E2022] block font-silkscreen text-[10px]">Tocar para Interactuar</strong>
                  <span className="text-stone-600">Toca directo personajes, cofres, portales o cumbres de 4 cuadros; caminarás hasta ellos y actuarás automáticamente.</span>
                </div>
              </div>
              <div className="p-3 bg-[#F4F4F2] border border-stone-300 rounded-xl flex items-start gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#1E2022] block font-silkscreen text-[10px]">Edificios y Cumbres</strong>
                  <span className="text-stone-600">Tiendas en Stages 1, 3 y 5 · Hospitales y Santuarios en Stages 2 y 4. Al inspeccionar una cumbre aparece una criatura rara de la zona.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-3 font-mono text-[11px]">
            <div className="p-3.5 bg-[#F4F4F2] border border-stone-300 rounded-2xl shadow-sm space-y-2">
              <div className="font-silkscreen text-xs text-[#1E2022] flex items-center gap-1.5 font-bold">
                <Shield className="w-4 h-4 text-emerald-700" />
                <span>HABILIDADES DEL ELEGIDO POR AMULETO</span>
              </div>
              <p className="text-[10px] text-stone-700">
                Al purificar al Guardián de cada región, tu protagonista aprende su habilidad elemental permanente para despejar obstáculos sin depender de cambiar Compañero:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {HERO_MEDAL_SKILLS.map(sk => {
                  const unlocked = medals.includes(sk.medalId);
                  return (
                    <div
                      key={sk.medalId}
                      className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 ${
                        unlocked
                          ? 'bg-emerald-50 border-emerald-500 text-[#1E2022]'
                          : 'bg-[#E7E7E2] border-stone-300 text-stone-600'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-silkscreen text-[10px] font-bold flex items-center gap-1.5">
                          <span>{sk.skillName}</span>
                          {unlocked ? (
                            <span className="text-emerald-700 text-[9px]">(Desbloqueada)</span>
                          ) : (
                            <span className="text-stone-500 text-[9px]">(Bloqueada)</span>
                          )}
                        </div>
                        <p className="text-[10px] mt-0.5">{sk.description}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {sk.elements.map(el => (
                          <span key={el} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${ELEMENT_META[el].badgeClass}`}>
                            {ELEMENT_META[el].icon} {ELEMENT_META[el].label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 bg-[#F4F4F2] border border-stone-300 rounded-2xl shadow-sm space-y-2">
              <div className="font-silkscreen text-xs text-[#1E2022] flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-[#1E2022]" />
                <span>8 ELEMENTOS Y ANIMACIONES DE BARRERAS</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(ELEMENT_META).map(([k, meta]) => (
                  <span key={k} className={`px-2 py-1 rounded-lg text-[10px] font-silkscreen font-bold ${meta.badgeClass}`}>
                    {meta.icon} {meta.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'combat' && (
          <div className="space-y-3 font-mono text-[11px]">
            <div className="p-3.5 bg-[#F4F4F2] border border-stone-300 rounded-2xl shadow-sm space-y-2.5">
              <div className="flex items-center gap-2 border-b border-stone-300 pb-2">
                <Swords className="w-4 h-4 text-[#1E2022] shrink-0" />
                <h3 className="font-silkscreen text-xs text-[#1E2022] font-bold">SISTEMA DE COMBATE Y EVASIÓN</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                <div className="p-2.5 bg-[#E7E7E2] rounded-xl border border-stone-300">
                  <span className="text-[#1E2022] font-silkscreen font-bold block mb-0.5">⚡ Evasión Interactiva (Minijuego)</span>
                  <span className="text-stone-700">
                    Cuando el enemigo contraataca, pulsa <strong className="text-emerald-700">¡ESQUIVAR! / Espacio</strong> en la zona verde para recibir <strong className="text-emerald-700">0% daño</strong>, zona ámbar para <strong className="text-[#1E2022]">50% daño</strong>, o zona roja para <strong className="text-red-700">100% daño</strong>.
                  </span>
                </div>
                <div className="p-2.5 bg-[#E7E7E2] rounded-xl border border-stone-300">
                  <span className="text-[#1E2022] font-silkscreen font-bold block mb-0.5">🌟 Invocación Primigenia y Bonos</span>
                  <span className="text-stone-700">
                    Al cargar 100% de Límite invocas a <strong>Eón</strong>. Capturar una especie ya vinculada da <strong className="text-emerald-700">+200% EXP</strong> a tu ejemplar original.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
                <div className="p-2 bg-[#E7E7E2] rounded-lg border border-stone-300">
                  <span className="text-[#1E2022] font-bold block">🔥 Fuego</span>
                  <span className="text-stone-600">Fuerte vs Planta/Tierra/Hielo. Débil vs Agua.</span>
                </div>
                <div className="p-2 bg-[#E7E7E2] rounded-lg border border-stone-300">
                  <span className="text-[#1E2022] font-bold block">💧 Agua</span>
                  <span className="text-stone-600">Fuerte vs Fuego/Tierra. Débil vs Planta.</span>
                </div>
                <div className="p-2 bg-[#E7E7E2] rounded-lg border border-stone-300">
                  <span className="text-[#1E2022] font-bold block">🌿 Planta</span>
                  <span className="text-stone-600">Fuerte vs Agua/Tierra. Débil vs Fuego/Viento.</span>
                </div>
                <div className="p-2 bg-[#E7E7E2] rounded-lg border border-stone-300">
                  <span className="text-[#1E2022] font-bold block">🌪️ Viento</span>
                  <span className="text-stone-600">Fuerte vs Planta/Agua.</span>
                </div>
                <div className="p-2 bg-[#E7E7E2] rounded-lg border border-stone-300">
                  <span className="text-[#1E2022] font-bold block">⛰️ Tierra</span>
                  <span className="text-stone-600">Fuerte vs Viento/Hielo.</span>
                </div>
                <div className="p-2 bg-[#E7E7E2] rounded-lg border border-stone-300">
                  <span className="text-[#1E2022] font-bold block">❄️ Hielo</span>
                  <span className="text-stone-600">Fuerte vs Viento/Planta.</span>
                </div>
              </div>

              <div className="p-2.5 bg-[#E7E7E2] border border-stone-300 rounded-xl text-[10px]">
                <span className="text-[#1E2022] font-bold flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5" /> Santuarios de Evolución (Stages 2 y 4)
                </span>
                <p className="text-stone-700 mt-0.5">
                  Las criaturas evolucionan al alcanzar su nivel requerido y usando los Santuarios físicos en R. del Biobío y R. de Los Ríos.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-4xl w-full mx-auto pt-2 border-t border-stone-300 text-center text-[10px] font-mono text-stone-600">
        Caminos / Vías / Interiores: 0% · Pasto: 6%-12% (RM/Biobío/Araucanía) · 8%-16% (Los Ríos/Los Lagos)
      </div>
    </div>
  );
};
