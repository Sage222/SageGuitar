import { Song, GuitarStringNote, GuitarChordEvent, DifficultyLevel } from '../types/guitar';
import { getFretFrequency, getFretNoteInfo, CHORD_LIBRARY } from '../utils/guitarConstants';

export type DrillCategory = 'scales' | 'dexterity' | 'picking' | 'chords';

export interface PracticeNoteStep {
  stringIndex: number; // 0=High E, 1=B, 2=G, 3=D, 4=A, 5=Low E
  fret: number;
  finger: number; // 1=index, 2=middle, 3=ring, 4=pinky, 0=open
  noteName: string;
  octave: number;
  degree?: string; // e.g. "Root", "b3", "4", "5", "b7"
  pickDirection?: 'down' | 'up';
  beatDuration?: number; // duration in beats (default 1)
}

export interface PracticeDrill {
  id: string;
  title: string;
  subtitle: string;
  category: DrillCategory;
  difficulty: DifficultyLevel;
  defaultBpm: number;
  timeSignature: [number, number];
  description: string;
  techniqueTip: string;
  key: string;
  scaleType?: string;
  notes: PracticeNoteStep[];
  chordProgression?: string[]; // For chord switching drills
}

/**
 * Converts a PracticeDrill into a playable Song object that runs directly
 * on the 3D Perspective Runway in SongPlayer!
 */
export function convertDrillToSong(drill: PracticeDrill): Song {
  const bpm = drill.defaultBpm;
  const secondsPerBeat = 60 / bpm;

  if (drill.category === 'chords' && drill.chordProgression && drill.chordProgression.length > 0) {
    // Generate chord events
    const chordEvents: GuitarChordEvent[] = [];
    let currentBeat = 0;
    const chordsList = drill.chordProgression;
    // Repeat progression 3 times for a good workout session
    const fullCycle = [...chordsList, ...chordsList, ...chordsList];

    for (let i = 0; i < fullCycle.length; i++) {
      const chordName = fullCycle[i];
      const def = CHORD_LIBRARY[chordName] || CHORD_LIBRARY['Em'];
      const time = Math.round(currentBeat * secondsPerBeat * 100) / 100;
      const duration = Math.round(4 * secondsPerBeat * 100) / 100; // 4 beats per chord

      chordEvents.push({
        name: chordName,
        root: def.root,
        frets: [...def.frets],
        fingers: [...def.fingers],
        strumDirection: i % 2 === 0 ? 'down' : 'up',
        time,
        duration,
      });

      currentBeat += 4;
    }

    const totalDuration = Math.ceil(currentBeat * secondsPerBeat);

    return {
      id: `drill-${drill.id}`,
      title: `${drill.title} (Practice)`,
      artist: 'StringMaster Academy',
      genre: 'Acoustic',
      difficulty: drill.difficulty,
      difficultyLabel: `Level ${drill.difficulty} Drill`,
      mode: 'chord',
      bpm,
      timeSignature: drill.timeSignature,
      duration: totalDuration,
      description: drill.description,
      key: drill.key,
      chordEvents,
    };
  }

  // Generate lead notes sequence
  const leadNotes: GuitarStringNote[] = [];
  let currentBeat = 0;
  // Repeat the drill sequence 2 times so it's a solid practice loop
  const repeatedNotes = [...drill.notes, ...drill.notes];

  for (let i = 0; i < repeatedNotes.length; i++) {
    const step = repeatedNotes[i];
    const durationBeats = step.beatDuration || 1;
    const time = Math.round(currentBeat * secondsPerBeat * 100) / 100;
    const duration = Math.round(durationBeats * 0.85 * secondsPerBeat * 100) / 100;
    const freq = getFretFrequency(step.stringIndex, step.fret);

    leadNotes.push({
      stringIndex: step.stringIndex,
      fret: step.fret,
      noteName: step.noteName,
      octave: step.octave,
      frequency: Math.round(freq * 10) / 10,
      time,
      duration,
      finger: step.finger,
    });

    currentBeat += durationBeats;
  }

  const totalDuration = Math.ceil(currentBeat * secondsPerBeat);

  return {
    id: `drill-${drill.id}`,
    title: `${drill.title} (Workout)`,
    artist: 'StringMaster Academy',
    genre: 'Classical',
    difficulty: drill.difficulty,
    difficultyLabel: `Level ${drill.difficulty} Workout`,
    mode: 'lead',
    bpm,
    timeSignature: drill.timeSignature,
    duration: totalDuration,
    description: drill.description,
    key: drill.key,
    leadNotes,
  };
}

/**
 * Curated catalog of beginner and progressive practice tools
 */
