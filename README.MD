Quiz App

This is a web-based quiz application built using HTML, CSS, JavaScript, and Express.js.
The app allows users to log in, take a timed multiple-choice quiz, see their score, and appear on a global leaderboard.

Features

User Authentication
Signup and login with email, username, and password
JWT-based session saved in browser for future use

Home Screen

Choose the number of quiz questions (up to 50)
Option to select a category
Start quiz button transitions to the game

Quiz Functionality

Random questions fetched from the server (Open Trivia API)
Multiple choice interface
Timer for each question
Pause and resume quiz without losing progress

Result Screen

Score displayed out of total questions
Review answers shows what the user selected vs correct answer
Option to restart the quiz

Leaderboard

Top 10 scores shown based on percentage
Score saved automatically when user finishes a quiz
N/A shown if user had no score or anonymous entry

How to Run the Server Locally

Make sure you have Node.js installed
Clone this repository or download the project folder

Install dependencies and start the server:
    npm install
    node server.js
run on browser this: http://localhost:3000
