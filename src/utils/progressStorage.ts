import { UserProgressData, SongProgressRecord, PracticeHistoryEntry, Song } from '../types/guitar';

const STORAGE_KEY = 'stringmaster_user_progress_v1';

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

const DEFAULT_PROGRESS: UserProgressData = {
  completedSongs: {
    'smoke-on-the-water': {
      songId: 'smoke-on-the-water',
      songTitle: 'Smoke on the Water (Iconic Riff)',
      artist: 'Deep Purple',
      difficulty: 1,
      mode: 'lead',
      highScore: 3200,
      bestAccuracy: 92,
      stars: 3,
      timesCompleted: 4,
      lastPlayedAt: getTodayString(),
    },
    'stand-by-me': {
      songId: 'stand-by-me',
      songTitle: 'Stand By Me (Classic Strum)',
      artist: 'Ben E. King',
      difficulty: 1,
      mode: 'chord',
      highScore: 2800,
      bestAccuracy: 88,
      stars: 2,
      timesCompleted: 2,
      lastPlayedAt: getYesterdayString(),
    },
  },
  practiceSessionsCount: 6,
  totalNotesHit: 342,
  totalSecondsPracticed: 580, // ~10 mins
  currentDailyStreak: 3,
  longestDailyStreak: 5,
  lastPracticeDate: getTodayString(),
  history: [
    {
      id: 'hist-1',
      date: getTodayString(),
      songId: 'smoke-on-the-water',
      songTitle: 'Smoke on the Water',
      artist: 'Deep Purple',
      difficulty: 1,
      mode: 'lead',
      accuracy: 92,
      score: 3200,
      stars: 3,
    },
    {
      id: 'hist-2',
      date: getYesterdayString(),
      songId: 'stand-by-me',
      songTitle: 'Stand By Me',
      artist: 'Ben E. King',
      difficulty: 1,
      mode: 'chord',
      accuracy: 88,
      score: 2800,
      stars: 2,
    },
    {
      id: 'hist-3',
      date: '2026-10-09',
      songId: 'seven-nation-army',
      songTitle: 'Seven Nation Army',
      artist: 'The White Stripes',
      difficulty: 1,
      mode: 'lead',
      accuracy: 84,
      score: 2450,
      stars: 2,
    },
  ],
};

export function loadUserProgress(): UserProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveUserProgress(DEFAULT_PROGRESS);
      return DEFAULT_PROGRESS;
    }
    const parsed = JSON.parse(raw) as UserProgressData;
    return parsed;
  } catch (err) {
    console.warn('Error reading user progress, using defaults:', err);
    return DEFAULT_PROGRESS;
  }
}

export function saveUserProgress(data: UserProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Error saving user progress to localStorage:', err);
  }
}

export function recordSongCompletion(
  current: UserProgressData,
  song: Song,
  score: number,
  accuracy: number,
  stars: number,
  notesHit: number,
  durationPracticed: number
): UserProgressData {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  // Streak logic
  let newCurrentStreak = current.currentDailyStreak;
  if (!current.lastPracticeDate) {
    newCurrentStreak = 1;
  } else if (current.lastPracticeDate === today) {
    // Already practiced today, keep streak
  } else if (current.lastPracticeDate === yesterday) {
    newCurrentStreak += 1;
  } else {
    // Missed at least one day
    newCurrentStreak = 1;
  }

  const newLongestStreak = Math.max(current.longestDailyStreak, newCurrentStreak);

  // Update or insert song record
  const existingRecord = current.completedSongs[song.id];
  const updatedRecord: SongProgressRecord = {
    songId: song.id,
    songTitle: song.title,
    artist: song.artist,
    difficulty: song.difficulty,
    mode: song.mode,
    highScore: existingRecord ? Math.max(existingRecord.highScore, score) : score,
    bestAccuracy: existingRecord ? Math.max(existingRecord.bestAccuracy, accuracy) : accuracy,
    stars: existingRecord ? Math.max(existingRecord.stars, stars) : stars,
    timesCompleted: existingRecord ? existingRecord.timesCompleted + 1 : 1,
    lastPlayedAt: today,
  };

  const newHistoryEntry: PracticeHistoryEntry = {
    id: `hist-${Date.now()}`,
    date: today,
    songId: song.id,
    songTitle: song.title,
    artist: song.artist,
    difficulty: song.difficulty,
    mode: song.mode,
    accuracy,
    score,
    stars,
  };

  const updated: UserProgressData = {
    ...current,
    completedSongs: {
      ...current.completedSongs,
      [song.id]: updatedRecord,
    },
    practiceSessionsCount: current.practiceSessionsCount + 1,
    totalNotesHit: current.totalNotesHit + notesHit,
    totalSecondsPracticed: current.totalSecondsPracticed + Math.round(durationPracticed),
    currentDailyStreak: newCurrentStreak,
    longestDailyStreak: newLongestStreak,
    lastPracticeDate: today,
    history: [newHistoryEntry, ...current.history.slice(0, 24)], // keep last 25 sessions
  };

  saveUserProgress(updated);
  return updated;
}
