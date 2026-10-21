import React, { useState, useEffect } from 'react';
import { Volume2, Mic, MicOff, Sliders, CheckCircle2, Music2 } from 'lucide-react';
import { STANDARD_TUNING, frequencyToNote } from '../utils/guitarConstants';
import { audioEngine } from '../utils/audioEngine';
import { DetectedPitch, StandardTuningString } from '../types/guitar';

interface TunerProps {
  isMicActive: boolean;
  onToggleMic: () => void;
  detectedPitch: DetectedPitch | null;
  rmsLevel: number;
}

export const Tuner: React.FC<TunerProps> = ({
  isMicActive,
  onToggleMic,
  detectedPitch,
  rmsLevel,
}) => {
  const [selectedStringIndex, setSelectedStringIndex] = useState<number | null>(null); // null = Auto
  const [noiseThreshold, setNoiseThreshold] = useState(0.015);
  const [showSettings, setShowSettings] = useState(false);

  // In-tune stabilization timer
  const [inTuneCount, setInTuneCount] = useState(0);

  // Determine current active target string
  let targetString: StandardTuningString = STANDARD_TUNING[5]; // default Low E

  if (selectedStringIndex !== null) {
    targetString = STANDARD_TUNING[selectedStringIndex];
  } else if (detectedPitch) {
    // Find closest guitar string in standard tuning
    let closestDist = Infinity;
    for (const str of STANDARD_TUNING) {
      const dist = Math.abs(detectedPitch.freq - str.targetFreq);
      if (dist < closestDist) {
        closestDist = dist;
        targetString = str;
      }
    }
  }

  // Calculate cents difference relative to current targetString
  let centsOffset = 0;
  let isInTune = false;

  if (detectedPitch && detectedPitch.freq > 0) {
    // Exact cents from target frequency
    const targetFreq = targetString.targetFreq;
    centsOffset = Math.round(1200 * Math.log2(detectedPitch.freq / targetFreq));
    // Clamp to -50..+50 for display gauge
    if (centsOffset > 50) centsOffset = 50;
    if (centsOffset < -50) centsOffset = -50;

    isInTune = Math.abs(centsOffset) <= 4;
  }

  useEffect(() => {
    if (isInTune) {
      setInTuneCount((prev) => Math.min(prev + 1, 20));
    } else {
      setInTuneCount(0);
    }
  }, [isInTune, detectedPitch]);

  const handlePlayReference = (stringObj: StandardTuningString) => {
    audioEngine.playGuitarPluck(stringObj.targetFreq, 2.5, 0.6);
  };

  const handleSensitivityChange = (val: number) => {
    setNoiseThreshold(val);
    audioEngine.setNoiseThreshold(val);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Music2 className="w-5 h-5 text-emerald-400" />
            Standard Guitar Tuner (E A D G B E)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pluck any string on your guitar. The needle shows cents offset in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              showSettings
                ? 'bg-slate-800 text-white border-slate-700'
                : 'text-slate-400 hover:text-white border-slate-800 bg-slate-950/40'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Settings
          </button>

          <button
            onClick={onToggleMic}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
              isMicActive
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 shadow-md shadow-emerald-500/20'
            }`}
          >
            {isMicActive ? (
              <>
                <MicOff className="w-4 h-4" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start Tuner Mic
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mic sensitivity popover / section */}
      {showSettings && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-1/2">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
              <span>Mic Noise Gate Threshold</span>
              <span>{Math.round(noiseThreshold * 1000) / 10}%</span>
            </div>
            <input
              type="range"
              min="0.003"
              max="0.06"
              step="0.002"
              value={noiseThreshold}
              onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <span className="text-[11px] text-slate-500 block mt-1">
              Lower threshold for quiet acoustic pluck, increase if room noise interferes.
            </span>
          </div>

          <div className="w-full md:w-1/3 flex flex-col gap-1">
            <span className="text-xs text-slate-400 font-mono">Input Signal Level</span>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-75 ${
                  rmsLevel > noiseThreshold ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
                style={{ width: `${Math.min(100, rmsLevel * 400)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {rmsLevel > noiseThreshold ? 'Signal active' : 'Awaiting guitar pluck...'}
            </span>
          </div>
        </div>
      )}

      {/* Main Tuner Stage */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 relative overflow-hidden shadow-2xl flex flex-col items-center">
        {/* String Selection Strip */}
        <div className="flex items-center justify-center flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedStringIndex(null)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedStringIndex === null
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Auto Detect
          </button>

          {STANDARD_TUNING.slice().reverse().map((str) => {
            const isSelected = selectedStringIndex === str.stringIndex;
            const isCurrentTarget = targetString.stringIndex === str.stringIndex;
            return (
              <button
                key={str.stringIndex}
                onClick={() => setSelectedStringIndex(str.stringIndex)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 border transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-bold'
                    : isCurrentTarget
                    ? 'bg-slate-800 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: str.color }}
                />
                <span>{str.label}</span>
              </button>
            );
          })}
        </div>

        {/* Central Tuner Gauge Dial */}
        <div className="w-full max-w-md relative flex flex-col items-center">
          {/* Cents Arc Display */}
          <div className="w-72 h-36 relative overflow-hidden flex items-end justify-center">
            {/* Dial background arc tick marks */}
            <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
              {/* Arc track */}
              <path
                d="M 20 95 A 80 80 0 0 1 180 95"
                fill="none"
                stroke="#1E293B"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Green sweet spot arc */}
              <path
                d="M 94 15 A 80 80 0 0 1 106 15"
                fill="none"
                stroke="#10B981"
                strokeWidth="12"
                strokeLinecap="round"
              />

              {/* Ticks */}
              {[-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50].map((tick) => {
                const angleDeg = (tick / 50) * 70; // -70 to +70 deg
                const rad = (angleDeg - 90) * (Math.PI / 180);
                const x1 = 100 + 72 * Math.cos(rad);
                const y1 = 95 + 72 * Math.sin(rad);
                const x2 = 100 + 82 * Math.cos(rad);
                const y2 = 95 + 82 * Math.sin(rad);
                return (
                  <line
                    key={tick}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={tick === 0 ? '#10B981' : '#475569'}
                    strokeWidth={tick === 0 ? 3 : 1.5}
                  />
                );
              })}

              {/* Indicator Needle */}
              {isMicActive && (
                <g
                  style={{
                    transformOrigin: '100px 95px',
                    transform: `rotate(${(centsOffset / 50) * 70}deg)`,
                    transition: 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <line
                    x1="100"
                    y1="95"
                    x2="100"
                    y2="20"
                    stroke={
                      isInTune ? '#10B981' : Math.abs(centsOffset) > 20 ? '#F43F5E' : '#F59E0B'
                    }
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="100" cy="95" r="6" fill="#F8FAFC" />
                </g>
              )}
            </svg>
          </div>

          {/* Large Note Name Readout */}
          <div className="mt-4 flex flex-col items-center">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-6xl font-extrabold tracking-tight transition-colors font-mono ${
                  isInTune
                    ? 'text-emerald-400'
                    : Math.abs(centsOffset) > 20
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {detectedPitch ? detectedPitch.noteName : targetString.noteName}
              </span>
              <span className="text-2xl font-bold text-slate-500 font-mono">
                {detectedPitch ? detectedPitch.octave : targetString.octave}
              </span>
            </div>

            {/* In Tune or Cents Status Pill-free text */}
            <div className="mt-2 text-center h-8">
              {!isMicActive ? (
                <span className="text-xs text-slate-500">Microphone paused — click Start to tune</span>
              ) : inTuneCount > 3 ? (
                <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>IN TUNE (±0 Cents)</span>
                </div>
              ) : detectedPitch ? (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span
                    className={
                      centsOffset < 0
                        ? 'text-amber-400 font-semibold'
                        : centsOffset > 0
                        ? 'text-rose-400 font-semibold'
                        : 'text-emerald-400 font-semibold'
                    }
                  >
                    {centsOffset < 0 ? `${centsOffset} cents (FLAT)` : centsOffset > 0 ? `+${centsOffset} cents (SHARP)` : 'PERFECT'}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{detectedPitch.freq.toFixed(1)} Hz</span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 animate-pulse">Pluck a string now...</span>
              )}
            </div>

            <div className="text-[12px] text-slate-500 font-mono mt-1">
              Target: {targetString.label} ({targetString.targetFreq.toFixed(1)} Hz)
            </div>
          </div>
        </div>

        {/* 6 Guitar String Pegs with Audio Reference plucker */}
        <div className="w-full mt-10 pt-6 border-t border-slate-800/80">
          <div className="text-center text-xs text-slate-400 font-medium mb-4">
            Hear reference pitch tone for each string:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {STANDARD_TUNING.slice().reverse().map((str) => (
              <button
                key={str.stringIndex}
                onClick={() => handlePlayReference(str)}
                className="group p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all flex flex-col items-center gap-1.5"
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: str.color }}
                  />
                  <Volume2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="text-lg font-bold text-white font-mono">{str.shortName}</div>
                <div className="text-[11px] text-slate-500 font-mono">{str.targetFreq} Hz</div>
                <div className="text-[10px] text-slate-600 font-mono">{str.gauge}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
