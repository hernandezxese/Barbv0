/**
 * Procedural 16-bit / 32-bit Chilean Pixel & Sprite Renderer
 * Generates SNES/GBA inspired sprites for protagonists, Chilean endemic flora/fauna,
 * 3-stage monster evolutions, NPCs, and animated map entities.
 */

export function drawBarbaraSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  direction: 'down' | 'up' | 'left' | 'right' = 'down',
  walkProgress: number = 0,
  isMoving: boolean = false,
  gender: 'female' | 'male' = 'female'
) {
  const pixel = size / 16;

  const bob = isMoving
    ? Math.abs(Math.sin(walkProgress * Math.PI)) * (pixel * 1.2)
    : Math.sin(walkProgress * 2) * (pixel * 0.4);

  ctx.save();
  ctx.translate(x, y - bob);

  // Soft shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  ctx.beginPath();
  ctx.ellipse(size / 2, size - pixel * 0.5, pixel * 5, pixel * 2, 0, 0, Math.PI * 2);
  ctx.fill();

  const legSwing = isMoving ? Math.sin(walkProgress * Math.PI * 2) * (pixel * 2.4) : 0;

  // 1. BOOTS
  ctx.fillStyle = '#451a03';
  if (direction === 'down' || direction === 'up') {
    ctx.fillRect(size / 2 - pixel * 4, size - pixel * 3 + legSwing, pixel * 3, pixel * 3);
    ctx.fillRect(size / 2 + pixel * 1, size - pixel * 3 - legSwing, pixel * 3, pixel * 3);
  } else {
    ctx.fillRect(size / 2 - pixel * 2 - legSwing, size - pixel * 3, pixel * 3.5, pixel * 3);
    ctx.fillRect(size / 2 - pixel * 2 + legSwing, size - pixel * 3, pixel * 3.5, pixel * 3);
  }

  // 2. PANTS
  ctx.fillStyle = gender === 'male' ? '#334155' : '#78350f';
  ctx.fillRect(size / 2 - pixel * 3.5, size - pixel * 5.5, pixel * 7, pixel * 3);

  // 3. BACKPACK
  if (direction === 'up' || direction === 'left' || direction === 'right') {
    ctx.fillStyle = '#92400e';
    const backpackX =
      direction === 'left'
        ? size / 2 + pixel * 1.5
        : direction === 'right'
        ? size / 2 - pixel * 5.5
        : size / 2 - pixel * 4;
    ctx.fillRect(backpackX, size - pixel * 11, pixel * 5, pixel * 6);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(backpackX + pixel, size - pixel * 9, pixel * 3, pixel);
  }

  // 4. ESSENCE CHANNELING ARTIFACT (Held at side)
  const armOffset = isMoving ? Math.cos(walkProgress * Math.PI * 2) * pixel * 0.9 : 0;
  const artifactX =
    direction === 'left'
      ? size / 2 - pixel * 6.4
      : direction === 'right'
      ? size / 2 + pixel * 4.8
      : size / 2 + pixel * 4.6;
  // Wooden / bronze staff shaft
  ctx.fillStyle = gender === 'male' ? '#78350f' : '#92400e';
  ctx.fillRect(artifactX, size - pixel * 13 + armOffset, pixel * 1.4, pixel * 9.5);
  // Glowing channeling crystal orb / talisman tip
  ctx.fillStyle = gender === 'male' ? '#f59e0b' : '#34d399';
  ctx.fillRect(artifactX - pixel * 0.5, size - pixel * 14.5 + armOffset, pixel * 2.4, pixel * 2.2);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(artifactX + pixel * 0.2, size - pixel * 14 + armOffset, pixel * 0.9, pixel * 0.9);

  // 5. CHILEAN WOVEN PONCHO / MANTO
  ctx.fillStyle = gender === 'male' ? '#0284c7' : '#059669';
  ctx.fillRect(size / 2 - pixel * 5, size - pixel * 10.5, pixel * 10, pixel * 5.5);

  const ponchoSway = isMoving ? Math.sin(walkProgress * Math.PI * 2) * (pixel * 0.8) : 0;
  ctx.fillStyle = gender === 'male' ? '#facc15' : '#f59e0b';
  ctx.fillRect(size / 2 - pixel * 5 + ponchoSway, size - pixel * 8, pixel * 10, pixel * 1.5);
  ctx.fillStyle = gender === 'male' ? '#0f172a' : '#dc2626';
  for (let i = -4; i <= 3; i += 2) {
    ctx.fillRect(size / 2 + pixel * i + ponchoSway, size - pixel * 8, pixel, pixel * 1.5);
  }

  // 6. HEAD & FACE
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(size / 2 - pixel * 3.5, size - pixel * 14.5, pixel * 7, pixel * 4.5);

  // 7. HAIR
  ctx.fillStyle = '#291e13';
  if (gender === 'male') {
    ctx.fillRect(size / 2 - pixel * 4.2, size - pixel * 16, pixel * 8.4, pixel * 3);
    ctx.fillRect(size / 2 - pixel * 4.2, size - pixel * 14, pixel * 1.5, pixel * 2.5);
    ctx.fillRect(size / 2 + pixel * 2.7, size - pixel * 14, pixel * 1.5, pixel * 2.5);
  } else {
    ctx.fillRect(size / 2 - pixel * 4.5, size - pixel * 16, pixel * 9, pixel * 3.5);
    ctx.fillRect(size / 2 - pixel * 4.5, size - pixel * 14, pixel * 2, pixel * 5.5);
    ctx.fillRect(size / 2 + pixel * 2.5, size - pixel * 14, pixel * 2, pixel * 5.5);
  }

  // Face details
  if (direction === 'down') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(size / 2 - pixel * 2.5, size - pixel * 12.5, pixel * 1.5, pixel * 1.8);
    ctx.fillRect(size / 2 + pixel * 1, size - pixel * 12.5, pixel * 1.5, pixel * 1.8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size / 2 - pixel * 2.5, size - pixel * 12.5, pixel * 0.8, pixel * 0.8);
    ctx.fillRect(size / 2 + pixel * 1, size - pixel * 12.5, pixel * 0.8, pixel * 0.8);
    if (gender === 'female') {
      ctx.fillStyle = '#fda4af';
      ctx.fillRect(size / 2 - pixel * 3, size - pixel * 10.8, pixel * 1.2, pixel * 0.8);
      ctx.fillRect(size / 2 + pixel * 1.8, size - pixel * 10.8, pixel * 1.2, pixel * 0.8);
    }
  } else if (direction === 'left') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(size / 2 - pixel * 3, size - pixel * 12.5, pixel * 1.5, pixel * 1.8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size / 2 - pixel * 3, size - pixel * 12.5, pixel * 0.8, pixel * 0.8);
  } else if (direction === 'right') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(size / 2 + pixel * 1.5, size - pixel * 12.5, pixel * 1.5, pixel * 1.8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size / 2 + pixel * 1.5, size - pixel * 12.5, pixel * 0.8, pixel * 0.8);
  }

  // 8. EXPLORER HAT
  ctx.fillStyle = gender === 'male' ? '#0f172a' : '#1e293b';
  ctx.fillRect(size / 2 - pixel * 5, size - pixel * 16.5, pixel * 10, pixel * 2);
  ctx.fillRect(size / 2 - pixel * 3.5, size - pixel * 18, pixel * 7, pixel * 2);

  // Sacred feather
  const featherFlutter = isMoving ? Math.sin(walkProgress * Math.PI * 4) * (pixel * 0.5) : 0;
  ctx.fillStyle = gender === 'male' ? '#38bdf8' : '#10b981';
  ctx.fillRect(size / 2 + pixel * 2 + featherFlutter, size - pixel * 20, pixel * 1.2, pixel * 2.8);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(size / 2 + pixel * 2.2 + featherFlutter, size - pixel * 20.8, pixel * 0.8, pixel * 1.2);

  ctx.restore();
}

