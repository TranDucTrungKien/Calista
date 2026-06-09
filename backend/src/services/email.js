const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log('[email][skip] SMTP chưa cấu hình. To:', to, 'Subject:', subject);
    return { skipped: true };
  }
  return t.sendMail({
    from: process.env.SMTP_FROM || 'Calista <no-reply@calista.vn>',
    to,
    subject,
    html,
    text,
  });
}

module.exports = { sendMail };
