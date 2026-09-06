import React, { useState } from 'react';
import { ExternalLink, Info, Sparkles, Star } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface AdMimicBannerProps {
  placement?: 'home' | 'results' | 'leaderboard' | 'instructions' | 'settings';
  className?: string;
}

const SAMPLE_ADS = [
  {
    title: 'Calm & Steady — Daily Balance',
    subtitle: 'Track mindful posture and steady strides',
    cta: 'Install',
    rating: '4.8',
    reviews: '120K',
    brand: 'ZenHealth',
    bgColor: 'from-[#004778]/30 to-[#002844]/40',
    borderColor: 'border-[#38bdf8]/30',
    tagColor: 'bg-[#38bdf8]/15 text-[#38bdf8]',
  },
  {
    title: 'FitTrack Pro: Gyro Walk Tracker',
    subtitle: 'Precision accelerometer gait & balance metrics',
    cta: 'Open',
    rating: '4.9',
    reviews: '85K',
    brand: 'MotionLabs',
    bgColor: 'from-[#10b981]/20 to-[#042f2e]/40',
    borderColor: 'border-[#10b981]/30',
    tagColor: 'bg-[#10b981]/15 text-[#34d399]',
  },
  {
    title: 'Hydration & Posture Coach',
    subtitle: 'Stay refreshed, walk tall, breathe deeply',
    cta: 'Free Trial',
    rating: '4.7',
    reviews: '45K',
    brand: 'PureWater',
    bgColor: 'from-[#6366f1]/20 to-[#1e1b4b]/40',
    borderColor: 'border-[#818cf8]/30',
    tagColor: 'bg-[#818cf8]/15 text-[#a5b4fc]',
  },
];

export const AdMimicBanner: React.FC<AdMimicBannerProps> = ({
  placement = 'home',
  className = '',
}) => {
  const [adIndex] = useState(() => Math.floor(Math.random() * SAMPLE_ADS.length));
  const ad = SAMPLE_ADS[adIndex];

  return (
    <aside
      aria-label="Advertisement Banner"
      className={`w-full max-w-md mx-auto my-3 px-1 select-none transition-all duration-200 ${className}`}
    >
      {/* Outer Banner Frame - Exact 50px standard mobile banner height */}
      <div
        className={`w-full relative overflow-hidden rounded-2xl bg-gradient-to-r ${ad.bgColor} backdrop-blur-md border ${ad.borderColor} p-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.25)] flex items-center justify-between gap-3 group`}
      >
        {/* Google AdChoices Tag */}
        <div className="absolute top-1.5 right-2 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <span className="text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-black/40 text-[#a0a8b4] border border-white/10">
            Ad
          </span>
          <span className="text-[9px] text-[#707882] hover:text-[#9dcaff] cursor-pointer">
            ⓘ
          </span>
        </div>

        {/* Left: App Icon & Copy */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Mock App / Brand Thumbnail */}
          <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden">
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent">
              <Sparkles className="w-5 h-5 text-[#38bdf8] drop-shadow-sm animate-pulse" />
            </div>
          </div>

          {/* Text Content */}
          <div className="flex flex-col min-w-0 pr-6">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-bold text-[#eff1f4] truncate leading-tight">
                {ad.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex items-center text-[10px] text-amber-400 font-bold">
                <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
                <span>{ad.rating}</span>
              </div>
              <span className="text-[10px] text-[#707882] dark:text-[#8c94a0] truncate">
                · {ad.subtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Right: CTA Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#005f9e] hover:bg-[#0073be] active:scale-95 text-white font-extrabold text-[11px] tracking-wide shadow-[0_2px_8px_rgba(0,95,158,0.4)] transition-all cursor-pointer border border-[#38bdf8]/40"
        >
          {ad.cta}
        </button>
      </div>

      {/* Subtle indicator caption */}
      <div className="w-full flex items-center justify-between px-2 pt-1 text-[9px] text-[#606874] dark:text-[#7e8794]">
        <span>Google AdMob · {placement} placement</span>
        <span className="font-mono text-[8px] opacity-60">ID: ...8214685836</span>
      </div>
    </aside>
  );
};
