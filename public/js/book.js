const urlParams = new URLSearchParams(window.location.search);
const isbn = urlParams.get('isbn');

async function loadBookDetails() {
    const container = document.getElementById('book-container');

    if (!isbn) {
        container.innerHTML = '<p>Không có ISBN nào được cung cấp.</p>';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/books/${isbn}`);
        if (!res.ok) {
            container.innerHTML = '<p>Không tìm thấy sách.</p>';
            return;
        }
        const book = await res.json();

        // Fetch reviews for this book
        // ... (fetch logic remains same)

        renderBook(book);
        // loadReviews(book.id); 

    } catch (error) {
        container.innerHTML = '<p>Lỗi khi tải chi tiết sách.</p>';
        console.error(error);
    }
}

async function renderBook(book) {
    const container = document.getElementById('book-container');


    // Reviews HTML
    let reviewFormHtml = '';
    if (isLoggedIn()) {
        reviewFormHtml = `
            <div class="review-section">
                <h3>Viết đánh giá</h3>
                <div id="review-alert" class="alert"></div>
                <form id="review-form">
                    <div class="form-group">
                        <label>Điểm (1-5)</label>
                        <select id="score">
                            <option value="5">5 - ⭐⭐⭐⭐⭐ (Xuất sắc)</option>
                            <option value="4">4 - ⭐⭐⭐⭐ (Rất tốt)</option>
                            <option value="3">3 - ⭐⭐⭐ (Tốt)</option>
                            <option value="2">2 - ⭐⭐ (Trung bình)</option>
                            <option value="1">1 - ⭐ (Kém)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Bình luận</label>
                        <textarea id="comment" rows="4" required></textarea>
                    </div>
                     <button type="submit" class="btn">Gửi đánh giá</button>
                </form>
            </div>
        `;
    } else {
        reviewFormHtml = `<p><em><a href="/login.html">Đăng nhập</a> để viết đánh giá.</em></p>`;
    }

    // Helper to generate stars
    const getStarString = (score) => {
        const num = Math.round(parseFloat(score) || 0);
        return '⭐'.repeat(num);
    };

    // Render Reviews List
    let reviewsHtml = '<p>Chưa có đánh giá nào.</p>';
    if (book.reviews && book.reviews.length > 0) {
        reviewsHtml = book.reviews.map(r => `
            <div class="review">
                <div class="review-header">
                    <strong>${r.username}</strong> - <span class="score">${getStarString(r.score)}</span>
                    <small>(${new Date(r.created_at).toLocaleDateString()})</small>
                </div>
                <p>${r.comment}</p>
            </div>
        `).join('');
    }

    // Render Chapters List (Table of Contents)
    let chaptersHtml = '<p>Chưa có chương nào.</p>';
    if (book.chapters && Array.isArray(book.chapters) && book.chapters.length > 0) {
        chaptersHtml = `<ul class="chapter-list" style="list-style: none; padding: 0;">`;
        book.chapters.forEach((ch, index) => {
            // Determine display title
            const title = ch.title || `Chương ${index + 1}`;
            chaptersHtml += `
                <li style="margin-bottom: 8px; cursor: pointer; padding: 5px; border-bottom: 1px solid #eee;" 
                    onclick="loadChapter(${index})" id="chapter-link-${index}">
                    <strong>${title}</strong>
                </li>`;
        });
        chaptersHtml += `</ul>`;
    }

    // Prepare container structure
    container.innerHTML = `
        <!-- Hero / Header Section with Blurred Background -->
        <div class="book-detail-hero" style="position: relative; overflow: hidden; border-radius: 16px; margin-bottom: 2rem; border: 1px solid var(--border-color); background: var(--bg-surface);">
            
            <!-- Blurred Background Layer -->
            <div style="
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background-image: url('${book.image_url || ''}');
                background-size: cover;
                background-position: center;
                filter: blur(50px) brightness(0.4);
                opacity: 0.5;
                z-index: 0;
            "></div>

            <!-- Content Overlay -->
            <div style="position: relative; z-index: 1; padding: 2.5rem; display: flex; gap: 3rem; align-items: flex-start;">
                
                <!-- Left: Cover Image -->
                <div class="book-cover-col" style="flex: 0 0 260px;">
                    ${book.image_url
            ? `<img src="${book.image_url}" alt="${book.title}" style="width: 100%; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">`
            : `<div style="width: 100%; height: 380px; background-color: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ccc; border: 1px solid rgba(255,255,255,0.2);">No Image</div>`
        }
                </div>

                <!-- Right: Info -->
                <div class="book-info-col" style="flex: 1; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                    <div style="margin-bottom: 2rem;">
                        <a href="/toanbosach.html" style="color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 5px; transition: color 0.2s;">
                            &larr; Quay lại danh sách
                        </a>
                    </div>

                    <h1 style="color: white; margin-top: 0; font-size: 2.5rem; line-height: 1.2; margin-bottom: 1.5rem; font-weight: 700;">${book.title}</h1>
                    
                    <div class="book-meta-grid" style="display: grid; grid-template-columns: auto 1fr; gap: 0.75rem 2rem; font-size: 1.1rem; margin-bottom: 2rem;">
                        <span style="color: rgba(255,255,255,0.7);">Tác giả:</span>
                        <span style="font-weight: 500;">${book.author}</span>
                        
                        <span style="color: rgba(255,255,255,0.7);">Năm xuất bản:</span>
                        <span>${book.year || 'N/A'}</span>
                        
                        <span style="color: rgba(255,255,255,0.7);">Mã sách:</span>
                        <span style="font-family: monospace; letter-spacing: 1px;">${book.isbn}</span>
                    </div>

                    <div style="background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); display: inline-flex; flex-direction: column; gap: 5px;">
                        <span style="color: rgba(255,255,255,0.8); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Đánh giá</span>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="color: #ffd700; font-size: 1.8rem; letter-spacing: 2px;">${getStarString(book.average_score)}</span>
                            <span style="font-size: 1.2rem; font-weight: 600;">${parseFloat(book.average_score).toFixed(1)}</span>
                            <span style="color: rgba(255,255,255,0.6); font-size: 1rem;">(${book.review_count} lượt)</span>
                        </div>
                    </div>

                    <!-- Action Buttons & Badges -->
                    <div style="margin-top: 2rem; display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: center;">
                        <button onclick="document.querySelector('.reading-area').scrollIntoView({behavior: 'smooth'})" class="btn" style="background: var(--primary-color); border: none; padding: 1rem 2.5rem; font-size: 1.1rem; font-weight: 600; display: flex; align-items: center; gap: 0.75rem; border-radius: 50px; box-shadow: 0 4px 15px rgba(var(--primary-rgb), 0.4); transition: transform 0.2s;">
                            <span>📖</span> Đọc ngay
                        </button>
                        
                        <div style="display: flex; gap: 1rem;">
                            <span style="background: rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; display: flex; align-items: center; gap: 5px; border: 1px solid rgba(255,255,255,0.1);">
                                ✅ Sách bản quyền
                            </span>
                            <span style="background: rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; display: flex; align-items: center; gap: 5px; border: 1px solid rgba(255,255,255,0.1);">
                                📱 Hỗ trợ Mobile
                            </span>
                        </div>
                    </div>
                </div>
             </div>
        </div>
        
        <!-- Main Content Grid -->
        <div style="display: grid; grid-template-columns: 320px 1fr; gap: 2rem; align-items: start;">
            
            <!-- Table of Contents Card -->
            <div class="chapter-sidebar" style="background: var(--bg-surface); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); position: sticky; top: 20px;">
                <h3 style="margin-top: 0; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1rem;">Mục lục</h3>
                <div style="max-height: 500px; overflow-y: auto;">
                    ${chaptersHtml}
                </div>
            </div>

            <!-- Reading Area Card -->
            <div class="reading-area" style="background: var(--bg-surface); padding: 2.5rem; border-radius: 12px; border: 1px solid var(--border-color); min-height: 600px;">
                <h3 id="current-chapter-title" style="margin-top: 0; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1.5rem; color: var(--primary-color);">Nội dung sách</h3>
                <div id="chapter-content" class="book-content-scroll" style="white-space: pre-wrap; line-height: 1.8; font-size: 1.15em; color: var(--text-main);">
                    <em>Chọn một chương để đọc...</em>
                </div>
            </div>
        </div>

        <!-- Reviews Card -->
        <div class="review-section" style="margin-top: 2rem; background: var(--bg-surface); padding: 2rem; border-radius: 12px; border: 1px solid var(--border-color);">
            <h3 style="margin-top: 0; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">Các đánh giá từ độc giả</h3>
            <div id="reviews-list">
                ${reviewsHtml}
            </div>
            
            <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
                 ${reviewFormHtml}
            </div>
        </div>
    `;

    // Store book data globally to access chapters in loadChapter
    window.currentBook = book;

    // Load first chapter by default if exists
    if (book.chapters && book.chapters.length > 0) {
        loadChapter(0);
    } else {
        document.getElementById('chapter-content').innerHTML = '<em>Nội dung sách đang được cập nhật...</em>';
    }

    if (isLoggedIn()) {
        document.getElementById('review-form').addEventListener('submit', submitReview);
    }
}

// Global function to switch chapters
window.loadChapter = (index) => {
    if (!window.currentBook || !window.currentBook.chapters || !window.currentBook.chapters[index]) return;

    const ch = window.currentBook.chapters[index];
    const title = ch.title || `Chương ${index + 1}`;

    document.getElementById('current-chapter-title').textContent = title;
    document.getElementById('chapter-content').textContent = ch.content || 'Nội dung trống.';

    // Highlight active link
    document.querySelectorAll('[id^="chapter-link-"]').forEach(el => {
        el.style.backgroundColor = 'transparent';
        el.style.fontWeight = 'normal';
    });
    const activeLink = document.getElementById(`chapter-link-${index}`);
    if (activeLink) {
        activeLink.style.backgroundColor = 'var(--bg-input)';
        activeLink.style.fontWeight = 'bold';
    }

    // Scroll to top of reading area
    document.querySelector('.book-meta').scrollIntoView({ behavior: 'smooth' });
};

// Remove separate loadReviews function as it's now included

async function submitReview(e) {
    e.preventDefault();
    const score = document.getElementById('score').value;
    const comment = document.getElementById('comment').value;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ isbn, score, comment })
        });

        const data = await res.json();
        if (res.ok) {
            alert('Đánh giá đã được gửi!');
            location.reload();
        } else {
            showAlert('review-alert', data.message, 'error');
        }
    } catch (error) {
        showAlert('review-alert', 'Lỗi khi gửi đánh giá', 'error');
    }
}

document.addEventListener('DOMContentLoaded', loadBookDetails);
