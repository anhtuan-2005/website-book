import db from '../config/db.js';

export default class Review {
    static async create(userId, bookId, score, comment) {
        const [result] = await db.execute(
            'INSERT INTO reviews (user_id, book_id, score, comment) VALUES (?, ?, ?, ?)',
            [userId, bookId, score, comment]
        );
        return result.insertId;
    }

    static async findByBookId(bookId) {
        const query = `
            SELECT r.*, u.username 
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.book_id = ?
            ORDER BY r.created_at DESC
        `;
        const [rows] = await db.execute(query, [bookId]);
        return rows;
    }

    static async hasReviewed(userId, bookId) {
        const [rows] = await db.execute(
            'SELECT id FROM reviews WHERE user_id = ? AND book_id = ?',
            [userId, bookId]
        );
        return rows.length > 0;
    }

    static async getAll() {
        // Get all reviews with user info and book title
        const query = `
            SELECT r.id, r.score, r.comment, r.created_at, u.username, b.title 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            JOIN books b ON r.book_id = b.id 
            ORDER BY r.created_at DESC
        `;
        const [rows] = await db.execute(query);
        return rows;
    }

    static async delete(id) {
        await db.execute('DELETE FROM reviews WHERE id = ?', [id]);
    }
}
