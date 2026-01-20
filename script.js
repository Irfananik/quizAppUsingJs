// Quiz App - script.js

// -------------------------
// Role-based access helpers
// -------------------------
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// -------------------------
// Data: question bank (with categories) loaded from localStorage
// -------------------------
const defaultQuestions = [
    {
        id: 1,
        text: "Which language is primarily used for web page structure?",
        choices: ["CSS", "Python", "HTML", "SQL"],
        answer: 2,
        category: "HTML"
    },
    {
        id: 2,
        text: "JavaScript is used for:",
        choices: ["Styling only", "Client-side interactivity", "Database", "Operating system"],
        answer: 1,
        category: "JavaScript"
    },
    {
        id: 3,
        text: "True or False: CSS stands for Cascading Style Sheets.",
        choices: ["True", "False"],
        answer: 0,
        category: "CSS"
    },
    {
        id: 4,
        text: "Which HTML tag is used for images?",
        choices: ["<img>", "<image>", "<pic>", "<src>"],
        answer: 0,
        category: "HTML"
    },
    {
        id: 5,
        text: "What does DOM stand for?",
        choices: ["Document Object Model", "Data Object Model", "Digital Object Model", "Document Order Map"],
        answer: 0,
        category: "JavaScript"
    },
    {
        id: 6,
        text: "Which method adds a new element to an array?",
        choices: ["pop()", "push()", "shift()", "slice()"],
        answer: 1,
        category: "JavaScript"
    },
    {
        id: 7,
        text: "True or False: The 'querySelector' returns all matching elements.",
        choices: ["True", "False"],
        answer: 1,
        category: "JavaScript"
    },
    {
        id: 8,
        text: "Which operator is used for strict equality in JavaScript?",
        choices: ["=", "==", "===", "!=="],
        answer: 2,
        category: "JavaScript"
    },
    {
        id: 9,
        text: "True or False: HTML element IDs should be unique on a page.",
        choices: ["True", "False"],
        answer: 0,
        category: "HTML"
    },
    {
        id: 10,
        text: "Which method converts a JSON string to a JavaScript object?",
        choices: ["JSON.stringify()", "JSON.parse()", "JSON.toObject()", "JSON.from()"],
        answer: 1,
        category: "JavaScript"
    }
];

function loadQuestionBank() {
    const stored = JSON.parse(localStorage.getItem('questionBank') || 'null');
    if (Array.isArray(stored)) return stored;
    return defaultQuestions;
}

let questions = loadQuestionBank();

// -------------------------
// App state
// -------------------------
let currentIndex = 0;
let score = 0;
let timerInterval = null;
let timeLeft = 20; // seconds per question
let playerName = '';
let answered = false;

function refreshQuestionBank() {
    questions = loadQuestionBank();
    if (totalQEl) totalQEl.textContent = questions.length;
    if (startBtn) startBtn.disabled = questions.length === 0;
}

