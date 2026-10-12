# StringMaster Guitar Trainer 🎸

An interactive guitar learning and practice application inspired by **Simply Guitar** and **Yousician**. Learn guitar through real-time microphone listening, a precision tuner, an interactive scrolling tab runway in Lead and Chord modes, and a rich library of authentic songs across 5 difficulty levels.

---

## 🌟 Key Features

### 1. 🎤 Real-Time Microphone Pitch Listening
- **Low-Latency Pitch Detection**: Powered by the Web Audio API using the YIN autocorrelation algorithm tuned for guitar fundamentals ($70\text{ Hz}$ to $1200\text{ Hz}$).
- **Instant Visual Feedback**: Detects note name, octave, exact frequency in Hz, cents deviation, and volume levels.
- **Microphone Toggle**: Practice hands-free with your real guitar, or click / press `Spacebar` to virtual-pluck notes while muted.

### 2. 🎚️ Precision Built-In Guitar Tuner
- **Standard Guitar Tuning**: Covers all 6 strings: `E2 (82.4 Hz)`, `A2 (110.0 Hz)`, `D3 (146.8 Hz)`, `G3 (196.0 Hz)`, `B3 (246.9 Hz)`, and `E4 (329.6 Hz)`.
- **Chromatic Gauge & Strobe Needle**: Smooth visual feedback from $-50$ to $+50$ cents with an emerald target lock badge.
- **Reference Tones**: Listen to pure synthesized string tones to tune by ear.

### 3. 🎼 Interactive Tab Runway Player (Yousician & Simply Guitar Style)
- **Dual Play Modes**:
  - **Lead Mode**: 6-string horizontal rail track displaying fret numbers on colored note pucks.
  - **Chord Mode**: Rhythm strum highway with chord cards and directional down/up strum guides.
- **Tablet & Large Screen Optimization**:
  - Dedicated View Size Selector (`Normal`, `Large`, `Tablet XL`) featuring spacious string spacing, bold 20px+ fret numbers, large string badges, and high-visibility chord cards readable at guitar-holding distance.
- **Strict BPM Synchronization**: Note and chord timings are mathematically locked to the song tempo ($\text{time} = \text{beat} \times \frac{60}{\text{BPM}}$).
- **Interactive BPM Stepper**: Adjust tempo in real-time (`-5 BPM`, `+5 BPM`, `Reset`) and toggle speed rates (`0.5x`, `0.75x`, `1.0x`, `1.25x`).
- **Live 4-Beat Metronome HUD**: Visual LED beat counter (`[1] [2] [3] [4]`) pulsing on downbeats and measure markers.
- **4-Second Preview Delay**: Clean, quiet 4-second pause displaying upcoming notes statically on the runway before scrolling begins, allowing you to preview notes and place fingers without count clicks. Includes an instant "Start Now" skip button.
- **Audio Accompaniment**: Toggleable metronome click, synthesized backing band (drums/bass/rhythm), and soft guide melody preview (all start off by default).

### 4. 📚 Comprehensive Multi-Level Song Repertoire (78 Complete Songs)
78 complete, authentic musical arrangements with **real musical sections** (Intro, Verse 1, Chorus, Verse 2, Guitar Solo / Bridge, Final Chorus, and Outro/Coda) instead of repeating loops:
- **Level 1 (Novice)**: *Smoke on the Water*, *Seven Nation Army*, *Stand By Me*, *Knockin' on Heaven's Door*, *Iron Man*, *Peter Gunn*, *Wipe Out*, *Satisfaction*, *A Horse with No Name*, *Eleanor Rigby*, *Free Fallin'*, *Brown Eyed Girl*, *Ring of Fire*, *Three Little Birds*, *Lean on Me*, *Love Me Do*, *Bad Moon Rising*, *Yellow Submarine*, *Mary Had a Little Lamb*, *Twinkle Twinkle Little Star*, *Brahms' Lullaby*, *Greensleeves*, *You Are My Sunshine*.
- **Level 2 (Elementary)**: *Come As You Are*, *Ode to Joy*, *Für Elise*, *Bach Cello Suite No. 1 Prelude*, *Spanish Romance*, *Day Tripper*, *House of the Rising Sun*, *Hurt*, *Redemption Song*, *With or Without You*, *Zombie*, *Let It Be*, *Ain't No Sunshine*, *Sweet Home Alabama*, *Have You Ever Seen the Rain*, *La Bamba*, *Good Riddance*, *Heart of Gold*, *Blitzkrieg Bop*, *Fast Car*, *The Sound of Silence*, *Hey Jude*, *Creep*.
- **Level 3 (Intermediate)**: *Wish You Were Here* (Lead & Rhythm), *Californication*, *Riptide*, *Wonderwall*, *Hotel California*, *Under the Bridge*, *Black*, *Alive*, *Tush*, *You Shook Me All Night Long*, *All Along the Watchtower*, *Nothing Else Matters*, *Don't Stop Believin'*, *Crazy Train*, *Back in Black*, *Vivaldi's Spring*, *Mozart's Turkish March*.
- **Level 4 (Advanced)**: *Black Magic Woman*, *Pride and Joy*, *Crossroads*, *Little Wing*, *Canon Rock*.
- **Level 5 (Master)**: *Cliffs of Dover*, *Stairway to Heaven*, *Blackbird*, *Master of Puppets*, *Paganini Caprice No. 24*.

### 5. 🎸 Interactive 15-Fret Fretboard & Chord Library
- **Live Fretboard**: See notes light up on the neck as you play into the microphone. Toggle scale overlays (*A Minor Pentatonic*, *E Minor Pentatonic*, *A Blues*, *C Major*).
- **Chord Diagram Box**: View open, barred, and muted strings with finger placement numbers (1–4) and strum sound previews.

### 6. 🏆 User Progress Dashboard
- **Daily Practice Streak**: Tracks your consecutive practice days with flame milestone badges.
- **Session Accuracy & Stars**: Logs song attempts, average hit rate, 3-star ratings, and total practice time in `localStorage`.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Audio Processing**: Web Audio API (AudioContext, AnalyserNode, YIN pitch detection, Oscillator synthesis)
- **Visuals**: HTML5 Canvas 2D API (60 FPS tab runway)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher recommended)
- A modern web browser with microphone permissions (Chrome, Edge, Firefox, Safari)

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd <repo-folder>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.

---

## 🎯 Usage Tips

1. **Microphone Setup**: Allow microphone permissions when prompted. Position your acoustic guitar or amplifier near your microphone for optimal pitch tracking.
2. **Tuning First**: Switch to the **Tuner** tab to ensure your guitar is in standard $440\text{ Hz}$ tuning before starting songs.
3. **Pacing**: Use the **BPM Stepper** (`-5 / +5 BPM`) or playback rate buttons (`0.75x`, `1.0x`) to master challenging riffs slowly before playing at full speed.
4. **Preview Delay**: Every song gives you a **4-second preview delay** when you press Play so you can inspect upcoming notes statically on the runway and position your fingers with zero pressure. An instant "Start Now" button is also provided.

---

## 📄 License
Apache-2.0
