const fs = require('fs');
const path = require('path');
const multer = require('multer');

const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');
const attachmentsDir = path.join(__dirname, '..', 'uploads', 'attachments');

if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
}
if (!fs.existsSync(attachmentsDir)) {
    fs.mkdirSync(attachmentsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'avatar') {
            cb(null, avatarsDir);
        } else {
            cb(null, attachmentsDir);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'avatar') {
        const allowedImages = /jpeg|jpg|png|webp|gif/;
        const isMimeValid = allowedImages.test(file.mimetype);
        if (isMimeValid) {
            return cb(null, true);
        }
        return cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed for avatars.'));
    }
    cb(null, true);
};

const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadAttachment = multer({
    storage,
    fileFilter,
    limits: { fileSize: 25 * 1024 * 1024 }
});

module.exports = {
    storage,
    uploadAvatar,
    uploadAttachment
};
