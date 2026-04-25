const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export type PasswordResetEmail = {
  subject: string;
  text: string;
  html: string;
};

export const buildPasswordResetEmail = (
  resetLink: string,
  expiresInMinutes: number,
): PasswordResetEmail => {
  const safeLink = escapeHtml(resetLink);
  const subject = "Reset your Lakira password";
  const text = [
    "Hi,",
    "",
    "We received a request to reset your Lakira password.",
    `Open the link below within ${expiresInMinutes} minutes to choose a new password:`,
    "",
    resetLink,
    "",
    "If you didn't request a password reset, you can ignore this email — your password will stay the same.",
    "",
    "— The Lakira team",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.5;">
    <p>Hi,</p>
    <p>We received a request to reset your Lakira password.</p>
    <p>Click the button below within <strong>${expiresInMinutes} minutes</strong> to choose a new password:</p>
    <p>
      <a href="${safeLink}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#ffffff;border-radius:6px;text-decoration:none;">Reset password</a>
    </p>
    <p>If the button doesn't work, copy this link into your browser:</p>
    <p><a href="${safeLink}">${safeLink}</a></p>
    <p>If you didn't request a password reset, you can ignore this email — your password will stay the same.</p>
    <p>— The Lakira team</p>
  </body>
</html>`;

  return { subject, text, html };
};
