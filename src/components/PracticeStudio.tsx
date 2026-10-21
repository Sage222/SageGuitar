import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  Zap,
  Award,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Search,
  CheckCircle2,
  Music,
  Flame,
  HelpCircle,
  Activity,
  Layers,
} from 'lucide-react';
import {
  PRACTICE_DRILLS,
  PracticeDrill,
  DrillCategory,
  PracticeNoteStep,
  convertDrillToSong,
} from '../data/practiceDrills';
import { Song, DetectedPitch } from '../types/guitar';
import { audioEngine } from '../utils/audioEngine';
import { STRING_COLORS, STRING_NAMES, CHORD_LIBRARY } from '../utils/guitarConstants';

interface PracticeStudioProps {
  detectedPitch: DetectedPitch | null;
  isMicActive: boolean;
  onPlayOnRunway: (song: Song) => void;
  onLogPracticeMinutes?: (minutes: number) => void;
}

const FRETS_COUNT = 15;
const FRET_MARKERS = [3, 5, 7, 9, 12, 15];

const CATEGORY_TABS: { id: DrillCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Exercises', icon: '🎸' },
  { id: 'scales', label: 'Scales & Soloing', icon: '🎼' },
  { id: 'dexterity', label: 'Spider & Dexterity', icon: '🕷️' },
  { id: 'picking', label: 'Picking & Articulation', icon: '⚡' },
  { id: 'chords', label: 'Chord Transitions', icon: '🤝' },
];

