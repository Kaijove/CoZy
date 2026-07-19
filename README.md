<div align="center">

# 🤏 PINCH·TIME

### Time doesn't live on a timeline anymore.

**Control video playback using nothing but your hand.**
Pinch to play. Open your fingers to slow down, freeze, or travel backwards in time.

<p>
<a href="https://pinchthetime.netlify.app">
<img src="https://img.shields.io/badge/🌐_Live_Demo-Netlify-00C7B7?style=for-the-badge">
</a>
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white">
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
<img src="https://img.shields.io/badge/MediaPipe-Hand_Tracking-FF6F00?style=for-the-badge">
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
</p>

<p>
<img src="https://img.shields.io/badge/status-active-success?style=flat-square">
<img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square">
<img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square">
</p>

<br>

<p align="center">
<img src="docs/previews/hero.gif" width="100%" alt="PINCH·TIME hero demo">
</p>

</div>

---

## 📸 Preview

<table>
<tr>
<td width="50%"><img src="preview-1.png" alt="Preview 1"/></td>
<td width="50%"><img src="preview-2.png" alt="Preview 2"/></td>
</tr>
</table>

---

## 🌐 Live Demo

<div align="center">

### 👉 [pinchthetime.netlify.app](https://pinchthetime.netlify.app/)

Experience the interaction yourself, directly in your browser.
No installation required — just allow camera access and start pinching.

</div>

---

## ✨ About

PINCH·TIME explores a different way of interacting with digital media.

Instead of dragging a timeline or pressing buttons, **the distance between your thumb and index finger becomes a continuous timeline controller.** Your hand literally controls time.

There's no button for "reverse." No slider for "slow motion." Just your hand, a camera, and a video that responds to how open or closed your fingers are, frame by frame, in real time.

The result feels somewhere between gesture interaction, cinematic editing, and science-fiction interfaces — the kind of control you'd expect from a film about the future, not a browser tab.

---

## 🎯 How It Feels

<table>
<tr>
<td width="33%" align="center">

**🤏 Precise**

Every millimeter between your fingers maps to a moment in time. Nothing is quantized — it's continuous.

</td>
<td width="33%" align="center">

**⏪ Reversible**

Reverse isn't a fake rewind icon. The engine reconstructs motion and audio backwards, frame by frame.

</td>
<td width="33%" align="center">

**🎬 Cinematic**

Aurora animations, parallax, and magnetic UI elements make the whole experience feel alive before you even touch it.

</td>
</tr>
</table>

---

## 🎬 Gesture Mapping

| Gesture | Action | Feel |
|---|---|---|
| 🤏 Fingers together | Normal playback | Natural, resting state |
| 👌 Slightly open | Slow motion | Time stretches |
| ✋ Half open | Freeze frame | Time stops |
| 🖐 Fully open | Reverse playback | Time rewinds |

The transition between these states is **completely continuous** — there are no fixed steps or snapping. Your hand's position is sampled and smoothed dozens of times per second, so the video responds as fluidly as your hand moves.

---

## 🎥 Traditional Controls vs PINCH·TIME

Gesture interaction doesn't replace familiar controls — it enhances them. Every classic control is still there for when you want it.

| | Traditional Player | PINCH·TIME |
|---|---|---|
| Play / Pause | ✔ Button | ✔ Button + 🤏 Gesture |
| Seek | ✔ Drag timeline | ✔ Drag timeline + 🖐 Hand distance |
| Slow motion | ✘ Rarely available | ✔ Continuous, gesture-driven |
| Reverse playback | ✘ Not supported | ✔ Real frame-by-frame reverse + reverse audio |
| Input method | Mouse / touch only | Mouse, touch, keyboard **and** camera |
| Feel | Functional | Cinematic |

**Also included:**

✔ Play / Pause · ✔ Timeline Scrubbing · ✔ Drag to Seek · ✔ Volume Slider · ✔ Mute · ✔ Fullscreen · ✔ Keyboard Shortcuts

---

## ⚡ Highlights

### 🎯 Real-time Hand Tracking
Powered by **MediaPipe Hand Landmarker**. Tracks hand landmarks at high frame rates with extremely low latency, directly in the browser — no server round-trip.

### ⏪ Continuous Reverse Playback
Not just a visual trick. The playback engine actually **reconstructs reverse motion frame-by-frame** while synchronizing a dedicated reverse audio buffer, so rewinding sounds as real as it looks.

### 🔊 Dynamic Audio Engine
The audio changes depending on playback direction. Forward playback smoothly fades in; reverse playback activates a custom rewind audio buffer instead of just muting or reversing a raw stream.

### 🎨 Cinematic Landing Experience
The homepage reacts to the visitor:

- Aurora animations
- Rain simulation
- Depth parallax
- Magnetic buttons
- Floating particles
- Interactive hero
- Cursor-driven effects
- Easter eggs

Everything is designed to feel alive before the user even touches the video.

---

## 🧠 How It Works

```
Camera
  │
  ▼
MediaPipe
  │
Hand Detection
  │
Pinch Distance
  │
One Euro Filter        ← smooths jittery raw landmark data
  │
Velocity Mapping        ← converts distance/speed into playback rate
  │
Scrub Engine
  │
Reverse Audio
  │
Video Playback
```

