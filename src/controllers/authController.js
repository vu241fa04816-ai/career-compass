'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'career-compass-secret-key-2024';
const JWT_EXPIRES = '7d';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, age } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered. Please login.' });

    const user = new User({ name: name.trim(), email: email.toLowerCase().trim(), password, age: age || undefined });
    await user.save();

    const token = generateToken(user._id);
    return res.status(201).json({ token, userId: user._id, name: user.name, email: user.email });
  } catch (err) { return next(err); }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.password) return res.status(401).json({ error: 'This account uses social login. Please use Google or GitHub.' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = generateToken(user._id);
    return res.json({ token, userId: user._id, name: user.name, email: user.email });
  } catch (err) { return next(err); }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'No account found with this email' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:3000'}?reset=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: `"Career Compass" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '🔑 Reset Your Career Compass Password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;background:#f5f5f5;border-radius:10px">
          <h2 style="color:#1a237e">🧭 Career Compass</h2>
          <h3>Password Reset Request</h3>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>You requested to reset your password. Click the button below:</p>
          <a href="${resetUrl}" style="display:inline-block;background:#1a237e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;font-weight:bold">Reset My Password</a>
          <p style="color:#757575;font-size:12px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        </div>
      `
    });

    return res.json({ message: 'Password reset email sent successfully' });
  } catch (err) {
    console.error('Email error:', err.message);
    return res.status(500).json({ error: 'Failed to send reset email. Please check your email configuration.' });
  }
}

// POST /api/auth/reset-password
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (err) { return next(err); }
}

// GET /api/auth/me
async function getMe(req, res) {
  const user = await User.findById(req.userId).select('-password -resetPasswordToken -resetPasswordExpires');
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ userId: user._id, name: user.name, email: user.email });
}

module.exports = { register, login, forgotPassword, resetPassword, getMe };
