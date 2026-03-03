const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: false },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ['Lost', 'Found'] },
  location: { type: String, required: true },
  date: { type: String, required: true },
  contactInfo: { type: String, required: true },
  submittedBy: { type: String, required: true },
  status: { type: String, default: 'Active', enum: ['Active', 'Resolved'] }
}, { timestamps: true });

module.exports = mongoose.model('Item', itemSchema);