The **One Euro Filter** is what keeps the interaction feeling precise instead of jittery — it adapts its smoothing based on how fast your hand is moving, so slow, deliberate gestures stay stable while fast gestures stay responsive.

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────┐
│                    Browser                        │
│                                                     │
│  ┌─────────────┐     ┌──────────────────────────┐ │
│  │   Camera    │────▶│   MediaPipe Hand          │ │
│  │   Service   │     │   Landmarker (WASM)       │ │
│  └─────────────┘     └────────────┬─────────────┘ │
│                                    │               │
│                                    ▼               │
│                       ┌────────────────────────┐  │
│                       │  Interaction Engine     │  │
│                       │  (filter + velocity +   │  │
│                       │   dead zones/hysteresis)│  │
│                       └────────────┬────────────┘  │
│                                    │               │
│                     ┌──────────────┴─────────────┐ │
│                     ▼                             ▼│
│          ┌────────────────────┐      ┌──────────────────┐
│          │  HTML Video Element │      │  Web Audio API     │
│          │  (forward / reverse)│      │  (reverse buffer)  │
│          └────────────────────┘      └──────────────────┘
└──────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Frontend | AI / Vision | Media | Tooling |
|---|---|---|---|
| React | MediaPipe | HTML Video API | Vite |
| TypeScript | Hand Landmarker | Web Audio API | ESLint |
| CSS | — | Fullscreen API | npm |

---

## 📂 Project Structure

```
pinch-time/
│
├── src/
│   ├── components/          # UI components (player, HUD, landing)
│   ├── services/             # Camera + MediaPipe integration
│   ├── engine/                # Scrub engine, filters, velocity mapping
│   ├── audio/                 # Reverse audio engine
│   └── config/
│       └── interaction.ts     # All tuning constants live here
│
├── docs/
│   ├── previews/               # Static screenshots
│   ├── diagrams/                # Architecture / pipeline images
│   └── gifs/                     # Demo GIFs
│
├── public/
├── index.html
└── package.json
```

---

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/pinch-time.git
cd pinch-time

# Install dependencies
npm install

# Run the dev server
npm run dev
```

Then open:

```
http://localhost:5173
```

> 📷 Your browser will ask for camera permission — this is required for hand tracking and never leaves your device.

---

## 🎮 Controls

| Key / Gesture | Action |
|---|---|
| 🤏 Pinch | Play at normal speed |
| 🖐 Open hand | Reverse playback |
| `Space` | Play / Pause |
| `Esc` | Exit Fullscreen |

---

## ⚙ Configuration

All interaction tuning lives in:

```
src/config/interaction.ts
```

including:

- Pinch calibration
- Smoothing (One Euro Filter parameters)
- Velocity curves
- Dead zones
- Hysteresis
- Reverse thresholds
- Audio behavior

Tweak these values to adapt the sensitivity to different cameras, lighting conditions, or hand sizes.

---

## 📈 Development Journey

- ✅ Project architecture
- ✅ Camera service
- ✅ Hand tracking
- ✅ Landmark overlay
- ✅ Pinch detection
- ✅ One Euro filter
- ✅ Velocity mapping
- ✅ Reverse playback engine
- ✅ Reverse audio engine
- ✅ UI redesign
- ✅ Landing page
- ✅ Gesture HUD
- ✅ Mouse controls
- ✅ Fullscreen mode
- ✅ Interactive hero
- ✅ Animations
- ✅ Performance polish

---

## 🧩 Technical Challenges

<details>
<summary><b>Making reverse playback actually feel real</b></summary>
<br>
Browsers don't support native reverse video playback at arbitrary speed. The engine steps through frames manually and keeps them in sync with a separately generated reverse audio buffer, so the illusion holds up even under fast gestures.
</details>

<details>
<summary><b>Killing hand-tracking jitter without adding lag</b></summary>
<br>
Raw MediaPipe landmarks are noisy frame-to-frame. A One Euro Filter was tuned so that slow movements get heavily smoothed (stable freeze-frames) while fast movements stay responsive (no perceptible input lag).
</details>

<details>
<summary><b>Turning a single distance value into a natural feeling curve</b></summary>
<br>
Mapping raw pinch distance directly to speed felt robotic. Velocity mapping, dead zones, and hysteresis were added so the transition between play, slow-motion, freeze, and reverse feels continuous instead of snapping between fixed states.
</details>

---

## 💡 What I Learned

Most video players ask users to adapt to the interface. PINCH·TIME asks the interface to adapt to the user.

Building it meant going deep into:

- Real-time computer vision in the browser (MediaPipe)
- Signal smoothing and filtering (One Euro Filter)
- Low-level control of the HTML5 Video and Web Audio APIs
- Designing an interaction model with no existing UI conventions to copy

It's an experiment exploring whether gestures can become a more natural way of controlling time itself.

---

## 🔮 Roadmap

- [ ] Multi-hand support (two-handed gestures)
- [ ] Mobile camera support
- [ ] Custom gesture presets
- [ ] Support for multiple video sources / playlists
- [ ] Exportable gesture-tuning profiles

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<div align="center">

## ⭐ Support

If you enjoyed the project, consider giving it a star — it really helps.

**Made with ❤️ using React, TypeScript and MediaPipe.**

<sub>PINCH·TIME — because time shouldn't need a scrollbar.</sub>

</div>
