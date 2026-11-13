/**
 * Quest & Objective Guide System for Crónicas Elementales del Sur (5 Chilean Regions)
 */

import { RegionId, MapRegion } from '../types/game';

export interface QuestStep {
  id: string;
  regionId: RegionId;
  title: string;
  description: string;
  hint: string;
  targetCoords?: { x: number; y: number };
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

  if (region.id === 'casa') {
    const npcMama = entities.find(e => e.id === 'npc_mama_casa');
    const portalRM = entities.find(e => e.id === 'portal_casa_to_santiago');
    if (!npcMama?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 2,
        title: 'Tu Hogar (Escenario 0)',
        shortText: 'Habla con Mamá Elena o sal por la puerta',
        instruction: 'Despídete de Mamá Elena en la sala o revisa tu Diario de Expedición antes de salir por la puerta sur.',
        hint: 'Puedes descansar en tu cama cuando quieras y cruzar la puerta sur hacia la Región Metropolitana.',
        targetCoords: { x: npcMama?.x ?? 8, y: npcMama?.y ?? 4 }
      };
    }
    return {
      stepNumber: 2,
      totalSteps: 2,
      title: 'Inicio de la Travesía',
      shortText: 'Sal por la puerta sur a Región Metropolitana',
      instruction: 'Cruza la puerta principal al sur de tu casa para comenzar tu viaje por las regiones de Chile.',
      hint: 'Camina al letrero central de la puerta sur y toca ACCIÓN.',
      targetCoords: { x: portalRM?.x ?? 8, y: portalRM?.y ?? 11 }
    };
  }

  if (region.id === 'santiago') {
    const npcIgnacio = entities.find(e => e.id === 'npc_profesor');
    const chest1 = entities.find(e => e.id === 'chest_santiago_1');
    const chest2 = entities.find(e => e.id === 'chest_santiago_2');
    const boss = entities.find(e => e.id === 'boss_santiago');

    if (!npcIgnacio?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 4,
        title: 'El Despertar en la Región Metropolitana',
        shortText: 'Habla con Don Ignacio frente a tu casa',
        instruction: 'Habla con Don Ignacio al norte para recibir tus primeros Amuletos de Vínculo.',
        hint: 'Acércate a Don Ignacio frente a tu casa y toca ACCIÓN.',
        targetCoords: { x: npcIgnacio?.x ?? 13, y: npcIgnacio?.y ?? 4 }
      };
    }

    if (!chest1?.cleared || !chest2?.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 4,
        title: 'Equipa tu Mochila',
        shortText: 'Abre los cofres del Parque y San Cristóbal',
        instruction: 'Abre los cofres del Parque Forestal (oeste) y San Cristóbal (este) para equiparte.',
        hint: 'En el camino tienes además una Tienda al oeste y un Hospital gratuito al este.',
        targetCoords: { x: !chest1?.cleared ? (chest1?.x ?? 3) : (chest2?.x ?? 21), y: !chest1?.cleared ? (chest1?.y ?? 2) : (chest2?.y ?? 2) }
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 3,
        totalSteps: 4,
        title: 'El Coloso del Valle Central',
        shortText: 'Derrota al Costanera Center (Nv.5) al sur',
        instruction: 'El Edificio Costanera Center (Nv.5) ha despertado al sur. ¡Derrótalo para abrir la ruta al Biobío!',
        hint: 'Al derrotarlo, el Maestro Vínculo te otorgará la Medalla Valle Central.',
        targetCoords: { x: boss?.x ?? 13, y: boss?.y ?? 16 }
      };
    }

    const portalBiobio = entities.find(e => e.id === 'portal_to_biobio');
    return {
      stepNumber: 4,
      totalSteps: 4,
      title: 'Hacia la Región del Biobío',
      shortText: 'Cruza el portal sur hacia el Biobío',
      instruction: '¡El camino a la Región del Biobío está despejado! Cruza el portal sur o usa el Mapa.',
      hint: 'Dirígete al letrero central del corredor sur y toca ACCIÓN.',
      targetCoords: { x: portalBiobio?.x ?? 13, y: portalBiobio?.y ?? 20 }
    };
  }

  if (region.id === 'biobio') {
    const npcLautaro = entities.find(e => e.id === 'npc_lautaro_biobio');
    const chest1 = entities.find(e => e.id === 'chest_biobio_1');
    const boss = entities.find(e => e.id === 'boss_biobio');

    if (!npcLautaro?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 4,
        title: 'El Guía del Salto del Laja',
        shortText: 'Habla con Lautaro al norte del Biobío',
        instruction: 'Habla con Lautaro al norte para recibir Gotas Termales y conocer la zona jurásica.',
        hint: 'Acércate a Lautaro junto al camino de piedra y toca ACCIÓN.',
        targetCoords: { x: npcLautaro?.x ?? 10, y: npcLautaro?.y ?? 3 }
      };
    }

    if (!chest1?.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 4,
        title: 'Provisiones Jurásicas',
        shortText: 'Abre el Cofre del Claro Jurásico al noreste',
        instruction: 'Recoge el cofre en el claro prehistórico al noreste; cerca hallarás también el Santuario de Evolución.',
        hint: 'Sigue el sendero curvo hacia el este y luego sube al claro norte.',
        targetCoords: { x: chest1?.x ?? 23, y: chest1?.y ?? 1 }
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 3,
        totalSteps: 4,
        title: 'El Rey Prehistórico del Biobío',
        shortText: 'Derrota al T-Rex del Biobío (Nv.7) al sur',
        instruction: 'El T-Rex Tirano del Biobío (Nv.7) aguarda en la arena sur. ¡Derrótalo para avanzar a La Araucanía!',
        hint: 'Puedes usar el Santuario de Evolución del este para fortalecer antes a tu equipo.',
        targetCoords: { x: boss?.x ?? 13, y: boss?.y ?? 16 }
      };
    }

    const portalAraucania = entities.find(e => e.id === 'portal_to_araucania');
    return {
      stepNumber: 4,
      totalSteps: 4,
      title: 'Rumbo a La Araucanía',
      shortText: 'Cruza el portal sur a La Araucanía',
      instruction: '¡Has armonizado el Biobío! Avanza por el corredor sur hacia La Araucanía.',
      hint: 'Cruza el letrero inferior central para ingresar a La Araucanía.',
      targetCoords: { x: portalAraucania?.x ?? 13, y: portalAraucania?.y ?? 20 }
    };
  }

  if (region.id === 'araucania') {
    const npcNahuel = entities.find(e => e.id === 'npc_minero_araucania');
    const chest1 = entities.find(e => e.id === 'chest_araucania_1');
    const boss = entities.find(e => e.id === 'boss_araucania');

    if (!npcNahuel?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 4,
        title: 'Sendero de Araucarias',
        shortText: 'Habla con Nahuel en el sendero norte',
        instruction: 'Habla con Nahuel en la entrada norte de La Araucanía para recibir un Corazón de Basalto.',
        hint: 'Nahuel te espera al norte entre los prados verdes.',
        targetCoords: { x: npcNahuel?.x ?? 10, y: npcNahuel?.y ?? 3 }
      };
    }

    if (!chest1?.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 4,
        title: 'Tesoros del Pewén',
        shortText: 'Abre el Cofre de Piñones al noroeste',
        instruction: 'Abre el Cofre de Piñones Dorados al noroeste. Recuerda que también tienes Tienda y Hospital bajo techo.',
        hint: 'El cofre se encuentra en la pradera noroeste; vuelve luego al sendero central.',
        targetCoords: { x: chest1?.x ?? 2, y: chest1?.y ?? 1 }
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 3,
        totalSteps: 4,
        title: 'La Araucaria Madre Milenaria',
        shortText: 'Desafía a la Araucaria Madre (Nv.9) al sur',
        instruction: 'La Araucaria Madre (Nv.9) ha despertado en la plaza sur. ¡Derrótala para abrir la ruta hacia Los Ríos!',
        hint: 'Los ataques de Fuego multiplican el daño contra Planta.',
        targetCoords: { x: boss?.x ?? 13, y: boss?.y ?? 16 }
      };
    }

    const portalLosRios = entities.find(e => e.id === 'portal_to_losrios');
    return {
      stepNumber: 4,
      totalSteps: 4,
      title: 'Descenso a Los Ríos',
      shortText: 'Cruza el portal sur a Los Ríos',
      instruction: '¡La Araucaria Madre bendice tu camino! Avanza por el portal sur hacia Los Ríos.',
      hint: 'El letrero central inferior conecta con la Región de Los Ríos.',
      targetCoords: { x: portalLosRios?.x ?? 13, y: portalLosRios?.y ?? 20 }
    };
  }

  if (region.id === 'losrios') {
    const npcJaviera = entities.find(e => e.id === 'npc_javiera_losrios');
    const chest1 = entities.find(e => e.id === 'chest_losrios_1');
    const boss = entities.find(e => e.id === 'boss_losrios');

    if (!npcJaviera?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 4,
        title: 'Navegante de la Selva Nocturna',
        shortText: 'Habla con Javiera al norte de Los Ríos',
        instruction: 'Habla con Javiera en el sendero norte para recibir Resina de Pewén y pistas de la selva valdiviana.',
        hint: 'Se encuentra en el camino norte bajo la lluvia con viento.',
        targetCoords: { x: npcJaviera?.x ?? 9, y: npcJaviera?.y ?? 2 }
      };
    }

    if (!chest1?.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 4,
        title: 'Secretos de la Selva',
        shortText: 'Abre el Cofre de la Niebla al noreste',
        instruction: 'Recoge el Cofre de la Niebla Valdiviana al noreste y visita el Santuario de Evolución si lo deseas.',
        hint: 'Dirígete al claro noreste siguiendo el sendero superior.',
        targetCoords: { x: chest1?.x ?? 25, y: chest1?.y ?? 1 }
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 3,
        totalSteps: 4,
        title: 'El Torreón del Calle-Calle',
        shortText: 'Purifica al Torreón (Nv.11) al sur',
        instruction: 'El Guardián del Torreón (Nv.11) aguarda al sur de los puentes del Calle-Calle. ¡Derrótalo para abrir la ruta a Los Lagos!',
        hint: 'Usa técnicas de Planta para lograr máxima ventaja contra Tierra y Agua.',
        targetCoords: { x: boss?.x ?? 13, y: boss?.y ?? 16 }
      };
    }

    const portalLosLagos = entities.find(e => e.id === 'portal_to_loslagos');
    return {
      stepNumber: 4,
      totalSteps: 4,
      title: 'Travesía a Los Lagos',
      shortText: 'Cruza el portal sur a Los Lagos',
      instruction: '¡Los ríos fluyen en armonía! Zarpa por el portal sur hacia la Región de Los Lagos.',
      hint: 'Dirígete al portal central inferior del mapa.',
      targetCoords: { x: portalLosLagos?.x ?? 13, y: portalLosLagos?.y ?? 20 }
    };
  }

  // Stage 5: Región de Los Lagos (2 Bosses: Cai Cai Vilu & Vilu Vilu)
  const npcChecho = entities.find(e => e.id === 'npc_alercero');
  const chest1 = entities.find(e => e.id === 'chest_loslagos_1');
  const bossCaiCai = entities.find(e => e.id === 'boss_loslagos_caicai');
  const bossViluVilu = entities.find(e => e.id === 'boss_loslagos_viluvilu');

  if (!npcChecho?.cleared) {
    return {
      stepNumber: 1,
      totalSteps: 4,
      title: 'El Guardián del Alerce Milenario',
      shortText: 'Habla con Don Checho al norte',
      instruction: 'Habla con Don Checho en la entrada de Los Lagos para recibir Infusión de Calafate.',
      hint: 'Está junto al sendero norte bajo la tormenta austral.',
      targetCoords: { x: npcChecho?.x ?? 9, y: npcChecho?.y ?? 2 }
    };
  }

  if (!chest1?.cleared) {
    return {
      stepNumber: 2,
      totalSteps: 4,
      title: 'Provisiones Australes',
      shortText: 'Abre el Cofre Glacial al noreste',
      instruction: 'Recoge el Cofre Glacial de Hornopirén al noreste y abastece tu equipo en la Tienda de Doña Fresia.',
      hint: 'Dirígete al extremo noreste entre los campos nevados.',
      targetCoords: { x: chest1?.x ?? 24, y: chest1?.y ?? 1 }
    };
  }

  if (!bossCaiCai?.cleared || !bossViluVilu?.cleared) {
    const nextBoss = !bossCaiCai?.cleared ? bossCaiCai : bossViluVilu;
    const remainingCount = (!bossCaiCai?.cleared ? 1 : 0) + (!bossViluVilu?.cleared ? 1 : 0);
    return {
      stepNumber: 3,
      totalSteps: 4,
      title: 'Las Dos Serpientes de Los Lagos',
      shortText: remainingCount === 2
        ? 'Derrota a Cai Cai (Nv.13) y Vilu Vilu (Nv.14)'
        : !bossCaiCai?.cleared
          ? 'Derrota a Cai Cai Vilu (Nv.13) al oeste'
          : 'Derrota a Vilu Vilu (Nv.14) al este',
      instruction: remainingCount === 2
        ? '¡En el Santuario Austral esperan las dos serpientes míticas: Cai Cai Vilu (oeste, Nv.13) y Vilu Vilu (este, Nv.14)!'
        : !bossCaiCai?.cleared
          ? '¡Solo falta derrotar a Cai Cai Vilu (Nv.13) al suroeste!'
          : '¡Solo falta derrotar a Vilu Vilu (Nv.14) al sureste!',
      hint: 'Usa Planta contra Cai Cai Vilu y Agua contra Vilu Vilu.',
      targetCoords: { x: nextBoss?.x ?? 8, y: nextBoss?.y ?? 16 }
    };
  }

  return {
    stepNumber: 4,
    totalSteps: 4,
    title: 'Expedición Libre de Chile',
    shortText: 'Explora las 5 regiones y completa tu Bestiario',
    instruction: '¡La armonía elemental brilla desde la Región Metropolitana hasta Los Lagos! Sigue capturando y evolucionando espíritus.',
    hint: 'Usa el Mapa para viajar libremente entre las 5 regiones cuando quieras.'
  };
}

