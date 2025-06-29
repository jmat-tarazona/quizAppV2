let questions = [], current = 0, score = 0, timer;
let total = 10;
let timePerQuestion = 60;
let isPaused = false;
let remainingTime = timePerQuestion;
let userAnswers = [];
let currentUser = null;

const auth = document.getElementById("auth-screen");
const leaderboard = document.getElementById("leaderboard-screen");
const home = document.getElementById("home-screen");
const quiz = document.getElementById("quiz-screen");
const result = document.getElementById("result-screen");

const leaderboardList = document.getElementById("leaderboard-list");
const reviewList = document.getElementById("review-list");
const reviewBtn = document.getElementById("review-btn");
const playAgainBtn = document.getElementById("play-again");
const pauseBtn = document.getElementById("pause-btn");
const restartBtn = document.getElementById("restart-btn");
const logoutBtn = document.getElementById("logout-btn");

const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const proceedBtn = document.getElementById("proceed-to-quiz");
const viewLeaderboardBtn = document.getElementById("view-leaderboard-btn");
const backToHomeBtn = document.getElementById("back-to-home-btn");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const emailInput = document.getElementById("email");
const authMsg = document.getElementById("auth-message");

// LOGIN
loginBtn.onclick = () => {
  const username = usernameInput.value;
  const password = passwordInput.value;
  fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.ok ? res.json() : Promise.reject("Login failed"))
    .then(data => {
      currentUser = data.username;
      localStorage.setItem("token", data.token);
      loadLeaderboard();
      switchScreen(leaderboard);
    })
    .catch(err => authMsg.textContent = err);
};

// SIGNUP
signupBtn.onclick = () => {
  const email = emailInput.value;
  const username = usernameInput.value;
  const password = passwordInput.value;
  fetch('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password })
  })
    .then(res => res.ok ? res.json() : Promise.reject("Signup failed"))
    .then(data => {
      currentUser = data.username;
      localStorage.setItem("token", data.token);
      loadLeaderboard();
      switchScreen(leaderboard);
    })
    .catch(err => authMsg.textContent = err);
};

// LOGOUT
logoutBtn.onclick = () => {
  localStorage.removeItem("token");
  currentUser = null;
  switchScreen(auth);
};

// LOAD LEADERBOARD
function loadLeaderboard() {
  fetch('/users/leaderboard')
    .then(res => res.json())
    .then(data => {
      leaderboardList.innerHTML = '';
      data.forEach((entry, i) => {
        const scoreText = entry.score !== undefined && entry.score !== null ? `${entry.score}%` : 'N/A';
        const nameText = entry.username || 'Anonymous';
        const li = document.createElement('li');
        li.textContent = `${i + 1}. ${nameText} - ${scoreText}`;
        leaderboardList.appendChild(li);
      });
    });
}

viewLeaderboardBtn.onclick = () => {
  loadLeaderboard();
  switchScreen(leaderboard);
};

backToHomeBtn.onclick = () => {
  switchScreen(home);
};

proceedBtn.onclick = () => {
  switchScreen(home);
};

