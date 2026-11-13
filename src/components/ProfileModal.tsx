/**
 * Protagonist Profile & Regional Guardian Amulets Modal
 * Displays enlarged explorer sprite, play time, progress stats, Habilidades del Elegido,
 * unlocked Chilean region scenarios with images, Bestiary count, and the 5 Amuletos Espirituales.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  BarbaraHero,
  HERO_MEDAL_SKILLS,
  MAIN_REGION_IDS,
  MedalRecord,
  REGION_MEDALS,
  RegionId,
  SpiritCreature,
} from '../types/game';
import { ELEMENT_META, SPIRITS_REGISTRY } from '../data/spiritsData';
import { drawBarbaraSprite } from '../utils/pixelRenderer';
import { sound } from '../services/audioService';
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Compass,
  History,
  Lock,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react';
import imgCasa from '../assets/images/region_casa_1794608227812.jpg';
import imgSantiago from '../assets/images/region_santiago_1794608227636.jpg';
import imgBiobio from '../assets/images/region_biobio_1794608228841.jpg';
import imgAraucania from '../assets/images/region_araucania_1794608229307.jpg';
import imgLosRios from '../assets/images/region_losrios_1794608229781.jpg';
import imgLosLagos from '../assets/images/region_loslagos_1794608229906.jpg';

interface ProfileModalProps {
  barbara: BarbaraHero;
  partySpirits: SpiritCreature[];
  unlockedRegions: RegionId[];
  onClose: () => void;
}

const ROLE_BY_GENDER: Record<BarbaraHero['gender'], { label: string; tag: string }> = {
  female: { label: 'La Elegida · Defensora del Sur', tag: '♀ LA ELEGIDA' },
  male: { label: 'El Elegido · Defensor del Sur', tag: '♂ EL ELEGIDO' },
  isabella: { label: 'La Elegida · Joven Guía del Sur', tag: '👧 JOVEN GUÍA' },
};

const SCENARIO_CARDS: {
  id: RegionId;
  stageLabel: string;
  name: string;
  subtitle: string;
  image: string;
  fallbackGradient: string;
}[] = [
  {
    id: 'casa',
    stageLabel: 'Etapa 0',
    name: 'Hogar del Sur',
    subtitle: 'Casa Familiar y Punto de Partida',
    image: imgCasa,
    fallbackGradient: 'from-amber-800 to-stone-700',
  },
  {
    id: 'santiago',
    stageLabel: 'Etapa 1',
    name: 'R. Metropolitana',
    subtitle: 'Río Mapocho y Cerro San Cristóbal',
    image: imgSantiago,
    fallbackGradient: 'from-sky-700 to-stone-700',
  },
  {
    id: 'biobio',
    stageLabel: 'Etapa 2',
    name: 'R. del Biobío',
    subtitle: 'Volcán Antuco y Vía Férrea',
    image: imgBiobio,
    fallbackGradient: 'from-emerald-800 to-stone-700',
  },
  {
    id: 'araucania',
    stageLabel: 'Etapa 3',
    name: 'R. de La Araucanía',
    subtitle: 'Volcán Villarrica y Araucarias',
    image: imgAraucania,
    fallbackGradient: 'from-green-900 to-stone-800',
  },
  {
    id: 'losrios',
    stageLabel: 'Etapa 4',
    name: 'R. de Los Ríos',
    subtitle: 'Mocho-Choshuenco y Selva Valdiviana',
    image: imgLosRios,
    fallbackGradient: 'from-teal-900 to-slate-800',
  },
  {
    id: 'loslagos',
    stageLabel: 'Etapa 5',
    name: 'R. de Los Lagos',
    subtitle: 'Volcán Osorno y Chiloé Austral',
    image: imgLosLagos,
    fallbackGradient: 'from-slate-800 to-sky-900',
  },
];

function formatPlayTime(seconds = 0): string {
  const total = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hrs > 0) return `${hrs}h ${pad(mins)}m ${pad(secs)}s`;
  return `${pad(mins)}m ${pad(secs)}s`;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  barbara,
  partySpirits,
  unlockedRegions,
  onClose,
}) => {
  const avatarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failedImgs, setFailedImgs] = useState<Record<string, boolean>>({});

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
  const playTimeLabel = formatPlayTime(barbara.playTimeSeconds || 0);

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
          ctx.clearRect(0, 0, 128, 128);
          ctx.imageSmoothingEnabled = false;
          drawBarbaraSprite(ctx, 16, 12, 96, 'down', t, false, barbara.gender || 'female');
        }
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [barbara.gender]);

  return (
    <div className="fixed inset-0 z-50 bg-[#E7E7E2]/98 backdrop-blur-md flex flex-col justify-between p-2.5 sm:p-4 text-[#1E2022] select-none overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto flex flex-col gap-3 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-300">
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

          <div className="text-center">
            <h2 className="font-silkscreen text-xs sm:text-sm text-[#1E2022] flex items-center gap-1.5 justify-center">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>PERFIL DEL ELEGIDO</span>
            </h2>
          </div>

          <span className="px-2.5 py-1 bg-[#1E2022] text-[#F4F4F2] rounded-lg font-silkscreen text-[9px] font-bold tabular-nums">
            {medalsEarned.length}/5 AMULETOS
          </span>
        </div>

        {/* Hero Summary Card with Enlarged Avatar & Tiempo Jugado */}
        <div className="bg-[#F4F4F2] border-2 border-stone-300 rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-center gap-4 shadow-md">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-zinc-900 border-2 border-stone-400 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
            <canvas
              ref={avatarCanvasRef}
              width={128}
              height={128}
              className="w-full h-full object-contain image-render-pixel"
            />
          </div>

          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h3 className="font-silkscreen text-base sm:text-lg text-[#1E2022] truncate">
                {barbara.name}
              </h3>
              <span className="px-2 py-0.5 bg-[#E7E7E2] border border-stone-300 rounded text-[10px] font-mono text-stone-700 font-bold">
                {roleInfo.tag}
              </span>
            </div>
            <p className="text-xs font-ui text-stone-600 mb-3 text-center sm:text-left">{roleInfo.label}</p>

            {/* Quick Stats Grid (6 cards including Tiempo Jugado) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 font-mono text-[10px] tabular-nums">
              <div className="p-2 bg-[#E7E7E2] border border-stone-300 rounded-xl text-center">
                <span className="text-stone-500 text-[9px] block">Tiempo Jugado</span>
                <span className="text-[#1E2022] font-bold flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                  <span>{playTimeLabel}</span>
                </span>
              </div>
              <div className="p-2 bg-[#E7E7E2] border border-stone-300 rounded-xl text-center">
                <span className="text-stone-500 text-[9px] block">Nivel</span>
                <span className="text-[#1E2022] font-bold">Nv.{barbara.level}</span>
              </div>
              <div className="p-2 bg-[#E7E7E2] border border-stone-300 rounded-xl text-center">
                <span className="text-stone-500 text-[9px] block">Oro</span>
                <span className="text-[#1E2022] font-bold">${barbara.gold}</span>
              </div>
              <div className="p-2 bg-[#E7E7E2] border border-stone-300 rounded-xl text-center">
                <span className="text-stone-500 text-[9px] block">Victorias</span>
                <span className="text-[#1E2022] font-bold flex items-center justify-center gap-1">
                  <Swords className="w-3 h-3 text-[#1E2022]" />
                  {barbara.battlesWon ?? 0}
                </span>
              </div>
              <div className="p-2 bg-[#E7E7E2] border border-stone-300 rounded-xl text-center">
                <span className="text-stone-500 text-[9px] block">Vínculos</span>
                <span className="text-[#1E2022] font-bold flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  {barbara.spiritsCaptured ?? 0}
                </span>
              </div>
              <div className="p-2 bg-[#E7E7E2] border border-stone-300 rounded-xl text-center">
                <span className="text-stone-500 text-[9px] block">Bestiario</span>
                <span className="text-[#1E2022] font-bold">
                  {discoveredSpeciesCount}/{totalSpecies} · Ev.{registeredEvoSet.size}/{totalEvolutionForms}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bestiary Mastery Recognition Banner */}
        {isBestiaryMaster && (
          <div className="bg-emerald-50 text-[#1E2022] border-2 border-emerald-500 rounded-2xl p-3 flex items-center justify-between gap-3 bestiary-master-glow">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 text-lg">
                📖
              </div>
              <div className="min-w-0">
                <div className="font-silkscreen text-[11px] font-bold text-emerald-900 truncate">
                  MAESTRO NATURALISTA DE CHILE ({totalSpecies}/{totalSpecies})
                </div>
                <p className="text-[10px] font-mono text-emerald-800 truncate">
                  Has completado el Bestiario Elemental registrando todas las especies del sur.
                </p>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-emerald-700 text-white font-silkscreen text-[9px] font-bold shrink-0">
              100%
            </span>
          </div>
        )}

        {/* Escenarios Desbloqueados (Visual Regional Gallery) */}
        <div className="bg-[#F4F4F2] border border-stone-300 rounded-2xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="font-silkscreen text-[11px] text-[#1E2022] flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>ESCENARIOS DESBLOQUEADOS</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-stone-600 tabular-nums">
              {unlockedMainCount} / {MAIN_REGION_IDS.length} Escenarios
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SCENARIO_CARDS.map(sc => {
              const isUnlocked = unlockedRegions.includes(sc.id);
              const imgFailed = failedImgs[sc.id];

              return (
                <div
                  key={sc.id}
                  className={`rounded-xl border overflow-hidden transition-all flex flex-col ${
                    isUnlocked
                      ? 'bg-white border-stone-300 shadow-sm'
                      : 'bg-[#E7E7E2] border-stone-300 opacity-75'
                  }`}
                >
                  <div className={`relative aspect-video overflow-hidden bg-gradient-to-br ${sc.fallbackGradient}`}>
                    {!imgFailed ? (
                      <img
                        src={sc.image}
                        alt={`${sc.stageLabel}: ${sc.name}`}
                        referrerPolicy="no-referrer"
                        onError={() => setFailedImgs(prev => ({ ...prev, [sc.id]: true }))}
                        className={`w-full h-full object-cover ${isUnlocked ? '' : 'grayscale brightness-50'}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/90 font-silkscreen text-xs">
                        {sc.stageLabel}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />
                    <div className="absolute top-1.5 right-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-silkscreen font-bold flex items-center gap-0.5 shadow ${
                          isUnlocked ? 'bg-emerald-600 text-white' : 'bg-stone-800/90 text-stone-200'
                        }`}
                      >
                        {isUnlocked ? (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>LIBRE</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-2.5 h-2.5" />
                            <span>CERRADO</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="absolute bottom-1.5 left-2 right-2 text-white">
                      <div className="text-[9px] font-mono text-stone-200 leading-none">{sc.stageLabel}</div>
                      <div className="font-silkscreen text-[10px] font-bold truncate leading-tight">{sc.name}</div>
                    </div>
                  </div>
                  <div className="px-2 py-1.5 text-[9px] font-mono text-stone-600 truncate">
                    {sc.subtitle}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Habilidades del Elegido (Unlocked via Regional Amulets) */}
        <div className="bg-[#F4F4F2] border border-stone-300 rounded-2xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-silkscreen text-[11px] text-[#1E2022] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>HABILIDADES DEL ELEGIDO</span>
            </span>
            <span className="text-[10px] font-mono text-stone-600 hidden sm:inline">
              Otorgadas por los Amuletos Espirituales
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {HERO_MEDAL_SKILLS.map(sk => {
              const isUnlocked = medalsEarned.includes(sk.medalId);
              return (
                <div
                  key={sk.medalId}
                  className={`p-2 rounded-xl border text-[10px] font-mono flex flex-col justify-between gap-1 ${
                    isUnlocked
                      ? 'bg-white border-emerald-500 text-[#1E2022] shadow-sm'
                      : 'bg-[#E7E7E2] border-stone-300 text-stone-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-silkscreen text-[9px] font-bold truncate">{sk.skillName}</span>
                      {isUnlocked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-stone-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[9px] leading-snug">{sk.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {sk.elements.map(el => (
                      <span
                        key={el}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-silkscreen font-bold flex items-center gap-0.5 ${
                          isUnlocked ? ELEMENT_META[el].badgeClass : 'bg-stone-300 text-stone-600'
                        }`}
                      >
                        <span>{ELEMENT_META[el].icon}</span>
                        <span>{ELEMENT_META[el].label}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5 Boss Guardian Amulets Showcase with CSS glow/pulse on earned */}
        <div className="bg-[#F4F4F2] border border-stone-300 rounded-2xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-silkscreen text-[11px] text-[#1E2022] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#1E2022]" />
              <span>AMULETOS ESPIRITUALES DE GUARDIANES</span>
            </span>
            <span className="text-[10px] font-mono text-stone-600 hidden sm:inline">
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
                      ? 'bg-white text-[#1E2022] border-emerald-500 shadow-md medal-earned-glow'
                      : 'bg-[#E7E7E2] text-stone-500 border-stone-300 opacity-85'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                      earned
                        ? 'bg-emerald-50 text-[#1E2022] border-emerald-500 ring-2 ring-emerald-400/40'
                        : 'bg-stone-200 text-stone-400 border-stone-300 grayscale opacity-60'
                    }`}
                  >
                    {medal.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-silkscreen text-[10px] truncate ${
                          earned ? 'text-[#1E2022] font-bold' : 'text-stone-600'
                        }`}
                      >
                        {idx + 1}. {medal.name}
                      </span>
                      {earned ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-stone-400 shrink-0" />
                      )}
                    </div>
                    <div
                      className={`text-[9px] font-mono truncate ${
                        earned ? 'text-stone-600' : 'text-stone-500'
                      }`}
                    >
                      {medal.regionLabel}
                    </div>
                    <div
                      className={`text-[9px] font-ui truncate ${
                        earned ? 'text-emerald-700 font-semibold' : 'text-stone-500'
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
        <div className="bg-[#F4F4F2] border border-stone-300 rounded-2xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-silkscreen text-[11px] text-[#1E2022] flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#1E2022]" />
              <span>CRONOLOGÍA DE LOGROS</span>
            </span>
            <span className="text-[10px] font-mono text-stone-600 tabular-nums">
              {timelineRecords.length > 0 ? `${timelineRecords.length} hito(s) registrado(s)` : 'Sin logros aún'}
            </span>
          </div>

          {timelineRecords.length === 0 ? (
            <div className="p-3 bg-[#E7E7E2] border border-stone-300 rounded-xl text-[11px] font-mono text-stone-600 text-center">
              Derrota al Guardián Regional de cada etapa para registrar tus Amuletos Espirituales y hazañas aquí en orden cronológico.
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
                    className="p-2.5 bg-white border border-stone-300 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-[#1E2022] text-[#F4F4F2] font-silkscreen text-[9px] font-bold shrink-0 tabular-nums">
                        #{record.order}
                      </span>
                      <span className="text-base shrink-0">{medalMeta?.icon || '🧿'}</span>
                      <div className="min-w-0">
                        <div className="font-silkscreen text-[10px] text-[#1E2022] truncate font-bold">
                          {medalMeta?.name || record.medalId} · {record.regionLabel}
                        </div>
                        <div className="font-mono text-[9px] text-stone-600 truncate">
                          Guardián purificado: <span className="text-[#1E2022] font-semibold">{record.bossName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] font-mono text-stone-600 shrink-0">
                      <Calendar className="w-3 h-3 text-stone-500" />
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
