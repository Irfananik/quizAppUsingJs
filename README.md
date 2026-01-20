Quiz App (MCQ / True-False)

Overview
- A simple quiz application using HTML/CSS/JS (separate files).
- Features: DOM manipulation, event handling (click, change, keydown), arrays/objects for questions, timer per question, scoring, reset, real-time feedback.

How to run
1. Open `index.html` in your browser (double-click or serve with a simple HTTP server).
2. Enter your name (optional), then click Start.
3. Use mouse to select an answer or press number keys (1-4). Press Enter to submit.

Files
- `index.html` — markup
- `styles.css` — styling (modern responsive design)
- `script.js` — quiz logic, events, timer, WebAudio beep

Notes
- Questions are defined in `script.js` in the `questions` array.
- Code includes comments and is intentionally modular for clarity.
- A **Participants** page stores players' names, scores, and timestamps (accessible via the "View Participants" button).
- Simple registration / login is provided (open `auth.html` or visit the site and sign in) — accounts are stored locally for this demo.

Enhancements you can add
- Persist high scores with localStorage (already used for participants)
- Add images for questions
- Use fetch() to load questions from a JSON file or API

Live Demo
- https://quizappw3.netlify.app/index.html
