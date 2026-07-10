# Project Context: Ambient Music Mood Matcher App (MVP) 

## 1. Overview & UI Concept I am building a personal MVP for an ambient music app. The UI is minimalist, featuring a prominent, central wavy line graphic (a circular mass of wavy parallel lines) that acts as a visual anchor. 

### User Input Method: - **Primary Input:** A single text input bar at the bottom of the screen (e.g., "warm ambient house music"). - 

**Secondary Input:
** A horizontally scrollable row of quick-selection "pills" situated near the text input for common emotional states. - 

**Goal:** Parse the user's text or pill input to automatically route and play local audio files categorized by sonic characteristics. --- 

## 2. Core Music Taxonomy & Mapping Table The app maps user input into four distinct emotional/acoustic categories based on a discrete lookup dictionary. | Category Name | Core Electronic Genres | Acoustic Profile | Key UI Pill Suggestions | Sample Synonyms / Keywords | Target Audio Folder | | :--- | :--- | :--- | :--- | :--- | :--- | | 

**Flow State** | Ambient Techno, Microhouse, Glitch | Steady rhythmic pulse (muted 4/4 or clicks), looping basslines, hypnotic, no vocals. | `⚡ Focus` | focus, work, coding, creative, productive, rhythm, beat, techno | `/audio/flow_state` | | **Sensory Overload** | Isolationist Drone, Pure Pink/Brown Noise | Static low frequencies, deep spatial depth, zero mid/high harshness, non-melodic. | `☁️ Overwhelmed` | anxious, stressed, loud, overwhelmed, noise, quiet, heavy, calm | `/audio/sensory_overload` | | **Cozy / Introspective** | Tape Loop Ambient, Slow Piano Ambient | Tape hiss, minor chords, warm analog pads, slow decay times, nostalgic. | `🌧️ Rainy Day` | rain, sad, melancholy, nostalgic, sleep, night, chill, slow, lofi | `/audio/cozy_introspective` | | **Light / Uplifted** | Balearic Ambient, Organic Downtempo | Major keys, brighter synth textures, organic percussion, sunny disposition. | `☕ Morning` | happy, morning, coffee, bright, sunny, breezy, upbeat, house, warm | `/audio/light_uplifted` | ---## 3. Implementation Requirements & Logic Tasks Please help me write the core JavaScript/TypeScript logic to run this MVP. I need code for the following mechanisms: ### Task A: Keyword Parser & Routing Engine - Write a function that takes the raw text string from the input bar (or the text from a tapped pill). - Normalize the text (`.toLowerCase()`). - Tokenize or check the string to see if it matches any of the arrays of keywords defined in the taxonomy table above. - 

**Fallback Rule:** If no keywords match, default to playing from the `/audio/cozy_introspective` directory as a neutral baseline. 

### Task B: Local Audio Folder Integration - Provide a lightweight architecture pattern to handle audio playback using standard Web Audio API or HTML5 Audio elements. - Assume each category folder contains 3–5 `.mp3`or `.wav` files. The app should randomly pick a track from the matched category or crossfade into it. 

### Task C: Visual Feedback Logic (Wavy Line Animation) - I want the central wavy line graphic to respond visually to the active category. - Suggest a way (via CSS variables, SVG manipulation, or Canvas parameters) to alter the **speed/frequency/amplitude** of the waves depending on the track playing: - 

*Flow State:* Crisp, rhythmic pulsing movements. - 

*Sensory Overload:* Very slow, heavy, deep undulating swells. - 

*Cozy:* Gentle, slightly erratic drifting movements (like drifting tape warble). - 

*Light / Uplifted:* Bright, faster, smooth rhythmic ripples. --- 

## Next Steps Please provide the foundational code structure (HTML/CSS/JS or a single React component framework) that implements the 

**Keyword Parser** and **Audio Controller** based on these specifications.
