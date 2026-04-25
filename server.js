const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ---------------- STATIC FILES ----------------
// Wichtig: Root richtig setzen, damit /images etc. funktionieren
app.use(express.static(__dirname));

// ---------------- ROUTING FIX (WICHTIG) ----------------
// KEIN "/*" mehr → das crashte auf Node 22 + Render
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ---------------- MULTIPLAYER ----------------

let connectedPlayers = new Map();
let recentRolls = [];

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // Spieler joinen
  socket.on("player-join", (username) => {
    connectedPlayers.set(socket.id, username || "Unbekannt");

    io.emit("players-update", Array.from(connectedPlayers.values()));

    socket.emit("recent-rolls", recentRolls);
  });

  // Würfeln
  socket.on("dice-roll", (rollData) => {
    const username = connectedPlayers.get(socket.id) || "Unbekannt";

    const rollInfo = {
      username,
      diceType: rollData.diceType,
      result: rollData.result,
      success: rollData.success,
      timestamp: new Date().toLocaleTimeString()
    };

    recentRolls.unshift(rollInfo);
    if (recentRolls.length > 8) recentRolls.pop();

    io.emit("new-roll", rollInfo);
  });

  // Disconnect
  socket.on("disconnect", () => {
    connectedPlayers.delete(socket.id);
    io.emit("players-update", Array.from(connectedPlayers.values()));
  });
});

// ---------------- START SERVER ----------------

const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
