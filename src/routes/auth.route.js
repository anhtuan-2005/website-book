import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeAdmin } from '../middlewares/role.middleware.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile/info', authenticate, authController.updateProfile);
router.put('/profile/password', authenticate, authController.updatePassword);

// Admin routes
router.get('/users', authenticate, authorizeAdmin, authController.getAllUsers);
router.put('/users/:id/lock', authenticate, authorizeAdmin, authController.toggleLock);

export default router;
