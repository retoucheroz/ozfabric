import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { mailer } from "@/lib/mailer";

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function sendActivationEmail(email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(token);

  // aynı email için eski tokenları temizle
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  // NextAuth'ın verification_tokens tablosuna yazıyoruz
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: tokenHash,
      expires: new Date(Date.now() + 30 * 60 * 1000), // 30dk
    },
  });

  const url =
    `${process.env.APP_URL}/verify?token=${encodeURIComponent(token)}` +
    `&email=${encodeURIComponent(email)}`;

  await mailer.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "E-posta doğrulama",
    html: `
      <p>Hesabını aktifleştirmek için tıkla:</p>
      <p><a href="${url}">E-postayı doğrula</a></p>
      <p>Bu link 30 dakika geçerlidir.</p>
    `,
  });
}