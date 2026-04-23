import express from 'express';
import * as bookController from '../controllers/book.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

router.get('/', bookController.getAllBooks); // /api/books
router.get('/:isbn', bookController.getBookByISBN); // /api/books/:isbn

// Admin only routes
router.post('/', authenticate, authorizeAdmin, bookController.createBook);
router.put('/:isbn', authenticate, authorizeAdmin, bookController.updateBook);
router.post('/:isbn/chapters', authenticate, authorizeAdmin, bookController.addChapter);
router.delete('/chapters/:id', authenticate, authorizeAdmin, bookController.deleteChapter);
router.delete('/:isbn', authenticate, authorizeAdmin, bookController.deleteBook);

export default router;
