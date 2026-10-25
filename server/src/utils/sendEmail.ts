import nodemailer from 'nodemailer';

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export interface SendOtpOptions {
  email: string;
  otp: string;
  type: 'signup' | 'login' | 'forgot_password';
}

export interface SendEmailResult {
  success: boolean;
  deliveredViaEmail: boolean;
  provider?: 'resend' | 'brevo' | 'smtp' | 'dev_fallback';
  devOtp?: string;
  messageId?: string;
  error?: string;
  message?: string;
}

/**
 * Parses sender strings like 'CinePass <noreply@example.com>' or 'noreply@example.com'
 */
export const parseSender = (
  raw?: string,
  defaultEmail = 'onboarding@resend.dev',
  defaultName = 'CinePass'
): { name: string; email: string; formatted: string } => {
  if (!raw || !raw.trim()) {
    return { name: defaultName, email: defaultEmail, formatted: `"${defaultName}" <${defaultEmail}>` };
  }
  const trimmed = raw.trim();
  const match = trimmed.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
  if (match && match[2]) {
    const name = (match[1] || defaultName).trim();
    const email = match[2].trim();
    return { name, email, formatted: `"${name}" <${email}>` };
  }
  return { name: defaultName, email: trimmed, formatted: `"${defaultName}" <${trimmed}>` };
};