// Draw 3-Stage Spirit Creature in Canvas / Battle / Bestiary / HUD Avatar
export function drawCreatureSprite(
  ctx: CanvasRenderingContext2D,
  baseId: string,
  stage: number,
  x: number,
  y: number,
  size: number,
  animatedTime: number = 0,
  isFlipped: boolean = false
) {
  const pixel = size / 18;
  const floatY = Math.sin(animatedTime * 3) * (pixel * 1.1);

  ctx.save();
  ctx.translate(x + size / 2, y + size / 2 + floatY);
  if (isFlipped) ctx.scale(-1, 1);
  ctx.translate(-size / 2, -size / 2);

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(size / 2, size - pixel * 1.5, pixel * 6, pixel * 2.1, 0, 0, Math.PI * 2);
  ctx.fill();

  const cx = size / 2;
  const cy = size / 2;

  if (baseId === 'brotin') {
    // LÍNEA BOSQUE: Brote -> Pehuén -> Araucaria
    if (stage === 1) {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(cx, cy + pixel * 2, pixel * 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx, cy + pixel * 3, pixel * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(cx - pixel * 1.2, cy - pixel * 5, pixel * 2.4, pixel * 4);
      ctx.beginPath();
      ctx.ellipse(cx - pixel * 3, cy - pixel * 4, pixel * 3, pixel * 1.5, -0.4, 0, Math.PI * 2);
      ctx.ellipse(cx + pixel * 3, cy - pixel * 4, pixel * 3, pixel * 1.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - pixel * 2.8, cy + pixel, pixel * 1.7, pixel * 2.3);
      ctx.fillRect(cx + pixel * 1.1, cy + pixel, pixel * 1.7, pixel * 2.3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - pixel * 2.5, cy + pixel * 1.2, pixel * 0.8, pixel * 0.8);
      ctx.fillRect(cx + pixel * 1.4, cy + pixel * 1.2, pixel * 0.8, pixel * 0.8);
    } else if (stage === 2) {
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - pixel * 4.5, cy - pixel * 1, pixel * 9, pixel * 8);
      // Defensive bark arms
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - pixel * 7, cy, pixel * 3, pixel * 5.5);
      ctx.fillRect(cx + pixel * 4, cy, pixel * 3, pixel * 5.5);
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(cx, cy - pixel * 8);
      ctx.lineTo(cx + pixel * 7.5, cy - pixel * 2);
      ctx.lineTo(cx - pixel * 7.5, cy - pixel * 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(cx, cy - pixel * 6);
      ctx.lineTo(cx + pixel * 5.5, cy);
      ctx.lineTo(cx - pixel * 5.5, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(cx - pixel * 2.8, cy + pixel * 2, pixel * 1.8, pixel * 1.8);
      ctx.fillRect(cx + pixel * 1, cy + pixel * 2, pixel * 1.8, pixel * 1.8);
    } else {
      // Giant armored Araucaria Titan
      ctx.fillStyle = '#292524';
      ctx.fillRect(cx - pixel * 5.5, cy - pixel * 3, pixel * 11, pixel * 10);
      // Armored wood shoulder plates
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - pixel * 8, cy - pixel * 1, pixel * 3, pixel * 6);
      ctx.fillRect(cx + pixel * 5, cy - pixel * 1, pixel * 3, pixel * 6);
      const levels = [
        { y: -7.5, w: 8.5, c: '#14532d' },
        { y: -4.5, w: 7.5, c: '#16a34a' },
        { y: -1.5, w: 6.5, c: '#22c55e' }
      ];
      levels.forEach(lvl => {
        ctx.fillStyle = lvl.c;
        ctx.beginPath();
        ctx.moveTo(cx, cy + pixel * (lvl.y - 3.5));
        ctx.lineTo(cx + pixel * lvl.w, cy + pixel * lvl.y);
        ctx.lineTo(cx - pixel * lvl.w, cy + pixel * lvl.y);
        ctx.closePath();
        ctx.fill();
      });
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - pixel * 2, cy + pixel * 2, pixel * 4, pixel);
      ctx.fillRect(cx - pixel * 0.5, cy + pixel, pixel, pixel * 4);
    }
  } else if (baseId === 'pillancito') {
    // LÍNEA VOLCÁNICA: Chispa volcánica -> Piedra volcánica -> Piedra ardiendo (Golem)
    const magmaGlow = ctx.createRadialGradient(cx, cy, 2, cx, cy, pixel * 7.5);
    magmaGlow.addColorStop(0, '#fef08a');
    magmaGlow.addColorStop(0.5, '#f97316');
    magmaGlow.addColorStop(1, '#dc2626');

    if (stage === 1) {
      ctx.fillStyle = magmaGlow;
      ctx.beginPath();
      ctx.arc(cx, cy + pixel, pixel * 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(cx - pixel * 3, cy - pixel * 2);
      ctx.lineTo(cx, cy - pixel * 6.5 - floatY * 0.4);
      ctx.lineTo(cx + pixel * 3, cy - pixel * 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(cx - pixel * 2.4, cy, pixel * 1.5, pixel * 2);
      ctx.fillRect(cx + pixel * 0.9, cy, pixel * 1.5, pixel * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - pixel * 2.1, cy + pixel * 0.3, pixel * 0.8, pixel * 0.8);
      ctx.fillRect(cx + pixel * 1.2, cy + pixel * 0.3, pixel * 0.8, pixel * 0.8);
    } else if (stage === 2) {
      // Piedra volcánica (Dark basalt stone with glowing magma cracks)
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.moveTo(cx - pixel * 6, cy + pixel * 6);
      ctx.lineTo(cx - pixel * 5, cy - pixel * 4);
      ctx.lineTo(cx, cy - pixel * 6.5);
      ctx.lineTo(cx + pixel * 5.5, cy - pixel * 3.5);
      ctx.lineTo(cx + pixel * 6.5, cy + pixel * 6);
      ctx.closePath();
      ctx.fill();
      // Magma cracks
      ctx.fillStyle = '#f97316';
      ctx.fillRect(cx - pixel * 4, cy + pixel * 1, pixel * 8, pixel * 1.4);
      ctx.fillRect(cx - pixel * 1, cy - pixel * 4, pixel * 1.8, pixel * 8);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - pixel * 3.2, cy - pixel * 2, pixel * 2, pixel * 1.6);
      ctx.fillRect(cx + pixel * 1.2, cy - pixel * 2, pixel * 2, pixel * 1.6);
    } else {
      // Piedra Ardiendo (Gran golem de roca y lava incandescente)
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(cx - pixel * 6.5, cy - pixel * 4, pixel * 13, pixel * 11);
      // Giant rocky magma fists
      ctx.fillStyle = '#44403c';
      ctx.fillRect(cx - pixel * 8.5, cy - pixel * 1, pixel * 2.8, pixel * 7);
      ctx.fillRect(cx + pixel * 5.7, cy - pixel * 1, pixel * 2.8, pixel * 7);
      // Glowing lava core & fissures
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(cx - pixel * 4.5, cy - pixel * 0.5, pixel * 9, pixel * 2);
      ctx.fillRect(cx - pixel * 1.5, cy - pixel * 3, pixel * 3, pixel * 7.5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - pixel * 2, cy, pixel * 4, pixel * 2.5);
      // Crown of volcano fire
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(cx - pixel * 6, cy - pixel * 4);
      ctx.lineTo(cx - pixel * 2, cy - pixel * 8.5);
      ctx.lineTo(cx, cy - pixel * 5.5);
      ctx.lineTo(cx + pixel * 2.5, cy - pixel * 8.5);
      ctx.lineTo(cx + pixel * 6, cy - pixel * 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - pixel * 4, cy - pixel * 2.2, pixel * 2.2, pixel * 1.8);
      ctx.fillRect(cx + pixel * 1.8, cy - pixel * 2.2, pixel * 2.2, pixel * 1.8);
    }
  } else if (baseId === 'hualita') {
    // LÍNEA AVES ACUÁTICAS: Huala nadadora -> Garza elegante -> Emperatriz Lacustre
    if (stage === 1) {
      // Huala (graceful swimming grebe on water ripple)
      ctx.fillStyle = 'rgba(186, 230, 253, 0.55)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + pixel * 5, pixel * 6.5, pixel * 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Sleek body
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.ellipse(cx + pixel * 0.5, cy + pixel * 3, pixel * 4.8, pixel * 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      // White chest
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(cx - pixel * 4, cy + pixel * 1.5, pixel * 2.2, pixel * 3);
      // Neck & crest
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(cx - pixel * 4, cy - pixel * 3, pixel * 2.2, pixel * 5);
      ctx.beginPath();
      ctx.arc(cx - pixel * 2.8, cy - pixel * 3.5, pixel * 2.1, 0, Math.PI * 2);
      ctx.fill();
      // Crest feather & eye
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - pixel * 1.5, cy - pixel * 6, pixel * 2.5, pixel * 1.5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - pixel * 6, cy - pixel * 3.8, pixel * 2.5, pixel * 1.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - pixel * 3.5, cy - pixel * 4, pixel, pixel);
    } else if (stage === 2) {
      // Garza (Tall, white & slate-blue heron)
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(cx + pixel, cy + pixel * 1.5, pixel * 5, pixel * 3.2, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Blue wing trim
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - pixel * 1, cy + pixel * 0.5, pixel * 6, pixel * 2);
      // Tall S-neck
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(cx - pixel * 3.5, cy - pixel * 5.5, pixel * 2, pixel * 6.5);
      ctx.beginPath();
      ctx.arc(cx - pixel * 2.8, cy - pixel * 6, pixel * 2.2, 0, Math.PI * 2);
      ctx.fill();
      // Plume & golden beak
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(cx - pixel * 1, cy - pixel * 7, pixel * 3, pixel * 1.2);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - pixel * 7.2, cy - pixel * 6.2, pixel * 4, pixel * 1.2);
      // Long legs
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(cx - pixel * 0.5, cy + pixel * 4, pixel * 1, pixel * 3.5);
      ctx.fillRect(cx + pixel * 2, cy + pixel * 4, pixel * 1, pixel * 3.5);
    } else {
      // Emperatriz de los Lagos Sagrados
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(cx - pixel * 6, cy - pixel * 2, pixel * 12, pixel * 9);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy + pixel * 3, pixel * 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(cx - pixel * 4, cy - pixel * 6.5, pixel * 8, pixel * 3);
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(cx - pixel * 1.5, cy - pixel * 8.5, pixel * 3, pixel * 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - pixel * 2.5, cy - pixel * 4, pixel * 1.5, pixel * 1.5);
      ctx.fillRect(cx + pixel * 1, cy - pixel * 4, pixel * 1.5, pixel * 1.5);
    }
  } else if (baseId === 'chucao') {
    // LÍNEA CHUCAO: Chucao pequeño pecho rojizo -> Chucao adulto robusto -> Chucao Feroz con aura
    if (stage === 1) {
      // Cute round body
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(cx, cy + pixel * 1, pixel * 4.8, 0, Math.PI * 2);
      ctx.fill();
      // Reddish-orange throat & breast
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(cx - pixel * 1.2, cy + pixel * 1.5, pixel * 3.2, 0, Math.PI * 2);
      ctx.fill();
      // Raised upright tail
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx + pixel * 3.5, cy - pixel * 3.5, pixel * 2.5, pixel * 4);
      // White eyebrow & eye
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(cx - pixel * 3, cy - pixel * 2, pixel * 2.5, pixel * 1);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - pixel * 2.8, cy - pixel * 1, pixel * 1.5, pixel * 1.5);
      // Beak
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - pixel * 6, cy - pixel * 0.5, pixel * 2, pixel * 1.2);
    } else if (stage === 2) {
      // Robust adult Chucao with spread wing
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.ellipse(cx + pixel * 0.5, cy + pixel, pixel * 6, pixel * 4.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(cx - pixel * 2, cy + pixel * 1.5, pixel * 3.4, pixel * 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wing Crest
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx + pixel * 1, cy - pixel * 1, pixel * 6, pixel * 3);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx + pixel * 4.5, cy - pixel * 5, pixel * 2.5, pixel * 5);
      // Head & Fierce brow
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - pixel * 4, cy - pixel * 2.8, pixel * 3, pixel * 1);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - pixel * 3.5, cy - pixel * 1.6, pixel * 1.6, pixel * 1.6);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - pixel * 7.2, cy - pixel * 1.2, pixel * 2.5, pixel * 1.4);
    } else {
      // Chucao Feroz (Massive bristled plumage + territorial crimson wind aura)
      ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
      ctx.beginPath();
      ctx.arc(cx, cy, pixel * 8.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.ellipse(cx, cy + pixel, pixel * 6.8, pixel * 5.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Crimson chest + spiked feathers
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - pixel * 5.5, cy - pixel * 1, pixel * 5, pixel * 6);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(cx - pixel * 4.5, cy, pixel * 3, pixel * 4);
      // Bristled crest & wings
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx + pixel * 2, cy - pixel * 6.5, pixel * 5, pixel * 6);
      ctx.fillRect(cx - pixel * 7.5, cy - pixel * 3, pixel * 2.5, pixel * 3);
      // Glowing eyes
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - pixel * 4.5, cy - pixel * 3, pixel * 2, pixel * 1.6);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - pixel * 8, cy - pixel * 1.5, pixel * 3, pixel * 1.6);
    }
  } else if (baseId === 'puducito') {
    // LÍNEA MAMÍFEROS: Pudú tierno -> Pudú adulto astado -> Pudú agresivo ojos brillantes
    if (stage === 1) {
      // Small tender light-brown deer
      ctx.fillStyle = '#b45309';
      ctx.fillRect(cx - pixel * 4.5, cy, pixel * 8.5, pixel * 5);
      // White baby spots
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(cx - pixel * 1, cy + pixel * 1, pixel * 1.2, pixel * 1.2);
      ctx.fillRect(cx + pixel * 1.5, cy + pixel * 2, pixel * 1.2, pixel * 1.2);
      // Head
      ctx.fillStyle = '#d97706';
      ctx.fillRect(cx - pixel * 5.5, cy - pixel * 4, pixel * 4.5, pixel * 4.5);
      // Big rounded ears
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx - pixel * 5, cy - pixel * 6, pixel * 1.8, pixel * 2.4);
      ctx.fillRect(cx - pixel * 2.2, cy - pixel * 6, pixel * 1.8, pixel * 2.4);
      // Big cute eyes & dark nose
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - pixel * 4.8, cy - pixel * 2.5, pixel * 1.4, pixel * 1.6);
      ctx.fillRect(cx - pixel * 6, cy - pixel * 1, pixel * 1.2, pixel * 1.2);
      // Legs
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - pixel * 3.8, cy + pixel * 5, pixel * 1.6, pixel * 2.5);
      ctx.fillRect(cx + pixel * 1.5, cy + pixel * 5, pixel * 1.6, pixel * 2.5);
    } else if (stage === 2) {
      // Pudú adulto astado
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx - pixel * 5, cy - pixel * 0.5, pixel * 10, pixel * 5.5);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(cx - pixel * 6.5, cy - pixel * 4.5, pixel * 4.8, pixel * 4.5);
      // Antlers
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - pixel * 4.8, cy - pixel * 7.8, pixel * 1.2, pixel * 3.5);
      ctx.fillRect(cx - pixel * 2.8, cy - pixel * 7.8, pixel * 1.2, pixel * 3.5);
      ctx.fillRect(cx - pixel * 5.8, cy - pixel * 6.8, pixel * 1.2, pixel * 1);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - pixel * 5.5, cy - pixel * 3, pixel * 1.5, pixel * 1.5);
      // Legs
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - pixel * 4.5, cy + pixel * 5, pixel * 1.8, pixel * 3);
      ctx.fillRect(cx + pixel * 2.5, cy + pixel * 5, pixel * 1.8, pixel * 3);
    } else {
      // Pudú agresivo (Brillant emerald/gold eyes, sharp crystalline antlers)
      ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, pixel * 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - pixel * 5.8, cy - pixel * 1, pixel * 11.5, pixel * 6);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - pixel * 7.2, cy - pixel * 4.5, pixel * 5.2, pixel * 4.8);
      // Sharp glowing antlers
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(cx - pixel * 5.5, cy - pixel * 9, pixel * 1.4, pixel * 4.8);
      ctx.fillRect(cx - pixel * 3, cy - pixel * 9, pixel * 1.4, pixel * 4.8);
      ctx.fillRect(cx - pixel * 7, cy - pixel * 7.5, pixel * 2, pixel * 1.2);
      // Glowing eyes
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - pixel * 6, cy - pixel * 3, pixel * 1.8, pixel * 1.6);
      // Hooves
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(cx - pixel * 5, cy + pixel * 5, pixel * 2, pixel * 3);
      ctx.fillRect(cx + pixel * 3, cy + pixel * 5, pixel * 2, pixel * 3);
    }
  } else if (baseId === 'ventisquero') {
    // LÍNEA HIELO/GLACIAR: Trozo de hielo -> Pedazo angular -> Coloso glaciar
    if (stage === 1) {
      // Cute floating cyan crystal shard
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.moveTo(cx, cy - pixel * 6);
      ctx.lineTo(cx + pixel * 5, cy);
      ctx.lineTo(cx + pixel * 3.5, cy + pixel * 6);
      ctx.lineTo(cx - pixel * 3.5, cy + pixel * 6);
      ctx.lineTo(cx - pixel * 5, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(cx - pixel * 2.5, cy - pixel * 2, pixel * 5, pixel * 5);
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(cx - pixel * 2.2, cy, pixel * 1.4, pixel * 1.8);
      ctx.fillRect(cx + pixel * 0.8, cy, pixel * 1.4, pixel * 1.8);
    } else if (stage === 2) {
      // Structured angular ice block guardian
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(cx - pixel * 5.5, cy - pixel * 4, pixel * 11, pixel * 10);
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.moveTo(cx - pixel * 5.5, cy - pixel * 4);
      ctx.lineTo(cx - pixel * 2, cy - pixel * 8);
      ctx.lineTo(cx + pixel * 2, cy - pixel * 8);
      ctx.lineTo(cx + pixel * 5.5, cy - pixel * 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(cx - pixel * 3.5, cy - pixel * 2, pixel * 7, pixel * 6);
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(cx - pixel * 2.6, cy - pixel * 0.5, pixel * 1.8, pixel * 1.8);
      ctx.fillRect(cx + pixel * 0.8, cy - pixel * 0.5, pixel * 1.8, pixel * 1.8);
    } else {
      // Coloso glaciar
      ctx.fillStyle = 'rgba(103, 232, 249, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, pixel * 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(cx - pixel * 6.5, cy - pixel * 4, pixel * 13, pixel * 11);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(cx - pixel * 8, cy - pixel * 2, pixel * 2.5, pixel * 7);
      ctx.fillRect(cx + pixel * 5.5, cy - pixel * 2, pixel * 2.5, pixel * 7);
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.moveTo(cx - pixel * 5, cy - pixel * 4);
      ctx.lineTo(cx, cy - pixel * 9);
      ctx.lineTo(cx + pixel * 5, cy - pixel * 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - pixel * 3.5, cy - pixel * 1.5, pixel * 2, pixel * 2);
      ctx.fillRect(cx + pixel * 1.5, cy - pixel * 1.5, pixel * 2, pixel * 2);
    }
  } else if (baseId === 'quiltro') {
    // QUILTRO LINE: Cachorro -> Quiltro Guardián -> Lobo Cordillera
    const wag = Math.sin(animatedTime * 8) * pixel;
    if (stage === 1) {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(cx - pixel * 4.5, cy + pixel * 0.5, pixel * 8.5, pixel * 5);
      ctx.fillRect(cx - pixel * 5.8, cy - pixel * 3.5, pixel * 4.8, pixel * 4.5);
      // Red bandana scarf
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(cx - pixel * 5, cy + pixel * 0.5, pixel * 3.8, pixel * 1.5);
      // Floppy ear
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - pixel * 2.5, cy - pixel * 3.5, pixel * 1.8, pixel * 3);
      // Wagging tail
      ctx.fillStyle = '#d97706';
      ctx.fillRect(cx + pixel * 4, cy - pixel * 1 + wag, pixel * 2.5, pixel * 1.8);
      // Eye & snout
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - pixel * 4.6, cy - pixel * 2.2, pixel * 1.3, pixel * 1.4);
      ctx.fillRect(cx - pixel * 6.4, cy - pixel * 1, pixel * 1.3, pixel * 1.2);
      // Paws
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - pixel * 3.8, cy + pixel * 5.5, pixel * 1.8, pixel * 2.2);
      ctx.fillRect(cx + pixel * 1.5, cy + pixel * 5.5, pixel * 1.8, pixel * 2.2);
    } else if (stage === 2) {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx - pixel * 5.5, cy - pixel * 0.5, pixel * 10.5, pixel * 5.8);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(cx - pixel * 6.8, cy - pixel * 4.8, pixel * 5.2, pixel * 5);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - pixel * 5.5, cy, pixel * 4.5, pixel * 1.8);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - pixel * 3, cy - pixel * 6.8, pixel * 1.8, pixel * 2.5);
      ctx.fillRect(cx + pixel * 5, cy - pixel * 2 + wag, pixel * 3, pixel * 2.2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - pixel * 5.4, cy - pixel * 3.2, pixel * 1.5, pixel * 1.5);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx - pixel * 4.5, cy + pixel * 5.2, pixel * 2, pixel * 2.8);
      ctx.fillRect(cx + pixel * 2.2, cy + pixel * 5.2, pixel * 2, pixel * 2.8);
    } else {
      // Lobo de la Cordillera
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx - pixel * 6, cy - pixel * 1.5, pixel * 12, pixel * 6.5);
      // Silver mane
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(cx - pixel * 6.5, cy - pixel * 3, pixel * 5.5, pixel * 5);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cx - pixel * 7.5, cy - pixel * 5.5, pixel * 5.5, pixel * 4.5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - pixel * 6, cy - pixel * 4, pixel * 1.8, pixel * 1.5);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx + pixel * 5.5, cy - pixel * 2.5 + wag, pixel * 3, pixel * 2.5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - pixel * 5, cy + pixel * 5, pixel * 2.2, pixel * 3);
      ctx.fillRect(cx + pixel * 2.5, cy + pixel * 5, pixel * 2.2, pixel * 3);
    }
  } else if (baseId === 'torcaza') {
    // TORCAZA LINE: Torcaza -> Torcaza Plateada -> Cóndor Plateado
    const flap = Math.sin(animatedTime * 9) * pixel * 1.4;
    if (stage === 1) {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(cx + pixel * 0.5, cy + pixel * 1.5, pixel * 5, pixel * 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(cx - pixel * 1, cy + pixel * 1);
      ctx.lineTo(cx + pixel * 5, cy - pixel * 3 + flap);
      ctx.lineTo(cx + pixel * 4, cy + pixel * 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(cx - pixel * 3.5, cy - pixel * 1.5, pixel * 2.5, 0, Math.PI * 2);
      ctx.fill();
      // White collar band
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - pixel * 4.5, cy - pixel * 0.2, pixel * 2.5, pixel * 1);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(cx - pixel * 6.8, cy - pixel * 1.5, pixel * 2, pixel * 1.2);
    } else if (stage === 2) {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.ellipse(cx, cy + pixel * 1, pixel * 6, pixel * 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(cx - pixel * 1, cy);
      ctx.lineTo(cx + pixel * 6, cy - pixel * 5 + flap);
      ctx.lineTo(cx + pixel * 5, cy + pixel * 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(cx - pixel * 4.2, cy - pixel * 2.5, pixel * 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - pixel * 5, cy - pixel * 3, pixel * 1.4, pixel * 1.4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - pixel * 7.8, cy - pixel * 2.2, pixel * 2.5, pixel * 1.3);
    } else {
      // Majestic Condor / Sovereign Winged Spirit
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(cx, cy + pixel * 1, pixel * 6.5, pixel * 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(cx - pixel * 2, cy);
      ctx.lineTo(cx + pixel * 8, cy - pixel * 6 + flap);
      ctx.lineTo(cx + pixel * 6, cy + pixel * 2);
      ctx.closePath();
      ctx.fill();
      // Neck white ruff
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - pixel * 5.8, cy - pixel * 1.5, pixel * 4, pixel * 2.2);
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(cx - pixel * 4.5, cy - pixel * 3.8, pixel * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - pixel * 8, cy - pixel * 3.8, pixel * 2.6, pixel * 1.5);
    }
  } else if (baseId === 'pinguino') {
    // PINGUINO LINE: Pingüino Austral -> Magallanes -> Emperador del Canal
    const waddle = Math.sin(animatedTime * 6) * pixel * 0.6;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(cx, cy + pixel * 1.2 + waddle, pixel * (3.6 + stage * 0.5), pixel * (4.8 + stage * 0.6), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(cx + pixel * 0.4, cy + pixel * 2 + waddle, pixel * (2.4 + stage * 0.3), pixel * (3.6 + stage * 0.4), 0, 0, Math.PI * 2);
    ctx.fill();
    // Magellanic chest band / Emperor golden collar
    ctx.fillStyle = stage >= 3 ? '#fbbf24' : '#0f172a';
    ctx.fillRect(cx - pixel * 2.5, cy - pixel * 0.4 + waddle, pixel * 5.2, pixel * 1.1);
    // Flippers
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - pixel * (4.6 + stage * 0.5), cy + waddle, pixel * 1.8, pixel * 4);
    ctx.fillRect(cx + pixel * (2.8 + stage * 0.5), cy + waddle, pixel * 1.8, pixel * 4);
    // Eyes & Orange Beak
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - pixel * 1.2, cy - pixel * 2.8 + waddle, pixel * 1.1, pixel * 1.2);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(cx - pixel * 4.2, cy - pixel * 2.4 + waddle, pixel * 2.4, pixel * 1.3);
    ctx.fillRect(cx - pixel * 2.6, cy + pixel * (5.6 + stage * 0.5), pixel * 2, pixel * 1.2);
    ctx.fillRect(cx + pixel * 0.8, cy + pixel * (5.6 + stage * 0.5), pixel * 2, pixel * 1.2);
  } else if (baseId === 'hongo') {
    // HONGO LINE: Bioluminescent Valdivian Mushroom
    const glow = Math.sin(animatedTime * 4) * 0.2 + 0.65;
    ctx.fillStyle = `rgba(163, 230, 53, ${glow * 0.4})`;
    ctx.beginPath();
    ctx.arc(cx, cy - pixel, pixel * (6 + stage), 0, Math.PI * 2);
    ctx.fill();
    // Stem
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(cx - pixel * (1.8 + stage * 0.3), cy + pixel * 0.5, pixel * (3.6 + stage * 0.6), pixel * (4.5 + stage * 0.5));
    // Glowing Cap
    ctx.fillStyle = stage >= 3 ? '#10b981' : stage === 2 ? '#65a30d' : '#15803d';
    ctx.beginPath();
    ctx.ellipse(cx, cy - pixel * 1.2, pixel * (4.8 + stage * 0.8), pixel * (3.2 + stage * 0.4), 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - pixel * (4.8 + stage * 0.8), cy - pixel * 1.4, pixel * (9.6 + stage * 1.6), pixel * 1.6);
    // Neon spots & cute eyes
    ctx.fillStyle = '#bef264';
    ctx.fillRect(cx - pixel * 3, cy - pixel * 3.2, pixel * 1.6, pixel * 1.4);
    ctx.fillRect(cx + pixel * 1.2, cy - pixel * 3.6, pixel * 1.8, pixel * 1.4);
    ctx.fillRect(cx - pixel * 0.6, cy - pixel * 2.2, pixel * 1.4, pixel * 1.2);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - pixel * 1.2, cy + pixel * 1.8, pixel * 0.9, pixel * 1.3);
    ctx.fillRect(cx + pixel * 0.6, cy + pixel * 1.8, pixel * 0.9, pixel * 1.3);
  } else if (baseId === 'costanera') {
    // BOSS 1: Edificio Costanera Center (Skyscraper Spirit of Glass & Sunlight)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.beginPath();
    ctx.arc(cx, cy, pixel * 7.8, 0, Math.PI * 2);
    ctx.fill();
    // Main tapering glass tower
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(cx - pixel * 3.6, cy + pixel * 6.5);
    ctx.lineTo(cx - pixel * 2.2, cy - pixel * 5.8);
    ctx.lineTo(cx + pixel * 2.2, cy - pixel * 5.8);
    ctx.lineTo(cx + pixel * 3.6, cy + pixel * 6.5);
    ctx.closePath();
    ctx.fill();
    // Glass reflections & spire
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - pixel * 1.8, cy - pixel * 5.2, pixel * 1.2, pixel * 11);
    ctx.fillStyle = '#e0f2fe';
    for (let r = -4; r <= 4; r += 2) {
      ctx.fillRect(cx - pixel * 2.4, cy + pixel * r, pixel * 4.8, pixel * 0.7);
    }
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(cx - pixel * 0.4, cy - pixel * 8.2, pixel * 0.8, pixel * 2.6);
    // Glowing Spirit Eyes on facade
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx - pixel * 1.8, cy - pixel * 1.5, pixel * 1.2, pixel * 1.2);
    ctx.fillRect(cx + pixel * 0.6, cy - pixel * 1.5, pixel * 1.2, pixel * 1.2);
  } else if (baseId === 'araucaria_madre') {
    // BOSS 3: Araucaria Madre Milenaria (Ancient Autumn & Evergreen Pewén)
    ctx.fillStyle = 'rgba(234, 88, 12, 0.28)';
    ctx.beginPath();
    ctx.arc(cx, cy, pixel * 8, 0, Math.PI * 2);
    ctx.fill();
    // Thick ancient trunk
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - pixel * 2.2, cy - pixel * 1, pixel * 4.4, pixel * 7.5);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(cx - pixel * 3.4, cy + pixel * 4.5, pixel * 6.8, pixel * 2);
    // Layered Pewén canopy (copper/orange/dark green)
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.ellipse(cx, cy - pixel * 4.2, pixel * 7.2, pixel * 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c2410c';
    ctx.beginPath();
    ctx.ellipse(cx - pixel * 3.8, cy - pixel * 1.8, pixel * 3.6, pixel * 1.7, -0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + pixel * 3.8, cy - pixel * 1.8, pixel * 3.6, pixel * 1.7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(cx, cy - pixel * 5.2, pixel * 5, pixel * 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ancient glowing eyes on trunk
    ctx.fillStyle = '#fde047';
    ctx.fillRect(cx - pixel * 1.5, cy + pixel * 0.5, pixel * 1.1, pixel * 1.2);
    ctx.fillRect(cx + pixel * 0.5, cy + pixel * 0.5, pixel * 1.1, pixel * 1.2);
  } else if (baseId === 'torreon') {
    // BOSS 4: Torreón del Calle-Calle (Nocturnal Valdivian Stone Watchtower)
    ctx.fillStyle = 'rgba(163, 230, 53, 0.25)';
    ctx.beginPath();
    ctx.arc(cx, cy, pixel * 7.8, 0, Math.PI * 2);
    ctx.fill();
    // Stone tower body
    ctx.fillStyle = '#475569';
    ctx.fillRect(cx - pixel * 3.8, cy - pixel * 2.5, pixel * 7.6, pixel * 9);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(cx - pixel * 3.2, cy - pixel * 2.2, pixel * 2.2, pixel * 8);
    // Moss accents
    ctx.fillStyle = '#15803d';
    ctx.fillRect(cx - pixel * 3.8, cy + pixel * 3.5, pixel * 2.5, pixel * 3);
    ctx.fillRect(cx + pixel * 1.6, cy + pixel * 2, pixel * 2.2, pixel * 4.5);
    // Conical roof
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(cx, cy - pixel * 7.5);
    ctx.lineTo(cx + pixel * 5, cy - pixel * 2.4);
    ctx.lineTo(cx - pixel * 5, cy - pixel * 2.4);
    ctx.closePath();
    ctx.fill();
    // Glowing amber/neon windows
    ctx.fillStyle = '#fde047';
    ctx.fillRect(cx - pixel * 1.8, cy - pixel * 0.5, pixel * 1.2, pixel * 1.6);
    ctx.fillRect(cx + pixel * 0.6, cy - pixel * 0.5, pixel * 1.2, pixel * 1.6);
    ctx.fillStyle = '#a3e635';
    ctx.fillRect(cx - pixel * 0.8, cy + pixel * 2.6, pixel * 1.6, pixel * 2.2);
  } else if (baseId === 'caicai') {
    // BOSS 5A: Cai Cai Vilu (Sea Serpent Spirit)
    const wave = Math.sin(animatedTime * 5) * pixel * 1.1;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.35)';
    ctx.beginPath();
    ctx.arc(cx, cy, pixel * 8, 0, Math.PI * 2);
    ctx.fill();
    // Coiled sea serpent body
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = pixel * 3.2;
    ctx.beginPath();
    ctx.moveTo(cx - pixel * 5.5, cy + pixel * 4 + wave);
    ctx.bezierCurveTo(cx - pixel * 2, cy - pixel * 5, cx + pixel * 2, cy + pixel * 6, cx + pixel * 5, cy - pixel * 2 - wave);
    ctx.stroke();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = pixel * 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - pixel * 5.2, cy + pixel * 3.8 + wave);
    ctx.bezierCurveTo(cx - pixel * 2, cy - pixel * 5, cx + pixel * 2, cy + pixel * 6, cx + pixel * 4.8, cy - pixel * 2 - wave);
    ctx.stroke();
    // Dragon serpent head & fins
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(cx - pixel * 6.5, cy - pixel * 3.8 + wave * 0.5, pixel * 4.5, pixel * 3.6);
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.moveTo(cx - pixel * 2.5, cy - pixel * 3.8 + wave * 0.5);
    ctx.lineTo(cx, cy - pixel * 6.5 + wave * 0.5);
    ctx.lineTo(cx - pixel * 1.2, cy - pixel * 2.2 + wave * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx - pixel * 5.6, cy - pixel * 2.6 + wave * 0.5, pixel * 1.3, pixel * 1.3);
  } else if (baseId === 'viluvilu') {
    // BOSS 5B: Vilu Vilu (Earth & Mountain Serpent Spirit)
    const coil = Math.cos(animatedTime * 4.5) * pixel * 0.9;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.beginPath();
    ctx.arc(cx, cy, pixel * 8, 0, Math.PI * 2);
    ctx.fill();
    // Armored stone & amber coils
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = pixel * 3.4;
    ctx.beginPath();
    ctx.moveTo(cx + pixel * 5.5, cy + pixel * 4 + coil);
    ctx.bezierCurveTo(cx + pixel * 2, cy - pixel * 5, cx - pixel * 2, cy + pixel * 6, cx - pixel * 5, cy - pixel * 2 - coil);
    ctx.stroke();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = pixel * 1.4;
    ctx.beginPath();
    ctx.moveTo(cx + pixel * 5.2, cy + pixel * 3.8 + coil);
    ctx.bezierCurveTo(cx + pixel * 2, cy - pixel * 5, cx - pixel * 2, cy + pixel * 6, cx - pixel * 4.8, cy - pixel * 2 - coil);
    ctx.stroke();
    // Horned serpent head
    ctx.fillStyle = '#92400e';
    ctx.fillRect(cx + pixel * 2, cy - pixel * 3.8 - coil * 0.5, pixel * 4.5, pixel * 3.6);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(cx + pixel * 2.6, cy - pixel * 3.8 - coil * 0.5);
    ctx.lineTo(cx + pixel * 0.8, cy - pixel * 6.8 - coil * 0.5);
    ctx.lineTo(cx + pixel * 4.2, cy - pixel * 3.6 - coil * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx + pixel * 4.5, cy - pixel * 2.6 - coil * 0.5, pixel * 1.3, pixel * 1.3);
  } else if (baseId === 'cuellilargo') {
    // SAURÓPODO CUELLILARGO (Long-neck dinosaur of Biobío)
    const sway = Math.sin(animatedTime * 4) * pixel * 0.8;
    ctx.fillStyle = stage === 3 ? '#15803d' : stage === 2 ? '#166534' : '#4d7c0f';
    // Body & tail
    ctx.beginPath();
    ctx.ellipse(cx + pixel * 1.2, cy + pixel * 2.6, pixel * (4.4 + stage * 0.4), pixel * (2.6 + stage * 0.3), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx + pixel * 4.5, cy + pixel * 1.8, pixel * 3.5, pixel * 1.6);
    // Legs
    ctx.fillRect(cx - pixel * 2.2, cy + pixel * 4.2, pixel * 1.6, pixel * 2.8);
    ctx.fillRect(cx + pixel * 2.6, cy + pixel * 4.2, pixel * 1.6, pixel * 2.8);
    // Long neck & head
    ctx.fillStyle = stage >= 2 ? '#22c55e' : '#84cc16';
    ctx.fillRect(cx - pixel * 4.2 + sway * 0.4, cy - pixel * 5.2, pixel * 2.2, pixel * 7.8);
    ctx.fillRect(cx - pixel * 6.5 + sway * 0.5, cy - pixel * 5.6, pixel * 3.6, pixel * 2.2);
    // Prehistoric fern spots on back
    ctx.fillStyle = '#bef264';
    ctx.fillRect(cx - pixel * 0.4, cy + pixel * 1.1, pixel * 1.4, pixel * 1.2);
    ctx.fillRect(cx + pixel * 2.0, cy + pixel * 1.4, pixel * 1.2, pixel * 1.0);
    // Eye
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - pixel * 5.4 + sway * 0.5, cy - pixel * 4.9, pixel * 1.0, pixel * 1.0);
  } else if (baseId === 'trex') {
    // BOSS 2: T-REX TIRANO DEL BIOBÍO (Ferocious fiery/stone tyrannosaur)
    const chomp = Math.abs(Math.sin(animatedTime * 4.5)) * pixel * 1.2;
    ctx.fillStyle = 'rgba(220, 38, 38, 0.28)';
    ctx.beginPath();
    ctx.arc(cx, cy, pixel * 8, 0, Math.PI * 2);
    ctx.fill();
    // Heavy tail & torso
    ctx.fillStyle = stage >= 3 ? '#7f1d1d' : '#991b1b';
    ctx.fillRect(cx + pixel * 2.2, cy + pixel * 1.4, pixel * 5.6, pixel * 2.5);
    ctx.beginPath();
    ctx.ellipse(cx + pixel * 0.2, cy + pixel * 1.2, pixel * 4.2, pixel * 3.5, -0.35, 0, Math.PI * 2);
    ctx.fill();
    // Muscular legs & claws
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(cx - pixel * 1.5, cy + pixel * 4.2, pixel * 2, pixel * 3.2);
    ctx.fillRect(cx + pixel * 1.4, cy + pixel * 4.2, pixel * 2, pixel * 3.2);
    // Tiny front arms
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(cx - pixel * 3.8, cy + pixel * 0.6, pixel * 2.0, pixel * 1.0);
    // Massive head + snapping jaw + teeth
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(cx - pixel * 6.5, cy - pixel * 5.6, pixel * 6.2, pixel * 3.4);
    ctx.fillRect(cx - pixel * 5.8, cy - pixel * 2.2 + chomp, pixel * 4.6, pixel * 1.5);
    ctx.fillStyle = '#fefce8';
    ctx.fillRect(cx - pixel * 6.0, cy - pixel * 2.3, pixel * 0.9, pixel * 0.9);
    ctx.fillRect(cx - pixel * 4.4, cy - pixel * 2.3, pixel * 0.9, pixel * 0.9);
    ctx.fillRect(cx - pixel * 2.8, cy - pixel * 2.3, pixel * 0.9, pixel * 0.9);
    // Dorsal ridge spikes & fierce amber eye
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(cx - pixel * 1.5, cy - pixel * 6.4, pixel * 1.2, pixel * 1.0);
    ctx.fillRect(cx + pixel * 0.8, cy - pixel * 3.2, pixel * 1.2, pixel * 1.2);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx - pixel * 4.2, cy - pixel * 4.6, pixel * 1.3, pixel * 1.2);
  } else {
    // LOICA LINE: Loica -> Loica Carmesí -> Sol de la Loica
    const flap = Math.sin(animatedTime * 8) * pixel;
    if (stage === 1) {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(cx + pixel * 0.5, cy + pixel * 1.5, pixel * 4.8, pixel * 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Vivid scarlet chest
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx - pixel * 1.8, cy + pixel * 1.8, pixel * 3.2, 0, Math.PI * 2);
      ctx.fill();
      // White eye brow stripe
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - pixel * 4.5, cy - pixel * 2, pixel * 3, pixel * 1);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - pixel * 4, cy - pixel * 1, pixel * 1.3, pixel * 1.4);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - pixel * 6.8, cy - pixel * 0.8, pixel * 2.2, pixel * 1.2);
    } else if (stage === 2) {
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.ellipse(cx, cy + pixel, pixel * 5.8, pixel * 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx - pixel * 2, cy + pixel * 1.5, pixel * 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(cx + pixel, cy);
      ctx.lineTo(cx + pixel * 6.5, cy - pixel * 4 + flap);
      ctx.lineTo(cx + pixel * 5, cy + pixel * 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - pixel * 4.8, cy - pixel * 2, pixel * 1.6, pixel * 1.5);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - pixel * 7.5, cy - pixel * 1.2, pixel * 2.5, pixel * 1.4);
    } else {
      // Sol de la Loica (Radiant Crimson Firebird)
      ctx.fillStyle = 'rgba(249, 115, 22, 0.35)';
      ctx.beginPath();
      ctx.arc(cx, cy, pixel * 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.ellipse(cx, cy + pixel, pixel * 6, pixel * 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(cx - pixel, cy - pixel);
      ctx.lineTo(cx + pixel * 7.5, cy - pixel * 6 + flap);
      ctx.lineTo(cx + pixel * 5.5, cy + pixel * 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cx - pixel * 5, cy - pixel * 4, pixel * 4, pixel * 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx - pixel * 4.5, cy - pixel * 2.8, pixel * 1.8, pixel * 1.6);
      ctx.fillRect(cx - pixel * 7.5, cy - pixel * 2, pixel * 2.8, pixel * 1.5);
    }
  }

  ctx.restore();
}

