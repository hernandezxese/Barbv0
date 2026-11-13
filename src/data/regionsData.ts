/**
 * World Maps & Chilean Regions Repository (Stage 0 Casa + 5 Chilean Biogeographic Regions + Interiors)
 *
 * Scaled Map Dimensions:
 * - Interiors (Muy pequeños): casa, hospital, santuario, tienda -> 11×9
 * - Stage 2 (Pequeño): biobio -> 19×17
 * - Stages 3 & 4 (Medianos): araucania, losrios -> 23×21
 * - Stage 1 (Grande): santiago -> 27×25
 * - Stage 5 (Muy grande): loslagos -> 33×29
 *
 * Geographic Borders (All 5 Outdoor Stages):
 * - West border (col x = 0): Pacific Ocean (tile 2)
 * - East border (col x = width - 1): Andes Cordillera (tile 3)
 *
 * Tile Legend:
 * 0 = Ground / Region Grass / Rock Base (1% - 3% encounter)
 * 1 = Winding Stone / Dirt Trail / Bridges (0% encounter)
 * 2 = Water / Pacific Ocean / River / Fjord (impassable)
 * 3 = Mountain / Andes Cordillera / Cliff / Wall Barrier (impassable)
 * 4 = Forest / Dense Tree (impassable)
 * 5 = Volcanic Lava Pocket (impassable)
 * 6 = Snow / Ice High Plains (1% - 3% encounter)
 * 7 = Wildflowers / Ferns / Crops (1% - 3% encounter)
 * 8 = Building / Wall / Interior Structure (impassable)
 * 9 = Prehistoric / Amber Earth (1% - 3% encounter)
 * 10 = Indoor Safe Room Floor (Casa / Hospital / Santuario / Tienda - 0% encounter)
 * 11 = Railway Tracks / Línea de Tren (Biobío - 0% encounter, walkable)
 */

import { MapRegion, RegionId } from '../types/game';

function createGrid(width: number, height: number, fill = 0): number[][] {
  return Array.from({ length: height }, () => Array(width).fill(fill));
}

function setTile(grid: number[][], x: number, y: number, tile: number) {
  if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
    grid[y][x] = tile;
  }
}

function fillRect(grid: number[][], x1: number, y1: number, x2: number, y2: number, tile: number) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      setTile(grid, x, y, tile);
    }
  }
}

function drawHLine(grid: number[][], x1: number, x2: number, y: number, tile: number) {
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let x = start; x <= end; x++) {
    setTile(grid, x, y, tile);
  }
}

function drawVLine(grid: number[][], x: number, y1: number, y2: number, tile: number) {
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let y = start; y <= end; y++) {
    setTile(grid, x, y, tile);
  }
}

/**
 * Applies geographic Chilean borders to outdoor stages:
 * Top & bottom cliff walls (3) with optional portal gaps,
 * West column (x = 0) -> Pacific Ocean (2),
 * East column (x = width - 1) -> Andes Cordillera (3).
 */
function applyChileanBorders(grid: number[][]) {
  const h = grid.length;
  const w = grid[0].length;
  for (let x = 0; x < w; x++) {
    grid[0][x] = 3;
    grid[h - 1][x] = 3;
  }
  for (let y = 0; y < h; y++) {
    grid[y][0] = 2; // Pacific Ocean on the West
    grid[y][w - 1] = 3; // Andes Cordillera on the East
  }
}

/**
 * Builds a compact 3×3 Boss Enclosure near the south wall (rows wallY..h-1).
 * Gate sits at (cx, wallY) blocked by the elemental mission obstacle.
 * Interior 3×3 walkable chamber sits at x: cx-1..cx+1, y: wallY+1..wallY+3.
 */
function carveCompactBossEnclosure3x3(
  grid: number[][],
  cx: number,
  wallY: number,
  hasSouthExitPortal = true
) {
  const h = grid.length;
  const w = grid[0].length;
  // Wall separating main map from southern boss sanctuary
  drawHLine(grid, 1, w - 2, wallY, 3);
  setTile(grid, cx, wallY, 1); // Gate tile (obstacle stands here)

  // Compact 3x3 arena box + thick flanking walls
  fillRect(grid, 1, wallY + 1, w - 2, h - 1, 3);
  fillRect(grid, cx - 2, wallY + 1, cx + 2, h - 1, 3);
  fillRect(grid, cx - 1, wallY + 1, cx + 1, wallY + 3, 1);

  if (hasSouthExitPortal && wallY + 4 < h) {
    setTile(grid, cx, wallY + 4, 1);
    if (wallY + 5 < h) setTile(grid, cx, h - 1, 1);
  }
}

/**
 * Builds a compact 5×3 Twin-Boss Enclosure for Los Lagos (Cai Cai & Vilu Vilu).
 */
function carveCompactTwinEnclosure5x3(grid: number[][], cx: number, wallY: number) {
  const h = grid.length;
  const w = grid[0].length;
  drawHLine(grid, 1, w - 2, wallY, 3);
  setTile(grid, cx, wallY, 1); // Gate tile

  fillRect(grid, 1, wallY + 1, w - 2, h - 1, 3);
  // 5x3 walkable chamber: x = cx-2..cx+2, y = wallY+1..wallY+3
  fillRect(grid, cx - 2, wallY + 1, cx + 2, wallY + 3, 1);
  // Decorative southern fjord waters visible outside
  setTile(grid, cx, wallY + 3, 2);
}

// ============================================================================
// 0. CASA (11×9 - Muy pequeño)
// ============================================================================
const casaTiles = (() => {
  const g = createGrid(11, 9, 10);
  for (let x = 0; x < 11; x++) {
    g[0][x] = 8;
    g[8][x] = 8;
  }
  for (let y = 0; y < 9; y++) {
    g[y][0] = 8;
    g[y][10] = 8;
  }
  // Cozy central rug
  fillRect(g, 3, 4, 7, 5, 1);
  drawVLine(g, 5, 5, 8, 1);
  return g;
})();

// ============================================================================
// INTERIORES: HOSPITAL, SANTUARIO, TIENDA (11×9 - Muy pequeños)
// ============================================================================
function buildSmallInteriorGrid(): number[][] {
  const g = createGrid(11, 9, 10);
  for (let x = 0; x < 11; x++) {
    g[0][x] = 8;
    g[8][x] = 8;
  }
  for (let y = 0; y < 9; y++) {
    g[y][0] = 8;
    g[y][10] = 8;
  }
  g[8][5] = 10; // Exit door at (5, 8)
  return g;
}

const hospitalTiles = buildSmallInteriorGrid();
const santuarioTiles = buildSmallInteriorGrid();
const tiendaTiles = buildSmallInteriorGrid();

// ============================================================================
// 1. REGIÓN METROPOLITANA / SANTIAGO (27×25 - Grande)
// ============================================================================
const santiagoTiles = (() => {
  const g = createGrid(27, 25, 0);
  applyChileanBorders(g);

  // Wildflower & agricultural fields + scattered trees
  fillRect(g, 2, 1, 7, 3, 7);
  fillRect(g, 20, 1, 24, 3, 7);
  fillRect(g, 24, 1, 25, 4, 4);
  fillRect(g, 2, 13, 6, 16, 7);
  fillRect(g, 19, 13, 24, 16, 7);
  fillRect(g, 23, 15, 25, 18, 4);
  fillRect(g, 1, 16, 3, 19, 4);

  // Home building (north center) & Tienda (west 2x2)
  fillRect(g, 10, 0, 16, 1, 8);
  fillRect(g, 2, 4, 3, 5, 8);

  // Main roads north of Mapocho
  drawHLine(g, 3, 23, 2, 1);
  drawVLine(g, 13, 2, 8, 1);
  drawVLine(g, 3, 2, 3, 1);
  drawHLine(g, 3, 13, 6, 1);
  drawVLine(g, 8, 2, 10, 1);
  drawVLine(g, 18, 2, 10, 1);

  // Río Mapocho across width at row 11 with bridges at x=8 and x=18 (keeping x=0 Ocean & x=26 Cordillera)
  drawHLine(g, 1, 25, 11, 2);
  setTile(g, 8, 11, 1);
  setTile(g, 18, 11, 1);

  // Roads south of Mapocho leading to central gate (13, 19)
  drawVLine(g, 8, 12, 14, 1);
  drawVLine(g, 18, 12, 14, 1);
  drawHLine(g, 8, 21, 14, 1);
  drawVLine(g, 13, 14, 19, 1);
  drawVLine(g, 21, 14, 18, 1);

  // Wildflowers near southern valley & Cerro Santa Isabel
  fillRect(g, 10, 15, 12, 17, 7);
  fillRect(g, 15, 15, 17, 17, 7);

  // Compact 3x3 Boss Enclosure at south (wallY = 19, rows 20..22 walkable, exit at (13, 24))
  carveCompactBossEnclosure3x3(g, 13, 19, true);
  setTile(g, 13, 23, 1);
  setTile(g, 13, 24, 1);

  return g;
})();

