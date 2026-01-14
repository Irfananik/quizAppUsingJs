// auth.js — simple client-side auth for demo purposes
// WARNING: This is for demo only. Passwords are stored in localStorage in plaintext — do NOT use in production.

function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}
function saveUsers(list) { localStorage.setItem('users', JSON.stringify(list)); }

function showFeedback(el, msg, isError = true) { el.innerHTML = msg; el.classList.toggle('wrong', isError); el.classList.toggle('correct', !isError); }

document.addEventListener('DOMContentLoaded', () => {
    // If already signed in, go to quiz
    if (localStorage.getItem('currentUser')) { window.location.href = 'index.html'; return; }
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginFeedback = document.getElementById('loginFeedback');
    const regFeedback = document.getElementById('regFeedback');

    function showTab(which) {
        if (which === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            tabLogin.classList.add('active'); tabRegister.classList.remove('active');
            tabLogin.setAttribute('aria-selected','true'); tabRegister.setAttribute('aria-selected','false');
            document.getElementById('loginUsername').focus();
        } else {
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            tabRegister.classList.add('active'); tabLogin.classList.remove('active');
            tabRegister.setAttribute('aria-selected','true'); tabLogin.setAttribute('aria-selected','false');
            document.getElementById('regName').focus();
        }
        // clear previous feedback
        loginFeedback.innerHTML = '';
        regFeedback.innerHTML = '';
    }

    tabLogin.addEventListener('click', () => showTab('login'));
    tabRegister.addEventListener('click', () => showTab('register'));

    registerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        if (!name || !username || !password) { showFeedback(regFeedback, 'Please fill all fields'); return; }
        const users = getUsers();
        if (users.find(u => u.username === username)) { showFeedback(regFeedback, 'Username already exists'); return; }
        users.push({ username, password, name, createdAt: new Date().toISOString() });
        saveUsers(users);
        showFeedback(regFeedback, 'Account created — signing in...', false);
        setTimeout(()=>{ localStorage.setItem('currentUser', JSON.stringify({ username, name })); window.location.href = 'index.html'; }, 700);
    });

    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!username || !password) { showFeedback(loginFeedback, 'Please enter credentials'); return; }
        const users = getUsers();
        const u = users.find(x => x.username === username && x.password === password);
        if (!u) { showFeedback(loginFeedback, 'Invalid username or password'); return; }
        showFeedback(loginFeedback, `Welcome back, ${u.name.split(' ')[0]}! Redirecting...`, false);
        setTimeout(()=>{ localStorage.setItem('currentUser', JSON.stringify({ username: u.username, name: u.name })); window.location.href = 'index.html'; }, 600);
    });

    // default to login
    showTab('login');
});