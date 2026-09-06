import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { GameResult, UserProfile } from '../types';
import { generateSteadinessCard, GeneratedCardData } from '../services/cardGenerator';
import { saveCardToGallery, shareCardNatively } from '../services/nativeShare';
import { soundService } from '../services/audio';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  Share2,
  Download,
  Copy,
  Check,
  X,
  Footprints,
  Droplets,
  Activity,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

interface ShareExperienceModalProps {
  result: GameResult;
  profile?: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
}

interface MakingStage {
  id: number;
  label: string;
  sub: string;
  icon: React.ReactNode;
  threshold: number;
}

export const ShareExperienceModal: React.FC<ShareExperienceModalProps> = ({
  result,
  profile,
  isOpen,
  onClose,
  soundEnabled,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [cardData, setCardData] = useState<GeneratedCardData | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [hasTriggeredWhatsApp, setHasTriggeredWhatsApp] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [whatsappOpenedToast, setWhatsappOpenedToast] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const audioPlayedRef = useRef(false);

  const steadiness = Math.round(result.steadinessScore ?? result.finalScore ?? 85);
  const grade = result.steadinessBreakdown?.gradeTitle || (steadiness >= 90 ? 'Flow State' : 'Mindful Balance');
  const gradeIcon = result.steadinessBreakdown?.gradeIcon || (steadiness >= 90 ? '🪷' : '🌊');
  const waterPct = Math.max(0, Math.min(100, Math.round(result.waterRemaining)));
  const steps = result.stepsTaken ?? 0;
  const feet = result.distanceFeet ?? Math.round(steps * 1.804 * 10) / 10;
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://steadyhands.app';

  // Construct message for WhatsApp with clean formatting & challenge hook
  const shareText = `🌊 *Steady Hands — Mindful Walking Challenge*
I scored *${steadiness}% Steadiness* (${gradeIcon} ${grade})! 🥣💧

📊 *My Session Stats:*
• Water Preserved: ${waterPct}%
• Path Walked: ${feet} ft (${steps} mindful steps)
• Equilibrium: ${result.steadinessBreakdown?.postureScore || 92}% centered

Think you have steadier hands? Try walking without spilling a single drop! 🏆
👉 *Play Steady Hands:* ${appUrl}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const stages: MakingStage[] = [
    {
      id: 1,
      label: 'Calibrating Gait Cadence',
      sub: 'Evaluating step timing & balance equilibrium...',
      icon: <Footprints className="w-4 h-4 text-sky-400 animate-bounce" />,
      threshold: 28,
    },
    {
      id: 2,
      label: 'Computing Steadiness Index',
      sub: 'Synthesizing fluid calm and stillness scores...',
      icon: <Droplets className="w-4 h-4 text-emerald-400 animate-pulse" />,
      threshold: 60,
    },
    {
      id: 3,
      label: 'Rendering Official Certificate',
      sub: 'Designing high-definition share card & badges...',
      icon: <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />,
      threshold: 88,
    },
    {
      id: 4,
      label: 'Card Ready • Launching WhatsApp',
      sub: 'Card generated! Preparing direct WhatsApp share...',
      icon: <MessageCircle className="w-4 h-4 text-emerald-400" />,
      threshold: 100,
    },
  ];

  // Initiate Canvas Card Generation & Animated States progression
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStageIdx(0);
      setIsDone(false);
      setHasTriggeredWhatsApp(false);
      setWhatsappOpenedToast(false);
      audioPlayedRef.current = false;
      return;
    }

    // 1. Generate card image in background
    let mounted = true;
    generateSteadinessCard(result, profile).then((data) => {
      if (mounted) {
        setCardData(data);
      }
    });

    // 2. Smoothly increment progress across ~3.8 seconds
    const startTime = Date.now();
    const duration = 3600; // 3.6s animation sequence

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 28) {
        setCurrentStageIdx(0);
      } else if (pct < 60) {
        setCurrentStageIdx(1);
      } else if (pct < 88) {
        setCurrentStageIdx(2);
      } else {
        setCurrentStageIdx(3);
      }

      if (pct >= 100) {
        clearInterval(interval);
        setIsDone(true);

        if (!audioPlayedRef.current) {
          audioPlayedRef.current = true;
          if (soundEnabled) soundService.playWin();
          try {
            confetti({
              particleCount: 65,
              spread: 60,
              origin: { y: 0.45 },
              colors: ['#25D366', '#38bdf8', '#10b981', '#ffffff'],
            });
          } catch {
            // Ignore
          }
        }

        // 3. After completion, launch WhatsApp automatically
        setTimeout(() => {
          if (mounted) {
            triggerWhatsAppOpen();
          }
        }, 800);
      }
    }, 45);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isOpen, result, profile, soundEnabled]);

  const fileName = `steady-hands-${steadiness}pct-score.png`;

  // Opens the text-only wa.me deep link -- this is a last-resort fallback,
  // since it's the only share path guaranteed to work everywhere (even a
  // plain browser), but it genuinely cannot attach a file: WhatsApp's own
  // URL scheme has no parameter for that. Whenever an image is available on
  // native, prefer shareCardWithImage() below instead.
  const openWhatsAppTextOnly = () => {
    setHasTriggeredWhatsApp(true);
    setWhatsappOpenedToast(true);
    try {
      window.open(whatsappUrl, '_blank');
    } catch {
      window.location.href = whatsappUrl;
    }
  };

  // Shares the card image + caption together via the native OS share sheet
  // (the only way to attach a file to a WhatsApp -- or any -- share; falls
  // back to the text-only deep link if native sharing isn't available/fails).
  const shareCardWithImage = async () => {
    if (Capacitor.isNativePlatform() && cardData?.dataUrl) {
      try {
        await shareCardNatively(cardData.dataUrl, fileName, shareText);
        setHasTriggeredWhatsApp(true);
        setWhatsappOpenedToast(true);
        return;
      } catch {
        // Fall through to the text-only link below.
      }
    }
    openWhatsAppTextOnly();
  };

  const triggerWhatsAppOpen = () => {
    if (soundEnabled) soundService.playClick();
    shareCardWithImage();
  };

  const handleDownloadImage = async () => {
    if (soundEnabled) soundService.playClick();
    if (!cardData?.dataUrl) return;

    if (Capacitor.isNativePlatform()) {
      setSaveStatus('saving');
      try {
        await saveCardToGallery(cardData.dataUrl, fileName);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
      return;
    }

    // Web/browser: the classic download-link trick actually works here.
    const a = document.createElement('a');
    a.href = cardData.dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNativeShare = async () => {
    if (soundEnabled) soundService.playClick();

    if (Capacitor.isNativePlatform()) {
      await shareCardWithImage();
      return;
    }

    // Web/browser: Android's WebView doesn't reliably support the Web Share
    // API with files, but a real browser might -- worth trying before
    // falling back to the text-only link.
    if (cardData?.file && navigator.canShare && navigator.canShare({ files: [cardData.file] })) {
      try {
        await navigator.share({
          title: 'Steady Hands Balance Score',
          text: shareText,
          files: [cardData.file],
        });
        return;
      } catch {
        // user cancelled or fallback
      }
    }

    openWhatsAppTextOnly();
  };

  const handleCopyText = async () => {
    if (soundEnabled) soundService.playClick();
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // Ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md overflow-y-auto select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md my-auto bg-[#0e1620] border border-white/10 rounded-3xl p-5 sm:p-6 flex flex-col items-center gap-4 text-white shadow-2xl overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer z-20"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ===================================================================== */}
        {/* 1. App Logo & Name Header                                             */}
        {/* ===================================================================== */}
        <div className="flex flex-col items-center text-center gap-2 pt-1 z-10">
          {/* Logo with pulsating animated concentric ripple rings */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-sky-400/20 animate-ping opacity-35" />
            <div className="absolute inset-1 rounded-full border border-sky-400/40 animate-pulse" />
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#005f9e] via-[#0284c7] to-[#38bdf8] flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.4)] border border-white/20">
              <span className="text-2xl filter drop-shadow-md">🥣</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-xl font-black tracking-tight text-white">Steady Hands</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 uppercase tracking-wider">
                Share Card
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isDone
                ? 'Your Official Steadiness Card is Ready!'
                : 'Creating your high-res balance certificate...'}
            </p>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 2. Awesome In-Making Animation & State Tracker                        */}
        {/* ===================================================================== */}
        <div className="w-full bg-[#131d2a] border border-white/10 rounded-2xl p-3.5 flex flex-col gap-2.5 z-10 shadow-inner">
          {/* Progress bar with percentage */}
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              {stages[currentStageIdx].label}
            </span>
            <span className="font-mono text-sky-400 font-bold">{progress}%</span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0284c7] via-[#38bdf8] to-[#25D366] transition-all duration-100 ease-out shadow-[0_0_10px_#38bdf8]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step markers */}
          <div className="grid grid-cols-4 gap-1 pt-1">
            {stages.map((st, i) => {
              const isPast = progress >= st.threshold;
              const isCurrent = currentStageIdx === i;
              return (
                <div key={st.id} className="flex flex-col items-center gap-1 text-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isPast
                        ? 'bg-emerald-500 text-slate-950 shadow-[0_0_8px_#10b981]'
                        : isCurrent
                        ? 'bg-sky-500 text-white animate-pulse border border-sky-300'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {isPast ? <Check className="w-3 h-3 stroke-[3]" /> : i + 1}
                  </div>
                  <span
                    className={`text-[9px] font-medium leading-tight truncate w-full ${
                      isCurrent ? 'text-sky-300 font-bold' : isPast ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {i === 0 ? 'Gait' : i === 1 ? 'Calm' : i === 2 ? 'Render' : 'WhatsApp'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. Card Preview In Making / Complete                                  */}
        {/* ===================================================================== */}
        <div className="relative w-full rounded-2xl bg-[#090f15] border border-white/10 p-3.5 flex flex-col items-center gap-3 overflow-hidden shadow-xl z-10">
          {/* Scanning laser beam animation while making */}
          {!isDone && (
            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_15px_#38bdf8] pointer-events-none transition-all duration-300 z-30"
              style={{
                top: `${(progress % 90) + 5}%`,
              }}
            />
          )}

          {/* High-Resolution Canvas Card Preview */}
          {cardData?.dataUrl ? (
            <div className="relative w-full rounded-xl overflow-hidden border border-white/10 shadow-lg group">
              <img
                src={cardData.dataUrl}
                alt="Steady Hands Balance Card"
                className={`w-full h-auto max-h-[260px] object-contain mx-auto transition-all duration-500 ${
                  isDone ? 'scale-100 filter-none' : 'scale-98 blur-[1px] brightness-90'
                }`}
              />

              {!isDone && (
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="bg-[#0e1620]/90 px-3 py-1.5 rounded-full border border-sky-400/30 flex items-center gap-2 text-xs font-semibold text-sky-300 shadow-md">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering Certificate...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-48 rounded-xl bg-slate-900/50 flex flex-col items-center justify-center gap-2 border border-white/5">
              <Activity className="w-8 h-8 text-sky-400 animate-pulse" />
              <span className="text-xs text-slate-400">Synthesizing Visual Layout...</span>
            </div>
          )}

          {/* Quick Score Highlight Chips */}
          <div className="w-full flex items-center justify-around py-1 text-center border-t border-white/5 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
              <span className="text-base font-black text-white">{steadiness}%</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Grade</span>
              <span className="text-xs font-bold text-emerald-400">
                {gradeIcon} {grade}
              </span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Water</span>
              <span className="text-xs font-bold text-sky-300">{waterPct}%</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Launch Feedback Toast */}
        {whatsappOpenedToast && (
          <div className="w-full px-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between z-10 animate-in fade-in slide-in-from-top-2">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>WhatsApp launched with your score challenge!</span>
            </span>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 4. Action Buttons (WhatsApp + Download Image + Copy)                  */}
        {/* ===================================================================== */}
        <div className="w-full flex flex-col gap-2 z-10 mt-1">
          {/* Primary Action: Open WhatsApp */}
          <button
            onClick={triggerWhatsAppOpen}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#22bf5b] hover:to-[#0f776a] active:scale-[0.98] text-white font-black text-sm shadow-[0_4px_20px_rgba(37,211,102,0.35)] flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-emerald-400/30"
          >
            {/* WhatsApp Logo SVG */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.181-.554-1.898-.787-3.125-2.736-3.219-2.862-.094-.125-.768-1.021-.768-1.947 0-.925.485-1.381.658-1.569.172-.188.375-.235.5-.235.125 0 .25.002.359.007.116.005.27-.044.423.322.156.375.532 1.297.578 1.391.047.094.078.203.016.328-.063.125-.094.203-.188.312-.094.109-.198.244-.282.328-.094.094-.192.196-.082.385.11.188.489.807 1.05 1.306.721.642 1.328.841 1.516.935.188.094.297.078.406-.047.109-.125.469-.547.594-.734.125-.187.25-.156.422-.094.172.062 1.094.516 1.281.609.188.094.312.141.359.219.047.078.047.453-.097.858zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.435 5.177L2 22l4.981-1.383C8.423 21.498 10.153 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
            </svg>
            <span>{hasTriggeredWhatsApp ? 'Reopen in WhatsApp' : 'Open in WhatsApp Now'}</span>
          </button>

          {/* Secondary Row: Save Card Image & Native Share */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadImage}
              disabled={!cardData?.dataUrl || saveStatus === 'saving'}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {saveStatus === 'saved' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span>
                {saveStatus === 'saving'
                  ? 'Saving…'
                  : saveStatus === 'saved'
                  ? 'Saved to Gallery!'
                  : saveStatus === 'error'
                  ? 'Save Failed'
                  : 'Save Card Image'}
              </span>
            </button>

            {Capacitor.isNativePlatform() || (typeof navigator !== 'undefined' && 'canShare' in navigator) ? (
              <button
                onClick={handleNativeShare}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Share Image File</span>
              </button>
            ) : (
              <button
                onClick={handleCopyText}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedText ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span>{copiedText ? 'Copied!' : 'Copy Text'}</span>
              </button>
            )}
          </div>

          {/* Subtle note */}
          <p className="text-[10px] text-center text-slate-500 pt-1">
            Tip: Save image to attach the official Certificate directly in WhatsApp chats!
          </p>
        </div>
      </div>
    </div>
  );
};
