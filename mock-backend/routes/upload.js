const express = require('express');
const { uploadAttachment } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

const router = express.Router();

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

router.post('/', protect, (req, res) => {
    uploadAttachment.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file was uploaded' });
        }

        const ext = req.file.originalname.split('.').pop().toUpperCase();
        const fileUrl = `/uploads/attachments/${req.file.filename}`;

        return res.status(200).json({
            message: 'File uploaded successfully',
            fileUrl,
            fileName: req.file.originalname,
            fileSize: formatBytes(req.file.size),
            fileType: ext
        });
    });
});

module.exports = router;
