
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

// Serve static files
app.use(express.static('.'));

// Store connected players and recent rolls
let connectedPlayers = new Map();
let recentRolls = [];

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Handle player joining with username
  socket.on('player-join', (username) => {
    connectedPlayers.set(socket.id, username);
    
    // Send current players list to all clients
    io.emit('players-update', Array.from(connectedPlayers.values()));
    
    // Send recent rolls to the new player
    socket.emit('recent-rolls', recentRolls);
    
    console.log(`${username} joined the game`);
  });

  // Handle dice roll
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

    // Add to recent rolls (keep last 8)
    recentRolls.unshift(rollInfo);
    if (recentRolls.length > 8) recentRolls.pop();

    // Broadcast roll to all connected players
    io.emit('new-roll', rollInfo);
    
    console.log(`${username} rolled ${rollData.diceType}: ${rollData.result}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const username = connectedPlayers.get(socket.id);
    connectedPlayers.delete(socket.id);
    
    // Update players list for all clients
    io.emit('players-update', Array.from(connectedPlayers.values()));
    
    console.log(`${username} left the game`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Multiplayer dice server running on port ${PORT}`);
});
