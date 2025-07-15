const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 👉 Serve static files from dist/
app.use(express.static(path.join(__dirname, 'dist')));

// Optional: handle fallback to index.html (Single Page App support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 🧠 Data: connected players and recent rolls
let connectedPlayers = new Map();
let recentRolls = [];

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('player-join', (username) => {
    connectedPlayers.set(socket.id, username);
    io.emit('players-update', Array.from(connectedPlayers.values()));
    socket.emit('recent-rolls', recentRolls);
    console.log(`${username} joined the game`);
  });

  socket.on('dice-roll', (rollData) => {
    const username = connectedPlayers.get(socket.id) || 'Unbekannt';
    const rollInfo = {
      username: username,
      diceType: rollData.diceType,
      result: rollData.result,
      success: rollData.success,
      timestamp: new Date().toLocaleTimeString(),
      socketId: socket.id
    };

    recentRolls.unshift(rollInfo);
    if (recentRolls.length > 8) recentRolls.pop();

    io.emit('new-roll', rollInfo);
    console.log(`${username} rolled ${rollData.diceType}: ${rollData.result}`);
  });

  socket.on('disconnect', () => {
    const username = connectedPlayers.get(socket.id);
    connectedPlayers.delete(socket.id);
    io.emit('players-update', Array.from(connectedPlayers.values()));
    console.log(`${username} left the game`);
  });
});

// 🛠️ Timeout-Schutz für Render
server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 130 * 1000;

// 🚀 Server starten
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Multiplayer dice server running on port ${PORT}`);
});
