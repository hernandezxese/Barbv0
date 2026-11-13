/**
 * World Maps & Chilean Regions Repository (Stage 0 Casa + 5 Chilean Biogeographic Regions + Interiors)
 *
 * Map Dimensions:
 * - Interiors: casa, hospital, santuario, tienda -> 11×9
 * - Stage 1 (R. Metropolitana / Santiago) -> 29×25
 * - Stage 2 (R. del Biobío) -> 25×21
 * - Stage 3 (R. de La Araucanía) -> 27×23
 * - Stage 4 (R. de Los Ríos) -> 29×25
 * - Stage 5 (R. de Los Lagos + Isla de Chiloé) -> 37×31
 *
 * Tile Legend:
 * 0 = Ground / Region Grass (6% - 16% encounter según región)
 * 1 = Winding Stone / Dirt Trail / Bridges (0% encounter)
 * 2 = Water / Pacific Ocean / River / Lake / Fjord (impassable)
 * 3 = Mountain / Andes Cordillera / Cerro / Cliff / Wall Barrier (impassable)
 * 4 = Forest / Dense Tree (impassable)
 * 5 = Volcanic Lava Pocket (impassable)
 * 6 = Snow / Ice High Plains (6% - 16% encounter según región)
 * 7 = Wildflowers / Ferns / Crops (6% - 16% encounter según región)
 * 8 = Building / Urban Structure / Ruca Base / Wall (impassable)
 * 9 = Prehistoric / Amber Earth (6% - 16% encounter según región)
 * 10 = Indoor Safe Room Floor (0% encounter)
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
 * Top & bottom cliff walls (3),
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
  drawHLine(grid, 1, w - 2, wallY, 3);
  setTile(grid, cx, wallY, 1);

  fillRect(grid, 1, wallY + 1, w - 2, h - 1, 3);
  fillRect(grid, cx - 2, wallY + 1, cx + 2, h - 1, 3);
  fillRect(grid, cx - 1, wallY + 1, cx + 1, wallY + 3, 1);

  if (hasSouthExitPortal && wallY + 4 < h) {
    setTile(grid, cx, wallY + 4, 1);
    if (wallY + 5 < h) setTile(grid, cx, h - 1, 1);
  }
}

// ============================================================================
// 0. CASA (11×9)
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
  fillRect(g, 3, 4, 7, 5, 1);
  drawVLine(g, 5, 5, 8, 1);
  return g;
})();

// ============================================================================
// INTERIORES: HOSPITAL, SANTUARIO, TIENDA (11×9)
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
// 1. REGIÓN METROPOLITANA / SANTIAGO (29×25)
// - Pacífico (x=0) + 1 cuadro libre costero (x=1) + par de cerros (x=2..3)
// - Pueblos rurales (NO y SO) + Ciudad urbana (Centro-Este)
// - Cerro San Cristóbal (23, 4) rodeado de cerros (tile 3) con acceso sur
// - Río Mapocho (y=12) con puentes (x=8, x=14, x=21)
// - Flores (tile 7) y árboles (tile 4) dispersos
// ============================================================================
const santiagoTiles = (() => {
  const g = createGrid(29, 25, 0);
  applyChileanBorders(g);

  // Pair of west coastal cerros near the sea with 1 walkable tile gap (x=1 stays grass/path)
  fillRect(g, 2, 5, 3, 6, 3);
  fillRect(g, 2, 15, 3, 16, 3);

  // Cerro San Cristóbal surrounded by cerros at NE (x=21..26, y=2..6), open south entrance at (23, 5..6)
  fillRect(g, 21, 2, 26, 5, 3);
  setTile(g, 23, 5, 1);
  setTile(g, 23, 6, 1);

  // Protagonist Home 2x2 (4 tiles behind portal (14,2))
  fillRect(g, 14, 0, 15, 1, 8);

  // Pueblo Rural Noroeste (x=5..7, y=3..4) & Pueblo Suroeste (x=5..7, y=14..15)
  setTile(g, 5, 3, 8);
  setTile(g, 7, 3, 8);
  setTile(g, 5, 14, 8);
  setTile(g, 7, 14, 8);

  // Tienda 2×2 (x=4..5, y=8..9)
  fillRect(g, 4, 8, 5, 9, 8);

  // Ciudad Urbana decorativa (casas individuales 1×1 espaciadas en Santiago Centro-Providencia)
  setTile(g, 16, 5, 8);
  setTile(g, 20, 6, 8);
  setTile(g, 16, 8, 8);
  setTile(g, 20, 9, 8);
  setTile(g, 16, 15, 8);
  setTile(g, 20, 16, 8);

  // Scattered flora (7) and trees (4) across valleys
  fillRect(g, 2, 2, 4, 3, 7);
  fillRect(g, 9, 3, 10, 4, 7);
  fillRect(g, 19, 2, 20, 3, 7);
  fillRect(g, 25, 8, 27, 10, 4);
  fillRect(g, 26, 14, 27, 17, 4);
  fillRect(g, 2, 13, 3, 14, 7);
  fillRect(g, 10, 14, 12, 16, 7);
  fillRect(g, 22, 14, 24, 16, 7);
  setTile(g, 9, 8, 4);
  setTile(g, 10, 9, 4);
  setTile(g, 21, 10, 4);
  setTile(g, 4, 17, 4);
  setTile(g, 24, 17, 4);

  // Río Mapocho across y=12 (Pacific on x=0, Cordillera on x=28) with bridges at x=8, x=14, x=21
  drawHLine(g, 1, 27, 12, 2);
  setTile(g, 8, 12, 1);
  setTile(g, 14, 12, 1);
  setTile(g, 21, 12, 1);

  // Paved city avenues & rural roads (curves East at row 17 toward Boss Gate at x=21)
  drawHLine(g, 5, 20, 2, 1);
  drawVLine(g, 14, 2, 17, 1);
  drawHLine(g, 4, 23, 7, 1);
  drawVLine(g, 8, 4, 17, 1);
  drawVLine(g, 21, 7, 19, 1);
  drawVLine(g, 4, 10, 11, 1);
  drawHLine(g, 4, 23, 10, 1);
  drawVLine(g, 18, 4, 17, 1);
  drawHLine(g, 5, 22, 14, 1);
  drawHLine(g, 8, 22, 17, 1);

  // Compact 3×3 Boss Enclosure at South-East (cx=21, wallY=19, arena rows 20..22, exit (21, 24))
  carveCompactBossEnclosure3x3(g, 21, 19, true);
  setTile(g, 21, 23, 1);
  setTile(g, 21, 24, 1);

  return g;
})();

// ============================================================================
// 2. REGIÓN DEL BIOBÍO (25×21)
// - Más grande (25×21)
// - Río que cruza (y=7) con puentes + Línea de Tren (tile 11, y=10)
// - Más árboles (4), flora local (7), bolsillos jurásicos (9), ciudad (8)
// - Volcán Antuco en el Sureste (21, 12) rodeado de montañas (tile 3)
// - Hospital (NO) y Santuario (Norte-Centro-Este)
// ============================================================================
const biobioTiles = (() => {
  const g = createGrid(25, 21, 0);
  applyChileanBorders(g);

  // North-East entrance coherent with Santiago SE exit (x=18, y=0)
  setTile(g, 18, 0, 1);
  drawVLine(g, 18, 0, 14, 1);

  // Secret fossil chest alcove at NE (chest at (22, 3), water obstacle at (21, 3))
  fillRect(g, 20, 2, 23, 4, 3);
  setTile(g, 20, 3, 1);
  setTile(g, 21, 3, 1);
  setTile(g, 22, 3, 9);

  // Volcán Antuco surrounded by mountains at SE (x=19..23, y=11..13), open south entrance at (21, 13) -> road y=14
  fillRect(g, 19, 11, 23, 13, 3);
  setTile(g, 21, 13, 1);

  // Hospital 2×2 NW (x=3..4, y=3..4) & Santuario 2×2 NE-Center (x=15..16, y=3..4)
  fillRect(g, 3, 3, 4, 4, 8);
  fillRect(g, 15, 3, 16, 4, 8);

  // City blocks decorativos (casas individuales 1×1 espaciadas al sur del río)
  setTile(g, 5, 12, 8);
  setTile(g, 6, 13, 8);
  setTile(g, 9, 12, 8);
  setTile(g, 15, 12, 8);
  setTile(g, 17, 12, 8);

  // More trees & local flora + prehistoric amber earth
  fillRect(g, 1, 2, 2, 5, 4);
  fillRect(g, 6, 1, 8, 2, 4);
  fillRect(g, 1, 11, 2, 14, 4);
  fillRect(g, 22, 8, 23, 9, 4);
  setTile(g, 10, 4, 4);
  setTile(g, 18, 8, 4);
  setTile(g, 3, 14, 7);
  fillRect(g, 15, 8, 17, 9, 7);
  fillRect(g, 2, 8, 5, 9, 9);
  fillRect(g, 13, 11, 17, 14, 9);

  // Crossing River (Río Biobío) across row 7 with timber bridges at x=6, x=12, x=18
  drawHLine(g, 1, 23, 7, 2);
  setTile(g, 6, 7, 1);
  setTile(g, 12, 7, 1);
  setTile(g, 18, 7, 1);

  // Railway Tracks (tile 11) across row 10
  drawHLine(g, 1, 23, 10, 11);

  // Paths connecting Hospital, Santuario, Secret NE Pocket, Antuco SE, City & West Boss Gate (x=6)
  drawHLine(g, 3, 19, 2, 1);
  setTile(g, 19, 3, 1);
  drawHLine(g, 3, 21, 6, 1);
  drawVLine(g, 6, 2, 15, 1);
  drawVLine(g, 12, 6, 14, 1);
  drawHLine(g, 5, 21, 14, 1);

  // Compact 3×3 Boss Enclosure at South-West (cx=6, wallY=15, arena rows 16..18, exit (6, 20))
  carveCompactBossEnclosure3x3(g, 6, 15, true);
  setTile(g, 6, 19, 1);
  setTile(g, 6, 20, 1);

  return g;
})();

// ============================================================================
// 3. REGIÓN DE LA ARAUCANÍA (27×23)
// - Más grande (27×23)
// - Muchos árboles (araucarias, tile 4) + flora (7)
// - Volcán Villarrica en Norte-Centro (12, 4) rodeado de cerros (3)
// - Pequeño Lago (tile 2)
// - Ciudad (8) + Pueblo étnico Mapuche (Rucas + Mapuche NPCs)
// - Tienda (2×2)
// ============================================================================
const araucaniaTiles = (() => {
  const g = createGrid(27, 23, 0);
  applyChileanBorders(g);

  // North-West entrance coherent with Biobío SW exit (x=7, y=0)
  setTile(g, 7, 0, 1);
  drawVLine(g, 7, 0, 6, 1);

  // Volcán Villarrica surrounded by cerros at North-Center (x=10..14, y=3..5), open south entrance at (12, 5)
  fillRect(g, 10, 3, 14, 5, 3);
  setTile(g, 12, 5, 1);

  // Pair of cerros (West & South-East)
  fillRect(g, 2, 8, 3, 9, 3);
  fillRect(g, 21, 14, 22, 15, 3);

  // Tienda 2×2 NW (x=3..4, y=3..4)
  fillRect(g, 3, 3, 4, 4, 8);

  // Ciudad decorativa (casas individuales 1×1 en Temuco)
  setTile(g, 15, 3, 8);
  setTile(g, 16, 5, 8);
  setTile(g, 18, 3, 8);
  setTile(g, 18, 5, 8);

  // Small Lake (Lago Villarrica, x=8..11, y=11..13)
  fillRect(g, 8, 11, 11, 13, 2);

  // Lots of Araucaria trees (tile 4) & wildflower meadows (tile 7)
  fillRect(g, 1, 1, 2, 6, 4);
  fillRect(g, 9, 1, 13, 1, 4);
  fillRect(g, 24, 1, 25, 15, 4);
  fillRect(g, 1, 11, 2, 16, 4);
  fillRect(g, 15, 9, 17, 11, 4);
  fillRect(g, 20, 9, 22, 11, 4);
  fillRect(g, 15, 15, 16, 16, 4);
  setTile(g, 6, 7, 4);
  setTile(g, 8, 7, 4);
  setTile(g, 19, 12, 4);

  fillRect(g, 5, 3, 7, 5, 7);
  fillRect(g, 20, 3, 22, 5, 7);
  fillRect(g, 14, 12, 17, 14, 7);
  fillRect(g, 3, 15, 7, 16, 7);

  // Winding trails around lake, city, Mapuche village (SW) & Villarrica -> East Boss Gate (x=18)
  drawHLine(g, 3, 19, 2, 1);
  drawHLine(g, 3, 22, 6, 1);
  drawVLine(g, 6, 6, 14, 1);
  drawVLine(g, 13, 6, 14, 1);
  drawVLine(g, 18, 6, 17, 1);
  drawHLine(g, 4, 18, 10, 1);
  drawHLine(g, 6, 20, 14, 1);

  // Compact 3×3 Boss Enclosure at South-East (cx=18, wallY=17, arena rows 18..20, exit (18, 22))
  carveCompactBossEnclosure3x3(g, 18, 17, true);
  setTile(g, 18, 21, 1);
  setTile(g, 18, 22, 1);

  return g;
})();

// ============================================================================
// 4. REGIÓN DE LOS RÍOS (29×25)
// - Más grande (29×25)
// - Hospital (NO) y Santuario (NE)
// - 2 Ríos que cruzan (y=7 y y=15) + 1 Lago (x=18..22, y=10..12)
// - 1 Pueblo (Oeste) + 1 Ciudad (Centro)
// - Flora local (7) + árboles (4)
// - Volcán Mocho-Choshuenco en Suroeste (3, 17) + Volcán Puyehue (25, 11)
// ============================================================================
const losriosTiles = (() => {
  const g = createGrid(29, 25, 0);
  applyChileanBorders(g);

  // North-East entrance coherent with Araucanía SE exit (x=21, y=0)
  setTile(g, 21, 0, 1);
  drawVLine(g, 21, 0, 6, 1);

  // Hospital 2×2 NW (x=3..4, y=3..4) & Santuario 2×2 Center-NE (x=17..18, y=3..4)
  fillRect(g, 3, 3, 4, 4, 8);
  fillRect(g, 17, 3, 18, 4, 8);

  // Cerro Mirador NE (open highland meadows nearby at x=21..23, y=3..5)
  fillRect(g, 24, 3, 26, 4, 3);

  // Volcán Mocho-Choshuenco surrounded by cerros at SW (x=1..5, y=16..18), east entrance at (4..5, 17)
  fillRect(g, 1, 16, 5, 18, 3);
  setTile(g, 4, 17, 1);
  setTile(g, 5, 17, 1);

  // Second Volcano: Volcán Puyehue at (25, 11) with rocky collar
  fillRect(g, 24, 10, 26, 11, 3);
  setTile(g, 25, 12, 1);

  // Cerro East-South
  fillRect(g, 23, 16, 24, 17, 3);

  // Pueblo (x=3..5, y=9..11) & Ciudad (Valdivia center, x=8..11, y=9..12)
  setTile(g, 3, 9, 8);
  setTile(g, 5, 9, 8);
  setTile(g, 4, 11, 8);
  setTile(g, 8, 9, 8);
  setTile(g, 11, 9, 8);
  setTile(g, 8, 12, 8);
  setTile(g, 12, 13, 8);

  // River 1 across row 7 (x=1..27) with bridges at x=6, x=14, x=22
  drawHLine(g, 1, 27, 7, 2);
  setTile(g, 6, 7, 1);
  setTile(g, 14, 7, 1);
  setTile(g, 22, 7, 1);

  // Lake (Lago Ranco / Panguipulli) at x=18..21, y=10..12
  fillRect(g, 18, 10, 21, 12, 2);

  // River 2 across row 15 (x=1..27) with bridges at x=6, x=14, x=22
  drawHLine(g, 1, 27, 15, 2);
  setTile(g, 6, 15, 1);
  setTile(g, 14, 15, 1);
  setTile(g, 22, 15, 1);

  // Dense Valdivian flora (7) and rainforest trees (4)
  fillRect(g, 6, 1, 11, 2, 4);
  fillRect(g, 1, 1, 2, 5, 4);
  fillRect(g, 26, 12, 27, 14, 4);
  fillRect(g, 7, 16, 9, 17, 7);
  fillRect(g, 16, 16, 20, 17, 7);
  fillRect(g, 2, 12, 6, 13, 7);
  fillRect(g, 15, 9, 17, 11, 7);

  // Connecting trails & bridge links -> winds West to Boss Gate (x=9)
  drawHLine(g, 3, 21, 2, 1);
  drawHLine(g, 3, 24, 6, 1);
  drawVLine(g, 6, 5, 17, 1);
  drawVLine(g, 14, 6, 17, 1);
  drawVLine(g, 22, 6, 17, 1);
  drawHLine(g, 6, 17, 11, 1);
  drawHLine(g, 14, 25, 13, 1);
  drawHLine(g, 4, 22, 17, 1);
  drawVLine(g, 9, 17, 19, 1);

  // Compact 3×3 Boss Enclosure at South-West (cx=9, wallY=19, arena rows 20..22, exit (9, 24))
  carveCompactBossEnclosure3x3(g, 9, 19, true);
  setTile(g, 9, 23, 1);
  setTile(g, 9, 24, 1);

  return g;
})();

// ============================================================================
// 5. REGIÓN DE LOS LAGOS (37×31)
// - Continente se extiende al sur SÓLO por la mitad ESTE (Cordillera, x=18..35)
// - Mitad OESTE / SUROESTE es Mar Pacífico abierto (tile 2) con una GRAN ISLA (Chiloé, x=2..14, y=9..23)
//   conectada al continente por el puente/ferry en y=14 (x=14..19)
// - Nieve (tile 6) marcada hacia la Cordillera (este)
// - Volcán Osorno en Este-Centro (32, 12) rodeado de cerros/montañas (3)
// - 3 Pueblos (Palafitos Castro en Isla, Quellón Sur en Isla, Ensenada Este) + 1 Ciudad (Puerto Montt/Varas NE)
// - Tienda (2×2) + Santuario Gemelo 5×3 de Cai Cai & Vilu Vilu al sur del continente
// ============================================================================
const loslagosTiles = (() => {
  const g = createGrid(37, 31, 0);
  applyChileanBorders(g);

  // North-West entrance coherent with Los Ríos SW exit (x=11, y=0)
  setTile(g, 11, 0, 1);
  drawVLine(g, 11, 0, 6, 1);
  drawVLine(g, 18, 2, 6, 1);

  // Southern Pacific Gulf on the West (x = 0..17, y = 7..29)
  fillRect(g, 0, 7, 17, 29, 2);

  // Large Island (Isla Grande de Chiloé) sitting in the Western Sea: x = 2..14, y = 9..23
  fillRect(g, 2, 9, 14, 23, 0);
  fillRect(g, 4, 10, 12, 12, 7); // Island wildflower fields
  fillRect(g, 2, 16, 4, 19, 4); // Chiloé National Park trees
  fillRect(g, 11, 18, 13, 21, 4);
  fillRect(g, 4, 11, 5, 11, 3); // Western island hill

  // Pueblo 1 (Castro Palafitos 1×1 en Isla) & Pueblo 2 (Quellón Sur 1×1 en Isla)
  setTile(g, 5, 13, 8);
  setTile(g, 7, 13, 8);
  setTile(g, 6, 20, 8);
  setTile(g, 8, 20, 8);

  // Bridge / Chacao Channel Crossing (x = 13..20, y = 14) linking Island <-> Mainland
  drawHLine(g, 4, 26, 14, 1);
  drawVLine(g, 8, 10, 22, 1);

  // Mainland Snow marked strongly toward the Cordillera (East side, x=26..35)
  fillRect(g, 26, 1, 35, 24, 6);
  fillRect(g, 22, 16, 35, 24, 6);

  // Mainland Trees (tile 4) & Wildflowers (tile 7)
  fillRect(g, 2, 1, 7, 2, 4);
  fillRect(g, 13, 1, 16, 1, 4);
  fillRect(g, 31, 3, 35, 5, 4);
  fillRect(g, 20, 17, 23, 20, 4);
  fillRect(g, 33, 16, 35, 19, 4);
  fillRect(g, 19, 10, 21, 13, 7);

  // Volcán Osorno surrounded by mountains at East-Center (x=31..34, y=11..13), west entrance (31, 12) meeting x=30 trail
  fillRect(g, 31, 11, 34, 13, 3);
  setTile(g, 31, 12, 1);

  // Extra Cordillera Cerros / Mountains on Mainland
  fillRect(g, 27, 11, 28, 12, 3);
  fillRect(g, 31, 17, 32, 18, 3);

  // Ciudad decorativa (casas 1×1 espaciadas en Puerto Montt / Varas)
  setTile(g, 20, 3, 8);
  setTile(g, 21, 4, 8);
  setTile(g, 23, 3, 8);
  setTile(g, 24, 4, 8);

  // Tienda 2×2 on Mainland (x=22..23, y=8..9)
  fillRect(g, 22, 8, 23, 9, 8);

  // Pueblo 3 (Ensenada Cordillerana, x=28..30, y=8..9)
  setTile(g, 28, 8, 8);
  setTile(g, 30, 8, 8);

  // Mainland Trails
  drawHLine(g, 4, 29, 2, 1);
  drawHLine(g, 18, 30, 6, 1);
  drawHLine(g, 22, 30, 10, 1);
  drawVLine(g, 20, 6, 16, 1);
  drawVLine(g, 26, 6, 25, 1);
  drawVLine(g, 30, 6, 21, 1);
  drawHLine(g, 20, 30, 21, 1);

  // Southern Fjord Water (x=18..35, y=23..29) separating Mainland from Boss Island
  fillRect(g, 18, 23, 35, 29, 2);
  // Mainland bridgehead
  setTile(g, 26, 22, 1);
  // Single 1-tile bridge across fjord (x=26, y=23..24) guarded by Hielo obstacle at (26, 24)
  setTile(g, 26, 23, 1);
  setTile(g, 26, 24, 1);
  // Twin-Boss Island completely surrounded by water (x=23..29, y=25..28)
  fillRect(g, 23, 25, 29, 28, 6);
  fillRect(g, 24, 26, 28, 28, 1);
  setTile(g, 26, 25, 1); // Island landing right after bridge

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
        name: 'Abuela Mary',
        sprite: 'npc_abuela',
        dialog: [
          '¡Buenos días, mi Elegido! Hoy comienza tu misión para limpiar, educar y sanar el sur de Chile frente a los proyectos industriales sin resguardo ambiental.',
          'Las Criaturas Espirituales confían en ti para defender la naturaleza. En los caminos no hay peligro (0%), y en el pasto o flores aparecen salvajes (6%-16% según la región).',
          'Siempre puedes volver a descansar en tu cama para recuperar fuerzas. ¡Cuida nuestro sur!',
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
          'Apuntes de Casa: Tiendas en Stages 1, 3 y 5; Hospitales en Stages 2 y 4.',
          'Inspecciona el cerro o volcán emblemático de cada región para despejar por completo la sombra del mapa.',
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
        destinationX: 14,
        destinationY: 3,
      },
    ],
    wildEncounterTable: [],
  },

  santiago: {
    id: 'santiago',
    name: 'R. Metropolitana',
    subtitle: 'Stage 1 · Río Mapocho, Cerros y Urbe',
    lore: 'El Río Mapocho cruza el Valle Central entre el Océano Pacífico al oeste, pueblos rurales, la ciudad y el Cerro San Cristóbal rodeado de cumbres.',
    width: 29,
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
        x: 14,
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
        x: 14,
        y: 4,
        type: 'npc',
        name: 'Don Ignacio',
        sprite: 'npc_old_man',
        dialog: [
          '¡Qué gusto verte salir de casa, Elegido! Soy Don Ignacio, guardián botánico de la R. Metropolitana.',
          'Faenas extractivas desreguladas están afectando los cerros y ríos; sube al Cerro San Cristóbal al noreste para revelar todo el mapa sin sombras.',
          '¡Toma estos Amuletos de Vínculo para reclutar un Quiltro de TIERRA y despejar la barrera del sur!',
        ],
        rewardItem: { id: 'orbe_resonancia', count: 3 },
      },
      {
        id: 'portal_tienda_santiago',
        x: 4,
        y: 10,
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
        x: 6,
        y: 2,
        type: 'decorative',
        name: 'Cerro Blanco (Norte)',
        sprite: 'deco_cerro_blanco',
        dialog: ['Cerro Blanco: mirador ancestral de piedra blanca en el sector norte de Santiago.'],
      },
      {
        id: 'deco_cerro_costa_rm_1',
        x: 2,
        y: 5,
        type: 'decorative',
        name: 'Cerro Costero Norte',
        sprite: 'deco_cerro_verde',
        dialog: ['Mirador costero con brisa del Océano Pacífico a un paso de la playa.'],
      },
      {
        id: 'deco_cerro_costa_rm_2',
        x: 2,
        y: 15,
        type: 'decorative',
        name: 'Cerro Costero Sur',
        sprite: 'deco_cerro_verde',
        dialog: ['Ladera frente al mar donde anidan las torcazas de la costa central.'],
      },
      {
        id: 'landmark_san_cristobal_rm',
        x: 23,
        y: 4,
        type: 'decorative',
        name: 'Cerro San Cristóbal (Mirador)',
        sprite: 'deco_san_cristobal',
        revealsRegionMap: true,
        footprint: [{ dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: 0, dy: 0 }],
        dialog: [
          '¡Subiste al mirador del Cerro San Cristóbal rodeado de cerros!',
          'Desde aquí divisas toda la R. Metropolitana, el Río Mapocho, sus pueblos y la Cordillera. ¡La sombra del mapa ha desaparecido!',
        ],
      },
      {
        id: 'deco_cerro_santa_isabel_rm',
        x: 24,
        y: 18,
        type: 'decorative',
        name: 'Cerro Santa Isabel (Sur)',
        sprite: 'deco_cerro_santa_isabel',
        dialog: ['Cerro Santa Isabel: loma verde al sur del Río Mapocho donde descansan quiltros y loicas.'],
      },
      {
        id: 'npc_escolar_rm',
        x: 10,
        y: 7,
        type: 'npc',
        name: 'Tomás · Niño Escolar',
        sprite: 'npc_escolar',
        dialog: [
          '¡Hola! Entre el océano y los cerros de la costa queda un sendero de pasto tranquilo.',
          'Al noreste está el Cerro San Cristóbal rodeado de cerros: ¡visítalo para ver el mapa completo!',
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
          'Recuerda vincular un Quiltro de TIERRA y ponerlo como COMPAÑERO ESPIRITUAL para abrir la barrera.',
        ],
      },
      {
        id: 'npc_maestro_santiago',
        x: 22,
        y: 21,
        type: 'npc',
        name: 'Maestro Vínculo Rodrigo',
        sprite: 'npc_maestro_vinculo',
        dialog: [
          'Soy Rodrigo, Maestro Vínculo de la R. Metropolitana. Custodio al coloso Costanera Center (Nv.5).',
          'Vence esta prueba y obtendrás el Amuleto Espiritual Valle Central.',
        ],
      },
      {
        id: 'chest_santiago_1',
        x: 6,
        y: 4,
        type: 'chest',
        name: 'Cofre del Pueblo Norte',
        sprite: 'chest',
        rewardItem: { id: 'esencia_pewen', count: 1 },
        rewardGold: 140,
      },
      {
        id: 'item_hp_santiago_1',
        x: 1,
        y: 10,
        type: 'chest',
        name: 'Baya de Vitalidad (+100% PS)',
        sprite: 'item_hp',
        healHpPercent: 100,
      },
      {
        id: 'item_mana_santiago_1',
        x: 23,
        y: 10,
        type: 'chest',
        name: 'Cristal de Maná (+100% PM)',
        sprite: 'item_mana',
        healMpPercent: 100,
      },
      {
        id: 'obstacle_santiago_bonus',
        x: 2,
        y: 17,
        type: 'obstacle',
        isBonusObstacle: true,
        name: 'Matorral del Valle (Bonus)',
        sprite: 'obstacle_vines',
        elementRequired: 'fuego',
        obstacleClearMessage: '¡Tu Compañero Espiritual de FUEGO despejó el matorral oculto!',
      },
      {
        id: 'obstacle_santiago_bonus_2',
        x: 25,
        y: 11,
        type: 'obstacle',
        isBonusObstacle: true,
        name: 'Grieta Termal del Mapocho (Bonus)',
        sprite: 'obstacle_magma',
        elementRequired: 'agua',
        obstacleClearMessage: '¡Tu Compañero Espiritual de AGUA serenó la grieta ribereña!',
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
        id: 'wild_santiago_quiltro_2',
        x: 10,
        y: 5,
        type: 'wild_encounter',
        name: 'Quiltro Guardián (Nv.4)',
        sprite: 'wild_quiltro',
        encounterSpiritId: 'quiltro',
        customLevel: 4,
      },
      {
        id: 'wild_santiago_quiltro_3',
        x: 15,
        y: 16,
        type: 'wild_encounter',
        name: 'Quiltro Callejero (Nv.4)',
        sprite: 'wild_quiltro',
        encounterSpiritId: 'quiltro',
        customLevel: 4,
      },
      {
        id: 'wild_santiago_loica',
        x: 22,
        y: 15,
        type: 'wild_encounter',
        name: 'Loica Guardiana (Nv.4)',
        sprite: 'wild_loica',
        encounterSpiritId: 'loica',
        customLevel: 4,
      },
      {
        id: 'wild_santiago_torcaza',
        x: 3,
        y: 3,
        type: 'wild_encounter',
        name: 'Torcaza del Valle (Nv.3)',
        sprite: 'wild_torcaza',
        encounterSpiritId: 'torcaza',
        customLevel: 3,
      },
      {
        id: 'wild_santiago_torcaza_2',
        x: 2,
        y: 11,
        type: 'wild_encounter',
        name: 'Torcaza Costera (Nv.4)',
        sprite: 'wild_torcaza',
        encounterSpiritId: 'torcaza',
        customLevel: 4,
      },
      {
        id: 'wild_santiago_condor',
        x: 19,
        y: 3,
        type: 'wild_encounter',
        name: 'Pichón de Cóndor (Nv.4)',
        sprite: 'wild_condor',
        encounterSpiritId: 'condor',
        customLevel: 4,
      },
      {
        id: 'wild_santiago_loica_2',
        x: 13,
        y: 18,
        type: 'wild_encounter',
        name: 'Loica del Santa Isabel (Nv.4)',
        sprite: 'wild_loica',
        encounterSpiritId: 'loica',
        customLevel: 4,
      },
      {
        id: 'wild_santiago_gato',
        x: 12,
        y: 8,
        type: 'wild_encounter',
        name: 'Gato Güiña Urbano (Nv.4)',
        sprite: 'wild_gato_chileno',
        encounterSpiritId: 'gato_chileno',
        customLevel: 4,
      },
      {
        id: 'wild_santiago_torcaza_3',
        x: 23,
        y: 15,
        type: 'wild_encounter',
        name: 'Torcaza de las Flores (Nv.4)',
        sprite: 'wild_torcaza',
        encounterSpiritId: 'torcaza',
        customLevel: 4,
      },
      {
        id: 'npc_patrol_rm_1',
        x: 8,
        y: 7,
        type: 'npc',
        name: 'Sofía · Guardaparque',
        sprite: 'npc_ranger',
        patrolPath: [
          { x: 8, y: 7 },
          { x: 14, y: 7 },
          { x: 14, y: 10 },
          { x: 8, y: 10 },
        ],
        dialog: [
          'Patrullo los senderos para frenar vertidos industriales sin control cerca del Río Mapocho.',
          'Recuerda que mientras camines por avenidas pavimentadas tienes 0% de encuentros.',
        ],
      },
      {
        id: 'npc_patrol_rm_2',
        x: 8,
        y: 14,
        type: 'npc',
        name: 'Camila · Educadora Ambiental',
        sprite: 'npc_villager_f',
        patrolPath: [
          { x: 8, y: 14 },
          { x: 14, y: 14 },
          { x: 14, y: 17 },
          { x: 8, y: 17 },
        ],
        dialog: [
          'Educamos a los vecinos del sector sur para proteger a las Criaturas Espirituales y limpiar nuestras plazas.',
        ],
      },
      {
        id: 'postgame_santiago_brotin',
        x: 10,
        y: 11,
        type: 'wild_encounter',
        requiresStoryCleared: true,
        name: 'Brotín Silvestre (Nv.5)',
        sprite: 'wild_brotin',
        encounterSpiritId: 'brotin',
        customLevel: 5,
      },
      {
        id: 'obstacle_santiago_ruta',
        x: 21,
        y: 19,
        type: 'obstacle',
        name: 'Barrera Sísmica de Hormigón (Misión)',
        sprite: 'obstacle_rock',
        elementRequired: 'tierra',
        obstacleClearMessage: '¡Tu Criatura Espiritual de TIERRA estabilizó la barrera hacia el Costanera Center!',
        dialog: ['Bloques sísmicos sellan el acceso sureste. Equipa como COMPAÑERO ESPIRITUAL a una Criatura de TIERRA (ej. Quiltro).'],
      },
      {
        id: 'boss_santiago',
        x: 21,
        y: 21,
        type: 'boss',
        name: 'Coloso Costanera Center (Nv.5)',
        sprite: 'boss_costanera',
        bossSpiritId: 'costanera',
        customLevel: 5,
        requiresMissionsCleared: true,
        dialog: ['¡EL COLOSO DEL COSTANERA CENTER DESPIERTA SOBRE EL RÍO MAPOCHO!'],
      },
      {
        id: 'portal_to_biobio',
        x: 21,
        y: 24,
        type: 'portal',
        name: 'Ruta a R. del Biobío',
        sprite: 'portal_sign',
        destinationRegion: 'biobio',
        destinationX: 18,
        destinationY: 1,
      },
    ],
    wildEncounterTable: [
      { spiritId: 'quiltro', minLevel: 2, maxLevel: 3, weight: 40 },
      { spiritId: 'torcaza', minLevel: 2, maxLevel: 3, weight: 32 },
      { spiritId: 'loica', minLevel: 2, maxLevel: 3, weight: 18 },
      { spiritId: 'condor', minLevel: 3, maxLevel: 3, weight: 6 },
      // Evoluciones salvajes raras (tasa Místico weight 4, +2 niveles respecto a la zona)
      { spiritId: 'quiltro', minLevel: 4, maxLevel: 5, weight: 4, stage: 2 },
      { spiritId: 'torcaza', minLevel: 4, maxLevel: 5, weight: 4, stage: 2 },
      { spiritId: 'loica', minLevel: 4, maxLevel: 5, weight: 4, stage: 2 },
      { spiritId: 'condor', minLevel: 5, maxLevel: 5, weight: 4, stage: 2 },
    ],
  },

  biobio: {
    id: 'biobio',
    name: 'R. del Biobío',
    subtitle: 'Stage 2 · Río, Vía Férrea y Volcán Antuco',
    lore: 'Extenso valle entre el Pacífico y el Volcán Antuco, cruzado por un gran río y la antigua vía férrea, entre bosques, ciudad y fósiles jurásicos.',
    width: 25,
    height: 21,
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
        x: 18,
        y: 0,
        type: 'portal',
        name: 'Volver a R. Metropolitana',
        sprite: 'portal_sign',
        destinationRegion: 'santiago',
        destinationX: 21,
        destinationY: 22,
      },
      {
        id: 'npc_lautaro_biobio',
        x: 17,
        y: 2,
        type: 'npc',
        name: 'Lautaro · Guardián del Biobío',
        sprite: 'npc_ranger',
        dialog: [
          '¡Bienvenido a la R. del Biobío! Al oeste está el Hospital, cerca el Santuario y al sureste el Volcán Antuco.',
          'Al visitar el Volcán Antuco despejarás toda la sombra del mapa regional.',
          'Luego cruza el río y la vía férrea hacia el suroeste y lleva un Velociraptor Ígneo (FUEGO) como Compañero Espiritual. ¡Toma estas Gotas Termales!',
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
        id: 'landmark_volcan_antuco_biobio',
        x: 21,
        y: 12,
        type: 'decorative',
        name: 'Volcán Antuco (Cumbre SE)',
        sprite: 'deco_volcan',
        revealsRegionMap: true,
        footprint: [{ dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: 0, dy: 0 }],
        dialog: [
          '¡Contemplaste la cumbre nevada del Volcán Antuco rodeada de montañas al sureste!',
          'El viento cordillerano disipa la neblina de toda la R. del Biobío. ¡Mapa regional completamente revelado!',
        ],
      },
      {
        id: 'npc_agricultor_biobio',
        x: 6,
        y: 6,
        type: 'npc',
        name: 'Raúl · Agricultor del Laja',
        sprite: 'npc_agricultor',
        dialog: [
          'Los puentes sobre el Río Biobío y la línea del tren tienen 0% de encuentros salvajes.',
        ],
      },
      {
        id: 'npc_arqueologo_biobio',
        x: 16,
        y: 11,
        type: 'npc',
        name: 'Dr. Morales · Arqueólogo',
        sprite: 'npc_arqueologo',
        dialog: [
          'Cerca de la ciudad del Biobío hallamos Velociraptores de fuego y Cuellilargos junto al ámbar jurásico.',
          'Pon una Criatura Espiritual de FUEGO como COMPAÑERO ESPIRITUAL para quemar la maleza fósil del estadio del T-Rex.',
        ],
      },
      {
        id: 'npc_musico_biobio',
        x: 7,
        y: 14,
        type: 'npc',
        name: 'Mateo · Músico Ferroviario',
        sprite: 'npc_musico',
        dialog: ['Toco guitarra entre la estación ferroviaria y la ciudad del Biobío. ¡Éxito frente al T-Rex Tirano!'],
      },
      {
        id: 'npc_maestro_biobio',
        x: 7,
        y: 17,
        type: 'npc',
        name: 'Maestro Vínculo Lautaro',
        sprite: 'npc_maestro_vinculo',
        dialog: [
          'Custodio al T-Rex Tirano del Biobío (Nv.7). Demuestra tu estrategia elemental para ganar el Amuleto Espiritual Jurásico Biobío.',
        ],
      },
      {
        id: 'obstacle_biobio',
        x: 21,
        y: 3,
        type: 'obstacle',
        name: 'Grieta Torrencial (Opcional)',
        sprite: 'obstacle_water',
        elementRequired: 'agua',
        obstacleClearMessage: 'Tu Compañero Espiritual de AGUA serenó la grieta y despejó el cofre secreto.',
      },
      {
        id: 'chest_biobio_bonus',
        x: 22,
        y: 3,
        type: 'chest',
        name: 'Cofre Fósil del Antuco',
        sprite: 'chest',
        rewardItem: { id: 'corazon_basalto', count: 1 },
        rewardGold: 220,
      },
      {
        id: 'obstacle_biobio_bonus',
        x: 9,
        y: 5,
        type: 'obstacle',
        isBonusObstacle: true,
        name: 'Maleza del Laja (Bonus)',
        sprite: 'obstacle_vines',
        elementRequired: 'planta',
        obstacleClearMessage: '¡Tu Compañero Espiritual de PLANTA armonizó la espesura del Laja!',
      },
      {
        id: 'item_hp_biobio_1',
        x: 2,
        y: 9,
        type: 'chest',
        name: 'Poción de Vitalidad (+100% PS)',
        sprite: 'item_hp',
        healHpPercent: 100,
      },
      {
        id: 'item_mana_biobio_1',
        x: 18,
        y: 9,
        type: 'chest',
        name: 'Cristal de Maná (+100% PM)',
        sprite: 'item_mana',
        healMpPercent: 100,
      },
      {
        id: 'wild_biobio_velociraptor',
        x: 14,
        y: 11,
        type: 'wild_encounter',
        name: 'Velociraptor Ígneo (Nv.6)',
        sprite: 'wild_velociraptor',
        encounterSpiritId: 'velociraptor',
        customLevel: 6,
      },
      {
        id: 'wild_biobio_velociraptor_2',
        x: 13,
        y: 4,
        type: 'wild_encounter',
        name: 'Velociraptor Norteño (Nv.5)',
        sprite: 'wild_velociraptor',
        encounterSpiritId: 'velociraptor',
        customLevel: 5,
      },
      {
        id: 'wild_biobio_cuellilargo',
        x: 11,
        y: 13,
        type: 'wild_encounter',
        name: 'Cuellilargo Ancestral (Nv.6)',
        sprite: 'wild_cuellilargo',
        encounterSpiritId: 'cuellilargo',
        customLevel: 6,
      },
      {
        id: 'wild_biobio_cuellilargo_2',
        x: 17,
        y: 8,
        type: 'wild_encounter',
        name: 'Cuellilargo del Laja (Nv.5)',
        sprite: 'wild_cuellilargo',
        encounterSpiritId: 'cuellilargo',
        customLevel: 5,
      },
      {
        id: 'wild_biobio_loica',
        x: 11,
        y: 4,
        type: 'wild_encounter',
        name: 'Loica del Biobío (Nv.5)',
        sprite: 'wild_loica',
        encounterSpiritId: 'loica',
        customLevel: 5,
      },
      {
        id: 'wild_biobio_quiltro',
        x: 4,
        y: 9,
        type: 'wild_encounter',
        name: 'Quiltro Ferroviario (Nv.6)',
        sprite: 'wild_quiltro',
        encounterSpiritId: 'quiltro',
        customLevel: 6,
      },
      {
        id: 'wild_biobio_gato',
        x: 3,
        y: 12,
        type: 'wild_encounter',
        name: 'Gato Güiña del Biobío (Nv.5)',
        sprite: 'wild_gato_chileno',
        encounterSpiritId: 'gato_chileno',
        customLevel: 5,
      },
      {
        id: 'wild_biobio_copihue',
        x: 16,
        y: 9,
        type: 'wild_encounter',
        name: 'Brote de Copihue (Nv.5)',
        sprite: 'wild_copihue',
        encounterSpiritId: 'copihue',
        customLevel: 5,
      },
      {
        id: 'wild_biobio_loica_2',
        x: 9,
        y: 3,
        type: 'wild_encounter',
        name: 'Loica del Valle (Nv.5)',
        sprite: 'wild_loica',
        encounterSpiritId: 'loica',
        customLevel: 5,
      },
      {
        id: 'wild_biobio_loica_3',
        x: 20,
        y: 8,
        type: 'wild_encounter',
        name: 'Loica del Antuco (Nv.6)',
        sprite: 'wild_loica',
        encounterSpiritId: 'loica',
        customLevel: 6,
      },
      {
        id: 'wild_biobio_gato_2',
        x: 19,
        y: 16,
        type: 'wild_encounter',
        name: 'Gato Güiña del Sur (Nv.6)',
        sprite: 'wild_gato_chileno',
        encounterSpiritId: 'gato_chileno',
        customLevel: 6,
      },
      {
        id: 'wild_biobio_huevo',
        x: 3,
        y: 8,
        type: 'wild_encounter',
        name: 'Huevo de Dinosaurio Fósil (Nv.5)',
        sprite: 'wild_huevo_dino',
        encounterSpiritId: 'huevo_dino',
        customLevel: 5,
      },
      {
        id: 'npc_patrol_biobio_1',
        x: 8,
        y: 6,
        type: 'npc',
        name: 'Ignacio · Vigilante del Río',
        sprite: 'npc_explorer',
        patrolPath: [
          { x: 8, y: 6 },
          { x: 12, y: 6 },
          { x: 12, y: 14 },
          { x: 9, y: 14 },
          { x: 12, y: 14 },
          { x: 12, y: 6 },
        ],
        dialog: [
          'Recorro los puentes del Biobío vigilando que ninguna fábrica contamine estas aguas sagradas.',
        ],
      },
      {
        id: 'npc_patrol_biobio_2',
        x: 18,
        y: 10,
        type: 'npc',
        name: 'Constanza · Guardiana Férrea',
        sprite: 'npc_ranger',
        patrolPath: [
          { x: 18, y: 10 },
          { x: 18, y: 14 },
          { x: 21, y: 14 },
          { x: 18, y: 14 },
        ],
        dialog: [
          'La tala industrial sin control intentó avanzar cerca de la vía férrea, pero las Criaturas Espirituales nos ayudan a sanar el bosque.',
        ],
      },
      {
        id: 'postgame_biobio_pillancito',
        x: 15,
        y: 13,
        type: 'wild_encounter',
        requiresStoryCleared: true,
        name: 'Pillancito del Antuco (Nv.7)',
        sprite: 'wild_pillancito',
        encounterSpiritId: 'pillancito',
        customLevel: 7,
      },
      {
        id: 'obstacle_biobio_ruta',
        x: 6,
        y: 15,
        type: 'obstacle',
        name: 'Maleza Jurásica Densa (Misión)',
        sprite: 'obstacle_vines',
        elementRequired: 'fuego',
        obstacleClearMessage: '¡Tu Criatura Espiritual de FUEGO quemó la maleza jurásica abriendo paso al T-Rex!',
        dialog: ['Enredaderas prehistóricas sellan la arena suroeste del T-Rex. Equipa como COMPAÑERO ESPIRITUAL una Criatura de FUEGO (ej. Velociraptor).'],
      },
      {
        id: 'boss_biobio',
        x: 6,
        y: 17,
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
        x: 6,
        y: 20,
        type: 'portal',
        name: 'Ruta a R. de La Araucanía',
        sprite: 'portal_sign',
        destinationRegion: 'araucania',
        destinationX: 7,
        destinationY: 1,
      },
    ],
    wildEncounterTable: [
      { spiritId: 'velociraptor', minLevel: 4, maxLevel: 5, weight: 26 },
      { spiritId: 'cuellilargo', minLevel: 4, maxLevel: 5, weight: 22 },
      { spiritId: 'copihue', minLevel: 4, maxLevel: 5, weight: 18 },
      { spiritId: 'quiltro', minLevel: 4, maxLevel: 5, weight: 12 },
      { spiritId: 'gato_chileno', minLevel: 4, maxLevel: 5, weight: 10 },
      { spiritId: 'loica', minLevel: 4, maxLevel: 5, weight: 8 },
      // Evoluciones salvajes raras (tasa Místico weight 4, +2 niveles respecto a la zona)
      { spiritId: 'copihue', minLevel: 6, maxLevel: 7, weight: 4, stage: 2 },
      { spiritId: 'quiltro', minLevel: 6, maxLevel: 7, weight: 4, stage: 2 },
      { spiritId: 'gato_chileno', minLevel: 6, maxLevel: 7, weight: 4, stage: 2 },
      { spiritId: 'loica', minLevel: 6, maxLevel: 7, weight: 4, stage: 2 },
    ],
  },

  araucania: {
    id: 'araucania',
    name: 'R. de La Araucanía',
    subtitle: 'Stage 3 · Araucarias, Rucas, Lago y Volcán Villarrica',
    lore: 'Bosques densos de pewén, un lago andino, ciudad comercial, un pueblo étnico Mapuche con rucas tradicionales y el imponente Volcán Villarrica.',
    width: 27,
    height: 23,
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
        x: 7,
        y: 0,
        type: 'portal',
        name: 'Volver a R. del Biobío',
        sprite: 'portal_sign',
        destinationRegion: 'biobio',
        destinationX: 6,
        destinationY: 18,
      },
      {
        id: 'npc_minero_araucania',
        x: 8,
        y: 2,
        type: 'npc',
        name: 'Nahuel · Guardián Volcánico',
        sprite: 'npc_miner',
        dialog: [
          '¡Mari mari! Explora el bosque de araucarias, la ciudad al este y la comunidad Mapuche al suroeste del lago.',
          'Alcanza las faldas del Volcán Villarrica (norte-centro) para levantar la sombra del mapa de La Araucanía.',
          'Recibe este Corazón de Basalto y vincula una Criatura Espiritual de AGUA (ej. Ranita de Darwin) para la barrera sureste.',
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
        id: 'landmark_volcan_villarrica',
        x: 12,
        y: 4,
        type: 'decorative',
        name: 'Volcán Villarrica (Ruka Pillán)',
        sprite: 'deco_volcan',
        revealsRegionMap: true,
        footprint: [{ dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: 0, dy: 0 }],
        dialog: [
          '¡Llegaste al mirador del Volcán Villarrica rodeado de cerros y araucarias en el norte-centro!',
          'El resplandor del cráter aclara los cielos de La Araucanía. ¡Todo el mapa de la región ha quedado visible!',
        ],
      },
      {
        id: 'deco_cerro_araucania_w',
        x: 3,
        y: 8,
        type: 'decorative',
        name: 'Cerro Ñielol (Oeste)',
        sprite: 'deco_cerro_verde',
        dialog: ['Cerro Ñielol: santuario natural de copihues y robles antiguos.'],
      },
      {
        id: 'deco_cerro_araucania_se',
        x: 21,
        y: 14,
        type: 'decorative',
        name: 'Cerro Quelhue (Sureste)',
        sprite: 'deco_cerro_verde',
        dialog: ['Mirador cubierto de helechos que vigila los senderos hacia Pucón y Villarrica.'],
      },
      // Mapuche Ethnic Village (Rucas + Mapuche NPCs)
      {
        id: 'deco_ruca_araucania_1',
        x: 3,
        y: 12,
        type: 'decorative',
        name: 'Ruca Ceremonial Nguillatún',
        sprite: 'deco_ruca',
        dialog: ['Ruca tradicional construida con madera de coigüe y techo de paja coirón orientando su puerta al amanecer.'],
      },
      {
        id: 'deco_ruca_araucania_2',
        x: 5,
        y: 13,
        type: 'decorative',
        name: 'Ruca del Telar Pewén',
        sprite: 'deco_ruca',
        dialog: ['Del fogón interior emana un suave aroma a piñones tostados y canelo sagrado.'],
      },
      {
        id: 'deco_ruca_araucania_3',
        x: 3,
        y: 14,
        type: 'decorative',
        name: 'Ruca de Medicina Ancestral',
        sprite: 'deco_ruca',
        dialog: ['En esta ruca se preparan infusiones de boldo, matico y hojas de laurel chileno.'],
      },
      {
        id: 'npc_mapuche_araucania',
        x: 6,
        y: 12,
        type: 'npc',
        name: 'Lonko Calfucura · Sabio Mapuche',
        sprite: 'npc_mapuche',
        dialog: [
          'Mari mari, viajero. En nuestra comunidad junto al lago honramos el equilibrio del pewén y las aguas.',
          'La Araucaria Madre responde al equilibrio: enfría el magma sur con tu Criatura Espiritual de AGUA.',
        ],
      },
      {
        id: 'npc_machi_araucania',
        x: 5,
        y: 11,
        type: 'npc',
        name: 'Machi Rayén · Guardiana de Hierbas',
        sprite: 'npc_mapuche',
        dialog: [
          'El cultrún resuena en el bosque de araucarias. Si tus compañeros pierden vitalidad, busca el Elixir rojo y el Cristal de Maná en el valle.',
        ],
      },
      {
        id: 'npc_feriante_araucania',
        x: 14,
        y: 5,
        type: 'npc',
        name: 'Señora Rosa · Feriante de Temuco',
        sprite: 'npc_feriante',
        dialog: [
          '¡Piñones frescos en la ciudad! Si necesitas provisiones, nuestra Tienda está en la entrada noroeste.',
        ],
      },
      {
        id: 'npc_punk_araucania',
        x: 18,
        y: 9,
        type: 'npc',
        name: 'Nico · Punk Cordillerano',
        sprite: 'npc_punk',
        dialog: ['¡Ey! Me encanta escuchar el viento volcánico bajo la lluvia junto al lago Villarrica.'],
      },
      {
        id: 'npc_maestro_araucania',
        x: 19,
        y: 19,
        type: 'npc',
        name: 'Maestro Vínculo Kallfü',
        sprite: 'npc_maestro_vinculo',
        dialog: [
          'Acompaño a la Araucaria Madre (Nv.9). Demuestra tu dominio elemental y gana el Amuleto Espiritual Pewén Araucanía.',
        ],
      },
      {
        id: 'obstacle_araucania',
        x: 20,
        y: 14,
        type: 'obstacle',
        name: 'Roca Magmática (Opcional)',
        sprite: 'obstacle_magma',
        elementRequired: 'agua',
        obstacleClearMessage: 'Tu Compañero Espiritual de AGUA enfrió el basalto ardiente y liberó el cofre secreto.',
      },
      {
        id: 'chest_araucania_bonus',
        x: 20,
        y: 15,
        type: 'chest',
        name: 'Cofre Volcánico Secreto',
        sprite: 'chest',
        rewardItem: { id: 'empanada', count: 2 },
        rewardGold: 250,
      },
      {
        id: 'obstacle_araucania_bonus',
        x: 8,
        y: 4,
        type: 'obstacle',
        isBonusObstacle: true,
        name: 'Espesura de Quilas (Bonus)',
        sprite: 'obstacle_vines',
        elementRequired: 'fuego',
        obstacleClearMessage: '¡Tu Compañero Espiritual de FUEGO abrió paso en la espesura de quilas!',
      },
      {
        id: 'item_hp_araucania_1',
        x: 7,
        y: 15,
        type: 'chest',
        name: 'Baya de Vitalidad (+100% PS)',
        sprite: 'item_hp',
        healHpPercent: 100,
      },
      {
        id: 'item_mana_araucania_1',
        x: 19,
        y: 7,
        type: 'chest',
        name: 'Cristal de Maná (+100% PM)',
        sprite: 'item_mana',
        healMpPercent: 100,
      },
      {
        id: 'deco_fumarola_1',
        x: 14,
        y: 6,
        type: 'decorative',
        name: 'Fumarola del Villarrica',
        sprite: 'deco_fumarola',
      },
      {
        id: 'wild_araucania_ranita',
        x: 12,
        y: 14,
        type: 'wild_encounter',
        name: 'Ranita de Darwin (Nv.8)',
        sprite: 'wild_ranita',
        encounterSpiritId: 'ranita',
        customLevel: 8,
      },
      {
        id: 'wild_araucania_ranita_2',
        x: 7,
        y: 13,
        type: 'wild_encounter',
        name: 'Ranita del Lago (Nv.7)',
        sprite: 'wild_ranita',
        encounterSpiritId: 'ranita',
        customLevel: 7,
      },
      {
        id: 'wild_araucania_chucao',
        x: 9,
        y: 8,
        type: 'wild_encounter',
        name: 'Chucao del Bosque (Nv.8)',
        sprite: 'wild_chucao',
        encounterSpiritId: 'chucao',
        customLevel: 8,
      },
      {
        id: 'wild_araucania_chucao_2',
        x: 21,
        y: 5,
        type: 'wild_encounter',
        name: 'Chucao del Pewén (Nv.8)',
        sprite: 'wild_chucao',
        encounterSpiritId: 'chucao',
        customLevel: 8,
      },
      {
        id: 'wild_araucania_gato',
        x: 16,
        y: 13,
        type: 'wild_encounter',
        name: 'Gato Güiña Montés (Nv.8)',
        sprite: 'wild_gato_chileno',
        encounterSpiritId: 'gato_chileno',
        customLevel: 8,
      },
      {
        id: 'wild_araucania_culpeo',
        x: 16,
        y: 8,
        type: 'wild_encounter',
        name: 'Zorrito Culpeo (Nv.8)',
        sprite: 'wild_culpeo',
        encounterSpiritId: 'culpeo',
        customLevel: 8,
      },
      {
        id: 'wild_araucania_torcaza',
        x: 4,
        y: 16,
        type: 'wild_encounter',
        name: 'Torcaza del Pewén (Nv.7)',
        sprite: 'wild_torcaza',
        encounterSpiritId: 'torcaza',
        customLevel: 7,
      },
      {
        id: 'wild_araucania_chucao_3',
        x: 5,
        y: 15,
        type: 'wild_encounter',
        name: 'Chucao de los Copihues (Nv.8)',
        sprite: 'wild_chucao',
        encounterSpiritId: 'chucao',
        customLevel: 8,
      },
      {
        id: 'wild_araucania_torcaza_2',
        x: 21,
        y: 3,
        type: 'wild_encounter',
        name: 'Torcaza de Temuco (Nv.8)',
        sprite: 'wild_torcaza',
        encounterSpiritId: 'torcaza',
        customLevel: 8,
      },
      {
        id: 'wild_araucania_culpeo_2',
        x: 15,
        y: 12,
        type: 'wild_encounter',
        name: 'Zorrito Culpeo del Villarrica (Nv.8)',
        sprite: 'wild_culpeo',
        encounterSpiritId: 'culpeo',
        customLevel: 8,
      },
      {
        id: 'npc_patrol_araucania_1',
        x: 13,
        y: 6,
        type: 'npc',
        name: 'Lonko Wenumán',
        sprite: 'npc_mapuche',
        patrolPath: [
          { x: 13, y: 6 },
          { x: 13, y: 14 },
          { x: 18, y: 14 },
          { x: 18, y: 10 },
          { x: 13, y: 10 },
        ],
        dialog: [
          'Cuidamos los bosques milenarios de pewén frente a la tala industrial sin control. ¡Gracias por defender el sur, Elegido!',
        ],
      },
      {
        id: 'npc_patrol_araucania_2',
        x: 13,
        y: 10,
        type: 'npc',
        name: 'Elena · Defensora del Lago',
        sprite: 'npc_explorer',
        patrolPath: [
          { x: 13, y: 10 },
          { x: 13, y: 14 },
          { x: 8, y: 14 },
          { x: 13, y: 14 },
        ],
        dialog: [
          'Recorro la orilla sur del lago Villarrica enseñando a los viajeros a respetar los nidos de ranitas y chucaos.',
        ],
      },
      {
        id: 'postgame_araucania_brotin',
        x: 19,
        y: 13,
        type: 'wild_encounter',
        requiresStoryCleared: true,
        name: 'Brotín de la Araucanía (Nv.9)',
        sprite: 'wild_brotin',
        encounterSpiritId: 'brotin',
        customLevel: 9,
      },
      {
        id: 'obstacle_araucania_ruta',
        x: 18,
        y: 17,
        type: 'obstacle',
        name: 'Barrera Magmática del Volcán (Misión)',
        sprite: 'obstacle_magma',
        elementRequired: 'agua',
        obstacleClearMessage: '¡Tu Criatura Espiritual de AGUA enfrió la barrera magmática y abrió el claro de la Araucaria Madre!',
        dialog: ['Lava solidificada bloquea el paso sureste. Equipa como COMPAÑERO ESPIRITUAL una Criatura de AGUA (ej. Ranita de Darwin).'],
      },
      {
        id: 'boss_araucania',
        x: 18,
        y: 19,
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
        x: 18,
        y: 22,
        type: 'portal',
        name: 'Ruta a R. de Los Ríos',
        sprite: 'portal_sign',
        destinationRegion: 'losrios',
        destinationX: 21,
        destinationY: 1,
      },
    ],
    wildEncounterTable: [
      { spiritId: 'chucao', minLevel: 6, maxLevel: 7, weight: 28 },
      { spiritId: 'ranita', minLevel: 6, maxLevel: 7, weight: 24 },
      { spiritId: 'gato_chileno', minLevel: 6, maxLevel: 7, weight: 16 },
      { spiritId: 'culpeo', minLevel: 6, maxLevel: 7, weight: 14 },
      { spiritId: 'torcaza', minLevel: 6, maxLevel: 7, weight: 14 },
      // Evoluciones salvajes raras (tasa Místico weight 4, +2 niveles respecto a la zona)
      { spiritId: 'chucao', minLevel: 8, maxLevel: 9, weight: 4, stage: 2 },
      { spiritId: 'ranita', minLevel: 8, maxLevel: 9, weight: 4, stage: 2 },
      { spiritId: 'culpeo', minLevel: 8, maxLevel: 9, weight: 4, stage: 2 },
      { spiritId: 'gato_chileno', minLevel: 8, maxLevel: 9, weight: 4, stage: 2 },
    ],
  },

  losrios: {
    id: 'losrios',
    name: 'R. de Los Ríos',
    subtitle: 'Stage 4 · Dos Ríos, Lago y Volcán Mocho-Choshuenco',
    lore: 'Selva valdiviana surcada por dos ríos y un lago cristalino, con su ciudad fluvial, pueblo ribereño y los volcanes Mocho-Choshuenco y Puyehue.',
    width: 29,
    height: 25,
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
        x: 21,
        y: 0,
        type: 'portal',
        name: 'Volver a R. de La Araucanía',
        sprite: 'portal_sign',
        destinationRegion: 'araucania',
        destinationX: 18,
        destinationY: 20,
      },
      {
        id: 'npc_javiera_losrios',
        x: 20,
        y: 2,
        type: 'npc',
        name: 'Javiera · Bióloga de Valdivia',
        sprite: 'npc_explorer',
        dialog: [
          '¡Bienvenido a R. de Los Ríos! Tienes el Hospital al oeste y el Volcán Mocho-Choshuenco rodeado de cerros al suroeste.',
          'Al subir al mirador del Volcán Mocho-Choshuenco despejarás toda sombra del mapa.',
          'Equipa una Criatura Espiritual de PLANTA (ej. Hongo Lumínico o Copihue) como Compañero Espiritual antes del Torreón. ¡Toma esta Resina de Pewén!',
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
        x: 17,
        y: 5,
        type: 'portal',
        name: 'Entrar al Santuario de Evolución',
        sprite: 'portal_santuario',
        destinationRegion: 'santuario',
        destinationX: 5,
        destinationY: 7,
      },
      {
        id: 'landmark_volcan_mocho',
        x: 3,
        y: 17,
        type: 'decorative',
        name: 'Volcán Mocho-Choshuenco (Suroeste)',
        sprite: 'deco_volcan',
        revealsRegionMap: true,
        footprint: [{ dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: 0, dy: 0 }],
        dialog: [
          '¡Alcanzaste los glaciares del Volcán Mocho-Choshuenco rodeado de cerros al suroeste!',
          'Desde sus dos cumbres divisas los dos ríos, el lago, la ciudad y el pueblo valdiviano. ¡La sombra del mapa ha desaparecido!',
        ],
      },
      {
        id: 'deco_volcan_puyehue',
        x: 25,
        y: 11,
        type: 'decorative',
        name: 'Volcán Puyehue (Cordillera)',
        sprite: 'deco_volcan',
        dialog: ['Volcán Puyehue: gigante termal cuya fumarola entibia los bosques del sur de Los Ríos.'],
      },
      {
        id: 'deco_cerro_losrios_ne',
        x: 24,
        y: 4,
        type: 'decorative',
        name: 'Cerro Oncol Norte',
        sprite: 'deco_cerro_verde',
        dialog: ['Cerro Oncol: cumbre de selva siempreverde cubierta de musgos y cóndores.'],
      },
      {
        id: 'deco_cerro_losrios_e',
        x: 23,
        y: 17,
        type: 'decorative',
        name: 'Cerro Mirador Calle-Calle',
        sprite: 'deco_cerro_verde',
        dialog: ['Desde aquí se observa el encuentro de los dos grandes ríos del sur.'],
      },
      {
        id: 'npc_soldado_losrios',
        x: 7,
        y: 6,
        type: 'npc',
        name: 'Sargento Valdivia · Soldado',
        sprite: 'npc_soldado',
        dialog: [
          'Los dos ríos de la región protegen la ciudad y el pueblo ribereño. Recuerda equipar una Criatura Espiritual de PLANTA para la barrera sur.',
        ],
      },
      {
        id: 'npc_agricultor_losrios',
        x: 5,
        y: 11,
        type: 'npc',
        name: 'Don Anselmo · Pueblo Ribereño',
        sprite: 'npc_agricultor',
        dialog: ['La lluvia constante nutre helechos y Hongos Lumínicos por toda la selva valdiviana.'],
      },
      {
        id: 'npc_pescador_m_losrios',
        x: 10,
        y: 11,
        type: 'npc',
        name: 'Don Lucho · Pescador de Valdivia',
        sprite: 'npc_pescador_m',
        dialog: ['En nuestra ciudad fluvial se cruzan barcos y puentes de madera rumbo al lago.'],
      },
      {
        id: 'npc_pescadora_f_losrios',
        x: 22,
        y: 13,
        type: 'npc',
        name: 'Señora Carmen · Pescadora del Lago',
        sprite: 'npc_pescadora_f',
        dialog: ['El lago brilla hermoso incluso bajo la lluvia con viento. ¡Mucho éxito frente al Torreón!'],
      },
      {
        id: 'npc_maestro_losrios',
        x: 10,
        y: 21,
        type: 'npc',
        name: 'Maestra Vínculo Antonia',
        sprite: 'npc_maestro_vinculo',
        dialog: [
          'Resguardo al Guardián del Torreón (Nv.11). Quien lo derrote obtendrá el Amuleto Espiritual Selva Valdiviana.',
        ],
      },
      {
        id: 'obstacle_losrios',
        x: 2,
        y: 13,
        type: 'obstacle',
        name: 'Caudal del Calle-Calle (Opcional)',
        sprite: 'obstacle_water',
        elementRequired: 'agua',
        obstacleClearMessage: 'Tu Compañero Espiritual de AGUA serenó la corriente lateral revelando el cofre secreto.',
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
        id: 'obstacle_losrios_bonus',
        x: 12,
        y: 6,
        type: 'obstacle',
        isBonusObstacle: true,
        name: 'Cortina de Viento Fluvial (Bonus)',
        sprite: 'obstacle_vines',
        elementRequired: 'viento',
        obstacleClearMessage: '¡Tu Compañero Espiritual de VIENTO disipó la bruma densa del sendero!',
      },
      {
        id: 'item_hp_losrios_1',
        x: 7,
        y: 16,
        type: 'chest',
        name: 'Poción de Vitalidad (+100% PS)',
        sprite: 'item_hp',
        healHpPercent: 100,
      },
      {
        id: 'item_mana_losrios_1',
        x: 25,
        y: 13,
        type: 'chest',
        name: 'Cristal de Maná (+100% PM)',
        sprite: 'item_mana',
        healMpPercent: 100,
      },
      {
        id: 'wild_losrios_hongo',
        x: 9,
        y: 6,
        type: 'wild_encounter',
        name: 'Hongo Lumínico (Nv.10)',
        sprite: 'wild_hongo',
        encounterSpiritId: 'hongo',
        customLevel: 10,
      },
      {
        id: 'wild_losrios_hongo_2',
        x: 5,
        y: 13,
        type: 'wild_encounter',
        name: 'Hongo del Musgo (Nv.9)',
        sprite: 'wild_hongo',
        encounterSpiritId: 'hongo',
        customLevel: 9,
      },
      {
        id: 'wild_losrios_jabali',
        x: 16,
        y: 9,
        type: 'wild_encounter',
        name: 'Jabalí del Arrayán (Nv.10)',
        sprite: 'wild_jabali',
        encounterSpiritId: 'jabali',
        customLevel: 10,
      },
      {
        id: 'wild_losrios_jabali_2',
        x: 19,
        y: 16,
        type: 'wild_encounter',
        name: 'Jabalí del Calle-Calle (Nv.10)',
        sprite: 'wild_jabali',
        encounterSpiritId: 'jabali',
        customLevel: 10,
      },
      {
        id: 'wild_losrios_puducito',
        x: 11,
        y: 17,
        type: 'wild_encounter',
        name: 'Pudú Valdiviano (Nv.10)',
        sprite: 'wild_puducito',
        encounterSpiritId: 'puducito',
        customLevel: 10,
      },
      {
        id: 'wild_losrios_ranita',
        x: 17,
        y: 12,
        type: 'wild_encounter',
        name: 'Ranita de Valdivia (Nv.9)',
        sprite: 'wild_ranita',
        encounterSpiritId: 'ranita',
        customLevel: 9,
      },
      {
        id: 'wild_losrios_chucao',
        x: 20,
        y: 16,
        type: 'wild_encounter',
        name: 'Chucao de la Selva (Nv.10)',
        sprite: 'wild_chucao',
        encounterSpiritId: 'chucao',
        customLevel: 10,
      },
      {
        id: 'wild_losrios_condor',
        x: 22,
        y: 4,
        type: 'wild_encounter',
        name: 'Cóndor de Los Ríos (Nv.10)',
        sprite: 'wild_condor',
        encounterSpiritId: 'condor',
        customLevel: 10,
      },
      {
        id: 'wild_losrios_copihue',
        x: 15,
        y: 10,
        type: 'wild_encounter',
        name: 'Copihue Valdiviano (Nv.9)',
        sprite: 'wild_copihue',
        encounterSpiritId: 'copihue',
        customLevel: 9,
      },
      {
        id: 'wild_losrios_ranita_2',
        x: 4,
        y: 13,
        type: 'wild_encounter',
        name: 'Ranita del Humedal (Nv.9)',
        sprite: 'wild_ranita',
        encounterSpiritId: 'ranita',
        customLevel: 9,
      },
      {
        id: 'wild_losrios_chucao_2',
        x: 22,
        y: 19,
        type: 'wild_encounter',
        name: 'Chucao del Puyehue (Nv.10)',
        sprite: 'wild_chucao',
        encounterSpiritId: 'chucao',
        customLevel: 10,
      },
      {
        id: 'wild_losrios_hongo_3',
        x: 18,
        y: 16,
        type: 'wild_encounter',
        name: 'Hongo de la Selva (Nv.10)',
        sprite: 'wild_hongo',
        encounterSpiritId: 'hongo',
        customLevel: 10,
      },
      {
        id: 'npc_patrol_losrios_1',
        x: 14,
        y: 6,
        type: 'npc',
        name: 'Martín · Navegante Fluvial',
        sprite: 'npc_pescador_m',
        patrolPath: [
          { x: 14, y: 6 },
          { x: 22, y: 6 },
          { x: 22, y: 12 },
          { x: 22, y: 6 },
        ],
        dialog: [
          'Vigilamos que los ríos Calle-Calle y Valdivia sigan limpios de residuos industriales.',
        ],
      },
      {
        id: 'npc_patrol_losrios_2',
        x: 14,
        y: 13,
        type: 'npc',
        name: 'Valeria · Guardabosques',
        sprite: 'npc_ranger',
        patrolPath: [
          { x: 14, y: 13 },
          { x: 14, y: 17 },
          { x: 12, y: 17 },
          { x: 14, y: 17 },
        ],
        dialog: [
          'La selva valdiviana sana poco a poco cuando expulsamos a quienes destruyen los humedales.',
        ],
      },
      {
        id: 'postgame_losrios_hualita',
        x: 16,
        y: 17,
        type: 'wild_encounter',
        requiresStoryCleared: true,
        name: 'Hualita de Los Ríos (Nv.11)',
        sprite: 'wild_hualita',
        encounterSpiritId: 'hualita',
        customLevel: 11,
      },
      {
        id: 'obstacle_losrios_ruta',
        x: 9,
        y: 19,
        type: 'obstacle',
        name: 'Desborde de Aguas del Torreón (Misión)',
        sprite: 'obstacle_water',
        elementRequired: 'planta',
        obstacleClearMessage: '¡Tu Criatura Espiritual de PLANTA tejió raíces absorbentes abriendo el paso hacia el Torreón!',
        dialog: ['Un torrente cubre el puente suroeste al Torreón. Equipa como COMPAÑERO ESPIRITUAL una Criatura de PLANTA (ej. Hongo Lumínico o Copihue).'],
      },
      {
        id: 'boss_losrios',
        x: 9,
        y: 21,
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
        x: 9,
        y: 24,
        type: 'portal',
        name: 'Ruta a R. de Los Lagos',
        sprite: 'portal_sign',
        destinationRegion: 'loslagos',
        destinationX: 11,
        destinationY: 1,
      },
    ],
    wildEncounterTable: [
      { spiritId: 'hongo', minLevel: 8, maxLevel: 9, weight: 24 },
      { spiritId: 'jabali', minLevel: 8, maxLevel: 9, weight: 22 },
      { spiritId: 'copihue', minLevel: 8, maxLevel: 9, weight: 16 },
      { spiritId: 'ranita', minLevel: 8, maxLevel: 9, weight: 12 },
      { spiritId: 'chucao', minLevel: 8, maxLevel: 9, weight: 10 },
      { spiritId: 'puducito', minLevel: 8, maxLevel: 9, weight: 8 },
      { spiritId: 'condor', minLevel: 8, maxLevel: 9, weight: 4 },
      // Evoluciones salvajes raras (tasa Místico weight 4, +2 niveles respecto a la zona)
      { spiritId: 'hongo', minLevel: 10, maxLevel: 11, weight: 4, stage: 2 },
      { spiritId: 'jabali', minLevel: 10, maxLevel: 11, weight: 4, stage: 2 },
      { spiritId: 'copihue', minLevel: 10, maxLevel: 11, weight: 4, stage: 2 },
      { spiritId: 'puducito', minLevel: 10, maxLevel: 11, weight: 4, stage: 2 },
    ],
  },

  loslagos: {
    id: 'loslagos',
    name: 'R. de Los Lagos',
    subtitle: 'Stage 5 · Isla de Chiloé, Nieve Cordillerana y Volcán Osorno',
    lore: 'El continente se extiende por la Cordillera nevada al este junto al Volcán Osorno, mientras al suroeste emerge la Isla de Chiloé sobre el Océano Pacífico.',
    width: 37,
    height: 31,
    ambientColor: '#1e293b',
    themeColor: '#06b6d4',
    weather: 'ventisca_austral',
    weatherLabel: 'Tormenta y Relámpagos',
    bgmId: 'loslagos',
    isUnlocked: false,
    tiles: loslagosTiles,
    entities: [
      {
        id: 'portal_back_losrios',
        x: 11,
        y: 0,
        type: 'portal',
        name: 'Volver a R. de Los Ríos',
        sprite: 'portal_sign',
        destinationRegion: 'losrios',
        destinationX: 9,
        destinationY: 22,
      },
      {
        id: 'npc_alercero',
        x: 12,
        y: 2,
        type: 'npc',
        name: 'Don Checho · Guardián del Alerce',
        sprite: 'npc_old_man',
        dialog: [
          '¡Llegaste a R. de Los Lagos! Al este la Cordillera se cubre de nieve alrededor del Volcán Osorno; al suroeste se extiende la Isla de Chiloé.',
          'Visita la cumbre del Volcán Osorno (este-centro) para despejar toda la sombra del mapa austral.',
          'Equipa como Compañero Espiritual un Ventisquero o Pingüino (HIELO) para cruzar el fiordo sur hacia Cai Cai y Vilu Vilu. ¡Toma esta Infusión de Calafate!',
        ],
        rewardItem: { id: 'infusion_calafate', count: 2 },
      },
      {
        id: 'portal_tienda_loslagos',
        x: 22,
        y: 10,
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
        id: 'landmark_volcan_osorno',
        x: 32,
        y: 12,
        type: 'decorative',
        name: 'Volcán Osorno (Cumbre Nevada)',
        sprite: 'deco_volcan',
        revealsRegionMap: true,
        footprint: [{ dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 0, dy: 0 }, { dx: 1, dy: 0 }],
        dialog: [
          '¡Escalas el cono perfecto del Volcán Osorno entre nieves cordilleranas en el sector este!',
          'Desde la cima observas Puerto Varas, la Isla de Chiloé, sus pueblos palafitos y el fin del océano. ¡Todo el mapa de Los Lagos ha quedado revelado!',
        ],
      },
      {
        id: 'deco_cerro_chiloe_1',
        x: 5,
        y: 11,
        type: 'decorative',
        name: 'Colina de Dalcahue (Isla)',
        sprite: 'deco_cerro_verde',
        dialog: ['Colina verde en el corazón de la Isla de Chiloé mirando al Pacífico.'],
      },
      {
        id: 'deco_cerro_cordillera_ll',
        x: 27,
        y: 12,
        type: 'decorative',
        name: 'Cerro Tronador Norte',
        sprite: 'deco_cerro_blanco',
        dialog: ['Cumbre blanca que anuncia las grandes nieves de la Cordillera de los Andes.'],
      },
      {
        id: 'npc_chilote_loslagos',
        x: 8,
        y: 14,
        type: 'npc',
        name: 'Pedro · Carpintero de Chiloé',
        sprite: 'npc_chilote',
        dialog: [
          '¡Bienvenido a la Isla de Chiloé! Construimos palafitos de colores sobre el mar y navegamos entre islas.',
          'Al sur de la isla viven pudúes y jabalíes bajo los alerces centenarios.',
        ],
      },
      {
        id: 'npc_cocinera_loslagos',
        x: 8,
        y: 21,
        type: 'npc',
        name: 'Señora Marisol · Pueblo Quellón',
        sprite: 'npc_cocinera',
        dialog: ['¡Curanto en hoyo y milcao caliente! Recupérate antes de regresar al continente hacia las Serpientes Australes.'],
      },
      {
        id: 'npc_buzo_loslagos',
        x: 21,
        y: 6,
        type: 'npc',
        name: 'Esteban · Buzo Mariscador',
        sprite: 'npc_buzo',
        dialog: ['En la ciudad de Puerto Montt los muelles unen el continente con el canal hacia la Isla de Chiloé.'],
      },
      {
        id: 'npc_maestro_loslagos',
        x: 26,
        y: 27,
        type: 'npc',
        name: 'Maestros Kalfú y Llankal',
        sprite: 'npc_maestro_vinculo',
        dialog: [
          'Somos los Maestros de las Dos Serpientes de Los Lagos.',
          'Derrota tanto a Cai Cai Vilu (oeste, Nv.13) como a Vilu Vilu (este, Nv.14) para obtener el Amuleto Espiritual Serpientes Australes.',
        ],
      },
      {
        id: 'obstacle_loslagos',
        x: 20,
        y: 18,
        type: 'obstacle',
        name: 'Bloque Glacial del Fiordo (Opcional)',
        sprite: 'obstacle_ice',
        elementRequired: 'fuego',
        obstacleClearMessage: 'Tu Compañero Espiritual de FUEGO derritió el témpano liberando el cofre secreto.',
      },
      {
        id: 'chest_loslagos_bonus',
        x: 19,
        y: 18,
        type: 'chest',
        name: 'Cofre Glacial Secreto',
        sprite: 'chest',
        rewardItem: { id: 'infusion_calafate', count: 3 },
        rewardGold: 400,
      },
      {
        id: 'obstacle_loslagos_bonus',
        x: 27,
        y: 17,
        type: 'obstacle',
        isBonusObstacle: true,
        name: 'Peñasco Cordillerano (Bonus)',
        sprite: 'obstacle_rock',
        elementRequired: 'tierra',
        obstacleClearMessage: '¡Tu Compañero Espiritual de TIERRA removió el peñasco nevado!',
      },
      {
        id: 'item_hp_loslagos_1',
        x: 5,
        y: 18,
        type: 'chest',
        name: 'Baya de Vitalidad Austral (+100% PS)',
        sprite: 'item_hp',
        healHpPercent: 100,
      },
      {
        id: 'item_mana_loslagos_1',
        x: 29,
        y: 15,
        type: 'chest',
        name: 'Cristal Glacial de Maná (+100% PM)',
        sprite: 'item_mana',
        healMpPercent: 100,
      },
      {
        id: 'item_hp_loslagos_2',
        x: 25,
        y: 22,
        type: 'chest',
        name: 'Poción de Vitalidad (+100% PS)',
        sprite: 'item_hp',
        healHpPercent: 100,
      },
      {
        id: 'wild_loslagos_ventisquero',
        x: 29,
        y: 9,
        type: 'wild_encounter',
        name: 'Ventisquero Polar (Nv.12)',
        sprite: 'wild_ventisquero',
        encounterSpiritId: 'ventisquero',
        customLevel: 12,
      },
      {
        id: 'wild_loslagos_ventisquero_2',
        x: 32,
        y: 16,
        type: 'wild_encounter',
        name: 'Ventisquero de Osorno (Nv.12)',
        sprite: 'wild_ventisquero',
        encounterSpiritId: 'ventisquero',
        customLevel: 12,
      },
      {
        id: 'wild_loslagos_pinguino',
        x: 24,
        y: 17,
        type: 'wild_encounter',
        name: 'Pingüino Austral (Nv.12)',
        sprite: 'wild_pinguino',
        encounterSpiritId: 'pinguino',
        customLevel: 12,
      },
      {
        id: 'wild_loslagos_pinguino_2',
        x: 13,
        y: 16,
        type: 'wild_encounter',
        name: 'Pingüino del Canal (Nv.12)',
        sprite: 'wild_pinguino',
        encounterSpiritId: 'pinguino',
        customLevel: 12,
      },
      {
        id: 'wild_loslagos_jabali',
        x: 10,
        y: 18,
        type: 'wild_encounter',
        name: 'Jabalí de Chiloé (Nv.12)',
        sprite: 'wild_jabali',
        encounterSpiritId: 'jabali',
        customLevel: 12,
      },
      {
        id: 'wild_loslagos_jabali_2',
        x: 4,
        y: 22,
        type: 'wild_encounter',
        name: 'Jabalí de Quellón (Nv.12)',
        sprite: 'wild_jabali',
        encounterSpiritId: 'jabali',
        customLevel: 12,
      },
      {
        id: 'wild_loslagos_pinguino_3',
        x: 19,
        y: 12,
        type: 'wild_encounter',
        name: 'Pingüino de Chacao (Nv.12)',
        sprite: 'wild_pinguino',
        encounterSpiritId: 'pinguino',
        customLevel: 12,
      },
      {
        id: 'wild_loslagos_loica',
        x: 6,
        y: 11,
        type: 'wild_encounter',
        name: 'Loica de Chiloé (Nv.11)',
        sprite: 'wild_loica',
        encounterSpiritId: 'loica',
        customLevel: 11,
      },
      {
        id: 'wild_loslagos_puye_1',
        x: 18,
        y: 13,
        type: 'wild_encounter',
        name: 'Puye Cristal del Canal (Nv.11)',
        sprite: 'wild_puye',
        encounterSpiritId: 'puye',
        customLevel: 11,
      },
      {
        id: 'wild_loslagos_puye_2',
        x: 13,
        y: 10,
        type: 'wild_encounter',
        name: 'Puye Cristal de Castro (Nv.11)',
        sprite: 'wild_puye',
        encounterSpiritId: 'puye',
        customLevel: 11,
      },
      {
        id: 'wild_loslagos_puye_3',
        x: 22,
        y: 22,
        type: 'wild_encounter',
        name: 'Puye Cristal del Fiordo (Nv.12)',
        sprite: 'wild_puye',
        encounterSpiritId: 'puye',
        customLevel: 12,
      },
      {
        id: 'npc_patrol_loslagos_1',
        x: 9,
        y: 14,
        type: 'npc',
        name: 'Javiera · Guía de Chiloé',
        sprite: 'npc_explorer',
        patrolPath: [
          { x: 9, y: 14 },
          { x: 20, y: 14 },
          { x: 20, y: 11 },
          { x: 20, y: 14 },
        ],
        dialog: [
          '¡Cruza el puente de Chacao con calma! En las orillas del agua podrás ver nadar a los Puye Cristal nativos.',
        ],
      },
      {
        id: 'npc_patrol_loslagos_2',
        x: 26,
        y: 10,
        type: 'npc',
        name: 'Tomás · Guardaparque Osorno',
        sprite: 'npc_ranger',
        patrolPath: [
          { x: 26, y: 10 },
          { x: 30, y: 10 },
          { x: 30, y: 14 },
          { x: 26, y: 14 },
        ],
        dialog: [
          'La única entrada a la Isla de las Serpientes Australes es el puente estrecho del fiordo sur (26,24). ¡Lleva una criatura de HIELO!',
        ],
      },
      {
        id: 'postgame_loslagos_hualita',
        x: 24,
        y: 12,
        type: 'wild_encounter',
        requiresStoryCleared: true,
        name: 'Hualita de Los Lagos (Nv.13)',
        sprite: 'wild_hualita',
        encounterSpiritId: 'hualita',
        customLevel: 13,
      },
      {
        id: 'obstacle_loslagos_ruta',
        x: 26,
        y: 24,
        type: 'obstacle',
        name: 'Puente Helado del Fiordo (Misión)',
        sprite: 'obstacle_water',
        elementRequired: 'hielo',
        obstacleClearMessage: '¡Tu Criatura Espiritual de HIELO congeló el puente del fiordo abriendo paso a la Isla de las Dos Serpientes!',
        dialog: ['Un estrecho fiordo corta el puente hacia la Isla del Santuario Sur. Equipa como COMPAÑERO ESPIRITUAL una Criatura de HIELO (ej. Ventisquero o Pingüino).'],
      },
      {
        id: 'boss_loslagos_caicai',
        x: 24,
        y: 27,
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
        x: 28,
        y: 27,
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
      { spiritId: 'puye', minLevel: 10, maxLevel: 12, weight: 26 },
      { spiritId: 'ventisquero', minLevel: 10, maxLevel: 11, weight: 26 },
      { spiritId: 'pinguino', minLevel: 10, maxLevel: 11, weight: 24 },
      { spiritId: 'jabali', minLevel: 10, maxLevel: 11, weight: 22 },
      // Evoluciones salvajes raras (tasa Místico weight 4, +2 niveles respecto a la zona)
      { spiritId: 'puye', minLevel: 12, maxLevel: 13, weight: 4, stage: 2 },
      { spiritId: 'ventisquero', minLevel: 12, maxLevel: 13, weight: 4, stage: 2 },
      { spiritId: 'pinguino', minLevel: 12, maxLevel: 13, weight: 4, stage: 2 },
      { spiritId: 'jabali', minLevel: 12, maxLevel: 13, weight: 4, stage: 2 },
    ],
  },

  hospital: {
    id: 'hospital',
    name: 'Hospital Regional',
    subtitle: 'Centro Médico · Curación Gratuita (0%)',
    lore: 'Sala clínica luminosa equipada con camillas, monitores de signos vitales y asistencia médica gratuita para tus Criaturas Espirituales.',
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
        dialog: ['Sábanas limpias y mantas tibias listas para recibir a Criaturas Espirituales agotadas.'],
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
        dialog: ['¡Bienvenido al Hospital! Todas tus Criaturas Espirituales han sido sanadas al 100% de PS y PM sin costo.'],
      },
      {
        id: 'shrine_cura_hospital',
        x: 5,
        y: 4,
        type: 'shrine',
        name: 'Estación de Curación Rápida',
        sprite: 'portal_hospital',
        isHospital: true,
        dialog: ['¡Sanación completada! Todas tus Criaturas Espirituales recuperaron el 100% de sus PS y PM.'],
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
    lore: 'Único recinto sagrado donde los cristales elementales resonantes despiertan la siguiente etapa evolutiva de tus Criaturas Espirituales.',
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
        dialog: ['El Altar de Evolución está encendido. Solo en este templo sagrado puedes despertar la siguiente etapa de tus Criaturas Espirituales.'],
      },
      {
        id: 'shrine_altar_evolucion',
        x: 5,
        y: 4,
        type: 'shrine',
        name: 'Altar de Evolución',
        sprite: 'deco_santuario_evolucion',
        isEvolutionSanctuary: true,
        dialog: ['Canalizando la energía del Santuario para evolucionar a tus Criaturas Espirituales.'],
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
        destinationX: 4,
        destinationY: 11,
      },
    ],
    wildEncounterTable: [],
  },
};
