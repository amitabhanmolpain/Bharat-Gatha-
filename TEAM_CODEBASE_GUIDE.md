# 🇮🇳 Bharat Gatha — Team Codebase Guide
> **Welcome to the team!**  
> This guide is written in **simple, friendly English** with **no complicated jargon**. It explains how the entire game works, where every file lives, how the pieces talk to each other, and how you can run and edit the project without feeling lost.

---

## 📖 Table of Contents
1. [What is Bharat Gatha? (The Big Picture)](#1-what-is-bharat-gatha-the-big-picture)
2. [How the Project is Split: Frontend vs Backend](#2-how-the-project-is-split-frontend-vs-backend)
3. [The 3 Game Campaigns & Storylines](#3-the-3-game-campaigns--storylines)
4. [Jolly Bhai (The Genie Companion) — How He Works](#4-jolly-bhai-the-genie-companion--how-he-works)
   - [When does he Glow?](#when-does-he-glow)
   - [When does he Shake Violently?](#when-does-he-shake-violently)
   - [When is he Normal (Doing Nothing)?](#when-is-he-normal-doing-nothing)
   - [The Secret Mystery Spoiler Blocker](#the-secret-mystery-spoiler-blocker)
   - [Voice & Indian Accent (Parler-TTS & Audio Cache)](#voice--indian-accent-parler-tts--audio-cache)
5. [The Mini-Games & Puzzles Explained](#5-the-mini-games--puzzles-explained)
   - [Royal Chaupar Dice Board Game (Chittorgarh)](#royal-chaupar-dice-board-game-chittorgarh)
   - [Kuldhara 3 Clues Mystery (Timed Investigation)](#kuldhara-3-clues-mystery-timed-investigation)
   - [Pietra Dura Inlay Puzzle (Taj Mahal)](#pietra-dura-inlay-puzzle-taj-mahal)
6. [Frontend Tour (`/frontend`)](#6-frontend-tour-frontend)
   - [Folder Layout](#frontend-folder-layout)
   - [Main Pages](#main-pages)
   - [Key Reusable Components](#key-reusable-components)
   - [Helper Services (Audio, AI & Progress)](#helper-services-audio-ai--progress)
7. [Backend Tour (`/backend`)](#7-backend-tour-backend)
   - [Folder Layout](#backend-folder-layout)
   - [Controllers (API Routes)](#controllers-api-routes)
   - [AI & Voice Services](#ai--voice-services)
8. [How to Run the Project on Your Computer](#8-how-to-run-the-project-on-your-computer)
9. [Common Questions & Troubleshooting (Cheat Sheet)](#9-common-questions--troubleshooting-cheat-sheet)

---

## 1. What is Bharat Gatha? (The Big Picture)

**Bharat Gatha** (भारत गाथा) is an educational RPG web game. 

Instead of reading boring textbook paragraphs, players travel back in time to explore real historical Indian monuments, talk to historical figures, solve authentic cultural puzzles, and uncover forgotten mysteries.

- **Look & Feel:** High quality retro 2D pixel-art style, with immersive sound effects, background music, and voiced dialogues.
- **Your Companion:** **Jolly Bhai**, a magical, warm, time-traveling genie who speaks in friendly Indian English (*"Mere aaka!"* / *"Arrey dost!"*).

---

## 2. How the Project is Split: Frontend vs Backend

The project has two main folders:

```
BHARAT_GATHA/
 ├── frontend/   👉 The Website & Game Screen (what the player sees and clicks)
 └── backend/    👉 The Brain & Voice Engine (AI answers and voice generation)
```

| Part | Tech Used | What it does |
|---|---|---|
| **Frontend** | Next.js 16 (React), Tailwind CSS, HTML5 Audio | Draws the pixel art, handles keyboard walking (WASD / Arrows), manages the game loop (60 frames per second), opens dialogue boxes, and plays music. |
| **Backend** | Python, Flask, LangChain, Groq AI, Parler-TTS | Answers player questions in real-time, blocks mystery spoilers, creates lifelike voice files with Indian accents, and saves audio so it loads instantly. |

---

## 3. The 3 Game Campaigns & Storylines

The game features three rich historical eras:

### 1. The Rajputana Strongholds (`/play/rajasthan`)
- **Stage 1: Chittorgarh Fort** — Meet **Buzurg Chacha** in the royal courtyard. Learn about the 9-storey **Vijay Stambh** (Tower of Victory) and play the ancient game of **Chaupar** (traditional Indian dice game) to prove your patience.
- **Stage 2: Kumbhalgarh Fort** — Walk the ramparts of the **Great Wall of Kumbhalgarh** (the 2nd longest continuous wall in the world after the Great Wall of China!) and reach the cloud palace, Badal Mahal.
- **Stage 3: Kuldhara Village** — The famous abandoned desert ghost village. In 1825 AD, all 84 villages of the Paliwal Brahmins vanished overnight. Players have **90 seconds** on the clock to search the ruins, find 3 historical clues, and deduce the real reason they left (oppressive taxes and severe drought!).
- **Stage 4: Bhangarh Fort** — Solve the haunted riddle of Princess Ratnavati and Tantrik Singhia before the sun sets.

### 2. The Mughal Empire (`/play/mughal`)
- Explore **Agra Fort**, **Taj Mahal**, and **Mehtab Bagh**.
- Solve the **Pietra Dura** floral marble inlay puzzle.
- Meet royal sentries and discover why the myth of the "Black Taj" is false.

### 3. The Vijayanagara Empire (`/play/vijaynagar`)
- Travel to **Hampi** during the golden age of King Krishnadevaraya.
- Discover the musical stone pillars of **Vitthala Temple** and the royal bazaars.

---

## 4. Jolly Bhai (The Genie Companion) — How He Works

Jolly Bhai is the player's guide throughout the game. He follows the player around and reacts dynamically.

### When does he Glow? ✨
- **Rule:** Jolly **ONLY glows** when sharing a **historical fact, secret lore, or chronicle trivia**!
- **Examples:** When telling the history of the 9-storey Vijay Stambh, the sacred story of Jauhar Kund, or the legend of the 84 abandoned villages.
- **Visuals:** A golden glowing aura pulses around his avatar, and a badge appears: `✨ Secret Fact`.
- **After the fact is told:** He automatically stops glowing and goes back to normal.

### When does he Shake Violently? 💥
- **Rule:** Jolly **ONLY shakes violently** when there is a **serious, really needed clue** nearby!
- **Examples:** When the player is standing right next to the Chief's Haveli bridal ornament, the Treasury torn tax ledger, or the Stepwell water pots in Kuldhara.
- **Visuals:** He shakes vigorously (`animate-crazy-shake` at 0.12 seconds frequency), has an orange/red alert drop-shadow, and shows the badge: `💥 Clue Alert!`.
- **No Unnecessary Shaking:** He will **never** shake randomly when walking through safe doors, exits, or during standard conversation.

### When is he Normal (Doing Nothing)? 🧞
- **Rule:** For **all normal conversations**, greetings, Chaupar advice, and general walking around, Jolly is in his **normal state**.
- **Visuals:** **Nothing!** No glowing badge, no yellow aura blur, no violent shaking. Just a clean, floating pixel genie.

### The Secret Mystery Spoiler Blocker 🛑
In Stage 3 (Kuldhara), the entire objective is for the player to discover *why the villagers left* by finding the 3 clues.
If the player asks Jolly: *"Why did the villagers go away?"* or *"Who cursed Kuldhara?"*, the AI Agent **strictly refuses to spoil it** and answers:
> *"That you have to find out, my aaka! Search the silent ruins, inspect the three clues, and uncover the mystery yourself."*
During this refusal, Jolly stays in his **normal state** (no unnecessary glow, no shake).

### Voice & Indian Accent (Parler-TTS & Audio Cache) 🎙️
1. When Jolly or any NPC speaks, their dialogue is sent to the backend.
2. The backend generates high quality speech with an **Indian storytelling accent** using **Indic Parler-TTS**.
3. It saves the resulting `.wav` file in `frontend/public/audio_cache/`.
4. If that same dialogue is ever requested again, it plays **instantly** without waiting for the server!
5. In the top right of the dialogue box, players can click the **🔊 Volume / Replay** button at any time to listen or stop the voice.

---

## 5. The Mini-Games & Puzzles Explained

### Royal Chaupar Dice Board Game (Chittorgarh)
- Located in `frontend/app/play/rajasthan/page.tsx`.
- Played on a traditional cross-shaped board (the ancient ancestor of Ludo/Pachisi).
- You roll wooden **pasa dice** (marked with numbers 1 to 6).
- The player controls the **Golden Goti** (token). The opponent is Buzurg Chacha with the **Ruby Red Goti**.
- First to reach the royal center home after 3 rounds wins and unlocks the gate to the next stage!

### Kuldhara 3 Clues Mystery (Timed Investigation)
- Located in Stage 3 of the Rajasthan campaign.
- A countdown timer (using Lucide `Timer` icon) starts at **90 seconds**.
- The player explores 3 abandoned buildings:
  1. **Chief's Haveli** ➡️ Alcove contains the **Bridal Ornament** (showing a rushed wedding escape).
  2. **Merchant's Treasury** ➡️ Iron safe contains the **Torn Tax Ledger** (showing Salim Singh's impossible 300% tax demand).
  3. **Stepwell (Baori)** ➡️ Dry steps contain **Intact Water Pots** (showing severe desert water drying).
- Once all 3 are inspected, the player enters the **Deduction Modal** to assemble the truth.

### Pietra Dura Inlay Puzzle (Taj Mahal)
- Located in `frontend/app/play/mughal/components/PietraDuraPuzzleModal.tsx`.
- Players arrange authentic semi-precious colored stones (lapis lazuli, jade, carnelian) into floral marble patterns, learning the actual decorative technique used in the Taj Mahal.

---

## 6. Frontend Tour (`/frontend`)

### Frontend Folder Layout
```
frontend/
 ├── app/
 │    ├── page.tsx                    👉 Landing page with cinematic intro
 │    ├── dashboard/                  👉 Campaign selection map & user profile
 │    ├── components/
 │    │    └── DialoguePanel.tsx      👉 The universal dialogue box (glows, shakes, replays voice)
 │    └── play/
 │         ├── rajasthan/page.tsx     👉 Rajasthan campaign (Chittorgarh, Kumbhalgarh, Kuldhara, Bhangarh)
 │         ├── mughal/page.tsx        👉 Mughal campaign (Agra Fort, Taj Mahal)
 │         └── vijaynagar/page.tsx    👉 Vijayanagara campaign (Hampi)
 ├── public/
 │    ├── audio_cache/                👉 Cached Indian-accent voice files (.wav)
 │    ├── pixel backgrounds           👉 Pixel art scenes (courtyard, ruins, gates)
 │    └── sprite sheets               👉 Character walking animations
 └── services/
      ├── characterVoiceService.ts    👉 Controls character speech playback & audio caching
      ├── groqAiService.ts            👉 Talks to backend AI agent (/api/ai/ask)
      ├── narratorService.ts          👉 Controls narrator voiceovers
      └── soundService.ts             👉 Background music & UI sound effects
```

### Key Reusable Components
- **`DialoguePanel.tsx`**: Renders the dialogue box at the bottom of the screen.
  - Takes `characterId` (e.g. `"jolly"` or `"chacha"`).
  - Takes `statusBadge`: `"normal"`, `"glowing"`, or `"shaking"`.
  - Has the **🔊 Volume / Replay** button to replay or stop speech.
  - Has the input box where players can type any free-form historical question to the AI!

### Helper Services
- **`groqAiService.ts`**: Calls the backend `/api/ai/ask`. It returns both the answer and the genie's behavior (`"glowing"`, `"shaking"`, or `"normal"`).
- **`characterVoiceService.ts`**: Plays audio files safely. If the server is offline or busy, it automatically falls back to browser speech so the game never crashes.
- **`soundService.ts`**: Handles footsteps, button clicks, clue discovery chimes, and ambient music.

---

## 7. Backend Tour (`/backend`)

### Backend Folder Layout
```
backend/
 ├── run.py                           👉 Starts the Flask backend server on port 5001
 └── app/
      ├── __init__.py                 👉 Sets up Flask app, CORS, and registers API blueprints
      ├── controllers/
      │    ├── ai_controller.py       👉 Routes: /api/ai/ask and /api/ai/genie/chat
      │    ├── game_controller.py     👉 Routes: clue radar and game progress
      │    ├── tts_controller.py      👉 Route: /api/tts/speak (voice generation)
      │    └── main_controller.py     👉 Health check & basic routes
      └── services/
           ├── genie_agent_service.py 👉 LangChain Genie Agent (context, guardrails, behavior)
           ├── guard_agent_service.py 👉 Royal sentry AI agent (warns insolent players)
           ├── parler_tts_service.py  👉 Generates authentic Indian-accent audio
           └── groq_service.py        👉 Fallback Groq AI direct integration
```

### Controllers (API Routes)
- **`POST /api/ai/ask`**:
  - Receives `{ question, character, context }`.
  - Routes to `ask_genie_agent()` or `ask_guard_agent()`.
  - Returns `{ answer, behavior, audio_url, audio_base64 }`.
- **`GET/POST /api/game/genie/clue-radar`**:
  - Calculates distance between player coordinates and uncollected clues to let the frontend know if Jolly should shake.

### AI & Voice Services
- **`genie_agent_service.py`**:
  - Holds `CAMPAIGN_REGISTRY` with rich historical facts for Vijayanagara, Mughal, and Rajasthan.
  - Contains `classify_genie_behavior()` to decide if Jolly should glow, shake, or stay normal.
  - Contains `SPOILER_PHRASES` to block players from cheating the Kuldhara mystery.
- **`parler_tts_service.py`**:
  - Uses the `parler-tts/parler-tts-mini-indic` AI model to produce warm, natural Indian English speech.

---

## 8. How to Run the Project on Your Computer

### Prerequisites
1. **Node.js** (version 18 or higher) installed.
2. **Python** (version 3.10, 3.11, or 3.12) installed.
3. A **Groq API Key** (for real-time historical AI answers).

---

### Step 1: Start the Backend (Brain)
Open a terminal in the project root:

```bash
# 1. Move into backend folder
cd backend

# 2. Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1
# (Or on Mac/Linux: source venv/bin/activate)

# 3. Make sure dependencies are installed
pip install -r requirements.txt

# 4. Set your Groq API key (if not in .env)
# On Windows PowerShell:
$env:GROQ_API_KEY="your_groq_key_here"

# 5. Start the backend server
python run.py
```
> You should see: `* Running on http://127.0.0.1:5001`

---

### Step 2: Start the Frontend (Game UI)
Open a **second terminal window** in the project root:

```bash
# 1. Move into frontend folder
cd frontend

# 2. Install dependencies (first time only)
npm install

# 3. Start the Next.js development server
npm run dev
```
> You should see: `✓ Ready in http://localhost:3000`

---

### Step 3: Play the Game!
1. Open your browser and go to: **`http://localhost:3000`**
2. Click **Start Journey** to enter the Dashboard.
3. Choose **The Rajputana Strongholds** to experience Chittorgarh, Chaupar, and Kuldhara!

---

## 9. Common Questions & Troubleshooting (Cheat Sheet)

### Q: Why isn't Jolly Bhai glowing in Chittorgarh?
> **Answer:** That is completely intentional! As per game rules, Jolly does **NOT** glow during normal greetings or board game chats ("rest of normal conversations nothing"). He **only glows** when you click an option or ask a question about an **ancient historical fact** (like the history of Vijay Stambh or Jauhar Kund).

### Q: When should Jolly Bhai shake?
> **Answer:** He only shakes violently when there is a **serious clue** nearby (e.g. in Kuldhara near the bridal ornament, tax ledger, or water pots). He will not shake unnecessarily when walking through doorways or safe paths.

### Q: I hear no voice when clicking options.
1. Check that the backend is running on `http://localhost:5001`.
2. Check that your browser has sound unmuted.
3. Click the **🔊 Volume / Replay** button in the top right of the dialogue panel.
4. If the backend is compiling or busy, the frontend will automatically use browser speech as a fallback.

### Q: How do I change the character's movement speed?
In `frontend/app/play/rajasthan/page.tsx`, search for `MOVE_SPEED = 0.55` and adjust the number. Higher is faster, lower is slower.

---

*Made with pride for **Bharat Gatha** — An AI Story You Play.* 🏛️✨
