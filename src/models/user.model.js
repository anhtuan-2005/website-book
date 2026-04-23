import db from '../config/db.js';

export default class User {
    static async create(username, password, fullName = null) {
        const [result] = await db.execute(
            'INSERT INTO users (username, password, full_name) VALUES (?, ?, ?)',
            [username, password, fullName]
        );
        return result.insertId;
    }

    static async findByUsername(username) {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.execute(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async getAll() {
        const [rows] = await db.execute('SELECT id, username, full_name, role, is_locked FROM users');
        return rows;
    }

    static async delete(id) {
        await db.execute('DELETE FROM users WHERE id = ?', [id]);
    }

    static async updateLockStatus(id, isLocked) {
        await db.execute('UPDATE users SET is_locked = ? WHERE id = ?', [isLocked, id]);
    }

    static async updatePassword(id, hashedPassword) {
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    }

    static async updateProfile(id, fullName) {
        await db.execute('UPDATE users SET full_name = ? WHERE id = ?', [fullName, id]);
    }
}
