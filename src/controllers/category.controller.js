import Category from '../models/category.model.js';

export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh mục', error: error.message });
    }
};

export const addCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });

        await Category.create(name);
        res.status(201).json({ message: 'Thêm danh mục thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi thêm danh mục', error: error.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await Category.delete(id);
        if (success) {
            res.json({ message: 'Xóa danh mục thành công' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy danh mục' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa danh mục', error: error.message });
    }
};
