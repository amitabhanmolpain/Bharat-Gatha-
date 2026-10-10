# 🏛️ Bharat Gatha (भारत गाथा)

> **An  story you play.**

![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge)
![Qwen](https://img.shields.io/badge/Qwen-615CED?style=for-the-badge)
![RAG](https://img.shields.io/badge/RAG-Enabled-orange?style=for-the-badge)

---

## 🚀 Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/<your-repo>/Bharat-Gatha-.git
cd Bharat-Gatha-
```

### 2. Run the backend
```bash
cd backend
```

Create and activate a virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

Install dependencies and set up your environment file:

```bash
pip install -r requirements.txt
cp .env.example .env        # Windows (cmd): copy .env.example .env
```

Open `.env` and add your keys:

| Purpose | Where to get the key |
|---|---|
| Qwen LLM (via Groq) | [Groq Console](https://console.groq.com) |
| Nano Banana (image model) | Google AI Studio |
| Sarvam (voice / TTS) | [Sarvam AI Dashboard](https://dashboard.sarvam.ai) |

Use the variable names already listed in `.env.example`.

Start the server:

```bash
python run.py
```

### 3. Run the frontend
Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## 🎮 Controls

- **WASD / Arrow Keys:** Move
- **E:** Interact (talk, inspect, solve puzzles)
- **F:** Alternate actions (e.g. cross the river)
- **Esc:** Close dialogs and puzzles

---



📖 For architecture and code structure, see the [Team Codebase Guide](TEAM_CODEBASE_GUIDE.md).
