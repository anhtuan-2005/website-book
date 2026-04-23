let currentCategory = null;

async function loadCategories() {
    const list = document.getElementById('category-list');
    try {
        const res = await fetch(`${API_URL}/categories`);
        if (res.ok) {
            const categories = await res.json();

            // Get current category from URL
            const params = new URLSearchParams(window.location.search);
            currentCategory = params.get('category');

            const allActive = !currentCategory ? 'active' : '';

            let html = `
                <div class="category-item ${allActive}" onclick="selectCategory(null)">
                    Tất cả sách
                </div>
            `;

            html += categories.map(c => `
                <div class="category-item ${currentCategory == c.id ? 'active' : ''}" 
                     onclick="selectCategory(${c.id})">
                    ${c.name}
                </div>
            `).join('');

            list.innerHTML = html;
        }
    } catch (e) {
        console.error('Error loading categories:', e);
        list.innerHTML = '<p>Lỗi tải danh mục</p>';
    }
}

function selectCategory(id) {
    currentCategory = id;

    // Update visual active state
    // Re-rendering is safest ensuring state consistency
    loadCategories();

    // Update URL without reload
    const url = new URL(window.location);
    if (id) {
        url.searchParams.set('category', id);
    } else {
        url.searchParams.delete('category');
    }
    window.history.pushState({}, '', url);

    // Refresh books
    loadAllBooks();
}

async function loadAllBooks(query = '') {
    const booksGrid = document.getElementById('books-grid');

    // Keep loading state minimal or use a skeleton to avoid flash
    booksGrid.innerHTML = '<p>Đang tải sách...</p>';

    let url = `${API_URL}/books`;
    const params = new URLSearchParams(window.location.search);

    // Use the current global category state OR the URL param if global is null
    const categoryId = currentCategory || params.get('category');
    const searchQuery = query || params.get('search');

    const queryParams = [];
    if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
    // Ensure we send categoryId if valid
    if (categoryId && categoryId !== 'null') queryParams.push(`category=${categoryId}`);

    if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
    }

    try {
        const res = await fetch(url);
        const books = await res.json();

        if (books.length === 0) {
            booksGrid.innerHTML = '<p>Không tìm thấy sách nào.</p>';
        } else {
            booksGrid.innerHTML = books.map(userBookCardTemplate).join('');
        }

    } catch (error) {
        console.error(error);
        booksGrid.innerHTML = '<p>Lỗi khi tải danh sách sách.</p>';
    }
}

function userBookCardTemplate(book) {
    const imageHtml = book.image_url
        ? `
        <div class="book-perspective">
            <div class="book-3d">
                <div class="book-cover" style="background-image: url('${book.image_url}')"></div>
            </div>
        </div>`
        : `<div style="width: 100%; height: 260px; background-color: #eee; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border-radius: 4px;">No Image</div>`;

    return `
    <div class="book-card">
        ${imageHtml}
        <h3><a href="/book.html?isbn=${book.isbn}">${book.title}</a></h3>
        <div class="book-info">Tác giả: ${book.author}</div>
        <div class="book-info">Năm: ${book.year || 'Không xác định'}</div>
        <div class="book-info">Mã sách: ${book.isbn}</div>
        <a href="/book.html?isbn=${book.isbn}" class="btn">Đọc ngay</a>
    </div>
    `;
}

function searchBooks() {
    const query = document.getElementById('search-input').value;

    // Update URL for consistency
    const url = new URL(window.location);
    if (query) {
        url.searchParams.set('search', query);
    } else {
        url.searchParams.delete('search');
    }
    window.history.pushState({}, '', url);

    loadAllBooks(query);
}

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadAllBooks();

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBooks();
            }
        });
    }
});
