const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  maxHttpBufferSize: 1e7,
});

app.use(express.static("public"));

// --- STORAGE ---
let chatHistory = [];
let videoUsers = new Set();
let leaderboard = {}; // Dictionary to prevent duplicates

io.on("connection", (socket) => {
  // 1. Send History & Data
  chatHistory.forEach((msg) => {
    socket.emit("chat message", msg);
  });
  socket.emit("update video count", videoUsers.size);
  sendLeaderboard(socket);

  // 2. Chat Logic
  socket.on("chat message", (msg) => {
    chatHistory.push(msg);
    io.emit("chat message", msg);
  });

  socket.on("clear chat", () => {
    chatHistory = [];
    io.emit("chat cleared");
  });

  // 3. Video Logic
  socket.on("join video", () => {
    videoUsers.add(socket.id);
    io.emit("update video count", videoUsers.size);
  });

  socket.on("leave video", () => {
    videoUsers.delete(socket.id);
    io.emit("update video count", videoUsers.size);
  });

  socket.on("disconnect", () => {
    if (videoUsers.has(socket.id)) {
      videoUsers.delete(socket.id);
      io.emit("update video count", videoUsers.size);
    }
  });

  // 4. Smart Leaderboard Logic
  socket.on("submit score", (data) => {
    let name = data.name || "Anonymous";
    let score = parseInt(data.score);

    // Only update if the new score is higher
    if (!leaderboard[name] || score > leaderboard[name]) {
      leaderboard[name] = score;
    }

    sendLeaderboard(io);
  });
});

function sendLeaderboard(destination) {
  let sortedList = Object.keys(leaderboard).map((key) => {
    return { name: key, score: leaderboard[key] };
  });
  sortedList.sort((a, b) => b.score - a.score);
  destination.emit("update leaderboard", sortedList.slice(0, 50));
}

// FORCE PORT 3002 TO AVOID ZOMBIE SERVERS
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