// ============================================================================
// 2. REGIÓN DEL BIOBÍO (19×17 - Pequeño)
// ============================================================================
const biobioTiles = (() => {
  const g = createGrid(19, 17, 0);
  applyChileanBorders(g);

  // North entrance gap from RM at (9, 0)
  setTile(g, 9, 0, 1);
  drawVLine(g, 9, 0, 11, 1);

  // Prehistoric amber pockets & ferns
  fillRect(g, 13, 1, 17, 3, 9);
  fillRect(g, 6, 1, 8, 2, 7);
  fillRect(g, 2, 8, 5, 10, 9);
  fillRect(g, 12, 8, 16, 10, 9);
  fillRect(g, 1, 5, 2, 6, 4);
  fillRect(g, 16, 5, 17, 6, 4);

  // Hospital 2x2 NW (x=2..3, y=3..4) & Santuario 2x2 NE (x=15..16, y=3..4)
  fillRect(g, 2, 3, 3, 4, 8);
  fillRect(g, 15, 3, 16, 4, 8);

  // North paths connecting Hospital, Santuario & Ches
  drawHLine(g, 3, 15, 2, 1);
  drawHLine(g, 3, 15, 5, 1);

  // Horizontal Railway Tracks (tile 11) across row 7 (x=1..17), Ocean on x=0, Cordillera on x=18
  drawHLine(g, 1, 17, 7, 11);

  // Paths south of railway
  drawVLine(g, 5, 6, 10, 1);
  drawVLine(g, 13, 6, 10, 1);
  drawHLine(g, 5, 15, 10, 1);

  // Bonus pocket water + secret chest at east
  setTile(g, 15, 9, 2);

  // Compact 3x3 Boss Enclosure at south (wallY = 11, arena rows 12..14, exit (9, 16))
  carveCompactBossEnclosure3x3(g, 9, 11, true);
  setTile(g, 9, 15, 1);
  setTile(g, 9, 16, 1);

  return g;
})();

// ============================================================================
// 3. REGIÓN DE LA ARAUCANÍA (23×21 - Mediano)
// ============================================================================
const araucaniaTiles = (() => {
  const g = createGrid(23, 21, 0);
  applyChileanBorders(g);

  // North entrance gap at (11, 0)
  setTile(g, 11, 0, 1);
  drawVLine(g, 11, 0, 15, 1);

  // Araucaria forest clusters & wildflower meadows
  fillRect(g, 1, 1, 5, 2, 7);
  fillRect(g, 17, 1, 20, 3, 4);
  fillRect(g, 14, 5, 15, 6, 5); // Volcanic pocket
  setTile(g, 13, 5, 3);
  setTile(g, 16, 5, 3);
  fillRect(g, 17, 9, 20, 10, 5); // East volcano ridge
  setTile(g, 17, 8, 3);
  setTile(g, 18, 8, 3);

  fillRect(g, 3, 10, 6, 12, 7);
  fillRect(g, 14, 12, 17, 14, 7);
  fillRect(g, 1, 13, 2, 14, 4);

  // 2x2 Tienda building NW (x=2..3, y=3..4)
  fillRect(g, 2, 3, 3, 4, 8);

  // Winding trails
  drawHLine(g, 3, 15, 2, 1);
  drawHLine(g, 3, 11, 5, 1);
  drawVLine(g, 7, 5, 12, 1);
  drawHLine(g, 7, 18, 12, 1);
  drawVLine(g, 18, 8, 12, 1);

  // Compact 3x3 Boss Enclosure at south (wallY = 15, arena rows 16..18, exit (11, 20))
  carveCompactBossEnclosure3x3(g, 11, 15, true);
  setTile(g, 11, 19, 1);
  setTile(g, 11, 20, 1);

  return g;
})();

// ============================================================================
// 4. REGIÓN DE LOS RÍOS (23×21 - Mediano)
// ============================================================================
const losriosTiles = (() => {
  const g = createGrid(23, 21, 0);
  applyChileanBorders(g);

  // North entrance gap at (11, 0)
  setTile(g, 11, 0, 1);
  drawVLine(g, 11, 0, 15, 1);

  // Valdivian rainforest & lush ferns
  fillRect(g, 5, 1, 7, 2, 4);
  fillRect(g, 15, 1, 17, 2, 4);
  fillRect(g, 2, 1, 4, 2, 7);
  fillRect(g, 19, 1, 21, 2, 7);
  fillRect(g, 3, 11, 6, 13, 7);
  fillRect(g, 15, 11, 18, 13, 7);

  // 2x2 Hospital NW (x=2..3, y=3..4) & 2x2 Santuario NE (x=19..20, y=3..4)
  fillRect(g, 2, 3, 3, 4, 8);
  fillRect(g, 19, 3, 20, 4, 8);

  // River branches (Calle-Calle) across rows 8..9 with timber bridges at x=5, x=11, x=17
  drawHLine(g, 1, 21, 8, 2);
  drawHLine(g, 2, 9, 9, 2);
  drawHLine(g, 13, 20, 9, 2);
  setTile(g, 5, 8, 1);
  setTile(g, 5, 9, 1);
  setTile(g, 11, 8, 1);
  setTile(g, 17, 8, 1);
  setTile(g, 17, 9, 1);

  // Trails connecting Hospital, Santuario, bridges & bonus pocket
  drawHLine(g, 3, 19, 2, 1);
  drawHLine(g, 3, 19, 5, 1);
  drawVLine(g, 5, 5, 13, 1);
  drawVLine(g, 17, 5, 13, 1);
  drawHLine(g, 2, 17, 13, 1);
  setTile(g, 1, 13, 0);

  // Compact 3x3 Boss Enclosure at south (wallY = 15, arena rows 16..18, exit (11, 20))
  carveCompactBossEnclosure3x3(g, 11, 15, true);
  setTile(g, 11, 19, 1);
  setTile(g, 11, 20, 1);

  return g;
})();

// ============================================================================
// 5. REGIÓN DE LOS LAGOS (33×29 - Muy grande)
// ============================================================================
const loslagosTiles = (() => {
  const g = createGrid(33, 29, 0);
  applyChileanBorders(g);

  // North entrance gap at (16, 0)
  setTile(g, 16, 0, 1);
  drawVLine(g, 16, 0, 23, 1);

  // Snow plains, glacial fields & subantarctic forests
  fillRect(g, 2, 1, 6, 3, 6);
  fillRect(g, 25, 1, 30, 3, 6);
  fillRect(g, 8, 1, 10, 2, 4);
  fillRect(g, 21, 1, 23, 2, 4);
  fillRect(g, 3, 11, 7, 14, 6);
  fillRect(g, 25, 11, 30, 14, 6);
  fillRect(g, 4, 17, 9, 20, 6);
  fillRect(g, 23, 17, 29, 20, 6);
  fillRect(g, 2, 18, 3, 21, 4);
  fillRect(g, 29, 18, 31, 21, 4);

  // Palafitos de Chiloé (colorful lakeside houses on stilts) + 2x2 Tienda Austral NE (x=27..28, y=4..5)
  fillRect(g, 4, 5, 6, 5, 8);
  fillRect(g, 27, 4, 28, 5, 8);

  // Southern Archipelago Fjords (water pools) with timber bridges
  fillRect(g, 8, 7, 13, 9, 2);
  fillRect(g, 19, 7, 24, 9, 2);
  fillRect(g, 8, 15, 12, 16, 2);
  fillRect(g, 20, 15, 24, 16, 2);

  // Trails weaving across fjords & snowfields
  drawHLine(g, 4, 28, 2, 1);
  drawVLine(g, 6, 2, 19, 1);
  drawVLine(g, 28, 2, 19, 1);
  drawHLine(g, 6, 28, 6, 1);
  drawHLine(g, 3, 28, 12, 1);
  drawHLine(g, 6, 28, 19, 1);
  drawVLine(g, 11, 12, 19, 1);
  drawVLine(g, 21, 12, 19, 1);

  // Glacial bonus pocket at west (x=1..3, y=12)
  setTile(g, 2, 12, 1);
  setTile(g, 1, 12, 6);

  // Compact 5x3 Twin-Serpent Sanctuary at south (wallY = 23, arena rows 24..26)
  carveCompactTwinEnclosure5x3(g, 16, 23);

  return g;
})();

