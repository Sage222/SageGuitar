/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Music,
  Compass,
  Sliders,
  Sparkles,
  Play,
  Volume2,
  Mic,
  Award,
  Zap,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

import { TopBar, ActiveTab } from './components/TopBar';
import { Tuner } from './components/Tuner';
import { SongPlayer } from './components/SongPlayer';
import { SongCatalog } from './components/SongCatalog';
import { ChordLibrary } from './components/ChordLibrary';
import { Fretboard } from './components/Fretboard';
import { ProgressDashboard } from './components/ProgressDashboard';
import { PracticeStudio } from './components/PracticeStudio';

import { SONGS_CATALOG } from './data/songs';
import { Song, DetectedPitch, UserProgressData } from './types/guitar';
import { audioEngine } from './utils/audioEngine';
import {
  loadUserProgress,
  recordSongCompletion,
  recordPracticeMinutes,
  toggleFavoriteSong,
} from './utils/progressStorage';

// Generated image asset
import rockAnthemCover from './assets/images/song_cover_rock_anthem_1791762641359.jpg';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [selectedSong, setSelectedSong] = useState<Song>(SONGS_CATALOG[0]);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [detectedPitch, setDetectedPitch] = useState<DetectedPitch | null>(null);
  const [rmsLevel, setRmsLevel] = useState<number>(0);
  const [selectedChordForFretboard, setSelectedChordForFretboard] = useState<string | null>('Em');
  const [userProgress, setUserProgress] = useState<UserProgressData>(() => loadUserProgress());

  // Microphone pitch listener registration
  useEffect(() => {
    const unsubscribe = audioEngine.subscribePitch((pitch, rms) => {
      setDetectedPitch(pitch);
      setRmsLevel(rms);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleMic = async () => {
    if (isMicActive) {
      audioEngine.stopMicrophone();
      setIsMicActive(false);
      setDetectedPitch(null);
      setRmsLevel(0);
    } else {
      const ok = await audioEngine.startMicrophone();
      if (ok) {
        setIsMicActive(true);
      }
    }
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setActiveTab('studio');
  };

  const handleNextSong = () => {
    const currentIndex = SONGS_CATALOG.findIndex((s) => s.id === selectedSong.id);
    const nextIndex = (currentIndex + 1) % SONGS_CATALOG.length;
    setSelectedSong(SONGS_CATALOG[nextIndex]);
  };

  const handleSongComplete = (
    score: number,
    accuracy: number,
    stars: number,
    hitsCount: number,
    duration: number
  ) => {
    const updated = recordSongCompletion(
      userProgress,
      selectedSong,
      score,
      accuracy,
      stars,
      hitsCount,
      duration
    );
    setUserProgress(updated);
  };

  const handlePlayDrillOnRunway = (drillSong: Song) => {
    setSelectedSong(drillSong);
    setActiveTab('studio');
  };

  const handleLogPracticeMinutes = (minutes: number) => {
    const updated = recordPracticeMinutes(userProgress, minutes);
    setUserProgress(updated);
  };

  const handleToggleFavorite = (songId: string) => {
    const updated = toggleFavoriteSong(userProgress, songId);
    setUserProgress(updated);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Navigation Header */}
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">
        {/* Real-time Listening Banner when Mic is Active */}
        {isMicActive && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-300 font-mono shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">Real-time Guitar Microphone Active:</span>
              <span>
                {detectedPitch
                  ? `Detected ${detectedPitch.noteName}${detectedPitch.octave} (${detectedPitch.freq.toFixed(1)} Hz · ${
                      detectedPitch.cents >= 0 ? `+${detectedPitch.cents}` : detectedPitch.cents
                    } cents)`
                  : 'Listening for string plucks...'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">Level:</span>
              <div className="w-24 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="bg-emerald-400 h-full transition-all duration-75"
                  style={{ width: `${Math.min(100, rmsLevel * 400)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Hero Banner (Shown on Catalog View) */}
        {activeTab === 'catalog' && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl z-10">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-2">
                <span>SIMPLY GUITAR & YOUSICIAN STYLE</span>
                <span aria-hidden="true">·</span>
                <span>REAL-TIME PITCH LISTENING</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Learn Guitar with Real-Time Audio Feedback
              </h1>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Plug in or sit with your acoustic guitar. Practice songs across 5 difficulty levels in Lead Tab Mode and Rhythm Chord Mode, check your tuning, or explore chords and scales.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-6">
                <button
                  onClick={() => setActiveTab('studio')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Play Runway ({selectedSong.title})</span>
                </button>

                <button
                  onClick={() => setActiveTab('practice')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs hover:bg-emerald-500/25 transition flex items-center gap-2 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Practice Scales & Drills</span>
                </button>

                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs hover:bg-slate-750 transition"
                >
                  Practice Dashboard ({userProgress.currentDailyStreak} Day Streak)
                </button>

                <button
                  onClick={() => setActiveTab('tuner')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs hover:bg-slate-750 transition"
                >
                  Tune Guitar
                </button>
              </div>
            </div>

            {/* Right Hero Artwork */}
            <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden shrink-0 border border-emerald-500/30 shadow-2xl">
              <img
                src={rockAnthemCover}
                alt="Guitar Trainer Tube Amplifier and Sunburst Guitar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] font-mono text-slate-300 font-semibold">
                  90s+ Songs · 4s Count In
                </span>
              </div>
            </div>
          </div>
        )}

        {/* View Routing */}
        {activeTab === 'catalog' && (
          <SongCatalog
            songs={SONGS_CATALOG}
            onSelectSong={handleSelectSong}
            selectedSongId={selectedSong.id}
            onNavigateToPractice={() => setActiveTab('practice')}
            favoriteSongIds={userProgress.favoriteSongs || []}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'studio' && (
          <SongPlayer
            song={selectedSong}
            detectedPitch={detectedPitch}
            isMicActive={isMicActive}
            onToggleMic={handleToggleMic}
            onBackToCatalog={() => setActiveTab('catalog')}
            onNextSong={handleNextSong}
            onSongComplete={handleSongComplete}
            isFavorite={(userProgress.favoriteSongs || []).includes(selectedSong.id)}
            onToggleFavorite={() => handleToggleFavorite(selectedSong.id)}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeStudio
            detectedPitch={detectedPitch}
            isMicActive={isMicActive}
            onPlayOnRunway={handlePlayDrillOnRunway}
            onLogPracticeMinutes={handleLogPracticeMinutes}
          />
        )}

        {activeTab === 'dashboard' && (
          <ProgressDashboard
            progress={userProgress}
            onSelectSongToPlay={handleSelectSong}
          />
        )}

        {activeTab === 'tuner' && (
          <Tuner
            isMicActive={isMicActive}
            onToggleMic={handleToggleMic}
            detectedPitch={detectedPitch}
            rmsLevel={rmsLevel}
          />
        )}

        {activeTab === 'chords' && (
          <div className="flex flex-col gap-6">
            <ChordLibrary
              onSelectChordForFretboard={(chord) => setSelectedChordForFretboard(chord)}
              detectedPitch={detectedPitch}
            />

            <Fretboard
              detectedPitch={detectedPitch}
              selectedChordName={selectedChordForFretboard}
            />
          </div>
        )}
      </main>

      {/* Clean Unboxed Footer */}
      <footer className="mt-auto border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="flex flex-wrap justify-center items-center gap-3">
          <span>StringMaster Guitar Trainer</span>
          <span aria-hidden="true">·</span>
          <span>Lead Tab & Chord Runway</span>
          <span aria-hidden="true">·</span>
          <span>Precision Tuner</span>
          <span aria-hidden="true">·</span>
          <span>5 Difficulty Levels</span>
        </div>
      </footer>
    </div>
  );
}
