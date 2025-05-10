const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateVerificationCode } = require('../utils/generateToken');
const { sendEmail, emailTemplates } = require('../config/email');


exports.register = async (req, res, next) => {
  const { email, password, firstname, lastname } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create new user
    user = new User({
      email,
      password,
      firstname,
      lastname,
      verification_code: generateVerificationCode(),
      verification_expiry: Date.now() + 3600000 
    });

    await user.save();

    // Send verification email
    const verificationEmail = emailTemplates.verification(
        `${user.firstname} ${user.lastname}`,
        user.verification_code
      );
      
      await sendEmail({
        email: user.email,
        subject: verificationEmail.subject,
        html: verificationEmail.html
      });

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (err) {
    next(err);
  }
};


exports.verifyEmail = async (req, res, next) => {
  const { code } = req.body;

  try {
    const user = await User.findOne({
      verification_code: code,
      verification_expiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    user.verified = true;
    user.verification_code = undefined;
    user.verification_expiry = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};


exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Checking if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Checking if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Checking if email is verified
    if (!user.verified) {
      return res.status(400).json({ success: false, message: 'Please verify your email first' });
    }

    // Generating token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (err) {
    next(err);
  }
};


exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password -verification_code -verification_expiry');
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};