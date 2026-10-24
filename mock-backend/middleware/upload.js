const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload folders exist on disk
const uploadBaseDir = path.join(__dirname, '..', 'uploads');
const avatarsDir = path.join(uploadBaseDir, 'avatars');
const attachmentsDir = path.join(uploadBaseDir, 'attachments');

[uploadBaseDir, avatarsDir, attachmentsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure disk storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'avatar') {
            cb(null, avatarsDir);
        } else {
            cb(null, attachmentsDir);
        }
    },
    filename: (req, file, cb) => {
        // Generates safe unique filename: fieldname-timestamp-cleanName.ext
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}-${baseName}${ext}`);
    }
});

// Filter file types
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'avatar') {
        const allowedImages = /jpeg|jpg|png|webp|gif/;
        const isMimeValid = allowedImages.test(file.mimetype);
        const isExtValid = allowedImages.test(path.extname(file.originalname).toLowerCase());

        if (isMimeValid && isExtValid) {
            return cb(null, true);
        }
        return cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed for avatars.'));
    }

    // Attachments allow documents, images, code files, zip
    cb(null, true);
};

// 1. Single Avatar upload (max 5MB)
const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// 2. Chat Attachment upload (max 25MB)
const uploadAttachment = multer({
    storage,
    fileFilter,
    limits: { fileSize: 25 * 1024 * 1024 }
});

module.exports = {
    uploadAvatar,
    uploadAttachment
};
