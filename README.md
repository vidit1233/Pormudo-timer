# Pomodoro Timer

A focus timer with focus/break sessions, ambient sounds, and a draggable UI.

---

## As a Chrome extension

You can run the timer as a browser extension (popup when you click the icon).

### 1. Build the extension

```bash
npm run build:extension
```

This runs `vite build` and copies `manifest.json` into `dist/`. The **dist** folder is your extension package.

### 2. Load it in Chrome

1. Open Chrome and go to **Extensions** → **Manage extensions** (or `chrome://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked**.
4. Choose the **dist** folder inside this project.

The Pomodoro Timer icon will appear in the toolbar. Click it to open the timer in a popup.

### 3. (Optional) Add an icon

To set a custom icon, add PNGs to `dist/icons/` after building:

- `icon16.png` — 16×16
- `icon48.png` — 48×48  
- `icon128.png` — 128×128

Then add this to `dist/manifest.json` before loading the extension:

```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

---

## Local development (web app)

```bash
npm run dev
```

Open `http://localhost:5173` to use the timer in the browser.

---

# React + Vite (template notes)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
