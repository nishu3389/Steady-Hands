import React, { useState } from 'react';
import { Smartphone, Droplets, Footprints, Timer, CheckCircle2, Sparkles, BookOpen, Play } from 'lucide-react';
import { soundService } from '../services/audio';
import { MINDFUL_BENEFITS } from '../data/mindfulBenefits';

interface InstructionsScreenProps {
  onGotIt: () => void;
  soundEnabled: boolean;
  onOpenTutorial?: () => void;
}

export const InstructionsScreen: React.FC<InstructionsScreenProps> = ({
  onGotIt,
  soundEnabled,
  onOpenTutorial,
}) => {
  const [activeTab, setActiveTab] = useState<'howToPlay' | 'benefits'>('howToPlay');

  const steps = [
    {
      num: 1,
      icon: <Smartphone className="w-8 h-8 text-[#7c5800] dark:text-[#f4be57]" />,
      text: 'Hold your phone flat and steady',
    },
    {
      num: 2,
      icon: <Droplets className="w-8 h-8 text-[#a9301b] dark:text-[#ffb4a5] rotate-12" />,
      text: "Don't tilt — water spills fast",
    },
    {
      num: 3,
      icon: <Footprints className="w-8 h-8 text-[#7c5800] dark:text-[#f4be57]" />,
      text: 'Walk steadily: Timer pauses if you stop',
    },
    {
      num: 4,
      icon: <Timer className="w-8 h-8 text-[#7c5800] dark:text-[#f4be57]" />,
      text: 'Keep 50%+ water when time runs out to win',
    },
  ];

  const handleGotIt = () => {
    if (soundEnabled) soundService.playClick();
    onGotIt();
  };

  const handleTabSwitch = (tab: 'howToPlay' | 'benefits') => {
    if (soundEnabled) soundService.playClick();
    setActiveTab(tab);
  };

  // No min-h-screen on the root below, on purpose — this screen is already
  // stretched by its flex-1 parent in App.tsx. Forcing an extra 100vh floor
  // on top of that made even short content (e.g. the How to Play tab)
  // taller than it needed to be, enabling scroll/bounce when everything
  // already fit on screen.
  return (
    <div className="flex flex-col w-full max-w-sm mx-auto">
      {/* Sticky Top Header Section (Tabs only — title scrolls with content) */}
      <div className="sticky top-0 z-20 bg-[#f0f4f9] dark:bg-[#191c1e] px-4 sm:px-6 pt-4 pb-3 flex flex-col gap-4 border-b border-black/[0.04] dark:border-white/[0.04]">
        {/* Top Segmented Tab Switcher */}
        <div className="w-full bg-[#e9edf2] dark:bg-[#162B3B] rounded-full p-1.5 flex items-center justify-between neumorphic-inset">
          <button
            onClick={() => handleTabSwitch('howToPlay')}
            className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'howToPlay'
                ? 'neumorphic-inset bg-white dark:bg-[#191c1e] text-[#005f9e] dark:text-[#9dcaff] shadow-inner'
                : 'text-[#404751] dark:text-[#c0c7d3] hover:text-[#005f9e] dark:hover:text-[#9dcaff]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            How to Play
          </button>

          <button
            onClick={() => handleTabSwitch('benefits')}
            className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'benefits'
                ? 'neumorphic-inset bg-white dark:bg-[#191c1e] text-[#005f9e] dark:text-[#9dcaff] shadow-inner'
                : 'text-[#404751] dark:text-[#c0c7d3] hover:text-[#005f9e] dark:hover:text-[#9dcaff]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Mind & Body
          </button>
        </div>
      </div>

      {/* Scrollable Content Section (title scrolls away with everything else) */}
      <div className="flex-1 px-4 sm:px-6 pt-3 pb-28">
        {/* Title & Subtitle Header */}
        <div className="flex flex-col items-center gap-1 text-center pb-4">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#005f9e] dark:text-[#9dcaff] tracking-tight">
            {activeTab === 'howToPlay' ? 'Steady Hands Guide' : 'Mind & Body Benefits'}
          </h1>
          <p className="text-xs sm:text-sm text-[#404751] dark:text-[#a0a8b4] leading-snug">
            {activeTab === 'howToPlay'
              ? "Keep a steady hand and don't spill the water!"
              : 'A physical mindfulness exercise in somatic awareness.'}
          </p>
        </div>

        {activeTab === 'howToPlay' ? (
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* Interactive Animated Tutorial Quick Launch Banner */}
            {onOpenTutorial && (
              <button
                onClick={() => {
                  if (soundEnabled) soundService.playClick();
                  onOpenTutorial();
                }}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-[#005f9e] to-[#0078c6] text-white flex items-center justify-between shadow-md active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase tracking-wider text-sky-200">
                      Visual Guide
                    </span>
                    <span className="text-sm font-extrabold text-white">
                      Watch Animated Tutorial
                    </span>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                </div>
              </button>
            )}

            <div className="flex flex-col gap-4 relative mt-1">
              {/* Timeline Connecting Line */}
              <div className="absolute w-1 bg-[#e0e3e6] dark:bg-[#2d3133] h-[82%] left-7 top-6 rounded-full z-0" />

              {steps.map((step) => (
                <div key={step.num} className="flex items-center gap-4 relative z-10">
                  {/* Number Badge */}
                  <div className="w-14 h-14 rounded-full bg-white dark:bg-[#191c1e] shrink-0 flex items-center justify-center card-raised text-[#005f9e] dark:text-[#9dcaff] font-extrabold text-xl border border-white/80 dark:border-transparent">
                    {step.num}
                  </div>

                  {/* Content Card */}
                  <div className="flex-1 rounded-2xl p-4 bg-white dark:bg-[#191c1e] card-raised flex items-center gap-3.5 border border-white/60 dark:border-transparent">
                    <div className="shrink-0">{step.icon}</div>
                    <p className="text-sm font-semibold text-[#191c1e] dark:text-[#eff1f4] leading-snug">
                      {step.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <div className="mt-2 w-full flex justify-center">
              <button
                onClick={handleGotIt}
                className="w-full max-w-[280px] h-14 rounded-full bg-white dark:bg-[#191c1e] card-raised text-[#005f9e] dark:text-[#9dcaff] font-bold text-lg active:neumorphic-inset transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/80 dark:border-transparent shadow-md"
              >
                Got it
                <CheckCircle2 className="w-6 h-6 text-[#005f9e] dark:text-[#9dcaff]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Only the top 4 benefits shown here — fewer, bigger, easier to
                actually read than all 12 crammed into small cards. The full
                list still powers the lobby tip cycler and match-result
                callouts elsewhere (see MINDFUL_BENEFITS usages). */}
            <div className="flex flex-col gap-5">
              {MINDFUL_BENEFITS.slice(0, 4).map((benefit) => (
                <div
                  key={benefit.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#191c1e] card-raised border border-white/60 dark:border-transparent flex flex-col gap-3 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-[#eef4fb] dark:bg-[#152331] border border-[#005f9e]/10 dark:border-[#9dcaff]/15 shrink-0 shadow-inner">
                      {benefit.icon()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs uppercase font-bold tracking-wider text-[#005f9e] dark:text-[#9dcaff]">
                        {benefit.tagline}
                      </span>
                      <h3 className="font-extrabold text-lg sm:text-xl text-[#191c1e] dark:text-[#eff1f4] leading-snug">
                        {benefit.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-[#5a626f] dark:text-[#a0a8b4] leading-relaxed pl-1 pt-0.5">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <div className="mt-2 w-full flex justify-center">
              <button
                onClick={handleGotIt}
                className="w-full max-w-[280px] h-14 rounded-full bg-white dark:bg-[#191c1e] card-raised text-[#005f9e] dark:text-[#9dcaff] font-bold text-lg active:neumorphic-inset transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/80 dark:border-transparent shadow-md"
              >
                Start Practicing
                <CheckCircle2 className="w-6 h-6 text-[#005f9e] dark:text-[#9dcaff]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
