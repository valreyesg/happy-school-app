const QRCode = require('qrcode');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const generarQR = async (alumnoId, data) => {
  // Generar QR como buffer PNG
  const qrBuffer = await QRCode.toBuffer(data, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#2D3748', light: '#FFFFFF' },
  });

  // Subir a Cloudinary
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `happy-school/qr-codes`,
        public_id: `alumno-${alumnoId}`,
        overwrite: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ qr_url: result.secure_url, public_id: result.public_id });
      }
    );
    uploadStream.end(qrBuffer);
  });
};

module.exports = { generarQR };
