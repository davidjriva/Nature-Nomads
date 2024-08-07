const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
    trim: true,
    maxlength: [50, "A user's name may only have a maximum of 50 characters"],
    minlength: [1, "A user's name must have a minimum of 1 characters"],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    minlength: [8, 'A password must be at least 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: "The entered passwords don't match",
    },
    required: [true, 'A user must confirm their password on signup'], // Comment out this line when importing dev-data as the users.json data doesn't conform properly
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// Password encryption middleware
userSchema.pre('save', async function (next) {
  // Only run the function if the password field was modified
  if (!this.isModified('password')) return next();

  // Store password as encrypted hash with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete confirmed password [avoid persisting in DB]
  this.passwordConfirm = undefined;
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Query middleware
userSchema.pre(/^find/, function (next) {
  this.find({ active: true });
  next();
});

// Instance method: A method available on all documents that allows us to validate passwords on login
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if user changed their password after the JWT was signed [prevent bad actors from stealing JWT and attacking compromised accounts]
userSchema.methods.changedPasswordAfter = function (JWT_Timestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return JWT_Timestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
