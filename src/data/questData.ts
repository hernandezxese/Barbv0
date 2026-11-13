/**
 * Quest & Objective Guide System for Crónicas Elementales del Sur (5 Chilean Regions + Interiors)
 */

import { RegionId, MapRegion, ElementType, SpiritCreature, getHeroUnlockedElements } from '../types/game';

export interface QuestStep {
  id: string;
  regionId: RegionId;
  title: string;
  description: string;
  hint: string;
  targetCoords?: { x: number; y: number };
}

export interface PendingRegionMission {
  id: string;
  title: string;
  detail: string;
  requiredElement?: ElementType;
  isBossMission?: boolean;
}

function hasElementalSpirit(
  partySpirits: SpiritCreature[] | undefined,
  reqEl: ElementType,
  medals?: string[]
): boolean {
  if (medals && getHeroUnlockedElements(medals).includes(reqEl)) return true;
  if (!partySpirits || partySpirits.length === 0) return false;
  return partySpirits.some(
    s => s.currentHp > 0 && (s.primaryElement === reqEl || s.secondaryElement === reqEl)
  );
}

export function getRegionPendingMissions(
  region: MapRegion,
  partySpirits?: SpiritCreature[],
  medals?: string[]
): PendingRegionMission[] {
  const entities = region.entities;
  const missions: PendingRegionMission[] = [];

  if (region.id === 'hospital') {
    return [
      {
        id: 'hosp_heal',
        title: 'Estación de Curación Rápida',
        detail: 'Pasa sobre el panel médico o habla con la Enfermera para sanar 100% PS y PM.',
      },
    ];
  }
  if (region.id === 'santuario') {
    return [];
  }
  if (region.id === 'tienda') {
    return [
      {
        id: 'shop_buy',
        title: 'Comerciante Regional',
        detail: 'Abastece pociones, aguas termales y Amuletos de Vínculo.',
      },
    ];
  }
  if (region.id === 'casa') {
    const mama = entities.find(e => e.id === 'npc_mama_casa');
    if (!mama?.cleared) {
      missions.push({
        id: 'casa_mama',
        title: 'Despedirse de Abuela Mary',
        detail: 'Conversa con Abuela Mary antes de salir a R. Metropolitana.',
      });
    }
    missions.push({
      id: 'casa_salir',
      title: 'Salir por la Puerta Sur',
      detail: 'Cruza la puerta inferior para iniciar tu expedición en Stage 1.',
    });
    return missions;
  }

  if (region.id === 'santiago') {
    const npc = entities.find(e => e.id === 'npc_profesor');
    const landmark = entities.find(e => e.id === 'landmark_san_cristobal_rm');
    const wildEl = entities.find(e => e.id === 'wild_santiago_quiltro');
    const obs = entities.find(e => e.id === 'obstacle_santiago_ruta');
    const boss = entities.find(e => e.id === 'boss_santiago');
    const hasTierra = hasElementalSpirit(partySpirits, 'tierra', medals) || Boolean(wildEl?.cleared);

    if (!npc?.cleared) {
      missions.push({
        id: 'rm_ignacio',
        title: 'Hablar con Don Ignacio',
        detail: 'Recibe Amuletos de Vínculo frente a tu casa al norte.',
      });
    }
    if (landmark && !landmark.cleared) {
      missions.push({
        id: landmark.id,
        title: 'Explorar Cerro San Cristóbal',
        detail: 'Visita la cumbre rodeada de cerros al noreste para disipar la sombra del mapa.',
      });
    }
    if (!hasTierra && (!obs || !obs.cleared)) {
      missions.push({
        id: 'rm_wild_tierra',
        title: 'Vincular Criatura de TIERRA',
        detail: 'Busca un Quiltro salvaje al sur del Mapocho para poder abrir el paso.',
        requiredElement: 'tierra',
      });
    }
    if (obs && !obs.cleared) {
      missions.push({
        id: obs.id,
        title: 'Despejar Barrera Sísmica Sur',
        detail: 'Equipa como Compañero Espiritual una Criatura Espiritual de TIERRA (ej. Quiltro) y toca la barrera.',
        requiredElement: obs.elementRequired || 'tierra',
      });
    }
    if (!boss?.cleared) {
      missions.push({
        id: 'rm_boss',
        title: 'Vencer al Costanera Center (Nv.5)',
        detail: 'Gana el Amuleto Espiritual Valle Central y abre la ruta hacia R. del Biobío.',
        isBossMission: true,
      });
    }
  } else if (region.id === 'biobio') {
    const npc = entities.find(e => e.id === 'npc_lautaro_biobio');
    const landmark = entities.find(e => e.id === 'landmark_volcan_antuco_biobio');
    const wildEl = entities.find(e => e.id === 'wild_biobio_velociraptor');
    const obsOpt = entities.find(e => e.id === 'obstacle_biobio');
    const obs = entities.find(e => e.id === 'obstacle_biobio_ruta');
    const boss = entities.find(e => e.id === 'boss_biobio');
    const hasFuego = hasElementalSpirit(partySpirits, 'fuego', medals) || Boolean(wildEl?.cleared);

    if (!npc?.cleared) {
      missions.push({
        id: 'bb_lautaro',
        title: 'Hablar con Lautaro',
        detail: 'Conoce la región del Biobío y recibe Gotas Termales.',
      });
    }
    if (landmark && !landmark.cleared) {
      missions.push({
        id: landmark.id,
        title: 'Explorar Volcán Antuco',
        detail: 'Acércate al Volcán Antuco rodeado de montañas (NE) para eliminar la sombra del mapa.',
      });
    }
    if (!hasFuego && (!obs || !obs.cleared)) {
      missions.push({
        id: 'bb_wild_fuego',
        title: 'Vincular Criatura de FUEGO',
        detail: 'Encuentra un Velociraptor Ígneo salvaje tras el río y la vía férrea.',
        requiredElement: 'fuego',
      });
    }
    if (obs && !obs.cleared) {
      missions.push({
        id: obs.id,
        title: 'Quemar Maleza Jurásica',
        detail: 'Equipa como Compañero Espiritual una Criatura Espiritual de FUEGO (ej. Velociraptor).',
        requiredElement: obs.elementRequired || 'fuego',
      });
    }
    if (obsOpt && !obsOpt.cleared) {
      missions.push({
        id: obsOpt.id,
        title: 'Opcional: Grieta Torrencial',
        detail: 'Usa un Compañero Espiritual de AGUA para despejar el cofre fósil secreto.',
        requiredElement: obsOpt.elementRequired || 'agua',
      });
    }
    if (!boss?.cleared) {
      missions.push({
        id: 'bb_boss',
        title: 'Vencer al T-Rex Tirano (Nv.7)',
        detail: 'Obtén el Amuleto Espiritual Jurásico Biobío y desbloquea La Araucanía.',
        isBossMission: true,
      });
    }
  } else if (region.id === 'araucania') {
    const npc = entities.find(e => e.id === 'npc_minero_araucania');
    const landmark = entities.find(e => e.id === 'landmark_volcan_villarrica');
    const wildEl = entities.find(e => e.id === 'wild_araucania_ranita');
    const obsOpt = entities.find(e => e.id === 'obstacle_araucania');
    const obs = entities.find(e => e.id === 'obstacle_araucania_ruta');
    const boss = entities.find(e => e.id === 'boss_araucania');
    const hasAgua = hasElementalSpirit(partySpirits, 'agua', medals) || Boolean(wildEl?.cleared);

    if (!npc?.cleared) {
      missions.push({
        id: 'ar_nahuel',
        title: 'Hablar con Nahuel',
        detail: 'Consigue un Corazón de Basalto en el sendero norte.',
      });
    }
    if (landmark && !landmark.cleared) {
      missions.push({
        id: landmark.id,
        title: 'Explorar Volcán Villarrica',
        detail: 'Visita el Volcán Villarrica rodeado de cerros (Norte-Centro) para revelar el mapa entero.',
      });
    }
    if (!hasAgua && (!obs || !obs.cleared)) {
      missions.push({
        id: 'ar_wild_agua',
        title: 'Vincular Criatura de AGUA',
        detail: 'Encuentra una Ranita de Darwin salvaje junto al lago para enfriar el magma.',
        requiredElement: 'agua',
      });
    }
    if (obs && !obs.cleared) {
      missions.push({
        id: obs.id,
        title: 'Enfriar Barrera Magmática',
        detail: 'Equipa como Compañero Espiritual una Criatura Espiritual de AGUA (ej. Ranita de Darwin).',
        requiredElement: obs.elementRequired || 'agua',
      });
    }
    if (obsOpt && !obsOpt.cleared) {
      missions.push({
        id: obsOpt.id,
        title: 'Opcional: Roca Magmática Este',
        detail: 'Usa un Compañero Espiritual de AGUA para liberar el cofre volcánico.',
        requiredElement: obsOpt.elementRequired || 'agua',
      });
    }
    if (!boss?.cleared) {
      missions.push({
        id: 'ar_boss',
        title: 'Vencer a la Araucaria Madre (Nv.9)',
        detail: 'Gana el Amuleto Espiritual Pewén Araucanía y abre paso a Los Ríos.',
        isBossMission: true,
      });
    }
  } else if (region.id === 'losrios') {
    const npc = entities.find(e => e.id === 'npc_javiera_losrios');
    const landmark = entities.find(e => e.id === 'landmark_volcan_mocho');
    const wildEl = entities.find(e => e.id === 'wild_losrios_hongo');
    const obsOpt = entities.find(e => e.id === 'obstacle_losrios');
    const obs = entities.find(e => e.id === 'obstacle_losrios_ruta');
    const boss = entities.find(e => e.id === 'boss_losrios');
    const hasPlanta = hasElementalSpirit(partySpirits, 'planta', medals) || Boolean(wildEl?.cleared);

    if (!npc?.cleared) {
      missions.push({
        id: 'lr_javiera',
        title: 'Hablar con Javiera',
        detail: 'Recibe Resina de Pewén junto al sendero norte.',
      });
    }
    if (landmark && !landmark.cleared) {
      missions.push({
        id: landmark.id,
        title: 'Explorar Volcán Mocho-Choshuenco',
        detail: 'Visita su cumbre rodeada de cerros al suroeste para despejar por completo la sombra del mapa.',
      });
    }
    if (!hasPlanta && (!obs || !obs.cleared)) {
      missions.push({
        id: 'lr_wild_planta',
        title: 'Vincular Criatura de PLANTA',
        detail: 'Encuentra un Hongo Lumínico salvaje en la selva valdiviana.',
        requiredElement: 'planta',
      });
    }
    if (obs && !obs.cleared) {
      missions.push({
        id: obs.id,
        title: 'Drenar Desborde del Torreón',
        detail: 'Equipa como Compañero Espiritual una Criatura Espiritual de PLANTA (ej. Hongo Lumínico).',
        requiredElement: obs.elementRequired || 'planta',
      });
    }
    if (obsOpt && !obsOpt.cleared) {
      missions.push({
        id: obsOpt.id,
        title: 'Opcional: Caudal Ribereño Oeste',
        detail: 'Usa un Compañero Espiritual de AGUA para acceder al cofre secreto.',
        requiredElement: obsOpt.elementRequired || 'agua',
      });
    }
    if (!boss?.cleared) {
      missions.push({
        id: 'lr_boss',
        title: 'Purificar al Torreón (Nv.11)',
        detail: 'Obtén el Amuleto Espiritual Selva Valdiviana y abre paso a Los Lagos.',
        isBossMission: true,
      });
    }
  } else if (region.id === 'loslagos') {
    const npc = entities.find(e => e.id === 'npc_alercero');
    const landmark = entities.find(e => e.id === 'landmark_volcan_osorno');
    const wildEl = entities.find(e => e.id === 'wild_loslagos_ventisquero');
    const obsOpt = entities.find(e => e.id === 'obstacle_loslagos');
    const obs = entities.find(e => e.id === 'obstacle_loslagos_ruta');
    const cai = entities.find(e => e.id === 'boss_loslagos_caicai');
    const vilu = entities.find(e => e.id === 'boss_loslagos_viluvilu');
    const hasHielo = hasElementalSpirit(partySpirits, 'hielo', medals) || Boolean(wildEl?.cleared);

    if (!npc?.cleared) {
      missions.push({
        id: 'll_checho',
        title: 'Hablar con Don Checho',
        detail: 'Recibe Infusión de Calafate en la entrada norte.',
      });
    }
    if (landmark && !landmark.cleared) {
      missions.push({
        id: landmark.id,
        title: 'Explorar Volcán Osorno',
        detail: 'Alcanza el Volcán Osorno al este nevado para despejar la sombra del mapa.',
      });
    }
    if (!hasHielo && (!obs || !obs.cleared)) {
      missions.push({
        id: 'll_wild_hielo',
        title: 'Vincular Criatura de HIELO',
        detail: 'Encuentra un Ventisquero Polar o Pingüino Austral en la nieve cordillerana.',
        requiredElement: 'hielo',
      });
    }
    if (obs && !obs.cleared) {
      missions.push({
        id: obs.id,
        title: 'Congelar el Fiordo Helado',
        detail: 'Equipa como Compañero Espiritual una Criatura Espiritual de HIELO (ej. Ventisquero o Pingüino).',
        requiredElement: obs.elementRequired || 'hielo',
      });
    }
    if (obsOpt && !obsOpt.cleared) {
      missions.push({
        id: obsOpt.id,
        title: 'Opcional: Derretir Bloque Glacial',
        detail: 'Usa un Compañero Espiritual de FUEGO para abrir el cofre austral.',
        requiredElement: obsOpt.elementRequired || 'fuego',
      });
    }
    if (!cai?.cleared) {
      missions.push({
        id: 'll_caicai',
        title: 'Vencer a Cai Cai Vilu (Nv.13)',
        detail: 'Serpiente de las aguas australes en el ala oeste del santuario sur.',
        isBossMission: true,
      });
    }
    if (!vilu?.cleared) {
      missions.push({
        id: 'll_viluvilu',
        title: 'Vencer a Vilu Vilu (Nv.14)',
        detail: 'Serpiente de tierra y cumbres en el ala este del santuario sur.',
        isBossMission: true,
      });
    }
  }

  return missions;
}