export const PracticeStudio: React.FC<PracticeStudioProps> = ({
  detectedPitch,
  isMicActive,
  onPlayOnRunway,
  onLogPracticeMinutes,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DrillCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDrillId, setActiveDrillId] = useState<string>(PRACTICE_DRILLS[0].id);

  // Stepper / Walkthrough state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isAutoWalking, setIsAutoWalking] = useState<boolean>(false);

  // Metronome & Speed Trainer state
  const [isMetronomeActive, setIsMetronomeActive] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(PRACTICE_DRILLS[0].defaultBpm);
  const [autoSpeedRamp, setAutoSpeedRamp] = useState<boolean>(false);
  const [currentBarBeat, setCurrentBarBeat] = useState<number>(0);
  const [barsCompleted, setBarsCompleted] = useState<number>(0);

  // Session timer
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [hasLoggedSession, setHasLoggedSession] = useState<boolean>(false);

  const activeDrill =
    PRACTICE_DRILLS.find((d) => d.id === activeDrillId) || PRACTICE_DRILLS[0];

  // Update BPM when active drill changes
  const handleSelectDrill = (drill: PracticeDrill) => {
    setActiveDrillId(drill.id);
    setCurrentStepIndex(0);
    setIsAutoWalking(false);
    setBpm(drill.defaultBpm);
    setBarsCompleted(0);
    setCurrentBarBeat(0);
  };

  // Practice session timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Metronome interval engine
  useEffect(() => {
    if (!isMetronomeActive) return;

    const intervalMs = (60 / bpm) * 1000;
    const interval = setInterval(() => {
      setCurrentBarBeat((prevBeat) => {
        const nextBeat = (prevBeat + 1) % 4;
        const isDownbeat = nextBeat === 0;
        audioEngine.playMetronomeClick(isDownbeat);

        if (isDownbeat) {
          setBarsCompleted((prevBars) => {
            const nextBars = prevBars + 1;
            // If Auto Speed Ramp is on, increase BPM by 5 every 4 bars (up to 200 max)
            if (autoSpeedRamp && nextBars > 0 && nextBars % 4 === 0) {
              setBpm((curBpm) => Math.min(200, curBpm + 5));
            }
            return nextBars;
          });
        }
        return nextBeat;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isMetronomeActive, bpm, autoSpeedRamp]);

  // Auto-walk notes engine
  useEffect(() => {
    if (!isAutoWalking || !activeDrill.notes.length) return;

    const intervalMs = (60 / bpm) * 1000;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        const next = (prev + 1) % activeDrill.notes.length;
        const note = activeDrill.notes[next];
        if (note) {
          audioEngine.playGuitarFret(note.stringIndex, note.fret, 1.2);
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isAutoWalking, bpm, activeDrill]);

  // Handle stepping
  const handleNextStep = () => {
    if (!activeDrill.notes.length) return;
    const next = (currentStepIndex + 1) % activeDrill.notes.length;
    setCurrentStepIndex(next);
    const note = activeDrill.notes[next];
    if (note) {
      audioEngine.playGuitarFret(note.stringIndex, note.fret, 1.2);
    }
  };

  const handlePrevStep = () => {
    if (!activeDrill.notes.length) return;
    const prev = (currentStepIndex - 1 + activeDrill.notes.length) % activeDrill.notes.length;
    setCurrentStepIndex(prev);
    const note = activeDrill.notes[prev];
    if (note) {
      audioEngine.playGuitarFret(note.stringIndex, note.fret, 1.2);
    }
  };

  const handlePlayCurrentNote = () => {
    const note = activeDrill.notes[currentStepIndex];
    if (note) {
      audioEngine.playGuitarFret(note.stringIndex, note.fret, 1.5);
    }
  };

  const handleLogPractice = () => {
    const minutes = Math.max(1, Math.round(sessionSeconds / 60));
    if (onLogPracticeMinutes) {
      onLogPracticeMinutes(minutes);
    }
    setHasLoggedSession(true);
    setTimeout(() => setHasLoggedSession(false), 3000);
  };

  // Filter drills list
  const filteredDrills = PRACTICE_DRILLS.filter((drill) => {
    const matchesCat = selectedCategory === 'all' || drill.category === selectedCategory;
    const matchesQuery =
      drill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const activeStepNote = activeDrill.notes[currentStepIndex];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-2">
            <Flame className="w-4 h-4 text-emerald-500" />
            <span className="font-bold tracking-wider uppercase">Guitar Workout & Scale Trainer</span>
            <span aria-hidden="true">·</span>
            <span>Beginner to Advanced</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Scales, Spider Walks & Finger Mechanics
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Build unshakeable finger independence, master rock & blues scales on the fretboard, and eliminate fret buzz.
            Step through drills at your own pace with the interactive walker, practice with the built-in metronome ramp,
            or load any exercise directly onto the 3D perspective Runway!
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Practice Session: {Math.floor(sessionSeconds / 60)}m {sessionSeconds % 60}s
            </span>
            <button
              onClick={handleLogPractice}
              className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition font-bold"
            >
              {hasLoggedSession ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Logged to Streak!</span>
                </>
              ) : (
                <>
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Log Practice Time</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Launch CTA */}
        <div className="flex flex-col gap-2 shrink-0 self-stretch md:self-auto">
          <button
            onClick={() => onPlayOnRunway(convertDrillToSong(activeDrill))}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2.5 transition shadow-xl shadow-emerald-500/25 active:scale-95"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Play On 3D Runway</span>
          </button>
          <span className="text-[11px] text-center text-slate-400 font-mono">
            {activeDrill.title} ({activeDrill.defaultBpm} BPM)
          </span>
        </div>
      </div>

      {/* Main Practice Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Top Main Exercise Arena (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Active Exercise Detail Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {activeDrill.category.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Difficulty: {'★'.repeat(activeDrill.difficulty)}
                    {'☆'.repeat(5 - activeDrill.difficulty)}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">· Key: {activeDrill.key}</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">{activeDrill.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{activeDrill.subtitle}</p>
              </div>

              {/* Direct Runway Action */}
              <button
                onClick={() => onPlayOnRunway(convertDrillToSong(activeDrill))}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition self-start sm:self-auto shrink-0 shadow-md"
              >
                <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                <span>Launch Runway Mode</span>
              </button>
            </div>

            {/* Description & Ergonomics / Technique Callout */}
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-300 leading-relaxed">{activeDrill.description}</p>
              <div className="bg-emerald-950/25 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-3">
                <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="text-emerald-300 font-semibold">Pro Technique & Ergonomics: </strong>
                  <span className="text-slate-300">{activeDrill.techniqueTip}</span>
                </div>
              </div>
            </div>

            {/* Visual Interactive Fretboard Visualizer */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fretboard Position Map</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Click any highlighted fret to hear tone
                </span>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="min-w-[760px] relative bg-stone-900 border-2 border-stone-800 rounded-xl p-4 shadow-inner">
                  {/* Fret numbers indicator */}
                  <div className="flex text-[11px] font-mono text-slate-500 mb-2 pl-12 pr-2">
                    <div className="w-10 text-center font-bold text-emerald-500">Nut (0)</div>
                    {Array.from({ length: FRETS_COUNT }, (_, i) => i + 1).map((fret) => (
                      <div key={fret} className="flex-1 text-center">
                        {fret}
                      </div>
                    ))}
                  </div>

                  {/* 6 Strings */}
                  <div className="flex flex-col gap-3 relative py-1">
                    {[0, 1, 2, 3, 4, 5].map((stringIndex) => {
                      const stringColor = STRING_COLORS[stringIndex];
                      const stringThickness = 1.2 + (5 - stringIndex) * 0.55;

                      // Find drill notes that fall on this string
                      const notesOnThisString = activeDrill.notes.filter(
                        (n) => n.stringIndex === stringIndex
                      );

                      return (
                        <div key={stringIndex} className="relative flex items-center h-8">
                          {/* String Name */}
                          <div className="w-12 shrink-0 flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: stringColor }}
                            />
                            <span>{STRING_NAMES[stringIndex].split(' ')[0]}</span>
                          </div>

                          {/* Physical metallic guitar string */}
                          <div
                            className="absolute left-12 right-2 rounded-full pointer-events-none opacity-85 shadow"
                            style={{
                              height: `${stringThickness}px`,
                              backgroundColor: stringColor,
                              boxShadow: `0 0 6px ${stringColor}33`,
                            }}
                          />

                          {/* Fret 0 / Open String Nut */}
                          <div className="w-10 shrink-0 flex items-center justify-center relative z-10">
                            {(() => {
                              const openNote = notesOnThisString.find((n) => n.fret === 0);
                              const isActiveStep =
                                activeStepNote &&
                                activeStepNote.stringIndex === stringIndex &&
                                activeStepNote.fret === 0;

                              if (openNote) {
                                return (
                                  <button
                                    onClick={() => audioEngine.playGuitarFret(stringIndex, 0, 1.4)}
                                    className={`w-7 h-7 rounded-full flex flex-col items-center justify-center text-[10px] font-bold font-mono transition-transform hover:scale-110 shadow-md ${
                                      isActiveStep
                                        ? 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-400/50 animate-pulse'
                                        : 'bg-emerald-500/30 text-emerald-300 border border-emerald-400'
                                    }`}
                                  >
                                    <span>{openNote.noteName}</span>
                                  </button>
                                );
                              }
                              return (
                                <button
                                  onClick={() => audioEngine.playGuitarFret(stringIndex, 0, 1.4)}
                                  className="w-4 h-4 rounded-full border border-stone-700 hover:border-slate-400 hover:bg-slate-700/50 transition opacity-40 hover:opacity-100"
                                  title={`Open ${STRING_NAMES[stringIndex]}`}
                                />
                              );
                            })()}
                          </div>

                          {/* Frets 1 to 15 */}
                          <div className="flex-1 flex items-center relative z-10 pl-2">
                            {Array.from({ length: FRETS_COUNT }, (_, i) => i + 1).map((fret) => {
                              const matchingStepNotes = notesOnThisString.filter((n) => n.fret === fret);
                              const noteInDrill = matchingStepNotes[0];
                              const isActiveStep =
                                activeStepNote &&
                                activeStepNote.stringIndex === stringIndex &&
                                activeStepNote.fret === fret;

                              return (
                                <div
                                  key={fret}
                                  className="flex-1 flex items-center justify-center relative h-8 border-r border-stone-700/70"
                                >
                                  {/* Inlay fret markers on fretboard */}
                                  {stringIndex === 2 && FRET_MARKERS.includes(fret) && (
                                    <div
                                      className={`absolute pointer-events-none rounded-full bg-stone-600/40 ${
                                        fret === 12 ? 'w-2 h-2 -top-1' : 'w-2.5 h-2.5'
                                      }`}
                                    />
                                  )}
                                  {stringIndex === 3 && fret === 12 && (
                                    <div className="absolute pointer-events-none rounded-full bg-stone-600/40 w-2 h-2 top-3" />
                                  )}

                                  {noteInDrill ? (
                                    <button
                                      onClick={() =>
                                        audioEngine.playGuitarFret(stringIndex, fret, 1.4)
                                      }
                                      className={`w-7 h-7 rounded-full flex flex-col items-center justify-center text-[10px] font-bold font-mono transition-transform hover:scale-125 shadow-lg ${
                                        isActiveStep
                                          ? 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-400/60 scale-110 z-20 font-extrabold animate-bounce'
                                          : noteInDrill.degree?.includes('Root')
                                          ? 'bg-emerald-500 text-slate-950 border-2 border-white font-black'
                                          : noteInDrill.degree?.includes('Blue')
                                          ? 'bg-sky-500 text-slate-950 border-2 border-white font-black'
                                          : 'bg-slate-800 text-slate-100 border border-slate-600 hover:border-emerald-400'
                                      }`}
                                      title={`${noteInDrill.noteName} (Fret ${fret}, Finger ${noteInDrill.finger || 'Open'})`}
                                    >
                                      <span>{noteInDrill.noteName}</span>
                                      {noteInDrill.finger > 0 && (
                                        <span className="text-[8px] opacity-80 leading-none">
                                          f{noteInDrill.finger}
                                        </span>
                                      )}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => audioEngine.playGuitarFret(stringIndex, fret, 1.0)}
                                      className="w-2 h-2 rounded-full bg-transparent hover:bg-slate-600/50 transition"
                                    />
                                  )}
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
            </div>

            {/* Stepper / Sequential Note Walk Controller */}
            {activeDrill.notes.length > 0 && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Note-by-Note Walkthrough:</span>
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      Step {currentStepIndex + 1} of {activeDrill.notes.length}
                    </span>
                  </div>

                  {/* Stepper Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevStep}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                      title="Previous Note"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsAutoWalking(!isAutoWalking)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                        isAutoWalking
                          ? 'bg-rose-500 text-white hover:bg-rose-600'
                          : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      }`}
                    >
                      {isAutoWalking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isAutoWalking ? 'Pause Walk' : 'Auto Walk'}</span>
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                      title="Next Note"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStepIndex(0);
                        setIsAutoWalking(false);
                      }}
                      className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-lg transition"
                      title="Reset to Step 1"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Current Spotlight Note Details */}
                {activeStepNote && (
                  <div className="bg-slate-900 border border-slate-800/90 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold font-mono text-sm text-slate-950 shadow-md"
                        style={{ backgroundColor: STRING_COLORS[activeStepNote.stringIndex] }}
                      >
                        <span>{activeStepNote.noteName}</span>
                        <span className="text-[9px] leading-none opacity-80">
                          {activeStepNote.octave}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">
                          String {activeStepNote.stringIndex + 1} ({STRING_NAMES[activeStepNote.stringIndex]}) · Fret {activeStepNote.fret}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Finger:{' '}
                          <strong className="text-emerald-400">
                            {activeStepNote.finger === 1
                              ? '1 (Index)'
                              : activeStepNote.finger === 2
                              ? '2 (Middle)'
                              : activeStepNote.finger === 3
                              ? '3 (Ring)'
                              : activeStepNote.finger === 4
                              ? '4 (Pinky)'
                              : 'Open String'}
                          </strong>{' '}
                          {activeStepNote.pickDirection && (
                            <>
                              · Stroke:{' '}
                              <strong className="text-sky-400">
                                {activeStepNote.pickDirection === 'down' ? '↓ Downstroke' : '↑ Upstroke'}
                              </strong>
                            </>
                          )}
                          {activeStepNote.degree && (
                            <>
                              {' '}
                              · Scale Degree:{' '}
                              <strong className="text-emerald-400">{activeStepNote.degree}</strong>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handlePlayCurrentNote}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Hear Note</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Chord Progression Display for Chord Exercises */}
            {activeDrill.category === 'chords' && activeDrill.chordProgression && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Chord Transition Sequence (Strum each for 4 beats):</span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {activeDrill.chordProgression.map((chord, idx) => {
                    const chordDef = CHORD_LIBRARY[chord];
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (chordDef) {
                            audioEngine.playGuitarChord(chordDef.frets, 'down', 2.0);
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-sm font-bold font-mono text-white flex items-center gap-2 hover:border-emerald-400 transition"
                      >
                        <span className="text-emerald-400 text-xs">#{idx + 1}</span>
                        <span>{chord}</span>
                        <Volume2 className="w-3 h-3 text-slate-400" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Speed Trainer & Metronome Engine + Drills List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Metronome & Speed Ramp Engine Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Speed Trainer & Metronome</h3>
              </div>
              <button
                onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition ${
                  isMetronomeActive
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                }`}
              >
                {isMetronomeActive ? 'STOP CLICK' : 'START CLICK'}
              </button>
            </div>

            {/* Metronome Beat Pulse Visualizer */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
              {[0, 1, 2, 3].map((beatNum) => {
                const isCurrent = isMetronomeActive && currentBarBeat === beatNum;
                const isAccent = beatNum === 0;

                return (
                  <div
                    key={beatNum}
                    className={`flex-1 flex flex-col items-center justify-center py-2 mx-1 rounded-lg transition-all ${
                      isCurrent
                        ? isAccent
                          ? 'bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-400/30 scale-105'
                          : 'bg-emerald-500 text-slate-950 font-bold scale-105'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold">Beat {beatNum + 1}</span>
                    <span className="text-[10px] opacity-80">{isAccent ? 'Accent' : 'Tick'}</span>
                  </div>
                );
              })}
            </div>

            {/* BPM Slider & Quick Presets */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Tempo:</span>
                <span className="font-mono text-base font-extrabold text-emerald-400">{bpm} BPM</span>
              </div>
              <input
                type="range"
                min="40"
                max="200"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
              />

              {/* Tempo Presets */}
              <div className="flex items-center justify-between gap-1 pt-1">
                {[50, 65, 80, 100, 120, 140].map((presetBpm) => (
                  <button
                    key={presetBpm}
                    onClick={() => setBpm(presetBpm)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition ${
                      bpm === presetBpm
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                    }`}
                  >
                    {presetBpm}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-Speed Ramp Toggle */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Auto Speed Ramp (+5 BPM / 4 bars)</span>
                </span>
                <input
                  type="checkbox"
                  checked={autoSpeedRamp}
                  onChange={(e) => setAutoSpeedRamp(e.target.checked)}
                  className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
              {autoSpeedRamp && (
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-850">
                  <span>Bars played: {barsCompleted}</span>
                  <span className="text-emerald-400 font-bold">
                    Next boost in: {4 - (barsCompleted % 4)} bars
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Selection Catalog */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Exercise Library ({filteredDrills.length})</h3>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Search drills, scales, chords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1">
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Drills List */}
            <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredDrills.map((drill) => {
                const isSelected = drill.id === activeDrill.id;

                return (
                  <div
                    key={drill.id}
                    onClick={() => handleSelectDrill(drill)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                        : 'bg-slate-950/60 hover:bg-slate-850/80 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {drill.title}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {'★'.repeat(drill.difficulty)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1">{drill.subtitle}</p>

                    <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500">
                      <span>{drill.defaultBpm} BPM</span>
                      <span className="text-slate-400 capitalize">{drill.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
