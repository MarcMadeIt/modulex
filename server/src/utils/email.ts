import nodemailer from "nodemailer";

// Genbrugelig SMTP-transporter konfigureret fra .env.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // 587 bruger STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Linket til spørgeskemaet bygges fra CLIENT_URL (samme mønster som CORS i server.ts).
export function getSurveyUrl(): string {
  const base = process.env.CLIENT_URL || "http://localhost:5173";
  return `${base}/survey`;
}

/**
 * Sender spørgeskema-mailen ("Kære kunde ... udfyld på link") til én modtager.
 * Kaster hvis afsendelsen fejler, så kalderen kan rapportere det pr. mail.
 */
export async function sendSurveyEmail(to: string): Promise<void> {
  const surveyUrl = getSurveyUrl();
  const fromName = process.env.MAIL_FROM_NAME || "Modulex Billund Academy";
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;

  const text = [
    "Kære kunde,",
    "",
    "Du bedes udfylde vores korte spørgeskema på følgende link:",
    surveyUrl,
    "",
    "Venlig hilsen",
    fromName,
  ].join("\n");

  const html = `
  <div style="margin:0;padding:0;background-color:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td style="background-color:#171717;padding:24px 32px;color:#ffffff;font-size:18px;font-weight:bold;">
                ${fromName}
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1f2937;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;">Kære kunde,</p>
                <p style="margin:0 0 24px;">Du bedes udfylde vores korte spørgeskema, så vi kan tilpasse forløbet til jer.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="border-radius:10px;background-color:#ff4d26;">
                      <a href="${surveyUrl}" target="_blank" style="display:inline-block;padding:14px 28px;color:#ffffff;font-weight:bold;text-decoration:none;font-size:15px;">Åbn spørgeskema →</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Virker knappen ikke? Kopiér linket:</p>
                <p style="margin:0 0 24px;font-size:13px;"><a href="${surveyUrl}" style="color:#ff4d26;">${surveyUrl}</a></p>
                <p style="margin:0;color:#1f2937;">Venlig hilsen<br/>${fromName}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: "Udfyld dit spørgeskema",
    text,
    html,
  });
}
