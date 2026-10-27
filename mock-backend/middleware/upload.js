const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        if (file.fieldname === 'avatar') {
            return {
                folder: 'skill-nexus/avatars',
                allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'gif']
            };
        }
        return {
            folder: 'skill-nexus/attachments',
            resource_type: 'auto'
        };
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
    cloudinary,
    storage,
    uploadAvatar,
    uploadAttachment
};