export function getCurrentQuest(
  region: MapRegion,
  _unlockedRegions: RegionId[],
  partySpirits?: SpiritCreature[],
  medals?: string[]
): {
  stepNumber: number;
  totalSteps: number;
  title: string;
  shortText: string;
  instruction: string;
  hint: string;
  requiredElement?: ElementType;
  targetCoords?: { x: number; y: number };
} {
  const entities = region.entities;

  if (region.id === 'hospital') {
    const healStation = entities.find(e => e.id === 'shrine_cura_hospital');
    return {
      stepNumber: 1,
      totalSteps: 1,
      title: 'Hospital Regional (Interior)',
      shortText: 'Cura tu equipo gratis o sal al sur',
      instruction: 'Pasa sobre la Estación de Curación Rápida o habla con la Enfermera Jefe para restaurar 100% de PS y PM.',
      hint: 'Camina hacia la puerta inferior para volver al mapa exterior.',
      targetCoords: { x: healStation?.x ?? 5, y: healStation?.y ?? 4 },
    };
  }

  if (region.id === 'santuario') {
    const altar = entities.find(e => e.id === 'shrine_altar_evolucion');
    return {
      stepNumber: 0,
      totalSteps: 0,
      title: 'Santuario de Evolución (Interior)',
      shortText: 'Altar opcional de evolución o sal al sur',
      instruction: 'Pasa sobre el Altar de Evolución central si deseas despertar la siguiente etapa de tus Criaturas Espirituales.',
      hint: 'Camina hacia la puerta inferior para regresar al mapa regional.',
      targetCoords: { x: altar?.x ?? 5, y: altar?.y ?? 4 },
    };
  }

  if (region.id === 'tienda') {
    const vendor = entities.find(e => e.id === 'npc_vendedor_tienda');
    return {
      stepNumber: 1,
      totalSteps: 1,
      title: 'Tienda Regional (Interior)',
      shortText: 'Habla con el comerciante o sal al sur',
      instruction: 'Acércate al mostrador para comprar pociones, maná, empanadas y Amuletos de Vínculo o vender objetos.',
      hint: 'Al salir por la puerta sur volverás exactamente a la entrada exterior.',
      targetCoords: { x: vendor?.x ?? 5, y: vendor?.y ?? 3 },
    };
  }

  if (region.id === 'casa') {
    const npcMama = entities.find(e => e.id === 'npc_mama_casa');
    const portalRM = entities.find(e => e.id === 'portal_casa_to_santiago');
    if (!npcMama?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 2,
        title: 'Tu Hogar (Escenario 0)',
        shortText: 'Habla con Abuela Mary o sal al sur',
        instruction: 'Despídete de Abuela Mary en la sala o revisa tu Diario antes de cruzar la puerta sur.',
        hint: 'Puedes tocar cualquier punto del mapa para caminar automáticamente.',
        targetCoords: { x: npcMama?.x ?? 5, y: npcMama?.y ?? 3 },
      };
    }
    return {
      stepNumber: 2,
      totalSteps: 2,
      title: 'Inicio de la Travesía',
      shortText: 'Sal por la puerta sur a R. Metropolitana',
      instruction: 'Cruza la puerta principal al sur de tu casa para comenzar tu expedición por Chile.',
      hint: 'Toca la puerta sur para caminar e interactuar automáticamente.',
      targetCoords: { x: portalRM?.x ?? 5, y: portalRM?.y ?? 8 },
    };
  }

  if (region.id === 'santiago') {
    const npcIgnacio = entities.find(e => e.id === 'npc_profesor');
    const landmark = entities.find(e => e.id === 'landmark_san_cristobal_rm');
    const wildQuiltro = entities.find(e => e.id === 'wild_santiago_quiltro');
    const obstacle = entities.find(e => e.id === 'obstacle_santiago_ruta');
    const boss = entities.find(e => e.id === 'boss_santiago');
    const hasTierra = hasElementalSpirit(partySpirits, 'tierra', medals) || Boolean(wildQuiltro?.cleared);

    if (!npcIgnacio?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 6,
        title: 'Despertar en R. Metropolitana',
        shortText: 'Habla con Don Ignacio al norte',
        instruction: 'Habla con Don Ignacio frente a tu casa para recibir tus primeros Amuletos de Vínculo.',
        hint: 'Toca a Don Ignacio para acercarte y conversar.',
        targetCoords: { x: npcIgnacio?.x ?? 14, y: npcIgnacio?.y ?? 4 },
      };
    }

    if (landmark && !landmark.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 6,
        title: 'Mirador del Valle Central',
        shortText: 'Visita el Cerro San Cristóbal (NE)',
        instruction: 'Sube al Cerro San Cristóbal rodeado de cerros al noreste para disipar la sombra de todo el mapa regional.',
        hint: 'Toca el Cerro San Cristóbal para caminar hasta su acceso sur e inspeccionarlo.',
        targetCoords: { x: landmark.x, y: landmark.y },
      };
    }

    if (!hasTierra && (!obstacle || !obstacle.cleared)) {
      return {
        stepNumber: 3,
        totalSteps: 6,
        title: 'Criatura Salvaje: Tierra',
        shortText: 'Vincula al Quiltro salvaje (sur del río)',
        instruction: 'Cruza el Río Mapocho y enfréntate al Quiltro salvaje para obtener una Criatura Espiritual de TIERRA.',
        hint: 'Usa Amuletos de Vínculo cuando el Quiltro tenga poca vida.',
        requiredElement: 'tierra',
        targetCoords: wildQuiltro ? { x: wildQuiltro.x, y: wildQuiltro.y } : undefined,
      };
    }

    if (obstacle && !obstacle.cleared) {
      return {
        stepNumber: 4,
        totalSteps: 6,
        title: 'Despejar Barrera Sísmica',
        shortText: 'Abre barrera sur con compañero espiritual TIERRA',
        instruction: 'Equipa a tu Criatura Espiritual de TIERRA (ej. Quiltro) como Compañero Espiritual en Equipo y toca la barrera sur.',
        hint: 'Tu compañero espiritual activo ejecutará su técnica sísmica animada para liberar el paso.',
        requiredElement: obstacle.elementRequired || 'tierra',
        targetCoords: { x: obstacle.x, y: obstacle.y },
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 5,
        totalSteps: 6,
        title: 'El Coloso del Valle Central',
        shortText: 'Derrota al Costanera Center (Nv.5)',
        instruction: 'El Coloso Costanera Center (Nv.5) ha despertado al sureste. ¡Derrótalo para abrir la ruta al Biobío!',
        hint: 'Al derrotarlo recibirás el Amuleto Espiritual Valle Central.',
        targetCoords: { x: boss?.x ?? 21, y: boss?.y ?? 21 },
      };
    }

    const portalBiobio = entities.find(e => e.id === 'portal_to_biobio');
    return {
      stepNumber: 6,
      totalSteps: 6,
      title: 'Hacia R. del Biobío',
      shortText: 'Cruza el portal sureste al Biobío',
      instruction: '¡El camino a R. del Biobío está despejado! Cruza el portal sureste o usa el Mapa.',
      hint: 'Dirígete al letrero del corredor sureste.',
      targetCoords: { x: portalBiobio?.x ?? 21, y: portalBiobio?.y ?? 24 },
    };
  }

  if (region.id === 'biobio') {
    const npcLautaro = entities.find(e => e.id === 'npc_lautaro_biobio');
    const landmark = entities.find(e => e.id === 'landmark_volcan_antuco_biobio');
    const wildFuego = entities.find(e => e.id === 'wild_biobio_velociraptor');
    const obstacle = entities.find(e => e.id === 'obstacle_biobio_ruta');
    const boss = entities.find(e => e.id === 'boss_biobio');
    const hasFuego = hasElementalSpirit(partySpirits, 'fuego', medals) || Boolean(wildElOrNull(wildFuego));

    function wildElOrNull(ent: typeof wildFuego) {
      return ent?.cleared;
    }

    if (!npcLautaro?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 6,
        title: 'El Guía del Biobío',
        shortText: 'Habla con Lautaro al noreste del Biobío',
        instruction: 'Habla con Lautaro junto a la entrada norte para recibir Gotas Termales y conocer la región.',
        hint: 'Acércate a Lautaro junto al camino de piedra.',
        targetCoords: { x: npcLautaro?.x ?? 17, y: npcLautaro?.y ?? 2 },
      };
    }

    if (landmark && !landmark.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 6,
        title: 'Cumbre del Biobío',
        shortText: 'Visita el Volcán Antuco (SE)',
        instruction: 'Dirígete al Volcán Antuco rodeado de montañas al sureste para disipar la sombra de todo el mapa.',
        hint: 'Cruza la vía férrea hasta la esquina sureste.',
        targetCoords: { x: landmark.x, y: landmark.y },
      };
    }

    if (!hasFuego && (!obstacle || !obstacle.cleared)) {
      return {
        stepNumber: 3,
        totalSteps: 6,
        title: 'Criatura Salvaje: Fuego',
        shortText: 'Vincula al Velociraptor Ígneo',
        instruction: 'Cruza el río y la vía férrea para vincular al Velociraptor Ígneo (FUEGO) salvaje.',
        hint: 'Lo necesitas como Compañero Espiritual para quemar la maleza jurásica del sur.',
        requiredElement: 'fuego',
        targetCoords: wildFuego ? { x: wildFuego.x, y: wildFuego.y } : undefined,
      };
    }

    if (obstacle && !obstacle.cleared) {
      return {
        stepNumber: 4,
        totalSteps: 6,
        title: 'Misión Elemental: Fuego',
        shortText: 'Quema maleza suroeste con compañero espiritual FUEGO',
        instruction: 'Equipa una Criatura Espiritual de FUEGO (ej. Velociraptor) como Compañero Espiritual y quema la Maleza Jurásica.',
        hint: 'Puedes curar en el Hospital Regional junto al sendero.',
        requiredElement: obstacle.elementRequired || 'fuego',
        targetCoords: { x: obstacle.x, y: obstacle.y },
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 5,
        totalSteps: 6,
        title: 'El Rey Prehistórico del Biobío',
        shortText: 'Derrota al T-Rex del Biobío (Nv.7)',
        instruction: 'El T-Rex Tirano del Biobío (Nv.7) aguarda en la arena suroeste. ¡Derrótalo para ganar su Amuleto Espiritual!',
        hint: 'Usa ataques de Agua o Tierra contra el T-Rex.',
        targetCoords: { x: boss?.x ?? 6, y: boss?.y ?? 17 },
      };
    }

    const portalAraucania = entities.find(e => e.id === 'portal_to_araucania');
    return {
      stepNumber: 6,
      totalSteps: 6,
      title: 'Rumbo a R. de La Araucanía',
      shortText: 'Cruza el portal suroeste a La Araucanía',
      instruction: '¡Has armonizado el Biobío! Avanza por el corredor suroeste hacia La Araucanía.',
      hint: 'Cruza el letrero del corredor suroeste.',
      targetCoords: { x: portalAraucania?.x ?? 6, y: portalAraucania?.y ?? 20 },
    };
  }

  if (region.id === 'araucania') {
    const npcNahuel = entities.find(e => e.id === 'npc_minero_araucania');
    const landmark = entities.find(e => e.id === 'landmark_volcan_villarrica');
    const wildAgua = entities.find(e => e.id === 'wild_araucania_ranita');
    const obstacle = entities.find(e => e.id === 'obstacle_araucania_ruta');
    const boss = entities.find(e => e.id === 'boss_araucania');
    const hasAgua = hasElementalSpirit(partySpirits, 'agua', medals) || Boolean(wildAgua?.cleared);

    if (!npcNahuel?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 6,
        title: 'Sendero de Araucarias',
        shortText: 'Habla con Nahuel al noroeste',
        instruction: 'Habla con Nahuel en la entrada noroeste de La Araucanía para recibir un Corazón de Basalto.',
        hint: 'Nahuel te espera al noroeste entre los prados y araucarias.',
        targetCoords: { x: npcNahuel?.x ?? 8, y: npcNahuel?.y ?? 2 },
      };
    }

    if (landmark && !landmark.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 6,
        title: 'Cumbre de Ruka Pillán',
        shortText: 'Visita el Volcán Villarrica (Norte)',
        instruction: 'Explora hasta el Volcán Villarrica rodeado de cerros al norte-centro para disipar la sombra de todo el mapa.',
        hint: 'Sigue el sendero norte-centro frente a la tienda y ciudad.',
        targetCoords: { x: landmark.x, y: landmark.y },
      };
    }

    if (!hasAgua && (!obstacle || !obstacle.cleared)) {
      return {
        stepNumber: 3,
        totalSteps: 6,
        title: 'Criatura Salvaje: Agua',
        shortText: 'Vincula la Ranita de Darwin junto al lago',
        instruction: 'Visita el lago al centro de La Araucanía para vincular una Ranita de Darwin (AGUA).',
        hint: 'La necesitas para enfriar la Barrera Magmática del sureste.',
        requiredElement: 'agua',
        targetCoords: wildAgua ? { x: wildAgua.x, y: wildAgua.y } : undefined,
      };
    }

    if (obstacle && !obstacle.cleared) {
      return {
        stepNumber: 4,
        totalSteps: 6,
        title: 'Misión Elemental: Agua',
        shortText: 'Enfría magma sureste con compañero espiritual AGUA',
        instruction: 'Equipa una Criatura Espiritual de AGUA (ej. Ranita de Darwin) como Compañero Espiritual y enfría la Barrera Magmática.',
        hint: 'Visita también las Rucas Mapuches al suroeste del lago.',
        requiredElement: obstacle.elementRequired || 'agua',
        targetCoords: { x: obstacle.x, y: obstacle.y },
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 5,
        totalSteps: 6,
        title: 'La Araucaria Madre Milenaria',
        shortText: 'Desafía a la Araucaria Madre (Nv.9)',
        instruction: 'La Araucaria Madre (Nv.9) aguarda en la plaza sureste. ¡Derrótala para abrir la ruta a Los Ríos!',
        hint: 'Los ataques de Fuego multiplican el daño contra Planta.',
        targetCoords: { x: boss?.x ?? 18, y: boss?.y ?? 19 },
      };
    }

    const portalLosRios = entities.find(e => e.id === 'portal_to_losrios');
    return {
      stepNumber: 6,
      totalSteps: 6,
      title: 'Descenso a R. de Los Ríos',
      shortText: 'Cruza el portal sureste a Los Ríos',
      instruction: '¡La Araucaria Madre bendice tu camino! Avanza por el portal sureste hacia Los Ríos.',
      hint: 'El letrero sureste conecta con R. de Los Ríos.',
      targetCoords: { x: portalLosRios?.x ?? 18, y: portalLosRios?.y ?? 22 },
    };
  }

  if (region.id === 'losrios') {
    const npcJaviera = entities.find(e => e.id === 'npc_javiera_losrios');
    const landmark = entities.find(e => e.id === 'landmark_volcan_mocho');
    const wildPlanta = entities.find(e => e.id === 'wild_losrios_hongo');
    const obstacle = entities.find(e => e.id === 'obstacle_losrios_ruta');
    const boss = entities.find(e => e.id === 'boss_losrios');
    const hasPlanta = hasElementalSpirit(partySpirits, 'planta', medals) || Boolean(wildPlanta?.cleared);

    if (!npcJaviera?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 6,
        title: 'Navegante de la Selva',
        shortText: 'Habla con Javiera al noreste de Los Ríos',
        instruction: 'Habla con Javiera en el sendero noreste para recibir Resina de Pewén.',
        hint: 'Se encuentra cerca de la entrada norte bajo la lluvia con viento.',
        targetCoords: { x: npcJaviera?.x ?? 20, y: npcJaviera?.y ?? 2 },
      };
    }

    if (landmark && !landmark.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 6,
        title: 'Glaciares del Mocho-Choshuenco',
        shortText: 'Visita el Volcán Mocho-Choshuenco (SO)',
        instruction: 'Sube al Volcán Mocho-Choshuenco rodeado de cerros al suroeste para eliminar toda sombra del mapa valdiviano.',
        hint: 'Cruza los dos ríos hacia el corredor suroeste.',
        targetCoords: { x: landmark.x, y: landmark.y },
      };
    }

    if (!hasPlanta && (!obstacle || !obstacle.cleared)) {
      return {
        stepNumber: 3,
        totalSteps: 6,
        title: 'Criatura Salvaje: Planta',
        shortText: 'Vincula al Hongo Lumínico salvaje',
        instruction: 'Enfréntate al Hongo Lumínico salvaje de la selva valdiviana para contar con tipo PLANTA.',
        hint: 'Su habilidad de PLANTA absorberá el desborde de aguas del Torreón.',
        requiredElement: 'planta',
        targetCoords: wildPlanta ? { x: wildPlanta.x, y: wildPlanta.y } : undefined,
      };
    }

    if (obstacle && !obstacle.cleared) {
      return {
        stepNumber: 4,
        totalSteps: 6,
        title: 'Misión Elemental: Planta',
        shortText: 'Drena río suroeste con compañero espiritual PLANTA',
        instruction: 'Equipa una Criatura Espiritual de PLANTA (ej. Hongo Lumínico o Brotín) como Compañero Espiritual y toca la barrera.',
        hint: 'Cruza los dos ríos valdivianos hasta el corredor suroeste.',
        requiredElement: obstacle.elementRequired || 'planta',
        targetCoords: { x: obstacle.x, y: obstacle.y },
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 5,
        totalSteps: 6,
        title: 'El Torreón del Calle-Calle',
        shortText: 'Purifica al Torreón (Nv.11) al suroeste',
        instruction: 'El Guardián del Torreón (Nv.11) aguarda al suroeste. ¡Derrótalo para ganar su Amuleto Espiritual!',
        hint: 'Usa técnicas de Planta para lograr máxima ventaja.',
        targetCoords: { x: boss?.x ?? 9, y: boss?.y ?? 21 },
      };
    }

    const portalLosLagos = entities.find(e => e.id === 'portal_to_loslagos');
    return {
      stepNumber: 6,
      totalSteps: 6,
      title: 'Travesía a R. de Los Lagos',
      shortText: 'Cruza el portal suroeste a Los Lagos',
      instruction: '¡Los ríos fluyen en armonía! Zarpa por el portal suroeste hacia R. de Los Lagos.',
      hint: 'Dirígete al portal suroeste del mapa.',
      targetCoords: { x: portalLosLagos?.x ?? 9, y: portalLosLagos?.y ?? 24 },
    };
  }

  // Stage 5: R. de Los Lagos (2 Bosses: Cai Cai Vilu & Vilu Vilu)
  const npcChecho = entities.find(e => e.id === 'npc_alercero');
  const landmark = entities.find(e => e.id === 'landmark_volcan_osorno');
  const wildHielo = entities.find(e => e.id === 'wild_loslagos_ventisquero');
  const obstacle = entities.find(e => e.id === 'obstacle_loslagos_ruta');
  const bossCaiCai = entities.find(e => e.id === 'boss_loslagos_caicai');
  const bossViluVilu = entities.find(e => e.id === 'boss_loslagos_viluvilu');
  const hasHielo = hasElementalSpirit(partySpirits, 'hielo', medals) || Boolean(wildHielo?.cleared);

  if (!npcChecho?.cleared) {
    return {
      stepNumber: 1,
      totalSteps: 6,
      title: 'Guardián del Alerce Milenario',
      shortText: 'Habla con Don Checho al noroeste',
      instruction: 'Habla con Don Checho en la entrada de Los Lagos para recibir Infusión de Calafate.',
      hint: 'Está junto al sendero noroeste bajo la tormenta austral.',
      targetCoords: { x: npcChecho?.x ?? 12, y: npcChecho?.y ?? 2 },
    };
  }

  if (landmark && !landmark.cleared) {
    return {
      stepNumber: 2,
      totalSteps: 6,
      title: 'Cumbre del Volcán Osorno',
      shortText: 'Visita el Volcán Osorno (Este nevado)',
      instruction: 'Avanza hacia las nieves cordilleranas del sector este para inspeccionar el Volcán Osorno y revelar todo el mapa austral.',
      hint: 'Desde el continente también puedes cruzar por el puente hacia la Isla de Chiloé al suroeste.',
      targetCoords: { x: landmark.x, y: landmark.y },
    };
  }

  if (!hasHielo && (!obstacle || !obstacle.cleared)) {
    return {
      stepNumber: 3,
      totalSteps: 6,
      title: 'Criatura Salvaje: Hielo',
      shortText: 'Vincula al Ventisquero Polar (nieve)',
      instruction: 'Enfréntate a un Ventisquero Polar en la zona nevada del este para obtener tipo HIELO.',
      hint: 'Lo usarás como Compañero Espiritual para congelar el Fiordo Helado del sur.',
      requiredElement: 'hielo',
      targetCoords: wildHielo ? { x: wildHielo.x, y: wildHielo.y } : undefined,
    };
  }

  if (obstacle && !obstacle.cleared) {
    return {
      stepNumber: 4,
      totalSteps: 6,
      title: 'Misión Elemental: Hielo',
      shortText: 'Cruza puente sur con compañero espiritual HIELO',
      instruction: 'Equipa una Criatura Espiritual de HIELO (ej. Ventisquero o Pingüino) como Compañero Espiritual para abrir el puente a la Isla.',
      hint: 'El puente único está al sur de la franja cordillerana este.',
      requiredElement: obstacle.elementRequired || 'hielo',
      targetCoords: { x: obstacle.x, y: obstacle.y },
    };
  }

  if (!bossCaiCai?.cleared || !bossViluVilu?.cleared) {
    const nextBoss = !bossCaiCai?.cleared ? bossCaiCai : bossViluVilu;
    const remainingCount = (!bossCaiCai?.cleared ? 1 : 0) + (!bossViluVilu?.cleared ? 1 : 0);
    return {
      stepNumber: 5,
      totalSteps: 6,
      title: 'Las Dos Serpientes de Los Lagos',
      shortText:
        remainingCount === 2
          ? 'Derrota a Cai Cai (Nv.13) y Vilu Vilu (Nv.14)'
          : !bossCaiCai?.cleared
          ? 'Derrota a Cai Cai Vilu (Nv.13) al oeste'
          : 'Derrota a Vilu Vilu (Nv.14) al este',
      instruction:
        remainingCount === 2
          ? '¡En el Santuario Austral esperan Cai Cai Vilu (oeste, Nv.13) y Vilu Vilu (este, Nv.14)!'
          : !bossCaiCai?.cleared
          ? '¡Solo falta derrotar a Cai Cai Vilu (Nv.13) al oeste!'
          : '¡Solo falta derrotar a Vilu Vilu (Nv.14) al este!',
      hint: 'Usa Planta contra Cai Cai Vilu y Agua contra Vilu Vilu.',
      targetCoords: { x: nextBoss?.x ?? 24, y: nextBoss?.y ?? 27 },
    };
  }

  return {
    stepNumber: 6,
    totalSteps: 6,
    title: 'Expedición Libre de Chile',
    shortText: 'Explora las 5 regiones y completa tu Bestiario',
    instruction: '¡Los 5 Amuletos Espirituales brillan desde R. Metropolitana hasta Los Lagos! Sigue capturando especies y evoluciones.',
    hint: 'Usa el Mapa para viajar libremente entre las 5 regiones cuando quieras.',
  };
}

