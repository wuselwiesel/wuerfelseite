const diceData = {
 d2: [
  {name: "Ja", url: "/images/d2_1.png"},
  {name: "Nein", url: "/images/d2_2.png"}
],
  d6: [
  {num: 1, url: "/images/d6_1.png"},
  {num: 2, url: "/images/d6_2.png"},
  {num: 3, url: "/images/d6_3.png"},
  {num: 4, url: "/images/d6_4.png"},
  {num: 5, url: "/images/d6_5.png"},
  {num: 6, url: "/images/d6_6.png"}
],
  d10: [
  {num: 1, url: "/images/d10_1.png"},
  {num: 2, url: "/images/d10_2.png"},
  {num: 3, url: "/images/d10_3.png"},
  {num: 4, url: "/images/d10_4.png"},
  {num: 5, url: "/images/d10_5.png"},
  {num: 6, url: "/images/d10_6.png"},
  {num: 7, url: "/images/d10_7.png"},
  {num: 8, url: "/images/d10_8.png"},
  {num: 9, url: "/images/d10_9.png"},
  {num: 10, url: "/images/d10_10.png"}
],
d20: [
  {num: 1, url: "/images/d20_1.png"},
  {num: 2, url: "/images/d20_2.png"},
  {num: 3, url: "/images/d20_3.png"},
  {num: 4, url: "/images/d20_4.png"},
  {num: 5, url: "/images/d20_5.png"},
  {num: 6, url: "/images/d20_6.png"},
  {num: 7, url: "/images/d20_7.png"},
  {num: 8, url: "/images/d20_8.png"},
  {num: 9, url: "/images/d20_9.png"},
  {num: 10, url: "/images/d20_10.png"},
  {num: 11, url: "/images/d20_11.png"},
  {num: 12, url: "/images/d20_12.png"},
  {num: 13, url: "/images/d20_13.png"},
  {num: 14, url: "/images/d20_14.png"},
  {num: 15, url: "/images/d20_15.png"},
  {num: 16, url: "/images/d20_16.png"},
  {num: 17, url: "/images/d20_17.png"},
  {num: 18, url: "/images/d20_18.png"},
  {num: 19, url: "/images/d20_19.png"},
  {num: 20, url: "/images/d20_20.png"}
],
};

const usernameInput = document.getElementById('username');
const diceTypeSelect = document.getElementById('dice-type');
const rollBtn = document.getElementById('roll');
const currentResultImg = document.getElementById('current-result');
const checkResultEl = document.getElementById('check-result');
const historyList = document.getElementById('history');
const attrValueInput = document.getElementById('attribute-value');
const bonusValueInput = document.getElementById('bonus-value');
const difficultyValueInput = document.getElementById('difficulty-value');

let history = [];

// Initialize Socket.IO connection
const socket = io();
let isConnected = false;

// Load saved username
const savedUsername = localStorage.getItem('username');
if (savedUsername) {
  usernameInput.value = savedUsername;
}

// Save username when it changes and notify server
usernameInput.addEventListener('input', () => {
  localStorage.setItem('username', usernameInput.value);
  if (isConnected && usernameInput.value.trim()) {
    socket.emit('player-join', usernameInput.value.trim());
  }
});

// Socket event listeners
socket.on('connect', () => {
  isConnected = true;
  console.log('Connected to multiplayer server');
  
  // Join with current username
  const username = usernameInput.value.trim() || 'Unbekannt';
  socket.emit('player-join', username);
});

socket.on('disconnect', () => {
  isConnected = false;
  console.log('Disconnected from server');
});

socket.on('players-update', (players) => {
  updatePlayersList(players);
});

socket.on('recent-rolls', (rolls) => {
  history = rolls;
  renderHistory();
});

socket.on('new-roll', (rollInfo) => {
  // Add new roll to history
  history.unshift(rollInfo);
  if (history.length > 8) history.pop();
  renderHistory();
  
  // Show notification for other players' rolls
  if (rollInfo.socketId !== socket.id) {
    showRollNotification(rollInfo);
  }
});

