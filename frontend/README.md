# HeyJarvis Chrome Extension

Chrome Extension (Manifest V3) for HeyJarvis with React + TypeScript.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Development:**
   ```bash
   npm run dev
   ```
   This will watch for changes and rebuild automatically.

3. **Build:**
   ```bash
   npm run build
   ```

## Loading the Extension

1. Build the extension: `npm run build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `frontend/dist` folder

## Features

- **Connect Google**: Opens OAuth flow and automatically captures JWT token
- **Connection Status**: Shows connected user email/name
- **Dry-run Delete**: Tests deleting today's emails without actually deleting
- **Disconnect**: Clears stored JWT token

## Project Structure

```
frontend/
├── src/
│   ├── background.ts          # Service worker for OAuth token capture
│   └── popup/
│       ├── Popup.tsx          # Main React popup component
│       ├── api.ts             # API calls to backend
│       └── storage.ts         # Chrome storage utilities
├── public/
│   ├── manifest.json          # Extension manifest
│   └── popup.html             # Popup HTML
├── vite.config.ts             # Vite configuration
└── package.json
```

## Backend Requirements

Make sure the backend is running on `http://localhost:4000` before using the extension.


