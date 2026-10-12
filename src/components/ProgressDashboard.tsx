import React from 'react';
import {
  Flame,
  Award,
  Clock,
  TrendingUp,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { UserProgressData, SongProgressRecord, Song } from '../types/guitar';
import { SONGS_CATALOG } from '../data/songs';

interface ProgressDashboardProps {
  progress: UserProgressData;
  onSelectSongToPlay: (song: Song) => void;
  onResetProgress?: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  progress,
  onSelectSongToPlay,
  onResetProgress,
}) => {
  const completedList = Object.values(progress.completedSongs);

  // Compute average accuracy across all recorded history sessions
  const totalAccuracySum = progress.history.reduce((sum, h) => sum + h.accuracy, 0);
  const averageAccuracy =
    progress.history.length > 0 ? Math.round((totalAccuracySum / progress.history.length) * 10) / 10 : 0;

  // Total practice minutes
  const practiceMinutes = Math.round(progress.totalSecondsPracticed / 60);

  // Difficulty counts of completed songs
  const levelCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  completedList.forEach((item) => {
    levelCounts[item.difficulty] = (levelCounts[item.difficulty] || 0) + 1;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header Deck */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Guitar Practice & Mastery Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track daily practice streaks, session accuracy averages, and completed songs.
          </p>
        </div>

        {/* Date Stamp */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Last Active: {progress.lastPracticeDate || 'Today'}</span>
        </div>
      </div>

      {/* 4 Core Stat Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Daily Practice Streak */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>DAILY STREAK</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-black text-amber-400 font-mono tabular-nums">
              {progress.currentDailyStreak}
            </span>
            <span className="text-xs font-semibold text-slate-400">Days</span>
          </div>
          <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
            <span>Longest Streak:</span>
            <span className="text-slate-300 font-bold tabular-nums">
              {progress.longestDailyStreak} days
            </span>
          </div>
        </div>

        {/* Metric 2: Average Accuracy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>AVERAGE ACCURACY</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-black text-emerald-400 font-mono tabular-nums">
              {averageAccuracy}%
            </span>
          </div>
          <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
            <span>Based on</span>
            <span className="text-slate-300 font-bold tabular-nums">
              {progress.practiceSessionsCount} sessions
            </span>
          </div>
        </div>

        {/* Metric 3: Completed Songs Count */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>COMPLETED SONGS</span>
            <Award className="w-4 h-4 text-sky-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-black text-white font-mono tabular-nums">
              {completedList.length}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              / {SONGS_CATALOG.length} In Catalog
            </span>
          </div>
          <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
            <span>Levels:</span>
            <span className="text-slate-300 font-bold">
              L1({levelCounts[1]}) · L2({levelCounts[2]}) · L3({levelCounts[3]})
            </span>
          </div>
        </div>

        {/* Metric 4: Total Practice Time & Notes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>PRACTICE TIME</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-black text-purple-300 font-mono tabular-nums">
              {practiceMinutes}
            </span>
            <span className="text-xs font-semibold text-slate-400">Minutes</span>
          </div>
          <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
            <span>Notes Hit:</span>
            <span className="text-slate-300 font-bold tabular-nums">
              {progress.totalNotesHit} notes
            </span>
          </div>
        </div>
      </div>

      {/* Main Split: Completed Songs Catalog & Session History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Completed Songs List */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Mastered & Completed Songs ({completedList.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Songs you have practiced and completed with performance records.
              </p>
            </div>
          </div>

          {completedList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-mono">
              No completed songs recorded yet. Head over to the Song Catalog and start playing!
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {completedList.map((item) => {
                const catalogSong = SONGS_CATALOG.find((s) => s.id === item.songId);
                return (
                  <div
                    key={item.songId}
                    className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-4 hover:border-slate-700 transition"
                  >
                    <div className="flex-1 min-w-0">
                      {/* Unboxed metadata */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mb-1">
                        <span className="text-amber-400 font-bold">Lvl {item.difficulty}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{item.mode} Mode</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.timesCompleted}x Played</span>
                      </div>

                      <h4 className="text-sm font-bold text-white truncate">{item.songTitle}</h4>
                      <div className="text-xs text-slate-400 truncate">{item.artist}</div>

                      {/* Score & Accuracy metrics */}
                      <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                        <span className="text-emerald-400 font-bold tabular-nums">
                          {item.bestAccuracy}% Accuracy
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-amber-400 font-bold tabular-nums">
                          {item.highScore} pts
                        </span>
                      </div>
                    </div>

                    {/* Stars & Play CTA */}
                    <div className="flex flex-col items-end gap-2.5 shrink-0">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((star) => (
                          <Sparkles
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= item.stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-800'
                            }`}
                          />
                        ))}
                      </div>

                      {catalogSong && (
                        <button
                          onClick={() => onSelectSongToPlay(catalogSong)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition flex items-center gap-1.5"
                        >
                          <Play className="w-3 h-3 fill-slate-950" />
                          <span>Play</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Practice Sessions Log */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Recent Sessions</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Session history log across all song runs.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {progress.history.length} logged
            </span>
          </div>

          <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[460px] pr-1">
            {progress.history.map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{entry.songTitle}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {entry.date} · Lvl {entry.difficulty} · {entry.mode}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 font-mono text-xs">
                  <span
                    className={
                      entry.accuracy >= 90
                        ? 'text-emerald-400 font-bold'
                        : entry.accuracy >= 70
                        ? 'text-sky-400 font-bold'
                        : 'text-amber-400 font-bold'
                    }
                  >
                    {entry.accuracy}%
                  </span>
                  <span className="text-slate-500 text-[10px] tabular-nums">
                    {entry.score} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
