import { StandardTuningString } from '../types/guitar';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const STRING_COLORS = [
  '#F59E0B', // String 0: High E (Golden Amber)
  '#38BDF8', // String 1: B (Sky Blue)
  '#FB923C', // String 2: G (Orange)
  '#34D399', // String 3: D (Emerald)
  '#F43F5E', // String 4: A (Rose)
  '#A855F7', // String 5: Low E (Purple)
];

export const STRING_NAMES = ['1st (High E)', '2nd (B)', '3rd (G)', '4th (D)', '5th (A)', '6th (Low E)'];

export const STANDARD_TUNING: StandardTuningString[] = [
  {
    stringIndex: 0,
    label: '1st - E4',
    shortName: 'e',
    octave: 4,
    noteName: 'E',
    targetFreq: 329.63,
    gauge: '.010',
    color: STRING_COLORS[0],
  },
  {
    stringIndex: 1,
    label: '2nd - B3',
    shortName: 'B',
    octave: 3,
    noteName: 'B',
    targetFreq: 246.94,
    gauge: '.013',
    color: STRING_COLORS[1],
  },
  {
    stringIndex: 2,
    label: '3rd - G3',
    shortName: 'G',
    octave: 3,
    noteName: 'G',
    targetFreq: 196.00,
    gauge: '.017',
    color: STRING_COLORS[2],
  },
  {
    stringIndex: 3,
    label: '4th - D3',
    shortName: 'D',
    octave: 3,
    noteName: 'D',
    targetFreq: 146.83,
    gauge: '.026',
    color: STRING_COLORS[3],
  },
  {
    stringIndex: 4,
    label: '5th - A2',
    shortName: 'A',
    octave: 2,
    noteName: 'A',
    targetFreq: 110.00,
    gauge: '.036',
    color: STRING_COLORS[4],
  },
  {
    stringIndex: 5,
    label: '6th - E2',
    shortName: 'E',
    octave: 2,
    noteName: 'E',
    targetFreq: 82.41,
    gauge: '.046',
    color: STRING_COLORS[5],
  },
];

// Open string MIDI numbers [highE, B, G, D, A, lowE]
export const OPEN_STRING_MIDI = [64, 59, 55, 50, 45, 40]; // E4=64, B3=59, G3=55, D3=50, A2=45, E2=40

/**
 * Returns exact frequency for a given string index (0-5) and fret (0-24)
 */
export function getFretFrequency(stringIndex: number, fret: number): number {
  const openMidi = OPEN_STRING_MIDI[stringIndex] || 40;
  const noteMidi = openMidi + fret;
  return 440 * Math.pow(2, (noteMidi - 69) / 12);
}

/**
 * Returns note name and octave for string and fret
 */
export function getFretNoteInfo(stringIndex: number, fret: number): { noteName: string; octave: number; midi: number } {
  const openMidi = OPEN_STRING_MIDI[stringIndex] || 40;
  const midi = openMidi + fret;
  const noteName = NOTE_NAMES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { noteName, octave, midi };
}

/**
 * Converts frequency in Hz to closest MIDI, note name, octave, and cents deviation (-50 to +50)
 */
export function frequencyToNote(frequency: number): {
  noteName: string;
  octave: number;
  midi: number;
  cents: number;
  exactFreq: number;
} | null {
  if (frequency <= 0 || isNaN(frequency)) return null;

  const midiExact = 69 + 12 * Math.log2(frequency / 440);
  const midi = Math.round(midiExact);
  const cents = Math.round((midiExact - midi) * 100);
  const exactFreq = 440 * Math.pow(2, (midi - 69) / 12);

  const noteIndex = ((midi % 12) + 12) % 12;
  const noteName = NOTE_NAMES[noteIndex];
  const octave = Math.floor(midi / 12) - 1;

  return { noteName, octave, midi, cents, exactFreq };
}

/**
 * Chord definitions for display, diagram generation, and sound synthesis.
 * frets order: [highE (0), B (1), G (2), D (3), A (4), LowE (5)]
 * -1 = mute, 0 = open
 */
export interface ChordDefinition {
  name: string;
  root: string;
  type: string;
  frets: number[];   // [highE, B, G, D, A, lowE]
  fingers: number[]; // [highE, B, G, D, A, lowE] 1=index, 2=middle, 3=ring, 4=pinky, 0=none
  baseFret?: number; // default 1
  difficulty: number; // 1-5
  description: string;
}

