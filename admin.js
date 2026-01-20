// admin.js - Question bank management for admins

const defaultQuestions = [
    { id: 1, text: "Which language is primarily used for web page structure?", choices: ["CSS", "Python", "HTML", "SQL"], answer: 2, category: "HTML" },
    { id: 2, text: "JavaScript is used for:", choices: ["Styling only", "Client-side interactivity", "Database", "Operating system"], answer: 1, category: "JavaScript" },
    { id: 3, text: "True or False: CSS stands for Cascading Style Sheets.", choices: ["True", "False"], answer: 0, category: "CSS" },
    { id: 4, text: "Which HTML tag is used for images?", choices: ["<img>", "<image>", "<pic>", "<src>"], answer: 0, category: "HTML" },
    { id: 5, text: "What does DOM stand for?", choices: ["Document Object Model", "Data Object Model", "Digital Object Model", "Document Order Map"], answer: 0, category: "JavaScript" },
    { id: 6, text: "Which method adds a new element to an array?", choices: ["pop()", "push()", "shift()", "slice()"], answer: 1, category: "JavaScript" },
    { id: 7, text: "True or False: The 'querySelector' returns all matching elements.", choices: ["True", "False"], answer: 1, category: "JavaScript" },
    { id: 8, text: "Which operator is used for strict equality in JavaScript?", choices: ["=", "==", "===", "!=="], answer: 2, category: "JavaScript" },
    { id: 9, text: "True or False: HTML element IDs should be unique on a page.", choices: ["True", "False"], answer: 0, category: "HTML" },
    { id: 10, text: "Which method converts a JSON string to a JavaScript object?", choices: ["JSON.stringify()", "JSON.parse()", "JSON.toObject()", "JSON.from()"], answer: 1, category: "JavaScript" }
];

const defaultQuizSettings = {
    timeLimit: 30,
    enableTimer: true,
    questionCount: 0,
    passingScore: 70,
    shuffle: true
};

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;
let editingId = null;

// User management helpers
function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}
function saveUsers(list) {
    localStorage.setItem('users', JSON.stringify(list));
}
function getParticipants() {
    return JSON.parse(localStorage.getItem('participants') || '[]');
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

function getQuestionBank() {
    const stored = JSON.parse(localStorage.getItem('questionBank') || 'null');
    if (Array.isArray(stored)) return stored;
    return [];
}

function saveQuestionBank(list) {
    localStorage.setItem('questionBank', JSON.stringify(list));
}

function getQuizSettings() {
    const stored = JSON.parse(localStorage.getItem('quizSettings') || 'null');
    return Object.assign({}, defaultQuizSettings, stored || {});
}
function saveQuizSettings(settings) {
    localStorage.setItem('quizSettings', JSON.stringify(settings));
}

function requireAdmin() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please sign in first');
        window.location.href = 'auth.html';
        return null;
    }
    if (user.role !== 'admin') {
        alert('Admin access only. Redirecting to dashboard.');
        window.location.href = 'dashboard.html';
        return null;
    }
    return user;
}

function buildOptionRow(idx, value = '') {
    const row = document.createElement('div');
    row.className = 'option-row';
    const label = document.createElement('span');
    label.textContent = `${idx + 1}.`;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'option-input';
    input.placeholder = `Option ${idx + 1}`;
    input.value = value || '';
    input.addEventListener('input', updateAnswerChoices);
    row.appendChild(label);
    row.appendChild(input);
    return row;
}

function renderOptions(values = ['','','','']) {
    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    values.forEach((val, idx) => container.appendChild(buildOptionRow(idx, val)));
    updateAnswerChoices();
}

// -------------------------
// Quiz settings
// -------------------------
function loadSettingsForm() {
    const s = getQuizSettings();
    document.getElementById('settingEnableTimer').checked = !!s.enableTimer;
    document.getElementById('settingTimeLimit').value = Number(s.timeLimit) || 30;
    document.getElementById('settingQuestionCount').value = Number(s.questionCount) || 0;
    document.getElementById('settingPassingScore').value = Number(s.passingScore) || 70;
    document.getElementById('settingShuffle').checked = !!s.shuffle;
}

function saveSettingsFromForm() {
    const enableTimer = document.getElementById('settingEnableTimer').checked;
    let timeLimit = Number(document.getElementById('settingTimeLimit').value || 30);
    let questionCount = Number(document.getElementById('settingQuestionCount').value || 0);
    let passingScore = Number(document.getElementById('settingPassingScore').value || 70);
    const shuffle = document.getElementById('settingShuffle').checked;

    if (isNaN(timeLimit) || timeLimit < 5) timeLimit = 5;
    if (isNaN(questionCount) || questionCount < 0) questionCount = 0;
    if (isNaN(passingScore) || passingScore < 0) passingScore = 0;
    if (passingScore > 100) passingScore = 100;

    saveQuizSettings({ enableTimer, timeLimit, questionCount, passingScore, shuffle });
    alert('Quiz settings saved. They will apply to the next quiz start.');
}

