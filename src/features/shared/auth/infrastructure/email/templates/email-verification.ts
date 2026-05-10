const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export type EmailVerificationEmail = {
  subject: string;
  text: string;
  html: string;
};

export const buildEmailVerificationEmail = (
  verifyLink: string,
  expiresInHours: number,
): EmailVerificationEmail => {
  const safeLink = escapeHtml(verifyLink);
  const subject = "Verify your Lakira email address";
  const text = [
    "Hi,",
    "",
    "Thanks for signing up for Lakira!",
    `Please verify your email address by opening the link below within ${expiresInHours} hours:`,
    "",
    verifyLink,
    "",
    "If you didn't create a Lakira account, you can ignore this email.",
    "",
    "— The Lakira team",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.5;">
    <p>Hi,</p>
    <p>Thanks for signing up for Lakira!</p>
    <p>Click the button below within <strong>${expiresInHours} hours</strong> to verify your email address:</p>
    <p>
      <a href="${safeLink}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#ffffff;border-radius:6px;text-decoration:none;">Verify email</a>
    </p>
    <p>If the button doesn't work, copy this link into your browser:</p>
    <p><a href="${safeLink}">${safeLink}</a></p>
    <p>If you didn't create a Lakira account, you can ignore this email.</p>
    <p>— The Lakira team</p>
  </body>
</html>`;

  return { subject, text, html };
};
