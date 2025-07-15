const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// 💡 WICHTIG: Statische Dateien aus dist/ ausliefern (nach npm run build)
app.use(express.static(path.join(__dirname, 'dist')));

// 💡 Alle anderen GET-Routen leiten zurück auf index.html (für SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 💬 Spielerdaten und Würfe verwalten
let connectedPlayers = new Map();
let recentRolls = [];

io.on('connection', (socket) => {
  console.log('🔌 Player connected:', socket.id);

  socket.on('player-join', (username) => {
    connectedPlayers.set(socket.id, username);
    io.emit('players-update', Array.from(connectedPlayers.values()));
    socket.emit('recent-rolls', recentRolls);
    console.log(`✅ ${username} joined the game`);
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
    console.log(`🎲 ${username} rolled ${rollData.diceType}: ${rollData.result}`);
  });

  socket.on('disconnect', () => {
    const username = connectedPlayers.get(socket.id);
    connectedPlayers.delete(socket.id);
    io.emit('players-update', Array.from(connectedPlayers.values()));
    console.log(`❌ ${username} left the game`);
  });
});

// 🛡️ Render-Timeout-Fix (gegen 502 nach Sleep)
server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 130 * 1000;

// 🚀 Server starten (Port aus Umgebungsvariable von Render)
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Multiplayer dice server running on port ${PORT}`);
});
