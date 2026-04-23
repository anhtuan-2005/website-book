import db from '../config/db.js';

export default class Book {
    static async findAll(categoryId = null) {
        let query = `
            SELECT b.*, c.name as category_name, 
                   COALESCE(AVG(r.score), 0) as average_score
            FROM books b 
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN reviews r ON b.id = r.book_id
        `;
        const params = [];
        if (categoryId) {
            query += ' WHERE b.category_id = ?';
            params.push(categoryId);
        }
        query += ' GROUP BY b.id';
        query += ' ORDER BY b.created_at DESC';
        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async getTopRated(limit = 3) {
        const query = `
            SELECT b.*, c.name as category_name, 
                   COALESCE(AVG(r.score), 0) as average_score
            FROM books b 
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN reviews r ON b.id = r.book_id
            GROUP BY b.id
            ORDER BY average_score DESC, b.created_at DESC
            LIMIT ?
        `;
        const [rows] = await db.execute(query, [String(limit)]);
        return rows;
    }

    static async findByISBN(isbn) {
        // Get book details and aggregate review stats
        const query = `
            SELECT b.*, c.name as category_name,
                   COUNT(r.id) as review_count, 
                   COALESCE(AVG(r.score), 0) as average_score
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN reviews r ON b.id = r.book_id
            WHERE b.isbn = ?
            GROUP BY b.id
        `;
        const [rows] = await db.execute(query, [isbn]);
        const book = rows[0];

        if (book) {
            // Fetch chapters
            const [chapters] = await db.execute('SELECT * FROM chapters WHERE book_id = ? ORDER BY order_index ASC', [book.id]);
            book.chapters = chapters;
        }

        return book;
    }

    static async search(term) {
        const searchTerm = `%${term}%`;
        const query = `
            SELECT b.*, c.name as category_name 
            FROM books b 
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.isbn LIKE ? OR b.title LIKE ? OR b.author LIKE ? OR b.year LIKE ?
        `;
        const [rows] = await db.execute(query, [searchTerm, searchTerm, searchTerm, searchTerm]);
        return rows;
    }

    static async create(title, author, year, isbn, image, categoryId, chapters = []) {
        // chapters is now an array of { title, content } objects
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Insert Book
            const [result] = await connection.execute(
                'INSERT INTO books (title, author, year, isbn, image_url, category_id) VALUES (?, ?, ?, ?, ?, ?)',
                [title, author, year, isbn, image, categoryId || null]
            );
            const bookId = result.insertId;

            // Insert Chapters
            if (chapters && chapters.length > 0) {
                for (let i = 0; i < chapters.length; i++) {
                    const ch = chapters[i];
                    await connection.execute(
                        'INSERT INTO chapters (book_id, title, content, order_index) VALUES (?, ?, ?, ?)',
                        [bookId, ch.title, ch.content, i]
                    );
                }
            }

            await connection.commit();
            return bookId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async update(isbn, title, author, year, image, categoryId, chapters = []) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Find Book ID first
            const [books] = await connection.execute('SELECT id FROM books WHERE isbn = ?', [isbn]);
            if (books.length === 0) {
                connection.release();
                return 0;
            }
            const bookId = books[0].id;

            // Update Book Info
            await connection.execute(
                'UPDATE books SET title = ?, author = ?, year = ?, image_url = ?, category_id = ? WHERE isbn = ?',
                [title, author, year, image, categoryId || null, isbn]
            );

            // Replace Chapters (Delete All -> Insert New)
            await connection.execute('DELETE FROM chapters WHERE book_id = ?', [bookId]);

            if (chapters && chapters.length > 0) {
                for (let i = 0; i < chapters.length; i++) {
                    const ch = chapters[i];
                    await connection.execute(
                        'INSERT INTO chapters (book_id, title, content, order_index) VALUES (?, ?, ?, ?)',
                        [bookId, ch.title, ch.content, i]
                    );
                }
            }

            await connection.commit();



            return 1;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }



    static async addChapter(isbn, title, content) {
        const connection = await db.getConnection();
        try {
            // Find Book ID
            const [books] = await connection.execute('SELECT id FROM books WHERE isbn = ?', [isbn]);
            if (books.length === 0) {
                return false;
            }
            const bookId = books[0].id;

            // Get max order_index
            const [rows] = await connection.execute('SELECT MAX(order_index) as maxOrder FROM chapters WHERE book_id = ?', [bookId]);
            const nextOrder = (rows[0].maxOrder !== null) ? rows[0].maxOrder + 1 : 0;

            // Insert Chapter
            await connection.execute(
                'INSERT INTO chapters (book_id, title, content, order_index) VALUES (?, ?, ?, ?)',
                [bookId, title, content, nextOrder]
            );

            return true;
        } finally {
            connection.release();
        }
    }

    static async deleteChapterById(id) {
        const [result] = await db.execute('DELETE FROM chapters WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async delete(isbn) {
        const [result] = await db.execute('DELETE FROM books WHERE isbn = ?', [isbn]);

        // Resequence IDs to be 1, 2, 3... and reset AUTO_INCREMENT
        if (result.affectedRows > 0) {

        }

        // Return affectedRows for consistency
        return result.affectedRows ? 1 : 0;
    }
}
