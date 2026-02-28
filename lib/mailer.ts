import nodemailer from "nodemailer";

// Hostinger SMTP configuration for Port 465 requires secure (SSL/TLS) to be explicitly true.
// Hostinger SMTP configuration for Port 465 requires secure (SSL/TLS) and specifically 'LOGIN' auth method.
export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Ensure we use LOGIN method as Hostinger often rejects standard PLAIN method
  authMethod: 'LOGIN',
  // Increase timeouts for more stable connection
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  debug: true,
  logger: true
});