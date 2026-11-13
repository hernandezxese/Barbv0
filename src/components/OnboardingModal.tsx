/**
 * Post-Starter Onboarding Modal
 * Displays Main & Secondary Objectives with live pixel art visuals
 * and interactive practical mini-demonstrations for "Cómo Jugar".
 */

import React, { useState, useEffect, useRef } from 'react';
import { Award, BookMarked, Compass, Flame, Footprints, Hand, HeartPulse, Mountain, Sparkles, Target } from 'lucide-react';
import { sound } from '../services/audioService';
import { HeroGender } from '../types/game';
import { drawBarbaraSprite, drawCreatureSprite, drawEntitySprite } from '../utils/pixelRenderer';

interface OnboardingModalProps {
  heroName: string;
  starterName: string;
  heroGender?: HeroGender;
  starterId?: string;
  totalBaseSpecies: number;
  totalEvolutionForms: number;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  heroName,
  starterName,
  heroGender = 'female',
  starterId = 'brotin',
  totalBaseSpecies,
  totalEvolutionForms,
  onComplete,
}) => {
  const [step, setStep] = useState<0 | 1>(0);
  const [demoMode, setDemoMode] = useState<'walk' | 'landmark' | 'skill'>('walk');

  // Interactive mini-demo states
  const [walkTarget, setWalkTarget] = useState<{ x: number; y: number }>({ x: 5, y: 1 });
  const walkPosRef = useRef<{ x: number; y: number }>({ x: 1, y: 1 });
  const [landmarkRevealed, setLandmarkRevealed] = useState(false);
  const [skillBurstTick, setSkillBurstTick] = useState<number>(0);

  const objCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const evoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const demoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Objectives animated pixel-art banner canvas
  useEffect(() => {
    if (step !== 0) return;
    let rafId: number;
    const renderObj = (t: number) => {
      if (objCanvasRef.current) {
        const ctx = objCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, 260, 56);
          // Mini Chilean trail background
          ctx.fillStyle = '#09090b';
          ctx.fillRect(0, 0, 260, 56);
          ctx.fillStyle = '#0c4a6e';
          ctx.fillRect(0, 0, 22, 56);
          ctx.fillStyle = '#15803d';
          ctx.fillRect(22, 0, 212, 56);
          ctx.fillStyle = '#57534e';
          ctx.fillRect(22, 34, 212, 14);
          ctx.fillStyle = '#475569';
          ctx.fillRect(234, 0, 26, 56);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(238, 4, 18, 12);

          // Hero + Starter Criatura Espiritual + Volcano Landmark
          drawBarbaraSprite(ctx, 42, 16, 28, 'right', t * 0.005, true, heroGender);
          drawCreatureSprite(ctx, starterId, 1, 82, 18, 28, t * 0.006, false);
          drawEntitySprite(ctx, 'decorative', 'deco_volcan', 142, 10, 32, false, Math.floor(t * 0.008), true);
          drawEntitySprite(ctx, 'chest', 'item_hp', 194, 16, 24, false, Math.floor(t * 0.008), true);
        }
      }
      if (evoCanvasRef.current) {
        const ctx = evoCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, 128, 36);
          drawCreatureSprite(ctx, starterId, 1, 6, 4, 28, t * 0.004, false);
          ctx.fillStyle = '#a1a1aa';
          ctx.font = 'bold 12px monospace';
          ctx.fillText('→', 46, 23);
          drawCreatureSprite(ctx, starterId, 2, 74, 2, 32, t * 0.005, false);
        }
      }
      rafId = requestAnimationFrame(renderObj);
    };
    rafId = requestAnimationFrame(renderObj);
    return () => cancelAnimationFrame(rafId);
  }, [step, heroGender, starterId]);

  // Interactive Practical Demo canvas inside "Cómo Jugar"
  useEffect(() => {
    if (step !== 1) return;
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
                ctx.fillStyle = '#09090b';
                ctx.fillRect(px, py, tw, th);
                ctx.fillStyle = '#27272a';
                ctx.fillRect(px + 6, py + 6, tw - 12, th - 12);
              } else {
                ctx.fillStyle = isPath ? '#78716c' : (x + y) % 2 === 0 ? '#15803d' : '#166534';
                ctx.fillRect(px, py, tw, th);
              }
              ctx.strokeStyle = 'rgba(0,0,0,0.22)';
              ctx.strokeRect(px, py, tw, th);
            }
          }

          if (demoMode === 'walk') {
            // Smoothly step toward walkTarget
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

            // Destination pulse circle
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(walkTarget.x * tw + tw / 2, walkTarget.y * th + th / 2, 7 + Math.sin(t * 0.01) * 2, 0, Math.PI * 2);
            ctx.stroke();

            // Labels 0% on road vs 1-3% grass
            ctx.fillStyle = 'rgba(24,24,27,0.82)';
            ctx.fillRect(6, 4, 86, 14);
            ctx.fillStyle = '#fde047';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('Pasto: 1%-3%', 10, 14);
            ctx.fillStyle = 'rgba(24,24,27,0.82)';
            ctx.fillRect(W - 92, th + 4, 86, 14);
            ctx.fillStyle = '#e4e4e7';
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
            // Skill unlock practical demo
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
  }, [step, demoMode, walkTarget, landmarkRevealed, skillBurstTick, heroGender, starterId]);

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
    <div className="fixed inset-0 z-50 bg-zinc-950/94 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 select-none text-zinc-100 font-ui">
      <div className="max-w-lg w-full bg-zinc-900 border-2 border-zinc-400 rounded-3xl p-3.5 sm:p-5 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-2.5 max-h-[94dvh] overflow-y-auto">
        {/* Progress Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center">
              {step === 0 ? <Target className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
            </span>
            <div>
              <h2 className="font-silkscreen text-xs sm:text-sm text-zinc-100">
                {step === 0 ? 'OBJETIVOS DE LA EXPEDICIÓN' : 'CÓMO JUGAR (PRÁCTICO)'}
              </h2>
              <p className="text-[10px] font-mono text-zinc-400">
                {heroName} y {starterName} · Paso {step + 1}/2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-full ${step === 0 ? 'bg-zinc-100' : 'bg-zinc-700'}`} />
            <span className={`w-2.5 h-2.5 rounded-full ${step === 1 ? 'bg-zinc-100' : 'bg-zinc-700'}`} />
          </div>
        </div>

        {step === 0 ? (
          <div className="space-y-2.5">
            {/* Animated Visual Banner */}
            <div className="bg-zinc-950 border border-zinc-700 rounded-2xl p-2 flex flex-col items-center gap-1.5">
              <canvas
                ref={objCanvasRef}
                width={260}
                height={56}
                className="w-full max-w-[290px] h-14 rounded-xl border border-zinc-800 image-render-pixel"
              />
              <div className="flex flex-wrap items-center justify-center gap-1 text-[9px] font-mono text-zinc-300">
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700">1. R.M.</span>
                <span>→</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700">2. Biobío</span>
                <span>→</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700">3. Araucanía</span>
                <span>→</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700">4. Los Ríos</span>
                <span>→</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700">5. Los Lagos</span>
              </div>
            </div>

            {/* Main Objective */}
            <div className="p-2.5 bg-zinc-100 text-zinc-950 rounded-2xl border border-zinc-300 shadow">
              <div className="flex items-center justify-between font-silkscreen text-[10px] uppercase font-bold mb-1 text-zinc-800">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  Objetivo Principal
                </span>
                <span className="flex items-center gap-1 text-[11px]">🧿 ×5 Amuletos</span>
              </div>
              <p className="text-[11px] font-mono font-bold leading-snug">
                Recorre las 5 Regiones de Chile, inspecciona el Cerro o Volcán zonal para quitar la sombra del mapa, vincula Criaturas Espirituales salvajes y consigue los 5 Amuletos Espirituales.
              </p>
            </div>

            {/* Secondary Objectives with Visuals */}
            <div className="p-2.5 bg-zinc-950 border border-zinc-700 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-silkscreen text-[10px] uppercase text-zinc-200">
                <BookMarked className="w-3.5 h-3.5" />
                <span>Objetivos Secundarios</span>
              </div>

              <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <div className="font-silkscreen text-[10px] text-zinc-100">
                    1. Bestiario Base ({totalBaseSpecies} especies)
                  </div>
                  <p className="text-[10px] font-mono text-zinc-400 mt-0.5 leading-snug">
                    Avista y vincula a las {totalBaseSpecies} Criaturas Espirituales nativas, fósiles y míticas.
                  </p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-700 font-mono text-[10px] text-zinc-200 shrink-0">
                  0/{totalBaseSpecies}
                </span>
              </div>

              <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-silkscreen text-[10px] text-zinc-100">
                    2. Bestiario Maestro ({totalEvolutionForms} formas)
                  </div>
                  <p className="text-[10px] font-mono text-zinc-400 mt-0.5 leading-snug">
                    Evoluciona en los <strong className="text-zinc-200">Santuarios (Stages 2 y 4)</strong> todas sus etapas.
                  </p>
                </div>
                <canvas
                  ref={evoCanvasRef}
                  width={128}
                  height={36}
                  className="w-24 h-7 shrink-0 rounded bg-zinc-950 border border-zinc-800 image-render-pixel"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-[11px] font-mono">
            {/* Practical Interactive Mini-Demo Selector */}
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => {
                  sound.playSelect();
                  setDemoMode('walk');
                }}
                className={`py-1.5 px-2 rounded-xl border text-[9px] font-silkscreen flex items-center justify-center gap-1 cursor-pointer ${
                  demoMode === 'walk'
                    ? 'bg-zinc-100 text-zinc-950 border-white font-bold'
                    : 'bg-zinc-950 text-zinc-300 border-zinc-700'
                }`}
              >
                <Footprints className="w-3 h-3" />
                <span>Caminar</span>
              </button>
              <button
                onClick={() => {
                  sound.playSelect();
                  setDemoMode('landmark');
                }}
                className={`py-1.5 px-2 rounded-xl border text-[9px] font-silkscreen flex items-center justify-center gap-1 cursor-pointer ${
                  demoMode === 'landmark'
                    ? 'bg-zinc-100 text-zinc-950 border-white font-bold'
                    : 'bg-zinc-950 text-zinc-300 border-zinc-700'
                }`}
              >
                <Mountain className="w-3 h-3" />
                <span>Volcán</span>
              </button>
              <button
                onClick={() => {
                  sound.playSelect();
                  setDemoMode('skill');
                }}
                className={`py-1.5 px-2 rounded-xl border text-[9px] font-silkscreen flex items-center justify-center gap-1 cursor-pointer ${
                  demoMode === 'skill'
                    ? 'bg-zinc-100 text-zinc-950 border-white font-bold'
                    : 'bg-zinc-950 text-zinc-300 border-zinc-700'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>Barrera</span>
              </button>
            </div>

            {/* Interactive Canvas Playground */}
            <div className="bg-zinc-950 border border-zinc-700 rounded-2xl p-2 flex flex-col items-center gap-1.5">
              <canvas
                ref={demoCanvasRef}
                width={266}
                height={114}
                onPointerDown={handleDemoCanvasClick}
                className="w-full max-w-[290px] h-28 rounded-xl border border-zinc-800 image-render-pixel cursor-pointer"
              />
              <div className="text-[10px] text-zinc-200 text-center font-bold">
                {demoMode === 'walk' && '👆 ¡Toca cualquier cuadro arriba para moverte! (Caminos 0% / Pasto 1%-3%)'}
                {demoMode === 'landmark' && (
                  <button
                    onClick={() => {
                      sound.playConfirm();
                      setLandmarkRevealed(r => !r);
                    }}
                    className="px-2.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-950 font-silkscreen text-[9px] cursor-pointer"
                  >
                    {landmarkRevealed ? '↻ Reiniciar Sombra' : '✨ Toca para Inspeccionar Volcán y Quitar Sombra'}
                  </button>
                )}
                {demoMode === 'skill' && (
                  <button
                    onClick={() => {
                      sound.playFireSpell();
                      setSkillBurstTick(performance.now());
                    }}
                    className="px-2.5 py-0.5 rounded-lg bg-zinc-100 text-zinc-950 font-silkscreen text-[9px] cursor-pointer"
                  >
                    ⚡ Toca aquí para probar Técnica del Líder Activo
                  </button>
                )}
              </div>
            </div>

            {/* Concise Practical Key Takeaways */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
              <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start gap-2">
                <Hand className="w-3.5 h-3.5 text-zinc-100 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-100 block">Tocar o Botón ACCIÓN</strong>
                  <span className="text-zinc-400">Habla, inspecciona cumbres o recoge orbes de Vida/Maná tocándolos directo.</span>
                </div>
              </div>
              <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-zinc-100 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-100 block">Líder Activo &amp; Santuario</strong>
                  <span className="text-zinc-400">Asigna tu Líder Activo en Equipo según el elemento de cada barrera.</span>
                </div>
              </div>
              <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start gap-2 sm:col-span-2">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-zinc-100">Servicios: </strong>
                  <span className="text-zinc-300">Tiendas en Stages 1, 3 y 5 · Hospitales y Santuarios de Evolución en Stages 2 y 4.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="flex gap-2 pt-1">
          {step === 1 && (
            <button
              onClick={() => {
                sound.playSelect();
                setStep(0);
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-xl font-silkscreen text-[11px] text-zinc-200 cursor-pointer"
            >
              &larr; Atrás
            </button>
          )}
          <button
            onClick={() => {
              sound.playConfirm();
              if (step === 0) setStep(1);
              else onComplete();
            }}
            className="flex-1 py-2.5 bg-zinc-100 hover:bg-white border border-zinc-300 text-zinc-950 rounded-xl font-silkscreen text-xs font-bold cursor-pointer active:scale-95 transition-all"
          >
            {step === 0 ? 'VER CÓMO JUGAR →' : '¡COMENZAR AVENTURA!'}
          </button>
        </div>
      </div>
    </div>
  );
};