export const sendOtpEmail = async ({
  email,
  otp,
  type,
}: SendOtpOptions): Promise<SendEmailResult> => {
  const isSignup = type === 'signup';
  const isForgot = type === 'forgot_password';
  const subject = isSignup
    ? `🎬 Welcome to CinePass - Your Verification Code`
    : isForgot
    ? `🎬 CinePass Password Reset Code`
    : `🎬 CinePass Login Verification Code`;

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 12px; border: 1px solid #334155;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #7c3aed; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">CinePass</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Premium Movie Experience & Ticketing</p>
      </div>

      <div style="background-color: #1e293b; padding: 24px; border-radius: 8px; border: 1px solid #475569; text-align: center;">
        <h2 style="color: #f8fafc; font-size: 20px; margin-top: 0;">${
          isSignup
            ? 'Verify Your Email Address'
            : isForgot
            ? 'Password Reset Request'
            : 'Account Login Verification'
        }</h2>
        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">
          ${
            isSignup
              ? 'Thank you for signing up with CinePass! Use the 6-digit OTP below to verify your account.'
              : isForgot
              ? 'You requested to reset your password. Use the 6-digit verification code below to set a new password.'
              : 'Someone requested to log in to your CinePass account. Use the code below to complete authentication.'
          }
        </p>

        <div style="margin: 28px 0; padding: 18px; background-color: #020617; border-radius: 8px; border: 2px dashed #7c3aed; display: inline-block;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #a78bfa; font-family: monospace;">${otp}</span>
        </div>

        <p style="color: #94a3b8; font-size: 13px; margin-bottom: 0;">
          ⏳ This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 12px;">
        <p>If you did not initiate this request, you can safely ignore this email.</p>
        <p>&copy; ${new Date().getFullYear()} CinePass. All rights reserved.</p>
      </div>
    </div>
  `;

  const isProd = process.env.NODE_ENV === 'production';
  const isDev = !isProd;

  // Log dispatch event without exposing the sensitive OTP
  console.log(`[Email Service] Initiating OTP dispatch [${type.toUpperCase()}] for recipient: ${email}`);

  let lastProviderError = '';

  // --------------------------------------------------------------------------
  // PROVIDER 1: RESEND HTTP REST API (HTTPS Port 443)
  // Communicates over port 443 (never blocked by Render).
  // Note: onboarding@resend.dev is a sandbox domain restricted to the account owner.
  // Sending to arbitrary external recipients requires a verified custom domain.
  // --------------------------------------------------------------------------
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    try {
      const parsedSender = parseSender(
        process.env.RESEND_FROM?.trim() || process.env.EMAIL_FROM?.trim(),
        'onboarding@resend.dev',
        'CinePass'
      );

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: parsedSender.formatted,
          to: [email],
          subject,
          html,
        }),
      });

      const resData = (await response.json().catch(() => ({}))) as any;
      if (response.ok && resData?.id) {
        console.log(`[Email Service] Delivered via Resend to ${email} (MessageId: ${resData.id})`);
        return {
          success: true,
          deliveredViaEmail: true,
          provider: 'resend',
          messageId: resData.id,
        };
      } else {
        const errorDetails = resData?.message || resData?.name || `HTTP ${response.status}`;
        console.error(`[Email Service Error] Resend dispatch to ${email} failed: ${errorDetails}`);
        lastProviderError = `Resend: ${errorDetails}`;
      }
    } catch (err: any) {
      console.error(`[Email Service Error] Resend network error for ${email}: ${err.message || err}`);
      lastProviderError = `Resend network error: ${err.message || err}`;
    }
  }

  // --------------------------------------------------------------------------
  // PROVIDER 2: BREVO (SENDINBLUE) OFFICIAL TRANSACTIONAL EMAIL API
  // Communicates over HTTPS Port 443.
  // Allows sending to any arbitrary recipient once the sender email/domain is verified.
  // --------------------------------------------------------------------------
  const brevoApiKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY)?.trim();
  if (brevoApiKey) {
    try {
      const defaultBrevoEmail = process.env.SMTP_USER?.trim() || 'saurabhpopale720@gmail.com';
      const parsedBrevoSender = parseSender(
        process.env.BREVO_SENDER_EMAIL?.trim() ||
          process.env.BREVO_SENDER?.trim() ||
          process.env.EMAIL_FROM?.trim(),
        defaultBrevoEmail,
        process.env.BREVO_SENDER_NAME?.trim() || 'CinePass'
      );

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: parsedBrevoSender.name,
            email: parsedBrevoSender.email,
          },
          to: [{ email }],
          subject,
          htmlContent: html,
        }),
      });

      const resData = (await response.json().catch(() => ({}))) as any;
      if (response.ok && (resData?.messageId || resData?.id)) {
        const id = resData.messageId || resData.id;
        console.log(`[Email Service] Delivered via Brevo to ${email} (MessageId: ${id})`);
        return {
          success: true,
          deliveredViaEmail: true,
          provider: 'brevo',
          messageId: id,
        };
      } else {
        const errorDetails = resData?.message || resData?.code || `HTTP ${response.status}`;
        console.error(`[Email Service Error] Brevo dispatch to ${email} failed: ${errorDetails}`);
        lastProviderError = `Brevo: ${errorDetails}`;
      }
    } catch (err: any) {
      console.error(`[Email Service Error] Brevo network error for ${email}: ${err.message || err}`);
      lastProviderError = `Brevo network error: ${err.message || err}`;
    }
  }

  // --------------------------------------------------------------------------
  // PROVIDER 3: NODEMAILER SMTP (Direct Connection with Smart Dual-Port Retry)
  // Suitable for local development or unblocked hosting environments
  // --------------------------------------------------------------------------
  const rawHost = process.env.SMTP_HOST;
  const rawUser = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 465;

  const host = rawHost ? rawHost.replace(/^["']|["']$/g, '').trim() : 'smtp.gmail.com';
  const user = rawUser ? rawUser.replace(/^["']|["']$/g, '').trim() : undefined;
  const pass = rawPass ? rawPass.replace(/["']/g, '').replace(/\s+/g, '') : undefined;

  if (user && pass) {
    const isGmail = host === 'smtp.gmail.com' || user.includes('@gmail.com');
    const senderEmail =
      process.env.EMAIL_FROM?.replace(/^["']|["']$/g, '').trim() ||
      `"CinePass" <${user}>`;

    const trySendSmtp = async (targetPort: number, secure: boolean) => {
      const transporter = nodemailer.createTransport({
        host: isGmail ? 'smtp.gmail.com' : host,
        port: targetPort,
        secure,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 5000,
      });

      return await transporter.sendMail({
        from: senderEmail,
        to: email,
        subject,
        html,
      });
    };

    const primaryPort = port === 587 ? 587 : 465;
    const primarySecure = primaryPort === 465;

    try {
      const info = await trySendSmtp(primaryPort, primarySecure);
      console.log(`[Email Service] Delivered via SMTP to ${email} (MessageId: ${info.messageId})`);
      return {
        success: true,
        deliveredViaEmail: true,
        provider: 'smtp',
        messageId: info.messageId,
      };
    } catch (smtpErr1: any) {
      console.warn(`[Email Service Warning] SMTP connection on port ${primaryPort} failed: ${smtpErr1.message || smtpErr1}`);
      const altPort = primaryPort === 465 ? 587 : 465;
      const altSecure = altPort === 465;
      try {
        const info = await trySendSmtp(altPort, altSecure);
        console.log(`[Email Service] Delivered via SMTP alternate port ${altPort} to ${email}`);
        return {
          success: true,
          deliveredViaEmail: true,
          provider: 'smtp',
          messageId: info.messageId,
        };
      } catch (smtpErr2: any) {
        console.error(`[Email Service Error] SMTP failed on both ports (${primaryPort}, ${altPort}): ${smtpErr2.message || smtpErr2}`);
        lastProviderError = `SMTP: ${smtpErr2.message || smtpErr2}`;
      }
    }
  }

  // --------------------------------------------------------------------------
  // LOCAL DEVELOPMENT ONLY FALLBACK
  // --------------------------------------------------------------------------
  if (isDev) {
    console.log(`[DEV ONLY] Local development OTP for ${email}: ${otp}`);
    return {
      success: true,
      deliveredViaEmail: false,
      provider: 'dev_fallback',
      devOtp: otp,
      message: 'Verification code generated (local dev mode).',
    };
  }

  // --------------------------------------------------------------------------
  // PRODUCTION: STRICT FAILURE HANDLING (NO OTP LOGGING OR LEAKS)
  // --------------------------------------------------------------------------
  console.error(
    `[Email Service Failure] Could not deliver OTP email to ${email}. Cause: ${
      lastProviderError || 'No email provider configured'
    }`
  );

  return {
    success: false,
    deliveredViaEmail: false,
    devOtp: undefined, // Never leak devOtp in production
    error: 'Unable to deliver verification email. Please check your email address or try again later.',
  };
};
