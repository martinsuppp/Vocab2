# VocabMaster

A tool for mastering English vocabulary through flashcards and adaptive quizzes.

## Features
- **Memory Mode**: Interactive flashcards with sound effects for immersive learning.
- **Exam Mode**: Adaptive quizzes that prioritize your recent mistakes (last 20 attempts).
- **Google Sheets Integration**: Load vocabulary directly from your own Google Sheet.
- **Advanced Statistics**: Track your progress with detailed charts of Lifetime vs Recent performance.
- **Instant Feeback**: Toggle immediate answer reveal during exams.
- **Customization**: Adjust mistake weighting, new word ratios, and enable/disable sound effects.

## Usage

### Prerequisite
- Node.js with `npm`

### Quick Start
1.  Open your terminal in the `VocabMaster` directory.
2.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Start the application:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:5173](http://localhost:5173) in your browser.

### Data Source
You can load vocabulary from two sources:

#### A. Google Sheets (Recommended)
1.  Deploy the provided script (see `GAS_README.md`).
2.  Enter your Web App URL on the VocabMaster homepage.
3.  Click "Load Data".

#### B. Local CSV Files
1.  Add your CSV file to `frontend/public/data/`.
2.  Update `frontend/public/manifest.json`.
3.  Refresh the app.

### Deployment / Backup
To push your latest changes to GitHub:
```bash
./push_to_github.sh
```

## Technologies
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Canvas Confetti.
- **Data Storage**: LocalStorage (Browser).
- **Data Loading**: Google Apps Script API or CSV parsing (PapaParse).
- **Audio**: Web Audio API.
