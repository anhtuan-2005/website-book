async function loadBooks(query = '') {
    const searchContainer = document.getElementById('search-results-container');
    const searchList = document.getElementById('search-results-list');
    const homeSections = document.getElementById('home-sections');

    // Containers for sections
    const bookOfDayContainer = document.getElementById('book-of-day');
    const featuredContainer = document.getElementById('featured-books');
    const newestContainer = document.getElementById('newest-books');

    let url = `${API_URL}/books`;
    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get('category');
    const queryParams = [];

    // Prioritize manual query arg, then URL param
    const searchQuery = query || params.get('search');

    if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
    if (categoryId) queryParams.push(`category=${categoryId}`);

    // Determine Mode
    const isSearchMode = queryParams.length > 0;

    if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
    }

    try {
        const res = await fetch(url);
        const books = await res.json();

        if (isSearchMode) {
            // SHOW SEARCH RESULTS, HIDE HOME SECTIONS
            searchContainer.style.display = 'block';
            homeSections.style.display = 'none';

            if (books.length === 0) {
                searchList.innerHTML = '<p>Không tìm thấy sách nào.</p>';
            } else {
                searchList.innerHTML = books.map(userBookCardTemplate).join('');
            }
        } else {
            // SHOW HOME SECTIONS, HIDE SEARCH RESULTS
            searchContainer.style.display = 'none';
            homeSections.style.display = 'block';

            if (books.length === 0) {
                bookOfDayContainer.innerHTML = '<p>Chưa có dữ liệu sách.</p>';
                return;
            }

            // 1. Sách Hôm Nay (Random 3 books)
            // Shuffle a copy of books array to pick random ones
            const randomBooks = [...books].sort(() => 0.5 - Math.random()).slice(0, 3);
            bookOfDayContainer.innerHTML = randomBooks.map(userBookCardTemplate).join('');

            // 2. Sách Nổi Bật (Fetch from DB for accuracy)
            try {
                const resTop = await fetch(`${API_URL}/books?top_rated=true`);
                const topRatedBooks = await resTop.json();

                // Take top 3
                const featured = topRatedBooks.slice(0, 3);
                featuredContainer.innerHTML = featured.map(userBookCardTemplate).join('');
            } catch (err) {
                console.error('Error fetching top rated:', err);
                featuredContainer.innerHTML = '<p>Lỗi tải sách nổi bật</p>';
            }

            // 3. Sách Mới Nhất (Last 3 books added)
            // API returns sorted by created_at DESC, so just take the first 3
            const newest = books.slice(0, 3);
            newestContainer.innerHTML = newest.map(userBookCardTemplate).join('');
        }

    } catch (error) {
        console.error(error);
        if (isSearchMode) {
            searchList.innerHTML = '<p>Lỗi khi tải danh sách sách.</p>';
        }
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

function renderBookOfDay(book, container) {
    const imageHtml = book.image_url
        ? `
        <div class="book-perspective">
            <div class="book-3d">
                <div class="book-cover" style="background-image: url('${book.image_url}')"></div>
            </div>
        </div>`
        : `<div style="width: 200px; height: 300px; background-color: #eee;">No Image</div>`;

    container.innerHTML = `
        <div class="book-card-large">
             ${imageHtml}
             <div class="book-card-large-content">
                <h3>${book.title}</h3>
                <div class="book-info"><strong>Tác giả:</strong> ${book.author}</div>
                <div class="book-info"><strong>Năm xuất bản:</strong> ${book.year || 'N/A'}</div>
                <div class="book-info" style="margin-top: 1rem;">
                    Mô tả: Một cuốn sách tuyệt vời đáng để đọc hôm nay. Khám phá ngay!
                </div>
                <a href="/book.html?isbn=${book.isbn}" class="btn">Đọc Ngay</a>
             </div>
        </div>
    `;
}

function searchBooks() {
    const query = document.getElementById('search-input').value;
    loadBooks(query);
}

document.addEventListener('DOMContentLoaded', () => {
    loadBooks();

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBooks();
            }
        });
    }
});
