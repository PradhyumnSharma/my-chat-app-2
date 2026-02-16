const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  maxHttpBufferSize: 1e7, // 10MB limit for images/videos
});

app.use(express.static("public"));

// --- MEMORY STORAGE ---
let chatHistory = [];
let videoUsers = new Set(); // Tracks who is in the video call

io.on("connection", (socket) => {
  // 1. Send History & Video Count to new user
  chatHistory.forEach((msg) => {
    socket.emit("chat message", msg);
  });
  socket.emit("update video count", videoUsers.size);

  // 2. Handle Chat Messages
  socket.on("chat message", (msg) => {
    chatHistory.push(msg);
    io.emit("chat message", msg);
  });

  // 3. Handle Clear Chat
  socket.on("clear chat", () => {
    chatHistory = [];
    io.emit("chat cleared");
  });

  // 4. Handle Video Join/Leave
  socket.on("join video", () => {
    videoUsers.add(socket.id);
    io.emit("update video count", videoUsers.size);
  });

  socket.on("leave video", () => {
    videoUsers.delete(socket.id);
    io.emit("update video count", videoUsers.size);
  });

  // 5. Handle Disconnect (Tab Close)
  socket.on("disconnect", () => {
    if (videoUsers.has(socket.id)) {
      videoUsers.delete(socket.id);
      io.emit("update video count", videoUsers.size);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
