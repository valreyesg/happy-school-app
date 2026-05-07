const QRCode = require('qrcode');
const { uploadToCloudinary } = require('./cloudinaryService');

const cloudinaryEnabled = process.env.CLOUDINARY_ENABLED === 'true';

const generarQR = async (alumnoId, data) => {
  // Generar QR como buffer PNG
  const qrBuffer = await QRCode.toBuffer(data, {
    type: 'png',
    width: 400,
    margin: 2,
    color: { dark: '#2D3748', light: '#FFFFFF' },
  });

  if (cloudinaryEnabled) {
    // Producción: subir a Cloudinary
    const result = await uploadToCloudinary(qrBuffer, {
      folder: 'happy-school/qr-codes',
      public_id: `alumno-${alumnoId}`,
      overwrite: true,
      resource_type: 'image',
    });
    return { qr_url: result.url, public_id: result.public_id };
  } else {
    // Desarrollo: retornar como data URL (imagen real visible sin Cloudinary)
    const base64 = qrBuffer.toString('base64');
    const qr_url = `data:image/png;base64,${base64}`;
    return { qr_url, public_id: null };
  }
};

module.exports = { generarQR };