export const PRACTICE_DRILLS: PracticeDrill[] = [
  // ==========================================
  // SCALES & SOLOING PATTERNS
  // ==========================================
  {
    id: 'a-minor-pentatonic-box1',
    title: 'A Minor Pentatonic (Box 1)',
    subtitle: 'The #1 most essential guitar soloing shape in rock & blues',
    category: 'scales',
    difficulty: 2,
    defaultBpm: 75,
    timeSignature: [4, 4],
    key: 'Am',
    scaleType: 'Minor Pentatonic',
    description:
      'The foundation of rock and blues soloing. Played starting on the 5th fret across all 6 strings, featuring Root (A), Minor 3rd (C), 4th (D), 5th (E), and Minor 7th (G).',
    techniqueTip:
      'Anchor your index finger on the 5th fret. Use your pinky (finger 4) for the 8th fret notes on strings 6, 2, and 1, and your ring finger (finger 3) for the 7th fret notes.',
    notes: [
      // Ascending
      { stringIndex: 5, fret: 5, finger: 1, noteName: 'A', octave: 2, degree: 'Root', pickDirection: 'down' },
      { stringIndex: 5, fret: 8, finger: 4, noteName: 'C', octave: 3, degree: 'b3', pickDirection: 'up' },
      { stringIndex: 4, fret: 5, finger: 1, noteName: 'D', octave: 3, degree: '4', pickDirection: 'down' },
      { stringIndex: 4, fret: 7, finger: 3, noteName: 'E', octave: 3, degree: '5', pickDirection: 'up' },
      { stringIndex: 3, fret: 5, finger: 1, noteName: 'G', octave: 3, degree: 'b7', pickDirection: 'down' },
      { stringIndex: 3, fret: 7, finger: 3, noteName: 'A', octave: 3, degree: 'Root', pickDirection: 'up' },
      { stringIndex: 2, fret: 5, finger: 1, noteName: 'C', octave: 4, degree: 'b3', pickDirection: 'down' },
      { stringIndex: 2, fret: 7, finger: 3, noteName: 'D', octave: 4, degree: '4', pickDirection: 'up' },
      { stringIndex: 1, fret: 5, finger: 1, noteName: 'E', octave: 4, degree: '5', pickDirection: 'down' },
      { stringIndex: 1, fret: 8, finger: 4, noteName: 'G', octave: 4, degree: 'b7', pickDirection: 'up' },
      { stringIndex: 0, fret: 5, finger: 1, noteName: 'A', octave: 4, degree: 'Root', pickDirection: 'down' },
      { stringIndex: 0, fret: 8, finger: 4, noteName: 'C', octave: 5, degree: 'b3', pickDirection: 'up' },
      // Descending
      { stringIndex: 0, fret: 5, finger: 1, noteName: 'A', octave: 4, degree: 'Root', pickDirection: 'down' },
      { stringIndex: 1, fret: 8, finger: 4, noteName: 'G', octave: 4, degree: 'b7', pickDirection: 'up' },
      { stringIndex: 1, fret: 5, finger: 1, noteName: 'E', octave: 4, degree: '5', pickDirection: 'down' },
      { stringIndex: 2, fret: 7, finger: 3, noteName: 'D', octave: 4, degree: '4', pickDirection: 'up' },
      { stringIndex: 2, fret: 5, finger: 1, noteName: 'C', octave: 4, degree: 'b3', pickDirection: 'down' },
      { stringIndex: 3, fret: 7, finger: 3, noteName: 'A', octave: 3, degree: 'Root', pickDirection: 'up' },
      { stringIndex: 3, fret: 5, finger: 1, noteName: 'G', octave: 3, degree: 'b7', pickDirection: 'down' },
      { stringIndex: 4, fret: 7, finger: 3, noteName: 'E', octave: 3, degree: '5', pickDirection: 'up' },
      { stringIndex: 4, fret: 5, finger: 1, noteName: 'D', octave: 3, degree: '4', pickDirection: 'down' },
      { stringIndex: 5, fret: 8, finger: 4, noteName: 'C', octave: 3, degree: 'b3', pickDirection: 'up' },
      { stringIndex: 5, fret: 5, finger: 1, noteName: 'A', octave: 2, degree: 'Root', pickDirection: 'down', beatDuration: 2 },
    ],
  },
  {
    id: 'e-minor-pentatonic-open',
    title: 'E Minor Pentatonic (Open Strings)',
    subtitle: 'Classic heavy rock, metal & acoustic open riffing scale',
    category: 'scales',
    difficulty: 1,
    defaultBpm: 80,
    timeSignature: [4, 4],
    key: 'Em',
    scaleType: 'Minor Pentatonic',
    description:
      'Utilizes open strings for massive acoustic resonance and heavy low riffs (Black Sabbath, Metallica, Led Zeppelin). All notes are on open strings or frets 2 and 3.',
    techniqueTip:
      'Use middle finger (2) for 2nd fret notes, and ring finger (3) for 3rd fret notes. Let open strings ring cleanly without unwanted fret buzz.',
    notes: [
      { stringIndex: 5, fret: 0, finger: 0, noteName: 'E', octave: 2, degree: 'Root', pickDirection: 'down' },
      { stringIndex: 5, fret: 3, finger: 3, noteName: 'G', octave: 2, degree: 'b3', pickDirection: 'up' },
      { stringIndex: 4, fret: 0, finger: 0, noteName: 'A', octave: 2, degree: '4', pickDirection: 'down' },
      { stringIndex: 4, fret: 2, finger: 2, noteName: 'B', octave: 2, degree: '5', pickDirection: 'up' },
      { stringIndex: 3, fret: 0, finger: 0, noteName: 'D', octave: 3, degree: 'b7', pickDirection: 'down' },
      { stringIndex: 3, fret: 2, finger: 2, noteName: 'E', octave: 3, degree: 'Root', pickDirection: 'up' },
      { stringIndex: 2, fret: 0, finger: 0, noteName: 'G', octave: 3, degree: 'b3', pickDirection: 'down' },
      { stringIndex: 2, fret: 2, finger: 2, noteName: 'A', octave: 3, degree: '4', pickDirection: 'up' },
      { stringIndex: 1, fret: 0, finger: 0, noteName: 'B', octave: 3, degree: '5', pickDirection: 'down' },
      { stringIndex: 1, fret: 3, finger: 3, noteName: 'D', octave: 4, degree: 'b7', pickDirection: 'up' },
      { stringIndex: 0, fret: 0, finger: 0, noteName: 'E', octave: 4, degree: 'Root', pickDirection: 'down' },
      { stringIndex: 0, fret: 3, finger: 3, noteName: 'G', octave: 4, degree: 'b3', pickDirection: 'up' },
      // Descend
      { stringIndex: 0, fret: 0, finger: 0, noteName: 'E', octave: 4, degree: 'Root', pickDirection: 'down' },
      { stringIndex: 1, fret: 3, finger: 3, noteName: 'D', octave: 4, degree: 'b7', pickDirection: 'up' },
      { stringIndex: 1, fret: 0, finger: 0, noteName: 'B', octave: 3, degree: '5', pickDirection: 'down' },
      { stringIndex: 2, fret: 2, finger: 2, noteName: 'A', octave: 3, degree: '4', pickDirection: 'up' },
      { stringIndex: 2, fret: 0, finger: 0, noteName: 'G', octave: 3, degree: 'b3', pickDirection: 'down' },
      { stringIndex: 3, fret: 2, finger: 2, noteName: 'E', octave: 3, degree: 'Root', pickDirection: 'up' },
      { stringIndex: 3, fret: 0, finger: 0, noteName: 'D', octave: 3, degree: 'b7', pickDirection: 'down' },
      { stringIndex: 4, fret: 2, finger: 2, noteName: 'B', octave: 2, degree: '5', pickDirection: 'up' },
      { stringIndex: 4, fret: 0, finger: 0, noteName: 'A', octave: 2, degree: '4', pickDirection: 'down' },
      { stringIndex: 5, fret: 3, finger: 3, noteName: 'G', octave: 2, degree: 'b3', pickDirection: 'up' },
      { stringIndex: 5, fret: 0, finger: 0, noteName: 'E', octave: 2, degree: 'Root', pickDirection: 'down', beatDuration: 2 },
    ],
  },
  {
    id: 'a-blues-scale-workout',
    title: 'A Blues Scale (The Blue Note)',
    subtitle: 'Adds the gritty diminished 5th (Eb) for authentic blues expression',
    category: 'scales',
    difficulty: 2,
    defaultBpm: 70,
    timeSignature: [4, 4],
    key: 'A Blues',
    scaleType: 'Blues Scale',
    description:
      'The classic 6-note blues scale introduces the spicy "blue note" (Eb / D#) on string 4 fret 6 and string 2 fret 8, creating instant tension and soulful resolution.',
    techniqueTip:
      'Notice the chromatic 3-note walk: 5th, 6th, and 7th frets on string 4. Use Index (1), Middle (2), and Ring (3) in fluid succession.',
    notes: [
      { stringIndex: 5, fret: 5, finger: 1, noteName: 'A', octave: 2, degree: 'Root', pickDirection: 'down' },
      { stringIndex: 5, fret: 8, finger: 4, noteName: 'C', octave: 3, degree: 'b3', pickDirection: 'up' },
      { stringIndex: 4, fret: 5, finger: 1, noteName: 'D', octave: 3, degree: '4', pickDirection: 'down' },
      { stringIndex: 4, fret: 6, finger: 2, noteName: 'D#', octave: 3, degree: 'b5 Blue', pickDirection: 'up' },
      { stringIndex: 4, fret: 7, finger: 3, noteName: 'E', octave: 3, degree: '5', pickDirection: 'down' },
      { stringIndex: 3, fret: 5, finger: 1, noteName: 'G', octave: 3, degree: 'b7', pickDirection: 'up' },
      { stringIndex: 3, fret: 7, finger: 3, noteName: 'A', octave: 3, degree: 'Root', pickDirection: 'down' },
      { stringIndex: 2, fret: 5, finger: 1, noteName: 'C', octave: 4, degree: 'b3', pickDirection: 'up' },
      { stringIndex: 2, fret: 7, finger: 3, noteName: 'D', octave: 4, degree: '4', pickDirection: 'down' },
      { stringIndex: 2, fret: 8, finger: 4, noteName: 'D#', octave: 4, degree: 'b5 Blue', pickDirection: 'up' },
      { stringIndex: 1, fret: 5, finger: 1, noteName: 'E', octave: 4, degree: '5', pickDirection: 'down' },
      { stringIndex: 1, fret: 8, finger: 4, noteName: 'G', octave: 4, degree: 'b7', pickDirection: 'up' },
      { stringIndex: 0, fret: 5, finger: 1, noteName: 'A', octave: 4, degree: 'Root', pickDirection: 'down' },
      // Descending resolve
      { stringIndex: 1, fret: 8, finger: 4, noteName: 'G', octave: 4, degree: 'b7', pickDirection: 'up' },
      { stringIndex: 1, fret: 5, finger: 1, noteName: 'E', octave: 4, degree: '5', pickDirection: 'down' },
      { stringIndex: 2, fret: 8, finger: 4, noteName: 'D#', octave: 4, degree: 'b5 Blue', pickDirection: 'up' },
      { stringIndex: 2, fret: 7, finger: 3, noteName: 'D', octave: 4, degree: '4', pickDirection: 'down' },
      { stringIndex: 2, fret: 5, finger: 1, noteName: 'C', octave: 4, degree: 'b3', pickDirection: 'up' },
      { stringIndex: 3, fret: 7, finger: 3, noteName: 'A', octave: 3, degree: 'Root', pickDirection: 'down' },
      { stringIndex: 4, fret: 6, finger: 2, noteName: 'D#', octave: 3, degree: 'b5 Blue', pickDirection: 'up' },
      { stringIndex: 4, fret: 5, finger: 1, noteName: 'D', octave: 3, degree: '4', pickDirection: 'down' },
      { stringIndex: 5, fret: 8, finger: 4, noteName: 'C', octave: 3, degree: 'b3', pickDirection: 'up' },
      { stringIndex: 5, fret: 5, finger: 1, noteName: 'A', octave: 2, degree: 'Root', pickDirection: 'down', beatDuration: 2 },
    ],
  },
  {
    id: 'c-major-diatonic-run',
    title: 'C Major Diatonic (2-Octave Run)',
    subtitle: 'The universal musical alphabet: Do-Re-Mi-Fa-Sol-La-Ti-Do',
    category: 'scales',
    difficulty: 2,
    defaultBpm: 72,
    timeSignature: [4, 4],
    key: 'C',
    scaleType: 'Major Diatonic',
    description:
      'The foundation of Western harmony. Spans two full octaves from C3 (5th string 3rd fret) to C5 (1st string 8th fret). Essential for melodic playing and ear training.',
    techniqueTip:
      'Keep your left wrist flat and neutral. Curve your knuckles so your fingertips press just behind the fret wires without touching neighboring strings.',
    notes: [
      { stringIndex: 4, fret: 3, finger: 2, noteName: 'C', octave: 3, degree: 'Root (1)', pickDirection: 'down' },
      { stringIndex: 4, fret: 5, finger: 4, noteName: 'D', octave: 3, degree: '2nd', pickDirection: 'up' },
      { stringIndex: 3, fret: 2, finger: 1, noteName: 'E', octave: 3, degree: '3rd', pickDirection: 'down' },
      { stringIndex: 3, fret: 3, finger: 2, noteName: 'F', octave: 3, degree: '4th', pickDirection: 'up' },
      { stringIndex: 3, fret: 5, finger: 4, noteName: 'G', octave: 3, degree: '5th', pickDirection: 'down' },
      { stringIndex: 2, fret: 2, finger: 1, noteName: 'A', octave: 3, degree: '6th', pickDirection: 'up' },
      { stringIndex: 2, fret: 4, finger: 3, noteName: 'B', octave: 3, degree: '7th', pickDirection: 'down' },
      { stringIndex: 2, fret: 5, finger: 4, noteName: 'C', octave: 4, degree: 'Octave (1)', pickDirection: 'up' },
      { stringIndex: 1, fret: 3, finger: 1, noteName: 'D', octave: 4, degree: '2nd', pickDirection: 'down' },
      { stringIndex: 1, fret: 5, finger: 3, noteName: 'E', octave: 4, degree: '3rd', pickDirection: 'up' },
      { stringIndex: 1, fret: 6, finger: 4, noteName: 'F', octave: 4, degree: '4th', pickDirection: 'down' },
      { stringIndex: 0, fret: 3, finger: 1, noteName: 'G', octave: 4, degree: '5th', pickDirection: 'up' },
      { stringIndex: 0, fret: 5, finger: 3, noteName: 'A', octave: 4, degree: '6th', pickDirection: 'down' },
      { stringIndex: 0, fret: 7, finger: 4, noteName: 'B', octave: 4, degree: '7th', pickDirection: 'up' },
      { stringIndex: 0, fret: 8, finger: 4, noteName: 'C', octave: 5, degree: 'High C (1)', pickDirection: 'down', beatDuration: 2 },
    ],
  },
  {
    id: 'd-dorian-funk-groove',
    title: 'D Dorian Mode (Santana & Funk Lead)',
    subtitle: 'The minor mode with a bright, jazzy natural 6th (B)',
    category: 'scales',
    difficulty: 3,
    defaultBpm: 85,
    timeSignature: [4, 4],
    key: 'D',
    scaleType: 'Dorian Mode',
    description:
      'The signature sound of Santana (Oye Como Va) and Miles Davis (So What). Unlike natural minor, Dorian has a raised 6th degree which gives it an uplifting, sophisticated latin/funk mood.',
    techniqueTip:
      'Emphasize the B note on the 2nd string (fret 0 or string 3 fret 4) to highlight the distinctive Dorian flavor.',
    notes: [
      { stringIndex: 3, fret: 0, finger: 0, noteName: 'D', octave: 3, degree: 'Root', pickDirection: 'down' },
      { stringIndex: 3, fret: 2, finger: 2, noteName: 'E', octave: 3, degree: '2nd', pickDirection: 'up' },
      { stringIndex: 3, fret: 3, finger: 3, noteName: 'F', octave: 3, degree: 'b3', pickDirection: 'down' },
      { stringIndex: 2, fret: 0, finger: 0, noteName: 'G', octave: 3, degree: '4th', pickDirection: 'up' },
      { stringIndex: 2, fret: 2, finger: 2, noteName: 'A', octave: 3, degree: '5th', pickDirection: 'down' },
      { stringIndex: 1, fret: 0, finger: 0, noteName: 'B', octave: 3, degree: 'Nat 6 (Flavor)', pickDirection: 'up' },
      { stringIndex: 1, fret: 1, finger: 1, noteName: 'C', octave: 4, degree: 'b7', pickDirection: 'down' },
      { stringIndex: 1, fret: 3, finger: 3, noteName: 'D', octave: 4, degree: 'Root', pickDirection: 'up' },
      { stringIndex: 0, fret: 0, finger: 0, noteName: 'E', octave: 4, degree: '2nd', pickDirection: 'down' },
      { stringIndex: 0, fret: 1, finger: 1, noteName: 'F', octave: 4, degree: 'b3', pickDirection: 'up' },
      { stringIndex: 0, fret: 3, finger: 3, noteName: 'G', octave: 4, degree: '4th', pickDirection: 'down', beatDuration: 2 },
    ],
  },

  // ==========================================
  // DEXTERITY & SPIDER DRILLS
  // ==========================================
  {
    id: 'spider-walk-classic',
    title: 'The Classic 1-2-3-4 Spider Crawl',
    subtitle: 'The gold standard warmup for finger independence & fret hand strength',
    category: 'dexterity',
    difficulty: 1,
    defaultBpm: 60,
    timeSignature: [4, 4],
    key: 'Chromatic',
    description:
      'Every serious guitarist knows the Spider Walk. It trains all four fingers (Index 1, Middle 2, Ring 3, Pinky 4) to press independently on frets 1-2-3-4 across all 6 strings without flying away from the fretboard.',
    techniqueTip:
      'CRUCIAL RULE: Do NOT lift previous fingers until you move to the next string! Keep finger 1 down when playing 2, keep 1 & 2 down when playing 3, and keep 1, 2 & 3 down when playing 4.',
    notes: [
      // String 5 (Low E)
      { stringIndex: 5, fret: 1, finger: 1, noteName: 'F', octave: 2, pickDirection: 'down' },
      { stringIndex: 5, fret: 2, finger: 2, noteName: 'F#', octave: 2, pickDirection: 'up' },
      { stringIndex: 5, fret: 3, finger: 3, noteName: 'G', octave: 2, pickDirection: 'down' },
      { stringIndex: 5, fret: 4, finger: 4, noteName: 'G#', octave: 2, pickDirection: 'up' },
      // String 4 (A)
      { stringIndex: 4, fret: 1, finger: 1, noteName: 'A#', octave: 2, pickDirection: 'down' },
      { stringIndex: 4, fret: 2, finger: 2, noteName: 'B', octave: 2, pickDirection: 'up' },
      { stringIndex: 4, fret: 3, finger: 3, noteName: 'C', octave: 3, pickDirection: 'down' },
      { stringIndex: 4, fret: 4, finger: 4, noteName: 'C#', octave: 3, pickDirection: 'up' },
      // String 3 (D)
      { stringIndex: 3, fret: 1, finger: 1, noteName: 'D#', octave: 3, pickDirection: 'down' },
      { stringIndex: 3, fret: 2, finger: 2, noteName: 'E', octave: 3, pickDirection: 'up' },
      { stringIndex: 3, fret: 3, finger: 3, noteName: 'F', octave: 3, pickDirection: 'down' },
      { stringIndex: 3, fret: 4, finger: 4, noteName: 'F#', octave: 3, pickDirection: 'up' },
      // String 2 (G)
      { stringIndex: 2, fret: 1, finger: 1, noteName: 'G#', octave: 3, pickDirection: 'down' },
      { stringIndex: 2, fret: 2, finger: 2, noteName: 'A', octave: 3, pickDirection: 'up' },
      { stringIndex: 2, fret: 3, finger: 3, noteName: 'A#', octave: 3, pickDirection: 'down' },
      { stringIndex: 2, fret: 4, finger: 4, noteName: 'B', octave: 3, pickDirection: 'up' },
      // String 1 (B)
      { stringIndex: 1, fret: 1, finger: 1, noteName: 'C', octave: 4, pickDirection: 'down' },
      { stringIndex: 1, fret: 2, finger: 2, noteName: 'C#', octave: 4, pickDirection: 'up' },
      { stringIndex: 1, fret: 3, finger: 3, noteName: 'D', octave: 4, pickDirection: 'down' },
      { stringIndex: 1, fret: 4, finger: 4, noteName: 'D#', octave: 4, pickDirection: 'up' },
      // String 0 (High E)
      { stringIndex: 0, fret: 1, finger: 1, noteName: 'F', octave: 4, pickDirection: 'down' },
      { stringIndex: 0, fret: 2, finger: 2, noteName: 'F#', octave: 4, pickDirection: 'up' },
      { stringIndex: 0, fret: 3, finger: 3, noteName: 'G', octave: 4, pickDirection: 'down' },
      { stringIndex: 0, fret: 4, finger: 4, noteName: 'G#', octave: 4, pickDirection: 'up', beatDuration: 2 },
    ],
  },
  {
    id: 'spider-permutation-1324',
    title: 'The 1-3-2-4 Finger Independence Drill',
    subtitle: 'Breaks natural tendon coupling between middle & ring fingers',
    category: 'dexterity',
    difficulty: 2,
    defaultBpm: 60,
    timeSignature: [4, 4],
    key: 'Chromatic',
    description:
      'In human anatomy, the ring and middle fingers share flexor tendons. This drill forces them to act independently by jumping 1 (Index) -> 3 (Ring) -> 2 (Middle) -> 4 (Pinky).',
    techniqueTip:
      'Start slow. Pay close attention when switching from Ring (3) back to Middle (2). Prevent your ring finger from popping straight up in the air.',
    notes: [
      // String 5
      { stringIndex: 5, fret: 1, finger: 1, noteName: 'F', octave: 2, pickDirection: 'down' },
      { stringIndex: 5, fret: 3, finger: 3, noteName: 'G', octave: 2, pickDirection: 'up' },
      { stringIndex: 5, fret: 2, finger: 2, noteName: 'F#', octave: 2, pickDirection: 'down' },
      { stringIndex: 5, fret: 4, finger: 4, noteName: 'G#', octave: 2, pickDirection: 'up' },
      // String 4
      { stringIndex: 4, fret: 1, finger: 1, noteName: 'A#', octave: 2, pickDirection: 'down' },
      { stringIndex: 4, fret: 3, finger: 3, noteName: 'C', octave: 3, pickDirection: 'up' },
      { stringIndex: 4, fret: 2, finger: 2, noteName: 'B', octave: 2, pickDirection: 'down' },
      { stringIndex: 4, fret: 4, finger: 4, noteName: 'C#', octave: 3, pickDirection: 'up' },
      // String 3
      { stringIndex: 3, fret: 1, finger: 1, noteName: 'D#', octave: 3, pickDirection: 'down' },
      { stringIndex: 3, fret: 3, finger: 3, noteName: 'F', octave: 3, pickDirection: 'up' },
      { stringIndex: 3, fret: 2, finger: 2, noteName: 'E', octave: 3, pickDirection: 'down' },
      { stringIndex: 3, fret: 4, finger: 4, noteName: 'F#', octave: 3, pickDirection: 'up' },
      // String 0 (High E)
      { stringIndex: 0, fret: 1, finger: 1, noteName: 'F', octave: 4, pickDirection: 'down' },
      { stringIndex: 0, fret: 3, finger: 3, noteName: 'G', octave: 4, pickDirection: 'up' },
      { stringIndex: 0, fret: 2, finger: 2, noteName: 'F#', octave: 4, pickDirection: 'down' },
      { stringIndex: 0, fret: 4, finger: 4, noteName: 'G#', octave: 4, pickDirection: 'up', beatDuration: 2 },
    ],
  },
  {
    id: 'spider-reverse-4321',
    title: 'Descending 4-3-2-1 Speed Crawl',
    subtitle: 'Reverses finger movement from pinky down to index',
    category: 'dexterity',
    difficulty: 2,
    defaultBpm: 65,
    timeSignature: [4, 4],
    key: 'Chromatic',
    description:
      'Descending from Pinky (4) -> Ring (3) -> Middle (2) -> Index (1) requires precise lift timing and prevents notes from accidentally choking off.',
    techniqueTip:
      'Keep each finger hovering just 5mm above its fret so it is ready to land instantly without extra wasted motion.',
    notes: [
      // String 0 (High E)
      { stringIndex: 0, fret: 4, finger: 4, noteName: 'G#', octave: 4, pickDirection: 'down' },
      { stringIndex: 0, fret: 3, finger: 3, noteName: 'G', octave: 4, pickDirection: 'up' },
      { stringIndex: 0, fret: 2, finger: 2, noteName: 'F#', octave: 4, pickDirection: 'down' },
      { stringIndex: 0, fret: 1, finger: 1, noteName: 'F', octave: 4, pickDirection: 'up' },
      // String 1 (B)
      { stringIndex: 1, fret: 4, finger: 4, noteName: 'D#', octave: 4, pickDirection: 'down' },
      { stringIndex: 1, fret: 3, finger: 3, noteName: 'D', octave: 4, pickDirection: 'up' },
      { stringIndex: 1, fret: 2, finger: 2, noteName: 'C#', octave: 4, pickDirection: 'down' },
      { stringIndex: 1, fret: 1, finger: 1, noteName: 'C', octave: 4, pickDirection: 'up' },
      // String 2 (G)
      { stringIndex: 2, fret: 4, finger: 4, noteName: 'B', octave: 3, pickDirection: 'down' },
      { stringIndex: 2, fret: 3, finger: 3, noteName: 'A#', octave: 3, pickDirection: 'up' },
      { stringIndex: 2, fret: 2, finger: 2, noteName: 'A', octave: 3, pickDirection: 'down' },
      { stringIndex: 2, fret: 1, finger: 1, noteName: 'G#', octave: 3, pickDirection: 'up' },
      // String 5 (Low E)
      { stringIndex: 5, fret: 4, finger: 4, noteName: 'G#', octave: 2, pickDirection: 'down' },
      { stringIndex: 5, fret: 3, finger: 3, noteName: 'G', octave: 2, pickDirection: 'up' },
      { stringIndex: 5, fret: 2, finger: 2, noteName: 'F#', octave: 2, pickDirection: 'down' },
      { stringIndex: 5, fret: 1, finger: 1, noteName: 'F', octave: 2, pickDirection: 'up', beatDuration: 2 },
    ],
  },

  // ==========================================
  // PICKING & ARTICULATION MECHANICS
  // ==========================================
  {
    id: 'strict-alternate-picking',
    title: 'Strict Alternate Picking Engine',
    subtitle: 'Unbreakable Down-Up-Down-Up synchronization across strings',
    category: 'picking',
    difficulty: 2,
    defaultBpm: 80,
    timeSignature: [4, 4],
    key: 'A',
    description:
      'Speed on guitar is 80% picking mechanics. This exercise enforces constant alternating strokes (↓ ↑ ↓ ↑) across two strings to eliminate double-down picking.',
    techniqueTip:
      'Keep your picking motion small and centered in your wrist, not your elbow. Hold the pick firmly with just the tip extending 2-3mm beyond your thumb.',
    notes: [
      { stringIndex: 4, fret: 5, finger: 1, noteName: 'D', octave: 3, pickDirection: 'down' },
      { stringIndex: 4, fret: 7, finger: 3, noteName: 'E', octave: 3, pickDirection: 'up' },
      { stringIndex: 3, fret: 5, finger: 1, noteName: 'G', octave: 3, pickDirection: 'down' },
      { stringIndex: 3, fret: 7, finger: 3, noteName: 'A', octave: 3, pickDirection: 'up' },
      { stringIndex: 4, fret: 5, finger: 1, noteName: 'D', octave: 3, pickDirection: 'down' },
      { stringIndex: 4, fret: 7, finger: 3, noteName: 'E', octave: 3, pickDirection: 'up' },
      { stringIndex: 3, fret: 5, finger: 1, noteName: 'G', octave: 3, pickDirection: 'down' },
      { stringIndex: 3, fret: 7, finger: 3, noteName: 'A', octave: 3, pickDirection: 'up' },
      { stringIndex: 2, fret: 5, finger: 1, noteName: 'C', octave: 4, pickDirection: 'down' },
      { stringIndex: 2, fret: 7, finger: 3, noteName: 'D', octave: 4, pickDirection: 'up' },
      { stringIndex: 1, fret: 5, finger: 1, noteName: 'E', octave: 4, pickDirection: 'down' },
      { stringIndex: 1, fret: 7, finger: 3, noteName: 'F#', octave: 4, pickDirection: 'up', beatDuration: 2 },
    ],
  },
  {
    id: 'hammer-on-pull-off-trill',
    title: 'Hammer-On & Pull-Off Trill Stamina',
    subtitle: 'Left hand percussive attack & clean snap articulation',
    category: 'picking',
    difficulty: 3,
    defaultBpm: 75,
    timeSignature: [4, 4],
    key: 'Am',
    description:
      'Hammer-ons require a decisive, hammer-like strike directly with the fingertip. Pull-offs require a slight downward flick of the string rather than simply lifting off.',
    techniqueTip:
      'For pull-offs, flick the string slightly downward towards the floor with your ring finger so the open or lower fret rings loudly with crisp volume.',
    notes: [
      { stringIndex: 2, fret: 5, finger: 1, noteName: 'C', octave: 4, pickDirection: 'down' },
      { stringIndex: 2, fret: 7, finger: 3, noteName: 'D', octave: 4, pickDirection: 'up' },
      { stringIndex: 2, fret: 5, finger: 1, noteName: 'C', octave: 4, pickDirection: 'down' },
      { stringIndex: 2, fret: 7, finger: 3, noteName: 'D', octave: 4, pickDirection: 'up' },
      { stringIndex: 1, fret: 5, finger: 1, noteName: 'E', octave: 4, pickDirection: 'down' },
      { stringIndex: 1, fret: 8, finger: 4, noteName: 'G', octave: 4, pickDirection: 'up' },
      { stringIndex: 1, fret: 5, finger: 1, noteName: 'E', octave: 4, pickDirection: 'down' },
      { stringIndex: 1, fret: 8, finger: 4, noteName: 'G', octave: 4, pickDirection: 'up' },
      { stringIndex: 0, fret: 5, finger: 1, noteName: 'A', octave: 4, pickDirection: 'down' },
      { stringIndex: 0, fret: 8, finger: 4, noteName: 'C', octave: 5, pickDirection: 'up' },
      { stringIndex: 0, fret: 5, finger: 1, noteName: 'A', octave: 4, pickDirection: 'down', beatDuration: 2 },
    ],
  },
  {
    id: 'triad-arpeggio-workout',
    title: 'Major & Minor Triad Arpeggios',
    subtitle: 'Targeting chord tones (Root - 3rd - 5th) across the fretboard',
    category: 'picking',
    difficulty: 3,
    defaultBpm: 70,
    timeSignature: [4, 4],
    key: 'A Major / A Minor',
    description:
      'Arpeggios outline the harmonic blueprint of any song. This workout moves between A Major (A-C#-E) and A Minor (A-C-E) triads to train precision picking and finger placement.',
    techniqueTip:
      'Roll your index finger smoothly or use distinct fingertips to ensure each note speaks clearly on its own without ringing into an unruly chord.',
    notes: [
      // A Major Triad
      { stringIndex: 3, fret: 7, finger: 3, noteName: 'A', octave: 3, degree: 'Root (A)', pickDirection: 'down' },
      { stringIndex: 2, fret: 6, finger: 2, noteName: 'C#', octave: 4, degree: 'Maj 3rd', pickDirection: 'down' },
      { stringIndex: 1, fret: 5, finger: 1, noteName: 'E', octave: 4, degree: '5th', pickDirection: 'down' },
      { stringIndex: 0, fret: 5, finger: 1, noteName: 'A', octave: 4, degree: 'High Root', pickDirection: 'up' },
      // Descend
      { stringIndex: 1, fret: 5, finger: 1, noteName: 'E', octave: 4, degree: '5th', pickDirection: 'up' },
      { stringIndex: 2, fret: 6, finger: 2, noteName: 'C#', octave: 4, degree: 'Maj 3rd', pickDirection: 'up' },
      // A Minor Triad
      { stringIndex: 3, fret: 7, finger: 3, noteName: 'A', octave: 3, degree: 'Root (A)', pickDirection: 'down' },
      { stringIndex: 2, fret: 5, finger: 1, noteName: 'C', octave: 4, degree: 'Min 3rd', pickDirection: 'down' },
      { stringIndex: 1, fret: 5, finger: 1, noteName: 'E', octave: 4, degree: '5th', pickDirection: 'down' },
      { stringIndex: 0, fret: 5, finger: 1, noteName: 'A', octave: 4, degree: 'High Root', pickDirection: 'up', beatDuration: 2 },
    ],
  },

  // ==========================================
  // BEGINNER CHORD TRANSITION DRILLS
  // ==========================================
  {
    id: 'chord-switch-gcd',
    title: 'The 60-Second Strum: G - C - D',
    subtitle: 'The "Holy Trinity" progression behind hundreds of classic hits',
    category: 'chords',
    difficulty: 1,
    defaultBpm: 68,
    timeSignature: [4, 4],
    key: 'G',
    description:
      'Mastering the rapid, unhesitating transition between G Major, C Major, and D Major unlocks 70% of popular acoustic songs. Practice smooth strumming without pauses between chord changes.',
    techniqueTip:
      'Anchor Rule: When moving from C to D, keep your index and middle fingers hovering closely. When moving from D to G, swing your ring finger as a guide to fret 3 of the B or high E string.',
    notes: [],
    chordProgression: ['G', 'C', 'D', 'G', 'C', 'G', 'D', 'G'],
  },
  {
    id: 'chord-switch-em-am-c-d',
    title: 'The Minor Folk Shift: Em - Am - C - D',
    subtitle: 'Smooth finger pivoting using shared anchor fingers',
    category: 'chords',
    difficulty: 2,
    defaultBpm: 72,
    timeSignature: [4, 4],
    key: 'G / Em',
    description:
      'Notice that Em and Am have nearly identical finger shapes shifted down by one string. C Major uses the exact same first two fingers as Am with only the ring finger stretching to fret 3.',
    techniqueTip:
      'Pivot technique: When shifting from Am to C, do not lift fingers 1 and 2! Keep them glued to the strings and merely reach your 3rd finger up to string 5, fret 3.',
    notes: [],
    chordProgression: ['Em', 'Am', 'C', 'D', 'Em', 'Am', 'D', 'Em'],
  },
  {
    id: 'chord-switch-rock-power',
    title: 'Classic Rock Power Groove: E5 - A5 - D5',
    subtitle: 'Two-finger rock foundation for electric and acoustic overdrive',
    category: 'chords',
    difficulty: 1,
    defaultBpm: 90,
    timeSignature: [4, 4],
    key: 'A',
    description:
      'Clean power chords are punchy and versatile. Practice muting idle higher strings with the underside of your index finger for tight, distortion-friendly rhythm.',
    techniqueTip:
      'Keep your wrist firm and strum with confidence. Rest your strumming palm lightly near the bridge for optional palm muting chug.',
    notes: [],
    chordProgression: ['E', 'A', 'D', 'A', 'E', 'A', 'D', 'E'],
  },
];
