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
let leaderboard = {}; // DICTIONARY (Prevents Duplicates)

io.on("connection", (socket) => {
  // 1. Send Data
  chatHistory.forEach((msg) => {
    socket.emit("chat message", msg);
  });
  socket.emit("update video count", videoUsers.size);
  sendLeaderboard(socket);

  // 2. Chat
  socket.on("chat message", (msg) => {
    chatHistory.push(msg);
    io.emit("chat message", msg);
  });

  socket.on("clear chat", () => {
    chatHistory = [];
    io.emit("chat cleared");
  });

  // 3. Video
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

  // 4. SMART LEADERBOARD
  socket.on("submit score", (data) => {
    let name = data.name || "Anonymous";
    let score = parseInt(data.score);

    // Only update if NEW score is HIGHER
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

// BACK TO PORT 3000 (Standard)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
