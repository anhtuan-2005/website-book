// wait-for-db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function waitForDb() {
    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;

    console.log(`Waiting for database at ${host}...`);

    for (let i = 0; i < 30; i++) {
        try {
            const connection = await mysql.createConnection({ host, user, password });
            await connection.end();
            console.log('Database is ready!');
            process.exit(0);
        } catch (err) {
            console.log('Database not ready, retrying in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    console.error('Timeout waiting for database');
    process.exit(1);
}

waitForDb();
