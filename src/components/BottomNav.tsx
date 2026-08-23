import React from 'react';
import { NavigationTab } from '../types';
import { soundService } from '../services/audio';

interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  soundEnabled: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  soundEnabled,
}) => {
  const handleTabClick = (tab: NavigationTab) => {
    if (soundEnabled) {
      soundService.playTabSwitch();
    }
    onTabChange(tab);
  };

  const navItems: { id: NavigationTab; label: string; icon: string }[] = [
    {
      id: 'play',
      label: 'PLAY',
      icon: 'sports_esports',
    },
    {
      id: 'instructions',
      label: 'INFO',
      icon: 'menu_book',
    },
    {
      id: 'leaderboard',
      label: 'RANK',
      icon: 'emoji_events',
    },
    {
      id: 'settings',
      label: 'SET',
      icon: 'settings',
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-safe bg-[#f0f4f9]/90 dark:bg-[#191c1e]/90 backdrop-blur-md transition-colors duration-200 shadow-[0_-10px_28px_rgba(0,0,0,0.16)] dark:shadow-[0_-10px_28px_rgba(0,0,0,0.5)]">
      <div className="h-20 px-2 flex items-center justify-around max-w-lg mx-auto w-full">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'neumorphic-inset text-[#005f9e] dark:text-[#9dcaff]'
                  : 'text-[#404751] dark:text-[#c0c7d3] hover:text-[#005f9e]'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {item.icon}
              </span>
              <span className="text-[12px] leading-[16px] font-bold tracking-[0.1em]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

