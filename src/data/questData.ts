/**
 * Quest & Objective Guide System for Crónicas Elementales del Sur (5 Chilean Regions + Interiors)
 */

import { RegionId, MapRegion, ElementType } from '../types/game';

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

export function getRegionPendingMissions(region: MapRegion): PendingRegionMission[] {
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
    return [
      {
        id: 'sanc_evo',
        title: 'Altar de Evolución',
        detail: 'Único lugar donde tus espíritus pueden evolucionar usando nivel y esencias.',
      },
    ];
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
        title: 'Despedirse de Mamá Elena',
        detail: 'Conversa con Mamá Elena antes de salir a R. Metropolitana.',
      });
    }
    missions.push({
      id: 'casa_salir',
      title: 'Salir por la Puerta Sur',
      detail: 'Cruza la puerta inferior para iniciar tu expedición en Stage 1.',
    });
    return missions;
  }

  // Stage-specific elemental path missions & regional guardians
  if (region.id === 'santiago') {
    const npc = entities.find(e => e.id === 'npc_profesor');
    const c1 = entities.find(e => e.id === 'chest_santiago_1');
    const c2 = entities.find(e => e.id === 'chest_santiago_2');
    const obs = entities.find(e => e.id === 'obstacle_santiago_ruta');
    const boss = entities.find(e => e.id === 'boss_santiago');

    if (!npc?.cleared) {
      missions.push({
        id: 'rm_ignacio',
        title: 'Hablar con Don Ignacio',
        detail: 'Recibe Amuletos de Vínculo frente a tu casa al norte.',
      });
    }
    if (!c1?.cleared || !c2?.cleared) {
      missions.push({
        id: 'rm_cofres',
        title: 'Abrir Cofres de los Cerros',
        detail: 'Recoge los cofres de Cerro Blanco (NO) y Cerro San Cristóbal (NE).',
      });
    }
    if (obs && !obs.cleared) {
      missions.push({
        id: obs.id,
        title: 'Despejar Barrera Sísmica Sur',
        detail: 'Equipa como Líder Activo un espíritu de TIERRA (ej. Quiltro) y toca la barrera.',
        requiredElement: obs.elementRequired || 'tierra',
      });
    }
    if (!boss?.cleared) {
      missions.push({
        id: 'rm_boss',
        title: 'Vencer al Costanera Center (Nv.5)',
        detail: 'Gana la Medalla Valle Central y abre la ruta hacia R. del Biobío.',
        isBossMission: true,
      });
    }
  } else if (region.id === 'biobio') {
    const npc = entities.find(e => e.id === 'npc_lautaro_biobio');
    const c1 = entities.find(e => e.id === 'chest_biobio_1');
    const obsOpt = entities.find(e => e.id === 'obstacle_biobio');
    const obs = entities.find(e => e.id === 'obstacle_biobio_ruta');
    const boss = entities.find(e => e.id === 'boss_biobio');

    if (!npc?.cleared) {
      missions.push({
        id: 'bb_lautaro',
        title: 'Hablar con Lautaro',
        detail: 'Conoce la región del Biobío y recibe Gotas Termales.',
      });
    }
    if (!c1?.cleared) {
      missions.push({
        id: 'bb_cofre',
        title: 'Cofre del Claro Jurásico',
        detail: 'Recoge el cofre ubicado al noreste cerca del Santuario.',
      });
    }
    if (obs && !obs.cleared) {
      missions.push({
        id: obs.id,
        title: 'Quemar Maleza Jurásica',
        detail: 'Equipa como Líder Activo un espíritu de FUEGO (ej. Velociraptor o Pillancito).',
        requiredElement: obs.elementRequired || 'fuego',
      });
    }
    if (obsOpt && !obsOpt.cleared) {
      missions.push({
        id: obsOpt.id,
        title: 'Opcional: Grieta Torrencial',
        detail: 'Usa un Líder Activo de AGUA para despejar el cofre fósil secreto.',
        requiredElement: obsOpt.elementRequired || 'agua',
      });
    }
    if (!boss?.cleared) {
      missions.push({
        id: 'bb_boss',
        title: 'Vencer al T-Rex Tirano (Nv.7)',
        detail: 'Obtén la Medalla Jurásica Biobío y desbloquea La Araucanía.',
        isBossMission: true,
      });
    }
  } else if (region.id === 'araucania') {
    const npc = entities.find(e => e.id === 'npc_minero_araucania');
    const c1 = entities.find(e => e.id === 'chest_araucania_1');
    const obsOpt = entities.find(e => e.id === 'obstacle_araucania');
    const obs = entities.find(e => e.id === 'obstacle_araucania_ruta');
    const boss = entities.find(e => e.id === 'boss_araucania');

    if (!npc?.cleared) {
      missions.push({
        id: 'ar_nahuel',
        title: 'Hablar con Nahuel',
        detail: 'Consigue un Corazón de Basalto en el sendero norte.',
      });
    }
    if (!c1?.cleared) {
      missions.push({
        id: 'ar_cofre',
        title: 'Cofre de Piñones Dorados',
        detail: 'Abre el cofre en la pradera noroeste junto a la Tienda.',
      });
    }
    if (obs && !obs.cleared) {
      missions.push({
        id: obs.id,
        title: 'Enfriar Barrera Magmática',
        detail: 'Equipa como Líder Activo un espíritu de AGUA (ej. Ranita de Darwin o Hualita).',
        requiredElement: obs.elementRequired || 'agua',
      });
    }
    if (obsOpt && !obsOpt.cleared) {
      missions.push({
        id: obsOpt.id,
        title: 'Opcional: Roca Magmática Este',
        detail: 'Usa un Líder Activo de AGUA para liberar el cofre volcánico.',
        requiredElement: obsOpt.elementRequired || 'agua',
      });
    }
    if (!boss?.cleared) {
      missions.push({
        id: 'ar_boss',
        title: 'Vencer a la Araucaria Madre (Nv.9)',
        detail: 'Gana la Medalla Pewén Araucanía y abre paso a Los Ríos.',
        isBossMission: true,
      });
    }
  } else if (region.id === 'losrios') {
    const npc = entities.find(e => e.id === 'npc_javiera_losrios');
    const c1 = entities.find(e => e.id === 'chest_losrios_1');
    const obsOpt = entities.find(e => e.id === 'obstacle_losrios');
    const obs = entities.find(e => e.id === 'obstacle_losrios_ruta');
    const boss = entities.find(e => e.id === 'boss_losrios');

    if (!npc?.cleared) {
      missions.push({
        id: 'lr_javiera',
        title: 'Hablar con Javiera',
        detail: 'Recibe Resina de Pewén junto al sendero norte.',
      });
    }
    if (!c1?.cleared) {
      missions.push({
        id: 'lr_cofre',
        title: 'Cofre de la Niebla Valdiviana',
        detail: 'Recoge el cofre ubicado al noreste cerca del Santuario.',
      });
    }
    if (obs && !obs.cleared) {
      missions.push({
        id: obs.id,
        title: 'Drenar Desborde del Torreón',
        detail: 'Equipa como Líder Activo un espíritu de PLANTA (ej. Hongo Lumínico o Brotín).',
        requiredElement: obs.elementRequired || 'planta',
      });
    }
    if (obsOpt && !obsOpt.cleared) {
      missions.push({
        id: obsOpt.id,
        title: 'Opcional: Caudal Ribereño Oeste',
        detail: 'Usa un Líder Activo de AGUA para acceder al cofre secreto.',
        requiredElement: obsOpt.elementRequired || 'agua',
      });
    }
    if (!boss?.cleared) {
      missions.push({
        id: 'lr_boss',
        title: 'Purificar al Torreón (Nv.11)',
        detail: 'Obtén la Medalla Selva Valdiviana y abre paso a Los Lagos.',
        isBossMission: true,
      });
    }
  } else if (region.id === 'loslagos') {
    const npc = entities.find(e => e.id === 'npc_alercero');
    const c1 = entities.find(e => e.id === 'chest_loslagos_1');
    const obsOpt = entities.find(e => e.id === 'obstacle_loslagos');
    const obs = entities.find(e => e.id === 'obstacle_loslagos_ruta');
    const cai = entities.find(e => e.id === 'boss_loslagos_caicai');
    const vilu = entities.find(e => e.id === 'boss_loslagos_viluvilu');

    if (!npc?.cleared) {
      missions.push({
        id: 'll_checho',
        title: 'Hablar con Don Checho',
        detail: 'Recibe Infusión de Calafate en la entrada norte.',
      });
    }
    if (!c1?.cleared) {
      missions.push({
        id: 'll_cofre',
        title: 'Cofre Glacial de Hornopirén',
        detail: 'Recoge el cofre al noreste sobre los campos nevados.',
      });
    }
    if (obs && !obs.cleared) {
      missions.push({
        id: obs.id,
        title: 'Congelar el Fiordo Helado',
        detail: 'Equipa como Líder Activo un espíritu de HIELO (ej. Ventisquero o Pingüino).',
        requiredElement: obs.elementRequired || 'hielo',
      });
    }
    if (obsOpt && !obsOpt.cleared) {
      missions.push({
        id: obsOpt.id,
        title: 'Opcional: Derretir Bloque Glacial',
        detail: 'Usa un Líder Activo de FUEGO para abrir el cofre austral oeste.',
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

export function getCurrentQuest(region: MapRegion, _unlockedRegions: RegionId[]): {
  stepNumber: number;
  totalSteps: number;
  title: string;
  shortText: string;
  instruction: string;
  hint: string;
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
      stepNumber: 1,
      totalSteps: 1,
      title: 'Santuario de Evolución (Interior)',
      shortText: 'Usa el Altar de Evolución o sal al sur',
      instruction: 'Pasa sobre el Altar de Evolución central para despertar la siguiente etapa de tus espíritus.',
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
      instruction: 'Acércate al mostrador para comprar pociones, maná, empanadas y amuletos o vender objetos.',
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
        shortText: 'Habla con Mamá Elena o sal al sur',
        instruction: 'Despídete de Mamá Elena en la sala o revisa tu Diario antes de cruzar la puerta sur.',
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
      hint: 'Toca la puerta sur o acércate y presiona ACCIÓN.',
      targetCoords: { x: portalRM?.x ?? 5, y: portalRM?.y ?? 8 },
    };
  }

  if (region.id === 'santiago') {
    const npcIgnacio = entities.find(e => e.id === 'npc_profesor');
    const chest1 = entities.find(e => e.id === 'chest_santiago_1');
    const chest2 = entities.find(e => e.id === 'chest_santiago_2');
    const obstacle = entities.find(e => e.id === 'obstacle_santiago_ruta');
    const boss = entities.find(e => e.id === 'boss_santiago');

    if (!npcIgnacio?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 5,
        title: 'Despertar en R. Metropolitana',
        shortText: 'Habla con Don Ignacio al norte',
        instruction: 'Habla con Don Ignacio frente a tu casa para recibir tus primeros Amuletos de Vínculo.',
        hint: 'Toca a Don Ignacio para acercarte y conversar.',
        targetCoords: { x: npcIgnacio?.x ?? 13, y: npcIgnacio?.y ?? 4 },
      };
    }

    if (!chest1?.cleared || !chest2?.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 5,
        title: 'Equipa tu Mochila',
        shortText: 'Abre cofres Blanco y San Cristóbal',
        instruction: 'Abre los cofres del Cerro Blanco (noroeste) y Cerro San Cristóbal (noreste).',
        hint: 'En el camino tienes además la Tienda de Don Manuel al oeste.',
        targetCoords: {
          x: !chest1?.cleared ? (chest1?.x ?? 3) : (chest2?.x ?? 20),
          y: !chest1?.cleared ? (chest1?.y ?? 2) : (chest2?.y ?? 2),
        },
      };
    }

    if (obstacle && !obstacle.cleared) {
      return {
        stepNumber: 3,
        totalSteps: 5,
        title: 'Misión Elemental: Tierra',
        shortText: 'Abre barrera sur con líder TIERRA',
        instruction: 'Cruza el Río Mapocho y equipa un espíritu de TIERRA (ej. Quiltro) como Líder Activo para abrir la Barrera Sísmica.',
        hint: 'Captura un Quiltro en el pasto o flores al sur del río (1%-3%) y toca la barrera.',
        targetCoords: { x: obstacle.x, y: obstacle.y },
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 4,
        totalSteps: 5,
        title: 'El Coloso del Valle Central',
        shortText: 'Derrota al Costanera Center (Nv.5)',
        instruction: 'El Edificio Costanera Center (Nv.5) ha despertado al sur. ¡Derrótalo para abrir la ruta al Biobío!',
        hint: 'Al derrotarlo, el Maestro Vínculo te entregará la Medalla Valle Central.',
        targetCoords: { x: boss?.x ?? 13, y: boss?.y ?? 21 },
      };
    }

    const portalBiobio = entities.find(e => e.id === 'portal_to_biobio');
    return {
      stepNumber: 5,
      totalSteps: 5,
      title: 'Hacia R. del Biobío',
      shortText: 'Cruza el portal sur al Biobío',
      instruction: '¡El camino a R. del Biobío está despejado! Cruza el portal sur o usa el Mapa.',
      hint: 'Dirígete al letrero central del corredor sur.',
      targetCoords: { x: portalBiobio?.x ?? 13, y: portalBiobio?.y ?? 24 },
    };
  }

  if (region.id === 'biobio') {
    const npcLautaro = entities.find(e => e.id === 'npc_lautaro_biobio');
    const chest1 = entities.find(e => e.id === 'chest_biobio_1');
    const obstacle = entities.find(e => e.id === 'obstacle_biobio_ruta');
    const boss = entities.find(e => e.id === 'boss_biobio');

    if (!npcLautaro?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 5,
        title: 'El Guía del Salto del Laja',
        shortText: 'Habla con Lautaro al norte del Biobío',
        instruction: 'Habla con Lautaro al norte para recibir Gotas Termales y conocer la zona jurásica.',
        hint: 'Acércate a Lautaro junto al camino de piedra.',
        targetCoords: { x: npcLautaro?.x ?? 7, y: npcLautaro?.y ?? 2 },
      };
    }

    if (!chest1?.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 5,
        title: 'Provisiones Jurásicas',
        shortText: 'Abre el Cofre del Claro Jurásico',
        instruction: 'Recoge el cofre al noreste; cerca tienes el Santuario de Evolución y al oeste el Hospital.',
        hint: 'Sigue el sendero norte hacia el este.',
        targetCoords: { x: chest1?.x ?? 15, y: chest1?.y ?? 2 },
      };
    }

    if (obstacle && !obstacle.cleared) {
      return {
        stepNumber: 3,
        totalSteps: 5,
        title: 'Misión Elemental: Fuego',
        shortText: 'Quema maleza sur con líder FUEGO',
        instruction: 'Cruza la vía férrea y equipa un espíritu de FUEGO (ej. Velociraptor) como Líder Activo para quemar la Maleza Jurásica.',
        hint: 'Los Velociraptores de fuego habitan al sur de la vía del tren.',
        targetCoords: { x: obstacle.x, y: obstacle.y },
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 4,
        totalSteps: 5,
        title: 'El Rey Prehistórico del Biobío',
        shortText: 'Derrota al T-Rex del Biobío (Nv.7)',
        instruction: 'El T-Rex Tirano del Biobío (Nv.7) aguarda en la arena sur. ¡Derrótalo para avanzar a La Araucanía!',
        hint: 'Puedes curar en el Hospital oeste o evolucionar en el Santuario este.',
        targetCoords: { x: boss?.x ?? 9, y: boss?.y ?? 13 },
      };
    }

    const portalAraucania = entities.find(e => e.id === 'portal_to_araucania');
    return {
      stepNumber: 5,
      totalSteps: 5,
      title: 'Rumbo a R. de La Araucanía',
      shortText: 'Cruza el portal sur a La Araucanía',
      instruction: '¡Has armonizado el Biobío! Avanza por el corredor sur hacia La Araucanía.',
      hint: 'Cruza el letrero inferior central.',
      targetCoords: { x: portalAraucania?.x ?? 9, y: portalAraucania?.y ?? 16 },
    };
  }

  if (region.id === 'araucania') {
    const npcNahuel = entities.find(e => e.id === 'npc_minero_araucania');
    const chest1 = entities.find(e => e.id === 'chest_araucania_1');
    const obstacle = entities.find(e => e.id === 'obstacle_araucania_ruta');
    const boss = entities.find(e => e.id === 'boss_araucania');

    if (!npcNahuel?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 5,
        title: 'Sendero de Araucarias',
        shortText: 'Habla con Nahuel al norte',
        instruction: 'Habla con Nahuel en la entrada norte de La Araucanía para recibir un Corazón de Basalto.',
        hint: 'Nahuel te espera al norte entre los prados verdes.',
        targetCoords: { x: npcNahuel?.x ?? 9, y: npcNahuel?.y ?? 2 },
      };
    }

    if (!chest1?.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 5,
        title: 'Tesoros del Pewén',
        shortText: 'Abre el Cofre de Piñones al noroeste',
        instruction: 'Abre el Cofre de Piñones Dorados al noroeste; junto al sendero está la Tienda de Doña Millaray.',
        hint: 'El cofre se encuentra en la pradera noroeste.',
        targetCoords: { x: chest1?.x ?? 3, y: chest1?.y ?? 2 },
      };
    }

    if (obstacle && !obstacle.cleared) {
      return {
        stepNumber: 3,
        totalSteps: 5,
        title: 'Misión Elemental: Agua',
        shortText: 'Enfría magma sur con líder AGUA',
        instruction: 'Equipa un espíritu de AGUA (ej. Ranita de Darwin) como Líder Activo y enfría la Barrera Magmática del sur.',
        hint: 'Encuentra Ranitas de Darwin bajo la lluvia fija de la región.',
        targetCoords: { x: obstacle.x, y: obstacle.y },
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 4,
        totalSteps: 5,
        title: 'La Araucaria Madre Milenaria',
        shortText: 'Desafía a la Araucaria Madre (Nv.9)',
        instruction: 'La Araucaria Madre (Nv.9) ha despertado en la plaza sur. ¡Derrótala para abrir la ruta a Los Ríos!',
        hint: 'Los ataques de Fuego multiplican el daño contra Planta.',
        targetCoords: { x: boss?.x ?? 11, y: boss?.y ?? 17 },
      };
    }

    const portalLosRios = entities.find(e => e.id === 'portal_to_losrios');
    return {
      stepNumber: 5,
      totalSteps: 5,
      title: 'Descenso a R. de Los Ríos',
      shortText: 'Cruza el portal sur a Los Ríos',
      instruction: '¡La Araucaria Madre bendice tu camino! Avanza por el portal sur hacia Los Ríos.',
      hint: 'El letrero central inferior conecta con R. de Los Ríos.',
      targetCoords: { x: portalLosRios?.x ?? 11, y: portalLosRios?.y ?? 20 },
    };
  }

  if (region.id === 'losrios') {
    const npcJaviera = entities.find(e => e.id === 'npc_javiera_losrios');
    const chest1 = entities.find(e => e.id === 'chest_losrios_1');
    const obstacle = entities.find(e => e.id === 'obstacle_losrios_ruta');
    const boss = entities.find(e => e.id === 'boss_losrios');

    if (!npcJaviera?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 5,
        title: 'Navegante de la Selva',
        shortText: 'Habla con Javiera al norte de Los Ríos',
        instruction: 'Habla con Javiera en el sendero norte para recibir Resina de Pewén.',
        hint: 'Se encuentra en el camino norte bajo la lluvia con viento.',
        targetCoords: { x: npcJaviera?.x ?? 9, y: npcJaviera?.y ?? 2 },
      };
    }

    if (!chest1?.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 5,
        title: 'Secretos de la Selva',
        shortText: 'Abre el Cofre de la Niebla al noreste',
        instruction: 'Recoge el Cofre de la Niebla Valdiviana al noreste; tienes Hospital al oeste y Santuario al este.',
        hint: 'Dirígete al claro noreste siguiendo el sendero superior.',
        targetCoords: { x: chest1?.x ?? 19, y: chest1?.y ?? 2 },
      };
    }

    if (obstacle && !obstacle.cleared) {
      return {
        stepNumber: 3,
        totalSteps: 5,
        title: 'Misión Elemental: Planta',
        shortText: 'Drena el río sur con líder PLANTA',
        instruction: 'Equipa un espíritu de PLANTA (ej. Hongo Lumínico) como Líder Activo para drenar el Desborde de Aguas del Torreón.',
        hint: 'Los Hongos Lumínicos crecen en toda la selva valdiviana.',
        targetCoords: { x: obstacle.x, y: obstacle.y },
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 4,
        totalSteps: 5,
        title: 'El Torreón del Calle-Calle',
        shortText: 'Purifica al Torreón (Nv.11) al sur',
        instruction: 'El Guardián del Torreón (Nv.11) aguarda al sur. ¡Derrótalo para abrir la ruta a Los Lagos!',
        hint: 'Usa técnicas de Planta para lograr máxima ventaja.',
        targetCoords: { x: boss?.x ?? 11, y: boss?.y ?? 17 },
      };
    }

    const portalLosLagos = entities.find(e => e.id === 'portal_to_loslagos');
    return {
      stepNumber: 5,
      totalSteps: 5,
      title: 'Travesía a R. de Los Lagos',
      shortText: 'Cruza el portal sur a Los Lagos',
      instruction: '¡Los ríos fluyen en armonía! Zarpa por el portal sur hacia R. de Los Lagos.',
      hint: 'Dirígete al portal central inferior del mapa.',
      targetCoords: { x: portalLosLagos?.x ?? 11, y: portalLosLagos?.y ?? 20 },
    };
  }

  // Stage 5: R. de Los Lagos (2 Bosses: Cai Cai Vilu & Vilu Vilu)
  const npcChecho = entities.find(e => e.id === 'npc_alercero');
  const chest1 = entities.find(e => e.id === 'chest_loslagos_1');
  const obstacle = entities.find(e => e.id === 'obstacle_loslagos_ruta');
  const bossCaiCai = entities.find(e => e.id === 'boss_loslagos_caicai');
  const bossViluVilu = entities.find(e => e.id === 'boss_loslagos_viluvilu');

  if (!npcChecho?.cleared) {
    return {
      stepNumber: 1,
      totalSteps: 5,
      title: 'Guardián del Alerce Milenario',
      shortText: 'Habla con Don Checho al norte',
      instruction: 'Habla con Don Checho en la entrada de Los Lagos para recibir Infusión de Calafate.',
      hint: 'Está junto al sendero norte bajo la tormenta austral.',
      targetCoords: { x: npcChecho?.x ?? 13, y: npcChecho?.y ?? 2 },
    };
  }

  if (!chest1?.cleared) {
    return {
      stepNumber: 2,
      totalSteps: 5,
      title: 'Provisiones Australes',
      shortText: 'Abre el Cofre Glacial al noreste',
      instruction: 'Recoge el Cofre Glacial al noreste y abastece tu equipo en la Tienda de Doña Fresia.',
      hint: 'Dirígete al extremo noreste entre los campos nevados.',
      targetCoords: { x: chest1?.x ?? 28, y: chest1?.y ?? 2 },
    };
  }

  if (obstacle && !obstacle.cleared) {
    return {
      stepNumber: 3,
      totalSteps: 5,
      title: 'Misión Elemental: Hielo',
      shortText: 'Cruza fiordo sur con líder HIELO',
      instruction: 'Equipa un espíritu de HIELO (ej. Ventisquero o Pingüino) como Líder Activo para congelar el Fiordo Helado del sur.',
      hint: 'Captura un Ventisquero o Pingüino Austral en la nieve de Los Lagos.',
      targetCoords: { x: obstacle.x, y: obstacle.y },
    };
  }

  if (!bossCaiCai?.cleared || !bossViluVilu?.cleared) {
    const nextBoss = !bossCaiCai?.cleared ? bossCaiCai : bossViluVilu;
    const remainingCount = (!bossCaiCai?.cleared ? 1 : 0) + (!bossViluVilu?.cleared ? 1 : 0);
    return {
      stepNumber: 4,
      totalSteps: 5,
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
          ? '¡Solo falta derrotar a Cai Cai Vilu (Nv.13) al suroeste!'
          : '¡Solo falta derrotar a Vilu Vilu (Nv.14) al sureste!',
      hint: 'Usa Planta contra Cai Cai Vilu y Agua contra Vilu Vilu.',
      targetCoords: { x: nextBoss?.x ?? 14, y: nextBoss?.y ?? 25 },
    };
  }

  return {
    stepNumber: 5,
    totalSteps: 5,
    title: 'Expedición Libre de Chile',
    shortText: 'Explora las 5 regiones y completa tu Bestiario',
    instruction: '¡La armonía elemental brilla desde R. Metropolitana hasta Los Lagos! Sigue capturando especies y evoluciones del Bestiario.',
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
    const chest1 = entities.find(e => e.id === 'chest_santiago_1');
    const chest2 = entities.find(e => e.id === 'chest_santiago_2');
    const obstacle = entities.find(e => e.id === 'obstacle_santiago_ruta');
    return Boolean(npcIgnacio?.cleared && chest1?.cleared && chest2?.cleared && (!obstacle || obstacle.cleared));
  }
  if (region.id === 'biobio') {
    const npcLautaro = entities.find(e => e.id === 'npc_lautaro_biobio');
    const chest1 = entities.find(e => e.id === 'chest_biobio_1');
    const obstacle = entities.find(e => e.id === 'obstacle_biobio_ruta');
    return Boolean(npcLautaro?.cleared && chest1?.cleared && (!obstacle || obstacle.cleared));
  }
  if (region.id === 'araucania') {
    const npcNahuel = entities.find(e => e.id === 'npc_minero_araucania');
    const chest1 = entities.find(e => e.id === 'chest_araucania_1');
    const obstacle = entities.find(e => e.id === 'obstacle_araucania_ruta');
    return Boolean(npcNahuel?.cleared && chest1?.cleared && (!obstacle || obstacle.cleared));
  }
  if (region.id === 'losrios') {
    const npcJaviera = entities.find(e => e.id === 'npc_javiera_losrios');
    const chest1 = entities.find(e => e.id === 'chest_losrios_1');
    const obstacle = entities.find(e => e.id === 'obstacle_losrios_ruta');
    return Boolean(npcJaviera?.cleared && chest1?.cleared && (!obstacle || obstacle.cleared));
  }
  if (region.id === 'loslagos') {
    const npcChecho = entities.find(e => e.id === 'npc_alercero');
    const chest1 = entities.find(e => e.id === 'chest_loslagos_1');
    const obstacle = entities.find(e => e.id === 'obstacle_loslagos_ruta');
    return Boolean(npcChecho?.cleared && chest1?.cleared && (!obstacle || obstacle.cleared));
  }
  return true;
}
