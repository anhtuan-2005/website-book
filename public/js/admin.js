// Check admin role
if (!isLoggedIn()) {
    window.location.href = '/login.html';
} else {
    const user = getUser();
    if (user.role !== 'admin') {
        alert('Từ chối truy cập. Chỉ dành cho Admin.');
        window.location.href = '/';
    }
}

let editingISBN = null;

async function loadAdminBooks() {
    const tbody = document.getElementById('book-table-body');
    const searchInput = document.getElementById('admin-search');
    const searchTerm = searchInput ? searchInput.value.trim() : '';

    tbody.innerHTML = '<tr><td colspan="4">Đang tải...</td></tr>';

    try {
        let url = `${API_URL}/books`;
        if (searchTerm) {
            url += `?search=${encodeURIComponent(searchTerm)}`;
        }
        const res = await fetch(url);
        const books = await res.json();

        if (books.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">Không có sách nào.</td></tr>';
            return;
        }

        tbody.innerHTML = books.map(book => `
            <tr>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.isbn}</td>
                <td>
                    <button class="action-btn" style="background-color: #ffc107; color: #000; margin-right: 5px;" onclick="editBook('${book.isbn}')">Sửa</button>
                    <button class="action-btn btn-danger" onclick="deleteBook('${book.isbn}')">Xóa</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="4">Lỗi khi tải danh sách sách.</td></tr>';
    }
}

async function deleteBook(isbn) {
    if (!confirm('Bạn có chắc chắn muốn xóa sách này không?')) return;

    try {
        const token = localStorage.getItem('token');

        if (!token) {
            alert('Không tìm thấy token. Vui lòng đăng nhập lại.');
            window.location.href = '/login.html';
            return;
        }

        const res = await fetch(`${API_URL}/books/${isbn}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (res.ok) {
            alert('Đã xóa sách thành công!');
            loadAdminBooks();
        } else {
            const data = await res.json();

            // Handle token expiration/invalid token
            if (res.status === 401 || res.status === 403 || data.message === 'Invalid token') {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }

            // Show the specific error message from the server (e.g. Foreign Key constraint)
            alert(`Lỗi: ${data.message}\nChi tiết: ${data.error || ''}`);
        }
    } catch (error) {
        console.error('Lỗi deleteBook:', error);
        alert('Lỗi kết nối đến máy chủ: ' + error.message);
    }
}

async function editBook(isbn) {
    try {
        const res = await fetch(`${API_URL}/books/${isbn}`);
        const book = await res.json();

        if (res.ok) {
            document.getElementById('title').value = book.title;
            document.getElementById('author').value = book.author;
            document.getElementById('year').value = book.year || '';
            document.getElementById('isbn').value = book.isbn;
            document.getElementById('image').value = book.image_url || '';
            document.getElementById('category_id').value = book.category_id || '';

            // Show ISBN in edit mode
            document.getElementById('isbn-group').style.display = 'block';
            document.getElementById('isbn').disabled = true;

            if (window.switchTab) window.switchTab('add');

            // Short delay to allow display change to render before scrolling (optional but safer)
            setTimeout(() => {
                document.getElementById('add-book-form').scrollIntoView({ behavior: 'smooth' });
            }, 100);

            editingISBN = isbn;
            const form = document.getElementById('add-book-form');
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Cập nhật';
            window.scrollTo(0, 0);

            // Populate chapters
            const container = document.getElementById('chapters-container');
            container.innerHTML = '';
            if (book.chapters && Array.isArray(book.chapters)) {
                book.chapters.forEach(ch => {
                    // Check if it's new object format or old string format (if legacy data exists)
                    const title = ch.title || ch;
                    const content = ch.content || '';
                    addChapterField(title, content);
                });
            }

            if (!document.getElementById('cancel-edit-btn')) {
                const cancelBtn = document.createElement('button');
                cancelBtn.id = 'cancel-edit-btn';
                cancelBtn.type = 'button';
                cancelBtn.textContent = 'Hủy';
                cancelBtn.className = 'action-btn btn-danger';
                cancelBtn.style.marginLeft = '10px';
                cancelBtn.onclick = resetForm;
                form.appendChild(cancelBtn);
            }
        }
    } catch (error) {
        console.error(error);
    }
}

function resetForm() {
    document.getElementById('add-book-form').reset();
    document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
    editingISBN = null;

    // Hide ISBN in add mode (auto-generated)
    const isbnGroup = document.getElementById('isbn-group');
    if (isbnGroup) isbnGroup.style.display = 'none';

    document.getElementById('isbn').disabled = false;
    const submitBtn = document.querySelector('#add-book-form button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Thêm sách';
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) cancelBtn.remove();
}

window.addChapterField = (title = '', content = '') => {
    const container = document.getElementById('chapters-container');
    const div = document.createElement('div');
    div.className = 'chapter-item';
    div.style.border = '1px solid #ddd';
    div.style.padding = '10px';
    div.style.marginBottom = '10px';
    div.style.backgroundColor = '#f9f9f9';
    div.style.borderRadius = '4px';

    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <input type="text" class="chapter-title" placeholder="Tên chương (VD: Chương 1)" value="${title}" style="flex: 1; margin-right: 10px;" required>
            <button type="button" class="btn-danger" onclick="this.parentElement.parentElement.remove()">Xóa</button>
        </div>
        <textarea class="chapter-content" rows="3" placeholder="Nội dung chương..." style="width: 100%;" required>${content}</textarea>
    `;
    container.appendChild(div);
};

window.toggleChapters = () => {
    const wrapper = document.getElementById('chapters-wrapper');
    if (wrapper.style.display === 'none') {
        wrapper.style.display = 'block';
    } else {
        wrapper.style.display = 'none';
    }
};

document.getElementById('add-book-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    // Clear previous errors
    document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');

    const titleInput = document.getElementById('title');
    const authorInput = document.getElementById('author');

    const title = titleInput.value.trim();
    const author = authorInput.value.trim();

    let isValid = true;

    if (!title) {
        isValid = false;
        const err = document.getElementById('error-title');
        err.textContent = 'Vui lòng nhập tiêu đề sách';
        err.style.display = 'block';
    }

    if (!author) {
        isValid = false;
        const err = document.getElementById('error-author');
        err.textContent = 'Vui lòng nhập tên tác giả';
        err.style.display = 'block';
    }

    if (!isValid) return;

    const year = document.getElementById('year').value;
    const isbn = document.getElementById('isbn').value;
    const image = document.getElementById('image').value;

    // Gather chapters data
    const chapterDivs = document.querySelectorAll('.chapter-item');
    const chapters = [];
    chapterDivs.forEach((div) => {
        const titleInput = div.querySelector('.chapter-title');
        const contentInput = div.querySelector('.chapter-content');
        if (titleInput && contentInput) {
            const title = titleInput.value.trim();
            const content = contentInput.value.trim();
            if (title && content) {
                chapters.push({ title, content });
            }
        }
    });

    try {
        const token = localStorage.getItem('token');

        if (!token) {
            alert('Không tìm thấy token. Vui lòng đăng nhập lại.');
            window.location.href = '/login.html';
            return;
        }

        const categoryId = document.getElementById('category_id').value;
        const yearInput = document.getElementById('year').value.trim();
        const year = (yearInput === '' || yearInput.toLowerCase() === 'không xác định') ? null : yearInput;

        const bookData = { title, author, year, isbn, image, categoryId, chapters };

        let url = `${API_URL}/books`;
        let method = 'POST';

        if (editingISBN) {
            url = `${API_URL}/books/${editingISBN}`;
            method = 'PUT';
            // ISBN might not be editable, but keep it in body if needed or remove
        }

        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(bookData)
        });

        const data = await res.json();
        if (res.ok) {
            alert(editingISBN ? 'Cập nhật sách thành công!' : 'Thêm sách thành công!');
            resetForm();
            loadAdminBooks();
        } else {
            console.error('Server Error Data:', data);
            const errorMsg = data.message || 'Lỗi không xác định';
            const errorDetail = data.error ? `\nChi tiết: ${data.error}` : '';
            showAlert('admin-alert', `${errorMsg}${errorDetail}`, 'error');
        }
    } catch (error) {
        console.error('Submit Error:', error);
        showAlert('admin-alert', 'Lỗi máy chủ: ' + error.message, 'error');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Initial hidden state for Add Mode
    const isbnGroup = document.getElementById('isbn-group');
    if (isbnGroup) isbnGroup.style.display = 'none';

    // Add listeners to clear errors
    ['title', 'author'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function () {
                const err = document.getElementById('error-' + id);
                if (err) err.style.display = 'none';
            });
        }
    });

    loadAdminBooks();

    // ... existing search logic ... //
    const searchInput = document.getElementById('admin-search');
    if (searchInput) {
        let timeout = null;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(loadAdminBooks, 300); // Debounce search
        });
    }

    // Load books for dropdown
    loadBookDropdown();

    // Load categories
    loadCategories();
});

async function loadBookDropdown() {
    const select = document.getElementById('book-select');
    if (!select) return;

    try {
        const res = await fetch(`${API_URL}/books`);
        const books = await res.json();

        // Clear old options (keep first one)
        select.innerHTML = '<option value="">-- Chọn sách --</option>';



        books.forEach(book => {
            const option = document.createElement('option');
            option.value = book.isbn;
            option.textContent = `${book.title} (${book.year})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading book dropdown:', error);
    }
}

