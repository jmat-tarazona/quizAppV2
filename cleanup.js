const mongoose = require('mongoose');
const User = require('./models/User'); 

mongoose.connect('mongodb://localhost:27017/quizapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

User.updateMany({}, {
  $pull: {
    scores: { outOf: { $exists: false } }
  }
}).then(() => {
  console.log("Cleaned up old scores that were missing 'outOf'");
  return mongoose.disconnect();
}).catch(err => {
  console.error("Cleanup failed:", err);
});