export const CHORD_LIBRARY: Record<string, ChordDefinition> = {
  'Em': {
    name: 'Em',
    root: 'E',
    type: 'Minor',
    frets: [0, 0, 0, 2, 2, 0],
    fingers: [0, 0, 0, 3, 2, 0],
    difficulty: 1,
    description: 'E Minor: The easiest, rich, open chord in guitar history.',
  },
  'C': {
    name: 'C',
    root: 'C',
    type: 'Major',
    frets: [0, 1, 0, 2, 3, -1],
    fingers: [0, 1, 0, 2, 3, 0],
    difficulty: 2,
    description: 'C Major: Foundation open chord spanning 3 frets.',
  },
  'G': {
    name: 'G',
    root: 'G',
    type: 'Major',
    frets: [3, 0, 0, 0, 2, 3],
    fingers: [4, 0, 0, 0, 1, 2],
    difficulty: 2,
    description: 'G Major: The king of folk and rock acoustics.',
  },
  'D': {
    name: 'D',
    root: 'D',
    type: 'Major',
    frets: [2, 3, 2, 0, -1, -1],
    fingers: [2, 3, 1, 0, 0, 0],
    difficulty: 2,
    description: 'D Major: Bright, triangular open triad on upper 4 strings.',
  },
  'Am': {
    name: 'Am',
    root: 'A',
    type: 'Minor',
    frets: [0, 1, 2, 2, 0, -1],
    fingers: [0, 1, 3, 2, 0, 0],
    difficulty: 2,
    description: 'A Minor: Somber, classic open minor shape.',
  },
  'E': {
    name: 'E',
    root: 'E',
    type: 'Major',
    frets: [0, 0, 1, 2, 2, 0],
    fingers: [0, 0, 1, 3, 2, 0],
    difficulty: 2,
    description: 'E Major: Full-bodied rock staple vibrating all 6 strings.',
  },
  'A': {
    name: 'A',
    root: 'A',
    type: 'Major',
    frets: [0, 2, 2, 2, 0, -1],
    fingers: [0, 3, 2, 1, 0, 0],
    difficulty: 2,
    description: 'A Major: Clean 3-finger cluster on the second fret.',
  },
  'Dm': {
    name: 'Dm',
    root: 'D',
    type: 'Minor',
    frets: [1, 3, 2, 0, -1, -1],
    fingers: [1, 3, 2, 0, 0, 0],
    difficulty: 2,
    description: 'D Minor: Melodic, poignant open triad.',
  },
  'F': {
    name: 'F',
    root: 'F',
    type: 'Barre Major',
    frets: [1, 1, 2, 3, 3, 1],
    fingers: [1, 1, 2, 4, 3, 1],
    difficulty: 3,
    description: 'F Major: The rite-of-passage full 1st fret barre chord.',
  },
  'Bm': {
    name: 'Bm',
    root: 'B',
    type: 'Barre Minor',
    frets: [2, 3, 4, 4, 2, -1],
    fingers: [1, 2, 4, 3, 1, 0],
    difficulty: 3,
    description: 'B Minor: Essential 2nd fret 5-string barre chord.',
  },
  'A7': {
    name: 'A7',
    root: 'A',
    type: 'Dominant 7th',
    frets: [0, 2, 0, 2, 0, -1],
    fingers: [0, 3, 0, 2, 0, 0],
    difficulty: 2,
    description: 'A7: Soulful open blues dominant chord.',
  },
  'E7': {
    name: 'E7',
    root: 'E',
    type: 'Dominant 7th',
    frets: [0, 0, 1, 0, 2, 0],
    fingers: [0, 0, 1, 0, 2, 0],
    difficulty: 2,
    description: 'E7: Delta blues staple requiring just 2 fingers.',
  },
  'D7': {
    name: 'D7',
    root: 'D',
    type: 'Dominant 7th',
    frets: [2, 1, 2, 0, -1, -1],
    fingers: [3, 1, 2, 0, 0, 0],
    difficulty: 2,
    description: 'D7: Inverted triangle shape for blues and country.',
  },
  'G7': {
    name: 'G7',
    root: 'G',
    type: 'Dominant 7th',
    frets: [1, 0, 0, 0, 2, 3],
    fingers: [1, 0, 0, 0, 2, 3],
    difficulty: 3,
    description: 'G7: Wide-spread finger span for jazz/folk resolutions.',
  },
  'Cmaj7': {
    name: 'Cmaj7',
    root: 'C',
    type: 'Major 7th',
    frets: [0, 0, 0, 2, 3, -1],
    fingers: [0, 0, 0, 2, 3, 0],
    difficulty: 3,
    description: 'Cmaj7: Dreamy, lush neo-soul and bossa nova open chord.',
  },
  'F#m': {
    name: 'F#m',
    root: 'F#',
    type: 'Barre Minor',
    frets: [2, 2, 2, 4, 4, 2],
    fingers: [1, 1, 1, 4, 3, 1],
    difficulty: 4,
    description: 'F#m: 2nd fret full 6-string barre minor chord.',
  },
  'B7': {
    name: 'B7',
    root: 'B',
    type: 'Dominant 7th',
    frets: [2, 0, 2, 1, 2, -1],
    fingers: [4, 0, 3, 1, 2, 0],
    difficulty: 3,
    description: 'B7: Classic acoustic blues progression resolution.',
  },
  'Dsus4': {
    name: 'Dsus4',
    root: 'D',
    type: 'Suspended 4th',
    frets: [3, 3, 2, 0, -1, -1],
    fingers: [4, 3, 2, 0, 0, 0],
    difficulty: 2,
    description: 'Dsus4: The tension builder heard in classic rock intros.',
  },
  'B': {
    name: 'B',
    root: 'B',
    type: 'Barre Major',
    frets: [2, 4, 4, 4, 2, -1],
    fingers: [1, 4, 3, 2, 1, 0],
    difficulty: 3,
    description: 'B Major: Essential 2nd-fret 5-string major barre chord.',
  },
  'Bb': {
    name: 'Bb',
    root: 'A#',
    type: 'Barre Major',
    frets: [1, 3, 3, 3, 1, -1],
    fingers: [1, 4, 3, 2, 1, 0],
    difficulty: 3,
    description: 'Bb Major: Classic 1st-fret A-shape major barre chord.',
  },
  'Cm': {
    name: 'Cm',
    root: 'C',
    type: 'Barre Minor',
    frets: [3, 4, 5, 5, 3, -1],
    fingers: [1, 2, 4, 3, 1, 0],
    difficulty: 3,
    description: 'C Minor: Expressive 3rd-fret minor barre chord.',
  },
  'C#m': {
    name: 'C#m',
    root: 'C#',
    type: 'Barre Minor',
    frets: [4, 5, 6, 6, 4, -1],
    fingers: [1, 2, 4, 3, 1, 0],
    difficulty: 3,
    description: 'C# Minor: 4th-fret minor barre chord staple in E major progressions.',
  },
  'F#': {
    name: 'F#',
    root: 'F#',
    type: 'Barre Major',
    frets: [2, 2, 3, 4, 4, 2],
    fingers: [1, 1, 2, 4, 3, 1],
    difficulty: 3,
    description: 'F# Major: Full 2nd-fret E-shape major barre chord.',
  },
  'Em7': {
    name: 'Em7',
    root: 'E',
    type: 'Minor 7th',
    frets: [3, 3, 0, 2, 2, 0],
    fingers: [4, 3, 0, 2, 1, 0],
    difficulty: 1,
    description: 'Em7: Bright Britpop & acoustic staple with anchored top strings.',
  },
  'A7sus4': {
    name: 'A7sus4',
    root: 'A',
    type: 'Suspended 7th',
    frets: [3, 3, 0, 2, 0, -1],
    fingers: [4, 3, 0, 1, 0, 0],
    difficulty: 2,
    description: 'A7sus4: Open suspended seventh chord with ringing high D and G notes.',
  },
  'Cadd9': {
    name: 'Cadd9',
    root: 'C',
    type: 'Added 9th',
    frets: [3, 3, 0, 2, 3, -1],
    fingers: [4, 3, 0, 1, 2, 0],
    difficulty: 2,
    description: 'Cadd9: Rich modern acoustic C chord with added 9th on the B string.',
  },
};

/**
 * Standard scales for interactive fretboard highlighting
 */
export const GUITAR_SCALES = [
  {
    id: 'a-minor-pentatonic',
    name: 'A Minor Pentatonic',
    root: 'A',
    notes: ['A', 'C', 'D', 'E', 'G'],
    description: 'The most popular guitar solo scale in rock, blues, and pop.',
  },
  {
    id: 'e-minor-pentatonic',
    name: 'E Minor Pentatonic',
    root: 'E',
    notes: ['E', 'G', 'A', 'B', 'D'],
    description: 'Universal open-string heavy rock and metal riff scale.',
  },
  {
    id: 'a-blues',
    name: 'A Blues Scale',
    root: 'A',
    notes: ['A', 'C', 'D', 'D#', 'E', 'G'],
    description: 'Adds the gritty diminished fifth "blue note" (D#).',
  },
  {
    id: 'c-major',
    name: 'C Major Diatonic',
    root: 'C',
    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    description: 'Standard natural diatonic major foundation scale.',
  },
];
