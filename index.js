const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Serve files from the 'public' folder
app.use(express.static("public"));

// 1. Memory Storage for Messages
const chatHistory = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  // 2. Send all old messages to the new user immediately
  chatHistory.forEach((msg) => {
    socket.emit("chat message", msg);
  });

  // 3. Listen for new messages
  socket.on("chat message", (msg) => {
    // Save to history
    chatHistory.push(msg);
    // Send to everyone
    io.emit("chat message", msg);
  });
});

// Start the server
server.listen(3000, () => {
  console.log("Server running on port 3000");
});
