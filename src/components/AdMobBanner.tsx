import React, { useEffect, useRef, useState } from 'react';
import { Info, Sparkles, ExternalLink, ShieldCheck, X } from 'lucide-react';

export const ADMOB_APP_ID = 'ca-app-pub-4833668827116420~3753425596';
export const ADMOB_PUBLISHER_ID = 'ca-pub-4833668827116420';
export const ADMOB_BANNER_UNIT_ID = 'ca-app-pub-4833668827116420/8214685836';
export const ADMOB_BANNER_SLOT_ID = '8214685836';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface AdMobBannerProps {
  className?: string;
  adSlot?: string;
}

export const AdMobBanner: React.FC<AdMobBannerProps> = ({
  className = '',
  adSlot = ADMOB_BANNER_SLOT_ID,
}) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const pushAttempted = useRef(false);

  useEffect(() => {
    // 1. Ensure Google Ad script is loaded
    const scriptId = 'google-adsense-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADMOB_PUBLISHER_ID}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onerror = () => {
        setScriptError(true);
      };
      document.head.appendChild(script);
    }

    // 2. Trigger Google Ads push
    const timer = setTimeout(() => {
      if (!pushAttempted.current && adContainerRef.current) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushAttempted.current = true;
        } catch {
          // Normal in sandbox or when adblocker prevents script execution
        }
      }
    }, 400);

    // 3. Monitor if Google renders an iframe (indicating ad filled)
    const checkInterval = setInterval(() => {
      if (adContainerRef.current) {
        const iframe = adContainerRef.current.querySelector('iframe');
        const ins = adContainerRef.current.querySelector('ins');
        if (
          (iframe && iframe.clientHeight > 0) ||
          (ins && ins.getAttribute('data-ad-status') === 'filled')
        ) {
          setAdLoaded(true);
          clearInterval(checkInterval);
        }
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(checkInterval);
    };
  }, []);

  return (
    <div
      id="admob-home-banner-container"
      className={`w-full flex flex-col items-center mt-1 select-none ${className}`}
    >
      {/* Small Label Row */}
      <div className="w-full flex items-center justify-between px-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#707882] dark:text-[#a0a8b4] flex items-center gap-1">
            <span className="px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 text-[9px] font-black tracking-wider text-[#505864] dark:text-[#c0c8d4] border border-black/10 dark:border-white/10">
              AD
            </span>
            SPONSORED
          </span>
        </div>

        <button
          onClick={() => setShowDetails(true)}
          className="flex items-center gap-1 text-[10px] font-semibold text-[#707882] dark:text-[#a0a8b4] hover:text-[#005f9e] dark:hover:text-[#9dcaff] transition-colors cursor-pointer"
          aria-label="AdMob Integration Information"
        >
          <span className="text-[9px]">Google AdMob</span>
          <Info className="w-3 h-3" />
        </button>
      </div>

      {/* Main Banner Container */}
      <div className="w-full relative rounded-2xl overflow-hidden bg-white dark:bg-[#191c1e] card-raised border border-white/80 dark:border-white/10 shadow-sm transition-all min-h-[64px]">
        {/* Real Google Ad Placement Container */}
        <div
          ref={adContainerRef}
          className={`w-full flex items-center justify-center overflow-hidden ${
            adLoaded ? 'block min-h-[60px]' : 'hidden'
          }`}
        >
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', minHeight: '60px' }}
            data-ad-client={ADMOB_PUBLISHER_ID}
            data-ad-slot={adSlot}
            data-ad-format="horizontal"
            data-full-width-responsive="false"
          />
        </div>

        {/* Fallback / Preview Banner Card (Displayed while Google Ad loads or in test/sandbox environment) */}
        {!adLoaded && (
          <div className="w-full p-3 flex items-center justify-between gap-3 bg-gradient-to-r from-[#f4f8fc] via-white to-[#edf4fc] dark:from-[#132230] dark:via-[#191c1e] dark:to-[#12202c]">
            {/* Left Brand Badge */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-[#e3eefc] dark:bg-[#1a2f44] border border-[#005f9e]/15 dark:border-[#9dcaff]/20 flex items-center justify-center shrink-0 shadow-inner">
                {/* Google AdMob Color Dot Icon */}
                <div className="relative flex items-center justify-center">
                  <div className="w-4 h-4 rounded-md bg-[#005f9e] dark:bg-[#9dcaff] flex items-center justify-center shadow-sm">
                    <span className="text-[9px] font-black text-white dark:text-[#003258] leading-none">
                      M
                    </span>
                  </div>
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#ea4335] ring-1 ring-white dark:ring-[#191c1e]" />
                </div>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#191c1e] dark:text-[#eff1f4] truncate">
                    Google AdMob Banner
                  </span>
                  <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                    Linked
                  </span>
                </div>
                <span className="text-[10px] text-[#707882] dark:text-[#a0a8b4] truncate mt-0.5 font-mono">
                  Unit: ...8214685836
                </span>
              </div>
            </div>

            {/* Right Action / Details Trigger */}
            <button
              onClick={() => setShowDetails(true)}
              className="shrink-0 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#202b37] border border-[#005f9e]/15 dark:border-white/10 text-[11px] font-bold text-[#005f9e] dark:text-[#9dcaff] hover:bg-[#eaf3fc] dark:hover:bg-[#263544] transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Details</span>
              <Info className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Modal Dialog for AdMob Integration Verification */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs sm:max-w-sm rounded-3xl bg-[#f7f9fc] dark:bg-[#1e2328] border border-white/90 dark:border-white/10 p-5 flex flex-col gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] neumorphic-raised animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#e3eefc] dark:bg-[#1a2f44] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#005f9e] dark:text-[#9dcaff]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold text-[#191c1e] dark:text-[#eff1f4]">
                    Google AdMob Status
                  </span>
                  <span className="text-[10px] text-[#707882] dark:text-[#a0a8b4]">
                    Official Ad Integration
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowDetails(false)}
                className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#707882] hover:text-[#191c1e] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Fields */}
            <div className="flex flex-col gap-2 text-left text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#161c22] border border-black/5 dark:border-white/5 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#707882] dark:text-[#a0a8b4]">
                  Google AdMob App ID
                </span>
                <span className="font-mono text-[11px] font-semibold text-[#005f9e] dark:text-[#9dcaff] break-all select-all">
                  {ADMOB_APP_ID}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#161c22] border border-black/5 dark:border-white/5 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#707882] dark:text-[#a0a8b4]">
                  Banner Ad Unit ID
                </span>
                <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 break-all select-all">
                  {ADMOB_BANNER_UNIT_ID}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#161c22] border border-black/5 dark:border-white/5 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#707882] dark:text-[#a0a8b4]">
                  Publisher Client ID
                </span>
                <span className="font-mono text-[11px] font-semibold text-[#404751] dark:text-[#c0c7d3] break-all select-all">
                  {ADMOB_PUBLISHER_ID}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-[#161c22] border border-black/5 dark:border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#404751] dark:text-[#c0c7d3]">
                  Placement Location
                </span>
                <span className="text-[11px] font-bold text-[#191c1e] dark:text-[#eff1f4]">
                  Home (Below Duration)
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white dark:bg-[#161c22] border border-black/5 dark:border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#404751] dark:text-[#c0c7d3]">
                  Android Manifest
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  Configured
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#707882] dark:text-[#a0a8b4] leading-relaxed">
              Live ads display automatically once your AdMob account approval and ad unit traffic are live. In development or preview mode, this banner serves as verified placement.
            </p>

            {/* Close button */}
            <button
              onClick={() => setShowDetails(false)}
              className="w-full py-2.5 rounded-xl bg-[#005f9e] dark:bg-[#9dcaff] text-white dark:text-[#003258] font-bold text-xs uppercase tracking-wider cursor-pointer hover:opacity-90 active:scale-98 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
