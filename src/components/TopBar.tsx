import React from 'react';
import { Mic, MicOff } from 'lucide-react';

export type ActiveTab = 'catalog' | 'studio' | 'practice' | 'dashboard' | 'tuner' | 'chords';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isMicActive: boolean;
  onToggleMic: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  isMicActive,
  onToggleMic,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-950/95 sticky top-0 z-40 backdrop-blur-md">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onTabChange('catalog');
        }}
        className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors"
      >
        StringMaster
      </a>

      {/* Zone 2: Concise single-line navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onTabChange('catalog')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'catalog' ? 'text-emerald-400 font-bold' : ''
          }`}
        >
          Songs
        </button>
        <button
          onClick={() => onTabChange('studio')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'studio' ? 'text-emerald-400 font-bold' : ''
          }`}
        >
          Runway
        </button>
        <button
          onClick={() => onTabChange('practice')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'practice' ? 'text-emerald-400 font-bold' : ''
          }`}
        >
          <span>Practice</span>
          <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40">
            Scales
          </span>
        </button>
        <button
          onClick={() => onTabChange('dashboard')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : ''
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onTabChange('tuner')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'tuner' ? 'text-emerald-400 font-bold' : ''
          }`}
        >
          Tuner
        </button>
        <button
          onClick={() => onTabChange('chords')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'chords' ? 'text-emerald-400 font-bold' : ''
          }`}
        >
          Chords
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleMic}
          className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
            isMicActive
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
          }`}
        >
          {isMicActive ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Mic Listening</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>Listen To My Guitar</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

