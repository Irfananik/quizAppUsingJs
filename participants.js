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

function renderUserScores(currentUser) {
    const body = document.getElementById('participantsBody');
    const count = document.getElementById('participantsCount');
    const raw = JSON.parse(localStorage.getItem('participants') || '[]');
    
    // Filter to show only current user's scores
    const userScores = raw.filter(p => p.username === currentUser.username);
    const list = userScores.slice().sort((a, b) => (new Date(b.date) - new Date(a.date)));
    
    body.innerHTML = '';
    if (list.length === 0) {
        body.innerHTML = '<tr><td colspan="4">No quiz attempts yet. Take the quiz to see your scores!</td></tr>';
    } else {
        list.forEach((p, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${i + 1}</td><td>${escapeHtml(currentUser.name)}</td><td>${p.score}</td><td>${new Date(p.date).toLocaleString()}</td>`;
            body.appendChild(tr);
        });
    }
    count.textContent = `Your scores: ${list.length} attempt${list.length !== 1 ? 's' : ''}`;
}

function renderParticipants() {
    const body = document.getElementById('participantsBody');
    const count = document.getElementById('participantsCount');
    const raw = JSON.parse(localStorage.getItem('participants') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Enrich participant entries with displayName: prefer saved name, otherwise lookup by username
    const enriched = raw.map(p => {
        let displayName = p.name;
        if ((!displayName || displayName === 'Anonymous') && p.username) {
            const uu = users.find(u => u.username === p.username);
            displayName = uu ? (uu.name || uu.username) : p.username;
        }
        return Object.assign({}, p, { displayName });
    });

    const list = enriched.slice().sort((a, b) => (b.score - a.score) || (new Date(b.date) - new Date(a.date)));
    body.innerHTML = '';
    if (list.length === 0) {
        body.innerHTML = '<tr><td colspan="4">No participants yet</td></tr>';
    } else {
        list.forEach((p, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${i + 1}</td><td>${escapeHtml(p.displayName || p.name)}</td><td>${p.score}</td><td>${new Date(p.date).toLocaleString()}</td>`;
            body.appendChild(tr);
        });
    }
    count.textContent = `${list.length} participant${list.length !== 1 ? 's' : ''}`;
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is signed in and is admin
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
        alert('Please sign in first');
        window.location.href = 'auth.html';
        return;
    }
    
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    if (!isAdmin) {
        // Normal users see only their own scores
        alert('Access restricted. Viewing your scores only.');
        renderUserScores(currentUser);
        // Hide clear button for normal users
        const clearBtn = document.getElementById('clearParticipants');
        if (clearBtn) clearBtn.style.display = 'none';
    } else {
        // Admin sees all participants
        renderParticipants();
    }
    
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