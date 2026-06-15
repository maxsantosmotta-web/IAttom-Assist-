let ResendCtor: (new (apiKey: string) => {
  emails: {
    send: (opts: {
      from: string;
      to: string;
      subject: string;
      html: string;
    }) => Promise<unknown>;
  };
}) | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("resend") as { Resend: typeof ResendCtor };
  ResendCtor = mod.Resend;
} catch {
  // Resend not installed — dev/stub mode
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;

  if (!ResendCtor || !key) {
    // Dev/stub: log code to server console instead of sending
    // eslint-disable-next-line no-console
    console.log(`[EMAIL-STUB] OTP para ${to} → ${code}`);
    return;
  }

  const client = new ResendCtor(key);
  await client.emails.send({
    from: "IAttom Assist <noreply@iattomassist.com.br>",
    to,
    subject: "Código de verificação — IAttom Assist",
    html: `
      <div style="font-family:Inter,sans-serif;background:#0a0a0a;color:#fafafa;padding:32px;border-radius:12px;max-width:420px;margin:0 auto">
        <h2 style="color:#C9A84C;margin-bottom:8px">Confirme seu acesso</h2>
        <p style="color:#a1a1aa;font-size:14px;margin-bottom:24px">Use o código abaixo para confirmar seu cadastro no IAttom Assist.</p>
        <div style="background:#111111;border:1px solid rgba(201,168,76,0.25);border-radius:10px;padding:20px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:900;color:#C9A84C">
          ${code}
        </div>
        <p style="color:#52525b;font-size:12px;margin-top:20px;text-align:center">Válido por 10 minutos. Não compartilhe este código.</p>
      </div>
    `,
  });
}