// Draw Overworld interactive entities (Chests, NPCs, Obstacles, Portals, Roaming Spirits, Bosses)
export function drawEntitySprite(
  ctx: CanvasRenderingContext2D,
  type: string,
  sprite: string,
  x: number,
  y: number,
  size: number,
  cleared: boolean = false,
  stepFrame: number = 0,
  isBossAwakened: boolean = true
) {
  const pixel = size / 16;

  if (cleared && type !== 'npc') return;

  // VISIBLE ROAMING WILD SPIRITS
  if ((type === 'wild_encounter' || sprite.startsWith('wild_')) && !sprite.startsWith('deco_')) {
    const spiritId = sprite.replace('wild_', '').replace('pudu', 'puducito');
    const bob = Math.sin(stepFrame * 0.35) * pixel * 1.4;

    const aura = ctx.createRadialGradient(x + size / 2, y + size / 2, 2, x + size / 2, y + size / 2, size / 2);
    aura.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(x, y + bob);
    drawCreatureSprite(ctx, spiritId, 1, 0, 0, size, stepFrame * 0.1, false);
    ctx.restore();

    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + size / 2 - pixel * 0.75, y - pixel * 2 + bob * 0.5, pixel * 1.5, pixel * 2.5);
    ctx.fillRect(x + size / 2 - pixel * 0.75, y + pixel * 1.5 + bob * 0.5, pixel * 1.5, pixel * 1.5);
    return;
  }

  if (type === 'chest') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + pixel * 2, y + pixel * 5, pixel * 12, pixel * 9);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + pixel * 1, y + pixel * 2, pixel * 14, pixel * 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + pixel * 6.5, y + pixel * 5, pixel * 3, pixel * 3.5);
    ctx.fillRect(x + pixel * 2, y + pixel * 4, pixel * 12, pixel * 1.5);
    return;
  }

  if (type === 'npc' && !sprite.startsWith('deco_')) {
    const idleBob = Math.sin(stepFrame * 0.25) * pixel * 0.5;
    if (sprite === 'npc_shopkeeper') {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + pixel * 1, y - pixel * 2, pixel * 14, pixel * 3);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x + pixel * 3, y - pixel * 2, pixel * 2, pixel * 3);
      ctx.fillRect(x + pixel * 7, y - pixel * 2, pixel * 2, pixel * 3);
      ctx.fillRect(x + pixel * 11, y - pixel * 2, pixel * 2, pixel * 3);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x + pixel * 3, y + pixel * 5 + idleBob, pixel * 10, pixel * 7);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x + pixel * 5, y + pixel * 6 + idleBob, pixel * 6, pixel * 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + pixel * 1, y + pixel * 11, pixel * 14, pixel * 4);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x + pixel * 3, y + pixel * 12, pixel * 10, pixel);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(x + pixel * 4.5, y + pixel * 2 + idleBob, pixel * 7, pixel * 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + pixel * 5.5, y + pixel * 3.5 + idleBob, pixel * 1.5, pixel * 1.2);
      ctx.fillRect(x + pixel * 9, y + pixel * 3.5 + idleBob, pixel * 1.5, pixel * 1.2);
      return;
    }

    if (sprite === 'npc_maestro_vinculo') {
      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.beginPath();
      ctx.ellipse(x + size / 2, y + size - pixel, pixel * 4.8, pixel * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Master dark cloak & golden collar emblem
      ctx.fillStyle = '#18181b';
      ctx.fillRect(x + pixel * 2.5, y + pixel * 6 + idleBob, pixel * 11, pixel * 8.5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + pixel * 5.5, y + pixel * 6.5 + idleBob, pixel * 5, pixel * 1.5);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(x + pixel * 4, y + pixel * 2.5 + idleBob, pixel * 8, pixel * 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + pixel * 5, y + pixel * 4 + idleBob, pixel * 1.5, pixel * 1.5);
      ctx.fillRect(x + pixel * 9.5, y + pixel * 4 + idleBob, pixel * 1.5, pixel * 1.5);
      // Hood / crest
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(x + pixel * 2.5, y + pixel * 0.8 + idleBob, pixel * 11, pixel * 2.3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + pixel * 7, y + pixel * 1 + idleBob, pixel * 2, pixel * 1.3);
      return;
    }

    const coatColor =
      sprite === 'npc_old_man' ? '#475569' :
      sprite === 'npc_ranger' ? '#047857' :
      sprite === 'npc_miner' ? '#9a3412' :
      sprite === 'npc_explorer' ? '#1e40af' :
      sprite === 'npc_villager_f' ? '#9d174d' : '#0369a1';
    const hatColor =
      sprite === 'npc_old_man' ? '#e2e8f0' :
      sprite === 'npc_ranger' ? '#10b981' :
      sprite === 'npc_miner' ? '#facc15' :
      sprite === 'npc_explorer' ? '#92400e' :
      sprite === 'npc_villager_f' ? '#581c87' : '#0f766e';

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size - pixel, pixel * 4.5, pixel * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = coatColor;
    ctx.fillRect(x + pixel * 3, y + pixel * 6 + idleBob, pixel * 10, pixel * 8);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(x + pixel * 4, y + pixel * 2.5 + idleBob, pixel * 8, pixel * 4);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + pixel * 5, y + pixel * 4 + idleBob, pixel * 1.5, pixel * 1.5);
    ctx.fillRect(x + pixel * 9.5, y + pixel * 4 + idleBob, pixel * 1.5, pixel * 1.5);
    if (sprite === 'npc_old_man') {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(x + pixel * 5, y + pixel * 5.8 + idleBob, pixel * 6, pixel * 2);
    }
    ctx.fillStyle = hatColor;
    ctx.fillRect(x + pixel * 2.5, y + pixel * 1 + idleBob, pixel * 11, pixel * 2);
    return;
  }

  if (type === 'boss') {
    if (!isBossAwakened) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + pixel * 3, y + pixel * 2, pixel * 10, pixel * 12);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + pixel * 2, y + pixel * 12, pixel * 12, pixel * 3);
      const glow = Math.sin(stepFrame * 0.15) * 0.2 + 0.4;
      ctx.fillStyle = `rgba(147, 51, 234, ${glow})`;
      ctx.fillRect(x + pixel * 5, y + pixel * 4, pixel * 6, pixel * 7);
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(x + pixel * 6.5, y + pixel * 6, pixel * 3, pixel * 3);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = pixel;
      ctx.strokeRect(x + pixel * 7, y + pixel * 4.5, pixel * 2, pixel * 2);
      return;
    }

    const pulse = Math.sin(stepFrame * 0.25) * pixel * 2.5;
    const bossGlow = ctx.createRadialGradient(x + size / 2, y + size / 2, pixel * 2, x + size / 2, y + size / 2, size / 1.4 + pulse);
    bossGlow.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
    bossGlow.addColorStop(0.6, 'rgba(185, 28, 28, 0.25)');
    bossGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bossGlow;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 1.4 + pulse, 0, Math.PI * 2);
    ctx.fill();

    if (sprite === 'boss_costanera') {
      drawCreatureSprite(ctx, 'costanera', 2, x, y, size, stepFrame * 0.1, false);
      return;
    }
    if (sprite === 'boss_trex') {
      drawCreatureSprite(ctx, 'trex', 2, x, y, size, stepFrame * 0.1, false);
      return;
    }
    if (sprite === 'boss_araucaria') {
      drawCreatureSprite(ctx, 'araucaria_madre', 3, x, y, size, stepFrame * 0.1, false);
      return;
    }
    if (sprite === 'boss_torreon') {
      drawCreatureSprite(ctx, 'torreon', 2, x, y, size, stepFrame * 0.1, false);
      return;
    }
    if (sprite === 'boss_caicai') {
      drawCreatureSprite(ctx, 'caicai', 3, x, y, size, stepFrame * 0.1, false);
      return;
    }
    if (sprite === 'boss_viluvilu') {
      drawCreatureSprite(ctx, 'viluvilu', 3, x, y, size, stepFrame * 0.1, false);
      return;
    }

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + pixel * 3, y + pixel * 5, pixel * 10, pixel * 9);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + pixel * 5, y + pixel * 7, pixel * 6, pixel * 5);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(x + pixel * 6, y + pixel * 8, pixel * 4, pixel * 3);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(x + pixel * 2, y + pixel * 1);
    ctx.lineTo(x + pixel * 5, y + pixel * 5);
    ctx.lineTo(x + pixel * 4, y + pixel * 5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + pixel * 14, y + pixel * 1);
    ctx.lineTo(x + pixel * 11, y + pixel * 5);
    ctx.lineTo(x + pixel * 12, y + pixel * 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + pixel * 5, y + pixel * 4, pixel * 2, pixel * 1.5);
    ctx.fillRect(x + pixel * 9, y + pixel * 4, pixel * 2, pixel * 1.5);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(x + pixel * 1, y + pixel * 10, pixel * 2, pixel * 4);
    ctx.fillRect(x + pixel * 13, y + pixel * 10, pixel * 2, pixel * 4);
    return;
  }

  if (type === 'portal') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + pixel * 6, y + pixel * 7, pixel * 4, pixel * 8);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x + pixel * 1, y + pixel * 2, pixel * 14, pixel * 6);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + pixel * 3, y + pixel * 4, pixel * 10, pixel * 2);
    return;
  }

  if (type === 'obstacle') {
    if (sprite.includes('bush')) {
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + pixel * 4, y + pixel * 6, pixel * 2, pixel * 2);
      ctx.fillRect(x + pixel * 10, y + pixel * 9, pixel * 2, pixel * 2);
    } else if (sprite.includes('magma')) {
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x + pixel * 2, y + pixel * 3, pixel * 12, pixel * 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + pixel * 4, y + pixel * 5, pixel * 8, pixel * 4);
    } else if (sprite.includes('ice')) {
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(x + pixel * 2, y + pixel * 2, pixel * 12, pixel * 12);
      ctx.fillStyle = '#cffafe';
      ctx.fillRect(x + pixel * 4, y + pixel * 4, pixel * 8, pixel * 8);
    } else {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(x + pixel * 2, y + pixel * 4, pixel * 12, pixel * 8);
    }
    return;
  }

  // DECORATIVE & WILDLIFE ANIMATED ENTITIES
  if (type === 'decorative' || sprite.startsWith('deco_')) {
    if (sprite.includes('quiltro')) {
      const tailWag = Math.sin(stepFrame * 1.2) * pixel * 2;
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x + pixel * 3, y + pixel * 6, pixel * 9, pixel * 6);
      ctx.fillRect(x + pixel * 9, y + pixel * 3, pixel * 5, pixel * 5);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + pixel * 9, y + pixel * 7, pixel * 4, pixel * 1.5);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + pixel * 10, y + pixel * 3, pixel * 2, pixel * 4);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + pixel * 12, y + pixel * 4, pixel * 1.2, pixel * 1.2);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x + pixel * 13, y + pixel * 6, pixel * 1.5, pixel * 1.5);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x + pixel * 1, y + pixel * 5 + tailWag, pixel * 2.5, pixel * 2);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + pixel * 4, y + pixel * 12, pixel * 2, pixel * 3);
      ctx.fillRect(x + pixel * 9, y + pixel * 12, pixel * 2, pixel * 3);
    } else if (sprite.includes('palomas') || sprite.includes('torcaza')) {
      const peck = Math.abs(Math.sin(stepFrame * 0.8)) * pixel * 1.5;
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.ellipse(x + pixel * 6, y + pixel * 10, pixel * 3.8, pixel * 2.4, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(x + pixel * 9, y + pixel * 8 + peck, pixel * 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x + pixel * 8, y + pixel * 9.5 + peck, pixel * 2, pixel * 0.8);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x + pixel * 10.5, y + pixel * 8.5 + peck, pixel * 1.2, pixel);
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.ellipse(x + pixel * 12, y + pixel * 12, pixel * 3, pixel * 2, 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (sprite.includes('hongo')) {
      drawCreatureSprite(ctx, 'hongo', 1, x, y, size, stepFrame * 0.1, false);
    } else if (sprite.includes('pescador')) {
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x + pixel * 4, y + pixel * 7, pixel * 7, pixel * 7);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(x + pixel * 5, y + pixel * 3, pixel * 5, pixel * 4);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x + pixel * 3, y + pixel * 2, pixel * 9, pixel * 2);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + pixel * 10, y + pixel * 7);
      ctx.lineTo(x + pixel * 16, y - pixel * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.moveTo(x + pixel * 16, y - pixel * 2);
      ctx.lineTo(x + pixel * 16, y + pixel * 10);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + pixel * 15.5, y + pixel * 9, pixel * 1.5, pixel * 1.5);
    } else if (sprite.includes('patos')) {
      const ripple = (stepFrame % 20) * pixel * 0.4;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.strokeRect(x + pixel * 2 - ripple / 2, y + pixel * 8 - ripple / 2, pixel * 10 + ripple, pixel * 5 + ripple);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(x + pixel * 9, y + pixel * 5, pixel * 3.5, pixel * 3.5);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x + pixel * 4, y + pixel * 7, pixel * 6, pixel * 4);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x + pixel * 12, y + pixel * 6.5, pixel * 2, pixel * 1.5);
    } else if (sprite.includes('ranita')) {
      const hop = Math.abs(Math.sin(stepFrame * 1.5)) * pixel * 3;
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(x + pixel * 8, y + pixel * 10 - hop, pixel * 4, pixel * 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + pixel * 9, y + pixel * 7.5 - hop, pixel * 1.5, pixel * 1.5);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(x + pixel * 5, y + pixel * 11 - hop, pixel * 2, pixel * 2);
    } else if (sprite.includes('salamandra')) {
      const spark = Math.sin(stepFrame * 2) * pixel * 1.5;
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(x + pixel * 3, y + pixel * 8, pixel * 10, pixel * 4);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + pixel * 5, y + pixel * 9, pixel * 2, pixel * 2);
      ctx.fillRect(x + pixel * 9, y + pixel * 9, pixel * 2, pixel * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + pixel * 11 + spark, y + pixel * 6 - spark, pixel, pixel);
    } else if (sprite.includes('pinguino')) {
      const wave = Math.sin(stepFrame * 1.2) * pixel * 1.5;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + pixel * 4, y + pixel * 4, pixel * 7, pixel * 10);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x + pixel * 6, y + pixel * 6, pixel * 4, pixel * 7);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x + pixel * 8, y + pixel * 5, pixel * 2.5, pixel * 1.5);
      ctx.fillRect(x + pixel * 5, y + pixel * 14, pixel * 2, pixel * 1.5);
      ctx.fillRect(x + pixel * 8, y + pixel * 14, pixel * 2, pixel * 1.5);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + pixel * 2, y + pixel * 6 + wave, pixel * 2, pixel * 4);
    } else if (sprite.includes('picaflor')) {
      const flap = Math.sin(stepFrame * 3.5) * pixel * 2.5;
      const hoverY = Math.sin(stepFrame * 0.8) * pixel * 1.5;
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.ellipse(x + pixel * 8, y + pixel * 8 + hoverY, pixel * 3, pixel * 1.8, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(x + pixel * 9, y + pixel * 7.5 + hoverY, pixel * 1.5, pixel * 1.5);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x + pixel * 10, y + pixel * 7 + hoverY, pixel * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + pixel * 11, y + pixel * 7 + hoverY);
      ctx.lineTo(x + pixel * 15, y + pixel * 7.5 + hoverY);
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.beginPath();
      ctx.moveTo(x + pixel * 7, y + pixel * 7 + hoverY);
      ctx.lineTo(x + pixel * 5, y + pixel * 3 + hoverY + flap);
      ctx.lineTo(x + pixel * 9, y + pixel * 5 + hoverY);
      ctx.closePath();
      ctx.fill();
    } else if (sprite.includes('loica')) {
      const bob = Math.sin(stepFrame * 0.9) * pixel * 1.2;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + pixel * 4, y + pixel * 6 + bob, pixel * 8, pixel * 5);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + pixel * 8, y + pixel * 5 + bob, pixel * 4.5, pixel * 5);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x + pixel * 9, y + pixel * 3.5 + bob, pixel * 3, pixel);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + pixel * 10.5, y + pixel * 4 + bob, pixel, pixel);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(x + pixel * 12.5, y + pixel * 5 + bob, pixel * 2, pixel * 1.2);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x + pixel * 6, y + pixel * 11 + bob, pixel * 1.2, pixel * 2);
      ctx.fillRect(x + pixel * 9, y + pixel * 11 + bob, pixel * 1.2, pixel * 2);
    } else if (sprite.includes('copihue')) {
      const sway = Math.sin(stepFrame * 0.7) * pixel * 1.8;
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + pixel * 8, y + pixel * 1);
      ctx.quadraticCurveTo(x + pixel * 12, y + pixel * 6, x + pixel * 8 + sway, y + pixel * 8);
      ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x + pixel * 9, y + pixel * 3, pixel * 2, pixel * 2);
      ctx.fillRect(x + pixel * 5, y + pixel * 5, pixel * 2, pixel * 2);
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(x + pixel * 8 + sway, y + pixel * 8);
      ctx.lineTo(x + pixel * 11 + sway, y + pixel * 13);
      ctx.lineTo(x + pixel * 5 + sway, y + pixel * 13);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + pixel * 7.5 + sway, y + pixel * 13, pixel * 1.5, pixel * 1.5);
    } else if (sprite.includes('fumarola')) {
      ctx.fillStyle = '#292524';
      ctx.fillRect(x + pixel * 3, y + pixel * 8, pixel * 10, pixel * 5);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(x + pixel * 6, y + pixel * 9, pixel * 4, pixel * 3);
      for (let p = 0; p < 3; p++) {
        const puffY = (stepFrame * 0.6 + p * 8) % 16;
        const puffX = Math.sin(stepFrame * 0.3 + p) * pixel * 2;
        ctx.fillStyle = `rgba(214, 211, 209, ${Math.max(0, 0.7 - puffY / 16)})`;
        ctx.beginPath();
        ctx.arc(x + pixel * 8 + puffX, y + pixel * 8 - puffY, pixel * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (sprite.includes('alerce')) {
      const sway = Math.sin(stepFrame * 0.5) * pixel * 1.2;
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(x + pixel * 5, y + pixel * 5, pixel * 6, pixel * 11);
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(x + pixel * 6, y + pixel * 7, pixel * 2, pixel * 4);
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.moveTo(x + pixel * 8 + sway, y + pixel * 0.5);
      ctx.lineTo(x + pixel * 15 + sway, y + pixel * 6);
      ctx.lineTo(x + pixel * 1 + sway, y + pixel * 6);
      ctx.closePath();
      ctx.fill();
    } else if (sprite.includes('fosil')) {
      const amberPulse = Math.sin(stepFrame * 0.4) * 0.2 + 0.8;
      ctx.fillStyle = '#57534e';
      ctx.fillRect(x + pixel * 2, y + pixel * 6, pixel * 12, pixel * 8);
      ctx.fillStyle = '#a8a29e';
      ctx.fillRect(x + pixel * 3, y + pixel * 7, pixel * 10, pixel * 3);
      ctx.fillStyle = `rgba(245, 158, 11, ${amberPulse})`;
      ctx.fillRect(x + pixel * 6, y + pixel * 8, pixel * 4, pixel * 4);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(x + pixel * 2, y + pixel * 4, pixel * 3, pixel * 3);
      ctx.fillRect(x + pixel * 11, y + pixel * 4, pixel * 3, pixel * 3);
    } else if (sprite.includes('libro')) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + pixel * 3, y + pixel * 7, pixel * 10, pixel * 7);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x + pixel * 4, y + pixel * 4, pixel * 8, pixel * 5);
      ctx.fillStyle = '#52525b';
      ctx.fillRect(x + pixel * 5, y + pixel * 5.5, pixel * 6, pixel * 1);
      ctx.fillRect(x + pixel * 5, y + pixel * 7, pixel * 4, pixel * 1);
    } else if (sprite.includes('cama') || type === 'shrine') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + pixel * 2, y + pixel * 3, pixel * 12, pixel * 11);
      ctx.fillStyle = '#e4e4e7';
      ctx.fillRect(x + pixel * 3.5, y + pixel * 4, pixel * 9, pixel * 3.5);
      ctx.fillStyle = '#52525b';
      ctx.fillRect(x + pixel * 3.5, y + pixel * 7.5, pixel * 9, pixel * 5.5);
    } else {
      const bob = Math.sin(stepFrame * 0.8) * pixel * 1.5;
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(x + pixel * 8, y + pixel * 9 + bob, pixel * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + pixel * 6, y + pixel * 8 + bob, pixel * 1.5, pixel);
      ctx.fillRect(x + pixel * 9, y + pixel * 8 + bob, pixel * 1.5, pixel);
    }

    if (type === 'wild_encounter') {
      const bobIcon = Math.sin(stepFrame * 0.35) * pixel;
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + size / 2 - pixel * 0.75, y - pixel * 2 + bobIcon, pixel * 1.5, pixel * 2.5);
      ctx.fillRect(x + size / 2 - pixel * 0.75, y + pixel * 1.2 + bobIcon, pixel * 1.5, pixel * 1.2);
    }
  }
}
