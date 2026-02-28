import nodemailer from "nodemailer";

// Hostinger SMTP configuration for Port 465 requires secure (SSL/TLS) to be explicitly true.
export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: true, // Port 465 ALWAYS requires SSL/TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Hostinger specific timeout improvements
  debug: true,
  logger: true
});