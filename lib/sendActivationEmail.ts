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
    from: `"ModeOn.ai" <${process.env.MAIL_FROM}>`,
    to: email,
    subject: "E-postanızı doğrulayın - ModeOn.ai",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d0f; padding: 40px; border-radius: 12px; color: #ffffff; text-align: center;">
        <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 8px;">ModeOn<span style="color: rgba(255,255,255,0.4)">.ai</span></h1>
        <p style="font-size: 16px; color: #a1a1aa; line-height: 1.5; margin-bottom: 32px;">Lütfen hesabınızı onaylamak için aşağıdaki butona tıklayın.</p>
        
        <a href="${url}" style="display: inline-block; background-color: #ffffff; color: #000000; text-decoration: none; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; padding: 16px 36px; border-radius: 6px;">E-postayı Doğrula</a>
        
        <p style="font-size: 12px; color: #52525b; margin-top: 32px;">Bu bağlantı 30 dakika boyunca geçerlidir. ModeOn.ai'a kayıt olmadıysanız bu e-postayı dikkate almayabilirsiniz.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 10px; color: #52525b; text-transform: uppercase; letter-spacing: 1px;">
          © ${new Date().getFullYear()} MODEON.AI
        </div>
      </div>
    `,
  });
}