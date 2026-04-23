document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }

    await loadProfile();

    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }


});

async function loadProfile() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            const user = await res.json();
            console.log('User profile loaded:', user);

            const emailEl = document.getElementById('user-email');
            const roleEl = document.getElementById('user-role');

            if (emailEl) emailEl.textContent = user.username;
            if (roleEl) {
                let roleText = 'User';
                if (user.role === 'admin') roleText = 'Admin';
                roleEl.textContent = roleText;
            }
        } else {
            console.error('Failed to load profile:', res.status, res.statusText);
            const errorText = await res.text();
            console.error('Error details:', errorText);

            const emailEl = document.getElementById('user-email');
            if (emailEl) emailEl.textContent = `Lỗi tải: ${res.status}`;

            if (res.status === 401 || res.status === 403) {
                alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
                logout();
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        const emailEl = document.getElementById('user-email');
        if (emailEl) emailEl.textContent = 'Lỗi kết nối';
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        showAlert('password-alert', 'Mật khẩu xác nhận không khớp', 'error');
        return;
    }

    try {
        const res = await fetch('/api/profile/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const data = await res.json();

        if (res.ok) {
            showAlert('password-alert', 'Đổi mật khẩu thành công', 'success');
            document.getElementById('change-password-form').reset();
        } else {
            showAlert('password-alert', data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (error) {
        showAlert('password-alert', 'Lỗi kết nối', 'error');
    }
}


