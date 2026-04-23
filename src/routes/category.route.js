import express from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

router.get('/', categoryController.getAllCategories);
// Protect write operations
router.post('/', authenticate, authorizeAdmin, categoryController.addCategory);
router.delete('/:id', authenticate, authorizeAdmin, categoryController.deleteCategory);

export default router;