// -------------------------
// DOM references
// -------------------------
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const submitBtn = document.getElementById('submitBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const restartQuizBtn = document.getElementById('restartQuizBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const viewParticipantsBtn = document.getElementById('viewParticipantsBtn');
const adminBtn = document.getElementById('adminBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const userLabel = document.getElementById('userLabel');
const playerInput = document.getElementById('playerName');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const feedbackEl = document.getElementById('feedback');
const questionTextEl = document.getElementById('questionText');
const choicesForm = document.getElementById('choicesForm');
const quizScreen = document.getElementById('quizScreen');
const startScreen = document.getElementById('startScreen');
const endScreen = document.getElementById('endScreen');
const qIndexEl = document.getElementById('qIndex');
const totalQEl = document.getElementById('totalQ');
const finalMessage = document.getElementById('finalMessage');
const finalScore = document.getElementById('finalScore');

// -------------------------
// Initialization
// -------------------------
function init() {
    // require signed-in user (simple client-side session)
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
        // Not signed in — show auth page first
        window.location.href = 'auth.html';
        return;
    }

    refreshQuestionBank();
    scoreEl.textContent = `Score: ${score}`;
    timerEl.textContent = `--:--`;

    // Show/hide features based on role
    if (!isAdmin()) {
        if (viewParticipantsBtn) viewParticipantsBtn.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';
    }
    if (isAdmin() && adminBtn) adminBtn.style.display = 'inline-block';

    // prefill player name and show user info
    if (playerInput) { playerInput.value = currentUser.name || currentUser.username || ''; playerInput.readOnly = true; }
    if (userInfo && userLabel) { 
        userInfo.hidden = false; 
        const roleLabel = isAdmin() ? ' [Admin]' : '';
        userLabel.textContent = `Signed in: ${currentUser.name || currentUser.username}${roleLabel}`; 
    }

    attachEvents();
}


// -------------------------
// Event listeners
// -------------------------
function attachEvents() {
    startBtn.addEventListener('click', startQuiz); // onclick
    resetBtn.addEventListener('click', resetQuiz);
    submitBtn.addEventListener('click', submitAnswer);
    nextBtn.addEventListener('click', nextQuestion);
    restartBtn.addEventListener('click', resetQuiz);
    if (restartQuizBtn) restartQuizBtn.addEventListener('click', resetQuiz);
    if (viewParticipantsBtn) viewParticipantsBtn.addEventListener('click', () => { window.location.href = isAdmin() ? 'participants.html' : 'dashboard.html'; });
    if (dashboardBtn) dashboardBtn.addEventListener('click', () => { window.location.href = 'dashboard.html'; });
    if (adminBtn) adminBtn.addEventListener('click', () => { window.location.href = 'admin.html'; });
    if (logoutBtn) logoutBtn.addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = 'auth.html'; });

    // change event when selecting an option
    choicesForm.addEventListener('change', (e) => {
        // using .value to get selected
        const selected = choicesForm.elements['choice'];
        if (!selected) return;
        // enable submit once a choice is selected
        submitBtn.disabled = false;
    });

    // keyboard support — onkeydown
    document.addEventListener('keydown', handleKeydown);
}

// -------------------------
// Start quiz
// -------------------------
function startQuiz() {
    refreshQuestionBank();
    if (!questions.length) {
        alert('No questions available. Admin needs to add questions first.');
        return;
    }
    currentIndex = 0; score = 0; answered = false;
    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    scoreEl.textContent = `Score: ${score}`;
    updateQuestion();
}

// -------------------------
// Render question and choices
// -------------------------
function updateQuestion() {
    const q = questions[currentIndex];
    if (!q) { finishQuiz(); return; }
    qIndexEl.textContent = currentIndex + 1;
    questionTextEl.innerHTML = q.text;

    // clear previous choices
    choicesForm.innerHTML = '';
    submitBtn.disabled = true;
    nextBtn.disabled = true;
    feedbackEl.innerHTML = '';
    answered = false;

    // loop through choices
    for (let i = 0; i < q.choices.length; i++) {
        const id = `opt-${i}`;
        const label = document.createElement('label');
        label.className = 'choice';
        label.setAttribute('for', id);

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'choice';
        input.id = id;
        input.value = i;

        const span = document.createElement('span');
        span.textContent = q.choices[i];

        label.appendChild(input);
        label.appendChild(span);
        choicesForm.appendChild(label);
    }

    // start timer for question
    startTimer();
}

// -------------------------
// Submit answer
// -------------------------
function submitAnswer() {
    const form = choicesForm;
    const selected = form.elements['choice'];
    let val = null;

    if (!selected) {
        // no choices available (shouldn't happen)
        return;
    }

    if (selected.length && selected.length > 1) {
        // radio NodeList
        for (const opt of selected) {
            if (opt.checked) { val = Number(opt.value); break; }
        }
    } else {
        // single choice (e.g., True/False) still works
        if (selected.checked) { val = Number(selected.value); }
    }

    if (val === null) return; // nothing chosen

    // stop timer
    stopTimer();

    answered = true;
    // check correctness
    const correct = (val === questions[currentIndex].answer);

    // show feedback and mark choices
    markChoices(val, correct);
    if (correct) { score += 1; playBeep(true); feedbackEl.innerHTML = `<span class="correct">Correct! +1</span>`; }
    else { playBeep(false); feedbackEl.innerHTML = `<span class="wrong">Wrong — correct answer: ${questions[currentIndex].choices[questions[currentIndex].answer]}</span>`; }

    scoreEl.textContent = `Score: ${score}`;
    submitBtn.disabled = true;
    nextBtn.disabled = false;
}

