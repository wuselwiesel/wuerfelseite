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

// ⚠️ Statische Dateien korrekt aus dist laden:
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback für SPA (damit index.html bei Direktaufrufen funktioniert)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Multiplayer-Logik
let connectedPlayers = new Map();
let recentRolls = [];

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('player-join', (username) => {
    connectedPlayers.set(socket.id, username);
    io.emit('players-update', Array.from(connectedPlayers.values()));
    socket.emit('recent-rolls', recentRolls);
  });

  socket.on('dice-roll', (rollData) => {
    const username = connectedPlayers.get(socket.id) || 'Unbekannt';
    const rollInfo = {
      username,
      diceType: rollData.diceType,
      result: rollData.result,
      success: rollData.success,
      timestamp: new Date().toLocaleTimeString(),
      socketId: socket.id
    };
    recentRolls.unshift(rollInfo);
    if (recentRolls.length > 8) recentRolls.pop();
    io.emit('new-roll', rollInfo);
  });

  socket.on('disconnect', () => {
    connectedPlayers.delete(socket.id);
    io.emit('players-update', Array.from(connectedPlayers.values()));
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
