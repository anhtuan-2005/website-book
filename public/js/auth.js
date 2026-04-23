// Helper to validate inputs
function validateForm(username, password) {
    if (!username || !username.trim()) {
        return 'Vui lòng nhập tên đăng nhập';
    }

    // Admin bypass checks
    if (username === 'admin') {
        // Admin logic if any specific, otherwise fall through to password check or skip
    } else {
        // Normal user checks
        if (!username.endsWith('@gmail.com')) {
            return 'Tên đăng nhập phải là email đuôi @gmail.com';
        }
        // Remove the regex check for special characters since email contains @ and .
    }

    if (!password || !password.trim()) {
        return 'Vui lòng nhập mật khẩu';
    }
    if (password.length <= 6) { // "trên 6 số" means > 6, so length 7+
        return 'Mật khẩu phải lớn hơn 6 ký tự';
    }
    return null;
}

// Login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const error = validateForm(username, password);
        if (error) {
            showAlert('alert', error, 'error');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('token', data.token);
                if (data.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/';
                }
            } else {
                showAlert('alert', data.message, 'error');
            }
        } catch (error) {
            showAlert('alert', 'Lỗi máy chủ', 'error');
        }
    });
}

// Register
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const error = validateForm(username, password);
        if (error) {
            showAlert('alert', error, 'error');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();
            if (res.ok) {
                alert('Đăng ký thành công! Vui lòng đăng nhập.');
                window.location.href = '/login.html';
            } else {
                showAlert('alert', data.message, 'error');
            }
        } catch (error) {
            showAlert('alert', 'Lỗi máy chủ', 'error');
        }
    });
}
