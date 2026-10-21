import React, { useState } from 'react';
import { Volume2, Play, CheckCircle2, RotateCcw, Award } from 'lucide-react';
import { CHORD_LIBRARY, ChordDefinition, STRING_COLORS, STRING_NAMES } from '../utils/guitarConstants';
import { audioEngine } from '../utils/audioEngine';
import { DetectedPitch } from '../types/guitar';

interface ChordLibraryProps {
  onSelectChordForFretboard?: (chordName: string) => void;
  detectedPitch?: DetectedPitch | null;
}

export const ChordLibrary: React.FC<ChordLibraryProps> = ({
  onSelectChordForFretboard,
  detectedPitch,
}) => {
  const [selectedChordName, setSelectedChordName] = useState<string>('Em');
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'barre' | '7th'>('all');

  // Interactive Chord Practice Mode state
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceQueue] = useState<string[]>(['Em', 'G', 'C', 'D', 'Am']);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceSuccess, setPracticeSuccess] = useState(false);
  const [practiceScore, setPracticeScore] = useState(0);

  const chordKeys = Object.keys(CHORD_LIBRARY);
  const filteredChords = chordKeys.filter((key) => {
    const chord = CHORD_LIBRARY[key];
    if (activeFilter === 'open') return chord.type.includes('Minor') || chord.type.includes('Major');
    if (activeFilter === 'barre') return chord.type.includes('Barre');
    if (activeFilter === '7th') return chord.type.includes('7');
    return true;
  });

  const currentChord = CHORD_LIBRARY[selectedChordName] || CHORD_LIBRARY['Em'];

  const handlePlayChord = (chord: ChordDefinition) => {
    audioEngine.playGuitarChord(chord.frets, 'down', 2.2);
    if (onSelectChordForFretboard) {
      onSelectChordForFretboard(chord.name);
    }
  };

  const handleNextPracticeChord = () => {
    setPracticeSuccess(true);
    setPracticeScore((prev) => prev + 100);
    audioEngine.playHitSound('perfect');

    setTimeout(() => {
      setPracticeIndex((prev) => (prev + 1) % practiceQueue.length);
      setPracticeSuccess(false);
    }, 1200);
  };

  const currentPracticeChordName = practiceQueue[practiceIndex];
  const currentPracticeDef = CHORD_LIBRARY[currentPracticeChordName];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg">
          {(['all', 'open', 'barre', '7th'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${
                activeFilter === filter
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {filter === 'all' ? 'All Chords' : `${filter} Chords`}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsPracticeMode(!isPracticeMode)}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-2 ${
            isPracticeMode
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750'
          }`}
        >
          <Award className="w-4 h-4 text-emerald-400" />
          <span>{isPracticeMode ? 'Exit Chord Drill' : 'Start Chord Drill'}</span>
        </button>
      </div>

      {/* Main Grid: Interactive Diagram & Selector */}
      {isPracticeMode ? (
        /* Chord Switch Trainer / Drill */
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
          <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-2 font-mono">
            Speed Switch Drill · Score: {practiceScore} pts
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-1">
            Form and Strum: <span className="text-emerald-400 font-mono">{currentPracticeDef.name}</span>
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Place your fingers according to the diagram below and test your switch.
          </p>

          <div className="w-64 mb-6">
            <ChordDiagramBox chord={currentPracticeDef} onPlay={() => handlePlayChord(currentPracticeDef)} />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handlePlayChord(currentPracticeDef)}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition flex items-center gap-1.5"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              Listen to Chord
            </button>
            <button
              onClick={handleNextPracticeChord}
              className={`px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                practiceSuccess
                  ? 'bg-emerald-400 text-slate-950 scale-105'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
              }`}
            >
              {practiceSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Perfect Strum!
                </>
              ) : (
                'I Strummed It · Next Chord'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Detailed Diagram & Strum */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center shadow-xl">
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-2xl font-black text-white font-mono flex items-center gap-2">
                  {currentChord.name}
                  <span className="text-xs font-semibold text-slate-400 font-sans">
                    ({currentChord.type})
                  </span>
                </h3>
                <span className="text-xs text-slate-400">{currentChord.description}</span>
              </div>
              <button
                onClick={() => handlePlayChord(currentChord)}
                className="p-3 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
                title="Strum Chord"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            <ChordDiagramBox chord={currentChord} onPlay={() => handlePlayChord(currentChord)} />

            <div className="w-full mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 font-mono">
              <span>Finger 1 = Index</span>
              <span>2 = Middle</span>
              <span>3 = Ring</span>
              <span>4 = Pinky</span>
            </div>
          </div>

          {/* Right Column: Chord Browser */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
            <h4 className="text-sm font-bold text-white mb-3">Chord Library ({filteredChords.length})</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 overflow-y-auto max-h-[460px] pr-1">
              {filteredChords.map((name) => {
                const chord = CHORD_LIBRARY[name];
                const isSelected = selectedChordName === name;
                return (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedChordName(name);
                      if (onSelectChordForFretboard) onSelectChordForFretboard(name);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-bold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black font-mono">{chord.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1 rounded ${
                          isSelected ? 'bg-slate-950/20 text-slate-950' : 'text-slate-500'
                        }`}
                      >
                        Lvl {chord.difficulty}
                      </span>
                    </div>
                    <span className={`text-[11px] mt-1 ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                      {chord.type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Visual Chord Diagram Component
 * frets order: [highE (0), B (1), G (2), D (3), A (4), LowE (5)]
 */
const ChordDiagramBox: React.FC<{ chord: ChordDefinition; onPlay?: () => void }> = ({ chord }) => {
  const strings = [5, 4, 3, 2, 1, 0]; // Visual left-to-right: Low E to High E

  // Find min/max fret to determine base fret
  const playedFrets = chord.frets.filter((f) => f > 0);
  const maxFret = playedFrets.length > 0 ? Math.max(...playedFrets) : 3;
  const numFretsToDraw = Math.max(4, maxFret);

  return (
    <div className="w-56 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-inner flex flex-col items-center">
      {/* Nut Indicators: X (muted) or O (open) */}
      <div className="flex w-full justify-between px-2 mb-2">
        {strings.map((strIdx) => {
          const fret = chord.frets[strIdx];
          return (
            <div
              key={strIdx}
              className={`w-5 text-center font-mono font-bold text-xs ${
                fret === -1 ? 'text-rose-400' : fret === 0 ? 'text-emerald-400' : 'text-transparent'
              }`}
            >
              {fret === -1 ? '✕' : fret === 0 ? '○' : '·'}
            </div>
          );
        })}
      </div>

      {/* Fret Grid Box */}
      <div className="w-full relative border-t-4 border-stone-300 bg-stone-900/60 rounded-b">
        {/* Horizontal Fret Lines */}
        {Array.from({ length: numFretsToDraw }, (_, i) => i + 1).map((fretNum) => (
          <div
            key={fretNum}
            className="w-full h-8 border-b border-stone-600/80 flex items-center justify-between px-2 relative"
          >
            {fretNum === 1 && chord.baseFret && chord.baseFret > 1 && (
              <span className="absolute -left-6 text-[10px] font-mono text-slate-500">
                {chord.baseFret}fr
              </span>
            )}
          </div>
        ))}

        {/* Vertical Strings and Finger Dots */}
        <div className="absolute inset-0 flex justify-between px-2">
          {strings.map((strIdx) => {
            const fretVal = chord.frets[strIdx];
            const fingerVal = chord.fingers[strIdx];
            const stringColor = STRING_COLORS[strIdx];

            return (
              <div key={strIdx} className="relative w-5 flex justify-center">
                {/* Vertical wire */}
                <div className="w-0.5 h-full bg-stone-500/70" />

                {/* Finger Dot if pressed */}
                {fretVal > 0 && (
                  <div
                    className="absolute w-5 h-5 rounded-full bg-emerald-400 text-slate-950 font-black text-[11px] font-mono flex items-center justify-center shadow-md ring-2 ring-emerald-300"
                    style={{
                      top: `${(fretVal - 0.5) * 32 - 10}px`,
                    }}
                  >
                    {fingerVal || ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* String names at bottom */}
      <div className="flex w-full justify-between px-2 mt-2">
        {strings.map((strIdx) => (
          <div key={strIdx} className="w-5 text-center font-mono text-[10px] font-bold text-slate-500">
            {['e', 'B', 'G', 'D', 'A', 'E'][strIdx]}
          </div>
        ))}
      </div>
    </div>
  );
};
