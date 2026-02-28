import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body?.token as string | undefined;
    const rawEmail = body?.email as string | undefined;

    if (!token || !rawEmail) return Response.json({ ok: false }, { status: 400 });

    const email = rawEmail.trim().toLowerCase();
    const tokenHash = sha256(token);

    const record = await prisma.verificationToken.findUnique({
      where: { token: tokenHash },
    });

    if (!record) return Response.json({ ok: false, reason: "invalid" }, { status: 400 });
    if (record.identifier !== email)
      return Response.json({ ok: false, reason: "mismatch" }, { status: 400 });
    if (record.expires.getTime() < Date.now())
      return Response.json({ ok: false, reason: "expired" }, { status: 400 });

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: {
          emailVerified: new Date(),
          status: "active", // register'da pending yaptıysan bunu ekle
        },
      }),
      prisma.verificationToken.delete({
        where: { token: tokenHash },
      }),
    ]);

    return Response.json({ ok: true });
  } catch (e) {
    console.error("VERIFY_ERROR", e);
    return Response.json({ ok: false, reason: "server_error" }, { status: 500 });
  }
}