/**
 * Checks whether the regional boss(es) of the current stage unlocked after prerequisite missions
 */
export function isStageBossAwakened(region: MapRegion, hasCompletedStory: boolean = false): boolean {
  if (hasCompletedStory) return true;
  if (region.id === 'casa' || region.id === 'hospital' || region.id === 'santuario' || region.id === 'tienda') return true;
  const entities = region.entities;
  if (region.id === 'santiago') {
    const npcIgnacio = entities.find(e => e.id === 'npc_profesor');
    const landmark = entities.find(e => e.id === 'landmark_san_cristobal_rm');
    const obstacle = entities.find(e => e.id === 'obstacle_santiago_ruta');
    return Boolean(npcIgnacio?.cleared && (!landmark || landmark.cleared) && (!obstacle || obstacle.cleared));
  }
  if (region.id === 'biobio') {
    const npcLautaro = entities.find(e => e.id === 'npc_lautaro_biobio');
    const landmark = entities.find(e => e.id === 'landmark_volcan_antuco_biobio');
    const obstacle = entities.find(e => e.id === 'obstacle_biobio_ruta');
    return Boolean(npcLautaro?.cleared && (!landmark || landmark.cleared) && (!obstacle || obstacle.cleared));
  }
  if (region.id === 'araucania') {
    const npcNahuel = entities.find(e => e.id === 'npc_minero_araucania');
    const landmark = entities.find(e => e.id === 'landmark_volcan_villarrica');
    const obstacle = entities.find(e => e.id === 'obstacle_araucania_ruta');
    return Boolean(npcNahuel?.cleared && (!landmark || landmark.cleared) && (!obstacle || obstacle.cleared));
  }
  if (region.id === 'losrios') {
    const npcJaviera = entities.find(e => e.id === 'npc_javiera_losrios');
    const landmark = entities.find(e => e.id === 'landmark_volcan_mocho');
    const obstacle = entities.find(e => e.id === 'obstacle_losrios_ruta');
    return Boolean(npcJaviera?.cleared && (!landmark || landmark.cleared) && (!obstacle || obstacle.cleared));
  }
  if (region.id === 'loslagos') {
    const npcChecho = entities.find(e => e.id === 'npc_alercero');
    const landmark = entities.find(e => e.id === 'landmark_volcan_osorno');
    const obstacle = entities.find(e => e.id === 'obstacle_loslagos_ruta');
    return Boolean(npcChecho?.cleared && (!landmark || landmark.cleared) && (!obstacle || obstacle.cleared));
  }
  return true;
}
