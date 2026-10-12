import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  Award,
  Music,
  CheckCircle2,
  XCircle,
  Mic,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { Song, GuitarStringNote, GuitarChordEvent, DetectedPitch, PerformanceStats } from '../types/guitar';
import { STRING_COLORS, STRING_NAMES, CHORD_LIBRARY } from '../utils/guitarConstants';
import { audioEngine } from '../utils/audioEngine';

interface SongPlayerProps {
  song: Song;
  detectedPitch: DetectedPitch | null;
  isMicActive: boolean;
  onToggleMic: () => void;
  onBackToCatalog: () => void;
  onNextSong?: () => void;
  onSongComplete?: (score: number, accuracy: number, stars: number, hitsCount: number, duration: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export const SongPlayer: React.FC<SongPlayerProps> = ({
  song,
  detectedPitch,
  isMicActive,
  onToggleMic,
  onBackToCatalog,
  onNextSong,
  onSongComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [prepDelay, setPrepDelay] = useState<number | null>(null); // remaining delay in seconds (4s preview before scrolling)
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [customBpm, setCustomBpm] = useState<number>(song.bpm);
  const [activeBeatInBar, setActiveBeatInBar] = useState<number>(0);
  const [displayScale, setDisplayScale] = useState<'standard' | 'large' | 'tablet'>('large');
  const [isMetronomeEnabled, setIsMetronomeEnabled] = useState(false);
  const [isBackingEnabled, setIsBackingEnabled] = useState(false);
  const [isGuideMelodyEnabled, setIsGuideMelodyEnabled] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Performance scoring
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [greatCount, setGreatCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<{ text: string; color: string; id: number } | null>(null);
  const completionRecordedRef = useRef(false);

  // Note clone state with hit statuses
  const leadNotesRef = useRef<GuitarStringNote[]>(
    (song.leadNotes || []).map((n) => ({ ...n, hitState: 'pending' }))
  );
  const chordEventsRef = useRef<GuitarChordEvent[]>(
    (song.chordEvents || []).map((c) => ({ ...c, hitState: 'pending' }))
  );

  // Visual particles for explosions
  const particlesRef = useRef<Particle[]>([]);

  // Timing refs
  const lastTimeRef = useRef<number>(performance.now());
  const lastBeatRef = useRef<number>(-1);
  const currentTimeRef = useRef<number>(0);
  currentTimeRef.current = currentTime;

  const effectiveSpeed = (customBpm / song.bpm) * playbackSpeed;
  const effectiveBpm = Math.max(40, Math.min(260, Math.round(customBpm * playbackSpeed)));

  // Reset song on change
  useEffect(() => {
    if (prepTimerRef.current) {
      clearInterval(prepTimerRef.current);
      prepTimerRef.current = null;
    }
    setPrepDelay(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setCustomBpm(song.bpm);
    setPlaybackSpeed(1.0);
    setActiveBeatInBar(0);
    setIsFinished(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setPerfectCount(0);
    setGreatCount(0);
    setMissCount(0);
    setLastFeedback(null);
    completionRecordedRef.current = false;
    leadNotesRef.current = (song.leadNotes || []).map((n) => ({ ...n, hitState: 'pending' }));
    chordEventsRef.current = (song.chordEvents || []).map((c) => ({ ...c, hitState: 'pending' }));
    lastBeatRef.current = -1;
  }, [song]);

  // Clean up prep delay timer
  useEffect(() => {
    return () => {
      if (prepTimerRef.current) {
        clearInterval(prepTimerRef.current);
      }
    };
  }, []);

  // 4-Second Preparation Delay before music starts scrolling
  // Allows user to see upcoming notes statically on the runway and position fingers
  const startWithDelay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    // If starting from 0, initiate the 4-second delay so user can inspect upcoming notes
    if (currentTime === 0) {
      setPrepDelay(4);

      let currentCount = 4;
      if (prepTimerRef.current) clearInterval(prepTimerRef.current);

      prepTimerRef.current = setInterval(() => {
        currentCount -= 1;
        if (currentCount > 0) {
          setPrepDelay(currentCount);
        } else {
          if (prepTimerRef.current) clearInterval(prepTimerRef.current);
          prepTimerRef.current = null;
          setPrepDelay(null);
          lastTimeRef.current = performance.now();
          setIsPlaying(true);
        }
      }, 1000);
    } else {
      lastTimeRef.current = performance.now();
      setIsPlaying(true);
    }
  };

  // Immediate start bypassing the remainder of the 4s delay
  const skipDelay = () => {
    if (prepTimerRef.current) {
      clearInterval(prepTimerRef.current);
      prepTimerRef.current = null;
    }
    setPrepDelay(null);
    lastTimeRef.current = performance.now();
    setIsPlaying(true);
  };

  // Handle Note Hit detection from real-time microphone or virtual tap
  const registerHit = (index: number, mode: 'lead' | 'chord', rating: 'perfect' | 'great') => {
    const points = rating === 'perfect' ? 100 : 75;
    const multiplier = streak >= 20 ? 4 : streak >= 10 ? 3 : streak >= 5 ? 2 : 1;

    setScore((prev) => prev + points * multiplier);
    setStreak((prev) => {
      const next = prev + 1;
      setMaxStreak((m) => Math.max(m, next));
      return next;
    });

    if (rating === 'perfect') {
      setPerfectCount((c) => c + 1);
    } else {
      setGreatCount((c) => c + 1);
    }

    setLastFeedback({
      text: `${rating.toUpperCase()}! ${multiplier > 1 ? `${multiplier}x` : ''}`,
      color: rating === 'perfect' ? '#10B981' : '#38BDF8',
      id: Date.now(),
    });

    audioEngine.playHitSound(rating);

    // Spawn canvas particles at hit line
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const hitX = 140;
      let hitY = canvas.height / 2;

      if (mode === 'lead' && leadNotesRef.current[index]) {
        const strIdx = leadNotesRef.current[index].stringIndex;
        hitY = 40 + strIdx * ((canvas.height - 70) / 6) + 16;
      }

      for (let i = 0; i < 18; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        particlesRef.current.push({
          x: hitX,
          y: hitY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: rating === 'perfect' ? '#10B981' : '#38BDF8',
          alpha: 1,
          size: Math.random() * 4 + 2,
        });
      }
    }
  };

  // Evaluate note matches from microphone during playback
  useEffect(() => {
    if (!isPlaying || !isMicActive || !detectedPitch) return;

    const t = currentTimeRef.current;
    const hitTolerance = 0.22; // 220ms hit window

    if (song.mode === 'lead') {
      const notes = leadNotesRef.current;
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        if (note.hitState !== 'pending') continue;

        const delta = Math.abs(t - note.time);
        if (delta <= hitTolerance) {
          // Check note pitch match
          const isNoteMatch =
            detectedPitch.noteName === note.noteName &&
            (Math.abs(detectedPitch.octave - note.octave) <= 1 || note.fret === 0);

          if (isNoteMatch) {
            note.hitState = delta <= 0.1 ? 'perfect' : 'great';
            registerHit(i, 'lead', note.hitState);
            break;
          }
        }
      }
    } else {
      // Chord mode evaluation
      const chords = chordEventsRef.current;
      for (let i = 0; i < chords.length; i++) {
        const ch = chords[i];
        if (ch.hitState !== 'pending') continue;

        const delta = Math.abs(t - ch.time);
        if (delta <= hitTolerance + 0.1) {
          // In chord mode, matching root note or high strum energy counts
          const rootMatch = detectedPitch.noteName === ch.root;
          const energyDetected = detectedPitch.rms > 0.035;

          if (rootMatch || energyDetected) {
            ch.hitState = delta <= 0.14 ? 'perfect' : 'great';
            registerHit(i, 'chord', ch.hitState);
            break;
          }
        }
      }
    }
  }, [detectedPitch, isPlaying, isMicActive, song.mode]);

  // Main 60 FPS animation & Audio Backing Clock loop
  useEffect(() => {
    let animId: number;

    const render = (now: number) => {
      const deltaSec = ((now - lastTimeRef.current) / 1000) * effectiveSpeed;
      lastTimeRef.current = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + deltaSec;
          currentTimeRef.current = next;

          // Metronome & Backing Beat generator calculated from current effective BPM
          const secondsPerBeat = 60 / effectiveBpm;
          const currentBeat = Math.floor(next / secondsPerBeat);

          if (currentBeat !== lastBeatRef.current && next > 0.1) {
            lastBeatRef.current = currentBeat;
            const beatInBar = currentBeat % (song.timeSignature[0] || 4);
            setActiveBeatInBar(beatInBar);

            if (isMetronomeEnabled) {
              audioEngine.playMetronomeClick(beatInBar === 0);
            }

            if (isBackingEnabled) {
              // Find active chord or root for this measure
              let activeRoot = song.key.split(' ')[0] || 'E';
              let activeFrets: number[] | undefined = undefined;

              if (song.mode === 'chord') {
                const activeCh = chordEventsRef.current.find(
                  (c) => Math.abs(c.time - next) <= 2.5
                );
                if (activeCh) {
                  activeRoot = activeCh.root;
                  activeFrets = activeCh.frets;
                }
              } else {
                const activeN = leadNotesRef.current.find(
                  (n) => Math.abs(n.time - next) <= 1.5
                );
                if (activeN) {
                  activeRoot = activeN.noteName;
                }
              }

              audioEngine.playFullBandBeat({
                beatInBar,
                rootNote: activeRoot,
                chordFrets: activeFrets,
                genre: song.genre,
                isBarStart: beatInBar === 0 && currentBeat % ((song.timeSignature[0] || 4) * 4) === 0,
              });
            }
          }

          // Guide Melody Playback (plays original track note/chord preview softly)
          if (isGuideMelodyEnabled) {
            if (song.mode === 'lead') {
              for (const n of leadNotesRef.current) {
                if (n.time >= prev && n.time < next) {
                  audioEngine.playGuitarPluck(n.frequency, 0.9, 0.22);
                  break;
                }
              }
            } else {
              for (const ch of chordEventsRef.current) {
                if (ch.time >= prev && ch.time < next) {
                  audioEngine.playGuitarChord(ch.frets, ch.strumDirection, 1.6);
                  break;
                }
              }
            }
          }

          // Check for missed notes
          if (song.mode === 'lead') {
            leadNotesRef.current.forEach((n) => {
              if (n.hitState === 'pending' && next > n.time + 0.28) {
                n.hitState = 'miss';
                setStreak(0);
                setMissCount((c) => c + 1);
                setLastFeedback({ text: 'MISS', color: '#F43F5E', id: Date.now() });
              }
            });
          } else {
            chordEventsRef.current.forEach((c) => {
              if (c.hitState === 'pending' && next > c.time + 0.35) {
                c.hitState = 'miss';
                setStreak(0);
                setMissCount((c) => c + 1);
                setLastFeedback({ text: 'MISS', color: '#F43F5E', id: Date.now() });
              }
            });
          }

          // Song End Check
          if (next >= song.duration) {
            setIsPlaying(false);
            setIsFinished(true);
            if (!completionRecordedRef.current && onSongComplete) {
              completionRecordedRef.current = true;
              const totalNotes =
                song.mode === 'lead' ? (song.leadNotes || []).length : (song.chordEvents || []).length;
              const hits = perfectCount + greatCount;
              const acc = totalNotes > 0 ? Math.round((hits / totalNotes) * 100) : 0;
              const stars = acc >= 90 ? 3 : acc >= 70 ? 2 : acc >= 40 ? 1 : 0;
              onSongComplete(score, acc, stars, hits, song.duration);
            }
            return song.duration;
          }

          return next;
        });
      }

      // Draw Canvas Runway
      drawRunway();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    isPlaying,
    playbackSpeed,
    customBpm,
    effectiveSpeed,
    effectiveBpm,
    isMetronomeEnabled,
    isBackingEnabled,
    isGuideMelodyEnabled,
    song,
  ]);

  // Canvas Drawing Routine
  const drawRunway = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const hitX = 170; // Target strike line with comfortable left margin for tablet badges
    // Scale scrolling speed directly by effective song BPM so slow ballads glide calmly and fast songs rush with urgency
    const pixelsPerBeat = 120;
    const pixelsPerSecond = (effectiveBpm / 60) * pixelsPerBeat;
    const t = currentTimeRef.current;

    // Clear background
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, width, height);

