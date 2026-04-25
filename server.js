const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static files (index.html, script.js, images, etc.)
app.use(express.static(__dirname));

// SPA fallback
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ---------------- SOCKET ----------------

let connectedPlayers = new Map();
let recentRolls = [];

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("player-join", (username) => {
    connectedPlayers.set(socket.id, username || "Unbekannt");
    io.emit("players-update", Array.from(connectedPlayers.values()));
    socket.emit("recent-rolls", recentRolls);
  });

  socket.on("dice-roll", (data) => {
    const username = connectedPlayers.get(socket.id) || "Unbekannt";

    const rollInfo = {
      username,
      diceType: data.diceType,
      result: data.result,
      success: data.success,
      timestamp: new Date().toLocaleTimeString()
    };

    recentRolls.unshift(rollInfo);
    if (recentRolls.length > 8) recentRolls.pop();

    io.emit("new-roll", rollInfo);
  });

  socket.on("disconnect", () => {
    connectedPlayers.delete(socket.id);
    io.emit("players-update", Array.from(connectedPlayers.values()));
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log("Server läuft auf Port", PORT);
});
