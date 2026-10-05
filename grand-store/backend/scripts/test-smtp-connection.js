require('dotenv').config();
const nodemailer = require('nodemailer');

async function testConnection() {
  console.log('--- Testing Hostinger SMTP Connection ---');
  console.log(`Host: ${process.env.SMTP_HOST}`);
  console.log(`Port: ${process.env.SMTP_PORT}`);
  console.log(`User: ${process.env.SMTP_USER}`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: (process.env.SMTP_PORT || '465') == '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    console.log('Attempting SMTP verify handshake...');
    await transporter.verify();
    console.log('✅ SUCCESS! SMTP credentials and handshake verified successfully.');
    return true;
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
    if (err.response) {
      console.error('SMTP Response:', err.response);
    }
    return false;
  }
}

testConnection().then((success) => {
  process.exit(success ? 0 : 1);
});
