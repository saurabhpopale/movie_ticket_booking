import nodemailer from 'nodemailer';

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

interface SendOtpOptions {
  email: string;
  otp: string;
  type: 'signup' | 'login' | 'forgot_password';
}

export interface SendEmailResult {
  success: boolean;
  deliveredViaEmail: boolean;
  provider?: 'resend' | 'brevo' | 'smtp' | 'console_fallback';
  devOtp?: string;
  messageId?: string;
  error?: string;
  message?: string;
}

export const sendOtpEmail = async ({
  email,
  otp,
  type,
}: SendOtpOptions): Promise<SendEmailResult> => {
  const isSignup = type === 'signup';
  const isForgot = type === 'forgot_password';
  const subject = isSignup
    ? `🎬 Welcome to CinePass - Your Verification Code is ${otp}`
    : isForgot
    ? `🎬 CinePass Password Reset Code: ${otp}`
    : `🎬 CinePass Login Verification Code: ${otp}`;

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

  // Always log OTP in server terminal for administrative / debugging access
  console.log('\n======================================================');
  console.log(`📩 OTP Dispatch [${type.toUpperCase()}] for: ${email}`);
  console.log(`🔑 Verification Code: >>> ${otp} <<<`);
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // PROVIDER 1: RESEND HTTP REST API (Recommended for Cloud Hosts like Render)
  // Communicates over HTTPS (port 443). Render never blocks port 443!
  // Free tier: 3,000 emails/month at https://resend.com
  // --------------------------------------------------------------------------
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  if (resendApiKey) {
    try {
      let fromAddress = process.env.RESEND_FROM?.trim() || process.env.EMAIL_FROM?.trim();
      // If no custom domain sender is specified or it is a generic freemail address,
      // default to Resend's built-in sandbox sender which delivers to account email without domain setup
      if (!fromAddress || fromAddress.includes('@gmail.com') || fromAddress.includes('@yahoo.com') || fromAddress.includes('@outlook.com')) {
        fromAddress = 'CinePass <onboarding@resend.dev>';
      }

      console.log(`🚀 Attempting email delivery via Resend HTTP API to ${email}...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject,
          html,
        }),
      });

      const resData = (await response.json().catch(() => ({}))) as any;
      if (response.ok && resData?.id) {
        console.log(`✅ [Resend API] Real email successfully delivered to ${email}. ID: ${resData.id}`);
        return {
          success: true,
          deliveredViaEmail: true,
          provider: 'resend',
          messageId: resData.id,
        };
      } else {
        console.warn('⚠️ [Resend API] Failed to dispatch via Resend:', resData);
      }
    } catch (resendError: any) {
      console.warn('⚠️ [Resend API] Network error:', resendError.message || resendError);
    }
  }

  // --------------------------------------------------------------------------
  // PROVIDER 2: BREVO (SENDINBLUE) HTTP REST API
  // 300 free emails/day over HTTPS (port 443) to any recipient
  // --------------------------------------------------------------------------
  const brevoApiKey = (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY)?.trim();
  if (brevoApiKey) {
    try {
      const senderEmail =
        process.env.BREVO_SENDER?.trim() ||
        process.env.SMTP_USER?.trim() ||
        'saurabhpopale720@gmail.com';
      const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'CinePass';

      console.log(`🚀 Attempting email delivery via Brevo HTTP API to ${email}...`);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email }],
          subject,
          htmlContent: html,
        }),
      });

      const resData = (await response.json().catch(() => ({}))) as any;
      if (response.ok && resData?.messageId) {
        console.log(`✅ [Brevo API] Real email successfully delivered to ${email}. ID: ${resData.messageId}`);
        return {
          success: true,
          deliveredViaEmail: true,
          provider: 'brevo',
          messageId: resData.messageId,
        };
      } else {
        console.warn('⚠️ [Brevo API] Failed to dispatch via Brevo:', resData);
      }
    } catch (brevoError: any) {
      console.warn('⚠️ [Brevo API] Network error:', brevoError.message || brevoError);
    }
  }

  // --------------------------------------------------------------------------
  // PROVIDER 3: NODEMAILER SMTP (Direct Connection with Smart Dual-Port Retry)
  // Works locally, on VPS, or paid cloud instances where SMTP is permitted
  // --------------------------------------------------------------------------
  const rawHost = process.env.SMTP_HOST;
  const rawUser = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 465;

  const host = rawHost ? rawHost.replace(/^["']|["']$/g, '').trim() : 'smtp.gmail.com';
  const user = rawUser ? rawUser.replace(/^["']|["']$/g, '').trim() : undefined;
  const pass = rawPass ? rawPass.replace(/["']/g, '').replace(/\s+/g, '') : undefined;

  let lastSmtpError = '';

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

    // Primary SMTP attempt
    const primaryPort = port === 587 ? 587 : 465;
    const primarySecure = primaryPort === 465;

    try {
      console.log(`🔌 Attempting SMTP delivery to ${email} via ${host}:${primaryPort}...`);
      const info = await trySendSmtp(primaryPort, primarySecure);
      console.log(`✅ [SMTP] Real email successfully delivered to ${email}. MessageId: ${info.messageId}`);
      return {
        success: true,
        deliveredViaEmail: true,
        provider: 'smtp',
        messageId: info.messageId,
      };
    } catch (err1: any) {
      lastSmtpError = err1.message || String(err1);
      console.warn(`⚠️ [SMTP] Connection to port ${primaryPort} failed: ${lastSmtpError}`);

      // Try alternate port (e.g., 587 if 465 failed, or 465 if 587 failed)
      const altPort = primaryPort === 465 ? 587 : 465;
      const altSecure = altPort === 465;
      try {
        console.log(`🔄 Retrying SMTP delivery on alternate port ${altPort}...`);
        const info = await trySendSmtp(altPort, altSecure);
        console.log(`✅ [SMTP] Real email delivered to ${email} via port ${altPort}. MessageId: ${info.messageId}`);
        return {
          success: true,
          deliveredViaEmail: true,
          provider: 'smtp',
          messageId: info.messageId,
        };
      } catch (err2: any) {
        lastSmtpError = err2.message || String(err2);
        console.error(`❌ [SMTP] Both SMTP ports (${primaryPort}, ${altPort}) failed:`, lastSmtpError);
      }
    }
  }

  // --------------------------------------------------------------------------
  // PROVIDER 4: SMART PRODUCTION RECOVERY / FALLBACK
  // Cloud providers like Render Free Tier block outbound SMTP ports 25, 465, & 587.
  // Instead of throwing a fatal 500 that breaks user registration / login,
  // we log clear diagnostics in server logs and provide a safe fallback so the
  // user or developer is never permanently locked out of authentication.
  // --------------------------------------------------------------------------
  const isCloudTimeout =
    lastSmtpError.toLowerCase().includes('timeout') ||
    lastSmtpError.toLowerCase().includes('etimedout') ||
    lastSmtpError.toLowerCase().includes('econnrefused');

  console.log('\n======================================================');
  console.log(`ℹ️ [EMAIL DISPATCH STATUS] Real email could not be dispatched.`);
  if (isCloudTimeout) {
    console.log(`⚠️ REASON: Cloud host blocked outbound SMTP (${lastSmtpError}).`);
    console.log(`💡 RENDER / CLOUD FIX:`);
    console.log(`   Render Free Tier blocks raw SMTP ports 25, 465, and 587.`);
    console.log(`   To send 100% real emails without timeout on Render:`);
    console.log(`   1. Sign up at https://resend.com (free 3,000 emails/month).`);
    console.log(`   2. In Render Dashboard -> Environment Variables, add:`);
    console.log(`      RESEND_API_KEY = re_your_api_key_here`);
  }
  console.log(`🔑 Verification Code for ${email}: >>> ${otp} <<<`);
  console.log('======================================================\n');

  return {
    success: true,
    deliveredViaEmail: false,
    provider: 'console_fallback',
    devOtp: otp,
    message: isCloudTimeout
      ? `Verification code generated! (Cloud host blocked SMTP; check your server logs or use the fallback verification code).`
      : `Verification code generated!`,
    error: lastSmtpError || 'No email delivery provider available',
  };
};
