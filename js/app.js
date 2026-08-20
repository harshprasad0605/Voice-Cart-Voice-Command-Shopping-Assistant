/**
 * app.js
 * ------
 * Wires everything together:
 *  - Web Speech API for voice input (speech-to-text) and voice feedback (text-to-speech)
 *  - nlp.js to turn recognized text into a structured command
 *  - data.js as the product catalog
 *  - localStorage as a tiny persistent "database" for the list + purchase history
 */

// ---------- State ----------
let shoppingList = JSON.parse(localStorage.getItem("shoppingList") || "[]");
let purchaseHistory = JSON.parse(localStorage.getItem("purchaseHistory") || "{}"); // { itemName: timesAdded }
let recognition = null;
let isListening = false;

// ---------- DOM references ----------
const micBtn = document.getElementById("micBtn");
const transcriptEl = document.getElementById("transcript");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("shoppingList");
const suggestionsEl = document.getElementById("suggestions");
const searchResultsEl = document.getElementById("searchResults");
const langSelect = document.getElementById("langSelect");
const manualForm = document.getElementById("manualForm");
const manualInput = document.getElementById("manualInput");
const toastEl = document.getElementById("toast");

// ---------- Setup ----------
function init() {
  populateLanguages();
  setupSpeechRecognition();
  renderList();
  renderSuggestions();
  manualForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = manualInput.value.trim();
    if (text) {
      handleRecognizedText(text);
      manualInput.value = "";
    }
  });
}

function populateLanguages() {
  SUPPORTED_LANGUAGES.forEach(({ code, label }) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = label;
    langSelect.appendChild(opt);
  });
}

// ---------- Speech recognition (Voice Input) ----------
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    statusEl.textContent = "Voice recognition isn't supported in this browser. Try Chrome, or use the text box below.";
    micBtn.disabled = true;
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = langSelect.value || "en-US";

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add("listening");
    statusEl.textContent = "Listening...";
  };

  recognition.onresult = (event) => {
    let interim = "";
    let final = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += chunk;
      else interim += chunk;
    }
    transcriptEl.textContent = final || interim;
    if (final) handleRecognizedText(final);
  };

  recognition.onerror = (event) => {
    statusEl.textContent = `Mic error: ${event.error}. Try again or use the text box.`;
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove("listening");
    statusEl.textContent = "Tap the mic and speak, or type a command below.";
  };

  micBtn.addEventListener("click", () => {
    if (isListening) {
      recognition.stop();
      return;
    }
    recognition.lang = langSelect.value;
    transcriptEl.textContent = "";
    recognition.start();
  });

  langSelect.addEventListener("change", () => {
    if (recognition) recognition.lang = langSelect.value;
  });
}

// Optional voice feedback (Text-to-Speech) for confirmations.
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = langSelect.value || "en-US";
  window.speechSynthesis.speak(utter);
}

// ---------- Command handling ----------
function handleRecognizedText(text) {
  transcriptEl.textContent = text;
  const command = parseCommand(text);

  switch (command.intent) {
    case "ADD":
      addItem(command.item, command.quantity);
      break;
    case "REMOVE":
      removeItem(command.item);
      break;
    case "SEARCH":
      searchCatalog(command.item, command.priceMax);
      break;
    default:
      showToast(`Sorry, I didn't understand: "${text}"`);
      speak("Sorry, I didn't catch that.");
  }
}

// ---------- Shopping list actions ----------
function addItem(itemName, quantity) {
  if (!itemName) return;
  const product = matchProduct(itemName);
  const finalName = product ? product.name : itemName;
  const category = product ? product.category : "Other";

  const existing = shoppingList.find((i) => i.name.toLowerCase() === finalName.toLowerCase());
  if (existing) {
    existing.quantity += quantity;
  } else {
    shoppingList.push({ name: finalName, quantity, category });
  }

  // Track history for "smart suggestions" (frequency-based)
  purchaseHistory[finalName] = (purchaseHistory[finalName] || 0) + 1;

  persist();
  renderList();
  renderSuggestions();
  showToast(`Added ${quantity} × ${finalName} (${category})`);
  speak(`Added ${quantity} ${finalName}`);

  // Substitute suggestion, if applicable
  const key = finalName.toLowerCase();
  if (SUBSTITUTES[key]) {
    showToast(`Tip: ${SUBSTITUTES[key].join(" or ")} are good substitutes for ${finalName}.`, true);
  }
}

function removeItem(itemName) {
  const product = matchProduct(itemName);
  const nameToMatch = (product ? product.name : itemName).toLowerCase();
  const before = shoppingList.length;
  shoppingList = shoppingList.filter((i) => i.name.toLowerCase() !== nameToMatch);

  if (shoppingList.length < before) {
    persist();
    renderList();
    showToast(`Removed ${product ? product.name : itemName} from your list.`);
    speak(`Removed ${itemName}`);
  } else {
    showToast(`"${itemName}" wasn't on your list.`);
  }
}

