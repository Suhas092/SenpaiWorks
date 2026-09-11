const { Resend } = require('resend');
const nodemailer = require('nodemailer');

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY || '';
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const AUTH_FROM = process.env.RESEND_AUTH_FROM || 'SenpaiWorks <auth@senpaiworks.com>';
const DELIVERY_FROM = process.env.RESEND_DELIVERY_FROM || 'SenpaiWorks <deliveries@senpaiworks.com>';

const LOGO_ICON_URL = 'https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/senpaiworks_logo.png';
const LOGO_TEXT_URL = 'https://pub-fcaa22b002b74b8a93604c85b4342984.r2.dev/brand/name_logo_no_bg.png';

let smtpTransporter = null;

async function getSmtpFallbackTransporter() {
  if (smtpTransporter) return smtpTransporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      smtpTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (e) {
      smtpTransporter = nodemailer.createTransport({ jsonTransport: true });
    }
  }

  return smtpTransporter;
}

/**
 * Universal email dispatcher (Resend -> SMTP Fallback)
 */
async function sendEmail({ from, to, subject, html }) {
  if (!to || !html) return { success: false, error: 'Missing recipient or HTML content' };

  // 1. Try Resend First
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: from || AUTH_FROM,
        to: [to],
        subject: subject,
        html: html
      });

      if (response && response.error) {
        console.warn('[Mailer Resend Warning]', response.error);
      } else if (response && response.data) {
        console.log(`[Mailer] Email delivered via Resend to ${to} (ID: ${response.data.id})`);
        return { success: true, provider: 'resend', id: response.data.id };
      }
    } catch (resendErr) {
      console.warn('[Mailer] Resend send error, attempting SMTP fallback:', resendErr.message);
    }
  }

  // 2. Fallback to Nodemailer / SMTP
  try {
    const transport = await getSmtpFallbackTransporter();
    const info = await transport.sendMail({
      from: from || AUTH_FROM,
      to: to,
      subject: subject,
      html: html
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Mailer] Email delivered via SMTP to ${to} (MessageId: ${info.messageId})`);
    if (previewUrl) console.log(`[Mailer] Preview: ${previewUrl}`);
    return { success: true, provider: 'smtp', messageId: info.messageId, previewUrl };
  } catch (smtpErr) {
    console.error('[Mailer] All delivery methods failed:', smtpErr.message);
    return { success: false, error: smtpErr.message };
  }
}

/**
 * Clean Light Theme: Send 6-Digit Email Verification Code on Signup
 */
async function sendSignupOtpEmail(email, username, otpCode) {
  const greetingName = username ? ` ${username}` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your SenpaiWorks Account</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding:40px 15px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
              
              <!-- Clean Light Header with Black-Background Logo Badge -->
              <tr>
                <td style="padding:28px 32px 20px 32px; background:#ffffff; border-bottom:1px solid #f1f5f9; text-align:left;">
                  <table border="0" cellspacing="0" cellpadding="0" style="background:#000000; border-radius:8px; padding:6px 14px; margin:0;">
                    <tr>
                      <td style="vertical-align:middle; padding-right:8px;">
                        <img src="${LOGO_ICON_URL}" alt="Logo" height="26" style="height:26px; width:auto; display:block; border:0;">
                      </td>
                      <td style="vertical-align:middle;">
                        <img src="${LOGO_TEXT_URL}" alt="SenpaiWorks" height="18" style="height:18px; width:auto; display:block; border:0;">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content Body (Light Theme) -->
              <tr>
                <td style="padding:32px;">
                  <h1 style="margin:0 0 16px 0; font-size:20px; font-weight:700; color:#0f172a;">Verify your email address</h1>
                  
                  <p style="margin:0 0 18px 0; font-size:15px; line-height:1.6; color:#334155;">
                    Hello${greetingName},
                  </p>
                  
                  <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#334155;">
                    Thank you for signing up for SenpaiWorks. Please enter the verification code below to confirm your email and complete your registration:
                  </p>

                  <!-- Minimal OTP Box -->
                  <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; padding:18px; text-align:center; margin-bottom:24px;">
                    <div style="font-size:32px; font-weight:700; letter-spacing:8px; color:#0f172a; font-family:'Courier New', Courier, monospace;">
                      ${otpCode}
                    </div>
                  </div>

                  <p style="margin:0 0 16px 0; font-size:13px; line-height:1.5; color:#64748b;">
                    This code will expire in 10 minutes. If you did not create an account, please ignore this message.
                  </p>
                </td>
              </tr>

              <!-- Clean Footer -->
              <tr>
                <td style="padding:20px 32px; background:#f8fafc; border-top:1px solid #f1f5f9; text-align:center; font-size:12px; color:#64748b;">
                  &copy; 2025 SenpaiWorks. All rights reserved.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    from: AUTH_FROM,
    to: email,
    subject: `Your SenpaiWorks Verification Code: ${otpCode}`,
    html: html
  });
}

/**
 * Clean Light Theme: Send 6-Digit Password Reset Code
 */
async function sendPasswordResetOtpEmail(email, username, otpCode) {
  const greetingName = username ? ` ${username}` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding:40px 15px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
              
              <!-- Clean Light Header with Black-Background Logo Badge -->
              <tr>
                <td style="padding:28px 32px 20px 32px; background:#ffffff; border-bottom:1px solid #f1f5f9; text-align:left;">
                  <table border="0" cellspacing="0" cellpadding="0" style="background:#000000; border-radius:8px; padding:6px 14px; margin:0;">
                    <tr>
                      <td style="vertical-align:middle; padding-right:8px;">
                        <img src="${LOGO_ICON_URL}" alt="Logo" height="26" style="height:26px; width:auto; display:block; border:0;">
                      </td>
                      <td style="vertical-align:middle;">
                        <img src="${LOGO_TEXT_URL}" alt="SenpaiWorks" height="18" style="height:18px; width:auto; display:block; border:0;">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content Body (Light Theme) -->
              <tr>
                <td style="padding:32px;">
                  <h1 style="margin:0 0 16px 0; font-size:20px; font-weight:700; color:#0f172a;">Password Reset Request</h1>
                  
                  <p style="margin:0 0 18px 0; font-size:15px; line-height:1.6; color:#334155;">
                    Hello${greetingName},
                  </p>
                  
                  <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#334155;">
                    We received a request to reset the password for your SenpaiWorks account. Please enter the code below to set a new password:
                  </p>

                  <!-- Minimal Reset OTP Box -->
                  <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:8px; padding:18px; text-align:center; margin-bottom:24px;">
                    <div style="font-size:32px; font-weight:700; letter-spacing:8px; color:#0f172a; font-family:'Courier New', Courier, monospace;">
                      ${otpCode}
                    </div>
                  </div>

                  <p style="margin:0 0 16px 0; font-size:13px; line-height:1.5; color:#64748b;">
                    This code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.
                  </p>
                </td>
              </tr>

              <!-- Clean Footer -->
              <tr>
                <td style="padding:20px 32px; background:#f8fafc; border-top:1px solid #f1f5f9; text-align:center; font-size:12px; color:#64748b;">
                  &copy; 2025 SenpaiWorks. All rights reserved.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    from: AUTH_FROM,
    to: email,
    subject: `Reset Your SenpaiWorks Password: ${otpCode}`,
    html: html
  });
}

/**
 * Clean Light Theme: Send Digital Asset Download Links Email
 */
async function sendDigitalOrderDownloadEmail(order, digitalItems) {
  if (!order || !order.email || !digitalItems || digitalItems.length === 0) {
    return { success: false, reason: 'No recipient or digital items' };
  }

  const greetingName = (order.guestName && order.guestName.trim()) ? ` ${order.guestName.trim()}` : '';
  const orderNumber = order.orderNumber || `ORD-${order.id}`;

  const itemRowsHtml = digitalItems.map((item) => {
    const itemName = item.productName || item.name || 'Digital Asset';
    const downloadUrl = (item.product && item.product.downloadUrl) || item.downloadUrl;
    const variantTxt = item.variant ? ` <span style="color:#64748b; font-size:13px;">(${item.variant})</span>` : '';

    let actionButtonHtml = '';
    if (downloadUrl && downloadUrl.trim().length > 0) {
      actionButtonHtml = `
        <div style="margin-top:12px;">
          <a href="${downloadUrl}" target="_blank" style="display:inline-block; background:#0f172a; color:#ffffff; font-weight:600; font-size:13px; text-decoration:none; padding:10px 18px; border-radius:6px;">
            Download File
          </a>
          <div style="margin-top:8px; font-size:12px; color:#64748b; word-break:break-all;">
            Direct Link: <a href="${downloadUrl}" style="color:#0284c7; text-decoration:underline;">${downloadUrl}</a>
          </div>
        </div>
      `;
    } else {
      actionButtonHtml = `
        <div style="margin-top:10px; background:#fef3c7; border:1px solid #fde68a; color:#92400e; padding:10px 14px; border-radius:6px; font-size:13px; line-height:1.4;">
          Your asset file is being prepared. If it does not appear within a few minutes, please reach out to <a href="mailto:deliveries@senpaiworks.com" style="color:#92400e; text-decoration:underline;">deliveries@senpaiworks.com</a>.
        </div>
      `;
    }

    return `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:18px; margin-bottom:16px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <div style="font-size:15px; font-weight:600; color:#0f172a;">${itemName}${variantTxt}</div>
            </td>
            <td align="right" style="font-size:14px; font-weight:600; color:#0f172a;">
              ₹${(item.price || 0).toLocaleString('en-IN')}
            </td>
          </tr>
        </table>
        ${actionButtonHtml}
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Digital Order</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding:40px 15px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
              
              <!-- Clean Light Header with Black-Background Logo Badge -->
              <tr>
                <td style="padding:28px 32px 20px 32px; background:#ffffff; border-bottom:1px solid #f1f5f9; text-align:left;">
                  <table border="0" cellspacing="0" cellpadding="0" style="background:#000000; border-radius:8px; padding:6px 14px; margin:0;">
                    <tr>
                      <td style="vertical-align:middle; padding-right:8px;">
                        <img src="${LOGO_ICON_URL}" alt="Logo" height="26" style="height:26px; width:auto; display:block; border:0;">
                      </td>
                      <td style="vertical-align:middle;">
                        <img src="${LOGO_TEXT_URL}" alt="SenpaiWorks" height="18" style="height:18px; width:auto; display:block; border:0;">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content Body (Light Theme) -->
              <tr>
                <td style="padding:32px;">
                  <h1 style="margin:0 0 16px 0; font-size:20px; font-weight:700; color:#0f172a;">Your digital order is ready</h1>
                  
                  <p style="margin:0 0 18px 0; font-size:15px; line-height:1.6; color:#334155;">
                    Hello${greetingName},
                  </p>
                  
                  <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#334155;">
                    Thank you for your order! Your digital order <strong>#${orderNumber}</strong> has been processed and your download links are ready below:
                  </p>

                  <!-- Digital Items List -->
                  ${itemRowsHtml}

                  <p style="margin:20px 0 0 0; font-size:13px; line-height:1.5; color:#64748b;">
                    Note: Your download links are also saved in your SenpaiWorks account under Order History.
                  </p>
                </td>
              </tr>

              <!-- Clean Footer -->
              <tr>
                <td style="padding:20px 32px; background:#f8fafc; border-top:1px solid #f1f5f9; text-align:center; font-size:12px; color:#64748b;">
                  &copy; 2025 SenpaiWorks. All rights reserved.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const firstTitle = (digitalItems[0].productName || digitalItems[0].name || 'Digital Asset').trim();
  const emailSubject = digitalItems.length > 1 
    ? `Your downloads are ready: ${firstTitle} (+${digitalItems.length - 1} more)`
    : `Your download is ready: ${firstTitle}`;

  return sendEmail({
    from: DELIVERY_FROM,
    to: order.email,
    subject: emailSubject,
    html: html
  });
}

/**
 * Clean Light Theme: Send Security Alert when Password is Changed Successfully
 */
async function sendPasswordChangedConfirmationEmail(email, username) {
  const greetingName = username ? ` ${username}` : '';
  const nowFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your SenpaiWorks password has been changed</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding:40px 15px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:520px; background:#ffffff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
              
              <!-- Clean Light Header with Black-Background Logo Badge -->
              <tr>
                <td style="padding:28px 32px 20px 32px; background:#ffffff; border-bottom:1px solid #f1f5f9; text-align:left;">
                  <table border="0" cellspacing="0" cellpadding="0" style="background:#000000; border-radius:8px; padding:6px 14px; margin:0;">
                    <tr>
                      <td style="vertical-align:middle; padding-right:8px;">
                        <img src="${LOGO_ICON_URL}" alt="Logo" height="26" style="height:26px; width:auto; display:block; border:0;">
                      </td>
                      <td style="vertical-align:middle;">
                        <img src="${LOGO_TEXT_URL}" alt="SenpaiWorks" height="18" style="height:18px; width:auto; display:block; border:0;">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content Body (Light Theme) -->
              <tr>
                <td style="padding:32px;">
                  <h1 style="margin:0 0 16px 0; font-size:20px; font-weight:700; color:#0f172a;">Password Changed Successfully</h1>
                  
                  <p style="margin:0 0 18px 0; font-size:15px; line-height:1.6; color:#334155;">
                    Hello${greetingName},
                  </p>
                  
                  <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6; color:#334155;">
                    This is a confirmation that the password for your SenpaiWorks account was changed on <strong>${nowFormatted}</strong>.
                  </p>

                  <div style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:20px;">
                    <div style="font-size:14px; font-weight:600; color:#0f172a; margin-bottom:4px;">Didn't make this change?</div>
                    <div style="font-size:13px; color:#64748b; line-height:1.5;">
                      If you did not make this change, please reset your password immediately or contact our support team at <a href="mailto:auth@senpaiworks.com" style="color:#0284c7; text-decoration:underline;">auth@senpaiworks.com</a>.
                    </div>
                  </div>

                  <p style="margin:0; font-size:13px; line-height:1.5; color:#64748b;">
                    If you authorized this change, you can safely ignore this email.
                  </p>
                </td>
              </tr>

              <!-- Clean Footer -->
              <tr>
                <td style="padding:20px 32px; background:#f8fafc; border-top:1px solid #f1f5f9; text-align:center; font-size:12px; color:#64748b;">
                  &copy; 2025 SenpaiWorks. All rights reserved.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    from: AUTH_FROM,
    to: email,
    subject: 'Your SenpaiWorks password has been changed',
    html: html
  });
}

