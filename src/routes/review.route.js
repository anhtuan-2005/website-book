import express from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeAdmin } from '../middlewares/role.middleware.js';
import Book from '../models/book.model.js';

const router = express.Router();

// Middleware to find book ID by ISBN attached to request body
const findBookByISBN = async (req, res, next) => {
    const { isbn } = req.body;
    if (!isbn) {
        return res.status(400).json({ message: 'ISBN is required' });
    }

    try {
        const book = await Book.findByISBN(isbn);
        if (book) {
            req.bookId = book.id;
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

router.post('/', authenticate, findBookByISBN, reviewController.addReview);
// Admin routes
router.get('/', authenticate, reviewController.getAllReviews);
router.delete('/:id', authenticate, authorizeAdmin, reviewController.deleteReview);

export default router;
