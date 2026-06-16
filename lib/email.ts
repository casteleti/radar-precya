import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendMagicLinkEmail(
  email: string,
  token: string,
  name: string | null
) {
  const link = `${APP_URL}/auth/verify?token=${token}`;
  const firstName = name?.split(" ")[0] || "você";

  await resend.emails.send({
    from: "Radar Precya <noreply@precya.com.br>",
    to: email,
    subject: "🎉 Seu acesso ao Radar Precya está aqui!",
    html: `
      <div style="font-family: 'Poppins', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #fff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2E1A73; font-size: 24px; font-weight: 600; margin: 0;">Radar Precya</h1>
        </div>
        <p style="color: #4A4A6A; font-size: 16px; line-height: 1.6;">
          Olá, ${firstName}! 👋
        </p>
        <p style="color: #4A4A6A; font-size: 16px; line-height: 1.6;">
          Seu acesso ao Radar está pronto. Clique no botão abaixo para entrar:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}"
             style="background: #5E3ECF; color: white; padding: 14px 32px; border-radius: 12px;
                    text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            Acessar meu Radar ✨
          </a>
        </div>
        <p style="color: #9999BB; font-size: 13px; text-align: center;">
          Este link expira em 15 minutos.<br/>
          Se não foi você, ignore este e-mail.
        </p>
      </div>
    `,
  });
}
