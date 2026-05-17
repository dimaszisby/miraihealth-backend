const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export type OrganizationInviteEmail = {
  subject: string;
  text: string;
  html: string;
};

export const buildOrganizationInviteEmail = (
  inviteLink: string,
  organizationName: string,
  expiresInDays: number,
): OrganizationInviteEmail => {
  const safeLink = escapeHtml(inviteLink);
  const safeName = escapeHtml(organizationName);
  const subject = `You've been invited to join ${organizationName} on Lakira`;
  const text = [
    "Hi,",
    "",
    `You've been invited to join the organization "${organizationName}" on Lakira.`,
    `Click the link below within ${expiresInDays} days to accept the invitation:`,
    "",
    inviteLink,
    "",
    "If you don't have a Lakira account yet, please register first and then use the link above.",
    "",
    "If you weren't expecting this invitation, you can safely ignore this email.",
    "",
    "— The Lakira team",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.5;">
    <p>Hi,</p>
    <p>You've been invited to join the organization <strong>${safeName}</strong> on Lakira.</p>
    <p>Click the button below within <strong>${expiresInDays} days</strong> to accept the invitation:</p>
    <p>
      <a href="${safeLink}" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#ffffff;border-radius:6px;text-decoration:none;">Accept invitation</a>
    </p>
    <p>If the button doesn't work, copy this link into your browser:</p>
    <p><a href="${safeLink}">${safeLink}</a></p>
    <p>If you don't have a Lakira account yet, please register first and then use the link above.</p>
    <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
    <p>— The Lakira team</p>
  </body>
</html>`;

  return { subject, text, html };
};
