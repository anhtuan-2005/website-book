import db from '../../src/config/db.js';

async function seedImages() {
    try {
        console.log('Seeding images for existing books...');

        // Clean Code
        await db.execute(
            "UPDATE books SET image_url = ? WHERE title LIKE ?",
            ['https://m.media-amazon.com/images/I/41jEbK-jG+L._SX258_BO1,204,203,200_.jpg', '%Clean Code%']
        );

        // Đắc Nhân Tâm
        await db.execute(
            "UPDATE books SET image_url = ? WHERE title LIKE ? OR title LIKE ?",
            ['https://vn-test-11.slatic.net/p/d850422c5462fac8d249f3e4e96db726.jpg', '%Đắc Nhân Tâm%', '%Dac Nhan Tam%']
        );

        // The Pragmatic Programmer
        await db.execute(
            "UPDATE books SET image_url = ? WHERE title LIKE ?",
            ['https://m.media-amazon.com/images/I/51W1sBPO7tL._SX380_BO1,204,203,200_.jpg', '%Pragmatic Programmer%']
        );

        console.log('Images updated successfully!');
    } catch (error) {
        console.error('Error seeding images:', error);
    } finally {
        process.exit();
    }
}

seedImages();
