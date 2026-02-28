import { prisma } from "@/lib/prisma";
import { sendActivationEmail } from "@/lib/sendActivationEmail";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = (body?.email ?? "") as string;
    const password = (body?.password ?? "") as string;
    const name = (body?.name ?? null) as string | null;

    const email = rawEmail.trim().toLowerCase();

    if (!email || !password) {
      return Response.json({ ok: false, reason: "missing" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ ok: false, reason: "exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        passwordHash,
        authType: "credentials",
        emailVerified: null,
        status: "pending", // ✅ aktivasyon bekliyor
        role: "user",
        credits: 0,
        authorizedPages: ["/home"],
      },
    });

    await sendActivationEmail(email);

    return Response.json({ ok: true, sent: true });
  } catch (e) {
    console.error("REGISTER_ERROR", e);
    return Response.json({ ok: false, reason: "server_error" }, { status: 500 });
  }
}