async function loadUsers() {
    const tbody = document.getElementById('user-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Đang tải...</td></tr>';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await res.json();

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">Không có người dùng nào.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => {
            const isSelf = false; // logic if needed
            const isAdmin = user.role === 'admin';

            let actionButtons = '';
            if (isAdmin) {
                actionButtons = '<span class="badge" style="background-color: #6c757d; color: white; padding: 4px 8px; border-radius: 4px;">Admin (Protected)</span>';
            } else {
                const lockBtnText = user.is_locked ? 'Mở khóa' : 'Khóa';
                const lockBtnColor = user.is_locked ? '#28a745' : '#ffc107'; // Green to unlock, Yellow to lock
                const lockBtnStyle = `background-color: ${lockBtnColor}; color: black; margin-right: 5px;`;

                actionButtons = `
                    <button class="action-btn" style="${lockBtnStyle}" onclick="toggleLockUser(${user.id})">${lockBtnText}</button>
                `;
            }

            return `
            <tr>
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td>${actionButtons}</td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Lỗi khi tải người dùng:', error);
        tbody.innerHTML = '<tr><td colspan="4">Lỗi khi tải danh sách người dùng.</td></tr>';
    }
}

async function toggleLockUser(id) {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/users/${id}/lock`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok) {
            alert(data.message);
            loadUsers();
        } else {
            alert(data.message || 'Lỗi khi cập nhật trạng thái');
        }
    } catch (error) {
        console.error(error);
        alert('Lỗi kết nối');
    }
}