export const REGIONS_DATA: Record<RegionId, MapRegion> = {
  casa: {
    id: 'casa',
    name: 'Escenario 0 · Tu Hogar',
    subtitle: 'Casa Familiar · Valle Central',
    lore: 'Tu cálido hogar de madera y adobe antes de emprender el gran viaje por las cinco regiones de Chile.',
    width: 11,
    height: 9,
    ambientColor: '#451a03',
    themeColor: '#f59e0b',
    weather: 'interior',
    weatherLabel: 'Hogar · Interior',
    bgmId: 'casa',
    isUnlocked: true,
    tiles: casaTiles,
    entities: [
      {
        id: 'deco_chimenea_casa',
        x: 1,
        y: 1,
        type: 'decorative',
        name: 'Chimenea Hogareña',
        sprite: 'deco_chimenea',
        dialog: ['El fuego crepita suavemente en la chimenea de tu casa.'],
      },
      {
        id: 'deco_mesa_casa',
        x: 8,
        y: 5,
        type: 'decorative',
        name: 'Mesa del Comedor',
        sprite: 'deco_mesa',
        dialog: ['Pan amasado recién horneado y té caliente listos para tu partida.'],
      },
      {
        id: 'deco_planta_casa_1',
        x: 1,
        y: 7,
        type: 'decorative',
        name: 'Macetero de Helechos',
        sprite: 'deco_planta',
        dialog: ['Un helecho frondoso que decora la entrada de tu hogar.'],
      },
      {
        id: 'deco_planta_casa_2',
        x: 9,
        y: 7,
        type: 'decorative',
        name: 'Macetero de Copihues',
        sprite: 'deco_planta',
        dialog: ['Flores rojas vibrantes cultivadas junto a la ventana.'],
      },
      {
        id: 'npc_mama_casa',
        x: 5,
        y: 3,
        type: 'npc',
        name: 'Mamá Elena',
        sprite: 'npc_villager_f',
        dialog: [
          '¡Buenos días, tesoro! Hoy comienza tu gran travesía desde la R. Metropolitana hasta Los Lagos.',
          'Recuerda: los caminos y puentes son seguros (0% encuentros), mientras que en el pasto o flores aparecen criaturas (1%-3%).',
          'Siempre puedes volver a dormir en tu cama para recuperar fuerzas. ¡Buen viaje!',
        ],
      },
      {
        id: 'npc_diario_casa',
        x: 9,
        y: 2,
        type: 'npc',
        name: 'Diario de Expedición',
        sprite: 'deco_libro',
        dialog: [
          'Apuntes de Casa: Tiendas en Stages 1, 3 y 5; Hospitales y Santuarios de Evolución en Stages 2 y 4.',
          'Al oeste de Chile se extiende el Océano Pacífico y al este la Cordillera de los Andes.',
        ],
      },
      {
        id: 'shrine_cama_casa',
        x: 2,
        y: 2,
        type: 'shrine',
        name: 'Tu Cama',
        sprite: 'deco_cama',
        dialog: ['Descansaste cálidamente en casa. ¡Tu equipo recuperó todos sus PS y PM!'],
      },
      {
        id: 'portal_casa_to_santiago',
        x: 5,
        y: 8,
        type: 'portal',
        name: 'Salir a R. Metropolitana',
        sprite: 'portal_sign',
        destinationRegion: 'santiago',
        destinationX: 13,
        destinationY: 3,
      },
    ],
    wildEncounterTable: [],
  },

  santiago: {
    id: 'santiago',
    name: 'R. Metropolitana',
    subtitle: 'Stage 1 · Río Mapocho, Cerros y Urbe',
    lore: 'El Río Mapocho cruza el Valle Central entre el Océano Pacífico al oeste, la Cordillera al este y los Cerros Blanco, San Cristóbal y Santa Isabel.',
    width: 27,
    height: 25,
    ambientColor: '#15803d',
    themeColor: '#38bdf8',
    weather: 'soleado',
    weatherLabel: 'Soleado · Polvo y Sol',
    bgmId: 'santiago',
    isUnlocked: true,
    tiles: santiagoTiles,
    entities: [
      {
        id: 'portal_santiago_to_casa',
        x: 13,
        y: 2,
        type: 'portal',
        name: 'Tu Casa Familiar',
        sprite: 'portal_casa_propia',
        destinationRegion: 'casa',
        destinationX: 5,
        destinationY: 7,
      },
      {
        id: 'npc_profesor',
        x: 13,
        y: 4,
        type: 'npc',
        name: 'Don Ignacio',
        sprite: 'npc_old_man',
        dialog: [
          '¡Qué gusto verte salir de casa! Soy Don Ignacio, guardián botánico de la R. Metropolitana.',
          'Visita la Tienda de Don Manuel al oeste y usa a tu espíritu LÍDER activo de TIERRA para despejar la barrera hacia el Costanera Center.',
          '¡Toma estos Amuletos de Vínculo para tu expedición!',
        ],
        rewardItem: { id: 'orbe_resonancia', count: 3 },
      },
      {
        id: 'portal_tienda_santiago',
        x: 3,
        y: 6,
        type: 'portal',
        name: 'Tienda de Don Manuel',
        sprite: 'portal_tienda',
        destinationRegion: 'tienda',
        destinationX: 5,
        destinationY: 7,
        shopVendorName: 'Don Manuel · Tienda Central',
        shopSubtitle: 'R. Metropolitana · Stage 1',
      },
      {
        id: 'deco_cerro_blanco_rm',
        x: 5,
        y: 2,
        type: 'decorative',
        name: 'Cerro Blanco (Norte)',
        sprite: 'deco_cerro_blanco',
        dialog: ['Cerro Blanco: mirador ancestral de piedra blanca en el sector norte de Santiago.'],
      },
      {
        id: 'deco_san_cristobal_rm',
        x: 22,
        y: 2,
        type: 'decorative',
        name: 'Cerro San Cristóbal',
        sprite: 'deco_san_cristobal',
        dialog: ['Desde el Cerro San Cristóbal se divisa el Río Mapocho y toda la Cordillera nevada al este.'],
      },
      {
        id: 'deco_cerro_santa_isabel_rm',
        x: 21,
        y: 18,
        type: 'decorative',
        name: 'Cerro Santa Isabel (Sur)',
        sprite: 'deco_cerro_santa_isabel',
        dialog: ['Cerro Santa Isabel: loma verde al sur del Río Mapocho donde descansan torcazas y quiltros.'],
      },
      {
        id: 'npc_escolar_rm',
        x: 9,
        y: 6,
        type: 'npc',
        name: 'Tomás · Niño Escolar',
        sprite: 'npc_escolar',
        dialog: [
          '¡Hola! En caminos y puentes sobre el Río Mapocho nunca aparecen monstruos salvajes (0%).',
          'Si buscas Quiltros de Tierra para abrir la barrera del sur, explora el pasto o flores (1%-3%).',
        ],
      },
      {
        id: 'npc_obrero_rm',
        x: 18,
        y: 14,
        type: 'npc',
        name: 'Patricio · Obrero de Providencia',
        sprite: 'npc_obrero',
        dialog: [
          'Las rocas del bloque sur sellan el acceso al Costanera Center.',
          'Recuerda llevar un espíritu de TIERRA (como un Quiltro) como LÍDER ACTIVO para abrir la barrera.',
        ],
      },
      {
        id: 'npc_maestro_santiago',
        x: 14,
        y: 21,
        type: 'npc',
        name: 'Maestro Vínculo Rodrigo',
        sprite: 'npc_maestro_vinculo',
        dialog: [
          'Soy Rodrigo, Maestro Vínculo de la R. Metropolitana. Custodio al coloso Edificio Costanera Center (Nv.5).',
          'Vence esta prueba y obtendrás la Medalla Valle Central.',
        ],
      },
      {
        id: 'chest_santiago_1',
        x: 3,
        y: 2,
        type: 'chest',
        name: 'Cofre del Cerro Blanco',
        sprite: 'chest',
        rewardItem: { id: 'esencia_pewen', count: 1 },
        rewardGold: 120,
      },
      {
        id: 'chest_santiago_2',
        x: 20,
        y: 2,
        type: 'chest',
        name: 'Cofre San Cristóbal',
        sprite: 'chest',
        rewardItem: { id: 'orbe_resonancia', count: 4 },
        rewardGold: 100,
      },
      {
        id: 'wild_santiago_quiltro',
        x: 11,
        y: 15,
        type: 'wild_encounter',
        name: 'Quiltro Patrón (Nv.4)',
        sprite: 'wild_quiltro',
        encounterSpiritId: 'quiltro',
        customLevel: 4,
      },
      {
        id: 'wild_santiago_gato',
        x: 5,
        y: 14,
        type: 'wild_encounter',
        name: 'Gato Güiña Silvestre (Nv.4)',
        sprite: 'wild_gato_chileno',
        encounterSpiritId: 'gato_chileno',
        customLevel: 4,
      },
      {
        id: 'wild_santiago_loica',
        x: 20,
        y: 15,
        type: 'wild_encounter',
        name: 'Loica Guardiana (Nv.4)',
        sprite: 'wild_loica',
        encounterSpiritId: 'loica',
        customLevel: 4,
      },
      {
        id: 'obstacle_santiago_ruta',
        x: 13,
        y: 19,
        type: 'obstacle',
        name: 'Barrera Sísmica de Hormigón (Misión)',
        sprite: 'obstacle_rock',
        elementRequired: 'tierra',
        obstacleClearMessage: '¡Tu espíritu activo de TIERRA estabilizó la barrera y despejó el patio del Costanera Center!',
        dialog: ['Bloques sísmicos sellan el acceso sur. Equipa como LÍDER ACTIVO a un espíritu de TIERRA (ej. Quiltro).'],
      },
      {
        id: 'boss_santiago',
        x: 13,
        y: 21,
        type: 'boss',
        name: 'Coloso Costanera Center (Nv.5)',
        sprite: 'boss_costanera',
        bossSpiritId: 'costanera',
        customLevel: 5,
        requiresMissionsCleared: true,
        dialog: ['¡EL ESPÍRITU DEL COSTANERA CENTER DESPIERTA SOBRE EL RÍO MAPOCHO!'],
      },
      {
        id: 'portal_to_biobio',
        x: 13,
        y: 24,
        type: 'portal',
        name: 'Ruta a R. del Biobío',
        sprite: 'portal_sign',
        destinationRegion: 'biobio',
        destinationX: 9,
        destinationY: 1,
      },
    ],
    wildEncounterTable: [
      { spiritId: 'torcaza', minLevel: 2, maxLevel: 3, weight: 32 },
      { spiritId: 'quiltro', minLevel: 2, maxLevel: 3, weight: 32 },
      { spiritId: 'gato_chileno', minLevel: 2, maxLevel: 3, weight: 22 },
      { spiritId: 'loica', minLevel: 2, maxLevel: 3, weight: 10 },
      { spiritId: 'condor', minLevel: 3, maxLevel: 3, weight: 4 },
    ],
  },

  biobio: {
    id: 'biobio',
    name: 'R. del Biobío',
    subtitle: 'Stage 2 · Vía Férrea, Neblina y Fósiles',
    lore: 'Pequeño valle costero-andino entre el Océano Pacífico y la Cordillera, con línea férrea, neblina densa, Hospital, Santuario y fósiles jurásicos.',
    width: 19,
    height: 17,
    ambientColor: '#475569',
    themeColor: '#f97316',
    weather: 'lluvia_intermitente',
    weatherLabel: 'Niebla y Lluvia Interm.',
    bgmId: 'biobio',
    isUnlocked: false,
    tiles: biobioTiles,
    entities: [
      {
        id: 'portal_back_santiago',
        x: 9,
        y: 0,
        type: 'portal',
        name: 'Volver a R. Metropolitana',
        sprite: 'portal_sign',
        destinationRegion: 'santiago',
        destinationX: 13,
        destinationY: 22,
      },
      {
        id: 'npc_lautaro_biobio',
        x: 7,
        y: 2,
        type: 'npc',
        name: 'Lautaro · Guardián del Biobío',
        sprite: 'npc_ranger',
        dialog: [
          '¡Bienvenido a la R. del Biobío! Al oeste tienes el Hospital y al este el Santuario de Evolución.',
          'Cruza la línea del tren al centro y equipa un espíritu de FUEGO como LÍDER ACTIVO para abrir paso hacia el T-Rex.',
          'Recibe estas Gotas Termales para recuperar maná.',
        ],
        rewardItem: { id: 'gota_termal', count: 3 },
      },
      {
        id: 'portal_hospital_biobio',
        x: 3,
        y: 5,
        type: 'portal',
        name: 'Entrar al Hospital Biobío',
        sprite: 'portal_hospital',
        destinationRegion: 'hospital',
        destinationX: 5,
        destinationY: 7,
      },
      {
        id: 'portal_santuario_biobio',
        x: 15,
        y: 5,
        type: 'portal',
        name: 'Entrar al Santuario de Evolución',
        sprite: 'portal_santuario',
        destinationRegion: 'santuario',
        destinationX: 5,
        destinationY: 7,
      },
      {
        id: 'npc_agricultor_biobio',
        x: 5,
        y: 6,
        type: 'npc',
        name: 'Raúl · Agricultor del Laja',
        sprite: 'npc_agricultor',
        dialog: [
          'La vía férrea atraviesa el valle entre neblina y lluvia intermitente.',
          'Tanto la línea del tren como los caminos de piedra tienen 0% de encuentros salvajes.',
        ],
      },
      {
        id: 'npc_arqueologo_biobio',
        x: 13,
        y: 8,
        type: 'npc',
        name: 'Dr. Morales · Arqueólogo',
        sprite: 'npc_arqueologo',
        dialog: [
          'Hemos hallado Huevos Dino y Velociraptores de fuego junto al ámbar prehistórico.',
          'Pon un espíritu de FUEGO como LÍDER ACTIVO para quemar la maleza fósil que bloquea el estadio del T-Rex.',
        ],
      },
      {
        id: 'npc_musico_biobio',
        x: 5,
        y: 10,
        type: 'npc',
        name: 'Mateo · Músico Ferroviario',
        sprite: 'npc_musico',
        dialog: ['Toco guitarra junto a las vías del antiguo tren al sur. ¡Éxito frente al T-Rex Tirano!'],
      },
      {
        id: 'npc_maestro_biobio',
        x: 10,
        y: 13,
        type: 'npc',
        name: 'Maestro Vínculo Lautaro',
        sprite: 'npc_maestro_vinculo',
        dialog: [
          'Custodio al T-Rex Tirano del Biobío (Nv.7). Demuestra tu estrategia elemental para ganar la Medalla Jurásica Biobío.',
        ],
      },
      {
        id: 'chest_biobio_1',
        x: 15,
        y: 2,
        type: 'chest',
        name: 'Cofre del Claro Jurásico',
        sprite: 'chest',
        rewardItem: { id: 'infusion_calafate', count: 2 },
        rewardGold: 160,
      },
      {
        id: 'obstacle_biobio',
        x: 15,
        y: 9,
        type: 'obstacle',
        name: 'Grieta Torrencial (Opcional)',
        sprite: 'obstacle_water',
        elementRequired: 'agua',
        obstacleClearMessage: 'Tu espíritu activo de AGUA serenó la grieta y despejó el cofre secreto.',
      },
      {
        id: 'chest_biobio_bonus',
        x: 16,
        y: 9,
        type: 'chest',
        name: 'Cofre Fósil Secreto',
        sprite: 'chest',
        rewardItem: { id: 'corazon_basalto', count: 1 },
        rewardGold: 220,
      },
      {
        id: 'wild_biobio_velociraptor',
        x: 12,
        y: 9,
        type: 'wild_encounter',
        name: 'Velociraptor Ígneo (Nv.6)',
        sprite: 'wild_velociraptor',
        encounterSpiritId: 'velociraptor',
        customLevel: 6,
      },
      {
        id: 'wild_biobio_cuellilargo',
        x: 13,
        y: 10,
        type: 'wild_encounter',
        name: 'Cuellilargo Ancestral (Nv.6)',
        sprite: 'wild_cuellilargo',
        encounterSpiritId: 'cuellilargo',
        customLevel: 6,
      },
      {
        id: 'wild_biobio_huevodino',
        x: 7,
        y: 9,
        type: 'wild_encounter',
        name: 'Huevo Dino Fósil (Nv.6)',
        sprite: 'wild_huevo_dino',
        encounterSpiritId: 'huevo_dino',
        customLevel: 6,
      },
      {
        id: 'obstacle_biobio_ruta',
        x: 9,
        y: 11,
        type: 'obstacle',
        name: 'Maleza Jurásica Densa (Misión)',
        sprite: 'obstacle_vines',
        elementRequired: 'fuego',
        obstacleClearMessage: '¡Tu espíritu activo de FUEGO quemó la maleza jurásica abriendo paso al T-Rex!',
        dialog: ['Enredaderas prehistóricas sellan la arena del T-Rex. Equipa como LÍDER ACTIVO un espíritu de FUEGO (ej. Velociraptor).'],
      },
      {
        id: 'boss_biobio',
        x: 9,
        y: 13,
        type: 'boss',
        name: 'T-Rex Tirano del Biobío (Nv.7)',
        sprite: 'boss_trex',
        bossSpiritId: 'trex',
        customLevel: 7,
        requiresMissionsCleared: true,
        dialog: ['¡ROAAAR! ¡EL REY TIRANO PREHISTÓRICO DEL BIOBÍO DESPIERTA!'],
      },
      {
        id: 'portal_to_araucania',
        x: 9,
        y: 16,
        type: 'portal',
        name: 'Ruta a R. de La Araucanía',
        sprite: 'portal_sign',
        destinationRegion: 'araucania',
        destinationX: 11,
        destinationY: 1,
      },
    ],
    wildEncounterTable: [
      { spiritId: 'velociraptor', minLevel: 4, maxLevel: 5, weight: 34 },
      { spiritId: 'huevo_dino', minLevel: 4, maxLevel: 5, weight: 32 },
      { spiritId: 'quiltro', minLevel: 4, maxLevel: 5, weight: 16 },
      { spiritId: 'cuellilargo', minLevel: 4, maxLevel: 5, weight: 14 },
      { spiritId: 'loica', minLevel: 4, maxLevel: 5, weight: 4 },
    ],
  },

  araucania: {
    id: 'araucania',
    name: 'R. de La Araucanía',
    subtitle: 'Stage 3 · Araucarias, Lluvia Fija y Volcanes',
    lore: 'Praderas de pewén entre el Pacífico y los volcanes andinos bajo lluvia fija, con la Tienda de Doña Millaray.',
    width: 23,
    height: 21,
    ambientColor: '#14532d',
    themeColor: '#22c55e',
    weather: 'lluvia_suave',
    weatherLabel: 'Lluvia Fija y Nubes',
    bgmId: 'araucania',
    isUnlocked: false,
    tiles: araucaniaTiles,
    entities: [
      {
        id: 'portal_back_biobio',
        x: 11,
        y: 0,
        type: 'portal',
        name: 'Volver a R. del Biobío',
        sprite: 'portal_sign',
        destinationRegion: 'biobio',
        destinationX: 9,
        destinationY: 14,
      },
      {
        id: 'npc_minero_araucania',
        x: 9,
        y: 2,
        type: 'npc',
        name: 'Nahuel · Guardián Volcánico',
        sprite: 'npc_miner',
        dialog: [
          '¡Mari mari! Bajo la lluvia fija de La Araucanía visita la Tienda de Doña Millaray al oeste.',
          'Equipa como LÍDER ACTIVO a un espíritu de AGUA (ej. Ranita de Darwin) para enfriar el muro volcánico.',
          '¡Lleva este Corazón de Basalto contigo!',
        ],
        rewardItem: { id: 'corazon_basalto', count: 1 },
      },
      {
        id: 'portal_tienda_araucania',
        x: 3,
        y: 5,
        type: 'portal',
        name: 'Tienda Pewén (Doña Millaray)',
        sprite: 'portal_tienda',
        destinationRegion: 'tienda',
        destinationX: 5,
        destinationY: 7,
        shopVendorName: 'Doña Millaray · Tienda Pewén',
        shopSubtitle: 'R. de La Araucanía · Stage 3',
      },
      {
        id: 'npc_mapuche_araucania',
        x: 7,
        y: 10,
        type: 'npc',
        name: 'Lonko Calfucura · Sabio Mapuche',
        sprite: 'npc_mapuche',
        dialog: [
          'La Araucaria Madre es el corazón vivo del pewén. Enfría la roca magmática del acceso sur con tu espíritu activo de AGUA.',
        ],
      },
      {
        id: 'npc_feriante_araucania',
        x: 6,
        y: 12,
        type: 'npc',
        name: 'Señora Rosa · Feriante de Temuco',
        sprite: 'npc_feriante',
        dialog: [
          '¡Piñones frescos, matico y calafate! Si buscas provisiones antes de enfrentar a la Araucaria Madre, entra a la tienda del noroeste.',
        ],
      },
      {
        id: 'npc_punk_araucania',
        x: 15,
        y: 8,
        type: 'npc',
        name: 'Nico · Punk Cordillerano',
        sprite: 'npc_punk',
        dialog: ['¡Ey! Me encanta tocar riffs bajo la lluvia junto a las fumarolas volcánicas del Llaima.'],
      },
      {
        id: 'npc_maestro_araucania',
        x: 12,
        y: 17,
        type: 'npc',
        name: 'Maestro Vínculo Kallfü',
        sprite: 'npc_maestro_vinculo',
        dialog: [
          'Acompaño a la Araucaria Madre (Nv.9). Demuestra tu dominio elemental y gana la Medalla Pewén Araucanía.',
        ],
      },
      {
        id: 'chest_araucania_1',
        x: 3,
        y: 2,
        type: 'chest',
        name: 'Cofre de Piñones Dorados',
        sprite: 'chest',
        rewardItem: { id: 'orbe_resonancia', count: 4 },
        rewardGold: 180,
      },
      {
        id: 'obstacle_araucania',
        x: 18,
        y: 12,
        type: 'obstacle',
        name: 'Roca Magmática (Opcional)',
        sprite: 'obstacle_magma',
        elementRequired: 'agua',
        obstacleClearMessage: 'Tu espíritu activo de AGUA enfrió el basalto ardiente y liberó el cofre secreto.',
      },
      {
        id: 'chest_araucania_bonus',
        x: 19,
        y: 12,
        type: 'chest',
        name: 'Cofre Volcánico Secreto',
        sprite: 'chest',
        rewardItem: { id: 'empanada', count: 2 },
        rewardGold: 250,
      },
      {
        id: 'deco_fumarola_1',
        x: 16,
        y: 9,
        type: 'decorative',
        name: 'Fumarola del Llaima',
        sprite: 'deco_fumarola',
      },
      {
        id: 'wild_araucania_ranita',
        x: 15,
        y: 12,
        type: 'wild_encounter',
        name: 'Ranita de Darwin (Nv.8)',
        sprite: 'wild_ranita',
        encounterSpiritId: 'ranita',
        customLevel: 8,
      },
      {
        id: 'wild_araucania_chucao',
        x: 8,
        y: 7,
        type: 'wild_encounter',
        name: 'Chucao del Bosque (Nv.8)',
        sprite: 'wild_chucao',
        encounterSpiritId: 'chucao',
        customLevel: 8,
      },
      {
        id: 'wild_araucania_gato',
        x: 9,
        y: 13,
        type: 'wild_encounter',
        name: 'Gato Güiña Montés (Nv.8)',
        sprite: 'wild_gato_chileno',
        encounterSpiritId: 'gato_chileno',
        customLevel: 8,
      },
      {
        id: 'obstacle_araucania_ruta',
        x: 11,
        y: 15,
        type: 'obstacle',
        name: 'Barrera Magmática del Volcán (Misión)',
        sprite: 'obstacle_magma',
        elementRequired: 'agua',
        obstacleClearMessage: '¡Tu espíritu activo de AGUA enfrió la barrera magmática y abrió el claro de la Araucaria Madre!',
        dialog: ['Lava solidificada bloquea el paso al sur. Equipa como LÍDER ACTIVO un espíritu de AGUA (ej. Ranita de Darwin o Hualita).'],
      },
      {
        id: 'boss_araucania',
        x: 11,
        y: 17,
        type: 'boss',
        name: 'Araucaria Madre Milenaria (Nv.9)',
        sprite: 'boss_araucaria',
        bossSpiritId: 'araucaria_madre',
        customLevel: 9,
        requiresMissionsCleared: true,
        dialog: ['¡EL CORAZÓN DE LA ARAUCARIA MADRE DESPIERTA BAJO LA LLUVIA DEL SUR!'],
      },
      {
        id: 'portal_to_losrios',
        x: 11,
        y: 20,
        type: 'portal',
        name: 'Ruta a R. de Los Ríos',
        sprite: 'portal_sign',
        destinationRegion: 'losrios',
        destinationX: 11,
        destinationY: 1,
      },
    ],
    wildEncounterTable: [
      { spiritId: 'chucao', minLevel: 6, maxLevel: 7, weight: 36 },
      { spiritId: 'gato_chileno', minLevel: 6, maxLevel: 7, weight: 22 },
      { spiritId: 'ranita', minLevel: 6, maxLevel: 7, weight: 18 },
      { spiritId: 'culpeo', minLevel: 6, maxLevel: 7, weight: 14 },
      { spiritId: 'torcaza', minLevel: 6, maxLevel: 7, weight: 10 },
    ],
  },

  losrios: {
    id: 'losrios',
    name: 'R. de Los Ríos',
    subtitle: 'Stage 4 · Selva Valdiviana y Lluvia con Viento',
    lore: 'Selva verde entre el mar Pacífico y la Cordillera bajo viento y lluvia oblicua, con Hospital valdiviano, Santuario y el Torreón del Calle-Calle.',
    width: 23,
    height: 21,
    ambientColor: '#064e3b',
    themeColor: '#a3e635',
    weather: 'lluvia_viento',
    weatherLabel: 'Lluvia con Viento',
    bgmId: 'losrios',
    isUnlocked: false,
    tiles: losriosTiles,
    entities: [
      {
        id: 'portal_back_araucania',
        x: 11,
        y: 0,
        type: 'portal',
        name: 'Volver a R. de La Araucanía',
        sprite: 'portal_sign',
        destinationRegion: 'araucania',
        destinationX: 11,
        destinationY: 18,
      },
      {
        id: 'npc_javiera_losrios',
        x: 9,
        y: 2,
        type: 'npc',
        name: 'Javiera · Bióloga de Valdivia',
        sprite: 'npc_explorer',
        dialog: [
          '¡Bienvenido a R. de Los Ríos! Al oeste tienes el Hospital y al este el Santuario de Evolución.',
          'Equipa como LÍDER ACTIVO un espíritu de PLANTA (ej. Hongo Lumínico) para absorber el desborde hacia el Torreón.',
          'Acepta esta Resina de Pewén para tus evoluciones.',
        ],
        rewardItem: { id: 'esencia_pewen', count: 1 },
      },
      {
        id: 'portal_hospital_losrios',
        x: 3,
        y: 5,
        type: 'portal',
        name: 'Entrar al Hospital Valdiviano',
        sprite: 'portal_hospital',
        destinationRegion: 'hospital',
        destinationX: 5,
        destinationY: 7,
      },
      {
        id: 'portal_santuario_losrios',
        x: 19,
        y: 5,
        type: 'portal',
        name: 'Entrar al Santuario de Evolución',
        sprite: 'portal_santuario',
        destinationRegion: 'santuario',
        destinationX: 5,
        destinationY: 7,
      },
      {
        id: 'npc_soldado_losrios',
        x: 5,
        y: 6,
        type: 'npc',
        name: 'Sargento Valdivia · Soldado',
        sprite: 'npc_soldado',
        dialog: [
          'Vigilo los antiguos muros españoles junto al río. Con lluvia y viento, la defensa es lo primero.',
          'Solo un espíritu activo de PLANTA absorbe el caudal que sella la plaza del Torreón.',
        ],
      },
      {
        id: 'npc_agricultor_losrios',
        x: 15,
        y: 10,
        type: 'npc',
        name: 'Don Anselmo · Agricultor',
        sprite: 'npc_agricultor',
        dialog: ['La lluvia constante hace crecer setas brillantes y jabalíes por toda la selva valdiviana.'],
      },
      {
        id: 'npc_pescador_m_losrios',
        x: 5,
        y: 10,
        type: 'npc',
        name: 'Don Lucho · Pescador',
        sprite: 'npc_pescador_m',
        dialog: ['Las hualas y los peces saltan cerca del muelle del Calle-Calle antes de cada temporal.'],
      },
      {
        id: 'npc_pescadora_f_losrios',
        x: 17,
        y: 12,
        type: 'npc',
        name: 'Señora Carmen · Pescadora',
        sprite: 'npc_pescadora_f',
        dialog: ['Con calma siempre pica algo bueno en el río. ¡Mucho éxito frente al Torreón!'],
      },
      {
        id: 'npc_maestro_losrios',
        x: 12,
        y: 17,
        type: 'npc',
        name: 'Maestra Vínculo Antonia',
        sprite: 'npc_maestro_vinculo',
        dialog: [
          'Resguardo al Guardián del Torreón (Nv.11). Quien lo derrote obtendrá la Medalla Selva Valdiviana.',
        ],
      },
      {
        id: 'chest_losrios_1',
        x: 19,
        y: 2,
        type: 'chest',
        name: 'Cofre de la Niebla Valdiviana',
        sprite: 'chest',
        rewardItem: { id: 'infusion_calafate', count: 2 },
        rewardGold: 220,
      },
      {
        id: 'obstacle_losrios',
        x: 2,
        y: 13,
        type: 'obstacle',
        name: 'Caudal del Calle-Calle (Opcional)',
        sprite: 'obstacle_water',
        elementRequired: 'agua',
        obstacleClearMessage: 'Tu espíritu activo de AGUA serenó la corriente lateral revelando el cofre secreto.',
      },
      {
        id: 'chest_losrios_bonus',
        x: 1,
        y: 13,
        type: 'chest',
        name: 'Cofre Ribereño Secreto',
        sprite: 'chest',
        rewardItem: { id: 'orbe_resonancia', count: 4 },
        rewardGold: 280,
      },
      {
        id: 'wild_losrios_hongo',
        x: 8,
        y: 6,
        type: 'wild_encounter',
        name: 'Hongo Lumínico (Nv.10)',
        sprite: 'wild_hongo',
        encounterSpiritId: 'hongo',
        customLevel: 10,
      },
      {
        id: 'wild_losrios_jabali',
        x: 14,
        y: 6,
        type: 'wild_encounter',
        name: 'Jabalí del Arrayán (Nv.10)',
        sprite: 'wild_jabali',
        encounterSpiritId: 'jabali',
        customLevel: 10,
      },
      {
        id: 'wild_losrios_puducito',
        x: 8,
        y: 12,
        type: 'wild_encounter',
        name: 'Pudú Valdiviano (Nv.10)',
        sprite: 'wild_puducito',
        encounterSpiritId: 'puducito',
        customLevel: 10,
      },
      {
        id: 'obstacle_losrios_ruta',
        x: 11,
        y: 15,
        type: 'obstacle',
        name: 'Desborde de Aguas del Torreón (Misión)',
        sprite: 'obstacle_water',
        elementRequired: 'planta',
        obstacleClearMessage: '¡Tu espíritu activo de PLANTA tejió raíces absorbentes abriendo el paso hacia el Torreón!',
        dialog: ['Un torrente cubre el puente al Torreón. Equipa como LÍDER ACTIVO un espíritu de PLANTA (ej. Hongo Lumínico o Brotín).'],
      },
      {
        id: 'boss_losrios',
        x: 11,
        y: 17,
        type: 'boss',
        name: 'Guardián del Torreón (Nv.11)',
        sprite: 'boss_torreon',
        bossSpiritId: 'torreon',
        customLevel: 11,
        requiresMissionsCleared: true,
        dialog: ['¡LOS FAROLES DEL TORREÓN DEL CALLE-CALLE DESPIERTAN BAJO EL VIENTO Y LA LLUVIA!'],
      },
      {
        id: 'portal_to_loslagos',
        x: 11,
        y: 20,
        type: 'portal',
        name: 'Ruta a R. de Los Lagos',
        sprite: 'portal_sign',
        destinationRegion: 'loslagos',
        destinationX: 16,
        destinationY: 1,
      },
    ],
    wildEncounterTable: [
      { spiritId: 'jabali', minLevel: 8, maxLevel: 9, weight: 34 },
      { spiritId: 'hongo', minLevel: 8, maxLevel: 9, weight: 32 },
      { spiritId: 'chucao', minLevel: 8, maxLevel: 9, weight: 18 },
      { spiritId: 'culpeo', minLevel: 8, maxLevel: 9, weight: 10 },
      { spiritId: 'puducito', minLevel: 8, maxLevel: 9, weight: 6 },
    ],
  },

  loslagos: {
    id: 'loslagos',
    name: 'R. de Los Lagos',
    subtitle: 'Stage 5 · Tormenta, Fiordos y Serpientes',
    lore: 'Extenso archipiélago austral entre el Océano Pacífico y la Cordillera nevada, con palafitos de Chiloé, la Tienda Austral y el santuario de Cai Cai y Vilu Vilu.',
    width: 33,
    height: 29,
    ambientColor: '#1e293b',
    themeColor: '#67e8f9',
    weather: 'ventisca_austral',
    weatherLabel: 'Tormenta, Viento y Truenos',
    bgmId: 'loslagos',
    isUnlocked: false,
    tiles: loslagosTiles,
    entities: [
      {
        id: 'portal_back_losrios',
        x: 16,
        y: 0,
        type: 'portal',
        name: 'Volver a R. de Los Ríos',
        sprite: 'portal_sign',
        destinationRegion: 'losrios',
        destinationX: 11,
        destinationY: 18,
      },
      {
        id: 'npc_alercero',
        x: 13,
        y: 2,
        type: 'npc',
        name: 'Don Checho · Guardaparque',
        sprite: 'npc_ranger',
        dialog: [
          '¡Llegaste a la gran región de Los Lagos entre viento y truenos! Al noreste está la Tienda Austral de Doña Fresia.',
          'Equipa como LÍDER ACTIVO un espíritu de HIELO (ej. Ventisquero o Pingüino) para congelar un puente hacia Cai Cai y Vilu Vilu.',
          'Toma esta Infusión de Calafate para el tramo final.',
        ],
        rewardItem: { id: 'infusion_calafate', count: 2 },
      },
      {
        id: 'portal_tienda_loslagos',
        x: 28,
        y: 6,
        type: 'portal',
        name: 'Tienda Austral (Doña Fresia)',
        sprite: 'portal_tienda',
        destinationRegion: 'tienda',
        destinationX: 5,
        destinationY: 7,
        shopVendorName: 'Doña Fresia · Tienda Austral',
        shopSubtitle: 'R. de Los Lagos · Stage 5',
      },
      {
        id: 'npc_chilote_loslagos',
        x: 5,
        y: 6,
        type: 'npc',
        name: 'Don Segundo · Chilote',
        sprite: 'npc_chilote',
        dialog: [
          'En Chiloé contamos la leyenda de Cai Cai, señora de los mares, y Vilu Vilu, dueña de las cumbres.',
          'Solo tu espíritu LÍDER ACTIVO de HIELO puede congelar un puente seguro sobre el fiordo del sur.',
        ],
      },
      {
        id: 'npc_pescadora_loslagos',
        x: 22,
        y: 12,
        type: 'npc',
        name: 'Marisol · Pescadora del Fiordo',
        sprite: 'npc_pescadora_f',
        dialog: ['Los Pingüinos Australes se refugian en estas caletas cuando caen relámpagos.'],
      },
      {
        id: 'npc_buzo_loslagos',
        x: 8,
        y: 12,
        type: 'npc',
        name: 'Rodrigo · Buzo Mariscador',
        sprite: 'npc_buzo',
        dialog: ['Con este traje amarillo soporto el agua helada del canal para recoger mariscos y erizos frescos.'],
      },
      {
        id: 'npc_cocinera_loslagos',
        x: 21,
        y: 19,
        type: 'npc',
        name: 'Señora Meche · Cocinera de Curanto',
        sprite: 'npc_cocinera',
        dialog: ['¡Cuando vuelvas de vencer a las serpientes te espera un curanto bien calentito!'],
      },
      {
        id: 'npc_maestro_caicai',
        x: 14,
        y: 24,
        type: 'npc',
        name: 'Maestro Vínculo Kalfú',
        sprite: 'npc_maestro_vinculo',
        dialog: [
          'Custodio a Cai Cai Vilu (Nv.13), serpiente de las aguas australes. Usa Planta o Hielo con sabiduría.',
        ],
      },
      {
        id: 'npc_maestro_viluvilu',
        x: 18,
        y: 24,
        type: 'npc',
        name: 'Maestro Vínculo Llankal',
        sprite: 'npc_maestro_vinculo',
        dialog: [
          'Custodio a Vilu Vilu (Nv.14), serpiente de las cumbres. Cuando ambas caigan recibirás la Medalla Serpientes Australes.',
        ],
      },
      {
        id: 'chest_loslagos_1',
        x: 28,
        y: 2,
        type: 'chest',
        name: 'Cofre Glacial de Hornopirén',
        sprite: 'chest',
        rewardItem: { id: 'cristal_hielo', count: 1 },
        rewardGold: 300,
      },
      {
        id: 'obstacle_loslagos',
        x: 2,
        y: 12,
        type: 'obstacle',
        name: 'Bloque Glacial (Opcional)',
        sprite: 'obstacle_ice',
        elementRequired: 'fuego',
        obstacleClearMessage: 'Tu espíritu activo de FUEGO derritió el bloque glacial revelando el cofre secreto.',
      },
      {
        id: 'chest_loslagos_bonus',
        x: 1,
        y: 12,
        type: 'chest',
        name: 'Cofre Austral Secreto',
        sprite: 'chest',
        rewardItem: { id: 'orbe_resonancia', count: 5 },
        rewardGold: 400,
      },
      {
        id: 'wild_loslagos_pinguino',
        x: 18,
        y: 6,
        type: 'wild_encounter',
        name: 'Pingüino Austral (Nv.12)',
        sprite: 'wild_pinguino',
        encounterSpiritId: 'pinguino',
        customLevel: 12,
      },
      {
        id: 'wild_loslagos_ventisquero',
        x: 12,
        y: 13,
        type: 'wild_encounter',
        name: 'Ventisquero Errante (Nv.12)',
        sprite: 'wild_ventisquero',
        encounterSpiritId: 'ventisquero',
        customLevel: 12,
      },
      {
        id: 'wild_loslagos_jabali',
        x: 12,
        y: 19,
        type: 'wild_encounter',
        name: 'Jabalí Austral (Nv.12)',
        sprite: 'wild_jabali',
        encounterSpiritId: 'jabali',
        customLevel: 12,
      },
      {
        id: 'obstacle_loslagos_ruta',
        x: 16,
        y: 23,
        type: 'obstacle',
        name: 'Fjord Helado sin Puente (Misión)',
        sprite: 'obstacle_water',
        elementRequired: 'hielo',
        obstacleClearMessage: '¡Tu espíritu activo de HIELO tendió un puente de escarcha hacia el Santuario de las Dos Serpientes!',
        dialog: ['El canal hacia las Dos Serpientes ruge con olas heladas. Equipa como LÍDER ACTIVO un espíritu de HIELO (ej. Ventisquero o Pingüino).'],
      },
      {
        id: 'boss_loslagos_caicai',
        x: 14,
        y: 25,
        type: 'boss',
        name: 'Cai Cai Vilu · Serpiente del Mar (Nv.13)',
        sprite: 'boss_caicai',
        bossSpiritId: 'caicai',
        customLevel: 13,
        requiresMissionsCleared: true,
        dialog: ['¡LAS MAREAS DE LOS LAGOS RUGEN CON EL DESPERTAR DE CAI CAI VILU!'],
      },
      {
        id: 'boss_loslagos_viluvilu',
        x: 18,
        y: 25,
        type: 'boss',
        name: 'Vilu Vilu · Serpiente de Tierra (Nv.14)',
        sprite: 'boss_viluvilu',
        bossSpiritId: 'viluvilu',
        customLevel: 14,
        requiresMissionsCleared: true,
        dialog: ['¡LAS CUMBRES TIEMBLAN ANTE VILU VILU, SERPIENTE DE LA CORDILLERA!'],
      },
    ],
    wildEncounterTable: [
      { spiritId: 'ventisquero', minLevel: 10, maxLevel: 11, weight: 34 },
      { spiritId: 'jabali', minLevel: 10, maxLevel: 11, weight: 26 },
      { spiritId: 'pinguino', minLevel: 10, maxLevel: 11, weight: 18 },
      { spiritId: 'torcaza', minLevel: 10, maxLevel: 11, weight: 16 },
      { spiritId: 'puducito', minLevel: 10, maxLevel: 11, weight: 6 },
    ],
  },

  hospital: {
    id: 'hospital',
    name: 'Hospital Regional',
    subtitle: 'Centro Médico · Curación Gratuita (0%)',
    lore: 'Sala clínica luminosa equipada con camillas, monitores de signos vitales y asistencia médica gratuita para tus espíritus.',
    width: 11,
    height: 9,
    ambientColor: '#1e293b',
    themeColor: '#f43f5e',
    weather: 'interior',
    weatherLabel: 'Hospital · Interior',
    bgmId: 'casa',
    isUnlocked: true,
    tiles: hospitalTiles,
    entities: [
      {
        id: 'deco_hospital_cama_1',
        x: 1,
        y: 2,
        type: 'decorative',
        name: 'Camilla de Recuperación A',
        sprite: 'deco_cama_hospital',
        dialog: ['Sábanas limpias y mantas tibias listas para recibir a espíritus agotados.'],
      },
      {
        id: 'deco_hospital_monitor_1',
        x: 2,
        y: 2,
        type: 'decorative',
        name: 'Monitor de Signos Vitales',
        sprite: 'deco_monitor_medico',
        dialog: ['Pulso elemental estable al 100%.'],
      },
      {
        id: 'deco_hospital_cama_2',
        x: 9,
        y: 2,
        type: 'decorative',
        name: 'Camilla de Recuperación B',
        sprite: 'deco_cama_hospital',
        dialog: ['Área de descanso térmico para criaturas acuáticas y forestales.'],
      },
      {
        id: 'deco_hospital_monitor_2',
        x: 8,
        y: 2,
        type: 'decorative',
        name: 'Monitor Clínico',
        sprite: 'deco_monitor_medico',
      },
      {
        id: 'deco_hospital_botiquin_1',
        x: 4,
        y: 1,
        type: 'decorative',
        name: 'Vitrina de Matico y Sueros',
        sprite: 'deco_botiquin',
        dialog: ['Frascos de infusión de matico, calafate y agua termal estéril.'],
      },
      {
        id: 'deco_hospital_botiquin_2',
        x: 6,
        y: 1,
        type: 'decorative',
        name: 'Botiquín Central',
        sprite: 'deco_botiquin',
      },
      {
        id: 'npc_enfermera_hospital',
        x: 5,
        y: 2,
        type: 'npc',
        name: 'Enfermera Jefe · Atención 24h',
        sprite: 'npc_enfermera',
        isHospital: true,
        dialog: ['¡Bienvenido al Hospital! Todo tu equipo ha sido sanado por completo (100% PS y PM) sin costo.'],
      },
      {
        id: 'shrine_cura_hospital',
        x: 5,
        y: 4,
        type: 'shrine',
        name: 'Estación de Curación Rápida',
        sprite: 'portal_hospital',
        isHospital: true,
        dialog: ['¡Sanación completada! Todos tus espíritus recuperaron el 100% de sus PS y PM.'],
      },
      {
        id: 'portal_exit_hospital',
        x: 5,
        y: 8,
        type: 'portal',
        name: 'Salir al Exterior',
        sprite: 'portal_salir',
        destinationRegion: 'biobio',
        destinationX: 3,
        destinationY: 6,
      },
    ],
    wildEncounterTable: [],
  },

  santuario: {
    id: 'santuario',
    name: 'Santuario de Evolución',
    subtitle: 'Templo Ancestral · Despertar Evolutivo (0%)',
    lore: 'Único recinto sagrado donde los cristales elementales resonantes despiertan la siguiente etapa evolutiva de tus espíritus.',
    width: 11,
    height: 9,
    ambientColor: '#064e3b',
    themeColor: '#10b981',
    weather: 'interior',
    weatherLabel: 'Santuario · Interior',
    bgmId: 'losrios',
    isUnlocked: true,
    tiles: santuarioTiles,
    entities: [
      {
        id: 'deco_cristal_nw',
        x: 2,
        y: 2,
        type: 'decorative',
        name: 'Cristal de Resina Pewén',
        sprite: 'deco_cristal_ancestral',
        dialog: ['Un cristal antiguo que vibra con la savia milenaria del sur.'],
      },
      {
        id: 'deco_cristal_ne',
        x: 8,
        y: 2,
        type: 'decorative',
        name: 'Cristal de Basalto Lunar',
        sprite: 'deco_cristal_ancestral',
        dialog: ['Refleja la memoria de antiguas evoluciones elementales.'],
      },
      {
        id: 'deco_cristal_sw',
        x: 2,
        y: 6,
        type: 'decorative',
        name: 'Cristal de Agua Pura',
        sprite: 'deco_cristal_ancestral',
      },
      {
        id: 'deco_cristal_se',
        x: 8,
        y: 6,
        type: 'decorative',
        name: 'Cristal Glacial Austral',
        sprite: 'deco_cristal_ancestral',
      },
      {
        id: 'npc_sabio_santuario',
        x: 5,
        y: 2,
        type: 'npc',
        name: 'Sabio del Santuario',
        sprite: 'npc_old_man',
        isEvolutionSanctuary: true,
        dialog: ['El Altar de Evolución está encendido. Solo en este templo sagrado puedes despertar la siguiente etapa de tus espíritus.'],
      },
      {
        id: 'shrine_altar_evolucion',
        x: 5,
        y: 4,
        type: 'shrine',
        name: 'Altar de Evolución',
        sprite: 'deco_santuario_evolucion',
        isEvolutionSanctuary: true,
        dialog: ['Canalizando la energía del Santuario para evolucionar a tus criaturas.'],
      },
      {
        id: 'portal_exit_santuario',
        x: 5,
        y: 8,
        type: 'portal',
        name: 'Salir al Exterior',
        sprite: 'portal_salir',
        destinationRegion: 'biobio',
        destinationX: 15,
        destinationY: 6,
      },
    ],
    wildEncounterTable: [],
  },

  tienda: {
    id: 'tienda',
    name: 'Tienda Regional',
    subtitle: 'Botica & Provisiones (0%)',
    lore: 'Acogedor almacén interior con estanterías de madera llenas de hierbas medicinales, empanadas calientes, aguas termales y amuletos.',
    width: 11,
    height: 9,
    ambientColor: '#451a03',
    themeColor: '#facc15',
    weather: 'interior',
    weatherLabel: 'Tienda · Interior',
    bgmId: 'tienda',
    isUnlocked: true,
    tiles: tiendaTiles,
    entities: [
      {
        id: 'deco_tienda_estanteria_1',
        x: 2,
        y: 1,
        type: 'decorative',
        name: 'Estante de Hierbas y Matico',
        sprite: 'deco_estanteria',
        dialog: ['Frascos ordenados de Matico, Calafate y Aguas Termales.'],
      },
      {
        id: 'deco_tienda_estanteria_2',
        x: 8,
        y: 1,
        type: 'decorative',
        name: 'Estante de Amuletos Pewén',
        sprite: 'deco_estanteria',
        dialog: ['Amuletos tallados y cristales elementales listos para la venta.'],
      },
      {
        id: 'deco_tienda_mostrador_l',
        x: 3,
        y: 4,
        type: 'decorative',
        name: 'Mostrador de Atención',
        sprite: 'deco_mostrador',
        dialog: ['Aquí se exhiben empanadas recién horneadas.'],
      },
      {
        id: 'deco_tienda_mostrador_r',
        x: 7,
        y: 4,
        type: 'decorative',
        name: 'Mostrador de Pagos',
        sprite: 'deco_mostrador',
      },
      {
        id: 'npc_vendedor_tienda',
        x: 5,
        y: 3,
        type: 'npc',
        name: 'Comerciante Regional',
        sprite: 'npc_shopkeeper',
        isShop: true,
        dialog: [
          '¡Bienvenido a nuestra tienda interior! Pasa con confianza a ver pociones, empanadas y Amuletos de Vínculo.',
        ],
      },
      {
        id: 'portal_exit_tienda',
        x: 5,
        y: 8,
        type: 'portal',
        name: 'Salir al Exterior',
        sprite: 'portal_salir',
        destinationRegion: 'santiago',
        destinationX: 3,
        destinationY: 7,
      },
    ],
    wildEncounterTable: [],
  },
};
