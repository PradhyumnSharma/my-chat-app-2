const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

// Allow big images (10MB limit)
const io = new Server(server, {
  maxHttpBufferSize: 1e7,
});

app.use(express.static("public"));

// Memory storage
let chatHistory = [];

io.on("connection", (socket) => {
  // 1. Load old messages for new user
  chatHistory.forEach((msg) => {
    socket.emit("chat message", msg);
  });

  // 2. Listen for new messages
  socket.on("chat message", (msg) => {
    chatHistory.push(msg);
    io.emit("chat message", msg);
  });

  // 3. Listen for Clear Chat
  socket.on("clear chat", () => {
    chatHistory = []; // Wipe server memory
    io.emit("chat cleared"); // Tell everyone to wipe screens
  });
});

// Use the port Render gives us, or 3000 locally
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
