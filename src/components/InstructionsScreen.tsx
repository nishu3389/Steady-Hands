import React from 'react';
import { Smartphone, Droplets, Footprints, Timer, CheckCircle2 } from 'lucide-react';
import { soundService } from '../services/audio';

interface InstructionsScreenProps {
  onGotIt: () => void;
  soundEnabled: boolean;
}

export const InstructionsScreen: React.FC<InstructionsScreenProps> = ({
  onGotIt,
  soundEnabled,
}) => {
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
      text: 'Walk normally while balancing',
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

  return (
    <div className="flex flex-col w-full max-w-sm mx-auto p-4 sm:p-6 gap-6 pb-28">
      <div className="flex flex-col items-center gap-2 text-center mt-2">
        <h1 className="text-3xl font-extrabold text-[#005f9e] dark:text-[#9dcaff] tracking-tight">
          How to Play
        </h1>
        <p className="text-base text-[#404751] dark:text-[#c0c7d3]">
          Keep a steady hand and don't spill the water!
        </p>
      </div>

      <div className="flex flex-col gap-4 relative mt-2">
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
      <div className="mt-4 w-full flex justify-center">
        <button
          onClick={handleGotIt}
          className="w-full max-w-[280px] h-14 rounded-full bg-white dark:bg-[#191c1e] card-raised text-[#005f9e] dark:text-[#9dcaff] font-bold text-lg active:neumorphic-inset transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/80 dark:border-transparent"
        >
          Got it
          <CheckCircle2 className="w-6 h-6 text-[#005f9e] dark:text-[#9dcaff]" />
        </button>
      </div>
    </div>
  );
};