/**
 * 5. Send Email Change Verification OTP Email
 */
async function sendEmailChangeOtpEmail(newEmail, nameOrUsername, otp) {
  const greetingName = nameOrUsername ? ` ${nameOrUsername}` : '';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify New Email Address</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc; width:100%; height:100%; margin:0; padding:32px 16px;">
        <tr>
          <td align="center" style="padding:0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:540px; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.04);">
              
              <!-- Clean Brand Header Badge -->
              <tr>
                <td style="padding:28px 32px 24px 32px; border-bottom:1px solid #f1f5f9; text-align:left;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="display:inline-table; background:#000000; border-radius:9999px; padding:6px 16px 6px 8px;">
                    <tr>
                      <td style="vertical-align:middle; padding-right:8px;">
                        <img src="${LOGO_ICON_URL}" alt="Logo" width="24" height="24" style="width:24px; height:24px; display:block; border-radius:50%;">
                      </td>
                      <td style="vertical-align:middle;">
                        <img src="${LOGO_TEXT_URL}" alt="SenpaiWorks" height="18" style="height:18px; width:auto; display:block; border:0;">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content Body (Light Theme) -->
              <tr>
                <td style="padding:32px;">
                  <h1 style="margin:0 0 16px 0; font-size:20px; font-weight:700; color:#0f172a;">Verify your new email address</h1>
                  
                  <p style="margin:0 0 18px 0; font-size:15px; line-height:1.6; color:#334155;">
                    Hello${greetingName},
                  </p>
                  
                  <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#334155;">
                    We received a request to update the email address for your SenpaiWorks account to <strong>${newEmail}</strong>. Please enter the verification code below to authorize this change:
                  </p>

                  <!-- 6-Digit Code Box -->
                  <div style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:8px; padding:20px; text-align:center; margin-bottom:24px;">
                    <div style="font-size:32px; font-weight:700; letter-spacing:6px; color:#0f172a; font-family:'SF Pro Display', -apple-system, monospace;">
                      ${otp}
                    </div>
                    <div style="font-size:13px; color:#64748b; margin-top:8px;">
                      Expires in 10 minutes
                    </div>
                  </div>

                  <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:20px;">
                    <div style="font-size:14px; font-weight:600; color:#0f172a; margin-bottom:4px;">Didn't request this change?</div>
                    <div style="font-size:13px; color:#64748b; line-height:1.5;">
                      If you did not make this request, please log in to your account and change your password immediately.
                    </div>
                  </div>

                  <p style="margin:0; font-size:13px; line-height:1.5; color:#64748b;">
                    Never share your verification code with anyone. SenpaiWorks staff will never ask for your code.
                  </p>
                </td>
              </tr>

              <!-- Clean Footer -->
              <tr>
                <td style="padding:20px 32px; background:#f8fafc; border-top:1px solid #f1f5f9; text-align:center; font-size:12px; color:#64748b;">
                  &copy; 2025 SenpaiWorks. All rights reserved.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    from: AUTH_FROM,
    to: newEmail,
    subject: `${otp} is your SenpaiWorks email verification code`,
    html: html
  });
}

