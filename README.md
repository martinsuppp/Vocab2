# VocabMaster

A tool for mastering English vocabulary through flashcards and adaptive quizzes.

## Features
- **Memory Mode**: Interactive flashcards with sound effects for immersive learning.
- **Exam Mode**: Adaptive quizzes that prioritize your recent mistakes (last 20 attempts).
- **Advanced Statistics**: Track your progress with detailed charts of Lifetime vs Recent performance.
- **Instant Feeback**: Toggle immediate answer reveal during exams.
- **Customization**: Adjust mistake weighting, new word ratios, and enable/disable sound effects.

## Usage

### Prerequisite
- Python 3 with `pip`
- Node.js with `npm`

### Quick Start
1.  Open your terminal in the `VocabMaster` directory.
2.  Run the helper script:
    ```bash
    ./run_vocab_master.sh
    ```
3.  Open [http://localhost:5173](http://localhost:5173) in your browser.
    *   **To use on your phone**: Ensure your phone is on the same Wi-Fi, find your computer's IP address (e.g., `192.168.1.5`), and visit `http://192.168.1.5:5173`.

### Deployment / Backup
To push your latest changes to GitHub (requires GitHub CLI `gh`):
```bash
./push_to_github.sh
```

## Technologies
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion (Animations), Canvas Confetti.
- **Backend**: Flask (Python), SQLite.
- **Audio**: Web Audio API for real-time sound generation (no external assets).
- **Adaptive Algorithm**: Weights words based on recent mistake history to optimize learning efficiency.