// START QUIZ
document.getElementById("start-btn").onclick = () => {
  const questionInput = document.getElementById("question-count");
  total = questionInput && questionInput.value ? parseInt(questionInput.value) : 10;

  const category = document.getElementById("category")?.value || "any";
  const url = category === "any"
    ? `/questions?num=${total}`
    : `/questions?num=${total}&category=${category}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      questions = data;
      current = 0;
      score = 0;
      userAnswers = [];
      isPaused = false;
      pauseBtn.textContent = "Pause";
      switchScreen(quiz);
      showQuestion();
    });
};

// DISPLAY QUESTION
function showQuestion() {
  if (current >= questions.length) return showResult();
  const q = questions[current];
  document.getElementById("question-number").textContent = `Question ${current + 1} of ${total}`;
  document.getElementById("question-text").textContent = q.question;
  const choices = document.getElementById("choices");
  choices.innerHTML = '';
  ['A', 'B', 'C', 'D'].forEach(letter => {
    const btn = document.createElement("button");
    btn.textContent = `${letter}: ${q[letter]}`;
    btn.onclick = () => {
      Array.from(choices.children).forEach(b => b.disabled = true);
      userAnswers.push({ question: q.question, correct: q.answer, picked: letter });
      if (letter === q.answer) score++;
      current++;
      clearInterval(timer);
      setTimeout(showQuestion, 400);
    };
    choices.appendChild(btn);
  });
  startTimer();
}

// TIMER
function startTimer(start = timePerQuestion) {
  let time = start;
  remainingTime = time;
  const display = document.getElementById("timer");
  display.textContent = `Time: ${time}s`;
  timer = setInterval(() => {
    if (!isPaused) {
      time--;
      remainingTime = time;
      display.textContent = `Time: ${time}s`;
      if (time <= 0) {
        clearInterval(timer);
        current++;
        showQuestion();
      }
    }
  }, 1000);
}

// PAUSE
pauseBtn.onclick = () => {
  if (!isPaused) {
    clearInterval(timer);
    pauseBtn.textContent = "Continue";
    isPaused = true;
  } else {
    startTimer(remainingTime);
    pauseBtn.textContent = "Pause";
    isPaused = false;
  }
};

// RESTART
restartBtn.onclick = () => {
  clearInterval(timer);
  current = 0;
  score = 0;
  userAnswers = [];
  isPaused = false;
  pauseBtn.textContent = "Pause";
  switchScreen(home);
};

// SHOW RESULT
function showResult() {
  switchScreen(result);

  const questionInput = document.getElementById("question-count");
  const totalQuestions = questionInput && questionInput.value ? parseInt(questionInput.value) : 10;

  document.getElementById("score-text").textContent = `You scored ${score} out of ${totalQuestions}!`;
  reviewBtn.classList.remove("hidden");
  playAgainBtn.classList.remove("hidden");
  reviewList.classList.add("hidden");

  const token = localStorage.getItem("token");
  if (token) {
    console.log("Sending score to backend:", {
      score: Number(score),
      outOf: Number(totalQuestions)
    });

    fetch('/users/save-score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        score: Number(score),
        outOf: Number(totalQuestions)
      })
    })
    .then(res => {
      if (!res.ok) throw new Error("Score save failed");
      return res.json();
    })
    .then(data => {
      console.log("Score saved:", data);
    })
    .catch(err => {
      console.error("Error saving score:", err);
    });
  }
}


// REVIEW ANSWERS
reviewBtn.onclick = () => {
  reviewList.innerHTML = '';
  userAnswers.forEach((q, i) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <p><strong>Q${i + 1}:</strong> ${q.question}</p>
      <p>Your Answer: <span style="color: ${q.picked === q.correct ? 'lightgreen' : 'red'}">${q.picked}</span></p>
      <p>Correct Answer: <span style="color: lightgreen">${q.correct}</span></p>
      <hr>`;
    reviewList.appendChild(div);
  });
  reviewList.classList.remove("hidden");
  reviewBtn.classList.add("hidden");
};

// PLAY AGAIN
playAgainBtn.onclick = () => {
  reviewList.classList.add("hidden");
  reviewBtn.classList.remove("hidden");
  playAgainBtn.classList.add("hidden");
  switchScreen(home);
};

// SCREEN SWITCHING
function switchScreen(target) {
  [auth, leaderboard, home, quiz, result].forEach(screen => screen.classList.add("hidden"));
  target.classList.remove("hidden");
}

// ON LOAD
window.onload = () => {
  const token = localStorage.getItem("token");
  if (token) {
    currentUser = "Loading...";
    loadLeaderboard();
    switchScreen(leaderboard);
  } else {
    switchScreen(auth);
  }
};
