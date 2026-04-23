import User from '../models/user.model.js';
import db from '../config/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const register = async (req, res) => {
    const { username, password, full_name } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc' });
    }

    // Validation Rules
    if (username === 'admin') {
        // Admin exception
    } else {
        if (!username.endsWith('@gmail.com')) {
            return res.status(400).json({ message: 'Tên đăng nhập phải là email đuôi @gmail.com' });
        }
    }

    if (password.length <= 6) {
        return res.status(400).json({ message: 'Mật khẩu phải lớn hơn 6 ký tự' });
    }

    try {
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create(username, hashedPassword, full_name);

        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findByUsername(username);
        if (!user) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        if (user.is_locked) {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa.' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ message: 'Đăng nhập thành công', token, role: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const logout = (req, res) => {
    // For JWT, logout is handled on client side by removing token.
    // We can just send a success message.
    res.status(200).json({ message: 'Đăng xuất thành công' });
};
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.getAll();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};



export const toggleLock = async (req, res) => {
    const { id } = req.params;
    try {
        const [users] = await db.execute('SELECT role, is_locked FROM users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        if (users[0].role === 'admin') {
            return res.status(403).json({ message: 'Không thể khóa tài khoản Admin' });
        }

        const newStatus = !users[0].is_locked;
        await User.updateLockStatus(id, newStatus);

        res.json({ message: newStatus ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản', is_locked: newStatus });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        console.log('getProfile called for user ID:', req.user.id);
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log('User not found in DB for ID:', req.user.id);
            return res.status(404).json({ message: 'User record not found in database' });
        }
        res.json({ username: user.username, full_name: user.full_name, role: user.role });
    } catch (error) {
        console.error('getProfile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { full_name } = req.body;
        await User.updateProfile(req.user.id, full_name);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        if (newPassword.length <= 6) {
            return res.status(400).json({ message: 'Mật khẩu mới phải lớn hơn 6 ký tự' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updatePassword(req.user.id, hashedPassword);

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
