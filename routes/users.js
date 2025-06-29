const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'yoursecret';

// Middleware to check for a valid JWT token
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// GET user quiz history
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user.scores || []);
  } catch (err) {
    console.error("Failed to fetch profile:", err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST save quiz score
router.post('/save-score', auth, async (req, res) => {
  try {
    console.log("Received score from frontend:", req.body);

    const { score, outOf } = req.body;

    if (
      score === undefined || outOf === undefined ||
      isNaN(Number(score)) || isNaN(Number(outOf)) ||
      Number(outOf) <= 0
    ) {
      return res.status(400).json({ error: 'Invalid score or outOf value' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const scoreEntry = {
      score: Number(score),
      outOf: Number(outOf),
      date: new Date()
    };

    user.scores.push(scoreEntry);
    await user.save();

    res.json({ message: 'Score saved', score: scoreEntry });
  } catch (err) {
    console.error("Failed to save score:", err);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

// GET leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const top = await User.aggregate([
      { $unwind: "$scores" },
      {
        $match: {
          "scores.outOf": { $gt: 0 },
          "scores.score": { $ne: null }
        }
      },
      {
        $addFields: {
          percentage: {
            $multiply: [
              { $divide: ["$scores.score", "$scores.outOf"] },
              100
            ]
          }
        }
      },
      { $sort: { username: 1, percentage: -1 } },
      {
        $group: {
          _id: "$username",
          topScore: { $first: "$percentage" }
        }
      },
      {
        $project: {
          username: "$_id",
          score: { $round: ["$topScore", 0] }
        }
      },
      { $sort: { score: -1 } },
      { $limit: 10 }
    ]);

    res.json(top);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
