/**
 * data.js
 * -------
 * Static "database" for the app. In a real product this would live in a
 * backend + real DB. For an 8-hour assessment, an in-memory catalog is
 * enough to prove out the logic and keeps the whole app deployable as a
 * free static site (no server, no cost).
 */

// A small mock product catalog: name, category, brand, price ($), and
// keywords/synonyms that voice commands might use to refer to the item.
const PRODUCT_CATALOG = [
  { name: "Milk", category: "Dairy", brand: "DairyPure", price: 3.5, synonyms: ["milk"] },
  { name: "Almond Milk", category: "Dairy Alternative", brand: "Silk", price: 4.2, synonyms: ["almond milk"] },
  { name: "Oat Milk", category: "Dairy Alternative", brand: "Oatly", price: 4.5, synonyms: ["oat milk"] },
  { name: "Bread", category: "Bakery", brand: "Wonder", price: 2.8, synonyms: ["bread"] },
  { name: "Gluten-Free Bread", category: "Bakery", brand: "Udi's", price: 5.0, synonyms: ["gluten free bread", "gluten-free bread"] },
  { name: "Apples", category: "Produce", brand: "Local Farms", price: 1.2, synonyms: ["apple", "apples", "organic apples"] },
  { name: "Bananas", category: "Produce", brand: "Chiquita", price: 0.6, synonyms: ["banana", "bananas"] },
  { name: "Oranges", category: "Produce", brand: "Sunkist", price: 0.9, synonyms: ["orange", "oranges"] },
  { name: "Watermelon", category: "Produce", brand: "Local Farms", price: 6.0, synonyms: ["watermelon"] },
  { name: "Mangoes", category: "Produce", brand: "Local Farms", price: 2.0, synonyms: ["mango", "mangoes"] },
  { name: "Water", category: "Beverages", brand: "Aquafina", price: 1.0, synonyms: ["water", "bottled water"] },
  { name: "Toothpaste", category: "Personal Care", brand: "Colgate", price: 3.2, synonyms: ["toothpaste"] },
  { name: "Sugar", category: "Pantry", brand: "Domino", price: 2.5, synonyms: ["sugar"] },
  { name: "Honey", category: "Pantry", brand: "Nature Nate's", price: 6.5, synonyms: ["honey"] },
  { name: "Butter", category: "Dairy", brand: "Land O'Lakes", price: 4.0, synonyms: ["butter"] },
  { name: "Margarine", category: "Dairy Alternative", brand: "Country Crock", price: 3.0, synonyms: ["margarine"] },
  { name: "Eggs", category: "Dairy", brand: "Happy Farms", price: 3.8, synonyms: ["egg", "eggs"] },
  { name: "Chicken Breast", category: "Meat", brand: "Perdue", price: 7.5, synonyms: ["chicken", "chicken breast"] },
  { name: "Rice", category: "Pantry", brand: "Uncle Ben's", price: 5.5, synonyms: ["rice"] },
  { name: "Soup Mix", category: "Pantry", brand: "Knorr", price: 1.8, synonyms: ["soup", "soup mix"] },
];

// If a user asks for an item that's "unavailable" (simulated) or mentions
// a common substitution trigger, suggest these alternatives.
const SUBSTITUTES = {
  "milk": ["Almond Milk", "Oat Milk"],
  "bread": ["Gluten-Free Bread"],
  "sugar": ["Honey"],
  "butter": ["Margarine"],
};

// Very simple seasonal logic keyed by month (0 = Jan ... 11 = Dec).
// In production you'd pull this from a real seasonal-produce API.
const SEASONAL_ITEMS = {
  winter: ["Oranges", "Soup Mix"],       // Dec, Jan, Feb
  spring: ["Apples", "Honey"],           // Mar, Apr, May
  summer: ["Watermelon", "Mangoes", "Water"], // Jun, Jul, Aug
  autumn: ["Bananas", "Rice"],           // Sep, Oct, Nov
};

function getCurrentSeason() {
  const month = new Date().getMonth(); // 0-11
  if ([11, 0, 1].includes(month)) return "winter";
  if ([2, 3, 4].includes(month)) return "spring";
  if ([5, 6, 7].includes(month)) return "summer";
  return "autumn";
}

// Language codes offered in the UI dropdown for the Web Speech API.
const SUPPORTED_LANGUAGES = [
  { code: "en-US", label: "English (US)" },
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
];
