import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { generateOtp, sendOtpEmail } from '../utils/sendEmail.js';
import { protect, AuthRequest, JWT_SECRET } from '../middleware/auth.js';

const router = Router();
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'admin123';

// Helper to determine if an email belongs to an administrator
export const isAdminEmail = (email: string): boolean => {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  const smtpUser = (process.env.SMTP_USER || '').toLowerCase().trim();
  return (
    (!!smtpUser && normalized === smtpUser) ||
    normalized.includes('admin') ||
    normalized === 'admin@cinepass.com' ||
    normalized === 'priya.admin@cinepass.com' ||
    normalized === 'arjun.admin@cinepass.com' ||
    normalized === 'saurabhpopale720@gmail.com'
  );
};

// 1. INITIATE REGISTRATION
router.post('/register-initiate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = 'user', adminSecretKey } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isExplicitAdmin = role === 'admin' || isAdminEmail(normalizedEmail);

    // Check if role is admin and verify key
    if (role === 'admin' || (isExplicitAdmin && adminSecretKey)) {
      if (adminSecretKey && adminSecretKey !== ADMIN_SECRET) {
        res.status(400).json({
          message: 'Invalid Admin Secret Key. Please provide the valid admin passphrase (default: admin123).',
        });
        return;
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isVerified) {
      // If user is already verified but wants to upgrade to admin with valid passkey or recognized admin email
      if (isExplicitAdmin && (adminSecretKey === ADMIN_SECRET || isAdminEmail(normalizedEmail))) {
        console.log(`👑 Allowing verified user ${normalizedEmail} to upgrade to Admin via OTP verification`);
      } else {
        res.status(400).json({ message: 'An account with this email already exists. Please log in.' });
        return;
      }
    }

    // Generate 6-digit OTP
    const otp = generateOtp();

    // Clean up any old signup OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail, type: 'signup' });

    // Store in Otp collection
    await Otp.create({
      email: normalizedEmail,
      otp,
      type: 'signup',
      userData: {
        name: name.trim(),
        password, // Pre-save hook in User model will hash it upon creation
        role: isExplicitAdmin ? 'admin' : 'user',
      },
    });

    const emailResult = await sendOtpEmail({
      email: normalizedEmail,
      otp,
      type: 'signup',
    });

    if (!emailResult.success) {
      res.status(500).json({
        message: emailResult.error || `Failed to send verification email to ${normalizedEmail}.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: emailResult.deliveredViaEmail
        ? `Verification code sent to ${normalizedEmail}`
        : (emailResult.message || `Verification code sent to ${normalizedEmail}`),
      email: normalizedEmail,
      role: isExplicitAdmin ? 'admin' : 'user',
      devOtp: emailResult.devOtp,
    });
  } catch (error: any) {
    console.error('Error in register-initiate:', error);
    res.status(500).json({ message: error.message || 'Server error initiating registration' });
  }
});

// 2. VERIFY REGISTRATION OTP
router.post('/register-verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: 'Email and OTP are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpDoc = await Otp.findOne({
      email: normalizedEmail,
      type: 'signup',
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      res.status(400).json({ message: 'OTP expired or not found. Please request a new one.' });
      return;
    }

    if (otpDoc.otp !== otp.trim()) {
      res.status(400).json({ message: 'Invalid verification code. Please check and try again.' });
      return;
    }

    if (!otpDoc.userData) {
      res.status(400).json({ message: 'Registration data missing. Please register again.' });
      return;
    }

    const shouldBeAdmin = otpDoc.userData.role === 'admin' || isAdminEmail(normalizedEmail);

    // Check if user was already created unverified or create new
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      user.name = otpDoc.userData.name || user.name;
      user.password = otpDoc.userData.password || user.password;
      user.role = shouldBeAdmin ? 'admin' : (otpDoc.userData.role || user.role);
      user.isVerified = true;
      await user.save();
    } else {
      user = await User.create({
        name: otpDoc.userData.name,
        email: normalizedEmail,
        password: otpDoc.userData.password,
        role: shouldBeAdmin ? 'admin' : (otpDoc.userData.role || 'user'),
        isVerified: true,
      });
    }

    // Clear used OTP
    await Otp.deleteMany({ email: normalizedEmail, type: 'signup' });

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      success: true,
      message: 'Account verified and registered successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error in register-verify:', error);
    res.status(500).json({ message: error.message || 'Server error verifying registration' });
  }
});

// 3. INITIATE LOGIN (Credentials Check + OTP Dispatch)
router.post('/login-initiate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, adminSecretKey } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check user exists with password
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      res.status(400).json({ message: 'Invalid email or password' });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid email or password' });
      return;
    }

    // Auto-promote or maintain admin if this is an admin email or valid admin key provided
    const isRecognizedAdmin = isAdminEmail(normalizedEmail) || (adminSecretKey && adminSecretKey === ADMIN_SECRET);
    if (isRecognizedAdmin && user.role !== 'admin') {
      console.log(`👑 Promoting ${user.email} to Admin on login based on admin credentials/email`);
      user.role = 'admin';
      await user.save();
    }

    // Generate OTP
    const otp = generateOtp();

    // Clean up older login OTPs
    await Otp.deleteMany({ email: normalizedEmail, type: 'login' });

    // Store in Otp collection
    await Otp.create({
      email: normalizedEmail,
      otp,
      type: 'login',
      userId: user._id,
    });

    const emailResult = await sendOtpEmail({
      email: normalizedEmail,
      otp,
      type: 'login',
    });

    if (!emailResult.success) {
      res.status(500).json({
        message: emailResult.error || `Failed to send security OTP to ${normalizedEmail}.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: emailResult.deliveredViaEmail
        ? `Security OTP sent to ${normalizedEmail}`
        : (emailResult.message || `Security OTP sent to ${normalizedEmail}`),
      email: normalizedEmail,
      role: user.role,
      devOtp: emailResult.devOtp,
    });
  } catch (error: any) {
    console.error('Error in login-initiate:', error);
    res.status(500).json({ message: error.message || 'Server error initiating login' });
  }
});

