/**
 * Protagonist Profile & Regional Guardian Medals Modal
 * Displays explorer sprite, progress stats, Bestiary count, and the 5 Chilean Boss Guardian Medals.
 */

import React, { useEffect, useRef } from 'react';
import { BarbaraHero, MAIN_REGION_IDS, MedalRecord, REGION_MEDALS, RegionId, SpiritCreature } from '../types/game';
import { SPIRITS_REGISTRY } from '../data/spiritsData';
import { drawBarbaraSprite } from '../utils/pixelRenderer';
import { sound } from '../services/audioService';
import { Award, Calendar, CheckCircle2, ChevronLeft, Compass, History, Lock, Shield, Sparkles, Swords } from 'lucide-react';

interface ProfileModalProps {
  barbara: BarbaraHero;
  partySpirits: SpiritCreature[];
  unlockedRegions: RegionId[];
  onClose: () => void;
}

const ROLE_BY_GENDER: Record<BarbaraHero['gender'], { label: string; tag: string }> = {
  female: { label: 'Exploradora Elemental', tag: '♀ FEMENINO' },
  male: { label: 'Explorador Elemental', tag: '♂ MASCULINO' },
  isabella: { label: 'Joven Guía del Sur', tag: '👧 ISABELLA' },
};

export const ProfileModal: React.FC<ProfileModalProps> = ({
  barbara,
  partySpirits,
  unlockedRegions,
  onClose,
}) => {
  const avatarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const medalsEarned = barbara.medals || [];
  const discoveredSpeciesCount = new Set(partySpirits.map(s => s.baseId)).size;
  const allRegistry = Object.values(SPIRITS_REGISTRY);
  const totalSpecies = allRegistry.length;
  const totalEvolutionForms = allRegistry.reduce((acc, e) => acc + e.evolutionLine.length, 0);
  const registeredEvoSet = new Set(barbara.registeredEvolutionKeys || []);
  partySpirits.forEach(s => {
    for (let st = 1; st <= (s.currentStage || 1); st++) {
      registeredEvoSet.add(`${s.baseId}:${st}`);
    }
  });
  const roleInfo = ROLE_BY_GENDER[barbara.gender || 'female'];
  const unlockedMainCount = unlockedRegions.filter(r => MAIN_REGION_IDS.includes(r)).length;

  // Build sorted achievement chronology from barbara.medalRecords (with safe legacy fallback)
  const timelineRecords: MedalRecord[] = (() => {
    const existing = barbara.medalRecords || [];
    if (existing.length > 0) {
      return [...existing].sort((a, b) => a.order - b.order);
    }
    return medalsEarned.map((medalId, index) => {
      const meta = REGION_MEDALS.find(m => m.id === medalId);
      return {
        medalId,
        bossName: meta?.bossName || 'Guardián Regional',
        regionLabel: meta?.regionLabel || 'R. de Chile',
        order: index + 1,
        earnedAt: new Date().toISOString(),
      };
    });
  })();

  const isBestiaryMaster = Boolean(barbara.bestiaryCompleted) || discoveredSpeciesCount >= totalSpecies;

  useEffect(() => {
    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.05;
      if (avatarCanvasRef.current) {
        const ctx = avatarCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 120, 120);
          ctx.imageSmoothingEnabled = false;
          drawBarbaraSprite(ctx, 18, 14, 84, 'down', t, false, barbara.gender || 'female');
        }
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [barbara.gender]);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-md flex flex-col justify-between p-2.5 sm:p-4 text-zinc-100 select-none overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-2.5 sm:gap-3 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-800">
          <button
            onClick={() => {
              sound.playCancel();
              onClose();
            }}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-200 cursor-pointer flex items-center gap-1 text-xs font-mono active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <div className="text-center">
            <h2 className="font-silkscreen text-xs sm:text-sm text-zinc-100 flex items-center gap-1.5 justify-center">
              <Award className="w-4 h-4 text-zinc-100" />
              <span>PERFIL Y MEDALLAS</span>
            </h2>
          </div>

          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-950 rounded font-silkscreen text-[9px] font-bold">
            {medalsEarned.length}/5 MEDALLAS
          </span>
        </div>

        {/* Hero Summary Card */}
        <div className="bg-zinc-900 border-2 border-zinc-600 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-xl">
          <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-2xl bg-zinc-950 border-2 border-zinc-600 flex items-center justify-center shrink-0 overflow-hidden">
            <canvas
              ref={avatarCanvasRef}
              width={120}
              height={120}
              className="w-full h-full object-contain image-render-pixel"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <h3 className="font-silkscreen text-sm sm:text-base text-zinc-100 truncate">
                {barbara.name}
              </h3>
              <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-[9px] font-mono text-zinc-200">
                {roleInfo.tag}
              </span>
            </div>
            <p className="text-[11px] font-ui text-zinc-400 mb-2">{roleInfo.label}</p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 font-mono text-[10px]">
              <div className="p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-center">
                <span className="text-zinc-400 text-[9px] block">Nivel</span>
                <span className="text-zinc-100 font-bold">Nv.{barbara.level}</span>
              </div>
              <div className="p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-center">
                <span className="text-zinc-400 text-[9px] block">Oro</span>
                <span className="text-zinc-100 font-bold">{barbara.gold}</span>
              </div>
              <div className="p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-center">
                <span className="text-zinc-400 text-[9px] block">Victorias</span>
                <span className="text-zinc-100 font-bold flex items-center justify-center gap-0.5">
                  <Swords className="w-2.5 h-2.5" />
                  {barbara.battlesWon ?? 0}
                </span>
              </div>
              <div className="p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-center">
                <span className="text-zinc-400 text-[9px] block">Vínculos</span>
                <span className="text-zinc-100 font-bold flex items-center justify-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  {barbara.spiritsCaptured ?? 0}
                </span>
              </div>
              <div className="p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-center col-span-2 sm:col-span-1">
                <span className="text-zinc-400 text-[9px] block">Bestiario</span>
                <span className="text-zinc-100 font-bold">
                  {discoveredSpeciesCount}/{totalSpecies} · Ev.{registeredEvoSet.size}/{totalEvolutionForms}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bestiary Mastery Recognition Banner (when all 25 species are recorded) */}
        {isBestiaryMaster && (
          <div className="bg-zinc-100 text-zinc-950 border-2 border-amber-400 rounded-2xl p-3 flex items-center justify-between gap-3 bestiary-master-glow">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-zinc-950 text-amber-300 flex items-center justify-center shrink-0 text-lg border border-amber-400/60">
                📖
              </div>
              <div className="min-w-0">
                <div className="font-silkscreen text-[11px] font-bold text-zinc-950 truncate">
                  MAESTRO NATURALISTA DE CHILE ({totalSpecies}/{totalSpecies})
                </div>
                <p className="text-[10px] font-mono text-zinc-700 truncate">
                  Has completado el Bestiario Elemental registrando todas las especies del sur.
                </p>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-zinc-950 text-amber-300 font-silkscreen text-[9px] font-bold shrink-0">
              100%
            </span>
          </div>
        )}

        {/* Regions Progress Bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2 font-mono text-[10px]">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <Compass className="w-3.5 h-3.5 text-zinc-100 shrink-0" />
            <span>R. de Chile Desbloqueadas</span>
          </span>
          <span className="font-bold text-zinc-100">
            {unlockedMainCount} / {MAIN_REGION_IDS.length} Escenarios
          </span>
        </div>

        {/* 5 Boss Guardian Medals Showcase with CSS glow/pulse on earned medals */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-silkscreen text-[11px] text-zinc-200 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-zinc-100" />
              <span>MEDALLAS DE GUARDIANES DE CHILE</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
              Derrota a los Jefes y Maestros Vínculo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {REGION_MEDALS.map((medal, idx) => {
              const earned = medalsEarned.includes(medal.id);
              return (
                <div
                  key={medal.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${
                    earned
                      ? 'bg-zinc-100 text-zinc-950 border-zinc-200 shadow-lg medal-earned-glow'
                      : 'bg-zinc-950/90 text-zinc-400 border-zinc-800 opacity-75'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                      earned
                        ? 'bg-zinc-900 text-zinc-100 border-zinc-500 ring-2 ring-amber-400/50'
                        : 'bg-zinc-900/50 text-zinc-600 border-zinc-800 grayscale opacity-45'
                    }`}
                  >
                    {medal.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-silkscreen text-[10px] truncate ${
                          earned ? 'text-zinc-950 font-bold' : 'text-zinc-400'
                        }`}
                      >
                        {idx + 1}. {medal.name}
                      </span>
                      {earned ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-zinc-600 shrink-0" />
                      )}
                    </div>
                    <div
                      className={`text-[9px] font-mono truncate ${
                        earned ? 'text-zinc-700' : 'text-zinc-500'
                      }`}
                    >
                      {medal.regionLabel}
                    </div>
                    <div
                      className={`text-[9px] font-ui truncate ${
                        earned ? 'text-zinc-800 font-semibold' : 'text-zinc-600'
                      }`}
                    >
                      {earned ? `Purificado: ${medal.bossName}` : medal.guardianName}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cronología de Logros Section */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-silkscreen text-[11px] text-zinc-200 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-zinc-100" />
              <span>CRONOLOGÍA DE LOGROS</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {timelineRecords.length > 0 ? `${timelineRecords.length} hito(s) registrado(s)` : 'Sin logros aún'}
            </span>
          </div>

          {timelineRecords.length === 0 ? (
            <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-400 text-center">
              Derrota al Guardián Regional de cada etapa para registrar tus medallas y hazañas aquí en orden cronológico.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
              {timelineRecords.map(record => {
                const medalMeta = REGION_MEDALS.find(m => m.id === record.medalId);
                const formattedDate = (() => {
                  try {
                    return new Date(record.earnedAt).toLocaleDateString('es-CL', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                  } catch {
                    return 'Completado';
                  }
                })();

                return (
                  <div
                    key={`${record.medalId}_${record.order}`}
                    className="p-2 bg-zinc-950 border border-zinc-700/80 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-950 font-silkscreen text-[9px] font-bold shrink-0">
                        #{record.order}
                      </span>
                      <span className="text-base shrink-0">{medalMeta?.icon || '🏅'}</span>
                      <div className="min-w-0">
                        <div className="font-silkscreen text-[10px] text-zinc-100 truncate">
                          {medalMeta?.name || record.medalId} · {record.regionLabel}
                        </div>
                        <div className="font-mono text-[9px] text-zinc-400 truncate">
                          Guardián vencido: <span className="text-zinc-200 font-semibold">{record.bossName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-400 shrink-0">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
