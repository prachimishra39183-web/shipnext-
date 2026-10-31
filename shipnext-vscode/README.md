# ShipNext — VS Code project

## Run locally
1. Install Node.js (LTS) if it is not already installed.
2. Open this folder in VS Code.
3. Open Terminal → New Terminal.
4. Run `npm install`
5. Run `npm run dev`
6. Open the local URL printed in the terminal.

## Current file layout
- `index.html` — page shell and font imports.
- `src/styles.css` — extracted CSS and visual styles.
- `src/main.js` — existing compiled/bundled React application code.

## Important note
The uploaded HTML contains a production-bundled React application, not the original readable React source files. CSS and HTML have been separated, and the site code is preserved in `src/main.js` so it can run locally. That JavaScript is still bundled/minified and its original individual components cannot be reliably reconstructed from the bundle alone. For clean editing by section (Navbar, Hero, tracking, booking, dashboard, etc.), the original source project or its source maps would be needed; otherwise the components must be rebuilt/refactored from the rendered behavior.
