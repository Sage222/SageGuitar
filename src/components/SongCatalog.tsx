import React, { useState } from 'react';
import {
  Search,
  Play,
  Music,
  X,
  Clock,
  Sparkles,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import { Song, DifficultyLevel, SongMode } from '../types/guitar';

interface SongCatalogProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  selectedSongId?: string;
  onNavigateToPractice?: () => void;
}

const DIFFICULTY_LEVELS: { level: DifficultyLevel; name: string; desc: string }[] = [
  { level: 1, name: 'Lvl 1: Novice', desc: 'Open strings & frets 1–4 (First position)' },
  { level: 2, name: 'Lvl 2: Elementary', desc: 'Open strings & frets 1–8' },
  { level: 3, name: 'Lvl 3: Intermediate', desc: 'Frets 1–8 with complex rhythms & variety' },
  { level: 4, name: 'Lvl 4: Advanced', desc: 'Frets 9+ (Upper neck & expressive lead)' },
  { level: 5, name: 'Lvl 5: Master', desc: 'Frets 9+ (Full neck virtuoso & speed solos)' },
];

export const SongCatalog: React.FC<SongCatalogProps> = ({
  songs,
  onSelectSong,
  selectedSongId,
  onNavigateToPractice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [selectedMode, setSelectedMode] = useState<SongMode | 'all'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'difficulty' | 'bpm' | 'duration'>('difficulty');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredSongs = songs
    .filter((song) => {
      if (selectedDifficulty !== 'all' && song.difficulty !== selectedDifficulty) return false;
      if (selectedMode !== 'all' && song.mode !== selectedMode) return false;
      if (selectedGenre !== 'all' && song.genre !== selectedGenre) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = song.title.toLowerCase().includes(q);
        const matchArtist = song.artist.toLowerCase().includes(q);
        const matchGenre = song.genre.toLowerCase().includes(q);
        const matchKey = song.key.toLowerCase().includes(q);
        if (!matchTitle && !matchArtist && !matchGenre && !matchKey) return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortBy === 'title') comp = a.title.localeCompare(b.title);
      else if (sortBy === 'difficulty') comp = a.difficulty - b.difficulty;
      else if (sortBy === 'bpm') comp = a.bpm - b.bpm;
      else if (sortBy === 'duration') comp = a.duration - b.duration;
      return sortAsc ? comp : -comp;
    });

  const handleSort = (field: 'title' | 'difficulty' | 'bpm' | 'duration') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(true);
    }
  };

  const getDifficultyBadge = (level: DifficultyLevel) => {
    switch (level) {
      case 1:
        return 'text-emerald-400';
      case 2:
        return 'text-sky-400';
      case 3:
        return 'text-amber-400';
      case 4:
        return 'text-orange-400';
      case 5:
        return 'text-rose-400';
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Search & Filter Header Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Music className="w-5 h-5 text-emerald-400" />
              Guitar Song Catalog ({songs.length} Arrangements)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {filteredSongs.length} songs. Featuring classical masterworks, classic rock riffs, and rhythm chord jams.
            </p>
          </div>

          {/* Search Box with Clear Button */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by song, artist, classical composer, key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 5 Difficulty Levels Filter Strip */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Filter by Difficulty Level
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            <button
              onClick={() => setSelectedDifficulty('all')}
              className={`p-2.5 text-xs font-semibold rounded-xl border text-left transition ${
                selectedDifficulty === 'all'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <div className="font-bold">All Levels</div>
              <div className="text-[10px] opacity-80 mt-0.5">{songs.length} Songs</div>
            </button>

            {DIFFICULTY_LEVELS.map((lvl) => {
              const isSelected = selectedDifficulty === lvl.level;
              const count = songs.filter((s) => s.difficulty === lvl.level).length;
              return (
                <button
                  key={lvl.level}
                  onClick={() => setSelectedDifficulty(lvl.level)}
                  className={`p-2.5 text-xs rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm font-bold'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{lvl.name}</span>
                    <span className="text-[10px] font-mono opacity-70">({count})</span>
                  </div>
                  <div
                    className={`text-[10px] truncate mt-1 ${
                      isSelected ? 'text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {lvl.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode & Genre Filter Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/* Mode Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg">
            {(['all', 'lead', 'chord'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition capitalize ${
                  selectedMode === mode
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'all' ? 'All Modes' : `${mode} Mode`}
              </button>
            ))}
          </div>

          {/* Genre selector including Classical */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">Genre:</span>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
            >
              <option value="all">All Genres ({songs.length})</option>
              <option value="Beginner Classics">Beginner Classics</option>
              <option value="Classical">Classical</option>
              <option value="Classic Rock">Classic Rock</option>
              <option value="Acoustic">Acoustic</option>
              <option value="Pop & Indie">Pop & Indie</option>
              <option value="Blues & Jazz">Blues & Jazz</option>
              <option value="Metal & Heavy">Metal & Heavy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Practice Tools Quick Access Banner */}
      {onNavigateToPractice && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-lg">
              🕷️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Beginner Practice Tools & Scales</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
                  NEW
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Warm up with the 1-2-3-4 Spider Walk, master the A Minor Pentatonic & Blues Scales, or train with the Metronome Speed Ramp!
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToPractice}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold font-sans flex items-center gap-2 transition shrink-0 shadow-md shadow-emerald-500/20"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Open Practice Studio</span>
          </button>
        </div>
      )}

      {/* List-Based Song Catalog View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Column Headers */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-950/80 border-b border-slate-800 text-xs font-mono text-slate-400 font-semibold items-center">
          <div
            className="col-span-5 md:col-span-4 flex items-center gap-1.5 cursor-pointer hover:text-white"
            onClick={() => handleSort('title')}
          >
            <span>TITLE & ARTIST</span>
            <ArrowUpDown className="w-3 h-3 text-slate-600" />
          </div>

          <div
            className="col-span-2 md:col-span-2 flex items-center gap-1.5 cursor-pointer hover:text-white"
            onClick={() => handleSort('difficulty')}
          >
            <span>DIFFICULTY</span>
            <ArrowUpDown className="w-3 h-3 text-slate-600" />
          </div>

          <div className="hidden md:flex md:col-span-2 items-center">
            <span>GENRE</span>
          </div>

          <div
            className="hidden sm:flex sm:col-span-2 md:col-span-2 items-center gap-1.5 cursor-pointer hover:text-white"
            onClick={() => handleSort('bpm')}
          >
            <span>KEY / TEMPO</span>
            <ArrowUpDown className="w-3 h-3 text-slate-600" />
          </div>

          <div className="col-span-5 sm:col-span-3 md:col-span-2 flex items-center justify-end">
            <span>ACTION</span>
          </div>
        </div>

        {/* List Rows */}
        <div className="divide-y divide-slate-800/60 max-h-[720px] overflow-y-auto">
          {filteredSongs.map((song) => {
            const isSelected = selectedSongId === song.id;
            const noteCount =
              song.mode === 'lead'
                ? (song.leadNotes || []).length
                : (song.chordEvents || []).length;

            return (
              <div
                key={song.id}
                onClick={() => onSelectSong(song)}
                className={`grid grid-cols-12 gap-4 px-6 py-3.5 items-center transition-colors cursor-pointer group ${
                  isSelected
                    ? 'bg-emerald-500/10'
                    : 'hover:bg-slate-850/80'
                }`}
              >
                {/* Title & Artist */}
                <div className="col-span-5 md:col-span-4 flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 group-hover:border-emerald-500/40 group-hover:text-emerald-400'
                    }`}
                  >
                    <Music className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                      {song.title}
                    </h3>
                    <div className="text-xs text-slate-400 truncate mt-0.5">{song.artist}</div>
                  </div>
                </div>

                {/* Difficulty & Mode */}
                <div className="col-span-2 md:col-span-2 flex flex-col justify-center font-mono">
                  <span className={`text-xs font-bold ${getDifficultyBadge(song.difficulty)}`}>
                    Level {song.difficulty}
                  </span>
                  <span className="text-[11px] text-slate-500 capitalize">{song.mode} Mode</span>
                </div>

                {/* Genre */}
                <div className="hidden md:flex md:col-span-2 flex-col justify-center">
                  <span className="text-xs text-slate-300 truncate">{song.genre}</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {noteCount} {song.mode === 'lead' ? 'Notes' : 'Chords'}
                  </span>
                </div>

                {/* Key / BPM / Duration */}
                <div className="hidden sm:flex sm:col-span-2 md:col-span-2 flex-col justify-center font-mono text-xs">
                  <span className="text-slate-300 font-medium">{song.key}</span>
                  <span className="text-[11px] text-slate-500">
                    {song.bpm} BPM · {song.duration}s
                  </span>
                </div>

                {/* Action CTA */}
                <div className="col-span-5 sm:col-span-3 md:col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectSong(song);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-400 transition shadow-sm active:scale-95"
                  >
                    <Play className="w-3 h-3 fill-slate-950" />
                    <span>Play</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSongs.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm text-slate-400 font-mono">
              No songs match your search query or active filters.
            </p>
            <button
              onClick={() => {
                setSelectedDifficulty('all');
                setSelectedMode('all');
                setSelectedGenre('all');
                setSearchQuery('');
              }}
              className="mt-3 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700"
            >
              Reset Search & Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