// Marks choice nodes visually
function markChoices(selectedIndex, isCorrect) {
    const labels = choicesForm.querySelectorAll('.choice');
    labels.forEach((lab, idx) => {
        lab.classList.remove('correct', 'wrong');
        const input = lab.querySelector('input');
        if (idx === questions[currentIndex].answer) { lab.classList.add('correct'); }
        if (idx === selectedIndex && !isCorrect) { lab.classList.add('wrong'); }
    });
}

// -------------------------
// Next question or finish
// -------------------------
function nextQuestion() {
    currentIndex++;
    if (currentIndex >= questions.length) {
        finishQuiz();
    } else {
        updateQuestion();
    }
}

function finishQuiz() {
    stopTimer();
    quizScreen.classList.add('hidden');
    endScreen.classList.remove('hidden');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const displayName = currentUser ? (currentUser.name || currentUser.username) : ((playerInput && playerInput.value.trim()) || (playerName ? playerName : 'Anonymous'));
    saveParticipant(score);
    finalMessage.innerHTML = `Nice work, ${displayName}!`;
    finalScore.innerHTML = `Final score: ${score} / ${questions.length}`;
}

// -------------------------
// Timer functions
// -------------------------
function startTimer() {
    timeLeft = 20; // reset per question
    timerEl.textContent = formatTime(timeLeft);
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft -= 1;
        timerEl.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerEl.textContent = '00:00';
            // Timeout: auto-submit as wrong if not answered
            if (!answered) {
                feedbackEl.innerHTML = `<span class="wrong">Time's up! The correct answer was: ${questions[currentIndex].choices[questions[currentIndex].answer]}</span>`;
                markChoices(-1, false);
                playBeep(false);
                nextBtn.disabled = false;
                submitBtn.disabled = true;
            }
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function formatTime(t) {
    const sec = String(t % 60).padStart(2, '0');
    const mini = String(Math.floor(t / 60)).padStart(2, '0');
    return `${mini}:${sec}`;
}

// -------------------------
// Keyboard handling
// -------------------------
function handleKeydown(e) {
    // if quiz not visible, ignore
    if (quizScreen.classList.contains('hidden')) return;

    // number keys 1-4 to pick answers
    if (/^[1-4]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        const opt = document.getElementById(`opt-${idx}`);
        if (opt) { opt.checked = true; submitBtn.disabled = false; }
    }

    // Enter to submit
    if (e.key === 'Enter') {
        if (!submitBtn.disabled) { submitAnswer(); }
        else if (!nextBtn.disabled) { nextQuestion(); }
    }

    // R to restart
    if ((e.key || '').toLowerCase() === 'r') {
        resetQuiz();
    }
}

// -------------------------
// Reset / restart
// -------------------------

function saveParticipant(scoreVal) {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const username = currentUser ? currentUser.username : null;
        const displayName = currentUser ? (currentUser.name || currentUser.username) : ((playerInput && playerInput.value.trim()) || 'Anonymous');
        const list = JSON.parse(localStorage.getItem('participants') || '[]');
        list.push({ name: displayName, username: username, score: scoreVal, totalQuestions: questions.length, date: new Date().toISOString() });
        localStorage.setItem('participants', JSON.stringify(list));
    } catch (err) { console.error('Failed to save participant', err); }
}
function resetQuiz() {
    stopTimer();
    currentIndex = 0; score = 0; answered = false;
    startScreen.classList.remove('hidden');
    quizScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    scoreEl.textContent = `Score: ${score}`;
    timerEl.textContent = `--:--`;
    choicesForm.innerHTML = '';
    feedbackEl.innerHTML = '';
}

// -------------------------
// Simple beep using WebAudio API
// -------------------------
function playBeep(correct = true) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = correct ? 880 : 220;
        g.gain.value = 0.02;
        o.connect(g); g.connect(ctx.destination);
        o.start();
        setTimeout(() => { o.stop(); ctx.close(); }, 120);
    } catch (err) { /* ignore if audio not allowed */ }
}

// -------------------------
// Start up
// -------------------------
init();
