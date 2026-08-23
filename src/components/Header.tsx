import React from 'react';
import { NavigationTab, UserProfile } from '../types';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  currentTab: NavigationTab;
  inGame?: boolean;
  inResult?: boolean;
  onBack?: () => void;
  profile: UserProfile;
  onProfileClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  inGame,
  inResult,
  onBack,
  profile,
  onProfileClick,
}) => {
  const getTitle = () => {
    if (inResult) return 'Match Results';
    switch (currentTab) {
      case 'play':
        return 'Play';
      case 'instructions':
        return 'Instructions';
      case 'leaderboard':
        return 'Leaderboard';
      case 'settings':
        return 'Settings';
      default:
        return 'Steady Hands';
    }
  };

  const showBackButton = inResult || (inGame && onBack);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#f0f4f9]/90 dark:bg-[#191c1e]/90 backdrop-blur-md pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_8px_rgba(0,0,0,0.3)] transition-colors duration-200">
      <div className="h-16 px-4 md:px-6 flex items-center justify-between max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <button
              onClick={onBack}
              className="w-11 h-11 flex items-center justify-center text-[#191c1e] dark:text-[#eff1f4] bg-white dark:bg-[#191c1e] neumorphic-raised rounded-xl active:neumorphic-inset transition-all"
              aria-label="Go Back"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#191c1e] neumorphic-raised-sm flex items-center justify-center p-1.5 overflow-hidden border border-white/80 dark:border-transparent">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC70hO-o4Npao_8HBUdKIQm0UB4E56fh8xRXu55-4ylLXj7hFMR2DiQzzPYWpnmcoaKhFw6GzEA-W5NXC9tCKDiNulxikqwGJcJ4vC5y7ZBtXmYcwoHRSok1MYV02stgGHDbDarlUNWZJ7TDv2G-4rBk17uMZqdWSz0CfbsvgZFlsHxlfRBLRkQ0ihMFiYjfuQsjKRTzVAy3Zmw0E6RWhFrfhf_Ky7xrDBB992vvxas1bBeyGgTyrZQ"
                alt="Steady Hands Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if network issue
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <h1 className="font-bold text-2xl text-[#005f9e] dark:text-[#9dcaff] tracking-tight">
            {getTitle()}
          </h1>
        </div>

        {!showBackButton && (
          <button
            onClick={onProfileClick}
            className="w-10 h-10 rounded-full object-cover neumorphic-raised p-0.5 relative transition-transform active:scale-95 overflow-hidden bg-white dark:bg-[#191c1e]"
            aria-label="Profile"
          >
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full rounded-full object-cover"
            />
          </button>
        )}
      </div>
    </header>
  );
};
