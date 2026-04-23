import db from '../config/db.js';

export default class Category {
    static async findAll() {
        const [rows] = await db.execute('SELECT * FROM categories ORDER BY name ASC');
        return rows;
    }

    static async create(name) {
        const [result] = await db.execute('INSERT INTO categories (name) VALUES (?)', [name]);
        return result.insertId;
    }

    static async delete(id) {
        const [result] = await db.execute('DELETE FROM categories WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}
