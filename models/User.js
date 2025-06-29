const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  scores: [
    {
      score: { type: Number, required: true },
      outOf: { type: Number, required: true },
      date: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model('User', userSchema);
