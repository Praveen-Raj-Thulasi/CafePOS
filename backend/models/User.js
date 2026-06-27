const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['Admin', 'Cashier', 'Kitchen', 'Servant'],
    default: 'Cashier'
  },
  status: {
    type: String,
    enum: ['Active', 'OnBreak', 'ClockedIn', 'ClockedOut'],
    default: 'Active'
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