function saveHistory() {
  localStorage.setItem('diceHistory', JSON.stringify(history));
}

function renderHistory() {
  historyList.innerHTML = '';
  history.forEach(item => {
    const li = document.createElement('li');
    const username = item.username || 'Unbekannt';
    const status = item.success !== undefined ? (item.success ? 'Geschafft' : 'Nicht geschafft') : '';
    const statusDisplay = status ?  - ${status} : '';
    li.innerHTML = <strong>${username}</strong> - ${item.diceType}: ${item.result}${statusDisplay};
    
    // Add color coding for success/failure
    if (item.success === true) {
      li.style.background = '#d4edda';
      li.style.color = '#267326';
    } else if (item.success === false) {
      li.style.background = '#f8d7da';
      li.style.color = '#a13b3b';
    }
    
    historyList.appendChild(li);
  });
}

function rollDice() {
  const diceType = diceTypeSelect.value;
  const diceArray = diceData[diceType];

  // Roll: Random Index from dice array
  const rollIndex = Math.floor(Math.random() * diceArray.length);
  const rolled = diceArray[rollIndex];

  currentResultImg.src = rolled.url;
  currentResultImg.alt = Würfelergebnis: ${rolled.name || rolled.num};

  // Berechnung: Attribut + Bonus + Würfelergebnis (als Zahl)
  const attributeValue = Number(attrValueInput.value) || 0;
  const bonusValue = Number(bonusValueInput.value) || 0;
  let diceRollValue = 0;

  if(diceType === 'd2') {
    // d2 ist Ja/Nein, wir nehmen für Erfolg 'Ja' als 1, 'Nein' als 0
    diceRollValue = rolled.name === "Ja" ? 1 : 0;
  } else {
    diceRollValue = rolled.num || 0;
  }

  const difficultyValue = Number(difficultyValueInput.value) || 0;
  const totalValue = attributeValue + bonusValue + diceRollValue;

  if(totalValue >= difficultyValue) {
    checkResultEl.textContent = "Geschafft";
    checkResultEl.style.color = "#267326"; // dunkles grün
  } else {
    checkResultEl.textContent = "Nicht geschafft";
    checkResultEl.style.color = "#a13b3b"; // dunkles rot
  }

  // Get username for history
  const username = usernameInput.value.trim() || 'Unbekannt';
  
  // Determine success status for history
  const success = totalValue >= difficultyValue;
  
  // Send roll to server for multiplayer sync
  if (isConnected) {
    socket.emit('dice-roll', {
      diceType: diceType,
      result: diceRollValue,
      success: success
    });
  } else {
    // Fallback to local storage if not connected
    history.unshift({ 
      diceType, 
      result: diceRollValue, 
      username: username,
      timestamp: new Date().toLocaleTimeString(),
      success: success
    });
    if(history.length > 8) history.pop();
    renderHistory();
  }
}

// Helper functions for multiplayer
function updatePlayersList(players) {
  const playersListEl = document.getElementById('players-list');
  if (!playersListEl) return;
  
  playersListEl.innerHTML = '';
  players.forEach(player => {
    const playerEl = document.createElement('span');
    playerEl.textContent = player;
    playerEl.style.cssText = 
      background: #e9ddff; 
      padding: 0.3rem 0.6rem; 
      border-radius: 8px; 
      margin: 0.2rem; 
      display: inline-block;
      font-size: 0.9rem;
      color: #6a4e95;
    ;
    playersListEl.appendChild(playerEl);
  });
}

function showRollNotification(rollInfo) {
  const statusText = rollInfo.success ? 'Geschafft' : 'Nicht geschafft';
  const emoji = rollInfo.success ? '✅' : '❌';
  
  // You could add a toast notification here
  console.log(🎲 ${rollInfo.username} rolled ${rollInfo.diceType}: ${rollInfo.result} - ${statusText} ${emoji});
}

rollBtn.addEventListener('click', rollDice);

renderHistory();
