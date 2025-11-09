import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import User from '../models/User.js';

// ✅ Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset link to user's email
 * @access  Public
 */
export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;

    // Step 1: Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email address' });
    }

    // Step 2: Generate a short-lived reset token (JWT)
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Step 3: Construct password reset link (frontend link)
    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;

    // Step 4: Send password reset email using Resend
    const { error } = await resend.emails.send({
      from: 'AfyaLink Support <onboarding@resend.dev>',
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <p>Hello <strong>${user.firstName}</strong>,</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetURL}" target="_blank">${resetURL}</a>
        <p><b>Note:</b> This link expires in 15 minutes.</p>
        <br/>
        <p>— The AfyaLink Team</p>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return res.status(500).json({ message: 'Error sending password reset email' });
    }

    console.log('📧 Password reset email sent to:', user.email);
    console.log('🔗 Reset link:', resetURL);

    res.status(200).json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error sending password reset email' });
  }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset user password using token
 * @access  Public
 */
export const resetPasswordController = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) return res.status(400).json({ message: 'Token is required' });
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update password
    await user.update({ password: newPassword });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};
