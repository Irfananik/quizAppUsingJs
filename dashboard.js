// dashboard.js - User dashboard showing profile and quiz history

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderUserProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please sign in first');
        window.location.href = 'auth.html';
        return;
    }

    // Get full user details from users list
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const fullUser = users.find(u => u.username === currentUser.username);

    // Populate profile information
    document.getElementById('userName').textContent = currentUser.name || currentUser.username;
    document.getElementById('userUsername').textContent = currentUser.username;
    document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Administrator' : 'Normal User';
    
    if (fullUser && fullUser.createdAt) {
        const date = new Date(fullUser.createdAt);
        document.getElementById('userCreatedAt').textContent = date.toLocaleDateString();
    } else {
        document.getElementById('userCreatedAt').textContent = 'N/A';
    }

    // Update header
    const userLabel = document.getElementById('userLabel');
    const roleLabel = isAdmin() ? ' [Admin]' : '';
    userLabel.textContent = `${currentUser.name || currentUser.username}${roleLabel}`;
}

function renderUserScores() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const raw = JSON.parse(localStorage.getItem('participants') || '[]');
    const userScores = raw.filter(p => p.username === currentUser.username);
    const sorted = userScores.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate statistics
    const totalAttempts = userScores.length;
    let averagePercent = 0;
    let bestPercent = 0;
    let lastPercent = '-';

    if (totalAttempts > 0) {
        const percents = userScores.map(p => {
            const totalQ = Number(p.totalQuestions) || 10;
            return Math.round((p.score / totalQ) * 100);
        });
        const sum = percents.reduce((acc, n) => acc + n, 0);
        averagePercent = Math.round(sum / percents.length);
        bestPercent = Math.max(...percents);
        lastPercent = percents[0];
    }

    // Update statistics
    document.getElementById('totalAttempts').textContent = totalAttempts;
    document.getElementById('averageScore').textContent = `${averagePercent}%`;
    document.getElementById('bestScore').textContent = `${bestPercent}%`;
    document.getElementById('lastScore').textContent = typeof lastPercent === 'number' ? `${lastPercent}%` : '-';

    // Render score history table
    const body = document.getElementById('scoresBody');
    const count = document.getElementById('scoresCount');

    body.innerHTML = '';
    if (sorted.length === 0) {
        body.innerHTML = '<tr><td colspan="4">No quiz attempts yet. Take the quiz to see your scores!</td></tr>';
        count.textContent = '';
    } else {
        sorted.forEach((p, i) => {
            const tr = document.createElement('tr');
            const totalQ = Number(p.totalQuestions) || 10;
            const percentage = ((p.score / totalQ) * 100).toFixed(0);
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${p.score}/${totalQ}</td>
                <td>${percentage}%</td>
                <td>${new Date(p.date).toLocaleString()}</td>
            `;
            body.appendChild(tr);
        });
        count.textContent = `Showing ${sorted.length} quiz attempt${sorted.length !== 1 ? 's' : ''}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = getCurrentUser();
    
    // Check authentication
    if (!currentUser) {
        alert('Please sign in first');
        window.location.href = 'auth.html';
        return;
    }

    // Render profile and scores
    renderUserProfile();
    renderUserScores();

    // Show "View All Participants" button only for admins
    if (isAdmin()) {
        const viewAllBtn = document.getElementById('viewAllParticipants');
        viewAllBtn.style.display = 'inline-block';
        viewAllBtn.addEventListener('click', () => {
            window.location.href = 'participants.html';
        });
    }

    // Event listeners
    document.getElementById('backToQuiz').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'auth.html';
        }
    });
});
