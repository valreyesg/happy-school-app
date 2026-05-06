const crypto = require('crypto');

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
    // Cloudinary desactivado o desarrollo: generar URL simulada
    const publicId = `mock/${options.folder || 'default'}/${crypto.randomBytes(8).toString('hex')}`;
    const url = `https://res.cloudinary.com/mock-dev/image/upload/v1/${publicId}`;
    return { url, public_id: publicId };
  }
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  if (cloudinary) {
    return cloudinary.uploader.destroy(publicId);
  }
  return { result: 'ok' };
};

const uploadPDF = (buffer, options = {}) => {
  return uploadToCloudinary(buffer, { resource_type: 'raw', format: 'pdf', ...options });
};

module.exports = { uploadToCloudinary, deleteFromCloudinary, uploadPDF };
