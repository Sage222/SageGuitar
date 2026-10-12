import json

# Python script to build full songs.ts
with open('/scripts/build_full_catalog.py', 'w') as f:
    f.write('''# Full Song Catalog Builder
import os

code = """import { Song, GuitarStringNote, GuitarChordEvent } from '../types/guitar';
import { getFretFrequency, getFretNoteInfo, CHORD_LIBRARY } from '../utils/guitarConstants';

/**
 * Builds a lead note whose timestamp and duration are strictly calculated
 * from musical beat units and the song's BPM.
 */
function makeLeadNote(
  bpm: number,
  beat: number,
  stringIndex: number,
  fret: number,
  durationBeats = 0.8,
  finger = 1
): GuitarStringNote {
  const secondsPerBeat = 60 / bpm;
  const time = Math.round(beat * secondsPerBeat * 100) / 100;
  const duration = Math.round(durationBeats * secondsPerBeat * 100) / 100;
  const info = getFretNoteInfo(stringIndex, fret);
  const freq = getFretFrequency(stringIndex, fret);
  return {
    stringIndex,
    fret,
    noteName: info.noteName,
    octave: info.octave,
    frequency: Math.round(freq * 10) / 10,
    time,
    duration,
    finger,
  };
}

/**
 * Builds a chord event whose timestamp and duration are strictly calculated
 * from musical beat units and the song's BPM.
 */
function makeChordEvent(
  bpm: number,
  beat: number,
  chordName: string,
  durationBeats = 2.0,
  strumDirection: 'down' | 'up' = 'down'
): GuitarChordEvent {
  const secondsPerBeat = 60 / bpm;
  const time = Math.round(beat * secondsPerBeat * 100) / 100;
  const duration = Math.round(durationBeats * secondsPerBeat * 100) / 100;
  const def = CHORD_LIBRARY[chordName] || CHORD_LIBRARY['Em'];
  return {
    name: chordName,
    root: def.root,
    frets: [...def.frets],
    fingers: [...def.fingers],
    strumDirection,
    time,
    duration,
  };
}

export interface LeadSection {
  name?: string;
  beats: number;
  notes: Array<{ beat: number; stringIndex: number; fret: number; durationBeats?: number; finger?: number }>;
}

export interface ChordSection {
  name?: string;
  beats: number;
  chords: Array<{ beat: number; chord: string; durationBeats?: number; strum?: 'down' | 'up' }>;
}

/**
 * Assembles a complete, multi-section musical song
 * (Intro, Verse, Chorus, Bridge, Solo, Outro).
 * Mathematically synchronizes every note to song BPM.
 */
function assembleLeadSong(
  bpm: number,
  sections: LeadSection[]
): { notes: GuitarStringNote[]; duration: number } {
  const notes: GuitarStringNote[] = [];
  let beatOffset = 0;

  for (const sec of sections) {
    for (const item of sec.notes) {
      notes.push(
        makeLeadNote(
          bpm,
          item.beat + beatOffset,
          item.stringIndex,
          item.fret,
          item.durationBeats ?? 0.8,
          item.finger ?? 1
        )
      );
    }
    beatOffset += sec.beats;
  }

  const lastNote = notes[notes.length - 1];
  const lastTime = lastNote ? lastNote.time + lastNote.duration : beatOffset * (60 / bpm);
  const duration = Math.max(60, Math.ceil(lastTime + 2.5));
  return { notes, duration };
}

/**
 * Assembles a complete, multi-section chord progression song
 * (Intro, Verse, Chorus, Bridge, Outro).
 * Mathematically synchronizes every chord strum to song BPM.
 */
function assembleChordSong(
  bpm: number,
  sections: ChordSection[]
): { chords: GuitarChordEvent[]; duration: number } {
  const chords: GuitarChordEvent[] = [];
  let beatOffset = 0;

  for (const sec of sections) {
    for (const item of sec.chords) {
      chords.push(
        makeChordEvent(
          bpm,
          item.beat + beatOffset,
          item.chord,
          item.durationBeats ?? 2.0,
          item.strum ?? 'down'
        )
      );
    }
    beatOffset += sec.beats;
  }

  const lastChord = chords[chords.length - 1];
  const lastTime = lastChord ? lastChord.time + lastChord.duration : beatOffset * (60 / bpm);
  const duration = Math.max(60, Math.ceil(lastTime + 2.5));
  return { chords, duration };
}
"""
print("Loaded base code")
''')
