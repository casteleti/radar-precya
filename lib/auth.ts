import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "./prisma";
import { sendMagicLinkEmail } from "./email";

export interface Session {
  user_id: string;
  clinic_id: string;
  email: string;
  name: string | null;
  role: string;
  onboarding_completed: boolean;
  clinic_name: string;
}

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: { clinic: true },
      },
    },
  });

  if (!session || session.expires_at < new Date()) return null;

  return {
    user_id: session.user.id,
    clinic_id: session.user.clinic_id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    onboarding_completed: session.user.onboarding_completed,
    clinic_name: session.user.clinic.name,
  };
}

export async function sendMagicLink(email: string): Promise<void> {
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return; // não revelar se email existe

  // Invalidar tokens anteriores
  await prisma.magicLinkToken.updateMany({
    where: { user_id: user.id, used_at: null },
    data: { used_at: new Date() },
  });

  const token = randomUUID();
  const expires_at = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.magicLinkToken.create({
    data: { user_id: user.id, token, expires_at },
  });

  await sendMagicLinkEmail(email, token, user.name);
}

export async function verifyMagicLink(
  token: string
): Promise<{ sessionToken: string; onboarding_completed: boolean } | null> {
  const record = await prisma.magicLinkToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.used_at || record.expires_at < new Date()) return null;

  await prisma.magicLinkToken.update({
    where: { id: record.id },
    data: { used_at: new Date() },
  });

  const sessionToken = randomUUID();
  await prisma.session.create({
    data: {
      user_id: record.user_id,
      token: sessionToken,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    sessionToken,
    onboarding_completed: record.user.onboarding_completed,
  };
}

export async function logout(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}
