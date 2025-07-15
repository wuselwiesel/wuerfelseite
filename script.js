const diceData = {
  d2: [
    { name: "Ja", url: "https://cdn.glitch.global/c8aaad5e-0231-4972-83e1-a4a50eee8024/Ja.png?v=1751446863846" },
    { name: "Nein", url: "https://cdn.glitch.global/c8aaad5e-0231-4972-83e1-a4a50eee8024/Nein.png?v=1751446865246" }
  ],
  d6: [
    { num: 1, url: "https://cdn.glitch.global/c8aaad5e-0231-4972-83e1-a4a50eee8024/d6.png?v=1751448970694" },
    { num: 2, url: "https://cdn.glitch.global/c8aaad5e-0231-4972-83e1-a4a50eee8024/d6 (5).png?v=1751448976383" },
    { num: 3, url: "https://cdn.glitch.global/c8aaad5e-0231-4972-83e1-a4a50eee8024/d6 (2).png?v=1751448973199" },
    { num: 4, url: "https://cdn.glitch.global/c8aaad5e-0231-4972-83e1-a4a50eee8024/d6 (3).png?v=1751448973732" },
    { num: 5, url: "https://cdn.glitch.global/c8aaad5e-0231-4972-83e1-a4a50eee8024/d6 (4).png?v=1751448974183" },
    { num: 6, url: "https://cdn.glitch.global/c8aaad5e-0231-4972-83e1-a4a50eee8024/d6 (1).png?v=1751448973952" }
  ],
  d10: [...Array(10)].map((_, i) => ({ num: i + 1, url: `https://cdn.glitch.global/c8aaad5e-0231-4972-83e1-a4a50eee8024/${i + 1}.png?v=1751447027181` })),
  d20: [...Array(20)].map((_, i) => ({ num: i + 1, url: `https://cdn.glitch.global/c8aaad5e-0231-4972-83e1-a4a50eee8024/${i + 1}.png?v=1751444174885` }))
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
const socket = io();
let isConnected = false;

const savedUsername = localStorage.getItem('username');
if (savedUsername) {
  usernameInput.value = savedUsername;
}

usernameInput.addEventListener('input', () => {
  localStorage.setItem('username', usernameInput.value);
  if (isConnected && usernameInput.value.trim()) {
    socket.emit('player-join', usernameInput.value.trim());
  }
});

socket.on('connect', () => {
  isConnected = true;
  const username = usernameInput.value.trim() || 'Unbekannt';
  socket.emit('player-join', username);
});

socket.on('disconnect', () => {
  isConnected = false;
});

socket.on('players-update', updatePlayersList);
socket.on('recent-rolls', (rolls) => {
  history = rolls;
  renderHistory();
});

socket.on('new-roll', (rollInfo) => {
  history.unshift(rollInfo);
  if (history.length > 8) history.pop();
  renderHistory();
  if (rollInfo.socketId !== socket.id) showRollNotification(rollInfo);
});

function rollDice() {
  const diceType = diceTypeSelect.value;
  const diceArray = diceData[diceType];
  const rollIndex = Math.floor(Math.random() * diceArray.length);
  const rolled = diceArray[rollIndex];
  currentResultImg.src = rolled.url;
  currentResultImg.alt = `Würfelergebnis: ${rolled.name || rolled.num}`;

  const attributeValue = Number(attrValueInput.value) || 0;
  const bonusValue = Number(bonusValueInput.value) || 0;
  let diceRollValue = 0;

  if (diceType === 'd2') {
    diceRollValue = rolled.name === "Ja" ? 1 : 0;
  } else {
    diceRollValue = rolled.num || 0;
  }

  const difficultyMap = {
    "Sehr leicht": 10,
    "Leicht": 15,
    "Normal": 20,
    "Schwer": 25,
    "Sehr schwer": 30
  };

  const difficultyValue = difficultyMap[difficultyValueInput.options[difficultyValueInput.selectedIndex].text] || 20;
  const totalValue = attributeValue + bonusValue + diceRollValue;

  if (totalValue >= difficultyValue) {
    checkResultEl.textContent = "Geschafft";
    checkResultEl.style.color = "#267326";
  } else {
    checkResultEl.textContent = "Nicht geschafft";
    checkResultEl.style.color = "#a13b3b";
  }

  const username = usernameInput.value.trim() || 'Unbekannt';
  const success = totalValue >= difficultyValue;

  if (isConnected) {
    socket.emit('dice-roll', { diceType, result: diceRollValue, success });
  } else {
    history.unshift({ diceType, result: diceRollValue, username, timestamp: new Date().toLocaleTimeString(), success });
    if (history.length > 8) history.pop();
    renderHistory();
  }
}

function updatePlayersList(players) {
  const playersListEl = document.getElementById('players-list');
  if (!playersListEl) return;
  playersListEl.innerHTML = '';
  players.forEach(player => {
    const playerEl = document.createElement('span');
    playerEl.textContent = player;
    playerEl.style.cssText = `background:#e9ddff;padding:0.3rem 0.6rem;border-radius:8px;margin:0.2rem;display:inline-block;font-size:0.9rem;color:#6a4e95;`;
    playersListEl.appendChild(playerEl);
  });
}

function renderHistory() {
  historyList.innerHTML = '';
  history.forEach(item => {
    const li = document.createElement('li');
    const username = item.username || 'Unbekannt';
    const status = item.success !== undefined ? (item.success ? 'Geschafft' : 'Nicht geschafft') : '';
    li.innerHTML = `<strong>${username}</strong> - ${item.diceType}: ${item.result}${status ? ` - ${status}` : ''}`;
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

function showRollNotification(rollInfo) {
  const statusText = rollInfo.success ? 'Geschafft' : 'Nicht geschafft';
  const emoji = rollInfo.success ? '✅' : '❌';
  console.log(`🎲 ${rollInfo.username} rolled ${rollInfo.diceType}: ${rollInfo.result} - ${statusText} ${emoji}`);
}

rollBtn.addEventListener('click', rollDice);
renderHistory();
