const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true //Make sure the email address cannot be used for duplicate registration.
  },
  password: { 
    type: String, 
    required: true 
  },
  name: {
    type: String,
    default: 'Admin'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);