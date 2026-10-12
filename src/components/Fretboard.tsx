import React, { useState } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import {
  STRING_COLORS,
  STRING_NAMES,
  getFretNoteInfo,
  GUITAR_SCALES,
  CHORD_LIBRARY,
} from '../utils/guitarConstants';
import { audioEngine } from '../utils/audioEngine';
import { DetectedPitch } from '../types/guitar';

interface FretboardProps {
  detectedPitch: DetectedPitch | null;
  activeTargetNote?: { stringIndex: number; fret: number } | null;
  selectedChordName?: string | null;
}

const FRETS_COUNT = 15;
const FRET_MARKERS = [3, 5, 7, 9, 12, 15];

export const Fretboard: React.FC<FretboardProps> = ({
  detectedPitch,
  activeTargetNote,
  selectedChordName,
}) => {
  const [selectedScaleId, setSelectedScaleId] = useState<string>('none');
  const [activeFretHover, setActiveFretHover] = useState<{ stringIndex: number; fret: number } | null>(null);

  const selectedScale = GUITAR_SCALES.find((s) => s.id === selectedScaleId);
  const chordDef = selectedChordName ? CHORD_LIBRARY[selectedChordName] : null;

  const handlePlayFret = (stringIndex: number, fret: number) => {
    audioEngine.playGuitarFret(stringIndex, fret, 1.8);
  };

  return (
    <div className="w-full flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      {/* Fretboard Header & Scale Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Interactive Guitar Fretboard</span>
            {detectedPitch && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Live Pluck: {detectedPitch.noteName}
                {detectedPitch.octave} ({detectedPitch.freq}Hz)
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any fret to play a note. Active song targets and live microphone plucks illuminate automatically.
          </p>
        </div>

        {/* Scale selector */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <span className="text-xs text-slate-400 font-medium">Highlight Scale:</span>
          <select
            value={selectedScaleId}
            onChange={(e) => setSelectedScaleId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
          >
            <option value="none">None (Standard)</option>
            {GUITAR_SCALES.map((scale) => (
              <option key={scale.id} value={scale.id}>
                {scale.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fretboard Canvas / Visualizer */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[850px] relative bg-stone-900 border-2 border-stone-800 rounded-xl p-4 shadow-inner">
          {/* Wood grain feel background */}
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 opacity-90 rounded-xl pointer-events-none" />

          {/* Fret number indicators on top */}
          <div className="flex text-[11px] font-mono text-slate-500 mb-2 pl-12 pr-2">
            <div className="w-10 text-center font-bold text-amber-500">Nut (0)</div>
            {Array.from({ length: FRETS_COUNT }, (_, i) => i + 1).map((fret) => (
              <div key={fret} className="flex-1 text-center">
                {fret}
              </div>
            ))}
          </div>

          {/* 6 Guitar Strings (from 0 = High E to 5 = Low E) */}
          <div className="flex flex-col gap-3 relative py-2">
            {[0, 1, 2, 3, 4, 5].map((stringIndex) => {
              const stringColor = STRING_COLORS[stringIndex];
              const stringThickness = 1.2 + (5 - stringIndex) * 0.55; // thicker for low strings

              return (
                <div key={stringIndex} className="relative flex items-center h-8">
                  {/* String label on left */}
                  <div className="w-12 shrink-0 flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: stringColor }}
                    />
                    <span>{['e', 'B', 'G', 'D', 'A', 'E'][stringIndex]}</span>
                  </div>

                  {/* Nut & Frets */}
                  <div className="flex-1 flex relative items-center">
                    {/* Metal string wire going through the middle */}
                    <div
                      className="absolute inset-x-0 bg-gradient-to-r from-stone-400 via-stone-300 to-stone-400 shadow-sm pointer-events-none z-0"
                      style={{ height: `${stringThickness}px` }}
                    />

                    {/* Fret 0 (Nut / Open string button) */}
                    <div className="w-10 shrink-0 flex justify-center z-10">
                      {(() => {
                        const info = getFretNoteInfo(stringIndex, 0);
                        const isLiveDetected =
                          detectedPitch &&
                          detectedPitch.noteName === info.noteName &&
                          detectedPitch.octave === info.octave;
                        const isTarget =
                          activeTargetNote &&
                          activeTargetNote.stringIndex === stringIndex &&
                          activeTargetNote.fret === 0;
                        const isChordFret = chordDef && chordDef.frets[stringIndex] === 0;

                        return (
                          <button
                            onClick={() => handlePlayFret(stringIndex, 0)}
                            className={`w-7 h-7 rounded-full text-[11px] font-mono font-bold flex items-center justify-center transition-all ${
                              isLiveDetected
                                ? 'bg-emerald-400 text-slate-950 scale-125 ring-4 ring-emerald-400/40 shadow-lg'
                                : isTarget
                                ? 'bg-amber-400 text-slate-950 scale-110 ring-2 ring-amber-400 shadow-md animate-pulse'
                                : isChordFret
                                ? 'bg-sky-400 text-slate-950 ring-2 ring-sky-300 shadow-md'
                                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-700'
                            }`}
                            title={`Open ${info.noteName}${info.octave}`}
                          >
                            {isChordFret ? 'O' : info.noteName}
                          </button>
                        );
                      })()}
                    </div>

                    {/* Fret separators (fret wires) & Fret 1..15 buttons */}
                    {Array.from({ length: FRETS_COUNT }, (_, i) => i + 1).map((fret) => {
                      const info = getFretNoteInfo(stringIndex, fret);
                      const isScaleNote = selectedScale && selectedScale.notes.includes(info.noteName);
                      const isScaleRoot = selectedScale && selectedScale.root === info.noteName;
                      const isLiveDetected =
                        detectedPitch &&
                        detectedPitch.noteName === info.noteName &&
                        detectedPitch.octave === info.octave;
                      const isTarget =
                        activeTargetNote &&
                        activeTargetNote.stringIndex === stringIndex &&
                        activeTargetNote.fret === fret;
                      const isChordFret = chordDef && chordDef.frets[stringIndex] === fret;

                      return (
                        <div
                          key={fret}
                          className="flex-1 flex justify-center items-center relative border-r-2 border-stone-600/80 h-8 z-10"
                        >
                          {/* Dot inlay markers on frets 3, 5, 7, 9, 12, 15 */}
                          {stringIndex === 2 && FRET_MARKERS.includes(fret) && (
                            <div
                              className={`absolute pointer-events-none rounded-full bg-stone-500/30 ${
                                fret === 12 ? 'w-2 h-2 top-0' : 'w-2.5 h-2.5'
                              }`}
                            />
                          )}
                          {stringIndex === 4 && fret === 12 && (
                            <div className="absolute pointer-events-none rounded-full bg-stone-500/30 w-2 h-2 bottom-0" />
                          )}

                          {/* Fret button */}
                          <button
                            onClick={() => handlePlayFret(stringIndex, fret)}
                            onMouseEnter={() => setActiveFretHover({ stringIndex, fret })}
                            onMouseLeave={() => setActiveFretHover(null)}
                            className={`w-6 h-6 rounded-full text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
                              isLiveDetected
                                ? 'bg-emerald-400 text-slate-950 scale-125 ring-4 ring-emerald-400/50 shadow-lg z-20'
                                : isTarget
                                ? 'bg-amber-400 text-slate-950 scale-110 ring-2 ring-amber-400 shadow-md animate-pulse z-20'
                                : isChordFret
                                ? 'bg-sky-400 text-slate-950 ring-2 ring-sky-300 font-extrabold z-20'
                                : isScaleRoot
                                ? 'bg-rose-500 text-white ring-2 ring-rose-400 shadow'
                                : isScaleNote
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/40'
                                : 'bg-transparent text-transparent hover:bg-slate-800/80 hover:text-slate-200'
                            }`}
                            title={`Fret ${fret}: ${info.noteName}${info.octave}`}
                          >
                            {isChordFret
                              ? chordDef.fingers[stringIndex] || info.noteName
                              : info.noteName}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend & Hover Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
            <span>Live Pluck</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            <span>Song Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-400 inline-block" />
            <span>Chord Shape</span>
          </div>
          {selectedScale && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span>Root ({selectedScale.root})</span>
            </div>
          )}
        </div>

        {activeFretHover && (
          <div className="text-slate-300 font-bold">
            Fret {activeFretHover.fret} · String {STRING_NAMES[activeFretHover.stringIndex]} · Note{' '}
            {getFretNoteInfo(activeFretHover.stringIndex, activeFretHover.fret).noteName}
          </div>
        )}
      </div>
    </div>
  );
};
