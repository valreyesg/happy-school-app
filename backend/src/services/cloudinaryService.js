const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const cloudinaryEnabled = process.env.CLOUDINARY_ENABLED === 'true';

let cloudinary = null;
if (isProduction && cloudinaryEnabled) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadToCloudinary = async (buffer, options = {}) => {
  if (cloudinary) {
    // Subida real a Cloudinary
    return new Promise((resolve, reject) => {
      const { Readable } = require('stream');
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', ...options },
        (error, result) => {
          if (error) return reject(error);
          resolve({ url: result.secure_url, public_id: result.public_id });
        }
      );
      const readable = new Readable();
      readable._read = () => {};
      readable.push(buffer);
      readable.push(null);
      readable.pipe(stream);
    });
  } else {
    // Desarrollo: guardar archivo localmente y servir desde /uploads/
    const folder = options.folder || 'default';
    const ext = options.format || 'jpg';
    const filename = `${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const dirPath = path.join(__dirname, '..', '..', 'uploads', folder);
    fs.mkdirSync(dirPath, { recursive: true });
    const filePath = path.join(dirPath, filename);
    fs.writeFileSync(filePath, buffer);

    const port = process.env.PORT || 3000;
    const baseUrl = process.env.APP_BASE_URL || `http://localhost:${port}`;
    const url = `${baseUrl}/uploads/${folder}/${filename}`;
    const publicId = `local/${folder}/${filename}`;
    return { url, public_id: publicId };
  }
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  if (cloudinary) {
    return cloudinary.uploader.destroy(publicId);
  }
  // Desarrollo: intentar borrar archivo local
  if (publicId.startsWith('local/')) {
    const relPath = publicId.replace('local/', '');
    const filePath = path.join(__dirname, '..', '..', 'uploads', relPath);
    try { fs.unlinkSync(filePath); } catch { /* ignorar */ }
  }
  return { result: 'ok' };
};

const uploadPDF = (buffer, options = {}) => {
  return uploadToCloudinary(buffer, { resource_type: 'raw', format: 'pdf', ...options });
};

module.exports = { uploadToCloudinary, deleteFromCloudinary, uploadPDF };
