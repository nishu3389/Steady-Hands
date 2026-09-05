import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  Sparkles,
  Compass,
  Footprints,
  Droplets,
  Timer,
  AlertTriangle,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { soundService } from '../services/audio';

interface InteractiveTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  soundEnabled: boolean;
}

// ----------------------------------------------------
// ANIMATED TUTORIAL VISUALS PER STEP:
// Step 0: User stands still holding phone steady (phone clearly visible & flat)
// Step 1: User starts walking steadily (gait motion, moving ground, steady arms)
// Step 2: User shakes hands ("DON'T DO THAT" + water spill) -> then steadies hands (water full)
// Step 3: User jumps with victory (feet in the air, arms raised, confetti & trophy)
// ----------------------------------------------------
const TutorialAnimatedVisual: React.FC<{ step: number }> = ({ step }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let animId: number;
    let isRunning = true;
    const startTime = performance.now();

    const loop = (now: number) => {
      if (!isRunning) return;
      setPhase((now - startTime) / 1000);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [step]);

  // Common ground level
  const groundY = 204;

  // ----------------------------------------------------
  // STEP 0: STAND STILL & HOLD PHONE STEADY (CALIBRATION)
  // ----------------------------------------------------
  if (step === 0) {
    const breath = Math.sin(phase * 2.2) * 1.5;
    const hipX = 86;
    const hipY = 126 - breath * 0.4;
    const neckX = hipX + 6;
    const neckY = hipY - 54;
    const headX = hipX + 9;
    const headY = hipY - 70;
    const shoulderX = hipX + 8;
    const shoulderY = hipY - 46;

    // Hands and Phone (prominent, clearly visible)
    const phoneX = 124;
    const phoneY = 104;
    const phoneW = 54;
    const phoneH = 8;
    const bowlX = 151;
    const bowlY = 104;

    // Dedicated Calibration Indicator Dial (teaches user to center the dot)
    const dialX = 230;
    const dialY = 104;
    const dialR = 27;
    const dialCircumference = 2 * Math.PI * dialR;

    // 3.6-second cyclical loop: off-center dot -> glides smoothly into center -> locks in green
    const calibCycle = phase % 3.6;
    const isCentered = calibCycle >= 1.2 && calibCycle <= 3.3;
    const glideT = Math.min(1, Math.max(0, calibCycle / 1.1));
    const easeT =
      glideT < 0.5 ? 4 * glideT * glideT * glideT : 1 - Math.pow(-2 * glideT + 2, 3) / 2;
    const dotOffsetX = (1 - easeT) * 14;
    const dotOffsetY = (1 - easeT) * -11;
    const progress = isCentered ? Math.min(1, (calibCycle - 1.2) / 1.6) : easeT * 0.15;
    const strokeOffset = dialCircumference * (1 - progress);

    return (
      <div className="w-full flex flex-col items-center justify-center relative py-1 select-none">
        {/* Step Badge */}
        <div className="absolute top-2.5 right-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold shadow-sm">
          <Compass className="w-3.5 h-3.5 text-emerald-500" />
          <span>Center to Calibrate</span>
        </div>

        <svg
          viewBox="0 0 290 220"
          className="w-full max-w-[300px] h-[220px] sm:h-[240px] overflow-visible drop-shadow-sm"
        >
          <defs>
            <linearGradient id="phoneGlowS0" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#005f9e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="waterGradS0" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Ground Line */}
          <line
            x1="20"
            y1={groundY}
            x2="270"
            y2={groundY}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="2"
          />

          {/* Standing legs (feet firmly on ground) */}
          <g className="text-[#334155] dark:text-[#64748b]">
            {/* Back Leg */}
            <line x1={hipX + 6} y1={hipY} x2={hipX + 8} y2={164} stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            <line x1={hipX + 8} y1={164} x2={hipX + 10} y2={groundY} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d={`M ${hipX + 5} ${groundY} L ${hipX + 22} ${groundY} Q ${hipX + 23} ${groundY - 4} ${hipX + 10} ${groundY - 4} Z`} fill="#0f172a" />

            {/* Front Leg */}
            <line x1={hipX - 2} y1={hipY} x2={hipX - 2} y2={164} stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            <line x1={hipX - 2} y1={164} x2={hipX - 2} y2={groundY} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d={`M ${hipX - 7} ${groundY} L ${hipX + 12} ${groundY} Q ${hipX + 13} ${groundY - 4} ${hipX - 1} ${groundY - 4} Z`} fill="#0284c7" />
          </g>

          {/* Torso with subtle breath */}
          <path
            d={`M ${hipX} ${hipY} Q ${hipX + 3} ${hipY - 28} ${neckX} ${neckY}`}
            fill="none"
            stroke="currentColor"
            className="text-[#1e293b] dark:text-[#94a3b8]"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Head looking calmly at the phone */}
          <circle cx={headX} cy={headY} r="13" fill="currentColor" className="text-[#1e293b] dark:text-[#cbd5e1]" />
          <line x1={headX + 5} y1={headY + 1} x2={headX + 10} y2={headY + 3} stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

          {/* Both arms extending forward holding the phone */}
          {/* Back arm */}
          <path
            d={`M ${shoulderX - 2} ${shoulderY - 2} Q ${hipX + 22} ${hipY - 14} ${phoneX + 14} ${phoneY + 4}`}
            fill="none"
            stroke="currentColor"
            className="text-[#475569] dark:text-[#64748b]"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Front arm */}
          <path
            d={`M ${shoulderX} ${shoulderY} Q ${hipX + 26} ${hipY - 12} ${phoneX + phoneW - 14} ${phoneY + 4}`}
            fill="none"
            stroke="currentColor"
            className="text-[#1e293b] dark:text-[#cbd5e1]"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* PHONE BODY (Clearly visible & held flat) */}
          <g>
            <rect
              x={phoneX}
              y={phoneY}
              width={phoneW}
              height={phoneH}
              rx="3.5"
              fill="#1e293b"
              stroke="#38bdf8"
              strokeWidth="1.4"
            />
            <rect x={phoneX + 3} y={phoneY + 1.2} width={phoneW - 6} height={2} rx="1" fill="#7dd3fc" />

            {/* Hands holding both phone edges */}
            <circle cx={phoneX + 4} cy={phoneY + 4} r="3.6" fill="#0284c7" />
            <circle cx={phoneX + phoneW - 4} cy={phoneY + 4} r="3.6" fill="#0284c7" />
          </g>

          {/* WATER BOWL ON PHONE */}
          <g>
            <path
              d={`M ${bowlX - 13} ${bowlY - 1} Q ${bowlX} ${bowlY + 13} ${bowlX + 13} ${bowlY - 1} Z`}
              fill="url(#waterGradS0)"
            />
            <ellipse cx={bowlX} cy={bowlY - 1} rx="13" ry="2.6" fill="#7dd3fc" opacity="0.9" />
            <path
              d={`M ${bowlX - 14} ${bowlY - 2} C ${bowlX - 14} ${bowlY + 15} ${bowlX + 14} ${bowlY + 15} ${bowlX + 14} ${bowlY - 2}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>

          {/* Subtle guide dash from phone to calibration indicator */}
          <path
            d={`M ${phoneX + phoneW + 4} ${phoneY + 4} C ${phoneX + phoneW + 18} ${phoneY + 4} ${dialX - dialR - 12} ${dialY} ${dialX - dialR - 4} ${dialY}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.6"
          />
          <polygon
            points={`${dialX - dialR - 4},${dialY} ${dialX - dialR - 8},${dialY - 3} ${dialX - dialR - 8},${dialY + 3}`}
            fill="#94a3b8"
            opacity="0.7"
          />

          {/* ==================================================== */}
          {/* CALIBRATION / INDICATOR CIRCLE (Teaches Centering)   */}
          {/* ==================================================== */}
          <g>
            {/* Dial Outer Container & Backdrop */}
            <circle
              cx={dialX}
              cy={dialY}
              r={dialR + 4}
              className="fill-slate-100 dark:fill-slate-800"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.1"
            />

            {/* Circular Progress Arc Track */}
            <circle
              cx={dialX}
              cy={dialY}
              r={dialR}
              fill="none"
              stroke="currentColor"
              className="text-slate-300 dark:text-slate-700"
              strokeWidth="3.2"
            />

            {/* Active Calibration Progress Arc */}
            <circle
              cx={dialX}
              cy={dialY}
              r={dialR}
              fill="none"
              stroke={isCentered ? '#10b981' : '#0284c7'}
              strokeWidth="3.8"
              strokeLinecap="round"
              strokeDasharray={dialCircumference}
              strokeDashoffset={strokeOffset}
              transform={`rotate(-90 ${dialX} ${dialY})`}
              style={{ transition: 'stroke 0.25s ease' }}
            />

            {/* Crosshairs (+) */}
            <line
              x1={dialX - dialR + 5}
              y1={dialY}
              x2={dialX + dialR - 5}
              y2={dialY}
              stroke="#94a3b8"
              strokeWidth="0.75"
              strokeDasharray="2 2"
              opacity="0.5"
            />
            <line
              x1={dialX}
              y1={dialY - dialR + 5}
              x2={dialX}
              y2={dialY + dialR - 5}
              stroke="#94a3b8"
              strokeWidth="0.75"
              strokeDasharray="2 2"
              opacity="0.5"
            />

            {/* Center Safe Target Ring */}
            <circle
              cx={dialX}
              cy={dialY}
              r="9.5"
              fill={isCentered ? '#10b98124' : '#0284c714'}
              stroke={isCentered ? '#10b981' : '#0284c7'}
              strokeWidth={isCentered ? '1.8' : '1.2'}
            />

            {/* Inward motion arrow path when off-center to guide user */}
            {!isCentered && (
              <g opacity="0.6">
                <path
                  d={`M ${dialX + 12} ${dialY - 9} Q ${dialX + 5} ${dialY - 3} ${dialX + 2} ${dialY - 1}`}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              </g>
            )}

            {/* Expanding pulse ripple when centered */}
            {isCentered && (
              <circle
                cx={dialX}
                cy={dialY}
                r="13"
                fill="none"
                stroke="#10b981"
                strokeWidth="1.2"
                className="animate-ping opacity-40"
              />
            )}

            {/* Dynamic Position Dot */}
            <circle
              cx={dialX + dotOffsetX}
              cy={dialY + dotOffsetY}
              r="4.2"
              fill={isCentered ? '#10b981' : '#0284c7'}
              stroke="#ffffff"
              strokeWidth="1.2"
            />

            {/* Teaching Text Label Under Indicator */}
            <text
              x={dialX}
              y={dialY + dialR + 15}
              textAnchor="middle"
              className={`text-[9.5px] font-black tracking-wider ${
                isCentered
                  ? 'fill-emerald-600 dark:fill-emerald-400'
                  : 'fill-[#005f9e] dark:fill-[#9dcaff]'
              }`}
            >
              {isCentered ? '● CENTERED (0.0°)' : 'CENTER THE DOT'}
            </text>
          </g>
        </svg>
      </div>
    );
  }

  // ----------------------------------------------------
  // STEP 1: USER STARTED WALKING
  // ----------------------------------------------------
  if (step === 1) {
    const cadence = 3.6;
    const bobY = Math.abs(Math.sin(phase * cadence)) * 3.8;
    const stride1 = Math.sin(phase * cadence);
    const stride2 = Math.sin(phase * cadence + Math.PI);

    const hipX = 112;
    const hipY = 126 + bobY;

    // Leg 1
    const leg1Angle = stride1 * 0.42;
    const knee1Bend = Math.max(0, -stride1 * 0.62);
    const knee1X = hipX + Math.sin(leg1Angle) * 36;
    const knee1Y = hipY + Math.cos(leg1Angle) * 36;
    const foot1Angle = leg1Angle + knee1Bend;
    const foot1X = knee1X + Math.sin(foot1Angle) * 36;
    const foot1Y = Math.min(groundY, knee1Y + Math.cos(foot1Angle) * 36);

    // Leg 2
    const leg2Angle = stride2 * 0.42;
    const knee2Bend = Math.max(0, -stride2 * 0.62);
    const knee2X = hipX + Math.sin(leg2Angle) * 36;
    const knee2Y = hipY + Math.cos(leg2Angle) * 36;
    const foot2Angle = leg2Angle + knee2Bend;
    const foot2X = knee2X + Math.sin(foot2Angle) * 36;
    const foot2Y = Math.min(groundY, knee2Y + Math.cos(foot2Angle) * 36);

    const neckX = hipX + 7;
    const neckY = hipY - 54;
    const headX = hipX + 11;
    const headY = hipY - 70;
    const shoulderX = hipX + 8;
    const shoulderY = hipY - 46;

    // Phone held steadily at fixed height despite walking bobbing
    const phoneX = 162;
    const phoneY = 108;
    const phoneW = 56;
    const phoneH = 8;
    const bowlX = 190;
    const bowlY = 108;

    const groundOffset = (phase * 40) % 24;
    const rippleProgress = ((phase * cadence) % Math.PI) / Math.PI;
    const rippleRadius = rippleProgress * 24;
    const rippleOpacity = Math.max(0, 1 - rippleProgress);

    return (
      <div className="w-full flex flex-col items-center justify-center relative py-1 select-none">
        {/* Step Badge */}
        <div className="absolute top-1 right-2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-[11px] font-extrabold shadow-sm">
          <Footprints className="w-3.5 h-3.5 animate-bounce text-sky-500" />
          <span>Walking Active • 54 spm</span>
        </div>

        <svg
          viewBox="0 0 290 220"
          className="w-full max-w-[300px] h-[220px] sm:h-[240px] overflow-visible drop-shadow-sm"
        >
          {/* Moving Ground Line */}
          <line
            x1="20"
            y1={groundY}
            x2="270"
            y2={groundY}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-700"
            strokeWidth="2"
            strokeDasharray="8 8"
            strokeDashoffset={groundOffset}
          />

          {/* Stride contact ripple */}
          <ellipse
            cx={stride1 > 0 ? foot1X : foot2X}
            cy={groundY}
            rx={rippleRadius}
            ry={rippleRadius * 0.3}
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.5"
            opacity={rippleOpacity}
          />

          {/* Back Leg */}
          <g className="text-[#334155] dark:text-[#64748b]">
            <line x1={hipX} y1={hipY} x2={knee2X} y2={knee2Y} stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            <line x1={knee2X} y1={knee2Y} x2={foot2X} y2={foot2Y} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d={`M ${foot2X - 5} ${foot2Y} L ${foot2X + 12} ${foot2Y} Q ${foot2X + 13} ${foot2Y - 4} ${foot2X + 2} ${foot2Y - 4} Z`} fill="#0f172a" />
          </g>

          {/* Torso */}
          <path
            d={`M ${hipX} ${hipY} Q ${hipX + 2} ${hipY - 28} ${neckX} ${neckY}`}
            fill="none"
            stroke="currentColor"
            className="text-[#1e293b] dark:text-[#94a3b8]"
            strokeWidth="15"
            strokeLinecap="round"
          />

          {/* Head looking forward and down */}
          <circle cx={headX} cy={headY} r="13" fill="currentColor" className="text-[#1e293b] dark:text-[#cbd5e1]" />
          <line x1={headX + 5} y1={headY + 1} x2={headX + 9} y2={headY + 3} stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

          {/* Front Leg */}
          <g className="text-[#1e293b] dark:text-[#94a3b8]">
            <line x1={hipX} y1={hipY} x2={knee1X} y2={knee1Y} stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            <line x1={knee1X} y1={knee1Y} x2={foot1X} y2={foot1Y} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d={`M ${foot1X - 5} ${foot1Y} L ${foot1X + 13} ${foot1Y} Q ${foot1X + 14} ${foot1Y - 4} ${foot1X + 2} ${foot1Y - 4} Z`} fill="#0284c7" />
          </g>

          {/* Back arm */}
          <path
            d={`M ${shoulderX - 2} ${shoulderY - 2} Q ${hipX + 24} ${hipY - 16} ${phoneX + 14} ${phoneY + 4}`}
            fill="none"
            stroke="currentColor"
            className="text-[#475569] dark:text-[#64748b]"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Front arm */}
          <path
            d={`M ${shoulderX} ${shoulderY} Q ${hipX + 28} ${hipY - 14} ${phoneX + phoneW - 14} ${phoneY + 4}`}
            fill="none"
            stroke="currentColor"
            className="text-[#1e293b] dark:text-[#cbd5e1]"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Phone */}
          <rect x={phoneX} y={phoneY} width={phoneW} height={phoneH} rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.2" />
          <rect x={phoneX + 4} y={phoneY + 1} width={phoneW - 8} height={2} rx="1" fill="#7dd3fc" />
          <circle cx={phoneX + 5} cy={phoneY + 4} r="3.5" fill="#0284c7" />
          <circle cx={phoneX + phoneW - 5} cy={phoneY + 4} r="3.5" fill="#0284c7" />

          {/* Bowl & Water */}
          <path d={`M ${bowlX - 14} ${bowlY - 1} Q ${bowlX} ${bowlY + 14} ${bowlX + 14} ${bowlY - 1} Z`} fill="#0284c7" />
          <path d={`M ${bowlX - 14} ${bowlY - 1} Q ${bowlX} ${bowlY - 2 + Math.sin(phase * 4.5) * 1.2} ${bowlX + 14} ${bowlY - 1} Z`} fill="#7dd3fc" />
          <path d={`M ${bowlX - 15} ${bowlY - 2} C ${bowlX - 15} ${bowlY + 16} ${bowlX + 15} ${bowlY + 16} ${bowlX + 15} ${bowlY - 2}`} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

          {/* Speed / Stride lines trailing user */}
          <line x1={hipX - 25} y1={hipY - 12} x2={hipX - 10} y2={hipY - 12} stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1={hipX - 35} y1={hipY + 5} x2={hipX - 14} y2={hipY + 5} stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        </svg>
      </div>
    );
  }

  // ----------------------------------------------------------------------------------
  // STEP 2: USER SHAKES HANDS -> "DON'T DO THAT" + SPILL -> THEN STEADIES HANDS & FULL WATER
  // ----------------------------------------------------------------------------------
  if (step === 2) {
    // 6-second total cycle:
    // 0.0s - 3.0s: TILTED / SPILLING ("DON'T DO THAT!")
    // 3.0s - 6.0s: STEADY / FLAT / FILLED ("DO THIS: KEEP STEADY")
    const cycleTime = phase % 6.0;
    const isShaking = cycleTime < 3.0;

    // Gentle, controlled tilt and subtle wobble (toned down significantly)
    const tiltDeg = isShaking ? Math.sin(phase * 4.2) * 6.5 : 0;
    const shakeY = isShaking ? Math.sin(phase * 4.2) * 1.5 : 0;

    const hipX = 110;
    const hipY = 126;
    const neckX = hipX + 6;
    const neckY = hipY - 54;
    const headX = hipX + 9;
    const headY = hipY - 70;
    const shoulderX = hipX + 8;
    const shoulderY = hipY - 46;

    const phoneX = 160;
    const phoneY = 106 + shakeY;
    const phoneW = 60;
    const phoneH = 8;
    const bowlX = 190;
    const bowlY = 106 + shakeY;

    return (
      <div className="w-full flex flex-col items-center justify-center relative py-1 select-none">
        {/* Dynamic Contextual Alert Banner */}
        <div className="absolute top-2.5 right-3 z-20">
          {isShaking ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] font-extrabold shadow-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>DON&apos;T TILT • WATER SPILLS</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>DO THIS • KEEP STEADY</span>
            </div>
          )}
        </div>

        <svg
          viewBox="0 0 290 220"
          className="w-full max-w-[300px] h-[220px] sm:h-[240px] overflow-visible drop-shadow-sm"
        >
          {/* Ground Line */}
          <line x1="20" y1={groundY} x2="270" y2={groundY} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="2" />

          {/* Standing legs */}
          <g className="text-[#334155] dark:text-[#64748b]">
            <line x1={hipX + 5} y1={hipY} x2={hipX + 6} y2={164} stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            <line x1={hipX + 6} y1={164} x2={hipX + 8} y2={groundY} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d={`M ${hipX + 4} ${groundY} L ${hipX + 20} ${groundY} Q ${hipX + 21} ${groundY - 4} ${hipX + 9} ${groundY - 4} Z`} fill="#0f172a" />

            <line x1={hipX - 3} y1={hipY} x2={hipX - 3} y2={164} stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            <line x1={hipX - 3} y1={164} x2={hipX - 3} y2={groundY} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            <path d={`M ${hipX - 8} ${groundY} L ${hipX + 11} ${groundY} Q ${hipX + 12} ${groundY - 4} ${hipX - 2} ${groundY - 4} Z`} fill="#0284c7" />
          </g>

          {/* Torso */}
          <path
            d={`M ${hipX} ${hipY} Q ${hipX + 3} ${hipY - 28} ${neckX} ${neckY}`}
            fill="none"
            stroke="currentColor"
            className="text-[#1e293b] dark:text-[#94a3b8]"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Head */}
          <circle cx={headX} cy={headY} r="13" fill="currentColor" className="text-[#1e293b] dark:text-[#cbd5e1]" />
          <line x1={headX + 5} y1={headY + 1} x2={headX + 9} y2={headY + 3} stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

          {/* Arms holding the phone with tilt */}
          <path
            d={`M ${shoulderX - 2} ${shoulderY - 2} Q ${hipX + 26} ${hipY - 12 + shakeY} ${phoneX + 14} ${phoneY + 4}`}
            fill="none"
            stroke="currentColor"
            className="text-[#475569] dark:text-[#64748b]"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d={`M ${shoulderX} ${shoulderY} Q ${hipX + 28} ${hipY - 10 + shakeY} ${phoneX + phoneW - 14} ${phoneY + 4}`}
            fill="none"
            stroke="currentColor"
            className="text-[#1e293b] dark:text-[#cbd5e1]"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Phone & Bowl Group (Rotates and Tilts gently) */}
          <g transform={`rotate(${tiltDeg}, ${bowlX}, ${bowlY})`}>
            {/* Phone Body */}
            <rect
              x={phoneX}
              y={phoneY}
              width={phoneW}
              height={phoneH}
              rx="3"
              fill="#1e293b"
              stroke={isShaking ? '#ef4444' : '#10b981'}
              strokeWidth={isShaking ? '1.8' : '1.5'}
            />
            {/* Hands */}
            <circle cx={phoneX + 5} cy={phoneY + 4} r="3.8" fill="#0284c7" />
            <circle cx={phoneX + phoneW - 5} cy={phoneY + 4} r="3.8" fill="#0284c7" />

            {/* BOWL & WATER: */}
            {isShaking ? (
              // Slight tilted water spill state
              <g>
                <path
                  d={`M ${bowlX - 14} ${bowlY + 3} Q ${bowlX} ${bowlY + 15} ${bowlX + 14} ${bowlY + 1} Z`}
                  fill="#0284c7"
                  opacity="0.85"
                />
                <ellipse cx={bowlX + 2} cy={bowlY + 1} rx="12" ry="2.5" fill="#38bdf8" />
              </g>
            ) : (
              // Steady State: Full calm water
              <g>
                <path
                  d={`M ${bowlX - 14} ${bowlY - 1} Q ${bowlX} ${bowlY + 15} ${bowlX + 14} ${bowlY - 1} Z`}
                  fill="#0284c7"
                />
                <ellipse cx={bowlX} cy={bowlY - 1} rx="14" ry="3" fill="#7dd3fc" />
              </g>
            )}

            {/* Bowl Rim */}
            <path
              d={`M ${bowlX - 15} ${bowlY - 2} C ${bowlX - 15} ${bowlY + 16} ${bowlX + 15} ${bowlY + 16} ${bowlX + 15} ${bowlY - 2}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>

          {/* GENTLE WATER SPILL DROPLETS (Visible during tilt) */}
          {isShaking && (
            <g>
              <ellipse
                cx={bowlX + 18}
                cy={bowlY + 2 + ((phase * 1.5) % 1) * 16}
                rx="2"
                ry="2.6"
                fill="#38bdf8"
                opacity={Math.max(0, 1 - ((phase * 1.5) % 1))}
              />
              <circle
                cx={bowlX + 22}
                cy={bowlY + 6 + (((phase + 0.45) * 1.5) % 1) * 14}
                r="1.8"
                fill="#0284c7"
                opacity={Math.max(0, 1 - (((phase + 0.45) * 1.5) % 1))}
              />

              {/* Red "DON'T DO THAT" X Mark */}
              <g transform={`translate(${bowlX - 2}, ${bowlY - 24})`}>
                <circle cx="0" cy="0" r="11" fill="#ef4444" opacity="0.95" />
                <line x1="-4.5" y1="-4.5" x2="4.5" y2="4.5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
                <line x1="4.5" y1="-4.5" x2="-4.5" y2="4.5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
              </g>
            </g>
          )}

          {/* STEADY STATE GREEN BADGE CHECK */}
          {!isShaking && (
            <g transform={`translate(${bowlX - 2}, ${bowlY - 24})`}>
              <circle cx="0" cy="0" r="11" fill="#10b981" opacity="0.95" />
              <path d="M -4 0 L -1 3.5 L 4.5 -2.5" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
        </svg>
      </div>
    );
  }

  // ----------------------------------------------------
  // STEP 3: USER JUMP WITH VICTORY!
  // ----------------------------------------------------
  // Realistic jump curve: leaps high into the air, arms up in victory
  const jumpCycle = (phase * 2.2) % Math.PI;
  const jumpHeight = Math.sin(jumpCycle) * 38; // Leaps 38px up!
  const isAirborne = jumpHeight > 6;

  const hipX = 140;
  const hipY = 124 - jumpHeight;
  const neckX = hipX;
  const neckY = hipY - 54;
  const headX = hipX;
  const headY = hipY - 70;
  const shoulderX = hipX;
  const shoulderY = hipY - 48;

  return (
    <div className="w-full flex flex-col items-center justify-center relative py-1 select-none">
      {/* Victory Badge */}
      <div className="absolute top-1 right-2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 text-[11px] font-black shadow-sm">
        <Trophy className="w-3.5 h-3.5 text-amber-500" />
        <span>VICTORY! 50%+ WATER SAVED</span>
      </div>

      <svg
        viewBox="0 0 290 220"
        className="w-full max-w-[300px] h-[220px] sm:h-[240px] overflow-visible drop-shadow-sm"
      >
        <defs>
          {/* Confetti colors */}
          <radialGradient id="trophyGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground Line */}
        <line x1="20" y1={groundY} x2="270" y2={groundY} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="2" />

        {/* Ground shadow (shrinks when jumping high) */}
        <ellipse
          cx={hipX}
          cy={groundY + 1}
          rx={Math.max(12, 34 - jumpHeight * 0.5)}
          ry={Math.max(3, 8 - jumpHeight * 0.12)}
          fill="#0f172a"
          opacity={Math.max(0.1, 0.45 - jumpHeight * 0.009)}
        />

        {/* CONFETTI BURSTING AROUND USER */}
        <g>
          {/* Left confetti */}
          <rect x="50" y={40 + Math.sin(phase * 4) * 8} width="6" height="6" rx="1.5" fill="#f59e0b" transform="rotate(25 53 43)" />
          <circle cx="75" cy={70 + Math.cos(phase * 3) * 10} r="3" fill="#38bdf8" />
          <rect x="65" y={110 + Math.sin(phase * 5) * 8} width="7" height="4" rx="1" fill="#10b981" transform="rotate(-30 68 112)" />
          <circle cx="85" cy={140} r="3.5" fill="#ec4899" />

          {/* Right confetti */}
          <rect x="220" y={45 + Math.cos(phase * 4) * 8} width="6" height="6" rx="1.5" fill="#ec4899" transform="rotate(45 223 48)" />
          <circle cx="210" cy={80 + Math.sin(phase * 3) * 10} r="3" fill="#f59e0b" />
          <rect x="225" y={120 + Math.cos(phase * 5) * 8} width="7" height="4" rx="1" fill="#0284c7" transform="rotate(15 228 122)" />
          <circle cx="205" cy={150} r="3" fill="#10b981" />
        </g>

        {/* FLOATING GOLDEN TROPHY / VICTORY STARS */}
        <g transform={`translate(${hipX}, ${headY - 34})`}>
          <ellipse cx="0" cy="0" rx="26" ry="16" fill="url(#trophyGlow)" />
          <Sparkles className="w-8 h-8 text-amber-400 -translate-x-4 -translate-y-4 animate-spin" />
        </g>

        {/* JUMPING CHARACTER: */}
        {/* Legs bent in joy while airborne */}
        {isAirborne ? (
          <g className="text-[#1e293b] dark:text-[#94a3b8]">
            {/* Left Leg bent up */}
            <path
              d={`M ${hipX - 6} ${hipY} Q ${hipX - 22} ${hipY + 28} ${hipX - 16} ${hipY + 52}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* Left shoe */}
            <path d={`M ${hipX - 22} ${hipY + 52} L ${hipX - 6} ${hipY + 52} Q ${hipX - 5} ${hipY + 48} ${hipX - 16} ${hipY + 48} Z`} fill="#0284c7" />

            {/* Right Leg bent up */}
            <path
              d={`M ${hipX + 6} ${hipY} Q ${hipX + 22} ${hipY + 28} ${hipX + 16} ${hipY + 52}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* Right shoe */}
            <path d={`M ${hipX + 6} ${hipY + 52} L ${hipX + 22} ${hipY + 52} Q ${hipX + 23} ${hipY + 48} ${hipX + 12} ${hipY + 48} Z`} fill="#0f172a" />
          </g>
        ) : (
          // Standing / landing legs
          <g className="text-[#1e293b] dark:text-[#94a3b8]">
            <line x1={hipX - 6} y1={hipY} x2={hipX - 10} y2={groundY} stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            <path d={`M ${hipX - 16} ${groundY} L ${hipX} ${groundY} Q ${hipX + 1} ${groundY - 4} ${hipX - 10} ${groundY - 4} Z`} fill="#0284c7" />
            <line x1={hipX + 6} y1={hipY} x2={hipX + 10} y2={groundY} stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
            <path d={`M ${hipX + 4} ${groundY} L ${hipX + 20} ${groundY} Q ${hipX + 21} ${groundY - 4} ${hipX + 10} ${groundY - 4} Z`} fill="#0f172a" />
          </g>
        )}

        {/* Upright triumphant torso */}
        <line
          x1={hipX}
          y1={hipY}
          x2={neckX}
          y2={neckY}
          stroke="currentColor"
          className="text-[#1e293b] dark:text-[#94a3b8]"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Head looking up in triumph */}
        <circle cx={headX} cy={headY} r="13" fill="currentColor" className="text-[#1e293b] dark:text-[#cbd5e1]" />
        {/* Smile on face */}
        <path d={`M ${headX - 4} ${headY + 2} Q ${headX} ${headY + 7} ${headX + 4} ${headY + 2}`} fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />

        {/* ARMS RAISED IN TRIUMPHANT V-SHAPE */}
        {/* Left Arm raised high */}
        <path
          d={`M ${shoulderX - 6} ${shoulderY} Q ${shoulderX - 24} ${shoulderY - 26} ${shoulderX - 32} ${shoulderY - 48}`}
          fill="none"
          stroke="currentColor"
          className="text-[#1e293b] dark:text-[#cbd5e1]"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Left fist */}
        <circle cx={shoulderX - 32} cy={shoulderY - 48} r="4.5" fill="#0284c7" />

        {/* Right Arm raised high holding phone proudly */}
        <path
          d={`M ${shoulderX + 6} ${shoulderY} Q ${shoulderX + 24} ${shoulderY - 26} ${shoulderX + 32} ${shoulderY - 48}`}
          fill="none"
          stroke="currentColor"
          className="text-[#1e293b] dark:text-[#cbd5e1]"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Right fist holding phone */}
        <circle cx={shoulderX + 32} cy={shoulderY - 48} r="4.5" fill="#0284c7" />

        {/* Mini phone & sparkling bowl raised high */}
        <rect
          x={shoulderX + 20}
          y={shoulderY - 58}
          width="26"
          height="5"
          rx="2"
          fill="#1e293b"
          stroke="#fbbf24"
          strokeWidth="1.2"
        />
        {/* Water bowl on phone */}
        <path
          d={`M ${shoulderX + 26} ${shoulderY - 62} Q ${shoulderX + 33} ${shoulderY - 54} ${shoulderX + 40} ${shoulderY - 62} Z`}
          fill="#0284c7"
        />
        <circle cx={shoulderX + 33} cy={shoulderY - 64} r="2.5" fill="#fbbf24" className="animate-ping" />
      </svg>
    </div>
  );
};

// ----------------------------------------------------
// MAIN INTERACTIVE TUTORIAL MODAL
// ----------------------------------------------------
export const InteractiveTutorialModal: React.FC<InteractiveTutorialModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  soundEnabled,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Reset to step 0 when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Punchy titles (maximum 2 lines) - no paragraphs
  const tutorialSteps = [
    {
      num: 1,
      tagline: 'Step 1 of 4 • Calibration',
      title: 'Stand Still & Center the Dot to Calibrate',
    },
    {
      num: 2,
      tagline: 'Step 2 of 4 • Mindful Stride',
      title: 'Start Walking Steadily to Keep the Timer Moving',
    },
    {
      num: 3,
      tagline: 'Step 3 of 4 • Spill Prevention',
      title: "Keep Hands Steady — Don't Shake or Spill Water",
    },
    {
      num: 4,
      tagline: 'Step 4 of 4 • Victory',
      title: 'Finish 60 Seconds with 50%+ Water to Win!',
    },
  ];

  const step = tutorialSteps[currentStep];

  const handleNext = () => {
    if (soundEnabled) soundService.playClick();
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (soundEnabled) soundService.playClick();
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    if (soundEnabled) soundService.playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f0f4f9] dark:bg-[#12161a] text-[#191c1e] dark:text-[#eff1f4] select-none overflow-y-auto overscroll-contain animate-fade-in">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between min-h-full px-5 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] gap-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between py-2 border-b border-black/[0.05] dark:border-white/[0.08]">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#005f9e] dark:text-[#9dcaff]">
              Interactive Guide
            </span>
            <span className="text-sm font-extrabold text-[#191c1e] dark:text-[#eff1f4]">
              How to Play
            </span>
          </div>

          {/* Progress Indicators & Skip Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {tutorialSteps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (soundEnabled) soundService.playClick();
                    setCurrentStep(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentStep === idx
                      ? 'w-7 bg-[#005f9e] dark:bg-[#9dcaff]'
                      : currentStep > idx
                      ? 'w-2.5 bg-emerald-500'
                      : 'w-2 bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleSkip}
              className="p-2 rounded-xl text-[#5a626f] dark:text-[#a0a8b4] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 font-bold text-xs"
              aria-label="Skip Tutorial"
            >
              <span>Skip</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Visual Card */}
        <div className="w-full bg-white dark:bg-[#191c1e] rounded-3xl p-4 card-raised border border-white/80 dark:border-white/5 flex items-center justify-center min-h-[250px] sm:min-h-[270px] shadow-sm relative overflow-hidden">
          <TutorialAnimatedVisual step={currentStep} />
        </div>

        {/* Punchy Step Title (Max 2 lines, no detailed descriptions) */}
        <div className="w-full flex flex-col gap-1 px-2">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#005f9e] dark:text-[#9dcaff]">
            {step.tagline}
          </span>
          <h2 className="text-2xl sm:text-[27px] font-extrabold tracking-tight text-[#191c1e] dark:text-[#eff1f4] leading-[1.2] line-clamp-2">
            {step.title}
          </h2>
        </div>

        {/* Navigation Actions Footer */}
        <div className="w-full pt-1 flex items-center gap-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="h-14 px-5 rounded-2xl bg-white dark:bg-[#1e2328] text-[#191c1e] dark:text-[#eff1f4] font-bold text-sm card-raised active:neumorphic-inset border border-white/80 dark:border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex-1 h-14 rounded-2xl bg-[#005f9e] dark:bg-[#9dcaff] text-white dark:text-[#003258] font-black text-sm uppercase tracking-wider transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {currentStep === tutorialSteps.length - 1 ? (
              <>
                <span>Start 60s Walk</span>
                <Play className="w-4 h-4 fill-current" />
              </>
            ) : (
              <>
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
