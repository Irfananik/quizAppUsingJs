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

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 8;
let editingId = null;

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

    // header info
    const userLabel = document.getElementById('userLabel');
    if (userLabel) userLabel.textContent = `${user.name || user.username} [Admin]`;

    renderOptions();
    renderTable();

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

    document.getElementById('importBtn').addEventListener('click', () => {
        const fileInput = document.getElementById('importFile');
        if (!fileInput.files || !fileInput.files[0]) { alert('Choose a JSON file to import.'); return; }
        importQuestions(fileInput.files[0]);
        fileInput.value = '';
    });

    document.getElementById('exportBtn').addEventListener('click', exportQuestions);
    document.getElementById('resetToDefaults').addEventListener('click', restoreDefaults);

    document.getElementById('backToQuiz').addEventListener('click', () => { window.location.href = 'index.html'; });
    document.getElementById('dashboardLink').addEventListener('click', () => { window.location.href = 'dashboard.html'; });
    document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = 'auth.html'; });
});
