import nodemailer from 'nodemailer';

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

interface SendOtpOptions {
  email: string;
  otp: string;
  type: 'signup' | 'login' | 'forgot_password';
}

export const sendOtpEmail = async ({
  email,
  otp,
  type,
}: SendOtpOptions): Promise<{ success: boolean; devOtp?: string; messageId?: string; error?: string }> => {
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

  const rawHost = process.env.SMTP_HOST;
  const rawUser = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 465;

  const host = rawHost ? rawHost.replace(/^["']|["']$/g, '').trim() : 'smtp.gmail.com';
  const user = rawUser ? rawUser.replace(/^["']|["']$/g, '').trim() : undefined;
  // Clean password: strip quotes and any whitespace (Google App passwords are displayed as "xxxx xxxx xxxx xxxx")
  const pass = rawPass ? rawPass.replace(/["']/g, '').replace(/\s+/g, '') : undefined;

  // Print OTP in server terminal for debugging/monitoring
  console.log('\n======================================================');
  console.log(`📩 OTP Dispatch [${type.toUpperCase()}] for: ${email}`);
  console.log(`🔑 Verification Code: >>> ${otp} <<<`);
  console.log('======================================================\n');

  if (user && pass) {
    try {
      const isGmail = host === 'smtp.gmail.com' || user.includes('@gmail.com');
      const secure = isGmail ? (port !== 587) : (port === 465);

      const transporter = nodemailer.createTransport({
        host: isGmail ? 'smtp.gmail.com' : host,
        port: isGmail ? (port === 587 ? 587 : 465) : port,
        secure,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      const senderEmail =
        process.env.EMAIL_FROM?.replace(/^["']|["']$/g, '').trim() ||
        `"CinePass" <${user}>`;

      const info = await transporter.sendMail({
        from: senderEmail,
        to: email,
        subject,
        html,
      });

      console.log(`✅ Real email successfully delivered to ${email}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error('❌ Failed to send real email via SMTP:', err.message || err);
      return {
        success: false,
        error: `Failed to deliver email to ${email}. Error: ${err.message || 'SMTP delivery failed'}`,
      };
    }
  }

  // If no SMTP configured
  console.warn('⚠️ No SMTP_USER or SMTP_PASS configured in environment variables!');
  
  // Only allow devOtp if explicitly in local development AND NOT in production
  const isDev = process.env.NODE_ENV !== 'production';
  return {
    success: isDev,
    error: 'SMTP credentials (SMTP_USER, SMTP_PASS) are not configured in your deployment environment variables.',
    devOtp: isDev ? otp : undefined,
  };
};
