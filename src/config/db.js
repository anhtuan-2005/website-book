import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // TiDB Cloud sử dụng cổng 4000 thay vì 3306 mặc định
    port: process.env.DB_PORT || 4000, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Bắt buộc phải có SSL để kết nối với Database trên Cloud như TiDB
    ssl: {
        rejectUnauthorized: false
    }
});

export default pool.promise();