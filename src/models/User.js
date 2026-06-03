//tanuja
'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const RFC5322_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], minlength: [2, 'Name must be at least 2 characters'], maxlength: [100, 'Name must be at most 100 characters'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, match: [RFC5322_EMAIL_REGEX, 'Email must be a valid RFC 5322 address'] },
    password: { type: String, default: null },
    age: { type: Number, required: false, min: [10, 'Age must be at least 10'], max: [100, 'Age must be at most 100'], validate: { validator: (v) => v === undefined || v === null || Number.isInteger(v), message: 'Age must be an integer' } },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    provider: { type: String, default: 'local' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
