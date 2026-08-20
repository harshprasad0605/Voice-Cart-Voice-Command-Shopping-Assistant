# Voice Cart — Voice Command Shopping Assistant

A shopping list you talk to. Say "add milk" and it gets added. Say "got the milk" while you're actually in the store and it gets checked off. Built for the Voice Command Shopping Assistant assessment.

Live demo: https://voice-shopping-assistant-ed788.web.app/

## Approach

This is a plain HTML/CSS/JavaScript site — no backend, no framework, no paid APIs. Voice input runs on the browser's built-in Web Speech API, so there's nothing to configure and no service to pay for. Once speech is converted to text, a small set of regex patterns (in `nlp.js`) figures out what the user meant — add, remove, check off, search, or set a budget — and pulls out quantities and prices from the sentence. Items are matched against a small product list and sorted into categories automatically.

Smart suggestions come from two simple rules: items bought more than once but missing from the current list ("running low"), and a static seasonal list by month. Substitutes use a small lookup table (milk → almond/oat milk). The list, purchase history, and budget are saved in the browser's localStorage, so nothing is lost between visits, without needing a real database.

## Features

* Add, remove, and search items by voice or by typing
* Understands different phrasings ("add milk" / "I need milk" / "I want to buy milk")
* Picks up quantities ("2 bottles of water") and price filters ("under $5")
* Auto-categorizes items (dairy, produce, pantry, etc.)
* Suggests items you're likely low on, based on past additions
* Suggests what's in season
* Suggests substitutes for common items
* Check items off while shopping without deleting them
* Optional budget tracker with a running total
* Undo for the last action
* A log of everything said, so you can see how it was interpreted
* Works in multiple languages (English, Hindi, Spanish, French)
* Falls back to a text box if voice isn't supported

## Limitations

* Voice recognition supports multiple languages, but the command parser currently only understands English phrasing.
* The product catalog and seasonal list are small hand-written samples, not a real inventory feed.
* Voice input works best in Chrome or Edge. Safari/iOS support is limited, which is why the text box exists as a fallback.

## Running it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000

(Voice input needs http/https, not a plain double-clicked file, so use the local server above rather than opening index.html directly.)

## Deploying

**GitHub Pages**
Push this folder to a public repo on the `main` branch, then go to Settings → Pages and set the source to `main`. It'll be live at `https://<username>.github.io/<repo>/`.

**Firebase Hosting**

```
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Files

```
index.html      the page
css/style.css   styling
js/data.js      product catalog, substitutes, seasonal items
js/nlp.js       turns spoken text into an action + item + quantity + price
js/app.js       speech recognition, list logic, localStorage
```



