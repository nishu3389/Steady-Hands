// Canvas-based Balance Card & Certificate Generator for Steady Hands
import { GameResult, UserProfile } from '../types';

export interface GeneratedCardData {
  dataUrl: string;
  blob: Blob | null;
  file: File | null;
}

export async function generateSteadinessCard(
  result: GameResult,
  profile?: UserProfile
): Promise<GeneratedCardData> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    // High-resolution social card (4:5 ratio, 1080 x 1350)
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve({ dataUrl: '', blob: null, file: null });
      return;
    }

    const steadiness = Math.round(result.steadinessScore ?? result.finalScore ?? 85);
    const breakdown = result.steadinessBreakdown || {
      stillnessScore: Math.round(result.waterRemaining),
      rhythmScore: 85,
      postureScore: Math.round(Math.max(50, result.waterRemaining * 0.95)),
      timeInSafeZoneSec: Math.round(result.totalDuration * 0.85),
      totalTimeSec: Math.round(result.totalDuration),
      safeZoneRatio: 0.85,
      gradeTitle: steadiness >= 90 ? 'Flow State' : steadiness >= 75 ? 'Mindful Balance' : 'Grounded Focus',
      gradeIcon: steadiness >= 90 ? '🪷' : steadiness >= 75 ? '🌊' : '🍃',
      feedback: 'Strong postural equilibrium with gentle, controlled strides.',
    };

    const playerName = profile?.name && profile.name.trim() !== 'Guest Player' ? profile.name : 'Steady Walker';
    const steps = result.stepsTaken ?? 0;
    const feet = result.distanceFeet ?? Math.round(steps * 1.804 * 10) / 10;
    const waterPct = Math.max(0, Math.min(100, Math.round(result.waterRemaining)));
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // 1. Background Gradient (Deep Nordic / Zen Slate)
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
    bgGrad.addColorStop(0, '#0a1017');
    bgGrad.addColorStop(0.4, '#121b26');
    bgGrad.addColorStop(1, '#080d13');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // 2. Decorative Zen Waves / Ambient Glow
    const glowGrad = ctx.createRadialGradient(540, 480, 50, 540, 480, 480);
    glowGrad.addColorStop(0, 'rgba(47, 143, 224, 0.18)');
    glowGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.05)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(540, 480, 480, 0, Math.PI * 2);
    ctx.fill();

    // Wave ripples
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    for (let r = 240; r <= 420; r += 60) {
      ctx.beginPath();
      ctx.arc(540, 480, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Outer Card Border
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(40, 40, 1000, 1270);

    // Corner accents
    ctx.fillStyle = '#38bdf8';
    const cornerSize = 16;
    ctx.fillRect(36, 36, cornerSize, 4);
    ctx.fillRect(36, 36, 4, cornerSize);
    ctx.fillRect(1040 - cornerSize, 36, cornerSize, 4);
    ctx.fillRect(1040, 36, 4, cornerSize);
    ctx.fillRect(36, 1310, cornerSize, 4);
    ctx.fillRect(36, 1310 - cornerSize + 4, 4, cornerSize);
    ctx.fillRect(1040 - cornerSize, 1310, cornerSize, 4);
    ctx.fillRect(1040, 1310 - cornerSize + 4, 4, cornerSize);

    // 3. Header: App Name & Official Seal
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9dcaff';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '5px';
    ctx.fillText('STEADY HANDS • MINDFUL WALKING', 540, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 42px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('OFFICIAL STEADINESS RECORD', 540, 165);

    // Subheader Line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(280, 195);
    ctx.lineTo(800, 195);
    ctx.stroke();

    // 4. Player Name & Date Pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.roundRect(320, 220, 440, 52, 26);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${playerName}  •  ${dateStr}`, 540, 254);

    // 5. Hero Steadiness Gauge in Center
    const gaugeCenterX = 540;
    const gaugeCenterY = 500;
    const gaugeRadius = 160;

    // Gauge track
    ctx.lineWidth = 20;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.arc(gaugeCenterX, gaugeCenterY, gaugeRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Gauge progress arc
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * steadiness) / 100;
    const arcGrad = ctx.createLinearGradient(380, 340, 700, 660);
    arcGrad.addColorStop(0, '#38bdf8');
    arcGrad.addColorStop(0.5, '#0ea5e9');
    arcGrad.addColorStop(1, '#10b981');
    ctx.strokeStyle = arcGrad;
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(gaugeCenterX, gaugeCenterY, gaugeRadius, startAngle, endAngle);
    ctx.stroke();

    // Inside Gauge: Score & Grade
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 110px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${steadiness}%`, 540, 510);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('STEADINESS INDEX', 540, 555);

    // Grade pill under gauge
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.beginPath();
    ctx.roundRect(380, 690, 320, 54, 27);
    ctx.fill();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${breakdown.gradeIcon} ${breakdown.gradeTitle}`, 540, 726);

    // 6. Detailed 4-Metric Grid (Boxes)
    const metrics = [
      { label: 'WATER SAVED', val: `${waterPct}%`, sub: 'Fluid Calmness', color: '#38bdf8' },
      { label: 'GAIT RHYTHM', val: `${breakdown.rhythmScore}%`, sub: 'Cadence Pace', color: '#10b981' },
      { label: 'POSTURE TILT', val: `${breakdown.postureScore}%`, sub: `${breakdown.timeInSafeZoneSec}s Centered`, color: '#818cf8' },
      { label: 'PATH WALKED', val: `${feet} ft`, sub: `${steps} Mindful Steps`, color: '#f59e0b' },
    ];

    const boxW = 210;
    const boxH = 140;
    const boxGap = 26;
    const startX = (1080 - (4 * boxW + 3 * boxGap)) / 2;
    const boxY = 780;

    metrics.forEach((m, idx) => {
      const bx = startX + idx * (boxW + boxGap);
      // Box background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.roundRect(bx, boxY, boxW, boxH, 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top label
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText(m.label, bx + boxW / 2, boxY + 34);

      // Value
      ctx.fillStyle = m.color;
      ctx.font = '900 36px system-ui, -apple-system, sans-serif';
      ctx.fillText(m.val, bx + boxW / 2, boxY + 80);

      // Subtext
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillText(m.sub, bx + boxW / 2, boxY + 114);
    });

    // 7. Mindful Takeaway / Challenge Quote
    ctx.fillStyle = 'rgba(47, 143, 224, 0.08)';
    ctx.beginPath();
    ctx.roundRect(90, 960, 900, 110, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.stroke();

    ctx.fillStyle = '#e0f2fe';
    ctx.font = 'italic 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('“Hold still. Breathe deep. Walk without spilling a single drop.”', 540, 1010);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillText('Can your friends balance better? Challenge them on WhatsApp!', 540, 1045);

    // 8. Bottom Brand Bar & URL
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('steadyhands.app', 540, 1140);

    ctx.fillStyle = '#64748b';
    ctx.font = '18px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('PHYSICAL BODY STEADINESS & POSTURE EQUILIBRIUM TRAINER', 540, 1175);

    // Watermark symbol
    ctx.font = '32px system-ui, -apple-system, sans-serif';
    ctx.fillText('🥣💧', 540, 1225);

    // 9. Export to DataURL and Blob/File
    const dataUrl = canvas.toDataURL('image/png');
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'steady-hands-card.png', { type: 'image/png' });
        resolve({ dataUrl, blob, file });
      } else {
        resolve({ dataUrl, blob: null, file: null });
      }
    }, 'image/png');
  });
}