function updateAnswerChoices() {
    const select = document.getElementById('qAnswer');
    const optionEls = Array.from(document.querySelectorAll('.option-input'));
    select.innerHTML = '';
    optionEls.forEach((opt, idx) => {
        const o = document.createElement('option');
        o.value = idx;
        o.textContent = opt.value.trim() || `Option ${idx + 1}`;
        select.appendChild(o);
    });
    if (optionEls.length > 0) {
        const current = Number(select.getAttribute('data-current') || 0);
        select.value = Math.min(current, optionEls.length - 1);
    }
}

function collectOptions() {
    const optionEls = Array.from(document.querySelectorAll('.option-input'));
    const choices = optionEls.map(i => i.value.trim()).filter(Boolean);
    if (choices.length < MIN_OPTIONS) throw new Error(`Please provide at least ${MIN_OPTIONS} options.`);
    return choices;
}

function setEditHint(text) {
    const hint = document.getElementById('editHint');
    hint.textContent = text || '';
}

function resetForm() {
    editingId = null;
    document.getElementById('qText').value = '';
    document.getElementById('qCategory').value = '';
    renderOptions(['','','','']);
    document.getElementById('qAnswer').setAttribute('data-current', 0);
    setEditHint('');
}

function populateForm(question) {
    editingId = question.id;
    document.getElementById('qText').value = question.text;
    document.getElementById('qCategory').value = question.category || '';
    renderOptions(question.choices || ['','','','']);
    document.getElementById('qAnswer').setAttribute('data-current', question.answer || 0);
    const safeAnswer = Math.min(question.answer || 0, (question.choices?.length || 1) - 1);
    document.getElementById('qAnswer').value = safeAnswer;
    setEditHint(`Editing question #${question.id}`);
}

function renderTable() {
    const tbody = document.getElementById('questionBody');
    const count = document.getElementById('questionCount');
    const bank = getQuestionBank();
    tbody.innerHTML = '';
    if (!bank.length) {
        tbody.innerHTML = '<tr><td colspan="5">No questions yet. Add one above.</td></tr>';
    } else {
        bank.forEach((q, idx) => {
            const tr = document.createElement('tr');
            const answerText = q.choices && q.choices[q.answer] ? q.choices[q.answer] : '';
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${q.category || 'Uncategorized'}</td>
                <td>${q.text}</td>
                <td>${answerText}</td>
                <td>
                    <button class="btn" data-action="edit" data-id="${q.id}">Edit</button>
                    <button class="btn" data-action="delete" data-id="${q.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    count.textContent = `${bank.length} question${bank.length !== 1 ? 's' : ''}`;

    tbody.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = Number(e.currentTarget.getAttribute('data-id'));
            const action = e.currentTarget.getAttribute('data-action');
            if (action === 'edit') {
                const bank = getQuestionBank();
                const q = bank.find(item => item.id === id);
                if (q) populateForm(q);
            }
            if (action === 'delete') {
                if (!confirm('Delete this question?')) return;
                const bank = getQuestionBank().filter(item => item.id !== id);
                saveQuestionBank(bank);
                renderTable();
                resetForm();
            }
        });
    });
}

// -------------------------
// User management
// -------------------------
function renderUsers() {
    const tbody = document.getElementById('userBody');
    const countEl = document.getElementById('userCount');
    const users = getUsers();
    const activity = getParticipants();

    tbody.innerHTML = '';
    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="7">No users found.</td></tr>';
    } else {
        users.forEach((u, idx) => {
            const userAttempts = activity.filter(a => a.username === u.username);
            const attempts = userAttempts.length;
            const lastDate = attempts ? new Date(userAttempts[userAttempts.length - 1].date) : null;
            const lastStr = lastDate ? lastDate.toLocaleString() : 'Never';
            const roleLabel = u.role === 'admin' ? 'Admin' : 'User';
            const actionLabel = u.role === 'admin' ? 'Demote to User' : 'Promote to Admin';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${u.name || '-'}</td>
                <td>${u.username}</td>
                <td>${roleLabel}</td>
                <td>${attempts}</td>
                <td>${lastStr}</td>
                <td>
                    <button class="btn" data-action="role" data-username="${u.username}">${actionLabel}</button>
                    <button class="btn" data-action="reset" data-username="${u.username}">Reset Password</button>
                    <button class="btn" data-action="delete" data-username="${u.username}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
    countEl.textContent = `${users.length} user${users.length !== 1 ? 's' : ''}`;

    tbody.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', handleUserAction);
    });
}