async function loadReviews() {
    const tbody = document.getElementById('review-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6">Đang tải...</td></tr>';

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/reviews`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const reviews = await res.json();

        if (reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Không có bình luận nào.</td></tr>';
            return;
        }

        tbody.innerHTML = reviews.map(review => {
            const date = new Date(review.created_at).toLocaleDateString();
            return `
            <tr>
                <td>${review.username}</td>
                <td>${review.title}</td>
                <td>${review.score}/5</td>
                <td>${review.comment || ''}</td>
                <td>${date}</td>
                <td>
                    <button class="action-btn btn-danger" onclick="deleteReview(${review.id})">Xóa</button>
                </td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Lỗi khi tải bình luận:', error);
        tbody.innerHTML = '<tr><td colspan="6">Lỗi khi tải danh sách bình luận.</td></tr>';
    }
}

async function deleteReview(id) {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/reviews/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert('Xóa bình luận thành công!');
            loadReviews();
        } else {
            const data = await res.json();
            alert(data.message || 'Lỗi khi xóa bình luận');
        }
    } catch (error) {
        console.error(error);
        alert('Lỗi kết nối');
    }
}


// Categories Management
async function loadCategories() {
    const tbody = document.getElementById('category-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="2">Đang tải...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/categories`);
        const categories = await res.json();

        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2">Chưa có danh mục nào.</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map(c => `
            <tr>
                <td>${c.name}</td>
                <td>
                    <button class="action-btn btn-danger" onclick="deleteCategory(${c.id})">Xóa</button>
                </td>
            </tr>
        `).join('');

        // Also populate select dropdown in add book form
        populateCategorySelect(categories);

    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="2">Lỗi khi tải danh mục.</td></tr>';
    }
}

function populateCategorySelect(categories) {
    const select = document.getElementById('category_id');
    if (select) {
        // Keep first option
        const firstOption = select.options[0];
        select.innerHTML = '';
        select.appendChild(firstOption);

        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            select.appendChild(opt);
        });
    }
}

async function addCategory() {
    const nameInput = document.getElementById('new-category-name');
    const name = nameInput.value.trim();
    if (!name) return alert('Vui lòng nhập tên danh mục');

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name })
        });

        const data = await res.json();
        if (res.ok) {
            showAlert('category-alert', 'Thêm danh mục thành công', 'success');
            nameInput.value = '';
            loadCategories();
            // Reload navbar categories if main.js exposed a reload function, but a page refresh works too
        } else {
            showAlert('category-alert', data.message, 'error');
        }
    } catch (error) {
        console.error(error);
    }
}

async function deleteCategory(id) {
    if (!confirm('Bạn chắc chắn muốn xóa danh mục này?')) return;
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            loadCategories();
        } else {
            const data = await res.json();
            alert(data.message || 'Lỗi khi xóa. Có thể danh mục đang được sử dụng?');
        }
    } catch (error) {
        console.error(error);
        alert('Lỗi kết nối');
    }
}
