export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type SongMode = 'lead' | 'chord';

export interface GuitarStringNote {
  stringIndex: number; // 0 = High E, 1 = B, 2 = G, 3 = D, 4 = A, 5 = Low E
  fret: number;        // 0 to 24
  noteName: string;    // e.g. "E", "F#", "G"
  octave: number;      // e.g. 2, 3, 4
  frequency: number;   // e.g. 82.41
  time: number;        // in seconds from start
  duration: number;    // in seconds
  finger?: number;     // 1=index, 2=middle, 3=ring, 4=pinky, 0=none
  hitState?: 'pending' | 'perfect' | 'great' | 'miss';
}

export interface GuitarChordEvent {
  name: string;        // e.g. "Em", "C", "G", "D", "Am"
  root: string;        // e.g. "E", "C", "G"
  frets: number[];     // length 6: [highE, B, G, D, A, lowE], -1 = mute, 0 = open
  fingers: number[];   // finger numbers 1-4 for each string (0 if open or muted)
  strumDirection: 'down' | 'up';
  time: number;        // in seconds from start
  duration: number;    // in seconds
  hitState?: 'pending' | 'perfect' | 'great' | 'miss';
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: 'Classic Rock' | 'Acoustic' | 'Indie & Pop' | 'Blues & Jazz' | 'Metal & Heavy' | 'Classical' | 'Folk & Country';
  difficulty: DifficultyLevel;
  difficultyLabel: string;
  mode: SongMode;
  bpm: number;
  timeSignature: [number, number];
  duration: number; // in seconds
  coverImage?: string;
  description: string;
  key: string;
  leadNotes?: GuitarStringNote[];
  chordEvents?: GuitarChordEvent[];
}

export interface StandardTuningString {
  stringIndex: number;
  label: string;      // e.g. "6th - E2"
  shortName: string;  // e.g. "E"
  octave: number;
  noteName: string;   // "E"
  targetFreq: number; // 82.41
  gauge: string;      // e.g. ".046"
  color: string;      // Yousician style string color
}

export interface DetectedPitch {
  freq: number;
  noteName: string;
  octave: number;
  cents: number;
  midi: number;
  confidence: number;
  rms: number;
}

export interface PerformanceStats {
  score: number;
  maxScore: number;
  streak: number;
  maxStreak: number;
  perfectCount: number;
  greatCount: number;
  missCount: number;
  accuracy: number;
  stars: number;
}

export interface SongProgressRecord {
  songId: string;
  songTitle: string;
  artist: string;
  difficulty: DifficultyLevel;
  mode: SongMode;
  highScore: number;
  bestAccuracy: number;
  stars: number;
  timesCompleted: number;
  lastPlayedAt: string;
}

export interface PracticeHistoryEntry {
  id: string;
  date: string;
  songId: string;
  songTitle: string;
  artist: string;
  difficulty: DifficultyLevel;
  mode: SongMode;
  accuracy: number;
  score: number;
  stars: number;
}

export interface UserProgressData {
  completedSongs: Record<string, SongProgressRecord>;
  practiceSessionsCount: number;
  totalNotesHit: number;
  totalSecondsPracticed: number;
  currentDailyStreak: number;
  longestDailyStreak: number;
  lastPracticeDate: string; // YYYY-MM-DD
  history: PracticeHistoryEntry[];
}