// -------------------------
// Analytics & Reports
// -------------------------
function computeAttemptPercents(activity) {
    return activity.map(a => {
        const totalQ = Number(a.totalQuestions) || 10;
        const percent = Math.round((a.score / totalQ) * 100);
        return Object.assign({}, a, { percent, totalQ });
    });
}

function renderStats() {
    const users = getUsers();
    const activity = computeAttemptPercents(getParticipants());
    const settings = getQuizSettings();

    const totalUsers = users.length;
    const totalAttempts = activity.length;
    let avg = 0;
    let passRate = 0;

    if (activity.length) {
        const sum = activity.reduce((acc, a) => acc + a.percent, 0);
        avg = Math.round(sum / activity.length);
        const passes = activity.filter(a => a.percent >= (settings.passingScore || 0)).length;
        passRate = Math.round((passes / activity.length) * 100);
    }

    document.getElementById('statTotalUsers').textContent = totalUsers;
    document.getElementById('statTotalAttempts').textContent = totalAttempts;
    document.getElementById('statAvgScore').textContent = `${avg}%`;
    document.getElementById('statPassRate').textContent = `${passRate}%`;
}

function renderLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    const activity = computeAttemptPercents(getParticipants());

    // Aggregate by user best percent
    const byUser = {};
    activity.forEach(a => {
        if (!byUser[a.username || a.name]) {
            byUser[a.username || a.name] = { name: a.name, username: a.username || '-', best: a.percent, attempts: 0, last: a.date };
        }
        const ref = byUser[a.username || a.name];
        ref.attempts += 1;
        if (a.percent > ref.best) ref.best = a.percent;
        if (!ref.last || new Date(a.date) > new Date(ref.last)) ref.last = a.date;
    });

    const rows = Object.values(byUser)
        .sort((a, b) => (b.best - a.best) || (b.attempts - a.attempts))
        .slice(0, 10);

    tbody.innerHTML = '';
    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6">No attempts yet.</td></tr>';
        return;
    }

    rows.forEach((r, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td>${r.name || '-'}</td>
            <td>${r.username || '-'}</td>
            <td>${r.best}%</td>
            <td>${r.attempts}</td>
            <td>${r.last ? new Date(r.last).toLocaleString() : '—'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function exportAttemptsCsv() {
    const activity = computeAttemptPercents(getParticipants());
    if (!activity.length) { alert('No attempts to export.'); return; }
    const header = ['name','username','score','totalQuestions','percent','date'];
    const rows = activity.map(a => [
        a.name || '',
        a.username || '',
        a.score,
        a.totalQ,
        a.percent,
        a.date
    ]);
    const csv = [header.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz-attempts.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function handleUserAction(e) {
    const action = e.currentTarget.getAttribute('data-action');
    const username = e.currentTarget.getAttribute('data-username');
    const currentAdmin = getCurrentUser();
    if (!currentAdmin || currentAdmin.role !== 'admin') { alert('Admin only.'); return; }

    if (username === currentAdmin.username && action === 'delete') {
        alert('You cannot delete your own account while signed in.');
        return;
    }
    if (username === currentAdmin.username && action === 'role') {
        alert('You cannot change your own role while signed in.');
        return;
    }

    if (action === 'role') {
        const users = getUsers();
        const u = users.find(x => x.username === username);
        if (!u) return;
        u.role = u.role === 'admin' ? 'user' : 'admin';
        saveUsers(users);
        // If we promoted/demoted someone else, refresh
        renderUsers();
        alert(`Role updated: ${u.username} is now ${u.role}.`);
        return;
    }

    if (action === 'reset') {
        const users = getUsers();
        const u = users.find(x => x.username === username);
        if (!u) return;
        const pwd = prompt('Enter a new password for this user:');
        if (!pwd) { alert('Password not changed.'); return; }
        u.password = pwd;
        saveUsers(users);
        alert('Password reset.');
        return;
    }

    if (action === 'delete') {
        if (!confirm('Delete this user and their quiz history?')) return;
        const users = getUsers().filter(u => u.username !== username);
        saveUsers(users);
        // Remove their activity
        const activity = getParticipants().filter(p => p.username !== username);
        localStorage.setItem('participants', JSON.stringify(activity));
        renderUsers();
        alert('User deleted.');
        return;
    }
}

function saveCurrentQuestion() {
    const text = document.getElementById('qText').value.trim();
    const category = document.getElementById('qCategory').value.trim() || 'General';
    const answerSelect = document.getElementById('qAnswer');
    let choices;
    try {
        choices = collectOptions();
    } catch (err) {
        alert(err.message);
        return;
    }
    if (!text) { alert('Please enter a question.'); return; }
    if (choices.length > MAX_OPTIONS) { alert(`Limit options to ${MAX_OPTIONS}.`); return; }

    const answerIdx = Number(answerSelect.value || 0);
    if (answerIdx < 0 || answerIdx >= choices.length) { alert('Select a valid correct answer.'); return; }

    const bank = getQuestionBank();
    if (editingId) {
        const idx = bank.findIndex(q => q.id === editingId);
        if (idx !== -1) {
            bank[idx] = { ...bank[idx], text, category, choices, answer: answerIdx };
        }
    } else {
        const newId = Date.now();
        bank.push({ id: newId, text, category, choices, answer: answerIdx });
    }
    saveQuestionBank(bank);
    renderTable();
    resetForm();
}

function importQuestions(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) throw new Error('JSON must be an array of questions');
            const normalized = data.map((q, idx) => {
                const text = (q.text || '').trim();
                const category = (q.category || 'General').trim();
                const choices = Array.isArray(q.choices) ? q.choices.map(c => String(c).trim()).filter(Boolean) : [];
                const answer = Number(q.answer);
                if (!text || choices.length < MIN_OPTIONS || isNaN(answer) || answer < 0 || answer >= choices.length) {
                    throw new Error(`Invalid question at position ${idx + 1}`);
                }
                return { id: q.id || Date.now() + idx, text, category, choices, answer };
            });
            saveQuestionBank(normalized);
            renderTable();
            resetForm();
            alert('Questions imported successfully.');
        } catch (err) {
            alert(`Import failed: ${err.message}`);
        }
    };
    reader.readAsText(file);
}

function exportQuestions() {
    const bank = getQuestionBank();
    const blob = new Blob([JSON.stringify(bank, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question-bank.json';
    a.click();
    URL.revokeObjectURL(url);
}

function restoreDefaults() {
    saveQuestionBank(defaultQuestions);
    renderTable();
    resetForm();
    alert('Restored default questions.');
}

document.addEventListener('DOMContentLoaded', () => {
    const user = requireAdmin();
    if (!user) return;

    // Initialize theme
    initTheme();

    // header info
    const userLabel = document.getElementById('userLabel');
    if (userLabel) userLabel.textContent = `${user.name || user.username} [Admin]`;

    renderOptions();
    renderTable();
    renderUsers();
    loadSettingsForm();
    renderStats();
    renderLeaderboard();
    renderUsers();

    document.getElementById('qAnswer').addEventListener('change', (e) => {
        e.target.setAttribute('data-current', e.target.value);
    });

    document.getElementById('addOption').addEventListener('click', () => {
        const container = document.getElementById('optionsContainer');
        const count = container.querySelectorAll('.option-input').length;
        if (count >= MAX_OPTIONS) { alert(`Maximum ${MAX_OPTIONS} options.`); return; }
        container.appendChild(buildOptionRow(count, ''));
        updateAnswerChoices();
    });

    document.getElementById('removeOption').addEventListener('click', () => {
        const container = document.getElementById('optionsContainer');
        const opts = container.querySelectorAll('.option-row');
        if (opts.length <= MIN_OPTIONS) { alert(`At least ${MIN_OPTIONS} options required.`); return; }
        container.removeChild(opts[opts.length - 1]);
        updateAnswerChoices();
    });

    document.getElementById('saveQuestion').addEventListener('click', saveCurrentQuestion);
    document.getElementById('cancelEdit').addEventListener('click', resetForm);

    document.getElementById('saveSettings').addEventListener('click', saveSettingsFromForm);
    document.getElementById('resetSettings').addEventListener('click', () => {
        saveQuizSettings(defaultQuizSettings);
        loadSettingsForm();
        alert('Quiz settings restored to defaults.');
    });

    document.getElementById('exportAttemptsCsv').addEventListener('click', exportAttemptsCsv);

    document.getElementById('importBtn').addEventListener('click', () => {
        const fileInput = document.getElementById('importFile');
        if (!fileInput.files || !fileInput.files[0]) { alert('Choose a JSON file to import.'); return; }
        importQuestions(fileInput.files[0]);
        fileInput.value = '';
    });

    document.getElementById('exportBtn').addEventListener('click', exportQuestions);
    document.getElementById('resetToDefaults').addEventListener('click', restoreDefaults);

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    document.getElementById('backToQuiz').addEventListener('click', () => { window.location.href = 'index.html'; });
    document.getElementById('dashboardLink').addEventListener('click', () => { window.location.href = 'dashboard.html'; });
    document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = 'auth.html'; });
});

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        themeToggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }
}
