// participants.js
// Renders participants saved in localStorage and allows clearing them

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderParticipants() {
    const body = document.getElementById('participantsBody');
    const count = document.getElementById('participantsCount');
    const raw = JSON.parse(localStorage.getItem('participants') || '[]');
    const list = raw.slice().sort((a, b) => (b.score - a.score) || (new Date(b.date) - new Date(a.date)));
    body.innerHTML = '';
    if (list.length === 0) {
        body.innerHTML = '<tr><td colspan="4">No participants yet</td></tr>';
    } else {
        list.forEach((p, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${i + 1}</td><td>${escapeHtml(p.name)}</td><td>${p.score}</td><td>${new Date(p.date).toLocaleString()}</td>`;
            body.appendChild(tr);
        });
    }
    count.textContent = `${list.length} participant${list.length !== 1 ? 's' : ''}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const clearBtn = document.getElementById('clearParticipants');
    const backBtn = document.getElementById('backToQuiz');
    clearBtn.addEventListener('click', () => {
        if (confirm('Clear all participants?')) {
            localStorage.removeItem('participants');
            renderParticipants();
        }
    });
    backBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
    renderParticipants();
});