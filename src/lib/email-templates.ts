export function otpEmailHtml(otp: string, purpose: 'signup' | 'reset_password'): string {
  const isSignup = purpose === 'signup';
  const title = isSignup ? 'Verify your email' : 'Reset your password';
  const subtitle = isSignup
    ? 'Use the code below to complete your Alpha Imports account.'
    : 'Use the code below to reset your Alpha Imports password.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:40px 16px;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,52,96,0.10);">
      <tr>
        <td style="background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 60%,#7c3aed 100%);padding:36px 40px 28px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:linear-gradient(135deg,#0f3460,#7c3aed);border-radius:8px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                <span style="color:#fff;font-size:20px;line-height:36px;">◆</span>
              </td>
              <td style="padding-left:12px;">
                <div style="color:rgba(240,235,255,0.92);font-size:17px;font-weight:400;letter-spacing:0.02em;">Alpha Imports</div>
                <div style="color:rgba(159,159,192,0.7);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin-top:1px;">Fine Gemstones</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 40px 32px;">
          <h1 style="margin:0 0 10px;font-size:26px;font-weight:400;color:#1a1a2e;letter-spacing:-0.01em;">${title}</h1>
          <p style="margin:0 0 32px;font-size:14px;color:#8a8898;line-height:1.7;">${subtitle}</p>
          <div style="background:#f5f3ff;border:1px solid #e8e4f8;border-radius:10px;padding:28px;text-align:center;margin-bottom:28px;">
            <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9f9fc0;margin-bottom:14px;">Verification Code</div>
            <div style="font-size:42px;font-weight:700;letter-spacing:0.22em;color:#0f3460;font-variant-numeric:tabular-nums;">${otp}</div>
            <div style="font-size:12px;color:#9f9fc0;margin-top:14px;">Expires in <strong style="color:#7c3aed;">10 minutes</strong></div>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#8a8898;line-height:1.7;">
            If you did not request this code, you can safely ignore this email. Your account remains secure.
          </p>
          <p style="margin:0;font-size:12px;color:#b0aec0;">Do not share this code with anyone.</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9f8ff;padding:20px 40px;border-top:1px solid #e8e4f8;">
          <p style="margin:0;font-size:11px;color:#b0aec0;text-align:center;letter-spacing:0.03em;">
            © ${new Date().getFullYear()} Alpha Imports · Fine Gemstones
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}