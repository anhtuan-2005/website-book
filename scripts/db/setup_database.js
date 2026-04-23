import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function setupDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log('Creating database...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        await connection.query(`USE ${process.env.DB_NAME}`);

        console.log('Creating tables...');

        // Users
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                is_locked TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migration: Ensure is_locked column exists (in case table already existed)
        try {
            await connection.query("ALTER TABLE users ADD COLUMN is_locked TINYINT(1) DEFAULT 0");
            console.log('Added is_locked column to users table.');
        } catch (err) {
            if (err.code !== 'ER_DUP_FIELDNAME') {
                console.log('Note: is_locked column check skipped or failed:', err.message);
            }
        }

        // Categories
        await connection.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Seed Categories
        const [catCount] = await connection.query('SELECT COUNT(*) as count FROM categories');
        if (catCount[0].count === 0) {
            const categories = ['Tiểu thuyết', 'Khoa học', 'Kinh tế', 'Văn học', 'Thiếu nhi'];
            for (const name of categories) {
                await connection.query('INSERT INTO categories (name) VALUES (?)', [name]);
            }
            console.log('Seeded default categories.');
        }

        // Books
        await connection.query(`
            CREATE TABLE IF NOT EXISTS books (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                author VARCHAR(100) NOT NULL,
                year INT,
                isbn VARCHAR(20) NOT NULL UNIQUE,
                image_url VARCHAR(255),
                category_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            )
        `);

        // Migration: Add category_id to books if not exists
        try {
            await connection.query("ALTER TABLE books ADD COLUMN category_id INT");
            await connection.query("ALTER TABLE books ADD CONSTRAINT fk_books_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL");
            console.log('Added category_id column to books table.');
        } catch (err) {
            if (err.code !== 'ER_DUP_FIELDNAME') {
                console.log('Note: category_id column check skipped or failed:', err.message);
            }
        }

        // Migration: Make year nullable
        try {
            await connection.query("ALTER TABLE books MODIFY COLUMN year INT NULL");
            console.log('Modified books table: year is now nullable.');
        } catch (err) {
            console.log('Note: year column modification ok or failed:', err.message);
        }

        // Reviews
        await connection.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                book_id INT NOT NULL,
                score INT NOT NULL CHECK (score >= 1 AND score <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
                UNIQUE KEY unique_review (user_id, book_id)
            )
        `);

        console.log('Database structure created successfully.');

        // Seed Data
        console.log('Seeding data...');

        // Seed Admin User
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const [users] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
        if (users.length === 0) {
            await connection.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashedPassword, 'admin']);
            console.log('Admin user created (username: admin, password: admin123)');
        }

        // Seed Books
        // Check if books table is empty
        const [bookCountResult] = await connection.query('SELECT COUNT(*) as count FROM books');
        const bookCount = bookCountResult[0].count;

        if (bookCount === 0) {
            const books = [
                { title: 'Memory', author: 'Doug Lloyd', year: 2020, isbn: '1632168146' },
                { title: 'Clean Code', author: 'Robert C. Martin', year: 2008, isbn: '9780132350884' },
                { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', year: 1999, isbn: '9780201616224' }
            ];

            for (const book of books) {
                await connection.query('INSERT INTO books (title, author, year, isbn) VALUES (?, ?, ?, ?)', [book.title, book.author, book.year, book.isbn]);
            }
            console.log('Seed data inserted.');
        } else {
            console.log('Books table already has data. Skipping seed.');
        }

    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        await connection.end();
        process.exit();
    }
}

setupDatabase();