/**
 * 6. Send Order Confirmation Email (Physical & Mixed Orders)
 */
async function sendOrderConfirmationEmail(order, trackingUrl) {
  if (!order || !order.email) {
    return { success: false, reason: 'No recipient email on order' };
  }

  let parsedAddress = null;
  try {
    parsedAddress = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress;
  } catch (e) {}

  const customerName = order.guestName || (parsedAddress ? `${parsedAddress.firstName || ''} ${parsedAddress.lastName || ''}`.trim() : null) || 'Valued Customer';
  const orderNumber = order.orderNumber || `ORD-${order.id}`;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const items = order.items || [];
  const itemsHtml = items.map(item => {
    const pName = item.productName || item.name || (item.product && item.product.name) || 'SenpaiWorks Product';
    const variantTxt = item.variant ? ` &bull; <span style="color:#64748b;">${item.variant}</span>` : '';
    const qty = item.quantity || 1;
    const price = item.price || 0;
    return `
      <tr>
        <td style="padding:12px 0; border-bottom:1px solid #f1f5f9; vertical-align:top;">
          <div style="font-size:14px; font-weight:600; color:#0f172a;">${pName}</div>
          <div style="font-size:12px; color:#64748b; margin-top:2px;">Qty: ${qty}${variantTxt}</div>
        </td>
        <td align="right" style="padding:12px 0; border-bottom:1px solid #f1f5f9; vertical-align:top; font-size:14px; font-weight:600; color:#0f172a;">
          ₹${(price * qty).toLocaleString('en-IN')}.00
        </td>
      </tr>
    `;
  }).join('');

  let addressBlockHtml = '';
  if (parsedAddress && (parsedAddress.address || parsedAddress.city)) {
    const lines = [
      parsedAddress.address || parsedAddress.street || parsedAddress.flat || '',
      parsedAddress.apartment ? `Apt/Suite: ${parsedAddress.apartment}` : '',
      [parsedAddress.city, parsedAddress.state, parsedAddress.pincode].filter(Boolean).join(', '),
      parsedAddress.country || 'India',
      parsedAddress.phone ? `Phone: ${parsedAddress.phone}` : ''
    ].filter(Boolean);

    addressBlockHtml = `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin:20px 0 24px 0;">
        <div style="font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:6px;">
          Shipping Address
        </div>
        <div style="font-size:14px; font-weight:700; color:#0f172a; margin-bottom:2px;">${customerName}</div>
        <div style="font-size:13px; color:#475569; line-height:1.5;">${lines.join('<br>')}</div>
      </div>
    `;
  }

  const paymentMethodText = (order.paymentGateway === 'cod' || (order.paymentId && order.paymentId.startsWith('COD')))
    ? 'Cash on Delivery (Pending)'
    : 'Online Payment (Confirmed)';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation #${orderNumber}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc; padding:36px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:540px; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
              
              <!-- Clean Brand Header Badge -->
              <tr>
                <td style="padding:26px 32px 20px 32px; border-bottom:1px solid #f1f5f9; text-align:left;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="display:inline-table; background:#000000; border-radius:8px; padding:6px 14px;">
                    <tr>
                      <td style="vertical-align:middle; padding-right:8px;">
                        <img src="${LOGO_ICON_URL}" alt="Logo" height="24" style="height:24px; width:auto; display:block; border:0;">
                      </td>
                      <td style="vertical-align:middle;">
                        <img src="${LOGO_TEXT_URL}" alt="SenpaiWorks" height="16" style="height:16px; width:auto; display:block; border:0;">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content Body -->
              <tr>
                <td style="padding:32px;">
                  <div style="display:inline-block; background:#dcfce7; color:#166534; font-size:12px; font-weight:800; padding:4px 10px; border-radius:20px; margin-bottom:12px;">
                    &#10003; Order Confirmed
                  </div>

                  <h1 style="margin:0 0 10px 0; font-size:22px; font-weight:800; color:#0f172a;">
                    Thanks for your order, ${customerName}!
                  </h1>
                  
                  <p style="margin:0 0 20px 0; font-size:14px; line-height:1.6; color:#475569;">
                    We're getting your order ready. You can track your order status live anytime using the button below:
                  </p>

                  <!-- Direct Tracking Action Button -->
                  <div style="margin-bottom:28px;">
                    <a href="${trackingUrl || '#'}" target="_blank" style="display:inline-block; background:#0f172a; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; padding:12px 24px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
                      Track Your Order &rarr;
                    </a>
                  </div>

                  <!-- Order Summary Meta Grid -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:22px;">
                    <tr>
                      <td style="font-size:12px; color:#64748b; font-weight:600; padding-bottom:4px;">Order Number</td>
                      <td align="right" style="font-size:12px; color:#64748b; font-weight:600; padding-bottom:4px;">Order Date</td>
                    </tr>
                    <tr>
                      <td style="font-size:14px; font-weight:800; color:#0f172a; font-family:monospace;">#${orderNumber}</td>
                      <td align="right" style="font-size:13px; font-weight:700; color:#0f172a;">${orderDate}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding-top:10px; font-size:12px; color:#64748b;">
                        Payment: <strong style="color:#0f172a;">${paymentMethodText}</strong>
                      </td>
                    </tr>
                  </table>

                  <!-- Items Table -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:16px;">
                    <thead>
                      <tr>
                        <th align="left" style="font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; padding-bottom:8px; border-bottom:2px solid #e2e8f0;">Item</th>
                        <th align="right" style="font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; padding-bottom:8px; border-bottom:2px solid #e2e8f0;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <!-- Totals Breakdown -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:10px;">
                    <tr>
                      <td style="font-size:13px; color:#64748b; padding:4px 0;">Subtotal</td>
                      <td align="right" style="font-size:13px; color:#0f172a; font-weight:600; padding:4px 0;">₹${(order.subtotal || 0).toLocaleString('en-IN')}.00</td>
                    </tr>
                    <tr>
                      <td style="font-size:13px; color:#64748b; padding:4px 0;">Shipping</td>
                      <td align="right" style="font-size:13px; color:#0f172a; font-weight:600; padding:4px 0;">${order.shipping > 0 ? `₹${Number(order.shipping).toLocaleString('en-IN')}.00` : 'Free'}</td>
                    </tr>
                    ${order.discount > 0 ? `
                    <tr>
                      <td style="font-size:13px; color:#16a34a; padding:4px 0;">Discount</td>
                      <td align="right" style="font-size:13px; color:#16a34a; font-weight:600; padding:4px 0;">-₹${Number(order.discount).toLocaleString('en-IN')}.00</td>
                    </tr>` : ''}
                    <tr>
                      <td style="font-size:15px; font-weight:800; color:#0f172a; padding:10px 0 0 0; border-top:1px solid #e2e8f0;">Total</td>
                      <td align="right" style="font-size:16px; font-weight:800; color:#0f172a; padding:10px 0 0 0; border-top:1px solid #e2e8f0;">₹${(order.total || 0).toLocaleString('en-IN')}.00</td>
                    </tr>
                  </table>

                  ${addressBlockHtml}

                  <p style="margin:20px 0 0 0; font-size:12px; line-height:1.5; color:#64748b;">
                    If you have questions about your order, please contact our support team at <a href="mailto:deliveries@senpaiworks.com" style="color:#0284c7; text-decoration:underline;">deliveries@senpaiworks.com</a>.
                  </p>
                </td>
              </tr>

              <!-- Clean Footer -->
              <tr>
                <td style="padding:18px 32px; background:#f8fafc; border-top:1px solid #f1f5f9; text-align:center; font-size:12px; color:#64748b;">
                  &copy; 2025 SenpaiWorks. All rights reserved.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail({
    from: DELIVERY_FROM,
    to: order.email,
    subject: `Order Confirmed: #${orderNumber} - SenpaiWorks`,
    html: html
  });
}

module.exports = {
  sendSignupOtpEmail,
  sendPasswordResetOtpEmail,
  sendPasswordChangedConfirmationEmail,
  sendDigitalOrderDownloadEmail,
  sendEmailChangeOtpEmail,
  sendOrderConfirmationEmail
};
