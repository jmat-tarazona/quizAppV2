const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));


app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));


app.get('/questions', async (req, res) => {
  const num = parseInt(req.query.num) || 10;
  const category = req.query.category || 'any';

  
  const categoryMap = {
    science: 17,
    history: 23,
    math: 19,
  };

  try {
    const apiUrl = new URL('https://opentdb.com/api.php');
    apiUrl.searchParams.append('amount', num);
    apiUrl.searchParams.append('type', 'multiple');

    if (category !== 'any' && categoryMap[category]) {
      apiUrl.searchParams.append('category', categoryMap[category]);
    }

    const response = await axios.get(apiUrl.toString());
    const raw = response.data.results;

    const formatted = raw.map(q => {
      const allChoices = [...q.incorrect_answers, q.correct_answer];
      const shuffled = allChoices.sort(() => 0.5 - Math.random());

      const labels = ['A', 'B', 'C', 'D'];
      const choiceMap = {};
      shuffled.forEach((val, i) => {
        choiceMap[labels[i]] = decodeHTML(val);
      });

      return {
        question: decodeHTML(q.question),
        ...choiceMap,
        answer: labels[shuffled.indexOf(q.correct_answer)]
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch questions');
  }
});


function decodeHTML(html) {
  return html.replace(/&quot;/g, '"')
             .replace(/&#039;/g, "'")
             .replace(/&amp;/g, "&")
             .replace(/&lt;/g, "<")
             .replace(/&gt;/g, ">");
}


app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
