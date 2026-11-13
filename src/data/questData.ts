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
        hint: 'Puedes descansar en tu cama cuando quieras y luego cruzar la puerta sur hacia la Región Metropolitana.',
        targetCoords: { x: npcMama?.x ?? 7, y: npcMama?.y ?? 3 }
      };
    }
    return {
      stepNumber: 2,
      totalSteps: 2,
      title: 'Inicio de la Travesía',
      shortText: 'Sal por la puerta sur a Región Metropolitana',
      instruction: 'Cruza la puerta principal al sur de tu casa para comenzar tu viaje por las regiones de Chile.',
      hint: 'Camina al portal inferior y toca ACCIÓN para salir al Valle de Santiago.',
      targetCoords: { x: portalRM?.x ?? 7, y: portalRM?.y ?? 11 }
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
        shortText: 'Habla con Don Ignacio al norte',
        instruction: 'Habla con Don Ignacio (al centro norte) para recibir tus primeros Amuletos de Vínculo y Ungüentos de Matico.',
        hint: 'Muévete con la cruceta táctil hasta Don Ignacio y toca ACCIÓN.',
        targetCoords: { x: npcIgnacio?.x ?? 12, y: npcIgnacio?.y ?? 2 }
      };
    }

    if (!chest1?.cleared || !chest2?.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 4,
        title: 'Equipa tu Mochila',
        shortText: 'Abre los cofres del Parque y San Cristóbal',
        instruction: 'Abre los cofres del Parque Forestal y del Cerro San Cristóbal para conseguir amuletos de vínculo y Resina de Pewén.',
        hint: 'Acércate a los cofres dorados indicados con la flecha amarilla y toca ACCIÓN.',
        targetCoords: { x: !chest1?.cleared ? (chest1?.x ?? 3) : (chest2?.x ?? 22), y: !chest1?.cleared ? (chest1?.y ?? 3) : (chest2?.y ?? 3) }
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 3,
        totalSteps: 4,
        title: 'El Coloso del Valle Central',
        shortText: 'Derrota al Costanera Center (Nv.5) al sur',
        instruction: 'El Edificio Costanera Center (Nv.5) ha despertado en el santuario del sur. ¡Derrótalo para abrir el camino a Biobío!',
        hint: 'Aprovecha el Agua o Planta contra su tipo Tierra y sube de nivel en el valle.',
        targetCoords: { x: boss?.x ?? 12, y: boss?.y ?? 16 }
      };
    }

    const portalBiobio = entities.find(e => e.id === 'portal_to_biobio');
    return {
      stepNumber: 4,
      totalSteps: 4,
      title: 'Hacia la Región del Biobío',
      shortText: 'Cruza el portal sur hacia el Biobío',
      instruction: '¡El camino a la Región del Biobío está despejado! Cruza el portal sur o usa el Mapa para viajar.',
      hint: 'Dirígete al letrero de madera en la parte inferior del mapa y toca ACCIÓN.',
      targetCoords: { x: portalBiobio?.x ?? 12, y: portalBiobio?.y ?? 19 }
    };
  }

  if (region.id === 'biobio') {
    const npcLautaro = entities.find(e => e.id === 'npc_lautaro_biobio');
    const obstacle = entities.find(e => e.id === 'obstacle_biobio');
    const boss = entities.find(e => e.id === 'boss_biobio');

    if (!npcLautaro?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 4,
        title: 'El Guía del Salto del Laja',
        shortText: 'Habla con Lautaro al norte del Biobío',
        instruction: 'Habla con Lautaro en el sendero norte para recibir Gotas Termales y orientación sobre la flora del Biobío.',
        hint: 'Acércate a Lautaro junto al camino de piedra y toca ACCIÓN.',
        targetCoords: { x: npcLautaro?.x ?? 9, y: npcLautaro?.y ?? 2 }
      };
    }

    if (!obstacle?.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 4,
        title: 'Sosiega los Saltos del Laja',
        shortText: 'Calma el torrente con espíritu de AGUA',
        instruction: 'Apacigua la corriente desbordada en el puente central llevando un espíritu de AGUA o HIELO como líder.',
        hint: 'Asigna tu espíritu acuático como líder en Equipo y toca ACCIÓN.',
        targetCoords: { x: obstacle?.x ?? 12, y: obstacle?.y ?? 8 }
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 3,
        totalSteps: 4,
        title: 'El Rey Prehistórico del Biobío',
        shortText: 'Derrota al T-Rex del Biobío (Nv.7) al sur',
        instruction: 'El T-Rex Tirano del Biobío (Nv.7) aguarda junto a su Maestro Vínculo en el sur. ¡Supera su prueba para avanzar hacia La Araucanía!',
        hint: 'Las técnicas de Agua tienen doble ventaja contra su afinidad Fuego/Tierra.',
        targetCoords: { x: boss?.x ?? 12, y: boss?.y ?? 16 }
      };
    }

    const portalAraucania = entities.find(e => e.id === 'portal_to_araucania');
    return {
      stepNumber: 4,
      totalSteps: 4,
      title: 'Rumbo a La Araucanía',
      shortText: 'Cruza el portal sur a La Araucanía',
      instruction: '¡Has armonizado el Biobío! Avanza por el portal sur hacia los bosques otoñales de La Araucanía.',
      hint: 'Cruza el letrero inferior para ingresar a La Araucanía.',
      targetCoords: { x: portalAraucania?.x ?? 12, y: portalAraucania?.y ?? 19 }
    };
  }

  if (region.id === 'araucania') {
    const npcNahuel = entities.find(e => e.id === 'npc_minero_araucania');
    const obstacle = entities.find(e => e.id === 'obstacle_araucania');
    const boss = entities.find(e => e.id === 'boss_araucania');

    if (!npcNahuel?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 4,
        title: 'El Herrero del Ruka Pillán',
        shortText: 'Habla con Nahuel en el sendero norte',
        instruction: 'Habla con Nahuel en las faldas de La Araucanía para recibir Corazones de Basalto.',
        hint: 'Nahuel te espera al noroeste entre las hojas otoñales y rocas volcánicas.',
        targetCoords: { x: npcNahuel?.x ?? 6, y: npcNahuel?.y ?? 2 }
      };
    }

    if (!obstacle?.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 4,
        title: 'Enfría la Roca Magmática',
        shortText: 'Enfría la roca con espíritu de AGUA',
        instruction: 'Enfría la gran roca incandescente del paso central usando un espíritu de AGUA o HIELO como líder.',
        hint: 'Coloca tu espíritu acuático como líder en Equipo y toca ACCIÓN junto a la roca.',
        targetCoords: { x: obstacle?.x ?? 12, y: obstacle?.y ?? 10 }
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 3,
        totalSteps: 4,
        title: 'La Araucaria Madre Milenaria',
        shortText: 'Desafía a la Araucaria Madre (Nv.9) al sur',
        instruction: 'La Araucaria Madre (Nv.9) ha despertado en el santuario otoñal. ¡Desafíala para abrir el paso hacia Los Ríos!',
        hint: 'Los ataques de Fuego multiplican el daño contra Planta.',
        targetCoords: { x: boss?.x ?? 12, y: boss?.y ?? 16 }
      };
    }

    const portalLosRios = entities.find(e => e.id === 'portal_to_losrios');
    return {
      stepNumber: 4,
      totalSteps: 4,
      title: 'Descenso a Los Ríos',
      shortText: 'Cruza el portal sur a Los Ríos',
      instruction: '¡La Araucaria Madre bendice tu camino! Avanza por el portal sur hacia la selva valdiviana de Los Ríos.',
      hint: 'El portal inferior conecta con la Región de Los Ríos.',
      targetCoords: { x: portalLosRios?.x ?? 12, y: portalLosRios?.y ?? 19 }
    };
  }

  if (region.id === 'losrios') {
    const npcJaviera = entities.find(e => e.id === 'npc_javiera_losrios');
    const obstacle = entities.find(e => e.id === 'obstacle_losrios');
    const boss = entities.find(e => e.id === 'boss_losrios');

    if (!npcJaviera?.cleared) {
      return {
        stepNumber: 1,
        totalSteps: 4,
        title: 'Navegante de la Selva Nocturna',
        shortText: 'Habla con Javiera al norte de Los Ríos',
        instruction: 'Habla con Javiera junto al sendero para conocer los hongos bioluminiscentes y recibir Esencias de Pewén.',
        hint: 'Se encuentra en el camino norte bajo la lluvia mansa.',
        targetCoords: { x: npcJaviera?.x ?? 8, y: npcJaviera?.y ?? 2 }
      };
    }

    if (!obstacle?.cleared) {
      return {
        stepNumber: 2,
        totalSteps: 4,
        title: 'Armoniza el Calle-Calle',
        shortText: 'Cruza el caudal con espíritu de AGUA',
        instruction: 'Calma el caudal furioso del puente central con un espíritu de AGUA o HIELO como líder.',
        hint: 'Asigna tu espíritu acuático como líder en Equipo antes de acercarte al torrente.',
        targetCoords: { x: obstacle?.x ?? 12, y: obstacle?.y ?? 8 }
      };
    }

    if (!boss?.cleared) {
      return {
        stepNumber: 3,
        totalSteps: 4,
        title: 'El Torreón del Calle-Calle',
        shortText: 'Purifica al Torreón (Nv.11) al sur',
        instruction: 'El Torreón del Calle-Calle (Nv.11) aguarda entre faroles luminosos al sur. ¡Purifícalo para abrir la ruta a Los Lagos!',
        hint: 'Usa técnicas de Planta para lograr máxima ventaja contra Tierra y Agua.',
        targetCoords: { x: boss?.x ?? 12, y: boss?.y ?? 16 }
      };
    }

    const portalLosLagos = entities.find(e => e.id === 'portal_to_loslagos');
    return {
      stepNumber: 4,
      totalSteps: 4,
      title: 'Travesía a Los Lagos',
      shortText: 'Cruza el portal sur a Los Lagos',
      instruction: '¡Los ríos fluyen en armonía! Zarpa por el portal sur hacia Hornopirén y la Región de Los Lagos.',
      hint: 'Dirígete al portal inferior del mapa.',
      targetCoords: { x: portalLosLagos?.x ?? 12, y: portalLosLagos?.y ?? 19 }
    };
  }

  // Stage 5: Región de Los Lagos (2 Bosses: Cai Cai Vilu & Vilu Vilu)
  const npcChecho = entities.find(e => e.id === 'npc_alercero');
  const obstacle = entities.find(e => e.id === 'obstacle_loslagos');
  const bossCaiCai = entities.find(e => e.id === 'boss_loslagos_caicai');
  const bossViluVilu = entities.find(e => e.id === 'boss_loslagos_viluvilu');

  if (!npcChecho?.cleared) {
    return {
      stepNumber: 1,
      totalSteps: 4,
      title: 'El Guardián del Alerce Milenario',
      shortText: 'Habla con Don Checho al oeste',
      instruction: 'Habla con Don Checho junto a los alerces milenarios de Los Lagos para recibir infusión de calafate.',
      hint: 'Se encuentra en el claro occidental entre ventisqueros y pingüinos.',
      targetCoords: { x: npcChecho?.x ?? 7, y: npcChecho?.y ?? 3 }
    };
  }

  if (!obstacle?.cleared) {
    return {
      stepNumber: 2,
      totalSteps: 4,
      title: 'Funde el Muro Glaciar',
      shortText: 'Funde el muro glaciar con FUEGO',
      instruction: 'Derrite el muro de hielo azul llevando un espíritu de FUEGO como líder.',
      hint: 'Asigna a Pillancito o Loica como líder en Equipo y toca ACCIÓN.',
      targetCoords: { x: obstacle?.x ?? 12, y: obstacle?.y ?? 9 }
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
          ? '¡Solo falta purificar a Cai Cai Vilu (Nv.13) en el costado oeste del Santuario!'
          : '¡Solo falta purificar a Vilu Vilu (Nv.14) en el costado este del Santuario!',
      hint: 'Usa Planta contra Cai Cai Vilu (Agua/Hielo) y Agua contra Vilu Vilu (Tierra/Fuego).',
      targetCoords: { x: nextBoss?.x ?? 7, y: nextBoss?.y ?? 16 }
    };
  }

  return {
    stepNumber: 4,
    totalSteps: 4,
    title: 'Expedición Libre de Chile',
    shortText: 'Explora las 5 regiones y completa tu Bestiario',
    instruction: '¡La armonía elemental brilla desde la Región Metropolitana hasta Los Lagos! Sigue vinculando y evolucionando espíritus.',
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
    return Boolean(npcIgnacio?.cleared && (chest1?.cleared || chest2?.cleared));
  }
  if (region.id === 'biobio') {
    const npcLautaro = entities.find(e => e.id === 'npc_lautaro_biobio');
    const obstacle = entities.find(e => e.id === 'obstacle_biobio');
    return Boolean(npcLautaro?.cleared && obstacle?.cleared);
  }
  if (region.id === 'araucania') {
    const npcNahuel = entities.find(e => e.id === 'npc_minero_araucania');
    const obstacle = entities.find(e => e.id === 'obstacle_araucania');
    return Boolean(npcNahuel?.cleared && obstacle?.cleared);
  }
  if (region.id === 'losrios') {
    const npcJaviera = entities.find(e => e.id === 'npc_javiera_losrios');
    const obstacle = entities.find(e => e.id === 'obstacle_losrios');
    return Boolean(npcJaviera?.cleared && obstacle?.cleared);
  }
  if (region.id === 'loslagos') {
    const npcChecho = entities.find(e => e.id === 'npc_alercero');
    const obstacle = entities.find(e => e.id === 'obstacle_loslagos');
    return Boolean(npcChecho?.cleared && obstacle?.cleared);
  }
  return true;
}
