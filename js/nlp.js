/**
 * nlp.js
 * ------
 * A lightweight, rule-based "NLP" layer.
 *
 * Real NLP (spaCy, Dialogflow, an LLM, etc.) would understand meaning.
 * Here, we approximate "understanding" with a set of regex patterns that
 * cover the phrasings the assignment lists. This is the standard approach
 * for small voice-assistant demos when you don't want to pay for / depend
 * on a cloud NLU service. It's fully explained in the README as a
 * documented trade-off (see "Approach" section).
 *
 * parseCommand(text) -> {
 *   intent: 'ADD' | 'REMOVE' | 'SEARCH' | 'UNKNOWN',
 *   item: string | null,
 *   quantity: number,
 *   priceMax: number | null,
 * }
 */

function parseCommand(rawText) {
  const text = rawText.trim().toLowerCase();

  // --- 1. Try REMOVE intent first (so "remove milk" isn't caught by ADD) ---
  const removePatterns = [
    /^(?:remove|delete|take off|take .+ off (?:my|the) list)\s+(.+?)(?:\s+from (?:my|the) list)?$/i,
  ];
  for (const pattern of removePatterns) {
    const match = text.match(pattern);
    if (match) {
      const { item, quantity } = extractQuantityAndItem(match[1]);
      return { intent: "REMOVE", item, quantity, priceMax: null };
    }
  }

  // --- 2. SEARCH intent ---
  const searchPatterns = [
    /^(?:find|search for|search|look for|show me)\s+(.+)/i,
  ];
  for (const pattern of searchPatterns) {
    const match = text.match(pattern);
    if (match) {
      const priceMax = extractPriceMax(match[1]);
      const cleanedItem = match[1]
        .replace(/(under|below|less than)\s*\$?\d+(\.\d+)?/i, "")
        .replace(/\borganic\b/i, "")
        .trim();
      return { intent: "SEARCH", item: cleanedItem, quantity: 1, priceMax };
    }
  }

  // --- 3. ADD intent (broadest — checked after the more specific ones) ---
  const addPatterns = [
    /^(?:add|i need|i want to buy|i want|buy|get me|get|put)\s+(.+)/i,
  ];
  for (const pattern of addPatterns) {
    const match = text.match(pattern);
    if (match) {
      const { item, quantity } = extractQuantityAndItem(match[1]);
      return { intent: "ADD", item, quantity, priceMax: null };
    }
  }

  // --- 4. Fallback: nothing matched a known pattern ---
  return { intent: "UNKNOWN", item: text, quantity: 1, priceMax: null };
}

// Pulls a leading quantity ("2 bottles of water" -> qty 2, item "water")
// and strips filler words like "to my list", "of", unit words, etc.
function extractQuantityAndItem(phrase) {
  let text = phrase.trim();
  let quantity = 1;

  const qtyMatch = text.match(/^(\d+)\s*(bottles?|kgs?|kilograms?|liters?|litres?|dozen|packs?|cans?)?\s*(of)?\s*/i);
  if (qtyMatch) {
    quantity = parseInt(qtyMatch[1], 10);
    text = text.slice(qtyMatch[0].length);
  }

  text = text
    .replace(/\bto (my|the) list\b/gi, "")
    .replace(/\bon (my|the) list\b/gi, "")
    .trim();

  return { item: capitalizeWords(text), quantity };
}

function extractPriceMax(phrase) {
  const match = phrase.match(/(?:under|below|less than)\s*\$?(\d+(\.\d+)?)/i);
  return match ? parseFloat(match[1]) : null;
}

function capitalizeWords(str) {
  return str
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Matches a free-text item name against the catalog using the synonym
// lists in data.js. Returns the best-matching product object or null.
function matchProduct(itemText) {
  if (!itemText) return null;
  const needle = itemText.toLowerCase().trim();

  // Exact synonym match first
  for (const product of PRODUCT_CATALOG) {
    if (product.synonyms.some((s) => s === needle)) return product;
  }
  // Partial / contains match next
  for (const product of PRODUCT_CATALOG) {
    if (product.synonyms.some((s) => needle.includes(s) || s.includes(needle))) {
      return product;
    }
  }
  return null;
}