    // Draw Vertical Beat Guide Lines
    const secondsPerBeat = 60 / song.bpm;
    const minBeat = Math.floor((t - 1) / secondsPerBeat);
    const maxBeat = Math.ceil((t + (width - hitX) / pixelsPerSecond) / secondsPerBeat);

    for (let b = minBeat; b <= maxBeat; b++) {
      const beatTime = b * secondsPerBeat;
      const x = hitX + (beatTime - t) * pixelsPerSecond;
      if (x >= hitX && x <= width) {
        const isBar = b % song.timeSignature[0] === 0;
        ctx.strokeStyle = isBar ? 'rgba(148, 163, 184, 0.45)' : 'rgba(51, 65, 85, 0.25)';
        ctx.lineWidth = isBar ? 2.5 : 1;
        ctx.beginPath();
        ctx.moveTo(x, 28);
        ctx.lineTo(x, height - 12);
        ctx.stroke();

        if (isBar) {
          ctx.fillStyle = '#94A3B8';
          ctx.font = 'bold 12px JetBrains Mono';
          ctx.fillText(`M${Math.floor(b / song.timeSignature[0]) + 1}`, x + 5, 20);
        }
      }
    }

    if (song.mode === 'lead') {
      // ----------------------------------------------------
      // LEAD MODE: 6 Guitar String Tracks (Generous Tablet Height)
      // ----------------------------------------------------
      const trackTop = 48;
      const trackBottom = height - 24;
      const trackHeight = (trackBottom - trackTop) / 6;
      const puckRadius = Math.min(27, Math.max(22, Math.round(trackHeight * 0.38)));
      const fretFontSize = Math.round(puckRadius * 0.85);

      // Draw 6 horizontal string tracks (0=High E at top, 5=Low E at bottom)
      for (let s = 0; s < 6; s++) {
        const y = trackTop + s * trackHeight + trackHeight / 2;
        const color = STRING_COLORS[s];

        // Track lane background with alternating contrast
        ctx.fillStyle = s % 2 === 0 ? 'rgba(15, 23, 42, 0.48)' : 'rgba(30, 41, 59, 0.32)';
        ctx.fillRect(0, trackTop + s * trackHeight, width, trackHeight);

        // String wire with realistic gauge thickness
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.4 + (5 - s) * 0.6;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();

        // String badge on far left (clear and bold for tablets)
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.roundRect(8, y - 18, 76, 36, 8);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.0;
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = 'bold 14px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(['1 (e)', '2 (B)', '3 (G)', '4 (D)', '5 (A)', '6 (E)'][s], 46, y);
      }

      // Draw Target Strike Line (Hit Zone)
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(hitX, trackTop - 8);
      ctx.lineTo(hitX, trackBottom + 8);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Target Header Label
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('TARGET', hitX, trackTop - 10);

      // Lead Note Pucks (Large, crisp font for tablet distance reading)
      const notes = leadNotesRef.current;
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const x = hitX + (note.time - t) * pixelsPerSecond;

        // Skip off-screen notes
        if (x < -50 || x > width + 50) continue;

        const y = trackTop + note.stringIndex * trackHeight + trackHeight / 2;
        const color = STRING_COLORS[note.stringIndex];

        // Hit effect fade out
        if (note.hitState === 'perfect' || note.hitState === 'great') {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.beginPath();
          ctx.arc(x, y, puckRadius + 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (note.hitState === 'miss') {
          ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
          ctx.beginPath();
          ctx.arc(x, y, puckRadius + 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Standard Pending Note Puck (Yousician style with glowing perimeter)
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = Math.abs(x - hitX) < 35 ? 18 : 8;
          ctx.beginPath();
          ctx.arc(x, y, puckRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Inner dark circle for high-contrast fret number
          ctx.fillStyle = '#090D16';
          ctx.beginPath();
          ctx.arc(x, y, Math.round(puckRadius * 0.72), 0, Math.PI * 2);
          ctx.fill();

          // Fret text (bold large font - easily legible on tablet)
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${fretFontSize}px JetBrains Mono`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${note.fret}`, x, y);

          // Note Name tag above note
          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.beginPath();
          ctx.roundRect(x - 18, y - puckRadius - 22, 36, 18, 4);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = '#F8FAFC';
          ctx.font = 'bold 12px Plus Jakarta Sans';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(note.noteName, x, y - puckRadius - 13);
        }
      }
    } else {
      // ----------------------------------------------------
      // CHORD MODE: Rhythm Runway (Expanded for Tablet)
      // ----------------------------------------------------
      const laneTop = 48;
      const laneBottom = height - 28;
      const laneHeight = laneBottom - laneTop;

      // Draw Highway background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(0, laneTop, width, laneHeight);

      // Target Strum Line
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(hitX, laneTop - 8);
      ctx.lineTo(hitX, laneBottom + 8);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Strike Zone Header Badge
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('STRUM', hitX, laneTop - 10);

      // Chord blocks
      const chords = chordEventsRef.current;
      for (let i = 0; i < chords.length; i++) {
        const chord = chords[i];
        const x = hitX + (chord.time - t) * pixelsPerSecond;
        const blockWidth = Math.max(105, chord.duration * pixelsPerSecond * 0.45);

        if (x + blockWidth < 0 || x > width + 60) continue;

        const isHit = chord.hitState === 'perfect' || chord.hitState === 'great';
        const isMiss = chord.hitState === 'miss';

        // Chord Card
        ctx.fillStyle = isHit
          ? 'rgba(16, 185, 129, 0.45)'
          : isMiss
          ? 'rgba(244, 63, 94, 0.35)'
          : 'rgba(245, 158, 11, 0.28)';
        ctx.strokeStyle = isHit ? '#10B981' : isMiss ? '#F43F5E' : '#F59E0B';
        ctx.lineWidth = 2.8;

        ctx.beginPath();
        ctx.roundRect(x, laneTop + 14, blockWidth, laneHeight - 28, 12);
        ctx.fill();
        ctx.stroke();

        // Chord Name (large 30px font)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(chord.name, x + blockWidth / 2, laneTop + laneHeight / 2 - 14);

        // Strum arrow & direction
        ctx.fillStyle = '#F59E0B';
        ctx.font = 'bold 19px Plus Jakarta Sans';
        ctx.fillText(
          chord.strumDirection === 'down' ? '↓ STRUM' : '↑ UP',
          x + blockWidth / 2,
          laneTop + laneHeight / 2 + 18
        );
      }
    }

    // Render Particle Explosions
    const particles = particlesRef.current;
    for (let p = particles.length - 1; p >= 0; p--) {
      const part = particles[p];
      part.x += part.vx;
      part.y += part.vy;
      part.alpha -= 0.035;

      if (part.alpha <= 0) {
        particles.splice(p, 1);
        continue;
      }

      ctx.fillStyle = part.color;
      ctx.globalAlpha = Math.max(0, part.alpha);
      ctx.beginPath();
      ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Reset ctx alignment
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  };

  // Virtual Pluck fallback handler (allows testing on computer without guitar)
  const handleVirtualPluck = () => {
    const t = currentTimeRef.current;
    if (song.mode === 'lead') {
      const notes = leadNotesRef.current;
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        if (note.hitState === 'pending' && Math.abs(t - note.time) <= 0.25) {
          note.hitState = 'perfect';
          audioEngine.playGuitarFret(note.stringIndex, note.fret, 1.5);
          registerHit(i, 'lead', 'perfect');
          return;
        }
      }
      // If no note at target, just play high E
      audioEngine.playGuitarPluck(329.63, 1.2, 0.3);
    } else {
      const chords = chordEventsRef.current;
      for (let i = 0; i < chords.length; i++) {
        const chord = chords[i];
        if (chord.hitState === 'pending' && Math.abs(t - chord.time) <= 0.3) {
          chord.hitState = 'perfect';
          audioEngine.playGuitarChord(chord.frets, chord.strumDirection, 2.0);
          registerHit(i, 'chord', 'perfect');
          return;
        }
      }
      audioEngine.playGuitarChord(CHORD_LIBRARY['Em'].frets, 'down', 2.0);
    }
  };

  // Keyboard shortcut (Space to play/pause or tap note)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isPlaying) {
          startWithDelay();
        } else {
          handleVirtualPluck();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, prepDelay]);

  // Restart song with 4s preview delay
  const handleRestart = () => {
    if (prepTimerRef.current) {
      clearInterval(prepTimerRef.current);
      prepTimerRef.current = null;
    }
    setPrepDelay(null);
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setIsFinished(false);
    setScore(0);
    setStreak(0);
    setPerfectCount(0);
    setGreatCount(0);
    setMissCount(0);
    setLastFeedback(null);
    completionRecordedRef.current = false;
    leadNotesRef.current = (song.leadNotes || []).map((n) => ({ ...n, hitState: 'pending' }));
    chordEventsRef.current = (song.chordEvents || []).map((c) => ({ ...c, hitState: 'pending' }));
    lastBeatRef.current = -1;
    startWithDelay();
  };

  // Calculate Accuracy
  const totalNotes =
    song.mode === 'lead' ? (song.leadNotes || []).length : (song.chordEvents || []).length;
  const hitsCount = perfectCount + greatCount;
  const accuracy = totalNotes > 0 ? Math.round((hitsCount / totalNotes) * 100) : 0;
  const starsEarned = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 40 ? 1 : 0;

  // Responsive Canvas Dimensions for Tablets and Laptops
  const canvasWidth = 1400;
  const canvasHeight =
    song.mode === 'lead'
      ? displayScale === 'tablet'
        ? 490
        : displayScale === 'large'
        ? 440
        : 380
      : displayScale === 'tablet'
      ? 390
      : displayScale === 'large'
      ? 340
      : 290;

  const canvasCssHeight =
    song.mode === 'lead'
      ? displayScale === 'tablet'
        ? 'h-[440px] sm:h-[480px] md:h-[520px]'
        : displayScale === 'large'
        ? 'h-[390px] sm:h-[430px] md:h-[470px]'
        : 'h-[330px] sm:h-[360px] md:h-[390px]'
      : displayScale === 'tablet'
      ? 'h-[350px] sm:h-[390px] md:h-[430px]'
      : displayScale === 'large'
      ? 'h-[300px] sm:h-[330px] md:h-[360px]'
      : 'h-[260px] sm:h-[280px] md:h-[310px]';

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Song Stage Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Song Meta */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCatalog}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition"
          >
            ← Back
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">{song.title}</h2>
              <span className="text-xs font-semibold text-amber-400 font-mono">
                {song.difficultyLabel}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
              <span>{song.artist}</span>
              <span>·</span>
              <span>{song.genre}</span>
              <span>·</span>
              <span className="text-amber-300 font-bold">{effectiveBpm} BPM</span>
              {effectiveBpm !== song.bpm && (
                <span className="text-[10px] text-slate-500">({song.bpm} default)</span>
              )}
              <span>·</span>
              <span className="capitalize">{song.mode} Mode</span>
            </div>
          </div>
        </div>

        {/* Center: Live Stats HUD */}
        <div className="flex items-center gap-5 px-4 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-mono">SCORE</span>
            <span className="text-base font-black text-amber-400 font-mono tabular-nums">
              {score}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-mono">STREAK</span>
            <span className="text-base font-black text-emerald-400 font-mono tabular-nums">
              {streak}x
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-mono">ACCURACY</span>
            <span className="text-base font-black text-white font-mono tabular-nums">
              {accuracy}%
            </span>
          </div>

          {/* Real-time Beat Meter Visualizer */}
          <div className="flex flex-col items-center pl-2 border-l border-slate-800">
            <span className="text-[9px] text-slate-500 font-mono tracking-wider">BEAT</span>
            <div className="flex items-center gap-1 mt-0.5">
              {[0, 1, 2, 3].slice(0, song.timeSignature[0] || 4).map((b) => (
                <div
                  key={b}
                  className={`w-4 h-4 rounded text-[9px] font-mono font-bold flex items-center justify-center transition-all duration-75 ${
                    activeBeatInBar === b && isPlaying
                      ? b === 0
                        ? 'bg-emerald-400 text-slate-950 scale-125 shadow-md shadow-emerald-400/60 font-black'
                        : 'bg-amber-400 text-slate-950 scale-110 shadow-sm shadow-amber-400/50 font-black'
                      : 'bg-slate-900 text-slate-600 border border-slate-800'
                  }`}
                >
                  {b + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Feedback Splash Popup */}
          {lastFeedback && (
            <div
              key={lastFeedback.id}
              className="text-xs font-black font-mono animate-bounce"
              style={{ color: lastFeedback.color }}
            >
              {lastFeedback.text}
            </div>
          )}
        </div>

        {/* Right: Size Toggle & Mic Listening Status */}
        <div className="flex items-center gap-2">
          {/* View Size Selector for Tablets and Laptops */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
            {(['standard', 'large', 'tablet'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setDisplayScale(s)}
                className={`px-2 py-1 text-[11px] font-mono font-bold rounded transition ${
                  displayScale === s
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={s === 'tablet' ? 'Tablet XL view (Largest strings & frets)' : `${s} view`}
              >
                {s === 'tablet' ? 'Tablet XL' : s === 'large' ? 'Large' : 'Normal'}
              </button>
            ))}
          </div>

          <button
            onClick={onToggleMic}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 border transition-all ${
              isMicActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isMicActive ? 'Mic Listening' : 'Enable Mic'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Canvas Runway (Tablet-Optimized Large Height) */}
      <div className="relative w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className={`w-full block cursor-pointer transition-all ${canvasCssHeight}`}
          onClick={handleVirtualPluck}
        />

        {/* 4-Second Preparation Delay Calm Banner (No loud countdown numbers, peaceful preview of upcoming notes) */}
        {prepDelay !== null && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-5 py-2 rounded-full bg-slate-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-md">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>Previewing upcoming notes · Starts in <span className="text-amber-400 font-mono">{prepDelay}s</span></span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Inspect frets & strings ahead · Place fingers ready
              </span>
            </div>
            <button
              onClick={skipDelay}
              className="ml-2 px-3 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow font-mono"
            >
              Start Now →
            </button>
          </div>
        )}

        {/* Clean floating Start / Resume control when paused - runway and upcoming notes remain fully visible */}
        {!isPlaying && !isFinished && prepDelay === null && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            <button
              onClick={startWithDelay}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm flex items-center gap-2 transition-all shadow-xl shadow-amber-500/40 hover:scale-105 active:scale-95 cursor-pointer border border-amber-300/40"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{currentTime === 0 ? 'Start Song (4s Preview Delay)' : 'Resume Playback'}</span>
            </button>
          </div>
        )}

        {/* Real-time Mic Listening banner */}
        {isMicActive && detectedPitch && (
          <div className="absolute top-2 right-3 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1 text-[11px] font-mono text-emerald-400 flex items-center gap-2 shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Mic Pitch: {detectedPitch.noteName}
              {detectedPitch.octave} ({detectedPitch.freq.toFixed(1)}Hz)
            </span>
          </div>
        )}
      </div>

      {/* Transport & Practice Deck Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Playback Transport */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
              } else {
                startWithDelay();
              }
            }}
            className={`p-2.5 rounded-lg font-bold transition flex items-center justify-center ${
              isPlaying
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            }`}
            title={isPlaying ? 'Pause' : 'Play with 4s Preview Delay'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
          </button>

          <button
            onClick={handleRestart}
            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Restart Song"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Time scrubber display */}
          <div className="text-xs font-mono text-slate-400 ml-2">
            <span>{currentTime.toFixed(1)}s</span> / <span>{song.duration}s</span>
          </div>
        </div>

        {/* Speed & BPM Tempo Adjustments */}
        <div className="flex items-center gap-3">
          {/* BPM Stepper */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
            <span className="text-[10px] text-slate-500 font-mono px-1 font-semibold">TEMPO</span>
            <button
              onClick={() => setCustomBpm((b) => Math.max(40, b - 5))}
              className="px-2 py-1 text-xs font-mono font-bold rounded bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Slow down by 5 BPM"
            >
              -5
            </button>
            <span className="px-2 text-xs font-mono font-black text-amber-400 tabular-nums min-w-[58px] text-center">
              {effectiveBpm} <span className="text-[10px] text-slate-500 font-normal">BPM</span>
            </span>
            <button
              onClick={() => setCustomBpm((b) => Math.min(260, b + 5))}
              className="px-2 py-1 text-xs font-mono font-bold rounded bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Speed up by 5 BPM"
            >
              +5
            </button>
            {customBpm !== song.bpm && (
              <button
                onClick={() => setCustomBpm(song.bpm)}
                className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:text-amber-400 transition underline ml-1"
                title={`Reset to default ${song.bpm} BPM`}
              >
                Reset
              </button>
            )}
          </div>

          {/* Speed Multipliers */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
            <span className="text-[10px] text-slate-500 font-mono px-1 font-semibold">RATE</span>
            {[0.5, 0.75, 1.0, 1.25].map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-1 text-xs font-mono font-semibold rounded transition ${
                  playbackSpeed === speed
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Audio Toggles (Metronome, Full Band Synthesizer & Guide Melody) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsMetronomeEnabled(!isMetronomeEnabled)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              isMetronomeEnabled
                ? 'bg-slate-800 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            Metronome: {isMetronomeEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setIsBackingEnabled(!isBackingEnabled)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              isBackingEnabled
                ? 'bg-slate-800 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
          >
            Backing Band: {isBackingEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setIsGuideMelodyEnabled(!isGuideMelodyEnabled)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
              isGuideMelodyEnabled
                ? 'bg-slate-800 text-sky-300 border-sky-500/40'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title="Hear original guitar note guide softly in background"
          >
            Guide Melody: {isGuideMelodyEnabled ? 'ON' : 'OFF'}
          </button>

          {/* Virtual Pluck Button for quick on-screen test */}
          <button
            onClick={handleVirtualPluck}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition"
          >
            Virtual Pluck
          </button>
        </div>
      </div>

      {/* Completion Modal */}
      {isFinished && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Award className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white">Song Completed!</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {song.title} · {song.artist}
            </p>

            {/* Star Rating */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((star) => (
                <Sparkles
                  key={star}
                  className={`w-8 h-8 ${
                    star <= starsEarned
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Score Breakdown */}
            <div className="w-full grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-xl mb-6 font-mono">
              <div>
                <div className="text-[10px] text-slate-500">FINAL SCORE</div>
                <div className="text-lg font-bold text-amber-400">{score}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">ACCURACY</div>
                <div className="text-lg font-bold text-emerald-400">{accuracy}%</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">MAX STREAK</div>
                <div className="text-lg font-bold text-sky-400">{maxStreak}x</div>
              </div>
            </div>

            <div className="flex items-center justify-between w-full text-xs text-slate-400 font-mono mb-6 px-2">
              <span className="text-emerald-400">Perfect: {perfectCount}</span>
              <span className="text-sky-400">Great: {greatCount}</span>
              <span className="text-rose-400">Miss: {missCount}</span>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700 transition"
              >
                Play Again
              </button>
              {onNextSong ? (
                <button
                  onClick={onNextSong}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition flex items-center justify-center gap-1.5"
                >
                  <span>Next Song</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onBackToCatalog}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
                >
                  Song Catalog
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
