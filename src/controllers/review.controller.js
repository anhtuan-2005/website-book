import Review from '../models/review.model.js';
import { filterBadWords } from '../utils/wordFilter.js';

export const addReview = async (req, res) => {
    const { isbn, score, comment } = req.body;
    const userId = req.user.id;
    const bookId = req.bookId; // Set by middleware or lookup

    // We need bookId from ISBN first
    if (!bookId) {
        return res.status(400).json({ message: 'Thiếu ID sách' });
    }

    if (score < 1 || score > 5) {
        return res.status(400).json({ message: 'Điểm phải từ 1 đến 5' });
    }

    try {
        const hasReviewed = await Review.hasReviewed(userId, bookId);
        if (hasReviewed) {
            return res.status(400).json({ message: 'Bạn đã đánh giá sách này rồi' });
        }

        const cleanComment = filterBadWords(comment);
        await Review.create(userId, bookId, score, cleanComment);
        res.status(201).json({ message: 'Thêm đánh giá thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi thêm đánh giá', error: error.message });
    }
};

export const getBookReviews = async (req, res) => {
    // This might be handled by bookController.getBookByISBN usually, 
    // but if we want a specific endpoint for reviews:
    // ...
};

export const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.getAll();
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const deleteReview = async (req, res) => {
    const { id } = req.params;
    try {
        await Review.delete(id);
        res.status(200).json({ message: 'Xóa đánh giá thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};
