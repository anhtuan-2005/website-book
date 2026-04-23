import Book from '../models/book.model.js';
import Review from '../models/review.model.js';

export const getAllBooks = async (req, res) => {
    try {
        const { search, category, top_rated } = req.query;
        let books;
        if (top_rated) {
            books = await Book.getTopRated(5); // Get top 5 just in case
        } else if (search) {
            books = await Book.search(search);
        } else {
            books = await Book.findAll(category);
        }
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách sách', error: error.message });
    }
};

export const getBookByISBN = async (req, res) => {
    const { isbn } = req.params;
    try {
        const book = await Book.findByISBN(isbn);
        if (!book) {
            return res.status(404).json({ message: 'Không tìm thấy sách' });
        }

        // Fetch reviews for this book
        const reviews = await Review.findByBookId(book.id);

        res.status(200).json({ ...book, reviews });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy thông tin sách', error: error.message });
    }
};

export const createBook = async (req, res) => {
    let { title, author, year, isbn, image, categoryId, chapters } = req.body;

    // Auto-generate ISBN if missing
    if (!isbn || isbn.trim() === '') {
        isbn = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    }

    try {
        await Book.create(title, author, year, isbn, image, categoryId, chapters);
        res.status(201).json({ message: 'Tạo sách thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo sách', error: error.message });
    }
};

export const updateBook = async (req, res) => {
    const { isbn } = req.params;
    const { title, author, year, image, categoryId, chapters } = req.body;
    try {
        const updated = await Book.update(isbn, title, author, year, image, categoryId, chapters);
        if (updated) {
            res.status(200).json({ message: 'Cập nhật sách thành công' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy sách' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật sách', error: error.message });
    }
};

export const addChapter = async (req, res) => {
    const { isbn } = req.params;
    const { title, content } = req.body;

    try {
        const success = await Book.addChapter(isbn, title, content);
        if (success) {
            res.status(201).json({ message: 'Thêm chương thành công' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy sách' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi thêm chương', error: error.message });
    }
};

export const deleteChapter = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Book.deleteChapterById(id);
        if (result) {
            res.json({ message: 'Xóa chương thành công' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy chương' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa chương', error: error.message });
    }
};

export const deleteBook = async (req, res) => {
    const { isbn } = req.params;
    console.log('DELETE request for ISBN:', isbn);
    console.log('User info:', req.user);

    try {
        const deleted = await Book.delete(isbn);
        console.log('Delete result:', deleted);

        if (deleted) {
            res.status(200).json({ message: 'Xóa sách thành công' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy sách' });
        }
    } catch (error) {
        console.log('Delete error:', error);

        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            const errorMessage = error.message.toLowerCase();
            if (errorMessage.includes('reviews')) {
                return res.status(400).json({ message: 'Không thể xóa sách này vì đã có đánh giá liên quan.' });
            }
            if (errorMessage.includes('chapters')) {
                return res.status(400).json({ message: 'Không thể xóa sách này vì đang chứa các chương nội dung.' });
            }
            return res.status(400).json({ message: 'Không thể xóa sách này vì đang được sử dụng ở nơi khác.' });
        }

        res.status(500).json({ message: 'Lỗi khi xóa sách', error: error.message });
    }
};
