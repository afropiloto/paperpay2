import { Resend } from "resend";
import { sendWhatsApp } from "@/lib/whatsapp";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return new Resend(key);
}

const FROM = "pay@paperpay.money";

function adminEmailRecipients(): string[] {
  const raw = process.env.ADMIN_EMAIL ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function sendDepositConfirmedEmail(input: {
  to: string;
  name: string;
  amount: string;
  currency: string;
  paymentReference: string;
}) {
  const subject = `Your ${input.currency} ${input.amount} has landed — PaperPay`;
  const text = `Hi ${input.name},

Your deposit of ${input.amount} ${input.currency} has been confirmed.

Reference: ${input.paymentReference}

You can now log in and request a swap to USDT.

paperpay.money`;

  const html = `<p>Hi ${escapeHtml(input.name)},</p>
<p>Your deposit of <strong>${escapeHtml(input.amount)} ${escapeHtml(input.currency)}</strong> has been confirmed.</p>
<p>Reference: <strong>${escapeHtml(input.paymentReference)}</strong></p>
<p>You can now log in and request a swap to USDT.</p>
<p>paperpay.money</p>`;

  await getResend().emails.send({
    from: FROM,
    to: input.to,
    subject,
    text,
    html,
  });

  await sendWhatsApp(
    input.to,
    `PaperPay: deposit confirmed ${input.amount} ${input.currency}. Ref ${input.paymentReference}.`,
  );
}

export async function sendSwapRequestEmail(input: {
  userName: string;
  paymentReference: string;
  amountIn: string;
  currencyIn: string;
  rate: string;
  amountOut: string;
  walletAddress: string;
  rateMode: string;
  paperpayWallet: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const subject = `New swap request — ${input.paymentReference}`;
  const body = `New swap request received.

User: ${input.userName}
Reference: ${input.paymentReference}
Sending: ${input.amountIn} ${input.currencyIn}
Rate: 1 ${input.currencyIn} = ${input.rate} USDT
Receiving: ${input.amountOut} USDT
Destination wallet: ${input.walletAddress}
Rate mode: ${input.rateMode}

Send USDT to PaperPay wallet, then reply with on-chain hash.

PaperPay wallet: ${input.paperpayWallet}

Log in to ClearDesk: ${appUrl}/admin`;

  const html = `<p>New swap request received.</p>
<ul>
<li>User: ${escapeHtml(input.userName)}</li>
<li>Reference: ${escapeHtml(input.paymentReference)}</li>
<li>Sending: ${escapeHtml(input.amountIn)} ${escapeHtml(input.currencyIn)}</li>
<li>Rate: 1 ${escapeHtml(input.currencyIn)} = ${escapeHtml(input.rate)} USDT</li>
<li>Receiving: ${escapeHtml(input.amountOut)} USDT</li>
<li>Destination wallet: ${escapeHtml(input.walletAddress)}</li>
<li>Rate mode: ${escapeHtml(input.rateMode)}</li>
</ul>
<p>Send USDT to PaperPay wallet, then reply with on-chain hash.</p>
<p><strong>PaperPay wallet:</strong> ${escapeHtml(input.paperpayWallet)}</p>
<p>Log in to ClearDesk: <a href="${escapeHtml(appUrl + "/admin")}">${escapeHtml(appUrl + "/admin")}</a></p>`;

  const recipients = [
    ...adminEmailRecipients(),
    process.env.CLEARING_EMAIL,
  ].filter(Boolean) as string[];

  await getResend().emails.send({
    from: FROM,
    to: recipients,
    subject,
    text: body,
    html,
  });

  for (const to of recipients) {
    await sendWhatsApp(to, body);
  }
}

export async function sendUsdtSentEmail(input: {
  to: string;
  name: string;
  amountOut: string;
  walletAddress: string;
  outgoingHash: string;
}) {
  const subject = "Your USDT is on the way — PaperPay";
  const text = `Hi ${input.name},

${input.amountOut} USDT has been sent to your wallet.

Wallet: ${input.walletAddress}
On-chain hash: ${input.outgoingHash}

Allow 5–30 minutes for on-chain confirmation.

paperpay.money`;

  const html = `<p>Hi ${escapeHtml(input.name)},</p>
<p><strong>${escapeHtml(input.amountOut)} USDT</strong> has been sent to your wallet.</p>
<p>Wallet: ${escapeHtml(input.walletAddress)}<br/>
On-chain hash: ${escapeHtml(input.outgoingHash)}</p>
<p>Allow 5–30 minutes for on-chain confirmation.</p>
<p>paperpay.money</p>`;

  await getResend().emails.send({
    from: FROM,
    to: input.to,
    subject,
    text,
    html,
  });

  await sendWhatsApp(
    input.to,
    `PaperPay: ${input.amountOut} USDT sent. Hash ${input.outgoingHash}`,
  );
}

/** Password reset link from Supabase Admin `generateLink` — delivered via Resend (not Supabase SMTP). */
export async function sendPasswordResetViaResend(input: {
  to: string;
  actionLink: string;
}) {
  const subject = "Reset your PaperPay password";
  const text = `Reset your password by opening this link (one-time use; expires soon):

${input.actionLink}

If you did not request this, you can ignore this email.`;
  const html = `<p>Reset your password using the link below (one-time use; expires soon).</p>
<p><a href="${escapeHtml(input.actionLink)}">Set new password</a></p>
<p style="color:#666;font-size:12px">If you did not request this, you can ignore this email.</p>`;

  await getResend().emails.send({
    from: FROM,
    to: input.to,
    subject,
    text,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
