const diceData = {
  d2: [
    { name: "Ja", url: "/images/d2_ja.png" },
    { name: "Nein", url: "/images/d2_nein.png" }
  ],
  d6: [
    { num: 1, url: "/images/d6_1.png" },
    { num: 2, url: "/images/d6_2.png" },
    { num: 3, url: "/images/d6_3.png" },
    { num: 4, url: "/images/d6_4.png" },
    { num: 5, url: "/images/d6_5.png" },
    { num: 6, url: "/images/d6_6.png" }
  ],
  d10: [
    { num: 1, url: "/images/d10_1.png" },
    { num: 2, url: "/images/d10_2.png" },
    { num: 3, url: "/images/d10_3.png" },
    { num: 4, url: "/images/d10_4.png" },
    { num: 5, url: "/images/d10_5.png" },
    { num: 6, url: "/images/d10_6.png" },
    { num: 7, url: "/images/d10_7.png" },
    { num: 8, url: "/images/d10_8.png" },
    { num: 9, url: "/images/d10_9.png" },
    { num: 10, url: "/images/d10_10.png" }
  ],
  d20: [
    { num: 1, url: "/images/d20_1.png" },
    { num: 2, url: "/images/d20_2.png" },
    { num: 3, url: "/images/d20_3.png" },
    { num: 4, url: "/images/d20_4.png" },
    { num: 5, url: "/images/d20_5.png" },
    { num: 6, url: "/images/d20_6.png" },
    { num: 7, url: "/images/d20_7.png" },
    { num: 8, url: "/images/d20_8.png" },
    { num: 9, url: "/images/d20_9.png" },
    { num: 10, url: "/images/d20_10.png" },
    { num: 11, url: "/images/d20_11.png" },
    { num: 12, url: "/images/d20_12.png" },
    { num: 13, url: "/images/d20_13.png" },
    { num: 14, url: "/images/d20_14.png" },
    { num: 15, url: "/images/d20_15.png" },
    { num: 16, url: "/images/d20_16.png" },
    { num: 17, url: "/images/d20_17.png" },
    { num: 18, url: "/images/d20_18.png" },
    { num: 19, url: "/images/d20_19.png" },
    { num: 20, url: "/images/d20_20.png" }
  ]
};

const usernameInput = document.getElementById("username");
const diceTypeSelect = document.getElementById("dice-type");
const rollBtn = document.getElementById("roll");
const currentResultImg = document.getElementById("current-result");
const checkResultEl = document.getElementById("check-result");
const historyList = document.getElementById("history");
const attrValueInput = document.getElementById("attribute-value");
const bonusValueInput = document.getElementById("bonus-value");
const difficultyValueInput = document.getElementById("difficulty-value");

let history = [];

// SOCKET
const socket = io();
let isConnected = false;

// Username laden
const savedUsername = localStorage.getItem("username");
if (savedUsername) usernameInput.value = savedUsername;

// Username speichern
usernameInput.addEventListener("input", () => {
  localStorage.setItem("username", usernameInput.value);

  if (isConnected && usernameInput.value.trim()) {
    socket.emit("player-join", usernameInput.value.trim());
  }
});

// SOCKET EVENTS
socket.on("connect", () => {
  isConnected = true;
  console.log("Connected");

  socket.emit("player-join", usernameInput.value.trim() || "Unbekannt");
});

socket.on("disconnect", () => {
  isConnected = false;
});

socket.on("players-update", updatePlayersList);

socket.on("recent-rolls", (rolls) => {
  history = rolls;
  renderHistory();
});

socket.on("new-roll", (rollInfo) => {
  history.unshift(rollInfo);
  if (history.length > 8) history.pop();
  renderHistory();

  if (rollInfo.socketId !== socket.id) {
    showRollNotification(rollInfo);
  }
});

// HISTORY
function renderHistory() {
  historyList.innerHTML = "";

  history.forEach((item) => {
    const li = document.createElement("li");

    const status =
      item.success !== undefined
        ? item.success
          ? "Geschafft"
          : "Nicht geschafft"
        : "";

    const statusDisplay = status ? ` - ${status}` : "";

    li.innerHTML = `<strong>${item.username || "Unbekannt"}</strong> - ${item.diceType}: ${item.result}${statusDisplay}`;

    if (item.success === true) {
      li.style.background = "#d4edda";
      li.style.color = "#267326";
    } else if (item.success === false) {
      li.style.background = "#f8d7da";
      li.style.color = "#a13b3b";
    }

    historyList.appendChild(li);
  });
}

// ROLL
function rollDice() {
  const diceType = diceTypeSelect.value;
  const diceArray = diceData[diceType];

  const rolled = diceArray[Math.floor(Math.random() * diceArray.length)];

  currentResultImg.src = rolled.url;
  currentResultImg.alt = `Würfelergebnis: ${rolled.name || rolled.num}`;

  const attributeValue = Number(attrValueInput.value) || 0;
  const bonusValue = Number(bonusValueInput.value) || 0;

  let diceRollValue = diceType === "d2" ? (rolled.name === "Ja" ? 1 : 0) : rolled.num;

  const difficultyValue = Number(difficultyValueInput.value) || 0;
  const totalValue = attributeValue + bonusValue + diceRollValue;

  const success = totalValue >= difficultyValue;

  checkResultEl.textContent = success ? "Geschafft" : "Nicht geschafft";
  checkResultEl.style.color = success ? "#267326" : "#a13b3b";

  const username = usernameInput.value.trim() || "Unbekannt";

  if (isConnected) {
    socket.emit("dice-roll", {
      diceType,
      result: diceRollValue,
      success
    });
  } else {
    history.unshift({
      diceType,
      result: diceRollValue,
      username,
      success,
      timestamp: new Date().toLocaleTimeString()
    });

    if (history.length > 8) history.pop();
    renderHistory();
  }
}

// PLAYER LIST
function updatePlayersList(players) {
  const el = document.getElementById("players-list");
  if (!el) return;

  el.innerHTML = "";

  players.forEach((p) => {
    const span = document.createElement("span");

    span.textContent = p;

    span.style.cssText = `
      background:#e9ddff;
      padding:0.3rem 0.6rem;
      border-radius:8px;
      margin:0.2rem;
      display:inline-block;
      font-size:0.9rem;
      color:#6a4e95;
    `;

    el.appendChild(span);
  });
}

// NOTIFICATION
function showRollNotification(rollInfo) {
  const statusText = rollInfo.success ? "Geschafft" : "Nicht geschafft";
  const emoji = rollInfo.success ? "✅" : "❌";

  console.log(
    `🎲 ${rollInfo.username} rolled ${rollInfo.diceType}: ${rollInfo.result} - ${statusText} ${emoji}`
  );
}

// BUTTON
rollBtn.addEventListener("click", rollDice);

renderHistory();