// 4. VERIFY LOGIN OTP
router.post('/login-verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: 'Email and OTP are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpDoc = await Otp.findOne({
      email: normalizedEmail,
      type: 'login',
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      res.status(400).json({ message: 'OTP expired or not found. Please log in again.' });
      return;
    }

    if (otpDoc.otp !== otp.trim()) {
      res.status(400).json({ message: 'Invalid verification code. Please check and try again.' });
      return;
    }

    const user = await User.findById(otpDoc.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Ensure recognized admin emails always hold admin privileges
    if (isAdminEmail(normalizedEmail) && user.role !== 'admin') {
      console.log(`👑 Ensuring ${user.email} maintains Admin privileges on login-verify`);
      user.role = 'admin';
      await user.save();
    }

    // Clear used OTP
    await Otp.deleteMany({ email: normalizedEmail, type: 'login' });

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error in login-verify:', error);
    res.status(500).json({ message: error.message || 'Server error verifying login' });
  }
});

// 5. RESEND OTP
router.post('/resend-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, type } = req.body;

    if (!email || !type || !['signup', 'login', 'forgot_password'].includes(type)) {
      res.status(400).json({ message: 'Valid email and type (signup/login/forgot_password) required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingOtp = await Otp.findOne({ email: normalizedEmail, type }).sort({ createdAt: -1 });

    if (!existingOtp) {
      res.status(400).json({ message: 'No active session found. Please start over.' });
      return;
    }

    const newOtp = generateOtp();
    existingOtp.otp = newOtp;
    existingOtp.createdAt = new Date();
    await existingOtp.save();

    const emailResult = await sendOtpEmail({
      email: normalizedEmail,
      otp: newOtp,
      type,
    });

    if (!emailResult.success) {
      res.status(500).json({
        message: emailResult.error || `Failed to resend verification code to ${normalizedEmail}.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: emailResult.deliveredViaEmail
        ? `A fresh OTP has been sent to ${normalizedEmail}`
        : (emailResult.message || `A fresh OTP has been sent to ${normalizedEmail}`),
      devOtp: emailResult.devOtp,
    });
  } catch (error: any) {
    console.error('Error in resend-otp:', error);
    res.status(500).json({ message: error.message || 'Server error resending OTP' });
  }
});

// 6. FORGOT PASSWORD - INITIATE (Verify email exists & send OTP)
router.post('/forgot-password-initiate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email address is required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({ message: 'No registered account found with this email address' });
      return;
    }

    // Generate 6-digit OTP
    const otp = generateOtp();

    // Clean up older forgot_password OTPs
    await Otp.deleteMany({ email: normalizedEmail, type: 'forgot_password' });

    // Store in Otp collection
    await Otp.create({
      email: normalizedEmail,
      otp,
      type: 'forgot_password',
      userId: user._id,
    });

    const emailResult = await sendOtpEmail({
      email: normalizedEmail,
      otp,
      type: 'forgot_password',
    });

    if (!emailResult.success) {
      res.status(500).json({
        message: emailResult.error || `Failed to send password reset code to ${normalizedEmail}.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: emailResult.deliveredViaEmail
        ? `Password reset OTP has been sent to ${normalizedEmail}`
        : (emailResult.message || `Password reset OTP has been sent to ${normalizedEmail}`),
      email: normalizedEmail,
      devOtp: emailResult.devOtp,
    });
  } catch (error: any) {
    console.error('Error in forgot-password-initiate:', error);
    res.status(500).json({ message: error.message || 'Server error initiating password reset' });
  }
});

// 7. RESET PASSWORD - VERIFY OTP & UPDATE PASSWORD
router.post('/reset-password-verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ message: 'Email, OTP verification code, and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters long' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpDoc = await Otp.findOne({
      email: normalizedEmail,
      type: 'forgot_password',
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      res.status(400).json({ message: 'Reset code expired or not found. Please request a new one.' });
      return;
    }

    if (otpDoc.otp !== otp.trim()) {
      res.status(400).json({ message: 'Invalid verification code. Please check and try again.' });
      return;
    }

    const user = (await User.findById(otpDoc.userId)) || (await User.findOne({ email: normalizedEmail }));
    if (!user) {
      res.status(404).json({ message: 'User account not found' });
      return;
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    // Clean up used OTP
    await Otp.deleteMany({ email: normalizedEmail, type: 'forgot_password' });

    res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. Please log in with your new password.',
    });
  } catch (error: any) {
    console.error('Error in reset-password-verify:', error);
    res.status(500).json({ message: error.message || 'Server error resetting password' });
  }
});

// 6. GET CURRENT LOGGED IN USER
router.get('/me', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    user: {
      id: req.user?._id,
      name: req.user?.name,
      email: req.user?.email,
      role: req.user?.role,
    },
  });
});

export default router;