/**
 * Checks whether the regional boss(es) of the current stage unlocked after prerequisite missions
 */
export function isStageBossAwakened(region: MapRegion, hasCompletedStory: boolean = false): boolean {
  if (hasCompletedStory) return true;
  if (region.id === 'casa') return true;
  const entities = region.entities;
  if (region.id === 'santiago') {
    const npcIgnacio = entities.find(e => e.id === 'npc_profesor');
    const chest1 = entities.find(e => e.id === 'chest_santiago_1');
    const chest2 = entities.find(e => e.id === 'chest_santiago_2');
    return Boolean(npcIgnacio?.cleared && chest1?.cleared && chest2?.cleared);
  }
  if (region.id === 'biobio') {
    const npcLautaro = entities.find(e => e.id === 'npc_lautaro_biobio');
    const chest1 = entities.find(e => e.id === 'chest_biobio_1');
    return Boolean(npcLautaro?.cleared && chest1?.cleared);
  }
  if (region.id === 'araucania') {
    const npcNahuel = entities.find(e => e.id === 'npc_minero_araucania');
    const chest1 = entities.find(e => e.id === 'chest_araucania_1');
    return Boolean(npcNahuel?.cleared && chest1?.cleared);
  }
  if (region.id === 'losrios') {
    const npcJaviera = entities.find(e => e.id === 'npc_javiera_losrios');
    const chest1 = entities.find(e => e.id === 'chest_losrios_1');
    return Boolean(npcJaviera?.cleared && chest1?.cleared);
  }
  if (region.id === 'loslagos') {
    const npcChecho = entities.find(e => e.id === 'npc_alercero');
    const chest1 = entities.find(e => e.id === 'chest_loslagos_1');
    return Boolean(npcChecho?.cleared && chest1?.cleared);
  }
  return true;
}