function changeQuantity(name, delta) {
  const item = shoppingList.find((i) => i.name === name);
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  persist();
  renderList();
}

function deleteItem(name) {
  shoppingList = shoppingList.filter((i) => i.name !== name);
  persist();
  renderList();
}

function persist() {
  localStorage.setItem("shoppingList", JSON.stringify(shoppingList));
  localStorage.setItem("purchaseHistory", JSON.stringify(purchaseHistory));
}

// ---------- Voice-activated search ----------
function searchCatalog(query, priceMax) {
  const needle = (query || "").toLowerCase().trim();
  let results = PRODUCT_CATALOG.filter((p) =>
    p.synonyms.some((s) => s.includes(needle) || needle.includes(s)) ||
    p.name.toLowerCase().includes(needle) ||
    p.brand.toLowerCase().includes(needle)
  );
  if (priceMax !== null) {
    results = results.filter((p) => p.price <= priceMax);
  }
  renderSearchResults(results, query, priceMax);
}

// ---------- Rendering ----------
function renderList() {
  listEl.innerHTML = "";
  if (shoppingList.length === 0) {
    listEl.innerHTML = `<li class="empty">Your list is empty. Try saying "Add milk".</li>`;
    return;
  }

  // Group by category for the "automatically categorize items" requirement
  const grouped = {};
  shoppingList.forEach((item) => {
    grouped[item.category] = grouped[item.category] || [];
    grouped[item.category].push(item);
  });

  Object.keys(grouped).sort().forEach((category) => {
    const header = document.createElement("li");
    header.className = "category-header";
    header.textContent = category;
    listEl.appendChild(header);

    grouped[category].forEach((item) => {
      const li = document.createElement("li");
      li.className = "list-item";
      li.innerHTML = `
        <span class="item-name">${item.name}</span>
        <div class="item-controls">
          <button aria-label="decrease" onclick="changeQuantity('${item.name}', -1)">−</button>
          <span class="qty">${item.quantity}</span>
          <button aria-label="increase" onclick="changeQuantity('${item.name}', 1)">+</button>
          <button aria-label="delete" class="delete-btn" onclick="deleteItem('${item.name}')">✕</button>
        </div>
      `;
      listEl.appendChild(li);
    });
  });
}

function renderSuggestions() {
  suggestionsEl.innerHTML = "";

  // 1. Frequency-based "running low" suggestions: items bought often
  //    before, but not currently on the list.
  const currentNames = new Set(shoppingList.map((i) => i.name));
  const frequent = Object.entries(purchaseHistory)
    .filter(([name, count]) => count >= 2 && !currentNames.has(name))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  frequent.forEach((name) => addSuggestionChip(`It looks like you're running low on ${name}`, name));

  // 2. Seasonal suggestions
  const season = getCurrentSeason();
  SEASONAL_ITEMS[season].forEach((name) => {
    if (!currentNames.has(name)) {
      addSuggestionChip(`${name} is in season right now`, name);
    }
  });

  if (!suggestionsEl.children.length) {
    suggestionsEl.innerHTML = `<p class="empty">Suggestions will appear here as you shop.</p>`;
  }
}

function addSuggestionChip(label, itemName) {
  const chip = document.createElement("button");
  chip.className = "chip";
  chip.textContent = `+ ${label}`;
  chip.onclick = () => addItem(itemName, 1);
  suggestionsEl.appendChild(chip);
}

function renderSearchResults(results, query, priceMax) {
  searchResultsEl.innerHTML = "";
  const heading = document.createElement("p");
  heading.className = "search-heading";
  heading.textContent = priceMax
    ? `Results for "${query}" under $${priceMax}:`
    : `Results for "${query}":`;
  searchResultsEl.appendChild(heading);

  if (results.length === 0) {
    searchResultsEl.innerHTML += `<p class="empty">No matching products found.</p>`;
    return;
  }

  results.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div>
        <strong>${p.name}</strong> <span class="muted">(${p.brand})</span><br/>
        <span class="muted">${p.category} · $${p.price.toFixed(2)}</span>
      </div>
      <button onclick="addItem('${p.name}', 1)">Add</button>
    `;
    searchResultsEl.appendChild(card);
  });
}

// ---------- Toast (visual feedback) ----------
let toastTimer = null;
function showToast(message, isTip = false) {
  toastEl.textContent = message;
  toastEl.className = isTip ? "toast tip show" : "toast show";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.className = toastEl.className.replace("show", "");
  }, 3200);
}

document.addEventListener("DOMContentLoaded", init);
