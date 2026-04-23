const API_URL = 'http://localhost:3000/api';

// Helper to check if logged in
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Helper to get current user info
function getUser() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch (e) {
        return null;
    }
}

// Update Navbar based on auth state
async function updateNavbar() {
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;

    // Fetch categories
    let categoriesHtml = '';
    try {
        const res = await fetch(`${API_URL}/categories`);
        if (res.ok) {
            const categories = await res.json();
            if (categories.length > 0) {
                categoriesHtml = `
                    <a href="/toanbosach.html" style="text-decoration: none; color: var(--text-muted); font-weight: 500;">Sách</a>
                `;
            }
        }
    } catch (e) {
        console.error('Error loading categories:', e);
    }

    const shouldHideBooksLink = window.location.pathname.includes('admin.html') || window.location.pathname.includes('profile.html');

    if (isLoggedIn()) {
        const user = getUser();
        let adminLink = '';
        if (user.role === 'admin') {
            adminLink = `<a href="/admin.html" style="color: var(--error-color); font-weight: bold;">Bảng điều khiển</a>`;
        }
        navLinks.innerHTML = `
            ${!shouldHideBooksLink ? categoriesHtml : ''}
            ${adminLink}
            <a href="/profile.html" style="text-decoration: none; color: inherit;">Xin chào, <strong>${user.username}</strong></a>
            <a href="#" onclick="logout()">Đăng xuất</a>
        `;
    } else {
        navLinks.innerHTML = `
            ${!shouldHideBooksLink ? categoriesHtml : ''}
            <a href="/login.html">Đăng nhập</a>
            <a href="/register.html">Đăng ký</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Alert Helper
function showAlert(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (el) {
        el.className = `alert alert-${type}`;
        el.innerText = message;
        el.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
});
